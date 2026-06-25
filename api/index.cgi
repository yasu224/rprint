#!/usr/local/bin/python3
# -*- coding: utf-8 -*-
"""
認証API (CGI)  — 共有レンタルサーバ(さくら等)向け

ルーティングは PATH_INFO で判定:
  POST /api/login    {username,password}        -> セッションCookie発行
  POST /api/logout                              -> セッション破棄
  GET  /api/me                                  -> 認証状態 {authenticated,user,demo,expires_in}
  POST /api/register {username,password}        -> ユーザー作成

※ さくらの Python パスに合わせて 1 行目の shebang を調整してください
  (例: #!/usr/local/bin/python3.8)。実行権限 755、改行コード LF。
"""
import json
import os
import random
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def _fail(msg):
    """読み込み段階の致命的エラーでも、Apacheの汎用500ではなく原因をJSONで返す。"""
    sys.stdout.write("Status: 500 Internal Server Error\r\n")
    sys.stdout.write("Content-Type: application/json; charset=utf-8\r\n")
    sys.stdout.write("Cache-Control: no-store\r\n\r\n")
    sys.stdout.write(json.dumps({"error": msg}, ensure_ascii=False))
    sys.exit(0)


try:
    import appdb  # noqa: E402
except Exception as e:  # pymysql 未導入 / config 不備など
    _fail("初期化エラー(appdb): " + repr(e))

try:
    import stripe_api  # noqa: E402  (新規ファイル。無くても認証は動くよう任意扱い)
except Exception:
    stripe_api = None

try:
    import mailer  # noqa: E402  (お問い合わせのメール通知用。無くてもDB保存は動くよう任意扱い)
except Exception:
    mailer = None

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

try:
    import config as _config  # config.py(任意)
except Exception:
    _config = None


def _stripe_ok():
    return bool(stripe_api and stripe_api.configured())


def _cfg(key, default):
    if _config is not None and hasattr(_config, key):
        return getattr(_config, key)
    return os.environ.get(key, default)


# ---- 設定 ----  (config.py の値が壊れていても 500 ではなく原因をJSON表示)
try:
    SESSION_TTL = int(float(_cfg("SESSION_TTL_MIN", "120")) * 60)
    DEMO_USERNAMES = {u.strip().lower() for u in str(_cfg("DEMO_USERNAMES", "DEMO")).split(",") if u.strip()}
    DEMO_TTL = int(float(_cfg("DEMO_TTL_MIN", "15")) * 60)
    ALLOW_REGISTRATION = str(_cfg("ALLOW_REGISTRATION", "1")) in ("1", "true", "True")
    SECURE_COOKIE = os.environ.get("HTTPS", "") in ("1", "true", "True", "on")
    # Cookie のパス。サブディレクトリ配置(例 /rpaint/)で他アプリと分離したい場合に指定。
    COOKIE_PATH = os.environ.get("COOKIE_PATH", "/")
    APP_BASE_URL = str(_cfg("APP_BASE_URL", "")).rstrip("/")
    REQUIRE_SUBSCRIPTION = str(_cfg("REQUIRE_SUBSCRIPTION", "1")) in ("1", "true", "True")
    ADMIN_USERNAMES = {u.strip().lower() for u in str(_cfg("ADMIN_USERNAMES", "")).split(",") if u.strip()}
    _USERNAME_RE = re.compile(r"^[A-Za-z0-9_.\-@]{3,64}$")
except Exception as e:
    _fail("設定の読み込みエラー(config.py): " + repr(e))


def is_demo(user):
    return str(user).lower() in DEMO_USERNAMES


def is_admin(user):
    if not user:
        return False
    if str(user).lower() in ADMIN_USERNAMES:
        return True
    try:
        return appdb.is_admin(user)
    except Exception:
        return False


def is_subscribed(user):
    """有効な購読(または管理者・デモ)か。"""
    if not user:
        return False
    if is_admin(user) or is_demo(user):
        return True
    try:
        return appdb.is_active(user)
    except Exception:
        return False


def app_url(path=""):
    base = APP_BASE_URL
    if not base:
        # APP_BASE_URL 未設定時はリクエストから推定
        host = os.environ.get("HTTP_HOST", "")
        scheme = "https" if SECURE_COOKIE else "http"
        script = os.environ.get("SCRIPT_NAME", "/api/index.cgi")
        base = f"{scheme}://{host}" + script.rsplit("/api/", 1)[0]
    return base.rstrip("/") + path


def ttl_for(user):
    return DEMO_TTL if is_demo(user) else SESSION_TTL


# ---- CGI ヘルパー ----
def cookie_token():
    raw = os.environ.get("HTTP_COOKIE", "")
    for part in raw.split(";"):
        if "=" in part:
            k, v = part.strip().split("=", 1)
            if k == "session":
                return v
    return None


def client_ip():
    """リバースプロキシ経由でも実IPを取得(X-Forwarded-For の先頭→REMOTE_ADDR)。"""
    xf = os.environ.get("HTTP_X_FORWARDED_FOR", "")
    if xf:
        return xf.split(",")[0].strip()
    return os.environ.get("REMOTE_ADDR", "")


def client_ua():
    return os.environ.get("HTTP_USER_AGENT", "")


def read_raw():
    try:
        n = int(os.environ.get("CONTENT_LENGTH", "0") or "0")
    except ValueError:
        n = 0
    return sys.stdin.buffer.read(n) if n > 0 else b""


def read_body(raw=None):
    data = read_raw() if raw is None else raw
    try:
        return json.loads(data.decode("utf-8") or "{}")
    except Exception:
        return {}


def respond(status, obj, set_cookie=None):
    out = sys.stdout
    out.write(f"Status: {status}\r\n")
    out.write("Content-Type: application/json; charset=utf-8\r\n")
    out.write("Cache-Control: no-store\r\n")
    if set_cookie is not None:
        out.write("Set-Cookie: " + set_cookie + "\r\n")
    out.write("\r\n")
    out.write(json.dumps(obj, ensure_ascii=False))


def cookie(token, max_age):
    c = f"session={token}; HttpOnly; Path={COOKIE_PATH}; SameSite=Lax; Max-Age={max_age}"
    if SECURE_COOKIE:
        c += "; Secure"
    return c


def route():
    method = os.environ.get("REQUEST_METHOD", "GET").upper()
    path = (os.environ.get("PATH_INFO", "") or "/").rstrip("/") or "/"

    if path == "/me":
        user, remain = appdb.get_session(cookie_token())
        info = {"authenticated": user is not None, "user": user,
                "demo": is_demo(user) if user else False,
                "expires_in": remain,
                "admin": is_admin(user) if user else False,
                "subscribed": is_subscribed(user) if user else False,
                "require_subscription": REQUIRE_SUBSCRIPTION,
                "stripe_ready": _stripe_ok()}
        if user:
            try:
                u = appdb.get_user(user) or {}
                info["sub_status"] = u.get("sub_status")
                info["period_end"] = str(u.get("current_period_end")) if u.get("current_period_end") else None
                info["email"] = u.get("email")
                info["has_customer"] = bool(u.get("stripe_customer_id"))
            except Exception:
                pass
        return respond("200 OK", info)

    if path == "/diag":
        # 自己診断: ブラウザで /api/diag を開くだけで原因が分かる(機微情報は出さない)
        import inspect
        d = {"python": sys.version.split()[0],
             "config_loaded": _config is not None,
             "stripe_module": bool(stripe_api),
             "stripe_configured": _stripe_ok()}
        try:
            con = appdb._connect(); con.close(); d["db_connect"] = "ok"
        except Exception as e:
            d["db_connect"] = "ERROR: " + type(e).__name__ + ": " + str(e)[:160]
        try:
            sig = inspect.signature(appdb.create_session)
            d["appdb_has_single_session"] = "single_session" in sig.parameters
            d["appdb_has_get_user"] = hasattr(appdb, "get_user")
        except Exception as e:
            d["appdb_check"] = "ERROR: " + repr(e)
        try:
            appdb.get_user("__diag_nouser__")  # 新カラムを含むSELECTが通るか
            d["new_columns"] = "ok"
        except Exception as e:
            d["new_columns"] = "ERROR: " + type(e).__name__ + ": " + str(e)[:160]
        return respond("200 OK", d)

    if path == "/login" and method == "POST":
        p = read_body()
        user = str(p.get("username", "")).strip()
        if appdb.verify_user(user, str(p.get("password", ""))):
            ttl = ttl_for(user)
            # 単一セッション(二重ログイン防止)。共有デモアカウントは同時利用可なので除外。
            try:
                token = appdb.create_session(user, ttl, single_session=not is_demo(user))
            except TypeError:
                token = appdb.create_session(user, ttl)   # 旧appdb.py互換(単一セッション無効)
            appdb.add_login_log(user, client_ip(), client_ua(), True)   # ログイン成功を記録
            return respond("200 OK", {"ok": True, "user": user, "expires_in": ttl,
                                      "demo": is_demo(user)}, set_cookie=cookie(token, ttl))
        appdb.add_login_log(user, client_ip(), client_ua(), False)      # ログイン失敗も記録
        time.sleep(0.5)
        return respond("401 Unauthorized", {"error": "ユーザー名またはパスワードが違います"})

    if path == "/logout" and method == "POST":
        appdb.delete_session(cookie_token())
        return respond("200 OK", {"ok": True}, set_cookie=cookie("", 0))

    # ---- ページ閲覧の記録(公開・認証不要) : login.html 等のビーコンから呼ばれる ----
    if path == "/pageview" and method == "POST":
        page = str(read_body().get("page", ""))[:64] or "(unknown)"
        appdb.add_access_log(page, client_ip(), client_ua())
        return respond("200 OK", {"ok": True})

    if path == "/register" and method == "POST":
        if not ALLOW_REGISTRATION:
            return respond("403 Forbidden", {"error": "新規登録は無効化されています"})
        p = read_body()
        u = str(p.get("username", "")).strip()
        pw = str(p.get("password", ""))
        email = str(p.get("email", "")).strip()
        if not _USERNAME_RE.match(u):
            return respond("400 Bad Request", {"error": "ユーザー名は3〜64文字の英数字・記号(_ . - @)で入力してください"})
        if len(pw) < 8:
            return respond("400 Bad Request", {"error": "パスワードは8文字以上にしてください"})
        if appdb.user_exists(u):
            return respond("409 Conflict", {"error": "そのユーザー名は既に使われています"})
        appdb.create_user(u, pw)
        if email:
            try:
                appdb.set_email(u, email)
            except Exception:
                pass
        # 登録後すぐログインさせ、課金導線(マイページ)へ誘導できるようにセッション発行
        ttl = ttl_for(u)
        token = appdb.create_session(u, ttl)
        return respond("200 OK", {"ok": True, "user": u, "expires_in": ttl},
                       set_cookie=cookie(token, ttl))

    # ---- 自分のアカウント(マイページ) ----
    if path == "/account/password" and method == "POST":
        user, _ = appdb.get_session(cookie_token())
        if not user:
            return respond("401 Unauthorized", {"error": "ログインが必要です"})
        p = read_body()
        cur = str(p.get("current", ""))
        new = str(p.get("new", ""))
        if not appdb.verify_user(user, cur):
            time.sleep(0.5)
            return respond("400 Bad Request", {"error": "現在のパスワードが違います"})
        if len(new) < 8:
            return respond("400 Bad Request", {"error": "新しいパスワードは8文字以上にしてください"})
        appdb.set_password(user, new)
        return respond("200 OK", {"ok": True})

    if path == "/account/email" and method == "POST":
        user, _ = appdb.get_session(cookie_token())
        if not user:
            return respond("401 Unauthorized", {"error": "ログインが必要です"})
        appdb.set_email(user, str(read_body().get("email", "")).strip())
        return respond("200 OK", {"ok": True})

    # ---- お問い合わせ(要ログイン): DB保存 + 管理者へメール通知(ベストエフォート) ----
    if path == "/contact" and method == "POST":
        user, _ = appdb.get_session(cookie_token())
        if not user:
            return respond("401 Unauthorized", {"error": "ログインが必要です"})
        p = read_body()
        subject = str(p.get("subject", "")).strip()[:255]
        message = str(p.get("message", "")).strip()
        email = str(p.get("email", "")).strip()
        if not message:
            return respond("400 Bad Request", {"error": "お問い合わせ内容を入力してください"})
        if len(message) > 5000:
            return respond("400 Bad Request", {"error": "お問い合わせ内容は5000文字以内で入力してください"})
        if email and not _EMAIL_RE.match(email):
            return respond("400 Bad Request", {"error": "メールアドレスの形式が正しくありません"})
        if not subject:
            subject = "(件名なし)"
        try:
            appdb.create_inquiry(user, email or None, subject, message)
        except Exception as e:  # noqa
            return respond("500 Internal Server Error", {"error": "保存に失敗しました: " + str(e)})
        # 管理者へメール通知(設定が無い/失敗してもDB保存済みなので成功扱い)
        if mailer is not None:
            try:
                body = (f"ユーザー: {user}\n返信先メール: {email or '(未入力)'}\n"
                        f"件名: {subject}\n\n{message}\n")
                mailer.notify_admin(f"【公図色付け】お問い合わせ: {subject}", body,
                                    reply_to=(email or None))
            except Exception:
                pass
        return respond("200 OK", {"ok": True})

    # ---- Stripe サブスク ----
    if path == "/checkout" and method == "POST":
        user, _ = appdb.get_session(cookie_token())
        if not user:
            return respond("401 Unauthorized", {"error": "ログインが必要です"})
        if not _stripe_ok():
            return respond("503 Service Unavailable", {"error": "決済が未設定です(管理者に連絡してください)"})
        try:
            u = appdb.get_user(user) or {}
            sess = stripe_api.create_checkout_session(
                success_url=app_url("/mypage.html?checkout=success&sid={CHECKOUT_SESSION_ID}"),
                cancel_url=app_url("/mypage.html?checkout=cancel"),
                client_ref=user,
                customer_id=u.get("stripe_customer_id"),
                customer_email=u.get("email"))
            return respond("200 OK", {"url": sess.get("url")})
        except Exception as e:  # noqa
            return respond("502 Bad Gateway", {"error": "決済の開始に失敗しました: " + str(e)})

    if path == "/checkout/confirm" and method in ("POST", "GET"):
        # success_url 戻り直後に DB を即時反映(Webhook が遅延しても体験を良くする)
        user, _ = appdb.get_session(cookie_token())
        if not user:
            return respond("401 Unauthorized", {"error": "ログインが必要です"})
        if not _stripe_ok():
            return respond("503 Service Unavailable", {"error": "決済が未設定です"})
        if method == "POST":
            sid = read_body().get("session_id")
        else:
            m = re.search(r"[?&]session_id=([^&]+)", "?" + os.environ.get("QUERY_STRING", ""))
            sid = m.group(1) if m else None
        if not sid:
            return respond("400 Bad Request", {"error": "session_id がありません"})
        try:
            cs = stripe_api.get_checkout_session(sid)
            if cs.get("client_reference_id") and cs["client_reference_id"] != user:
                return respond("403 Forbidden", {"error": "セッションが一致しません"})
            cust = cs.get("customer")
            sub = cs.get("subscription") or {}
            if cust:
                appdb.set_customer(user, cust if isinstance(cust, str) else cust.get("id"))
            if isinstance(sub, dict) and sub.get("id"):
                appdb.update_subscription(user, sub.get("id"), sub.get("status", "active"),
                                          sub.get("current_period_end"))
            return respond("200 OK", {"ok": True, "subscribed": is_subscribed(user)})
        except Exception as e:  # noqa
            return respond("502 Bad Gateway", {"error": str(e)})

    if path == "/portal" and method == "POST":
        user, _ = appdb.get_session(cookie_token())
        if not user:
            return respond("401 Unauthorized", {"error": "ログインが必要です"})
        if not _stripe_ok():
            return respond("503 Service Unavailable", {"error": "決済が未設定です"})
        u = appdb.get_user(user) or {}
        if not u.get("stripe_customer_id"):
            return respond("400 Bad Request", {"error": "契約情報がありません"})
        try:
            sess = stripe_api.create_portal_session(u["stripe_customer_id"],
                                                    app_url("/mypage.html"))
            return respond("200 OK", {"url": sess.get("url")})
        except Exception as e:  # noqa
            return respond("502 Bad Gateway", {"error": str(e)})

    if path == "/webhook" and method == "POST":
        if not stripe_api:
            return respond("503 Service Unavailable", {"error": "決済が未設定です"})
        raw = read_raw()
        event = stripe_api.verify_webhook(raw, os.environ.get("HTTP_STRIPE_SIGNATURE", ""))
        if event is None:
            return respond("400 Bad Request", {"error": "署名検証に失敗"})
        try:
            _handle_webhook(event)
        except Exception:
            pass
        return respond("200 OK", {"received": True})

    # ---- 管理(ユーザー管理) ----
    if path == "/admin/users" and method == "GET":
        user, _ = appdb.get_session(cookie_token())
        if not is_admin(user):
            return respond("403 Forbidden", {"error": "管理者のみ"})
        rows = appdb.list_users()
        for r in rows:
            for k in ("created_at", "last_login", "current_period_end"):
                if r.get(k) is not None:
                    r[k] = str(r[k])
        return respond("200 OK", {"users": rows})

    if path == "/admin/user" and method == "POST":
        user, _ = appdb.get_session(cookie_token())
        if not is_admin(user):
            return respond("403 Forbidden", {"error": "管理者のみ"})
        p = read_body()
        target = str(p.get("username", "")).strip()
        action = str(p.get("action", ""))
        if not target or not appdb.user_exists(target):
            return respond("404 Not Found", {"error": "ユーザーが見つかりません"})
        if action == "delete":
            if target == user:
                return respond("400 Bad Request", {"error": "自分自身は削除できません"})
            appdb.delete_user(target)
        elif action == "set_admin":
            appdb.set_admin(target, bool(p.get("value")))
        elif action == "set_password":
            if len(str(p.get("password", ""))) < 8:
                return respond("400 Bad Request", {"error": "パスワードは8文字以上"})
            appdb.set_password(target, str(p.get("password")))
        elif action == "grant":     # 手動で購読を有効化(振込対応など)
            appdb.update_subscription(target, "manual", "active", None)
        elif action == "revoke":    # 手動で購読を無効化
            appdb.update_subscription(target, None, "canceled", None)
        else:
            return respond("400 Bad Request", {"error": "不明な操作"})
        return respond("200 OK", {"ok": True})

    # ---- 管理(ユーザー新規作成) ----
    if path == "/admin/create_user" and method == "POST":
        user, _ = appdb.get_session(cookie_token())
        if not is_admin(user):
            return respond("403 Forbidden", {"error": "管理者のみ"})
        p = read_body()
        newu = str(p.get("username", "")).strip()
        pw = str(p.get("password", ""))
        email = str(p.get("email", "")).strip()
        if not _USERNAME_RE.match(newu):
            return respond("400 Bad Request", {"error": "ユーザー名は3〜64文字の英数字・記号(_ . - @)で入力してください"})
        if len(pw) < 8:
            return respond("400 Bad Request", {"error": "パスワードは8文字以上にしてください"})
        if email and not _EMAIL_RE.match(email):
            return respond("400 Bad Request", {"error": "メールアドレスの形式が正しくありません"})
        if appdb.user_exists(newu):
            return respond("409 Conflict", {"error": "そのユーザー名は既に使われています"})
        appdb.create_user(newu, pw)
        if email:
            try:
                appdb.set_email(newu, email)
            except Exception:
                pass
        if p.get("is_admin"):
            try:
                appdb.set_admin(newu, True)
            except Exception:
                pass
        if p.get("grant"):   # 手動で購読を有効化(振込・無料招待など)
            try:
                appdb.update_subscription(newu, "manual", "active", None)
            except Exception:
                pass
        return respond("200 OK", {"ok": True, "user": newu})

    # ---- 管理(お問い合わせ一覧・対応状態) ----
    if path == "/admin/inquiries" and method == "GET":
        user, _ = appdb.get_session(cookie_token())
        if not is_admin(user):
            return respond("403 Forbidden", {"error": "管理者のみ"})
        rows = appdb.list_inquiries()
        for r in rows:
            if r.get("created_at") is not None:
                r["created_at"] = str(r["created_at"])
        return respond("200 OK", {"inquiries": rows, "mail_ready": bool(mailer and mailer.ready())})

    if path == "/admin/inquiry" and method == "POST":
        user, _ = appdb.get_session(cookie_token())
        if not is_admin(user):
            return respond("403 Forbidden", {"error": "管理者のみ"})
        p = read_body()
        iid = p.get("id")
        action = str(p.get("action", ""))
        if not iid:
            return respond("400 Bad Request", {"error": "id がありません"})
        if action == "handled":
            appdb.set_inquiry_handled(iid, True)
        elif action == "unhandled":
            appdb.set_inquiry_handled(iid, False)
        elif action == "delete":
            appdb.delete_inquiry(iid)
        else:
            return respond("400 Bad Request", {"error": "不明な操作"})
        return respond("200 OK", {"ok": True})

    # ---- 管理(ログインログ) ----
    if path == "/admin/login_logs" and method == "GET":
        user, _ = appdb.get_session(cookie_token())
        if not is_admin(user):
            return respond("403 Forbidden", {"error": "管理者のみ"})
        rows = appdb.list_login_logs()
        for r in rows:
            if r.get("created_at") is not None:
                r["created_at"] = str(r["created_at"])
            r["success"] = bool(r.get("success"))
        return respond("200 OK", {"logs": rows})

    # ---- 管理(ページアクセスログ) ----
    if path == "/admin/access_logs" and method == "GET":
        user, _ = appdb.get_session(cookie_token())
        if not is_admin(user):
            return respond("403 Forbidden", {"error": "管理者のみ"})
        rows = appdb.list_access_logs()
        for r in rows:
            if r.get("created_at") is not None:
                r["created_at"] = str(r["created_at"])
        return respond("200 OK", {"logs": rows})

    return respond("404 Not Found", {"error": "not found"})


def _handle_webhook(event):
    """Stripe イベントを DB に反映。customer_id でユーザーを特定する。"""
    typ = event.get("type", "")
    obj = (event.get("data") or {}).get("object") or {}
    if typ == "checkout.session.completed":
        user = obj.get("client_reference_id")
        cust = obj.get("customer")
        sub_id = obj.get("subscription")
        if user and cust:
            appdb.set_customer(user, cust)
        if user and sub_id:
            appdb.update_subscription(user, sub_id, "active", None)
        return
    if typ.startswith("customer.subscription."):
        cust = obj.get("customer")
        sub_id = obj.get("id")
        status = obj.get("status", "")
        period_end = obj.get("current_period_end")
        if typ.endswith(".deleted"):
            status = "canceled"
        uname = appdb.find_by_customer(cust)
        if uname:
            appdb.update_subscription(uname, sub_id, status, period_end)
        return
    if typ in ("invoice.paid", "invoice.payment_succeeded"):
        uname = appdb.find_by_customer(obj.get("customer"))
        if uname:
            appdb.update_subscription(uname, obj.get("subscription"), "active", None)
        return
    if typ == "invoice.payment_failed":
        uname = appdb.find_by_customer(obj.get("customer"))
        if uname:
            appdb.update_subscription(uname, obj.get("subscription"), "past_due", None)
        return


def _maybe_cleanup():
    """常駐不可の共有サーバ向け: cron無しでも定期的に掃除する。
    リクエストの約1%で期限切れセッションを削除(失敗してもリクエストには影響させない)。
    cronが使える場合は `python3 appdb.py cleanup` を定期実行してもよい。"""
    try:
        if random.random() < 0.01:
            appdb.cleanup_sessions()
    except Exception:
        pass


def main():
    _maybe_cleanup()
    try:
        route()
    except Exception as e:  # noqa
        respond("500 Internal Server Error", {"error": "サーバーエラー: " + str(e)})


if __name__ == "__main__":
    main()
