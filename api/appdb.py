# -*- coding: utf-8 -*-
"""
ユーザー＆セッション管理 (MySQL / PyMySQL)  — 共有レンタルサーバ(CGI)版

PyMySQL は純Pythonのため FreeBSD でも動作する(ネイティブ依存なし)。
CGI はリクエスト毎にプロセスが起動するため、セッションは DB に保存する。

DB接続情報は同ディレクトリの config.py(任意) または環境変数で指定:
  DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
"""
import hashlib
import hmac
import os
import secrets

import pymysql

try:
    import config  # config.py(任意)
except Exception:
    config = None


def _cfg(key, default):
    if config is not None and hasattr(config, key):
        return getattr(config, key)
    return os.environ.get(key, default)


DB_HOST = _cfg("DB_HOST", "127.0.0.1")
DB_PORT = int(_cfg("DB_PORT", "3306"))
DB_USER = _cfg("DB_USER", "mamas")
DB_PASSWORD = _cfg("DB_PASSWORD", "")
DB_NAME = _cfg("DB_NAME", "kozu_color")

_PBKDF2_ITERS = 200_000


# ---- パスワードハッシュ(PBKDF2-HMAC-SHA256) ----
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ITERS)
    return f"pbkdf2_sha256${_PBKDF2_ITERS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters, salt_hex, hash_hex = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"),
                                 bytes.fromhex(salt_hex), int(iters))
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


def _connect(with_db=True):
    return pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD,
        database=DB_NAME if with_db else None,
        charset="utf8mb4", autocommit=True, connect_timeout=5,
        cursorclass=pymysql.cursors.DictCursor)


# サブスク用に users へ追加するカラム(既存DBにも後付けマイグレーション)
_USER_COLUMNS = [
    ("email", "VARCHAR(255) NULL"),
    ("is_admin", "TINYINT NOT NULL DEFAULT 0"),
    ("stripe_customer_id", "VARCHAR(64) NULL"),
    ("stripe_subscription_id", "VARCHAR(64) NULL"),
    ("sub_status", "VARCHAR(32) NOT NULL DEFAULT 'none'"),
    ("current_period_end", "DATETIME NULL"),
]
# 有効な購読とみなすステータス(Stripe)
ACTIVE_STATUSES = ("active", "trialing")


def _ensure_columns(cur):
    """users テーブルに不足しているサブスク用カラムを追加する。"""
    cur.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA=%s AND TABLE_NAME='users'", (DB_NAME,))
    existing = {r["COLUMN_NAME"] for r in cur.fetchall()}
    for name, ddl in _USER_COLUMNS:
        if name not in existing:
            cur.execute(f"ALTER TABLE users ADD COLUMN {name} {ddl}")
    # stripe_customer_id の索引(Webhookでの逆引き用)。MySQL は CREATE INDEX IF NOT EXISTS 非対応なので存在確認。
    cur.execute("SELECT 1 FROM information_schema.STATISTICS "
                "WHERE TABLE_SCHEMA=%s AND TABLE_NAME='users' AND INDEX_NAME='idx_customer'", (DB_NAME,))
    if cur.fetchone() is None:
        try:
            cur.execute("CREATE INDEX idx_customer ON users (stripe_customer_id)")
        except Exception:
            pass


def init_db():
    con = _connect(with_db=False)
    try:
        with con.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` "
                        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            cur.execute(f"USE `{DB_NAME}`")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  username VARCHAR(64) NOT NULL UNIQUE,
                  password_hash VARCHAR(255) NOT NULL,
                  email VARCHAR(255) NULL,
                  is_admin TINYINT NOT NULL DEFAULT 0,
                  stripe_customer_id VARCHAR(64) NULL,
                  stripe_subscription_id VARCHAR(64) NULL,
                  sub_status VARCHAR(32) NOT NULL DEFAULT 'none',
                  current_period_end DATETIME NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  last_login TIMESTAMP NULL DEFAULT NULL
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                  token VARCHAR(64) PRIMARY KEY,
                  username VARCHAR(64) NOT NULL,
                  expires_at DATETIME NOT NULL,
                  INDEX (expires_at)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""")
            _ensure_inquiries(cur)
            _ensure_login_logs(cur)
            _ensure_access_logs(cur)
            try:
                _ensure_columns(cur)   # 既存DBへの後付け(CREATE IF NOT EXISTS INDEX 非対応MySQLは無視)
            except Exception:
                pass
    finally:
        con.close()


# ---- ユーザー ----
def create_user(username, password):
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("INSERT INTO users (username, password_hash) VALUES (%s,%s)",
                        (username, hash_password(password)))
    finally:
        con.close()


def user_exists(username):
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("SELECT 1 FROM users WHERE username=%s", (username,))
            return cur.fetchone() is not None
    finally:
        con.close()


def set_password(username, password):
    con = _connect()
    try:
        with con.cursor() as cur:
            return cur.execute("UPDATE users SET password_hash=%s WHERE username=%s",
                               (hash_password(password), username)) > 0
    finally:
        con.close()


def delete_user(username):
    con = _connect()
    try:
        with con.cursor() as cur:
            return cur.execute("DELETE FROM users WHERE username=%s", (username,)) > 0
    finally:
        con.close()


def list_users():
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("SELECT id, username, email, is_admin, sub_status, "
                        "current_period_end, stripe_customer_id, created_at, last_login "
                        "FROM users ORDER BY id")
            return cur.fetchall()
    finally:
        con.close()


# ---- サブスク / 管理 ----
def get_user(username):
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("SELECT id, username, email, is_admin, stripe_customer_id, "
                        "stripe_subscription_id, sub_status, current_period_end, "
                        "created_at, last_login FROM users WHERE username=%s", (username,))
            return cur.fetchone()
    finally:
        con.close()


def is_admin(username):
    u = get_user(username)
    return bool(u and u.get("is_admin"))


def is_active(username):
    """有効な購読(active/trialing)を持つか。"""
    u = get_user(username)
    return bool(u and u.get("sub_status") in ACTIVE_STATUSES)


def set_email(username, email):
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("UPDATE users SET email=%s WHERE username=%s", (email, username))
    finally:
        con.close()


def set_admin(username, flag):
    con = _connect()
    try:
        with con.cursor() as cur:
            return cur.execute("UPDATE users SET is_admin=%s WHERE username=%s",
                               (1 if flag else 0, username)) > 0
    finally:
        con.close()


def set_customer(username, customer_id):
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("UPDATE users SET stripe_customer_id=%s WHERE username=%s",
                        (customer_id, username))
    finally:
        con.close()


def find_by_customer(customer_id):
    if not customer_id:
        return None
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("SELECT username FROM users WHERE stripe_customer_id=%s", (customer_id,))
            row = cur.fetchone()
            return row["username"] if row else None
    finally:
        con.close()


def update_subscription(username, sub_id, status, period_end_epoch=None):
    """購読情報を更新。period_end_epoch は Unix 秒(任意)。"""
    con = _connect()
    try:
        with con.cursor() as cur:
            if period_end_epoch:
                cur.execute("UPDATE users SET stripe_subscription_id=%s, sub_status=%s, "
                            "current_period_end=FROM_UNIXTIME(%s) WHERE username=%s",
                            (sub_id, status, int(period_end_epoch), username))
            else:
                cur.execute("UPDATE users SET stripe_subscription_id=%s, sub_status=%s "
                            "WHERE username=%s", (sub_id, status, username))
    finally:
        con.close()


def count_users():
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM users")
            return cur.fetchone()["n"]
    finally:
        con.close()


def verify_user(username, password):
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("SELECT password_hash FROM users WHERE username=%s", (username,))
            row = cur.fetchone()
            if not row or not verify_password(password, row["password_hash"]):
                return False
            cur.execute("UPDATE users SET last_login=NOW() WHERE username=%s", (username,))
            return True
    finally:
        con.close()


# ---- セッション(DB保存) ----
def create_session(username, ttl_sec, single_session=True):
    """セッションを発行。single_session=True なら、その利用者の既存セッションを破棄して
    1アカウント1セッションにする(別端末は無効化＝二重ログイン防止)。"""
    token = secrets.token_urlsafe(32)
    con = _connect()
    try:
        with con.cursor() as cur:
            if single_session:
                cur.execute("DELETE FROM sessions WHERE username=%s", (username,))
            cur.execute("INSERT INTO sessions (token, username, expires_at) "
                        "VALUES (%s,%s, DATE_ADD(NOW(), INTERVAL %s SECOND))",
                        (token, username, int(ttl_sec)))
    finally:
        con.close()
    return token


def get_session(token):
    """有効なら (username, 残り秒) を返す。無効/期限切れは (None, None)。"""
    if not token:
        return None, None
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("SELECT username, TIMESTAMPDIFF(SECOND, NOW(), expires_at) AS remain "
                        "FROM sessions WHERE token=%s", (token,))
            row = cur.fetchone()
            if not row or row["remain"] is None or row["remain"] <= 0:
                if row:
                    cur.execute("DELETE FROM sessions WHERE token=%s", (token,))
                return None, None
            return row["username"], int(row["remain"])
    finally:
        con.close()


def delete_session(token):
    if not token:
        return
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("DELETE FROM sessions WHERE token=%s", (token,))
    finally:
        con.close()


def cleanup_sessions():
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("DELETE FROM sessions WHERE expires_at < NOW()")
    finally:
        con.close()


# ---- お問い合わせ(inquiries) ----
def _ensure_inquiries(cur):
    """お問い合わせテーブルを用意(無ければ作成)。init_db でも各操作でも呼ぶ。"""
    cur.execute("""
        CREATE TABLE IF NOT EXISTS inquiries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(64) NULL,
          email VARCHAR(255) NULL,
          subject VARCHAR(255) NULL,
          message TEXT NOT NULL,
          handled TINYINT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (created_at)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""")


def create_inquiry(username, email, subject, message):
    """お問い合わせを保存し、採番IDを返す。"""
    con = _connect()
    try:
        with con.cursor() as cur:
            _ensure_inquiries(cur)
            cur.execute("INSERT INTO inquiries (username, email, subject, message) "
                        "VALUES (%s,%s,%s,%s)", (username, email, subject, message))
            return cur.lastrowid
    finally:
        con.close()


def list_inquiries(limit=200):
    con = _connect()
    try:
        with con.cursor() as cur:
            _ensure_inquiries(cur)
            cur.execute("SELECT id, username, email, subject, message, handled, created_at "
                        "FROM inquiries ORDER BY id DESC LIMIT %s", (int(limit),))
            return cur.fetchall()
    finally:
        con.close()


def set_inquiry_handled(inquiry_id, handled=True):
    con = _connect()
    try:
        with con.cursor() as cur:
            return cur.execute("UPDATE inquiries SET handled=%s WHERE id=%s",
                               (1 if handled else 0, int(inquiry_id))) > 0
    finally:
        con.close()


def delete_inquiry(inquiry_id):
    con = _connect()
    try:
        with con.cursor() as cur:
            return cur.execute("DELETE FROM inquiries WHERE id=%s", (int(inquiry_id),)) > 0
    finally:
        con.close()


# ---- ログインログ(login_logs) ----
def _ensure_login_logs(cur):
    """ログイン履歴テーブルを用意(無ければ作成)。"""
    cur.execute("""
        CREATE TABLE IF NOT EXISTS login_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(64) NULL,
          ip VARCHAR(64) NULL,
          user_agent VARCHAR(255) NULL,
          success TINYINT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (created_at),
          INDEX (username)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""")


def add_login_log(username, ip=None, user_agent=None, success=True):
    """ログイン試行を記録(ベストエフォート: 失敗してもログイン処理は妨げない)。"""
    try:
        con = _connect()
        try:
            with con.cursor() as cur:
                _ensure_login_logs(cur)
                cur.execute("INSERT INTO login_logs (username, ip, user_agent, success) "
                            "VALUES (%s,%s,%s,%s)",
                            ((username or "")[:64] or None, (ip or "")[:64] or None,
                             (user_agent or "")[:255] or None, 1 if success else 0))
        finally:
            con.close()
    except Exception:
        pass


def list_login_logs(limit=300):
    con = _connect()
    try:
        with con.cursor() as cur:
            _ensure_login_logs(cur)
            cur.execute("SELECT id, username, ip, user_agent, success, created_at "
                        "FROM login_logs ORDER BY id DESC LIMIT %s", (int(limit),))
            return cur.fetchall()
    finally:
        con.close()


def cleanup_login_logs(keep_days=180):
    """古いログイン履歴を削除(任意・保守用)。"""
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("DELETE FROM login_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL %s DAY)",
                        (int(keep_days),))
    finally:
        con.close()


# ---- ページアクセスログ(access_logs) : login.html 等の静的ページ閲覧をビーコンで記録 ----
def _ensure_access_logs(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS access_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          page VARCHAR(64) NULL,
          ip VARCHAR(64) NULL,
          user_agent VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (created_at),
          INDEX (page)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""")


def add_access_log(page, ip=None, user_agent=None):
    """ページ閲覧を記録(ベストエフォート)。"""
    try:
        con = _connect()
        try:
            with con.cursor() as cur:
                _ensure_access_logs(cur)
                cur.execute("INSERT INTO access_logs (page, ip, user_agent) VALUES (%s,%s,%s)",
                            ((page or "")[:64] or None, (ip or "")[:64] or None,
                             (user_agent or "")[:255] or None))
        finally:
            con.close()
    except Exception:
        pass


def list_access_logs(limit=300):
    con = _connect()
    try:
        with con.cursor() as cur:
            _ensure_access_logs(cur)
            cur.execute("SELECT id, page, ip, user_agent, created_at "
                        "FROM access_logs ORDER BY id DESC LIMIT %s", (int(limit),))
            return cur.fetchall()
    finally:
        con.close()


def cleanup_access_logs(keep_days=180):
    con = _connect()
    try:
        with con.cursor() as cur:
            cur.execute("DELETE FROM access_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL %s DAY)",
                        (int(keep_days),))
    finally:
        con.close()


# ---- 定期メンテナンス用CLI(cronから実行可) ----
# 例(さくら等のcron): cd ~/www/<domain>/rpaint/api && python3 appdb.py cleanup
if __name__ == "__main__":
    import sys as _sys
    _cmd = _sys.argv[1] if len(_sys.argv) > 1 else "cleanup"
    if _cmd in ("cleanup", "cleanup-sessions"):
        cleanup_sessions(); print("sessions cleaned")
    elif _cmd == "cleanup-all":
        cleanup_sessions(); cleanup_login_logs(); cleanup_access_logs(); print("sessions+logs cleaned")
    else:
        print("usage: python3 appdb.py [cleanup|cleanup-all]")
