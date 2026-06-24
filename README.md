# 公図色付け — 共有レンタルサーバ版（pdf.js / CGI）

さくらインターネットの**共有レンタルサーバ**など、PyMuPDF やデーモン常駐が使えない
ホスティングでも動くように再設計した版です。

## 何が変わったか（VPS版 `../pdfcolor-web` との違い）

| 機能 | サーバー版(PyMuPDF) | 本共有版 |
|---|---|---|
| PDF→表示 | サーバーで PyMuPDF が SVG化 | **ブラウザの pdf.js** が描画（サーバー不要） |
| PDF 出力 | サーバーで PyMuPDF が生成 | **ブラウザの jsPDF** が生成（文字は画像に焼込み） |
| SVG / PNG 出力 | クライアント | クライアント（変更なし） |
| バックエンド | 常駐 HTTP サーバー | **CGI（認証のみ）** |
| セッション | プロセス内メモリ | **MySQL に保存**（CGIはリクエスト毎に起動するため） |
| 依存(サーバー) | pymupdf＋pymysql | **pymysql のみ**（純Python・FreeBSDで動く） |

→ **ネイティブ拡張(PyMuPDF)をサーバーから排除**したため、FreeBSD の共有サーバでも動作します。

## 構成
```
pdfcolor-shared/
  index.html        … アプリ本体（pdf.js / jsPDF をローカル読込）
  login.html        … ログイン画面（初期ページ）
  register.html     … ユーザー登録画面
  lib/
    pdf.min.js, pdf.worker.min.js … pdf.js（PDF描画）
    jspdf.umd.min.js              … jsPDF（PDF出力）
    NotoSansJP-normal.js          … 埋め込み日本語フォント Regular（PDFの本物テキスト用）
    NotoSansJP-bold.js            … 同 Bold（太字用・本物の太字字形）
  api/
    index.cgi       … 認証API（login/logout/me/register）
    appdb.py        … ユーザー＆セッション管理（PyMySQL）
    manage_users.py … ユーザー管理CLI
    config_example.py … DB接続設定テンプレ → config.py にコピーして編集
  .htaccess         … ルーティング（/api/* → CGI、DirectoryIndex 等）
```

## さくらのレンタルサーバへの配置手順
1. **MySQL を用意**（コントロールパネルでデータベース作成）。ホスト名・ユーザー・
   パスワード・DB名を控える。
2. `api/config_example.py` を `api/config.py` にコピーし、上記の値を記入。
3. ファイル一式を公開ディレクトリ（例 `~/www/kozu/`）へアップロード。
4. **CGI の準備**:
   - `api/index.cgi` の1行目 shebang を、さくらの Python3 の絶対パスに合わせる
     （SSHで `which python3.8` などで確認。例 `#!/usr/local/bin/python3.8`）。
   - `api/index.cgi` を **実行権限 755**、**改行コード LF** にする。
   - PyMySQL を導入: `pip3.8 install --user pymysql`（または `python3.8 -m pip install --user pymysql`）。
5. **DB初期化・ユーザー作成**（SSH）:
   ```
   cd ~/www/kozu/api
   python3.8 manage_users.py init
   python3.8 manage_users.py add admin <パスワード>
   python3.8 manage_users.py add DEMO DEMO      # デモ用(任意)
   ```
6. ブラウザで `https://<あなたのドメイン>/kozu/` を開く → ログイン画面。

> HTTPS 環境では Cookie に Secure を付けるため、CGI に環境変数 `HTTPS=on` 相当が
> 渡る構成（さくらのHTTPSは通常 `HTTPS=on` が入ります）。

## 認証・デモ仕様（VPS版と同等）
- 初期画面=ログイン。`/api/login` 成功で HttpOnly セッションCookie発行（**MySQL保存**）。
- `/api/me` `/api/logout` `/api/register` を CGI が処理。
- **DEMO/DEMO** は5分で自動ログアウト、SVG/PDF出力を無効化（クライアントで制御）。
- 登録の可否は環境変数 `ALLOW_REGISTRATION`（既定有効）。

## PDFの日本語テキスト（選択・検索可能）
- **PDF内の文字は本物の文字列**（選択・コピー・検索可）。Noto Sans JP の
  Regular(`NotoSansJP-normal.js`)と **Bold(`NotoSansJP-bold.js`)** を埋め込み、
  jsPDF の `doc.text()` で描いています。縦書き・横書き・**本物の太字**・色・回転に対応
  （Bold未読込時のみ疑似ボールドにフォールバック）。
- フォントは **JIS X 0208 にサブセット化**（約2.5MB／配布JSは約3.3MB）。初回読込のみで
  以降はブラウザキャッシュ。**生成PDFは jsPDF が使用グリフだけ再サブセットするため軽量**
  （実測 約0.4MB）。
- 万一フォント未読込でも、文字を画像に焼き込んで出力するフォールバックあり。
- JIS X 0208 外の稀少漢字は表示されません（必要なら収録範囲を広げて再サブセット可）。

## 制約・トレードオフ
- PDF描画は pdf.js のラスタ化（元が公図のスキャンPDFなら品質はサーバー版と同等）。
  真のベクターPDFを読ませた場合は文字・線がラスタになります。
- 共有サーバはCGI（リクエスト毎起動）。同時アクセス多数や巨大ファイルには不向き。
  本格運用は VPS版（`../pdfcolor-web`）を推奨。

## 動作確認済み（ローカル検証）
- pdf.js による PDF 読込・描画・塗りつぶし（公図PDF 1192×842pt）✅
- クライアント SVG 出力（`<image>`＋`<text>` 内包）✅
- クライアント PDF 出力（jsPDF＋Noto Sans JP Regular/Bold 埋め込み）。**横書き/縦書きが
  選択・検索可能な本物の文字列**として抽出でき、**太字は本物のBold字形**（埋め込みフォント
  2種を確認）になることを確認。PDF約0.46MB ✅
- CGI 認証（login/me/logout/register・DBセッション・デモTTL・重複409・401）✅
