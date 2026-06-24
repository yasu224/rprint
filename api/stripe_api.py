# -*- coding: utf-8 -*-
"""
Stripe API ラッパー (urllib のみ・追加ライブラリ不要) — 共有レンタルサーバ(CGI)向け

サブスクの Checkout 作成 / Billing Portal / Webhook 署名検証 を提供。
カード情報はサーバーを通らず、Stripe のホスト画面で処理されます。

設定(config.py または環境変数):
  STRIPE_SECRET_KEY      … sk_live_... / sk_test_...
  STRIPE_PRICE_ID        … price_...   (月額プランの価格ID)
  STRIPE_WEBHOOK_SECRET  … whsec_...   (Webhook 署名シークレット)
"""
import hashlib
import hmac
import json
import os
import time
import urllib.parse
import urllib.request

try:
    import config  # config.py(任意)
except Exception:
    config = None

API_BASE = "https://api.stripe.com"


def _cfg(key, default=""):
    if config is not None and hasattr(config, key):
        return getattr(config, key)
    return os.environ.get(key, default)


def secret_key():
    return _cfg("STRIPE_SECRET_KEY", "")


def price_id():
    return _cfg("STRIPE_PRICE_ID", "")


def webhook_secret():
    return _cfg("STRIPE_WEBHOOK_SECRET", "")


def configured():
    """Stripe が使える設定になっているか(秘密鍵と価格ID)。"""
    return bool(secret_key() and price_id())


def _auth_req(path, data=None, method="POST"):
    req = urllib.request.Request(API_BASE + path, data=data, method=method)
    req.add_header("Authorization", "Bearer " + secret_key())
    if data is not None:
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _post(path, params):
    return _auth_req(path, urllib.parse.urlencode(params).encode("utf-8"), "POST")


def create_checkout_session(success_url, cancel_url, client_ref,
                            customer_id=None, customer_email=None):
    """月額サブスクの Checkout セッションを作成し、結果(dict)を返す。url にリダイレクトする。"""
    params = [
        ("mode", "subscription"),
        ("line_items[0][price]", price_id()),
        ("line_items[0][quantity]", "1"),
        ("success_url", success_url),
        ("cancel_url", cancel_url),
        ("client_reference_id", client_ref),
        ("allow_promotion_codes", "true"),
    ]
    if customer_id:
        params.append(("customer", customer_id))
    elif customer_email:
        params.append(("customer_email", customer_email))
    return _post("/v1/checkout/sessions", params)


def create_portal_session(customer_id, return_url):
    """契約変更・解約・支払い方法更新のための Billing Portal セッションを作成。"""
    return _post("/v1/billing_portal/sessions",
                 [("customer", customer_id), ("return_url", return_url)])


def get_checkout_session(session_id):
    """Checkout セッションを取得(subscription を展開)。決済完了後の確定に使用。"""
    return _auth_req("/v1/checkout/sessions/" + urllib.parse.quote(session_id)
                     + "?expand[]=subscription", method="GET")


def verify_webhook(payload_bytes, sig_header, tolerance=300):
    """Stripe-Signature を検証。OK ならイベント dict を、失敗は None を返す。"""
    secret = webhook_secret()
    if not secret or not sig_header:
        return None
    try:
        parts = dict(p.split("=", 1) for p in sig_header.split(",") if "=" in p)
        t = parts.get("t")
        v1 = parts.get("v1")
        if not t or not v1:
            return None
        if abs(time.time() - int(t)) > tolerance:
            return None
        signed = (t + ".").encode("utf-8") + payload_bytes
        expected = hmac.new(secret.encode("utf-8"), signed, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, v1):
            return None
        return json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None
