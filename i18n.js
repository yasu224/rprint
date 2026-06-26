/* 多言語化(i18n) — 公図色付け 共有版
   使い方:
     <script src="i18n.js"></script>
     翻訳対象要素に data-i18n="キー"(本文) / data-i18n-title="キー"(ツールチップ) / data-i18n-ph="キー"(placeholder)
     言語セレクタ: I18N.renderSelect(親要素)  もしくは <select id="langSel"> を置けば自動で配線
   注意: 翻訳はAI生成。最終的にネイティブ確認推奨。 */
(function(global){
  // 言語の並び。先頭の ja を基準言語にする。
  var LANGS = [
    ['ja','日本語'], ['en','English'], ['zh','简体中文'], ['ko','한국어'],
    ['vi','Tiếng Việt'], ['es','Español'], ['de','Deutsch'], ['fr','Français'],
    ['ar','العربية']
  ];
  var ORDER = LANGS.map(function(l){return l[0];});
  // key: [ja, en, zh, ko, vi, es, de, fr]
  var DICT = {
    // ---- セクション見出し ----
    'sec.file':       ['ファイル','File','文件','파일','Tệp','Archivo','Datei','Fichier','ملف'],
    'sec.touki':      ['登記情報','Registry','登记信息','등기정보','Đăng ký','Registro','Grundbuch','Cadastre','السجل العقاري'],
    'sec.tools':      ['ツール','Tools','工具','도구','Công cụ','Herramientas','Werkzeuge','Outils','الأدوات'],
    'sec.brush':      ['ブラシ・消しゴム','Brush / Eraser','画笔·橡皮','브러시·지우개','Bút·Tẩy','Pincel/Borrador','Pinsel/Radierer','Pinceau/Gomme','فرشاة/ممحاة'],
    'sec.color':      ['色・不透明度・太さ','Color · Opacity · Width','颜色·不透明度·粗细','색·불투명도·굵기','Màu·Độ mờ·Nét','Color·Opacidad·Grosor','Farbe·Deckkraft·Stärke','Couleur·Opacité·Épaisseur','لون·شفافية·سماكة'],
    'sec.text':       ['文字・スタンプ','Text / Stamp','文字·印章','문자·스탬프','Chữ·Dấu','Texto/Sello','Text/Stempel','Texte/Tampon','نص/ختم'],
    'sec.fillset':    ['塗り設定','Fill settings','填充设置','채우기 설정','Cài đặt tô','Ajustes de relleno','Fülleinstellung','Réglages remplissage','إعدادات التعبئة'],
    'sec.detect':     ['検出','Detection','检测','검출','Phát hiện','Detección','Erkennung','Détection','الكشف'],
    'sec.edit':       ['編集','Edit','编辑','편집','Sửa','Editar','Bearbeiten','Édition','تحرير'],
    'sec.view':       ['表示','View','显示','보기','Hiển thị','Vista','Ansicht','Affichage','عرض'],
    'sec.save':       ['保存','Save','保存','저장','Lưu','Guardar','Speichern','Enregistrer','حفظ'],
    'sec.print':      ['印刷','Print','打印','인쇄','In','Imprimir','Drucken','Imprimer','طباعة'],
    'sec.account':    ['アカウント','Account','账户','계정','Tài khoản','Cuenta','Konto','Compte','الحساب'],
    // ---- ボタン/ラベル ----
    'btn.pick':       ['📂 ファイルを選択','📂 Choose file','📂 选择文件','📂 파일 선택','📂 Chọn tệp','📂 Elegir archivo','📂 Datei wählen','📂 Choisir un fichier','📂 اختر ملفًا'],
    'btn.add':        ['＋ 追加','＋ Add','＋ 添加','＋ 추가','＋ Thêm','＋ Añadir','＋ Hinzufügen','＋ Ajouter','＋ إضافة'],
    'btn.delpage':    ['🗑 ページ削除','🗑 Delete page','🗑 删除页','🗑 페이지 삭제','🗑 Xóa trang','🗑 Borrar página','🗑 Seite löschen','🗑 Supprimer page','🗑 حذف الصفحة'],
    'btn.touki':      ['🏛 登記情報提供サービス','🏛 Registry Info Service','🏛 登记信息服务','🏛 등기정보 서비스','🏛 Dịch vụ đăng ký','🏛 Servicio de Registro','🏛 Grundbuch-Dienst','🏛 Service du cadastre','🏛 خدمة السجل العقاري'],
    'tool.fill':      ['🪣 塗り','🪣 Fill','🪣 填充','🪣 채우기','🪣 Tô','🪣 Rellenar','🪣 Füllen','🪣 Remplir','🪣 تعبئة'],
    'tool.text':      ['✏️ 文字','✏️ Text','✏️ 文字','✏️ 문자','✏️ Chữ','✏️ Texto','✏️ Text','✏️ Texte','✏️ نص'],
    'tool.select':    ['🔲 選択','🔲 Select','🔲 选择','🔲 선택','🔲 Chọn','🔲 Seleccionar','🔲 Auswahl','🔲 Sélection','🔲 تحديد'],
    'tool.brush':     ['🖌 ブラシ','🖌 Brush','🖌 画笔','🖌 브러시','🖌 Bút','🖌 Pincel','🖌 Pinsel','🖌 Pinceau','🖌 فرشاة'],
    'tool.eraser':    ['🧽 消しゴム','🧽 Eraser','🧽 橡皮','🧽 지우개','🧽 Tẩy','🧽 Borrador','🧽 Radierer','🧽 Gomme','🧽 ممحاة'],
    'tool.move':      ['✋ 移動','✋ Pan','✋ 平移','✋ 이동','✋ Di chuyển','✋ Mover','✋ Verschieben','✋ Déplacer','✋ تحريك'],
    'tool.rect':      ['▭ 長方形','▭ Rectangle','▭ 矩形','▭ 사각형','▭ Chữ nhật','▭ Rectángulo','▭ Rechteck','▭ Rectangle','▭ مستطيل'],
    'tool.redact':    ['⬛ 墨消し','⬛ Redact','⬛ 涂黑','⬛ 검정칠','⬛ Bôi đen','⬛ Tachar','⬛ Schwärzen','⬛ Caviarder','⬛ تعتيم'],
    'tip.redact':     ['墨消し（黒塗り）。長方形ツールと同じ操作で範囲指定。画面は濃いグレー。PDF出力時に枠内の全レイヤー・地図・文字を実際に消去して黒で塗る（復元不可）','Redaction. Same as rectangle tool; dark gray on screen. On PDF export, content inside (all layers, map, text) is truly erased and filled black (unrecoverable)','涂黑遮盖。操作同矩形工具，屏幕显示深灰。导出PDF时框内所有图层、地图、文字将被真正擦除并填黑（不可恢复）','검정칠. 사각형 도구와 동일 조작, 화면은 진회색. PDF 출력 시 영역 내 모든 레이어·지도·문자를 실제로 삭제하고 검정으로 채움(복원 불가)','Bôi đen. Thao tác như công cụ chữ nhật; màn hình màu xám đậm. Khi xuất PDF, nội dung bên trong (mọi lớp, bản đồ, chữ) bị xóa thật và tô đen (không khôi phục được)','Tachado. Igual que la herramienta rectángulo; gris oscuro en pantalla. Al exportar PDF, el contenido interior (todas las capas, mapa, texto) se borra realmente y se rellena de negro (irrecuperable)','Schwärzung. Wie das Rechteck-Werkzeug; am Bildschirm dunkelgrau. Beim PDF-Export wird der Inhalt im Rahmen (alle Ebenen, Karte, Text) wirklich gelöscht und schwarz gefüllt (nicht wiederherstellbar)','Caviardage. Comme l’outil rectangle ; gris foncé à l’écran. À l’export PDF, le contenu intérieur (toutes les couches, carte, texte) est réellement effacé et rempli en noir (irrécupérable)','تعتيم. مثل أداة المستطيل؛ رمادي داكن على الشاشة. عند تصدير PDF يُمحى فعليًا كل المحتوى داخل الإطار (كل الطبقات والخريطة والنص) ويُملأ بالأسود (غير قابل للاسترجاع)'],
    'tip.rect':       ['長方形を塗る。始点クリック→対角を動かしてクリックで確定。作成済みはクリックで選択しハンドルでサイズ調整・Deleteで削除（Escで取消/選択解除）','Fill a rectangle: click a corner, move the opposite corner, click to confirm (Esc to cancel)','填充矩形：点击起点→移动对角点→再次点击确定（Esc取消）','사각형 칠하기: 시작점 클릭→대각점 이동→다시 클릭하여 확정(Esc 취소)','Tô hình chữ nhật: nhấp điểm đầu → di chuyển điểm đối diện → nhấp để xác nhận (Esc để hủy)','Rellenar un rectángulo: clic en una esquina, mover la opuesta, clic para confirmar (Esc cancela)','Rechteck füllen: Ecke klicken, Gegenecke bewegen, zum Bestätigen klicken (Esc bricht ab)','Remplir un rectangle : cliquez un coin, déplacez le coin opposé, cliquez pour valider (Échap annule)','تعبئة مستطيل: انقر زاوية، حرّك الزاوية المقابلة، انقر للتأكيد (Esc للإلغاء)'],
    'tip.move':       ['表示エリアを移動（拡大時にドラッグでスクロール）。無操作が続くと自動でこのモードに','Pan the view (drag to scroll when zoomed); auto-activates when idle','移动显示区域（放大时拖动滚动）；空闲时自动启用','보기 이동(확대 시 드래그로 스크롤), 무조작 시 자동 전환','Di chuyển vùng hiển thị (kéo để cuộn khi phóng to); tự bật khi rảnh','Desplazar la vista (arrastrar para desplazar al ampliar); se activa al estar inactivo','Ansicht verschieben (zum Scrollen ziehen beim Zoomen); automatisch bei Inaktivität','Déplacer la vue (glisser pour défiler en zoom) ; auto si inactif','تحريك العرض (اسحب للتمرير عند التكبير)؛ يُفعّل تلقائيًا عند الخمول'],
    'tip.brush':      ['自由に塗る(太さは「太さ」スライダーで調整)','Paint freely (size via the Width slider)','自由涂抹（粗细用"粗细"滑块调整）','자유롭게 칠(굵기는 굵기 슬라이더로)','Tô tự do (độ dày bằng thanh Độ dày)','Pinta libremente (grosor con el control Grosor)','Frei malen (Stärke über den Regler)','Peindre librement (épaisseur via le curseur)','ارسم بحرية (السماكة عبر شريط السماكة)'],
    'tip.eraser':     ['塗り・ブラシを消す(太さは「太さ」スライダーで調整)','Erase fill & brush (size via the Width slider)','擦除填充与画笔（粗细用"粗细"滑块）','채우기·브러시 지우기(굵기는 굵기 슬라이더)','Xóa tô & bút (độ dày bằng thanh Độ dày)','Borra relleno y pincel (grosor con el control)','Füllung & Pinsel löschen (Stärke über Regler)','Effacer remplissage et pinceau (épaisseur via curseur)','امسح التعبئة والفرشاة (السماكة عبر الشريط)'],
    'lbl.brush':      ['ブラシ','Brush','画笔','브러시','Bút','Pincel','Pinsel','Pinceau','فرشاة'],
    'lbl.eraser':     ['消しゴム','Eraser','橡皮','지우개','Tẩy','Borrador','Radierer','Gomme','ممحاة'],
    'sz.s':           ['小','S','小','소','Nhỏ','P','S','P','S'],
    'sz.m':           ['中','M','中','중','Vừa','M','M','M','M'],
    'sz.l':           ['大','L','大','대','Lớn','G','L','G','L'],
    'lbl.color':      ['色','Color','颜色','색','Màu','Color','Farbe','Couleur','اللون'],
    'lbl.opacity':    ['不透明度','Opacity','不透明度','불투명도','Độ mờ','Opacidad','Deckkraft','Opacité','الشفافية'],
    'lbl.width':      ['太さ','Width','粗细','굵기','Độ dày','Grosor','Stärke','Épaisseur','السماكة'],
    'lbl.stroke':     ['枠線','Border','边框','테두리','Viền','Borde','Rahmen','Bordure','الإطار'],
    'stroke.none':    ['線なし','None','无','없음','Không','Ninguno','Keine','Aucune','بلا'],
    'stroke.s':       ['小','S','小','소','Nhỏ','P','S','P','صغير'],
    'stroke.m':       ['中','M','中','중','Vừa','M','M','M','وسط'],
    'stroke.l':       ['大','L','大','대','Lớn','G','L','G','كبير'],
    'tip.stroke':     ['オブジェクト(枠塗り・長方形)の枠線の太さ','Border thickness of objects (frame/rectangle)','对象(框/矩形)的边框粗细','오브젝트(틀/사각형)의 테두리 굵기','Độ dày viền của đối tượng (khung/chữ nhật)','Grosor del borde de objetos (marco/rectángulo)','Rahmenstärke von Objekten (Rahmen/Rechteck)','Épaisseur de bordure des objets (cadre/rectangle)','سماكة إطار الكائنات (الإطار/المستطيل)'],
    'lbl.strokecolor':['線色','Line color','线色','선 색','Màu viền','Color de línea','Linienfarbe','Couleur de ligne','لون الخط'],
    'tip.strokecolor':['枠線(線)の色を選びます(塗り色とは独立)','Choose the border/line color (independent of fill)','选择边框(线)的颜色(与填充独立)','테두리(선) 색을 선택(칠과 독립)','Chọn màu viền (độc lập với màu tô)','Elige el color del borde/línea (independiente del relleno)','Wähle die Rahmen-/Linienfarbe (unabhängig von der Füllung)','Choisissez la couleur de bordure/ligne (indépendante du remplissage)','اختر لون الإطار/الخط (مستقل عن التعبئة)'],
    'tip.strokepalette':['枠線(線)の色パレット','Border/line color palette','边框(线)颜色面板','테두리(선) 색상 팔레트','Bảng màu viền','Paleta de color de línea','Linienfarbpalette','Palette de couleurs de ligne','لوحة ألوان الخط'],
    'lbl.selkind':    ['選択対象','Selectable','可选','선택 대상','Chọn được','Seleccionable','Auswählbar','Sélectionnable','قابل للتحديد'],
    'kind.text':      ['文字','Text','文字','문자','Chữ','Texto','Text','Texte','نص'],
    'kind.frame':     ['枠塗り','Frame','框','틀','Khung','Marco','Rahmen','Cadre','إطار'],
    'kind.rect':      ['長方形','Rect','矩形','사각형','Chữ nhật','Rect.','Rechteck','Rect.','مستطيل'],
    'kind.redact':    ['墨消し','Redact','涂黑','검정칠','Bôi đen','Tachado','Schwärzung','Caviardage','تعتيم'],
    'kind.paint':     ['塗り','Paint','涂色','칠','Tô','Relleno','Füllung','Remplissage','تعبئة'],
    'tip.selkind':    ['選択モードで選べるオブジェクトの種類','Object types selectable in select mode','选择模式中可选的对象类型','선택 모드에서 선택 가능한 종류','Loại đối tượng chọn được ở chế độ chọn','Tipos de objeto seleccionables en modo selección','Im Auswahlmodus auswählbare Objekttypen','Types d’objets sélectionnables en mode sélection','أنواع الكائنات القابلة للتحديد في وضع التحديد'],
    'lbl.text':       ['文字','Text','文字','문자','Chữ','Texto','Text','Texte','نص'],
    'lbl.lspace':     ['字間','Spacing','字间','자간','Giãn chữ','Espaciado','Abstand','Espacement','تباعد'],
    'tip.lspace':     ['文字の間隔(字間)を調整(0=標準)','Adjust spacing between characters (0 = normal)','调整字符间距(0=默认)','문자 간격 조정(0=기본)','Điều chỉnh khoảng cách giữa các chữ (0 = mặc định)','Ajusta el espacio entre caracteres (0 = normal)','Abstand zwischen Zeichen anpassen (0 = normal)','Ajuster l’espacement entre les caractères (0 = normal)','اضبط المسافة بين الأحرف (0 = عادي)'],
    'lbl.stamp':      ['スタンプ','Stamp','印章','스탬프','Dấu','Sello','Stempel','Tampon','ختم'],
    'lbl.align':      ['整列','Align','对齐','정렬','Căn','Alinear','Ausrichten','Aligner','محاذاة'],
    'lbl.gap':        ['隙間塞ぎ','Gap fill','补缝','틈 메움','Lấp khe','Rellenar hueco','Lücke','Combler','سد الفجوات'],
    'lbl.boost':      ['線を濃く','Darken lines','加深线条','선 진하게','Đậm nét','Resaltar líneas','Linien stärken','Renforcer traits','تغميق الخطوط'],
    'btn.textdetect': ['🔤 文字検出','🔤 Detect text','🔤 检测文字','🔤 문자 검출','🔤 Nhận chữ','🔤 Detectar texto','🔤 Text erkennen','🔤 Détecter texte','🔤 كشف النص'],
    'lbl.autovec':    ['塗りを自動ベクター化','Auto-vectorize fill','自动矢量化涂色','칠 자동 벡터화','Tự động vector hóa vùng tô','Auto-vectorizar relleno','Füllung auto-vektorisieren','Auto-vectoriser le remplissage','تحويل التعبئة تلقائيًا'],
    'tip.autovec':    ['塗るたびに自動でベクター図形に変換します','Automatically convert to vector shapes after each paint','每次涂色后自动转换为矢量图形','칠할 때마다 자동으로 벡터 도형으로 변환','Tự động chuyển thành hình vector sau mỗi lần tô','Convierte automáticamente en formas vectoriales tras cada pintada','Wandelt nach jedem Malen automatisch in Vektorformen um','Convertit automatiquement en formes vectorielles après chaque peinture','يحوّل تلقائيًا إلى أشكال متجهة بعد كل تعبئة'],
    'btn.undo':       ['↶ 戻す','↶ Undo','↶ 撤销','↶ 실행취소','↶ Hoàn tác','↶ Deshacer','↶ Rückgängig','↶ Annuler','↶ تراجع'],
    'btn.redo':       ['↷ 進む','↷ Redo','↷ 重做','↷ 다시실행','↷ Làm lại','↷ Rehacer','↷ Wiederh.','↷ Rétablir','↷ إعادة'],
    'btn.clear':      ['🗑 全消去','🗑 Clear all','🗑 全部清除','🗑 모두 지움','🗑 Xóa hết','🗑 Borrar todo','🗑 Alles löschen','🗑 Tout effacer','🗑 مسح الكل'],
    'btn.shortcuts':  ['⌨ ショートカット','⌨ Shortcuts','⌨ 快捷键','⌨ 단축키','⌨ Phím tắt','⌨ Atajos','⌨ Tastenkürzel','⌨ Raccourcis','⌨ الاختصارات'],
    'btn.fit':        ['⤢ 全体','⤢ Fit','⤢ 适应','⤢ 전체','⤢ Vừa khung','⤢ Ajustar','⤢ Anpassen','⤢ Ajuster','⤢ ملاءمة'],
    'btn.svg':        ['💾 SVG','💾 SVG','💾 SVG','💾 SVG','💾 SVG','💾 SVG','💾 SVG','💾 SVG','💾 SVG'],
    'btn.png':        ['🖼 PNG','🖼 PNG','🖼 PNG','🖼 PNG','🖼 PNG','🖼 PNG','🖼 PNG','🖼 PNG','🖼 PNG'],
    'btn.pdf':        ['📕 PDF','📕 PDF','📕 PDF','📕 PDF','📕 PDF','📕 PDF','📕 PDF','📕 PDF','📕 PDF'],
    'msg.svgedit':    ['💾 SVGは編集可能（開き直して再編集できます）','💾 SVG is re-editable (reopen to edit)','💾 SVG 可再次编辑（重新打开即可编辑）','💾 SVG 재편집 가능 (다시 열어 편집)','💾 SVG có thể chỉnh lại (mở lại để sửa)','💾 SVG es reeditable (reábrelo para editar)','💾 SVG ist erneut bearbeitbar (erneut öffnen)','💾 SVG ré-éditable (rouvrir pour modifier)','💾 يمكن تحرير SVG لاحقًا (افتحه للتعديل)'],
    'lbl.vecsave':    ['ベクターで保存','Save as vector','按矢量保存','벡터로 저장','Lưu dạng vector','Guardar como vector','Als Vektor speichern','Enregistrer en vectoriel','حفظ كمتجه'],
    'btn.printall':   ['🖨 印刷','🖨 Print','🖨 打印','🖨 인쇄','🖨 In','🖨 Imprimir','🖨 Drucken','🖨 Imprimer','🖨 طباعة'],
    'btn.printtext':  ['🖨 文字だけ','🖨 Text only','🖨 仅文字','🖨 문자만','🖨 Chỉ chữ','🖨 Solo texto','🖨 Nur Text','🖨 Texte seul','🖨 النص فقط'],
    'btn.logout':     ['⎋ ログアウト','⎋ Log out','⎋ 退出','⎋ 로그아웃','⎋ Đăng xuất','⎋ Salir','⎋ Abmelden','⎋ Déconnexion','⎋ تسجيل الخروج'],
    'btn.mypage':     ['👤 マイページ','👤 My Page','👤 我的页面','👤 마이페이지','👤 Trang của tôi','👤 Mi página','👤 Mein Konto','👤 Mon espace','👤 صفحتي'],
    'btn.help':       ['❓ 操作説明','❓ Help','❓ 操作说明','❓ 사용법','❓ Hướng dẫn','❓ Ayuda','❓ Hilfe','❓ Aide','❓ مساعدة'],
    'tip.help':       ['操作説明を開く(編集中のデータは保持)','Open the help guide (your work is kept)','打开操作说明(保留编辑中的数据)','사용법 열기(편집 중 데이터 유지)','Mở hướng dẫn (giữ dữ liệu đang chỉnh sửa)','Abrir la ayuda (se conserva tu trabajo)','Hilfe öffnen (Bearbeitung bleibt erhalten)','Ouvrir l’aide (votre travail est conservé)','افتح دليل الاستخدام (مع حفظ عملك)'],
    'btn.admin':      ['🛠 管理','🛠 Admin','🛠 管理','🛠 관리','🛠 Quản trị','🛠 Admin','🛠 Verwaltung','🛠 Admin','🛠 الإدارة'],
    // ---- ログイン/登録/マイページ 共通 ----
    'auth.login':     ['ログイン','Log in','登录','로그인','Đăng nhập','Iniciar sesión','Anmelden','Connexion','تسجيل الدخول'],
    'auth.loginreg':  ['ログイン / 新規登録','Log in / Sign up','登录 / 注册','로그인 / 회원가입','Đăng nhập / Đăng ký','Iniciar sesión / Registrarse','Anmelden / Registrieren','Connexion / Inscription','تسجيل الدخول / إنشاء حساب'],
    'auth.username':  ['ユーザー名','Username','用户名','사용자명','Tên đăng nhập','Usuario','Benutzername','Identifiant','اسم المستخدم'],
    'auth.password':  ['パスワード','Password','密码','비밀번호','Mật khẩu','Contraseña','Passwort','Mot de passe','كلمة المرور'],
    'auth.demo':      ['🎬 DEMOでお試し（15分）','🎬 Try DEMO (15 min)','🎬 试用 DEMO（15分钟）','🎬 DEMO 체험 (15분)','🎬 Dùng thử DEMO (15 phút)','🎬 Probar DEMO (15 min)','🎬 DEMO testen (15 Min.)','🎬 Essai DEMO (15 min)','🎬 جرّب DEMO (15 دقيقة)'],
    'auth.register':  ['新規登録','Sign up','注册','회원가입','Đăng ký','Registrarse','Registrieren','S’inscrire','إنشاء حساب'],
    'auth.noacct':    ['アカウントをお持ちでない方は','Don’t have an account?','还没有账户？','계정이 없으신가요?','Chưa có tài khoản?','¿No tienes cuenta?','Kein Konto?','Pas de compte ?','ليس لديك حساب؟'],
    'my.account':     ['アカウント','Account','账户','계정','Tài khoản','Cuenta','Konto','Compte','الحساب'],
    'my.sub':         ['サブスクリプション（月額）','Subscription (monthly)','订阅（按月）','구독 (월정액)','Gói thuê (tháng)','Suscripción (mensual)','Abo (monatlich)','Abonnement (mensuel)','الاشتراك (شهري)'],
    'my.subscribe':   ['月額プランに加入する','Subscribe to monthly plan','订阅月度套餐','월정액 가입','Đăng ký gói tháng','Suscribirse al plan mensual','Monatsplan abonnieren','S’abonner au plan mensuel','الاشتراك في الخطة الشهرية'],
    'my.manage':      ['契約・支払い方法の管理','Manage billing','管理订阅与付款','결제·구독 관리','Quản lý thanh toán','Gestionar pago','Abrechnung verwalten','Gérer la facturation','إدارة الفوترة'],
    'my.changepw':    ['パスワード変更','Change password','修改密码','비밀번호 변경','Đổi mật khẩu','Cambiar contraseña','Passwort ändern','Changer le mot de passe','تغيير كلمة المرور'],
    'my.toapp':       ['← アプリへ戻る','← Back to app','← 返回应用','← 앱으로','← Về ứng dụng','← Volver a la app','← Zur App','← Retour à l’app','← العودة إلى التطبيق'],
    'nav.free':       ['無料で試す','Try for free','免费试用','무료 체험','Dùng thử miễn phí','Probar gratis','Kostenlos testen','Essai gratuit','جرّب مجانًا'],
    // ---- LPヒーロー(非日本語用の汎用タイトル) ----
    'hero.eyebrow':   ['不動産仲介のための公図ツール','Cadastral map tool for real estate','面向房产中介的地籍图工具','부동산 중개용 지적도 도구','Công cụ bản đồ địa chính cho BĐS','Herramienta catastral para inmobiliarias','Katastertool für Immobilien','Outil cadastral pour l’immobilier','أداة خرائط مساحية للعقارات'],
    'hero.title':     ['PDF・画像の文字入れエディター','Text Editor for PDFs & Images','PDF·图片 文字编辑器','PDF·이미지 문자 입력 편집기','Trình thêm chữ cho PDF & ảnh','Editor de texto para PDF e imágenes','Text-Editor für PDFs & Bilder','Éditeur de texte pour PDF et images','محرّر نصوص لملفات PDF والصور'],
    'hero.sub':       ['PDFや画像に文字・注記を加えて、そのまま印刷。定型用紙への重ね刷りもできます。','Add text and notes to PDFs and images, then print — including overlay onto preprinted forms.','给PDF和图片添加文字与批注并直接打印，也可叠印到现成表格上。','PDF·이미지에 문자·주석을 더해 그대로 인쇄. 양식지 겹쳐 인쇄도 가능합니다.','Thêm chữ và ghi chú vào PDF, ảnh rồi in — kể cả in chồng lên mẫu có sẵn.','Añade texto y notas a PDF e imágenes e imprime, incluso sobre formularios preimpresos.','Text und Notizen zu PDFs und Bildern hinzufügen und drucken – auch als Überdruck.','Ajoutez texte et notes aux PDF et images, puis imprimez — même en surimpression.','أضف نصوصًا وملاحظات إلى ملفات PDF والصور ثم اطبع — بما في ذلك الطباعة فوق النماذج المطبوعة مسبقًا.'],
    'hero.demo':      ['DEMOを無料で試す','Try DEMO free','免费试用 DEMO','DEMO 무료 체험','Dùng thử DEMO miễn phí','Probar DEMO gratis','DEMO kostenlos testen','Essayer la DEMO','جرّب DEMO مجانًا'],
    'hero.features':  ['機能を見る','See features','查看功能','기능 보기','Xem tính năng','Ver funciones','Funktionen ansehen','Voir les fonctions','عرض الميزات'],
    'trust.noreg':    ['登録不要','No sign-up','无需注册','가입 불필요','Không cần đăng ký','Sin registro','Keine Anmeldung','Sans inscription','بدون تسجيل'],
    'trust.try':      ['15分でお試し','15-min trial','15分钟试用','15분 체험','Dùng thử 15 phút','Prueba de 15 min','15-Min-Test','Essai de 15 min','تجربة 15 دقيقة'],
    'trust.browser':  ['ブラウザで完結','Runs in browser','浏览器即可使用','브라우저로 완결','Chạy trên trình duyệt','En el navegador','Im Browser','Dans le navigateur','يعمل في المتصفح'],
    // ---- 機能セクション(非日本語は文字機能中心) ----
    'feat.eyebrow':   ['できること','What you can do','功能','할 수 있는 것','Tính năng','Qué puedes hacer','Funktionen','Possibilités','ما يمكنك فعله'],
    'feat.head':      ['塗る・書く・刷る。公図まわりの作業を、これ一つで。','Type, annotate, and print — all in one.','输入、批注、打印，一站搞定。','입력·주석·인쇄를 하나로.','Nhập chữ, chú thích, in — tất cả trong một.','Escribe, anota e imprime, todo en uno.','Schreiben, kommentieren, drucken – alles in einem.','Saisir, annoter, imprimer — tout en un.','اكتب، علّق، واطبع — الكل في واحد.'],
    'feat1.t':        ['公図に色付け','One-click coloring','一键着色','원클릭 색칠','Tô màu một chạm','Coloreado con un clic','Färben per Klick','Coloriage en un clic','تلوين بنقرة واحدة'],
    'feat1.d':        ['対象地をワンクリックで着色。「この物件です」がひと目で伝わるマイソクに。','Fill any enclosed area with one click to highlight it clearly.','一键填充任意封闭区域，重点一目了然。','닫힌 영역을 한 번에 채워 강조합니다.','Tô vùng kín chỉ với một chạm để làm nổi bật.','Rellena cualquier área cerrada con un clic para resaltarla.','Beliebige Fläche per Klick füllen und hervorheben.','Remplissez toute zone close d’un clic pour la mettre en valeur.','عبّئ أي منطقة مغلقة بنقرة واحدة لإبرازها بوضوح.'],
    'feat2.t':        ['公図に文字入れ','Add text & labels','添加文字与标注','문자·라벨 추가','Thêm chữ & nhãn','Añadir texto y etiquetas','Text & Beschriftung','Texte et étiquettes','إضافة نص وعلامات'],
    'feat2.d':        ['地番・方位・コメントを自由に追記。手書きの書き込みは、もう要りません。','Add labels, directions, and comments freely — no more handwriting.','自由添加标注、方位与备注，告别手写。','라벨·방향·메모를 자유롭게 추가, 손글씨 불필요.','Thêm nhãn, hướng, ghi chú tự do — không cần viết tay.','Añade etiquetas, direcciones y notas libremente, sin escritura a mano.','Beschriftungen, Richtungen und Notizen frei hinzufügen – ohne Handschrift.','Ajoutez librement étiquettes, repères et notes — fini l’écriture manuscrite.','أضف العلامات والاتجاهات والملاحظات بحرية — دون كتابة يدوية.'],
    'feat3.t':        ['PDFに文字入れ','Type onto PDFs','在PDF上输入文字','PDF에 문자 입력','Nhập chữ lên PDF','Escribir sobre PDF','Text in PDFs','Saisir sur PDF','الكتابة على PDF'],
    'feat3.d':        ['受け取ったPDF資料にそのまま記入。印刷→手書き→スキャンの往復をカット。','Type directly onto received PDFs — skip print, handwrite, and scan.','直接在收到的PDF上填写，省去打印手写扫描。','받은 PDF에 바로 입력 — 인쇄·손글씨·스캔 불필요.','Nhập trực tiếp lên PDF nhận được — bỏ in, viết tay, quét.','Escribe directamente en PDF recibidos: sin imprimir, escribir a mano ni escanear.','Direkt in erhaltene PDFs schreiben – ohne Drucken, Schreiben, Scannen.','Saisissez directement sur les PDF reçus — sans imprimer, écrire, scanner.','اكتب مباشرة على ملفات PDF المستلمة — دون طباعة وكتابة ومسح.'],
    'feat4.t':        ['定型用紙へ重ね刷り','Overlay print on forms','叠印到表格','양식지 겹쳐 인쇄','In chồng lên mẫu','Sobreimpresión en formularios','Überdruck auf Vordrucke','Surimpression sur formulaires','طباعة فوق النماذج'],
    'feat4.d':        ['印刷済みの用紙に、文字だけをピッタリ位置合わせ。申込書・契約書類の記入を自動化。','Print just the text precisely onto preprinted forms — automate form filling.','仅将文字精确叠印到现成表格上，自动填表。','인쇄된 양식에 문자만 정확히 겹쳐 인쇄, 서식 작성 자동화.','In chính xác phần chữ lên mẫu in sẵn — tự động điền biểu mẫu.','Imprime solo el texto con precisión sobre formularios preimpresos.','Nur den Text passgenau auf Vordrucke drucken – Formulare automatisch ausfüllen.','Imprimez uniquement le texte au bon endroit sur des formulaires préimprimés.','اطبع النص فقط بدقة فوق النماذج المطبوعة مسبقًا — أتمتة تعبئة النماذج.'],
    // ---- ナビ ----
    'nav.features':   ['機能','Features','功能','기능','Tính năng','Funciones','Funktionen','Fonctions','الميزات'],
    'nav.howto':      ['使い方','How to','使用方法','사용법','Cách dùng','Cómo usar','Anleitung','Utilisation','طريقة الاستخدام'],
    'nav.price':      ['料金','Pricing','价格','요금','Giá','Precios','Preise','Tarifs','الأسعار'],
    'nav.help':       ['操作説明','Help','操作说明','사용법','Hướng dẫn','Ayuda','Hilfe','Aide','مساعدة'],
    // ---- マイソクカード ----
    'mai.label':      ['物件資料（マイソク）','Document preview','资料预览','자료 미리보기','Bản xem tài liệu','Vista del documento','Dokumentvorschau','Aperçu du document','معاينة المستند'],
    'mai.tag':        ['色付け済み','Edited','已编辑','편집됨','Đã sửa','Editado','Bearbeitet','Modifié','مُحرَّر'],
    'mai.cap':        ['対象地をワンクリックで着色 → マイソクにそのまま貼り付け','Add color & text, then paste into your document','着色加字后直接贴入资料','색·문자 추가 후 자료에 붙여넣기','Tô màu·thêm chữ rồi dán vào tài liệu','Colorea y añade texto, luego pégalo en tu documento','Färben & beschriften, dann ins Dokument einfügen','Colorez et annotez, puis collez dans votre document','أضف لونًا ونصًا ثم الصقه في مستندك'],
    // ---- 使い方(STEPS) ----
    'step.eyebrow':   ['使い方','How it works','使用步骤','사용 방법','Cách hoạt động','Cómo funciona','So geht’s','Comment ça marche','كيف يعمل'],
    'step.head':      ['開いて、塗って、印刷するだけ。','Open, edit, and print.','打开、编辑、打印。','열고, 편집하고, 인쇄.','Mở, sửa, in.','Abrir, editar e imprimir.','Öffnen, bearbeiten, drucken.','Ouvrir, modifier, imprimer.','افتح، حرّر، واطبع.'],
    'step1.t':        ['公図・PDFを開く','Open a PDF or image','打开PDF或图片','PDF·이미지 열기','Mở PDF hoặc ảnh','Abrir PDF o imagen','PDF oder Bild öffnen','Ouvrir un PDF ou une image','افتح PDF أو صورة'],
    'step1.d':        ['取得した公図やPDFを読み込むだけ。','Just load your PDF or image.','只需载入你的PDF或图片。','PDF·이미지를 불러오기만 하면 됩니다.','Chỉ cần tải PDF hoặc ảnh của bạn.','Solo carga tu PDF o imagen.','Einfach PDF oder Bild laden.','Chargez simplement votre PDF ou image.','فقط حمّل ملف PDF أو الصورة.'],
    'step2.t':        ['塗る・書く','Color & write','着色与书写','색칠·작성','Tô & viết','Colorear y escribir','Färben & schreiben','Colorier et écrire','لوّن واكتب'],
    'step2.d':        ['対象地を着色し、地番やコメントを記入。','Color areas and add text or comments.','给区域着色并添加文字或备注。','영역을 색칠하고 문자·메모를 추가.','Tô vùng và thêm chữ, ghi chú.','Colorea áreas y añade texto o notas.','Bereiche färben und Text/Notizen hinzufügen.','Coloriez des zones et ajoutez texte ou notes.','لوّن المناطق وأضف نصًا أو ملاحظات.'],
    'step3.t':        ['印刷・保存','Print & save','打印与保存','인쇄·저장','In & lưu','Imprimir y guardar','Drucken & speichern','Imprimer et enregistrer','اطبع واحفظ'],
    'step3.d':        ['そのまま印刷、または画像で保存してマイソクへ。','Print directly, or save as an image.','直接打印，或保存为图片。','바로 인쇄하거나 이미지로 저장.','In trực tiếp hoặc lưu thành ảnh.','Imprime directamente o guárdalo como imagen.','Direkt drucken oder als Bild speichern.','Imprimez directement ou enregistrez en image.','اطبع مباشرة أو احفظ كصورة.'],
    'step.help':      ['詳しい操作説明を見る','View detailed help','查看详细操作说明','자세한 사용법 보기','Xem hướng dẫn chi tiết','Ver la guía detallada','Ausführliche Hilfe ansehen','Voir le guide détaillé','عرض دليل الاستخدام المفصل'],
    // ---- ビフォーアフター ----
    'ba.eyebrow':     ['ビフォー・アフター','Before / After','前后对比','비포·애프터','Trước / Sau','Antes / Después','Vorher / Nachher','Avant / Après','قبل / بعد'],
    'ba.head':        ['色をひと塗りで、伝わり方が変わる。','One stroke of color changes everything.','一抹颜色，表达截然不同。','색 한 번으로 전달이 달라집니다.','Một nét màu thay đổi tất cả.','Un toque de color lo cambia todo.','Ein Farbstrich verändert alles.','Une touche de couleur change tout.','لمسة لون واحدة تغيّر كل شيء.'],
    'ba.before':      ['塗る前','Before','着色前','색칠 전','Trước','Antes','Vorher','Avant','قبل'],
    'ba.beforeT':     ['どの土地か分かりにくい','Hard to tell which one','难以分辨是哪块','어느 것인지 알기 어려움','Khó nhận ra cái nào','Difícil de distinguir','Schwer erkennbar','Difficile à distinguer','يصعب تمييز أيها'],
    'ba.after':       ['塗った後','After','着色后','색칠 후','Sau','Después','Nachher','Après','بعد'],
    'ba.afterT':      ['対象地がひと目で分かる','Clear at a glance','一目了然','한눈에 알 수 있음','Rõ ngay lập tức','Claro de un vistazo','Auf einen Blick klar','Clair d’un coup d’œil','واضح بلمحة'],
    // ---- 料金 ----
    'price.eyebrow':  ['料金プラン','Pricing','价格方案','요금제','Bảng giá','Planes','Preise','Tarifs','الأسعار'],
    'price.head':     ['シンプルに、ひとり月1,000円。','Simple: ¥1,000 per user / month.','简单：每人每月1,000日元。','심플하게 1인 월 1,000엔.','Đơn giản: 1.000￥/người/tháng.','Simple: 1.000￥ por usuario/mes.','Einfach: 1.000￥ pro Nutzer/Monat.','Simple : 1 000￥ par utilisateur/mois.','ببساطة: 1000￥ لكل مستخدم/شهر.'],
    'price.name':     ['スタンダードプラン','Standard plan','标准方案','스탠다드 플랜','Gói tiêu chuẩn','Plan estándar','Standard-Plan','Plan standard','الخطة القياسية'],
    'price.for':      ['1ユーザーあたり','per user','每位用户','사용자당','mỗi người dùng','por usuario','pro Nutzer','par utilisateur','لكل مستخدم'],
    'price.unit':     [' / 月（税別）',' / month (excl. tax)',' / 月（不含税）',' / 월 (세별)',' / tháng (chưa thuế)',' / mes (sin IVA)',' / Monat (zzgl. MwSt.)',' / mois (HT)',' / شهر (بدون ضريبة)'],
    'price.note':     ['全機能込み・追加料金なし','All features, no extra fees','含全部功能，无附加费','전 기능 포함·추가요금 없음','Đủ tính năng, không phí thêm','Todas las funciones, sin extras','Alle Funktionen, keine Zusatzkosten','Toutes les fonctions, sans frais','كل الميزات، بدون رسوم إضافية'],
    'price.f1':       ['公図の色付け・文字入れ','Color & text on maps/files','地图/文件着色与文字','지도/파일 색·문자','Tô màu & chữ trên tệp','Color y texto en archivos','Farbe & Text in Dateien','Couleur et texte sur fichiers','لون ونص على الملفات'],
    'price.f2':       ['PDFへの文字入れ','Add text to PDFs','PDF文字输入','PDF 문자 입력','Thêm chữ vào PDF','Texto en PDF','Text in PDFs','Texte sur PDF','إضافة نص إلى PDF'],
    'price.f3':       ['定型用紙への重ね刷り印刷','Overlay printing on forms','表格叠印','양식 겹쳐 인쇄','In chồng lên mẫu','Sobreimpresión en formularios','Überdruck auf Vordrucke','Surimpression sur formulaires','طباعة فوق النماذج'],
    'price.f4':       ['インストール不要・ブラウザで完結','No install — runs in the browser','无需安装，浏览器即用','설치 불필요·브라우저 완결','Không cài đặt — chạy trên trình duyệt','Sin instalación, en el navegador','Keine Installation – im Browser','Sans installation — dans le navigateur','بدون تثبيت — يعمل في المتصفح'],
    'price.cta':      ['このプランで始める','Get started','开始使用','이 플랜으로 시작','Bắt đầu với gói này','Empezar con este plan','Mit diesem Plan starten','Commencer avec ce plan','ابدأ بهذه الخطة'],
    'price.demo':     ['まずは無料DEMOでお試しいただけます。','You can try the free DEMO first.','可先免费试用 DEMO。','먼저 무료 DEMO를 사용해 보세요.','Bạn có thể dùng thử DEMO miễn phí trước.','Puedes probar la DEMO gratis primero.','Sie können zuerst die kostenlose DEMO testen.','Vous pouvez d’abord essayer la DEMO gratuite.','يمكنك تجربة DEMO المجانية أولًا.'],
    // ---- 最終CTA ----
    'final.head':     ['まずは15分、無料で試す。','Try free for 15 minutes.','先免费试用15分钟。','우선 15분 무료 체험.','Dùng thử miễn phí 15 phút.','Pruébalo gratis 15 minutos.','15 Minuten kostenlos testen.','Essayez gratuitement 15 minutes.','جرّبه مجانًا لمدة 15 دقيقة.'],
    'final.sub':      ['登録不要。お手元の公図を読み込んで、色付けの手軽さをそのまま体験してください。','No sign-up. Load a file and experience how easy it is.','无需注册。载入文件，亲身体验它的简单。','가입 불필요. 파일을 불러와 간편함을 체험하세요.','Không cần đăng ký. Tải tệp và trải nghiệm sự đơn giản.','Sin registro. Carga un archivo y comprueba lo fácil que es.','Keine Anmeldung. Datei laden und Einfachheit erleben.','Sans inscription. Chargez un fichier et constatez la simplicité.','بدون تسجيل. حمّل ملفًا واختبر مدى سهولته.'],
    'final.t1':       ['クレジットカード不要','No credit card','无需信用卡','신용카드 불필요','Không cần thẻ','Sin tarjeta','Keine Kreditkarte','Sans carte bancaire','بدون بطاقة ائتمان'],
    'final.t2':       ['インストール不要','No install','无需安装','설치 불필요','Không cài đặt','Sin instalación','Keine Installation','Sans installation','بدون تثبيت'],
    'final.t3':       ['すぐに使える','Ready to use','即刻可用','바로 사용','Dùng được ngay','Listo para usar','Sofort einsatzbereit','Prêt à l’emploi','جاهز للاستخدام'],
    // ---- ブランド/副題/メッセージ ----
    'brand':          ['公図色付け','Map & PDF Editor','地图·PDF编辑器','지도·PDF 편집기','Trình sửa bản đồ/PDF','Editor de mapas/PDF','Karten- & PDF-Editor','Éditeur carte/PDF','محرّر الخرائط وPDF'],
    'auth.subtitle':  ['公図色付けにログインします','Sign in to continue','登录以继续','로그인하여 계속','Đăng nhập để tiếp tục','Inicia sesión para continuar','Zum Fortfahren anmelden','Connectez-vous pour continuer','سجّل الدخول للمتابعة'],
    'msg.badcreds':   ['ユーザー名またはパスワードが違います','Incorrect username or password','用户名或密码错误','사용자명 또는 비밀번호가 틀립니다','Sai tên đăng nhập hoặc mật khẩu','Usuario o contraseña incorrectos','Benutzername oder Passwort falsch','Identifiant ou mot de passe incorrect','اسم المستخدم أو كلمة المرور غير صحيح'],
    'msg.neterr':     ['通信エラーが発生しました','A network error occurred','发生通信错误','통신 오류가 발생했습니다','Đã xảy ra lỗi kết nối','Se produjo un error de red','Ein Netzwerkfehler ist aufgetreten','Une erreur réseau s’est produite','حدث خطأ في الاتصال'],
    'msg.registered': ['登録が完了しました。ログインしてください。','Registration complete. Please log in.','注册完成，请登录。','등록이 완료되었습니다. 로그인하세요.','Đăng ký hoàn tất. Vui lòng đăng nhập.','Registro completado. Inicia sesión.','Registrierung abgeschlossen. Bitte anmelden.','Inscription terminée. Veuillez vous connecter.','اكتمل التسجيل. يرجى تسجيل الدخول.'],
    // ---- アプリ内: フォント/縦横書き/空状態 ----
    'font.gothic':    ['ゴシック','Gothic','黑体','고딕','Gothic','Gótica','Grotesk','Gothique','قوطي'],
    'font.mincho':    ['明朝','Mincho','明朝','명조','Mincho','Mincho','Mincho','Mincho','مينشو'],
    'txt.horiz':      ['横書き','Horizontal','横排','가로쓰기','Ngang','Horizontal','Horizontal','Horizontal','أفقي'],
    'txt.vert':       ['縦書き','Vertical','竖排','세로쓰기','Dọc','Vertical','Vertikal','Vertical','عمودي'],
    'empty.title':    ['ここに PDF / SVG / 画像 をドラッグ＆ドロップ、または「ファイルを選択」','Drag & drop a PDF / SVG / image here, or use "Choose file"','将 PDF / SVG / 图片 拖放到此处，或点击“选择文件”','여기에 PDF / SVG / 이미지를 끌어다 놓거나 "파일 선택"','Kéo & thả PDF / SVG / ảnh vào đây, hoặc "Chọn tệp"','Arrastra un PDF / SVG / imagen aquí, o usa "Elegir archivo"','PDF / SVG / Bild hierher ziehen oder "Datei wählen"','Glissez un PDF / SVG / image ici, ou "Choisir un fichier"','اسحب وأفلت PDF / SVG / صورة هنا، أو "اختر ملفًا"'],
    'empty.hint':     ['PDF はSVG化して読み込みます（SVG・画像はそのまま）','PDFs are loaded as SVG (SVG & images as-is)','PDF 会转为 SVG 载入（SVG·图片原样）','PDF는 SVG로 변환해 불러옵니다','PDF được nạp dưới dạng SVG','Los PDF se cargan como SVG','PDFs werden als SVG geladen','Les PDF sont chargés en SVG','يتم تحميل PDF كـ SVG'],
    // ---- ショートカット一覧 ----
    'sc.title':       ['ショートカットキー','Keyboard shortcuts','快捷键','단축키','Phím tắt','Atajos de teclado','Tastenkürzel','Raccourcis clavier','اختصارات لوحة المفاتيح'],
    'sc.undo':        ['取り消し / やり直し','Undo / Redo','撤销/重做','실행취소/다시실행','Hoàn tác/Làm lại','Deshacer/Rehacer','Rückgängig/Wiederh.','Annuler/Rétablir','تراجع/إعادة'],
    'sc.selall':      ['全選択（文字枠）','Select all (text)','全选（文字）','전체 선택(문자)','Chọn tất cả (chữ)','Seleccionar todo','Alles auswählen','Tout sélectionner','تحديد الكل (النص)'],
    'sc.copy':        ['コピー / 貼り付け','Copy / Paste','复制/粘贴','복사/붙여넣기','Sao chép/Dán','Copiar/Pegar','Kopieren/Einfügen','Copier/Coller','نسخ/لصق'],
    'sc.dup':         ['複製','Duplicate','复制副本','복제','Nhân bản','Duplicar','Duplizieren','Dupliquer','تكرار'],
    'sc.del':         ['削除','Delete','删除','삭제','Xóa','Eliminar','Löschen','Supprimer','حذف'],
    'sc.move':        ['選択枠を移動','Move selection','移动所选','선택 이동','Di chuyển vùng chọn','Mover selección','Auswahl verschieben','Déplacer la sélection','نقل التحديد'],
    'sc.desel':       ['選択解除','Deselect','取消选择','선택 해제','Bỏ chọn','Deseleccionar','Auswahl aufheben','Désélectionner','إلغاء التحديد'],
    'sc.zoom':        ['拡大 / 縮小','Zoom in / out','放大/缩小','확대/축소','Phóng to/thu nhỏ','Acercar/Alejar','Vergrößern/Verkleinern','Zoom avant/arrière','تكبير/تصغير'],
    'sc.line':        ['直線で描く（ブラシ）','Draw a straight line (brush)','画直线（画笔）','직선 그리기(브러시)','Vẽ đường thẳng (bút)','Dibujar línea recta','Gerade Linie zeichnen','Tracer une ligne droite','رسم خط مستقيم (فرشاة)'],
    'sc.help':        ['このヘルプ','This help','本帮助','이 도움말','Trợ giúp này','Esta ayuda','Diese Hilfe','Cette aide','هذه المساعدة'],
    'sc.tip':         ['「?」キーでいつでも表示できます','Press "?" anytime to show this','随时按“?”键显示','언제든 "?" 키로 표시','Nhấn "?" để hiện bất cứ lúc nào','Pulsa "?" para mostrar','Mit "?" jederzeit anzeigen','Appuyez sur « ? » à tout moment','اضغط "?" للعرض في أي وقت'],
    'kbd.move':       ['↑ ↓ ← →（Shiftで大きく）','↑ ↓ ← → (Shift = larger)','↑ ↓ ← →（Shift更大）','↑ ↓ ← →(Shift=크게)','↑ ↓ ← → (Shift = lớn)','↑ ↓ ← → (Shift = más)','↑ ↓ ← → (Shift = größer)','↑ ↓ ← → (Maj = plus)','↑ ↓ ← → (Shift = أكبر)'],
    'kbd.zoom':       ['Ctrl + ＋ / －（Ctrl+ホイール）','Ctrl + ＋ / － (Ctrl+wheel)','Ctrl + ＋ / －（Ctrl+滚轮）','Ctrl + ＋ / －(Ctrl+휠)','Ctrl + ＋ / － (Ctrl+lăn)','Ctrl + ＋ / － (Ctrl+rueda)','Ctrl + ＋ / － (Ctrl+Rad)','Ctrl + ＋ / － (Ctrl+molette)','Ctrl + ＋ / － (Ctrl+عجلة)'],
    'kbd.line':       ['Shift+ドラッグ（5°刻み）','Shift+drag (5° steps)','Shift+拖动（5°）','Shift+드래그(5°)','Shift+kéo (5°)','Shift+arrastrar (5°)','Shift+Ziehen (5°)','Maj+glisser (5°)','Shift+سحب (5°)'],
    // ---- 操作メッセージ / バナー ----
    'm.loadfail':     ['読み込みに失敗しました: ','Failed to load: ','加载失败：','불러오기 실패: ','Tải thất bại: ','Error al cargar: ','Laden fehlgeschlagen: ','Échec du chargement : ','فشل التحميل: '],
    'm.pdfpw':        ['このPDFを開くにはパスワードが必要です。パスワードを入力してください。','This PDF is password-protected. Please enter the password.','此 PDF 需要密码，请输入密码。','이 PDF는 비밀번호가 필요합니다. 입력하세요.','PDF này cần mật khẩu. Vui lòng nhập.','Este PDF requiere contraseña. Introdúcela.','Dieses PDF benötigt ein Passwort. Bitte eingeben.','Ce PDF nécessite un mot de passe. Saisissez-le.','هذا الملف محمي بكلمة مرور. أدخلها.'],
    'm.pdfpw2':       ['パスワードが違います。再入力してください。','Incorrect password. Please try again.','密码错误，请重试。','비밀번호가 틀립니다. 다시 입력하세요.','Sai mật khẩu. Thử lại.','Contraseña incorrecta. Inténtalo de nuevo.','Falsches Passwort. Bitte erneut.','Mot de passe incorrect. Réessayez.','كلمة المرور غير صحيحة. أعد المحاولة.'],
    'm.delpage':      ['最後の1ページを削除します（読み込んだ図面が全て消えます）。よろしいですか？','Delete the last page? All loaded content will be lost. Continue?','删除最后一页（已载入内容将全部清除），确定吗？','마지막 페이지를 삭제합니다(전체 삭제). 계속할까요?','Xóa trang cuối (mất toàn bộ nội dung)? Tiếp tục?','¿Borrar la última página? Se perderá todo. ¿Continuar?','Letzte Seite löschen? Alles geht verloren. Fortfahren?','Supprimer la dernière page ? Tout sera perdu. Continuer ?','حذف الصفحة الأخيرة؟ سيُفقد كل المحتوى. متابعة؟'],
    'm.delpageN':     ['このページを削除しますか？','Delete this page?','删除此页？','이 페이지를 삭제할까요?','Xóa trang này?','¿Borrar esta página?','Diese Seite löschen?','Supprimer cette page ?','حذف هذه الصفحة؟'],
    'm.clearconfirm': ['このページの色（塗り・ブラシ・枠塗り）をすべて消去します。よろしいですか？','Erase all colors (fill, brush, frame) on this page. Continue?','将清除本页所有颜色（填充·画笔·框线）。确定吗？','이 페이지의 색(채우기·브러시·프레임)을 모두 지웁니다. 계속할까요?','Xóa toàn bộ màu (tô, bút, khung) trên trang này? Tiếp tục?','Se borrarán todos los colores (relleno, pincel, marco) de esta página. ¿Continuar?','Alle Farben (Füllung, Pinsel, Rahmen) dieser Seite werden gelöscht. Fortfahren?','Toutes les couleurs (remplissage, pinceau, cadre) de cette page seront effacées. Continuer ?','سيتم مسح كل الألوان (التعبئة، الفرشاة، الإطار) في هذه الصفحة. متابعة؟'],
    'm.clearconfirmtext': ['このページの文字・スタンプをすべて消去します。よろしいですか？','Erase all text and stamps on this page. Continue?','将清除本页所有文字与印章。确定吗？','이 페이지의 문자·스탬프를 모두 지웁니다. 계속할까요?','Xóa toàn bộ chữ và dấu trên trang này? Tiếp tục?','Se borrarán todos los textos y sellos de esta página. ¿Continuar?','Alle Texte und Stempel dieser Seite werden gelöscht. Fortfahren?','Tous les textes et tampons de cette page seront effacés. Continuer ?','سيتم مسح كل النصوص والأختام في هذه الصفحة. متابعة؟'],
    'm.clearconfirmframe': ['このページの枠塗りをすべて消去します。よろしいですか？','Erase all frame fills on this page. Continue?','将清除本页所有框线填充。确定吗？','이 페이지의 프레임 칠을 모두 지웁니다. 계속할까요?','Xóa toàn bộ tô khung trên trang này? Tiếp tục?','Se borrarán todos los rellenos de marco de esta página. ¿Continuar?','Alle Rahmenfüllungen dieser Seite werden gelöscht. Fortfahren?','Tous les remplissages de cadre de cette page seront effacés. Continuer ?','سيتم مسح كل تعبئات الإطار في هذه الصفحة. متابعة؟'],
    'm.loadfirst':    ['先に公図を読み込んでください','Please load a file first','请先载入文件','먼저 파일을 불러오세요','Vui lòng tải tệp trước','Carga un archivo primero','Bitte zuerst eine Datei laden','Veuillez d’abord charger un fichier','يرجى تحميل ملف أولًا'],
    'm.novec':        ['ベクター化できる線が検出されませんでした','No vectorizable lines were detected','未检测到可矢量化的线条','벡터화할 선을 찾지 못했습니다','Không tìm thấy nét để vector hóa','No se detectaron líneas vectorizables','Keine vektorisierbaren Linien gefunden','Aucune ligne vectorisable détectée','لم يتم العثور على خطوط قابلة للتحويل'],
    'm.nopaint':      ['ベクター化できる塗りがありません','No paint to convert to vector','没有可转换为矢量的涂色','벡터로 변환할 칠이 없습니다','Không có vùng tô để chuyển vector','No hay relleno para convertir a vector','Keine Füllung zum Umwandeln vorhanden','Aucun remplissage à convertir en vecteur','لا توجد تعبئة لتحويلها إلى متجه'],
    'm.vecfail':      ['ベクター化に失敗: ','Vectorization failed: ','矢量化失败：','벡터화 실패: ','Vector hóa thất bại: ','Error de vectorización: ','Vektorisierung fehlgeschlagen: ','Échec de la vectorisation : ','فشل التحويل المتجهي: '],
    'm.noprint':      ['印刷するページがありません。先にファイルを読み込んでください。','No page to print. Please load a file first.','没有可打印的页面，请先载入文件。','인쇄할 페이지가 없습니다. 파일을 불러오세요.','Không có trang để in. Hãy tải tệp trước.','No hay página para imprimir. Carga un archivo.','Keine Seite zum Drucken. Bitte Datei laden.','Aucune page à imprimer. Chargez un fichier.','لا توجد صفحة للطباعة. حمّل ملفًا أولًا.'],
    'm.popup':        ['印刷ウィンドウを開けませんでした。ブラウザのポップアップ許可をご確認ください。','Could not open the print window. Please allow pop-ups.','无法打开打印窗口，请允许弹出窗口。','인쇄 창을 열 수 없습니다. 팝업을 허용하세요.','Không mở được cửa sổ in. Hãy cho phép pop-up.','No se pudo abrir la ventana de impresión. Permite ventanas emergentes.','Druckfenster konnte nicht geöffnet werden. Pop-ups erlauben.','Impossible d’ouvrir la fenêtre d’impression. Autorisez les pop-ups.','تعذّر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة.'],
    'm.sessionexp':   ['セッションの有効期限が切れました。再度ログインしてください。','Your session has expired. Please log in again.','会话已过期，请重新登录。','세션이 만료되었습니다. 다시 로그인하세요.','Phiên đã hết hạn. Vui lòng đăng nhập lại.','Tu sesión ha expirado. Inicia sesión de nuevo.','Sitzung abgelaufen. Bitte erneut anmelden.','Votre session a expiré. Reconnectez-vous.','انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.'],
    'banner.demoPre': ['🎬 デモモード — 残り ','🎬 DEMO mode — ','🎬 演示模式 — 剩余 ','🎬 데모 모드 — 남은 ','🎬 Chế độ DEMO — còn ','🎬 Modo DEMO — restante ','🎬 DEMO-Modus — Rest ','🎬 Mode DEMO — restant ','🎬 وضع DEMO — المتبقي '],
    'banner.demoPost':[' ／ 保存・印刷に「MARY DEMO」透かしが入ります',' / "MARY DEMO" watermark on saves & prints',' / 保存与打印将带「MARY DEMO」水印',' / 저장·인쇄에 "MARY DEMO" 워터마크',' / Lưu·in sẽ có chữ chìm "MARY DEMO"',' / Marca de agua "MARY DEMO" al guardar/imprimir',' / "MARY DEMO"-Wasserzeichen bei Speichern/Druck',' / Filigrane « MARY DEMO » à l’enregistrement/impression',' / علامة "MARY DEMO" عند الحفظ/الطباعة'],
    'banner.sub':     ['🔒 閲覧はできますが、保存・印刷には月額プランへの加入が必要です。','🔒 You can view, but saving and printing require a subscription.','🔒 可浏览，但保存和打印需要订阅。','🔒 열람은 가능하지만 저장·인쇄는 구독이 필요합니다.','🔒 Có thể xem, nhưng lưu·in cần đăng ký.','🔒 Puedes ver, pero guardar e imprimir requieren suscripción.','🔒 Ansicht möglich, Speichern/Drucken erfordert Abo.','🔒 Consultation possible, mais enregistrer/imprimer nécessite un abonnement.','🔒 يمكن العرض، لكن الحفظ والطباعة يتطلبان اشتراكًا.'],
    'banner.trial':   ['🎬 未加入のため、保存・印刷した出力に「MARY DEMO」透かしが入ります。月額プランで透かしなしになります。','🎬 Not subscribed: saved/printed output has a "MARY DEMO" watermark. Subscribe to remove it.','🎬 未订阅：保存/打印的输出带有"MARY DEMO"水印。订阅后可去除。','🎬 미가입: 저장·인쇄 출력에 "MARY DEMO" 워터마크가 들어갑니다. 구독하면 제거됩니다.','🎬 Chưa đăng ký: bản lưu/in có dấu "MARY DEMO". Đăng ký để bỏ.','🎬 Sin suscripción: la salida guardada/impresa lleva marca de agua "MARY DEMO". Suscríbete para quitarla.','🎬 Ohne Abo: Ausgaben tragen ein "MARY DEMO"-Wasserzeichen. Mit Abo entfällt es.','🎬 Sans abonnement : les sorties portent un filigrane « MARY DEMO ». Abonnez-vous pour le retirer.','🎬 بدون اشتراك: تحمل المخرجات علامة "MARY DEMO". اشترك لإزالتها.'],
    'tip.fill': ['囲まれた領域を塗る','Fill an enclosed area','填充封闭区域','닫힌 영역 채우기','Tô vùng kín','Rellenar área cerrada','Geschlossene Fläche füllen','Remplir une zone fermée','تعبئة منطقة مغلقة'],
    'tip.text': ['文字を書き込む(クリックで追加)','Add text (click to place)','添加文字（点击放置）','문자 추가(클릭)','Thêm chữ (bấm)','Añadir texto (clic)','Text hinzufügen (klicken)','Ajouter du texte (cliquer)','إضافة نص (انقر)'],
    'tip.select': ['空白部をドラッグで範囲選択／文字枠を移動','Drag to select / move text boxes','拖动框选/移动文字框','드래그로 선택/이동','Kéo để chọn/di chuyển','Arrastrar para seleccionar/mover','Ziehen zum Auswählen/Verschieben','Glisser pour sélectionner/déplacer','اسحب للتحديد/النقل'],
    'tip.touki': ['登記情報提供サービス（公図・登記簿等を取得）を新しいタブで開く','Open the Registry Information Service in a new tab','在新标签打开登记信息服务','등기정보 서비스를 새 탭에서 열기','Mở dịch vụ đăng ký ở tab mới','Abrir el Servicio de Registro en otra pestaña','Grundbuch-Dienst in neuem Tab','Ouvrir le service du cadastre dans un onglet','افتح خدمة السجل في تبويب جديد'],
    'tip.add': ['ファイルを追加読み込み（既存ページの後ろにページ追加・複数選択可）','Add more files (append pages)','追加载入文件（追加页面）','파일 추가(페이지 추가)','Thêm tệp (nối trang)','Añadir archivos (anexar páginas)','Dateien hinzufügen (Seiten anhängen)','Ajouter des fichiers (pages)','إضافة ملفات (إلحاق صفحات)'],
    'tip.delpage': ['表示中のページを削除','Delete the current page','删除当前页','현재 페이지 삭제','Xóa trang hiện tại','Borrar la página actual','Aktuelle Seite löschen','Supprimer la page actuelle','حذف الصفحة الحالية'],
    'tip.brushgrp': ['ブラシ(自由に塗る)・大中小','Brush (freehand) — S/M/L','画笔（自由）·大中小','브러시(자유)·크기','But (tu do)·co','Pincel (libre) — T/M/G','Pinsel (frei) — S/M/L','Pinceau (libre) — P/M/G','فرشاة (حرة) — حجم'],
    'tip.erasergrp': ['消しゴム・大中小','Eraser — S/M/L','橡皮·大中小','지우개·크기','Tay·co','Borrador — T/M/G','Radierer — S/M/L','Gomme — P/M/G','ممحاة — حجم'],
    'tip.preview': ['ブラシ／消しゴムのプレビュー(太さ・色)','Brush/eraser preview (size & color)','画笔/橡皮预览（粗细·颜色）','브러시/지우개 미리보기','Xem truoc but/tay','Vista del pincel/borrador','Vorschau Pinsel/Radierer','Apercu pinceau/gomme','معاينة الفرشاة/الممحاة'],
    'tip.palette': ['色を選択','Choose a color','选择颜色','색 선택','Chon mau','Elegir color','Farbe wählen','Choisir une couleur','اختر لونًا'],
    'tip.tcolor': ['文字色','Text color','文字颜色','문자 색','Mau chu','Color del texto','Textfarbe','Couleur du texte','لون النص'],
    'tip.textcfg': ['文字ツールの設定','Text tool settings','文字工具设置','문자 도구 설정','Cai dat cong cu chu','Ajustes de texto','Text-Einstellungen','Reglages du texte','إعدادات أداة النص'],
    'tip.bold': ['太字','Bold','加粗','굵게','Dam','Negrita','Fett','Gras','عريض'],
    'tip.vtoggle': ['縦書き／横書き切替','Toggle vertical/horizontal','竖排/横排切换','세로/가로 전환','Doi doc/ngang','Vertical/horizontal','Vertikal/horizontal','Vertical/horizontal','تبديل عمودي/أفقي'],
    'tip.stamp': ['スタンプ(クリックで配置・連続可)','Stamp (click to place, repeatable)','印章（点击放置）','스탬프(클릭 배치)','Dau (bam de dat)','Sello (clic para colocar)','Stempel (klicken)','Tampon (cliquer)','ختم (انقر للوضع)'],
    'tip.stampO': ['◯ を押す','Place ◯','盖 ◯','◯ 찍기','Dong ◯','Poner ◯','◯ setzen','Apposer ◯','ضع ◯'],
    'tip.stampC': ['✓ を押す','Place ✓','盖 ✓','✓ 찍기','Dong ✓','Poner ✓','✓ setzen','Apposer ✓','ضع ✓'],
    'tip.stampX': ['× を押す','Place ×','盖 ×','× 찍기','Dong ×','Poner ×','× setzen','Apposer ×','ضع ×'],
    'tip.align': ['複数選択した文字枠を整列(Shift+クリックで複数選択)','Align selected text boxes (Shift+click to multi-select)','对齐所选文字框','선택한 문자 정렬','Can cac o chu da chon','Alinear cuadros seleccionados','Ausgewählte Textfelder ausrichten','Aligner les zones selectionnees','محاذاة المربعات المحددة'],
    'tip.gap': ['塗りつぶしで線の隙間を塞ぐ強さ。漏れるときは上げる','Strength to bridge line gaps when filling','填充时桥接线缝的强度','채우기 시 선 틈 메우기 강도','Do lap khe net khi to','Intensidad para cerrar huecos al rellenar','Stärke zum Schließen von Linienlücken','Force pour combler les espaces','قوة سد فجوات الخطوط'],
    'tip.boost': ['スキャンの薄い/細い線を強調して塗り・文字検出の精度を上げる','Strengthen faint/thin scan lines for accuracy','增强扫描细线以提高精度','흐린 선 강조로 정확도 향상','Tang net mo de chinh xac hon','Refuerza lineas tenues del escaneo','Schwache Scan-Linien verstärken','Renforcer les traits fins du scan','تقوية الخطوط الباهتة'],
    'tip.textdetect': ['文字・数字を検出 → 色の上に表示＋塗りつぶしの壁から除外（数字を跨いで塗れる）','Detect text/numbers, show above color & exclude from fill','检测文字数字并排除于填充','문자·숫자 검출','Nhan chu/so','Detectar texto/numeros','Text/Zahlen erkennen','Detecter texte/chiffres','كشف النص/الأرقام'],
    'tip.detsec': ['地図中の文字・数字を検出して別レイヤーに分離','Detect text/numbers and split to a separate layer','检测文字数字并分离图层','문자·숫자 별 레이어 분리','Tach chu/so sang lop rieng','Detectar texto y separarlo en capa','Text in eigene Ebene trennen','Separer le texte sur un calque','فصل النص في طبقة منفصلة'],
    'tip.undo': ['元に戻す (Ctrl+Z)','Undo (Ctrl+Z)','撤销 (Ctrl+Z)','실행취소 (Ctrl+Z)','Hoan tac (Ctrl+Z)','Deshacer (Ctrl+Z)','Rückgängig (Ctrl+Z)','Annuler (Ctrl+Z)','تراجع (Ctrl+Z)'],
    'tip.redo': ['やり直し (Ctrl+Y)','Redo (Ctrl+Y)','重做 (Ctrl+Y)','다시실행 (Ctrl+Y)','Lam lai (Ctrl+Y)','Rehacer (Ctrl+Y)','Wiederholen (Ctrl+Y)','Retablir (Ctrl+Y)','إعادة (Ctrl+Y)'],
    'tip.clear': ['このページの色を全消去','Clear all color on this page','清除本页所有颜色','이 페이지 색 모두 지움','Xoa het mau trang nay','Borrar todo el color de la pagina','Alle Farben dieser Seite löschen','Effacer toutes les couleurs','مسح كل ألوان الصفحة'],
    'tip.shortcuts': ['ショートカットキー一覧 (?)','Keyboard shortcuts (?)','快捷键列表 (?)','단축키 목록 (?)','Phim tat (?)','Lista de atajos (?)','Tastenkürzel (?)','Raccourcis (?)','قائمة الاختصارات (?)'],
    'tip.zoomin': ['拡大 (Ctrl++)','Zoom in (Ctrl++)','放大 (Ctrl++)','확대 (Ctrl++)','Phong to (Ctrl++)','Acercar (Ctrl++)','Vergrößern (Ctrl++)','Zoom avant (Ctrl++)','تكبير (Ctrl++)'],
    'tip.zoomout': ['縮小 (Ctrl+-)','Zoom out (Ctrl+-)','缩小 (Ctrl+-)','축소 (Ctrl+-)','Thu nho (Ctrl+-)','Alejar (Ctrl+-)','Verkleinern (Ctrl+-)','Zoom arriere (Ctrl+-)','تصغير (Ctrl+-)'],
    'tip.zoomval': ['表示倍率を入力（数値%・Enterで適用）','Enter zoom % (Enter to apply)','输入缩放%（回车应用）','배율 입력(%·Enter)','Nhap % thu phong (Enter)','Introduce el zoom % (Enter)','Zoom % eingeben (Enter)','Saisir le zoom % (Entree)','أدخل نسبة التكبير % (Enter)'],
    'tip.fit': ['幅に合わせる','Fit to width','适应宽度','너비 맞춤','Vua chieu rong','Ajustar al ancho','An Breite anpassen','Ajuster a la largeur','ملاءمة العرض'],
    'tip.savesvg': ['色付きSVGを保存。複数ページのときは全ページをZIPにまとめて保存','Save colored SVG (multi-page as ZIP)','保存彩色SVG（多页ZIP）','컬러 SVG 저장','Luu SVG mau','Guardar SVG en color','Farbiges SVG speichern','Enregistrer le SVG couleur','حفظ SVG ملوّن'],
    'tip.savepng': ['色付きPNGを保存。複数ページのときは全ページをZIPにまとめて保存','Save colored PNG (multi-page as ZIP)','保存彩色PNG（多页ZIP）','컬러 PNG 저장','Luu PNG mau','Guardar PNG en color','Farbiges PNG speichern','Enregistrer le PNG couleur','حفظ PNG ملوّن'],
    'tip.savepdf': ['色付きPDFを保存。複数ページのときは全ページを1つのPDFにまとめて保存','Save colored PDF (multi-page in one PDF)','保存彩色PDF','컬러 PDF 저장','Luu PDF mau','Guardar PDF en color','Farbiges PDF speichern','Enregistrer le PDF couleur','حفظ PDF ملوّن'],
    'tip.vecsave': ['SVG保存時に塗り・ブラシをベクター(&lt;path&gt;)化。OFFで従来の画像(PNG)埋め込み','Vectorize fills/brush on SVG save; off = embed image','SVG保存时矢量化；关=嵌入图片','SVG 저장 시 벡터화','Vector hoa khi luu SVG','Vectorizar al guardar SVG','Beim SVG-Speichern vektorisieren','Vectoriser a l’enregistrement SVG','تحويل متجهي عند حفظ SVG'],
    'tip.svgedit': ['保存したSVGをこのアプリで開き直すと、塗り・ブラシ・文字を再編集できます','Reopen the saved SVG here to re-edit color, brush and text','重新打开保存的SVG可再次编辑','저장한 SVG를 다시 열어 재편집','Mo lai SVG da luu de sua','Reabre el SVG guardado para reeditar','Gespeichertes SVG erneut bearbeitbar','Rouvrir le SVG enregistre pour modifier','أعد فتح SVG للتعديل'],
    'tip.printall': ['色付き地図を印刷','Print the colored map','打印彩色地图','컬러 지도 인쇄','In ban do mau','Imprimir el mapa en color','Farbige Karte drucken','Imprimer la carte couleur','طباعة الخريطة الملوّنة'],
    'tip.printtext': ['文字・スタンプ＋塗り・ブラシを印刷（地図の線画は除く・印刷済み公図への重ね印刷用）','Print text/stamps & brush only (no map lines; for overprinting)','仅打印文字与笔刷（用于叠印）','문자·스탬프만 인쇄','Chi in chu/dau','Imprimir solo texto/sellos','Nur Text/Stempel drucken','Imprimer texte/tampons seuls','طباعة النص/الأختام فقط'],
    'tip.mypage': ['マイページ（契約・パスワード）','My Page (subscription, password)','我的页面（订阅·密码）','마이페이지(구독·비번)','Trang cua toi','Mi pagina (suscripcion, contrasena)','Mein Konto (Abo, Passwort)','Mon espace (abonnement)','صفحتي (الاشتراك)'],
    'tip.admin': ['ユーザー管理','User management','用户管理','사용자 관리','Quan ly nguoi dung','Gestion de usuarios','Benutzerverwaltung','Gestion des utilisateurs','إدارة المستخدمين'],
    'tip.logout': ['ログアウト','Log out','退出登录','로그아웃','Dang xuat','Cerrar sesion','Abmelden','Se deconnecter','تسجيل الخروج'],
    'tip.printsec': ['印刷','Print','打印','인쇄','In','Imprimir','Drucken','Imprimer','طباعة'],
    'tip.area': ['色ごとに塗りつぶした面積を㎡・坪で計算','Calculate filled area per color (m²/tsubo)','按颜色计算填充面积','색별 면적 계산','Tinh dien tich theo mau','Calcular area por color','Fläche je Farbe berechnen','Calculer la surface par couleur','حساب المساحة لكل لون'],
    'tip.scale': ['公図の縮尺（1/○○）。タイトル枠の縮尺を入力してください','Map scale (1/__). Enter the scale from the title block','地图比例（1/__）','지도 축척(1/__)','Ty le ban do (1/__)','Escala del plano (1/__)','Kartenmaßstab (1/__)','Echelle du plan (1/__)','مقياس الخريطة (1/__)'],
    'banner.subcta':  ['プランに加入する','Subscribe','订阅','구독하기','Đăng ký','Suscribirse','Abonnieren','S’abonner','اشترك'],
    // ---- 枠塗り / 面積 / 回転 / 整列 / 印刷ウィンドウ（追加翻訳） ----
    'tool.frame':     ['🔷 枠塗り','🔷 Frame fill','🔷 框线填充','🔷 프레임 칠','🔷 Tô khung','🔷 Relleno de marco','🔷 Rahmenfüllung','🔷 Remplissage cadre','🔷 تعبئة الإطار'],
    'tip.frame':      ['クリックでポイントを追加→始点クリックで枠を閉じて色付け。枠を選択してポイントを調整できます','Click to add points; click the start point to close & fill. Select a frame to adjust points.','点击添加顶点→点击起点闭合并填色。选择框可调整顶点。','클릭하여 점 추가→시작점 클릭으로 닫고 채색. 프레임 선택 시 점 조정.','Nhấp để thêm điểm→nhấp điểm đầu để đóng & tô. Chọn khung để chỉnh điểm.','Haz clic para añadir puntos; clic en el inicio para cerrar y rellenar. Selecciona un marco para ajustar.','Klicken, um Punkte zu setzen; Startpunkt klicken zum Schließen & Füllen. Rahmen wählen zum Anpassen.','Cliquez pour ajouter des points ; cliquez sur le départ pour fermer et remplir. Sélectionnez un cadre pour ajuster.','انقر لإضافة نقاط؛ انقر نقطة البداية للإغلاق والتعبئة. حدد إطارًا لضبط النقاط.'],
    'frame.addpoint': ['クリックで頂点を追加','Click to add a point','点击添加顶点','클릭하여 점 추가','Nhấp để thêm điểm','Clic para añadir un punto','Klicken zum Punkt hinzufügen','Cliquez pour ajouter un point','انقر لإضافة نقطة'],
    'frame.movedel':  ['ドラッグで移動／ダブルクリックで削除','Drag to move / double-click to delete','拖动移动／双击删除','드래그로 이동／더블클릭으로 삭제','Kéo để di chuyển / nhấp đúp để xóa','Arrastra para mover / doble clic para eliminar','Ziehen zum Verschieben / Doppelklick zum Löschen','Glisser pour déplacer / double-clic pour supprimer','اسحب للتحريك / انقر مزدوجًا للحذف'],
    'sec.area':       ['面積（㎡・坪）','Area (m²/tsubo)','面积（㎡·坪）','면적(㎡·평)','Diện tích (m²/tsubo)','Área (m²/tsubo)','Fläche (m²/Tsubo)','Surface (m²/tsubo)','المساحة (م²/تسوبو)'],
    'lbl.scale':      ['縮尺 1/','Scale 1/','比例 1/','축척 1/','Tỷ lệ 1/','Escala 1/','Maßstab 1/','Échelle 1/','المقياس 1/'],
    'aria.fsize':     ['文字サイズ','Font size','字号','글자 크기','Cỡ chữ','Tamaño de fuente','Schriftgröße','Taille de police','حجم الخط'],
    'aria.zoom':      ['表示倍率','Zoom','缩放','확대/축소','Thu phóng','Zoom','Zoom','Zoom','التكبير'],
    'aria.tcolor':    ['文字色','Text color','文字颜色','글자 색','Màu chữ','Color de texto','Textfarbe','Couleur du texte','لون النص'],
    'btn.area':       ['📐 面積を計算','📐 Calculate area','📐 计算面积','📐 면적 계산','📐 Tính diện tích','📐 Calcular área','📐 Fläche berechnen','📐 Calculer la surface','📐 حساب المساحة'],
    'btn.rotl':       ['↺ 左90°','↺ Left 90°','↺ 左转90°','↺ 왼쪽 90°','↺ Trái 90°','↺ Izq. 90°','↺ Links 90°','↺ Gauche 90°','↺ يسار 90°'],
    'btn.rotr':       ['↻ 右90°','↻ Right 90°','↻ 右转90°','↻ 오른쪽 90°','↻ Phải 90°','↻ Der. 90°','↻ Rechts 90°','↻ Droite 90°','↻ يمين 90°'],
    'tip.rotl':       ['左に90°回転','Rotate 90° left','向左旋转90°','왼쪽으로 90° 회전','Xoay trái 90°','Girar 90° a la izquierda','90° nach links drehen','Pivoter de 90° à gauche','تدوير 90° لليسار'],
    'tip.rotr':       ['右に90°回転','Rotate 90° right','向右旋转90°','오른쪽으로 90° 회전','Xoay phải 90°','Girar 90° a la derecha','90° nach rechts drehen','Pivoter de 90° à droite','تدوير 90° لليمين'],
    'hint.multipage': ['複数ページは自動でまとめて保存（SVG/PNG=ZIP、PDF=1つのPDF）','Multi-page is saved together automatically (SVG/PNG=ZIP, PDF=one PDF)','多页自动合并保存（SVG/PNG=ZIP，PDF=单个PDF）','여러 페이지는 자동으로 함께 저장(SVG/PNG=ZIP, PDF=단일 PDF)','Nhiều trang được lưu cùng nhau tự động (SVG/PNG=ZIP, PDF=một PDF)','Varias páginas se guardan juntas automáticamente (SVG/PNG=ZIP, PDF=un PDF)','Mehrere Seiten werden automatisch zusammen gespeichert (SVG/PNG=ZIP, PDF=eine PDF)','Les pages multiples sont enregistrées ensemble automatiquement (SVG/PNG=ZIP, PDF=un seul PDF)','تُحفظ الصفحات المتعددة معًا تلقائيًا (SVG/PNG=ZIP، PDF=ملف واحد)'],
    'txt.default':    ['テキスト','Text','文字','텍스트','Văn bản','Texto','Text','Texte','نص'],
    'm.nofill':       ['塗りつぶしがありません','No filled areas','没有填充区域','채운 영역이 없습니다','Không có vùng tô','No hay áreas rellenadas','Keine gefüllten Flächen','Aucune zone remplie','لا توجد مناطق معبأة'],
    'area.total':     ['計','Total','合计','합계','Tổng','Total','Summe','Total','المجموع'],
    'tip.alignL':     ['左揃え','Align left','左对齐','왼쪽 정렬','Căn trái','Alinear a la izquierda','Linksbündig','Aligner à gauche','محاذاة لليسار'],
    'tip.alignHC':    ['左右中央','Center horizontally','水平居中','가로 가운데','Căn giữa ngang','Centrar horizontalmente','Horizontal zentrieren','Centrer horizontalement','توسيط أفقي'],
    'tip.alignR':     ['右揃え','Align right','右对齐','오른쪽 정렬','Căn phải','Alinear a la derecha','Rechtsbündig','Aligner à droite','محاذاة لليمين'],
    'tip.alignT':     ['上揃え','Align top','顶对齐','위 정렬','Căn trên','Alinear arriba','Oben ausrichten','Aligner en haut','محاذاة للأعلى'],
    'tip.alignVC':    ['上下中央','Center vertically','垂直居中','세로 가운데','Căn giữa dọc','Centrar verticalmente','Vertikal zentrieren','Centrer verticalement','توسيط رأسي'],
    'tip.alignB':     ['下揃え','Align bottom','底对齐','아래 정렬','Căn dưới','Alinear abajo','Unten ausrichten','Aligner en bas','محاذاة للأسفل'],
    'tip.alignHD':    ['左右に等間隔で配置（3つ以上）','Distribute horizontally (3+)','水平等距分布（≥3）','가로 균등 배분(3개+)','Phân bố ngang đều (3+)','Distribuir horizontalmente (3+)','Horizontal verteilen (3+)','Répartir horizontalement (3+)','توزيع أفقي (3+)'],
    'tip.alignVD':    ['上下に等間隔で配置（3つ以上）','Distribute vertically (3+)','垂直等距分布（≥3）','세로 균등 배분(3개+)','Phân bố dọc đều (3+)','Distribuir verticalmente (3+)','Vertikal verteilen (3+)','Répartir verticalement (3+)','توزيع رأسي (3+)'],
    'tip.brushS':     ['ブラシ 小','Brush S','画笔 小','브러시 소','Bút nhỏ','Pincel P','Pinsel S','Pinceau P','فرشاة صغيرة'],
    'tip.brushM':     ['ブラシ 中','Brush M','画笔 中','브러시 중','Bút vừa','Pincel M','Pinsel M','Pinceau M','فرشاة متوسطة'],
    'tip.brushL':     ['ブラシ 大','Brush L','画笔 大','브러시 대','Bút lớn','Pincel G','Pinsel L','Pinceau G','فرشاة كبيرة'],
    'tip.eraserS':    ['消しゴム 小','Eraser S','橡皮 小','지우개 소','Tẩy nhỏ','Borrador P','Radierer S','Gomme P','ممحاة صغيرة'],
    'tip.eraserM':    ['消しゴム 中','Eraser M','橡皮 中','지우개 중','Tẩy vừa','Borrador M','Radierer M','Gomme M','ممحاة متوسطة'],
    'tip.eraserL':    ['消しゴム 大','Eraser L','橡皮 大','지우개 대','Tẩy lớn','Borrador G','Radierer L','Gomme G','ممحاة كبيرة'],
    'print.hintTrue': ['🖨 原寸(実寸)印刷 ／ <b>プリンタ設定で「実際のサイズ/100%」(拡大縮小なし)・用紙を実物に合わせて</b>ください','🖨 Actual-size print / <b>In printer settings choose "Actual size / 100%" (no scaling) and match the paper to the real form</b>','🖨 原尺寸打印 ／ <b>打印设置中选择"实际大小/100%"(不缩放)，纸张与实物一致</b>','🖨 실측 인쇄 / <b>프린터 설정에서 "실제 크기/100%"(배율 없음) 선택, 용지를 실물에 맞추세요</b>','🖨 In đúng kích thước / <b>Trong cài đặt máy in chọn "Kích thước thật / 100%" (không co giãn), khớp giấy với bản thật</b>','🖨 Impresión a tamaño real / <b>En la configuración de impresión elige "Tamaño real / 100%" (sin escala) y ajusta el papel</b>','🖨 Druck in Originalgröße / <b>In den Druckeinstellungen "Tatsächliche Größe / 100%" (keine Skalierung) wählen und Papier anpassen</b>','🖨 Impression taille réelle / <b>Dans les paramètres d’impression, choisissez "Taille réelle / 100 %" (sans mise à l’échelle) et adaptez le papier</b>','🖨 طباعة بالحجم الفعلي / <b>في إعدادات الطابعة اختر "الحجم الفعلي / 100%" (بدون تحجيم) وطابق الورق</b>'],
    'print.hintNormal':['🖨 印刷したらこのタブを閉じてください','🖨 Close this tab after printing','🖨 打印后请关闭此标签页','🖨 인쇄 후 이 탭을 닫으세요','🖨 In xong hãy đóng tab này','🖨 Cierra esta pestaña tras imprimir','🖨 Schließen Sie diesen Tab nach dem Drucken','🖨 Fermez cet onglet après l’impression','🖨 أغلق هذه التبويبة بعد الطباعة'],
    'print.again':    ['もう一度印刷','Print again','再次打印','다시 인쇄','In lại','Imprimir de nuevo','Erneut drucken','Imprimer à nouveau','اطبع مرة أخرى'],
    'print.close':    ['✕ 閉じる','✕ Close','✕ 关闭','✕ 닫기','✕ Đóng','✕ Cerrar','✕ Schließen','✕ Fermer','✕ إغلاق'],
    'm.converting':   ['⏳ 変換中…','⏳ Converting…','⏳ 转换中…','⏳ 변환 중…','⏳ Đang chuyển đổi…','⏳ Convirtiendo…','⏳ Wird konvertiert…','⏳ Conversion…','⏳ جارٍ التحويل…'],
    'file.pages':     ['ページ','pages','页','페이지','trang','páginas','Seiten','pages','صفحات'],
    // ---- お問い合わせ ----
    'btn.contact':    ['📧 お問い合わせ','📧 Contact','📧 联系我们','📧 문의하기','📧 Liên hệ','📧 Contacto','📧 Kontakt','📧 Contact','📧 اتصل بنا'],
    'tip.contact':    ['ご質問・ご要望をお送りください','Send a question or request','发送问题或需求','질문·요청 보내기','Gửi câu hỏi hoặc yêu cầu','Envía una pregunta o solicitud','Frage oder Anliegen senden','Envoyer une question ou demande','أرسل سؤالاً أو طلبًا'],
    'contact.title':  ['お問い合わせ','Contact','联系我们','문의하기','Liên hệ','Contacto','Kontakt','Contact','اتصل بنا'],
    'contact.user':   ['ユーザー名','Username','用户名','사용자명','Tên đăng nhập','Usuario','Benutzername','Identifiant','اسم المستخدم'],
    'contact.email':  ['返信先メール','Reply email','回复邮箱','회신 이메일','Email phản hồi','Email de respuesta','Antwort-E-Mail','E-mail de réponse','بريد الرد'],
    'contact.subject':['件名','Subject','主题','제목','Tiêu đề','Asunto','Betreff','Objet','الموضوع'],
    'contact.message':['内容','Message','内容','내용','Nội dung','Mensaje','Nachricht','Message','الرسالة'],
    'contact.send':   ['送信','Send','发送','보내기','Gửi','Enviar','Senden','Envoyer','إرسال'],
    'contact.cancel': ['キャンセル','Cancel','取消','취소','Hủy','Cancelar','Abbrechen','Annuler','إلغاء'],
    'contact.sent':   ['送信しました。ありがとうございます。','Sent. Thank you.','已发送，谢谢。','보냈습니다. 감사합니다.','Đã gửi. Cảm ơn bạn.','Enviado. Gracias.','Gesendet. Vielen Dank.','Envoyé. Merci.','تم الإرسال. شكرًا لك.'],
    'contact.failed': ['送信に失敗しました','Failed to send','发送失败','전송에 실패했습니다','Gửi thất bại','Error al enviar','Senden fehlgeschlagen','Échec de l’envoi','فشل الإرسال'],
    'contact.needmsg':['お問い合わせ内容を入力してください','Please enter your message','请输入咨询内容','문의 내용을 입력하세요','Vui lòng nhập nội dung','Introduce tu mensaje','Bitte Nachricht eingeben','Veuillez saisir votre message','يرجى إدخال رسالتك'],
    'contact.note':   ['ご返信は登録メールまたは上記の返信先メール宛にお送りします。','We will reply to your registered or the reply email above.','我们将回复您的注册邮箱或上述回复邮箱。','등록 이메일 또는 위 회신 이메일로 답장드립니다.','Chúng tôi sẽ trả lời qua email đã đăng ký hoặc email trên.','Responderemos a tu correo registrado o al indicado arriba.','Wir antworten an Ihre registrierte oder die obige E-Mail.','Nous répondrons à votre e-mail enregistré ou à celui indiqué ci-dessus.','سنرد على بريدك المسجل أو البريد أعلاه.']
  };

  function langIndex(l){ var i=ORDER.indexOf(l); return i<0?0:i; }
  function getLang(){
    var l = localStorage.getItem('lang');
    if(!l){ var b=(navigator.language||'ja').slice(0,2).toLowerCase(); l = ORDER.indexOf(b)>=0 ? b : 'ja'; }
    return ORDER.indexOf(l)>=0 ? l : 'ja';
  }
  function t(key, lang){ var e=DICT[key]; if(!e) return key; return e[langIndex(lang||getLang())] || e[0]; }

  function applyLang(lang){
    lang = lang || getLang();
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang==='ar' ? 'rtl' : 'ltr');   // アラビア語は右から左
    // 未知キー(=古いi18n.jsをキャッシュ等)のときはHTMLの既定文言を保持し、キー名で上書きしない
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var k = el.getAttribute('data-i18n'); if(!DICT[k]) return;
      var v = t(k, lang); if(v!=null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el){
      var k = el.getAttribute('data-i18n-title'); if(!DICT[k]) return;
      var v = t(k, lang); if(v!=null) el.setAttribute('title', v);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
      var k = el.getAttribute('data-i18n-ph'); if(!DICT[k]) return;
      var v = t(k, lang); if(v!=null) el.setAttribute('placeholder', v);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el){
      var k = el.getAttribute('data-i18n-aria'); if(!DICT[k]) return;
      var v = t(k, lang); if(v!=null) el.setAttribute('aria-label', v);
    });
    // セレクタの値を同期
    var sel = document.getElementById('langSel'); if(sel && sel.value!==lang) sel.value = lang;
  }

  function buildSelect(){
    var sel = document.getElementById('langSel');
    if(!sel) return null;
    if(!sel.options.length){
      LANGS.forEach(function(l){ var o=document.createElement('option'); o.value=l[0]; o.textContent=l[1]; sel.appendChild(o); });
    }
    sel.value = getLang();
    sel.addEventListener('change', function(){ applyLang(sel.value); });
    return sel;
  }

  var I18N = { t:t, apply:applyLang, getLang:getLang, langs:LANGS, dict:DICT };
  global.I18N = I18N;

  function init(){ buildSelect(); applyLang(getLang()); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
