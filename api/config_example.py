# -*- coding: utf-8 -*-
# DB接続設定のテンプレート。
# これを config.py にコピーし、さくらの MySQL の値に書き換えてください。
# (config.py は .htaccess で直接アクセス禁止にしています)

DB_HOST = "mysqlXXXX.db.sakura.ne.jp"   # さくらの DB サーバ名
DB_PORT = 3306
DB_USER = "あなたのDBユーザー名"
DB_PASSWORD = "あなたのDBパスワード"
DB_NAME = "あなたのDB名"                # 例: <ユーザー名>_kozu など

# 任意: セッション/デモ/登録の挙動
# SESSION_TTL_MIN = 120
# DEMO_USERNAMES = "DEMO"
# DEMO_TTL_MIN = 15
# ALLOW_REGISTRATION = 1

# ---- Stripe サブスク課金(月額) ----
# Stripe ダッシュボードで「商品(月額・定期)」を作成し、その価格ID(price_...)を設定。
# Webhook は  https://あなたのドメイン/rpaint/api/webhook  を登録し、その署名シークレットを設定。
STRIPE_SECRET_KEY = ""        # sk_live_... / sk_test_...
STRIPE_PRICE_ID = ""          # price_...  (月額プランの価格ID)
STRIPE_WEBHOOK_SECRET = ""    # whsec_...  (Webhook 署名シークレット)

# アプリの公開URL(Checkout 後の戻り先・Webhook 用)。末尾スラッシュなし。
# 例: "https://example.sakura.ne.jp/rpaint"
APP_BASE_URL = ""

# 購読(サブスク)を必須にするか。未設定時の既定は 1(ON)。
#   1 = 購読必須。未加入ユーザーはデモモード(出力に「MARY DEMO」透かし)になる。← 本番の既定
#   0 = 購読不要。全員フル機能(課金導線のテスト用)。
# REQUIRE_SUBSCRIPTION = 1

# 管理者として扱うユーザー名(カンマ区切り)。該当ユーザーは管理画面にアクセス可。
# ADMIN_USERNAMES = "admin"

# ---- お問い合わせメール送信(SMTP) ----
# お問い合わせはDBに保存されるが、管理者へメール通知もしたい場合に設定する。
# 未設定でもお問い合わせ自体はDB保存され、管理画面で確認できる(メール通知のみ無効)。
# さくらのメールボックスを使う例:
#   SMTP_HOST = "あなたのドメイン.sakura.ne.jp"  (または initial の mail サーバ)
#   SMTP_PORT = 587            # SSLなら 465
#   SMTP_USER = "info@あなたのドメイン"
#   SMTP_PASSWORD = "メールボックスのパスワード"
#   SMTP_TLS = "starttls"      # "starttls"(587) / "ssl"(465) / "none"
#   MAIL_FROM = "info@あなたのドメイン"        # 送信元(未設定なら SMTP_USER)
#   MAIL_FROM_NAME = "公図色付け"              # 送信者名
#   MAIL_ADMIN = "info@あなたのドメイン"       # お問い合わせの通知先(ここ宛に届く)
SMTP_HOST = ""
SMTP_PORT = 587
SMTP_USER = ""
SMTP_PASSWORD = ""
SMTP_TLS = "starttls"
MAIL_FROM = ""
MAIL_FROM_NAME = "公図色付け"
MAIL_ADMIN = ""
