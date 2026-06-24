# -*- coding: utf-8 -*-
"""
メール送信ユーティリティ (標準ライブラリ smtplib) — 共有レンタルサーバ(CGI)版

CGI はリクエスト毎にプロセスが終了するため、非同期スレッド送信は使わず
「同期送信(タイムアウト付き)」にする。お問い合わせは件数が少なく、保存(DB)が
先に済んでいるので、メール送信が多少遅くても/失敗しても本処理は成功扱いにできる。

設定は同ディレクトリの config.py(任意) または環境変数で指定:
  SMTP_HOST / SMTP_PORT(既定587) / SMTP_USER / SMTP_PASSWORD
  SMTP_TLS  starttls(既定) / ssl / none
  MAIL_FROM / MAIL_FROM_NAME(既定 公図色付け) / MAIL_ADMIN(管理者通知先)

SMTP_HOST 未設定時はドライラン(送信せず False を返す)。
"""
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate

try:
    import config  # config.py(任意)
except Exception:
    config = None


def _cfg(key, default=""):
    if config is not None and hasattr(config, key):
        return getattr(config, key)
    return os.environ.get(key, default)


SMTP_HOST = str(_cfg("SMTP_HOST", ""))
SMTP_PORT = int(_cfg("SMTP_PORT", "587") or "587")
SMTP_USER = str(_cfg("SMTP_USER", ""))
SMTP_PASSWORD = str(_cfg("SMTP_PASSWORD", ""))
SMTP_TLS = str(_cfg("SMTP_TLS", "starttls")).lower()
MAIL_FROM = str(_cfg("MAIL_FROM", SMTP_USER or "no-reply@example.com"))
MAIL_FROM_NAME = str(_cfg("MAIL_FROM_NAME", "公図色付け"))
MAIL_ADMIN = str(_cfg("MAIL_ADMIN", ""))


def ready():
    """SMTP が設定済みか。"""
    return bool(SMTP_HOST)


def send_mail(to, subject, body, reply_to=None):
    """同期送信。成功 True / 失敗・未設定 False。例外は投げない。"""
    if not (to and SMTP_HOST):
        return False
    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = formataddr((MAIL_FROM_NAME, MAIL_FROM))
        msg["To"] = to
        msg["Date"] = formatdate(localtime=True)
        if reply_to:
            msg["Reply-To"] = reply_to
        ctx = ssl.create_default_context()
        if SMTP_TLS == "ssl":
            s = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10, context=ctx)
        else:
            s = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            if SMTP_TLS == "starttls":
                s.starttls(context=ctx)
        if SMTP_USER:
            s.login(SMTP_USER, SMTP_PASSWORD)
        s.sendmail(MAIL_FROM, [to], msg.as_string())
        s.quit()
        return True
    except Exception:  # noqa  (CGIでは握りつぶし、呼び出し側はベストエフォート扱い)
        return False


def notify_admin(subject, body, reply_to=None):
    """管理者(MAIL_ADMIN)宛に送る。未設定なら False。"""
    if MAIL_ADMIN:
        return send_mail(MAIL_ADMIN, subject, body, reply_to=reply_to)
    return False
