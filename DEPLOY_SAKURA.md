# さくらのレンタルサーバ展開手順 — `www/mary-inc.com/rpaint/`

公開URL: **https://mary-inc.com/rpaint/**（ドメイン/SSLはさくらのコントロールパネルで設定済み前提）

> 本フォルダ（pdf.js/CGI版）は **すべて相対パス** なので、サブディレクトリ `/rpaint/` の
> 配下でそのまま動作します。アップロード先 `~/www/mary-inc.com/rpaint/`。

## 0. 事前準備（さくらのコントロールパネル）
- 独立ドメイン `mary-inc.com` を追加し、公開フォルダを `www/mary-inc.com` に設定。
- **SSL（無料SNI）** を有効化（https）。
- **データベース（MySQL/MariaDB）** を1つ作成 → ホスト名・DBユーザー・パスワード・DB名を控える。
- SSH を有効化（FTPのみでも可だが、初期化コマンド実行にSSH推奨）。

## 1. ファイルをアップロード
このフォルダの中身を **そのまま** `~/www/mary-inc.com/rpaint/` へ転送（FTP/SFTP/scp）。
```
rpaint/
  .htaccess  index.html  login.html  register.html
  mypage.html  admin.html
  lib/ ...   api/ ...   (appdb.py / stripe_api.py / index.cgi / config.py ほか)
```

## 2. パーミッション・改行コード
- `api/index.cgi` … **実行権限 755**・**改行コード LF**（CRLFだと動きません）
- それ以外のファイル 644、ディレクトリ 755

## 3. CGI の Python パスを設定（shebang）
SSH で Python3 のパスを確認し、`api/index.cgi` の1行目を合わせる。
```
which python3   # 例: /usr/local/bin/python3
```
`api/index.cgi` 先頭 `#!/usr/local/bin/python3` を上記に修正。

## 4. 依存ライブラリ（PyMySQL）
```
cd ~/www/mary-inc.com/rpaint/api
python3 -m pip install --user pymysql
```

## 5. DB 接続設定
`api/config_example.py` を `api/config.py` にコピーし、さくらの MySQL 情報を記入。
（`config.py` は `.htaccess` で直接アクセス禁止にしてあります）

## 6. DB 初期化・ユーザー作成（SSH）
```
cd ~/www/mary-inc.com/rpaint/api
python3 manage_users.py init
python3 manage_users.py add admin '強いパスワード'
python3 manage_users.py add DEMO DEMO        # デモ用(任意)
```

## 7. 管理者の設定
`config.py` に管理者ユーザー名を記載（マイページ→管理 / admin.html にアクセス可になる）:
```
ADMIN_USERNAMES = "admin"      # カンマ区切りで複数可
```
または DB の `is_admin` を立てる（CLI）:
```
python3 manage_users.py admin <user> on
```

## 8. Stripe サブスク課金（月額）の設定
1. **Stripe アカウント**作成（https://dashboard.stripe.com）。最初はテストモードで。
2. **商品と価格**を作成：商品 → 料金「**継続/月額**」→ 価格IDをコピー（`price_...`）。
3. **APIキー**：開発者 → APIキー → シークレットキー（`sk_test_...` / 本番 `sk_live_...`）。
4. **Webhook**：開発者 → Webhook → エンドポイント追加
   - URL: `https://mary-inc.com/rpaint/api/webhook`
   - 送信イベント: `checkout.session.completed`, `customer.subscription.created/updated/deleted`,
     `invoice.paid`, `invoice.payment_failed`
   - 署名シークレットをコピー（`whsec_...`）。
5. `api/config.py` に記入：
```
STRIPE_SECRET_KEY = "sk_test_..."
STRIPE_PRICE_ID = "price_..."
STRIPE_WEBHOOK_SECRET = "whsec_..."
APP_BASE_URL = "https://mary-inc.com/rpaint"
REQUIRE_SUBSCRIPTION = 1      # 未加入は保存・印刷をロック(0で課金なしでも利用可)
```
6. **テスト**：登録 → マイページ →「月額プランに加入する」→ Stripe のテストカード
   `4242 4242 4242 4242`（有効期限は未来・CVC任意）で決済 → マイページが「有効」になり、
   アプリの保存・印刷ロックが解除されることを確認。
7. 問題なければ本番キー（`sk_live_` / 本番 `price_` / 本番 Webhook シークレット）に差し替え。

> カード情報は **Stripe のホスト画面**で入力され、当サーバーを通りません（PCI 範囲を最小化）。
> 解約・カード変更はマイページの「契約・支払い方法の管理」（Stripe Billing Portal）から。

## 9. 動作確認
ブラウザで **https://mary-inc.com/rpaint/** → ログイン画面。
- ログイン後にアプリが表示されれば成功。マイページ・（管理者なら）管理が開ければOK。
- うまく行かない場合は `api/index.cgi` の権限・改行・shebang、`config.py` のDB情報、
  `~/www/mary-inc.com/rpaint/api/` への `python3 manage_users.py list` で接続可否を確認。

## メモ
- HTTPS 配下ではさくらが CGI に `HTTPS=on` を渡すため、セッションCookieに `Secure` が付きます。
- セッションは MySQL の `sessions` テーブルに保存（CGIはリクエスト毎にプロセス起動のため）。
- フォント（`lib/NotoSansJP-*.js` 各約3.3MB）は静的配信・ブラウザキャッシュされます。
- **サブスク課金（Stripe）・マイページ・ユーザー管理**を本バージョンに搭載しました。
  購読状態は Webhook で `users` テーブルに反映されます（決済代行はすべて Stripe）。
- 銀行振込など Stripe を使わない運用は、管理画面の「有効化／無効化」で手動付与できます。
