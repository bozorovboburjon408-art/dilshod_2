import { getState, useStore } from './store';

export type Lang = 'uz' | 'ru' | 'en';
export const LANGS: { id: Lang; label: string }[] = [{ id: 'uz', label: "O'zbekcha" }, { id: 'ru', label: 'Русский' }, { id: 'en', label: 'English' }];

type Dict = Record<string, string>;

const en: Dict = {
  'app.title': 'Laser Model Texture Studio',
  'app.tagline': '3D → 2D coloured wrap & laser-cut files',
  'hdr.upload': 'Open model', 'hdr.demo': 'Demo model', 'hdr.export': 'Export', 'hdr.lang': 'Language',
  'nav.settings': 'Settings', 'nav.model3d': '3D view', 'nav.sheets': '2D sheets',
  'sec.model': '1 · Model', 'sec.transform': '2 · Size & orientation', 'sec.sheet': '3 · Sheet', 'sec.unfold': '4 · Unfolding', 'sec.texture': '5 · Colour coating', 'sec.decals': '6 · Images, logos, text',
  'model.drop': 'Drop files here or click to choose', 'model.formats': 'STL · OBJ + MTL + textures · GLB / glTF · FBX',
  'model.info': '{tris} triangles · {w} × {h} × {d} mm', 'model.none': 'No model loaded yet – open a file or pick a demo model.',
  'model.simplifyBanner': 'The model has {n} triangles – too many to unfold (limit {max}). Simplify it first.', 'model.simplify': 'Simplify to ~6000 faces',
  'demo.choose': 'Choose demo…', 'demo.house': 'House', 'demo.factory': 'Factory', 'demo.tower': 'Tower', 'demo.cube': 'Cube',
  'xf.rotate': 'Rotate 90°', 'xf.size': 'Size, mm', 'xf.lock': 'Keep proportions', 'xf.fit': 'Fit to sheet', 'xf.axisHint': 'X width · Y height · Z depth',
  'sheet.format': 'Format', 'sheet.custom': 'Custom', 'sheet.orientation': 'Orientation', 'sheet.portrait': 'Portrait', 'sheet.landscape': 'Landscape',
  'sheet.width': 'Width, mm', 'sheet.height': 'Height, mm', 'sheet.margin': 'Safe margin, mm (min 5)', 'sheet.gap': 'Gap between parts, mm', 'sheet.rotate': 'Allow part rotation when nesting',
  'unfold.tabWidth': 'Glue tab width, mm', 'unfold.tabs': 'Add glue tabs', 'unfold.tol': 'Coplanar merge tolerance, °', 'unfold.numbers': 'Number the faces', 'unfold.seamLabels': 'Label matching edges',
  'unfold.bleed': 'Texture bleed, mm', 'unfold.manual': 'Manual cut edges', 'unfold.manualHint': 'Use the “Cut edge” tool and click an edge in the 3D view or a fold line in the 2D view.', 'unfold.resetCuts': 'Clear manual cuts', 'unfold.none': 'none',
  'tool.select': 'Select face', 'tool.cut': 'Cut edge', 'view.textured': 'Textured', 'view.solid': 'Solid', 'view.wire': 'Wireframe', 'view.edges': 'Edges', 'view.fit': 'Fit view',
  'view.hint3d': 'Drag: rotate · Wheel: zoom · Right-drag: pan · Click: select face (Shift = several)',
  'tex.library': 'Material library', 'tex.upload': 'Upload texture (PNG, JPG, TIFF)', 'tex.mine': 'My textures', 'tex.scope': 'Apply to', 'scope.selection': 'Selected faces', 'scope.material': 'Same source material', 'scope.all': 'Whole model',
  'tex.scale': 'Tile size, mm', 'tex.rotate': 'Rotation, °', 'tex.offsetX': 'Offset X, mm', 'tex.offsetY': 'Offset Y, mm', 'tex.flipX': 'Flip horizontally', 'tex.flipY': 'Flip vertically', 'tex.color': 'Solid colour', 'tex.reset': 'Back to original',
  'tex.selectHint': 'Select a face in the 3D view or on a sheet, then pick a material.', 'tex.selected': '{n} face(s) selected', 'tex.original': 'Original model texture',
  'decal.add': 'Add to selected face', 'decal.text': 'Text', 'decal.textDefault': 'LASER', 'decal.upload': 'Upload image', 'decal.none': 'No decorations on this face.',
  'decal.x': 'X, mm', 'decal.y': 'Y, mm', 'decal.w': 'Width, mm', 'decal.h': 'Height, mm', 'decal.rot': 'Rotation, °', 'decal.opacity': 'Opacity', 'decal.remove': 'Remove', 'decal.content': 'Text', 'decal.color': 'Colour',
  'lib.concrete': 'Concrete', 'lib.brick': 'Brick', 'lib.metal': 'Metal', 'lib.steel_plate': 'Steel plate', 'lib.roof_tiles': 'Roof tiles', 'lib.roof_metal': 'Metal roof', 'lib.corrugated': 'Corrugated sheet', 'lib.asphalt': 'Asphalt',
  'lib.soil': 'Soil', 'lib.grass': 'Grass', 'lib.wood': 'Wood', 'lib.facade': 'Facade with windows', 'lib.glass': 'Glass curtain wall', 'lib.solar': 'Solar panel', 'lib.plaster': 'Plaster', 'lib.sand': 'Sand', 'lib.gravel': 'Gravel', 'lib.water': 'Water',
  'lib.window': 'Window', 'lib.door': 'Door', 'lib.logo': 'Logo', 'lib.sign': 'Sign', 'lib.hazard': 'Hazard stripe',
  'v2.print': 'Print', 'v2.cut': 'Cut', 'v2.fold': 'Fold', 'v2.engrave': 'Engrave', 'v2.reg': 'Marks', 'v2.sheet': 'Sheet', 'v2.empty': 'The unfolded sheets appear here.', 'v2.zoom': 'Zoom',
  'v2.legendCut': 'CUT', 'v2.legendValley': 'Valley fold', 'v2.legendMountain': 'Mountain fold', 'v2.legendEngrave': 'ENGRAVE', 'v2.legendReg': 'Registration, X0/Y0 origin = bottom-left',
  'stat.panels': 'Faces', 'stat.islands': 'Parts', 'stat.sheets': 'Sheets', 'stat.seams': 'Glue seams', 'stat.tabs': 'Tabs', 'stat.cut': 'Cut length', 'stat.fold': 'Fold length', 'stat.time': 'Computed in',
  'check.title': 'Checks', 'check.overlap': 'No overlapping parts', 'check.overlapBad': '{n} overlapping part pair(s)', 'check.cross': 'Cut and fold lines do not cross', 'check.crossBad': '{n} cut/fold crossings', 'check.bounds': 'All parts inside the safe margin', 'check.boundsBad': '{n} part(s) outside the safe margin', 'check.placed': 'All parts placed', 'check.placedBad': '{n} part(s) do not fit on a sheet',
  'warn.tabOmitted': 'No room for the glue tab of seam {seam}; glue the edges directly.', 'warn.islandTooLarge': 'Part {island} is larger than the usable sheet area – choose a bigger sheet or a smaller model.', 'warn.unplaced': 'Part {island} does not fit on the sheet.', 'warn.overlap': '{n} overlapping part pair(s) detected.', 'warn.crossing': '{n} cut/fold line crossings detected.',
  'err.noFiles': 'No files selected.', 'err.unsupported': 'Unsupported file. Use STL, OBJ (+MTL, textures), GLB/glTF or FBX.', 'err.empty': 'The file contains no mesh geometry.', 'err.parse': 'Could not read the model file', 'err.image': 'Could not read the image', 'err.compute': 'Unfolding failed', 'err.canvas': 'The browser could not create an image this large. Use a smaller sheet or another format.', 'err.export': 'Export failed',
  'msg.loaded': 'Model “{name}” loaded.', 'msg.simplified': 'Model simplified to {n} triangles.', 'msg.selectPanel': 'Select a face first.', 'msg.exported': 'Files are ready: {n}',
  'busy.compute': 'Unfolding…', 'busy.paint': 'Painting…',
  'export.title': 'Export for production', 'export.preview': 'Preview before download', 'export.p2d': '2D sheet', 'export.p3d': '3D model', 'export.sheet': 'Sheet', 'export.allSheets': 'All sheets',
  'export.color': 'Colour coating (300 DPI)', 'export.laser': 'Laser cutting (vector, mm 1:1)', 'export.production': 'Combined production file', 'export.instructions': 'Assembly instructions', 'export.perSheet': 'Separate file per sheet',
  'export.pdfPrint': 'Print PDF', 'export.pdfProd': 'Production PDF (print + cut/fold/marks)', 'export.pdfInstr': 'Assembly instructions PDF', 'export.zip': 'Everything (ZIP)', 'export.download': 'Download', 'export.working': 'Preparing files…', 'export.privacy': 'Files are generated in your browser and never leave your device.',
  'export.issues': 'The layout has problems (see the checks panel). Fix them before cutting.',
  'export.select': 'Choose formats', 'export.go': 'Download selected', 'export.noneSelected': 'Choose at least one format.',
  'instr.title': 'Assembly instructions', 'instr.model': 'Model', 'instr.size': 'Size', 'instr.faces': 'Faces', 'instr.sheets': 'Sheets', 'instr.legend': 'Line legend', 'instr.steps': 'Assembly order', 'instr.step': 'Step', 'instr.face': 'Face', 'instr.onSheet': 'Sheet', 'instr.glue': 'Glue', 'instr.none': 'no tabs – receives tabs',
  'instr.tabs': 'tab {a} → face {b}', 'instr.how': 'Cut along red lines. Fold blue lines (dashed = valley, dash-dot = mountain). Glue tab N to the edge with the same number N. Build from face 1 upwards.', 'instr.overview': 'Sheet overview',
  'privacy.note': 'Your files are processed locally in the browser and are never uploaded or stored.',
};

const uz: Dict = {
  'app.title': 'Laser Model Texture Studio',
  'app.tagline': '3D → 2D rangli qoplama va lazer kesish fayllari',
  'hdr.upload': 'Model ochish', 'hdr.demo': 'Demo model', 'hdr.export': 'Eksport', 'hdr.lang': 'Til',
  'nav.settings': 'Sozlamalar', 'nav.model3d': '3D ko‘rinish', 'nav.sheets': '2D varaqlar',
  'sec.model': '1 · Model', 'sec.transform': '2 · O‘lcham va yo‘nalish', 'sec.sheet': '3 · Varaq', 'sec.unfold': '4 · Yoyish', 'sec.texture': '5 · Rangli qoplama', 'sec.decals': '6 · Rasm, logotip, yozuv',
  'model.drop': 'Fayllarni shu yerga tashlang yoki bosib tanlang', 'model.formats': 'STL · OBJ + MTL + teksturalar · GLB / glTF · FBX',
  'model.info': '{tris} uchburchak · {w} × {h} × {d} mm', 'model.none': 'Model hali yuklanmagan – fayl oching yoki demo modelni tanlang.',
  'model.simplifyBanner': 'Modelda {n} ta uchburchak bor – yoyish uchun juda ko‘p (chegara {max}). Avval soddalashtiring.', 'model.simplify': '~6000 yuzagacha soddalashtirish',
  'demo.choose': 'Demo tanlang…', 'demo.house': 'Uy', 'demo.factory': 'Zavod', 'demo.tower': 'Minora', 'demo.cube': 'Kub',
  'xf.rotate': '90° aylantirish', 'xf.size': 'O‘lcham, mm', 'xf.lock': 'Nisbatni saqlash', 'xf.fit': 'Varaqqa moslash', 'xf.axisHint': 'X eni · Y balandligi · Z chuqurligi',
  'sheet.format': 'Format', 'sheet.custom': 'Maxsus', 'sheet.orientation': 'Yo‘nalish', 'sheet.portrait': 'Portret', 'sheet.landscape': 'Landshaft',
  'sheet.width': 'Kenglik, mm', 'sheet.height': 'Balandlik, mm', 'sheet.margin': 'Xavfsiz chekka, mm (kamida 5)', 'sheet.gap': 'Detallar orasidagi masofa, mm', 'sheet.rotate': 'Joylashda detallarni aylantirishga ruxsat',
  'unfold.tabWidth': 'Yelim tabi kengligi, mm', 'unfold.tabs': 'Yelim tablarini qo‘shish', 'unfold.tol': 'Tekis yuzalarni birlashtirish aniqligi, °', 'unfold.numbers': 'Yuzalarni raqamlash', 'unfold.seamLabels': 'Mos qirralarni belgilash',
  'unfold.bleed': 'Tekstura bleed, mm', 'unfold.manual': 'Qo‘lda kesilgan qirralar', 'unfold.manualHint': '“Qirrani kesish” asbobini tanlab, 3D da qirrani yoki 2D da buklama chizig‘ini bosing.', 'unfold.resetCuts': 'Qo‘lda kesishlarni tozalash', 'unfold.none': 'yo‘q',
  'tool.select': 'Yuza tanlash', 'tool.cut': 'Qirrani kesish', 'view.textured': 'Teksturali', 'view.solid': 'Bir rangli', 'view.wire': 'Karkas', 'view.edges': 'Qirralar', 'view.fit': 'Sig‘dirish',
  'view.hint3d': 'Sudrash: aylantirish · G‘ildirak: masshtab · O‘ng tugma: siljitish · Bosish: yuza tanlash (Shift = bir nechta)',
  'tex.library': 'Materiallar kutubxonasi', 'tex.upload': 'Tekstura yuklash (PNG, JPG, TIFF)', 'tex.mine': 'Mening teksturalarim', 'tex.scope': 'Qo‘llash', 'scope.selection': 'Tanlangan yuzalarga', 'scope.material': 'Shu asl materialli yuzalarga', 'scope.all': 'Butun modelga',
  'tex.scale': 'Tekstura o‘lchami, mm', 'tex.rotate': 'Burilish, °', 'tex.offsetX': 'Siljish X, mm', 'tex.offsetY': 'Siljish Y, mm', 'tex.flipX': 'Gorizontal akslantirish', 'tex.flipY': 'Vertikal akslantirish', 'tex.color': 'Bir xil rang', 'tex.reset': 'Asliga qaytarish',
  'tex.selectHint': '3D da yoki varaqda yuzani tanlang, so‘ng materialni belgilang.', 'tex.selected': '{n} ta yuza tanlangan', 'tex.original': 'Modelning asl teksturasi',
  'decal.add': 'Tanlangan yuzaga qo‘shish', 'decal.text': 'Yozuv', 'decal.textDefault': 'LAZER', 'decal.upload': 'Rasm yuklash', 'decal.none': 'Bu yuzada bezaklar yo‘q.',
  'decal.x': 'X, mm', 'decal.y': 'Y, mm', 'decal.w': 'Eni, mm', 'decal.h': 'Bo‘yi, mm', 'decal.rot': 'Burilish, °', 'decal.opacity': 'Shaffoflik', 'decal.remove': 'O‘chirish', 'decal.content': 'Matn', 'decal.color': 'Rang',
  'lib.concrete': 'Beton', 'lib.brick': 'G‘isht', 'lib.metal': 'Metall', 'lib.steel_plate': 'Po‘lat list', 'lib.roof_tiles': 'Tom cherepitsasi', 'lib.roof_metal': 'Metall tom', 'lib.corrugated': 'Profnastil', 'lib.asphalt': 'Asfalt',
  'lib.soil': 'Tuproq', 'lib.grass': 'O‘t', 'lib.wood': 'Yog‘och', 'lib.facade': 'Derazali fasad', 'lib.glass': 'Shisha fasad', 'lib.solar': 'Quyosh paneli', 'lib.plaster': 'Suvoq', 'lib.sand': 'Qum', 'lib.gravel': 'Shag‘al', 'lib.water': 'Suv',
  'lib.window': 'Deraza', 'lib.door': 'Eshik', 'lib.logo': 'Logotip', 'lib.sign': 'Lavha', 'lib.hazard': 'Ogohlantiruvchi yo‘l',
  'v2.print': 'Rangli', 'v2.cut': 'Kesish', 'v2.fold': 'Buklash', 'v2.engrave': 'Gravirovka', 'v2.reg': 'Belgilar', 'v2.sheet': 'Varaq', 'v2.empty': 'Yoyilgan varaqlar shu yerda ko‘rinadi.', 'v2.zoom': 'Masshtab',
  'v2.legendCut': 'KESISH', 'v2.legendValley': 'Vodiy buklama', 'v2.legendMountain': 'Tog‘ buklama', 'v2.legendEngrave': 'GRAVIROVKA', 'v2.legendReg': 'Registratsiya, X0/Y0 nol nuqta = pastki chap burchak',
  'stat.panels': 'Yuzalar', 'stat.islands': 'Detallar', 'stat.sheets': 'Varaqlar', 'stat.seams': 'Yelim choklari', 'stat.tabs': 'Tablar', 'stat.cut': 'Kesish uzunligi', 'stat.fold': 'Buklash uzunligi', 'stat.time': 'Hisoblash vaqti',
  'check.title': 'Tekshiruvlar', 'check.overlap': 'Detallar bir-birining ustiga tushmagan', 'check.overlapBad': '{n} juft detal ustma-ust tushgan', 'check.cross': 'Kesish va buklash chiziqlari kesishmaydi', 'check.crossBad': '{n} ta kesish/buklash kesishuvi', 'check.bounds': 'Barcha detallar xavfsiz chekka ichida', 'check.boundsBad': '{n} ta detal xavfsiz chekkadan tashqarida', 'check.placed': 'Barcha detallar joylashtirildi', 'check.placedBad': '{n} ta detal varaqqa sig‘madi',
  'warn.tabOmitted': '{seam}-chok uchun yelim tabiga joy yo‘q; qirralarni to‘g‘ridan-to‘g‘ri yelimlang.', 'warn.islandTooLarge': '{island}-detal varaqning foydalanish mumkin bo‘lgan maydonidan katta – kattaroq varaq yoki kichikroq model tanlang.', 'warn.unplaced': '{island}-detal varaqqa sig‘maydi.', 'warn.overlap': '{n} juft detal ustma-ust tushgan.', 'warn.crossing': '{n} ta kesish/buklash chiziqlari kesishuvi aniqlandi.',
  'err.noFiles': 'Fayl tanlanmadi.', 'err.unsupported': 'Qo‘llab-quvvatlanmaydigan fayl. STL, OBJ (+MTL, teksturalar), GLB/glTF yoki FBX ishlating.', 'err.empty': 'Faylda mesh geometriyasi yo‘q.', 'err.parse': 'Model faylini o‘qib bo‘lmadi', 'err.image': 'Rasmni o‘qib bo‘lmadi', 'err.compute': 'Yoyishda xatolik', 'err.canvas': 'Brauzer bunchalik katta rasm yarata olmadi. Kichikroq varaq yoki boshqa formatni tanlang.', 'err.export': 'Eksportda xatolik',
  'msg.loaded': '“{name}” modeli yuklandi.', 'msg.simplified': 'Model {n} ta uchburchakkacha soddalashtirildi.', 'msg.selectPanel': 'Avval yuzani tanlang.', 'msg.exported': 'Fayllar tayyor: {n} ta',
  'busy.compute': 'Yoyilmoqda…', 'busy.paint': 'Bo‘yalmoqda…',
  'export.title': 'Ishlab chiqarish uchun eksport', 'export.preview': 'Yuklab olishdan oldin ko‘rish', 'export.p2d': '2D varaq', 'export.p3d': '3D model', 'export.sheet': 'Varaq', 'export.allSheets': 'Barcha varaqlar',
  'export.color': 'Rangli qoplama (300 DPI)', 'export.laser': 'Lazer kesish (vektor, mm 1:1)', 'export.production': 'Birlashtirilgan ishlab chiqarish fayli', 'export.instructions': 'Yig‘ish yo‘riqnomasi', 'export.perSheet': 'Har bir varaq uchun alohida fayl',
  'export.pdfPrint': 'Chop etish PDF', 'export.pdfProd': 'Ishlab chiqarish PDF (rang + kesish/buklash/belgilar)', 'export.pdfInstr': 'Yig‘ish yo‘riqnomasi PDF', 'export.zip': 'Hammasi (ZIP)', 'export.download': 'Yuklab olish', 'export.working': 'Fayllar tayyorlanmoqda…', 'export.privacy': 'Fayllar brauzeringizda yaratiladi va qurilmangizdan chiqmaydi.',
  'export.issues': 'Joylashda muammolar bor (tekshiruvlar panelini ko‘ring). Kesishdan oldin tuzating.',
  'export.select': 'Formatlarni tanlang', 'export.go': 'Tanlanganlarni yuklab olish', 'export.noneSelected': 'Kamida bitta formatni tanlang.',
  'instr.title': 'Yig‘ish yo‘riqnomasi', 'instr.model': 'Model', 'instr.size': 'O‘lcham', 'instr.faces': 'Yuzalar', 'instr.sheets': 'Varaqlar', 'instr.legend': 'Chiziqlar belgilari', 'instr.steps': 'Yig‘ish tartibi', 'instr.step': 'Qadam', 'instr.face': 'Yuza', 'instr.onSheet': 'Varaq', 'instr.glue': 'Yelimlash', 'instr.none': 'tabsiz – tablarni qabul qiladi',
  'instr.tabs': '{a}-tab → {b}-yuza', 'instr.how': 'Qizil chiziqlar bo‘ylab kesing. Ko‘k chiziqlarni buking (punktir = vodiy, nuqta-punktir = tog‘). N-tabni N raqamli qirraga yelimlang. 1-yuzadan boshlab yuqoriga yig‘ing.', 'instr.overview': 'Varaqlar umumiy ko‘rinishi',
  'privacy.note': 'Fayllaringiz brauzerning o‘zida qayta ishlanadi, yuklanmaydi va saqlanmaydi.',
};

const ru: Dict = {
  'app.title': 'Laser Model Texture Studio',
  'app.tagline': '3D → 2D цветное покрытие и файлы для лазерной резки',
  'hdr.upload': 'Открыть модель', 'hdr.demo': 'Демо-модель', 'hdr.export': 'Экспорт', 'hdr.lang': 'Язык',
  'nav.settings': 'Настройки', 'nav.model3d': '3D вид', 'nav.sheets': '2D листы',
  'sec.model': '1 · Модель', 'sec.transform': '2 · Размер и ориентация', 'sec.sheet': '3 · Лист', 'sec.unfold': '4 · Развёртка', 'sec.texture': '5 · Цветное покрытие', 'sec.decals': '6 · Изображения, логотипы, текст',
  'model.drop': 'Перетащите файлы сюда или нажмите для выбора', 'model.formats': 'STL · OBJ + MTL + текстуры · GLB / glTF · FBX',
  'model.info': '{tris} треугольников · {w} × {h} × {d} мм', 'model.none': 'Модель ещё не загружена – откройте файл или выберите демо-модель.',
  'model.simplifyBanner': 'В модели {n} треугольников – слишком много для развёртки (лимит {max}). Сначала упростите её.', 'model.simplify': 'Упростить до ~6000 граней',
  'demo.choose': 'Выберите демо…', 'demo.house': 'Дом', 'demo.factory': 'Завод', 'demo.tower': 'Башня', 'demo.cube': 'Куб',
  'xf.rotate': 'Повернуть на 90°', 'xf.size': 'Размер, мм', 'xf.lock': 'Сохранять пропорции', 'xf.fit': 'Вписать в лист', 'xf.axisHint': 'X ширина · Y высота · Z глубина',
  'sheet.format': 'Формат', 'sheet.custom': 'Свой', 'sheet.orientation': 'Ориентация', 'sheet.portrait': 'Книжная', 'sheet.landscape': 'Альбомная',
  'sheet.width': 'Ширина, мм', 'sheet.height': 'Высота, мм', 'sheet.margin': 'Безопасный отступ, мм (мин. 5)', 'sheet.gap': 'Зазор между деталями, мм', 'sheet.rotate': 'Разрешить поворот деталей при раскладке',
  'unfold.tabWidth': 'Ширина клеевого клапана, мм', 'unfold.tabs': 'Добавлять клеевые клапаны', 'unfold.tol': 'Допуск объединения плоских граней, °', 'unfold.numbers': 'Нумеровать грани', 'unfold.seamLabels': 'Маркировать парные рёбра',
  'unfold.bleed': 'Припуск текстуры (bleed), мм', 'unfold.manual': 'Рёбра, разрезанные вручную', 'unfold.manualHint': 'Выберите инструмент «Разрезать ребро» и нажмите на ребро в 3D или линию сгиба в 2D.', 'unfold.resetCuts': 'Сбросить ручные разрезы', 'unfold.none': 'нет',
  'tool.select': 'Выбор грани', 'tool.cut': 'Разрезать ребро', 'view.textured': 'С текстурой', 'view.solid': 'Сплошной', 'view.wire': 'Каркас', 'view.edges': 'Рёбра', 'view.fit': 'Вписать',
  'view.hint3d': 'Перетаскивание: вращение · Колесо: масштаб · Правая кнопка: сдвиг · Клик: выбор грани (Shift = несколько)',
  'tex.library': 'Библиотека материалов', 'tex.upload': 'Загрузить текстуру (PNG, JPG, TIFF)', 'tex.mine': 'Мои текстуры', 'tex.scope': 'Применить к', 'scope.selection': 'Выбранным граням', 'scope.material': 'Граням с тем же исходным материалом', 'scope.all': 'Всей модели',
  'tex.scale': 'Размер плитки, мм', 'tex.rotate': 'Поворот, °', 'tex.offsetX': 'Сдвиг X, мм', 'tex.offsetY': 'Сдвиг Y, мм', 'tex.flipX': 'Отразить по горизонтали', 'tex.flipY': 'Отразить по вертикали', 'tex.color': 'Однотонный цвет', 'tex.reset': 'Вернуть исходное',
  'tex.selectHint': 'Выберите грань в 3D или на листе, затем материал.', 'tex.selected': 'Выбрано граней: {n}', 'tex.original': 'Исходная текстура модели',
  'decal.add': 'Добавить на выбранную грань', 'decal.text': 'Текст', 'decal.textDefault': 'ЛАЗЕР', 'decal.upload': 'Загрузить изображение', 'decal.none': 'На этой грани нет декора.',
  'decal.x': 'X, мм', 'decal.y': 'Y, мм', 'decal.w': 'Ширина, мм', 'decal.h': 'Высота, мм', 'decal.rot': 'Поворот, °', 'decal.opacity': 'Непрозрачность', 'decal.remove': 'Удалить', 'decal.content': 'Текст', 'decal.color': 'Цвет',
  'lib.concrete': 'Бетон', 'lib.brick': 'Кирпич', 'lib.metal': 'Металл', 'lib.steel_plate': 'Стальной лист', 'lib.roof_tiles': 'Черепица', 'lib.roof_metal': 'Металлическая кровля', 'lib.corrugated': 'Профнастил', 'lib.asphalt': 'Асфальт',
  'lib.soil': 'Земля', 'lib.grass': 'Трава', 'lib.wood': 'Дерево', 'lib.facade': 'Фасад с окнами', 'lib.glass': 'Стеклянный фасад', 'lib.solar': 'Солнечная панель', 'lib.plaster': 'Штукатурка', 'lib.sand': 'Песок', 'lib.gravel': 'Гравий', 'lib.water': 'Вода',
  'lib.window': 'Окно', 'lib.door': 'Дверь', 'lib.logo': 'Логотип', 'lib.sign': 'Табличка', 'lib.hazard': 'Сигнальная полоса',
  'v2.print': 'Цвет', 'v2.cut': 'Рез', 'v2.fold': 'Сгиб', 'v2.engrave': 'Гравировка', 'v2.reg': 'Метки', 'v2.sheet': 'Лист', 'v2.empty': 'Здесь появятся развёрнутые листы.', 'v2.zoom': 'Масштаб',
  'v2.legendCut': 'РЕЗ', 'v2.legendValley': 'Сгиб «долина»', 'v2.legendMountain': 'Сгиб «гора»', 'v2.legendEngrave': 'ГРАВИРОВКА', 'v2.legendReg': 'Регистрация, нуль X0/Y0 = левый нижний угол',
  'stat.panels': 'Грани', 'stat.islands': 'Детали', 'stat.sheets': 'Листы', 'stat.seams': 'Клеевые швы', 'stat.tabs': 'Клапаны', 'stat.cut': 'Длина реза', 'stat.fold': 'Длина сгибов', 'stat.time': 'Время расчёта',
  'check.title': 'Проверки', 'check.overlap': 'Детали не перекрываются', 'check.overlapBad': 'Перекрываются пар деталей: {n}', 'check.cross': 'Линии реза и сгиба не пересекаются', 'check.crossBad': 'Пересечений реза и сгиба: {n}', 'check.bounds': 'Все детали внутри безопасного отступа', 'check.boundsBad': 'Деталей за безопасным отступом: {n}', 'check.placed': 'Все детали размещены', 'check.placedBad': 'Деталей, не поместившихся на лист: {n}',
  'warn.tabOmitted': 'Нет места для клапана шва {seam}; склейте края напрямую.', 'warn.islandTooLarge': 'Деталь {island} больше полезной области листа – выберите лист побольше или модель поменьше.', 'warn.unplaced': 'Деталь {island} не помещается на лист.', 'warn.overlap': 'Обнаружены перекрытия деталей: {n}.', 'warn.crossing': 'Обнаружены пересечения линий реза и сгиба: {n}.',
  'err.noFiles': 'Файлы не выбраны.', 'err.unsupported': 'Неподдерживаемый файл. Используйте STL, OBJ (+MTL, текстуры), GLB/glTF или FBX.', 'err.empty': 'В файле нет геометрии (mesh).', 'err.parse': 'Не удалось прочитать файл модели', 'err.image': 'Не удалось прочитать изображение', 'err.compute': 'Ошибка развёртки', 'err.canvas': 'Браузер не смог создать изображение такого размера. Выберите лист поменьше или другой формат.', 'err.export': 'Ошибка экспорта',
  'msg.loaded': 'Модель «{name}» загружена.', 'msg.simplified': 'Модель упрощена до {n} треугольников.', 'msg.selectPanel': 'Сначала выберите грань.', 'msg.exported': 'Файлы готовы: {n}',
  'busy.compute': 'Развёртка…', 'busy.paint': 'Раскраска…',
  'export.title': 'Экспорт для производства', 'export.preview': 'Предпросмотр перед скачиванием', 'export.p2d': '2D лист', 'export.p3d': '3D модель', 'export.sheet': 'Лист', 'export.allSheets': 'Все листы',
  'export.color': 'Цветное покрытие (300 DPI)', 'export.laser': 'Лазерная резка (вектор, мм 1:1)', 'export.production': 'Объединённый производственный файл', 'export.instructions': 'Инструкция по сборке', 'export.perSheet': 'Отдельный файл для каждого листа',
  'export.pdfPrint': 'PDF для печати', 'export.pdfProd': 'Производственный PDF (цвет + рез/сгиб/метки)', 'export.pdfInstr': 'PDF инструкции по сборке', 'export.zip': 'Всё сразу (ZIP)', 'export.download': 'Скачать', 'export.working': 'Подготовка файлов…', 'export.privacy': 'Файлы создаются в вашем браузере и не покидают устройство.',
  'export.issues': 'В раскладке есть проблемы (см. панель проверок). Исправьте их перед резкой.',
  'export.select': 'Выберите форматы', 'export.go': 'Скачать выбранное', 'export.noneSelected': 'Выберите хотя бы один формат.',
  'instr.title': 'Инструкция по сборке', 'instr.model': 'Модель', 'instr.size': 'Размер', 'instr.faces': 'Грани', 'instr.sheets': 'Листы', 'instr.legend': 'Обозначения линий', 'instr.steps': 'Порядок сборки', 'instr.step': 'Шаг', 'instr.face': 'Грань', 'instr.onSheet': 'Лист', 'instr.glue': 'Склейка', 'instr.none': 'без клапанов – принимает клапаны',
  'instr.tabs': 'клапан {a} → грань {b}', 'instr.how': 'Режьте по красным линиям. Сгибайте синие линии (пунктир = «долина», штрих-пунктир = «гора»). Клапан N приклеивайте к ребру с номером N. Собирайте от грани 1 вверх.', 'instr.overview': 'Обзор листов',
  'privacy.note': 'Ваши файлы обрабатываются локально в браузере, не загружаются и не сохраняются.',
};

const DICTS: Record<Lang, Dict> = { en, uz, ru };

function format(s: string, params?: Record<string, string | number>) {
  return params ? s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? '')) : s;
}
export function trLang(lang: Lang, key: string, params?: Record<string, string | number>): string {
  return format(DICTS[lang][key] ?? en[key] ?? key, params);
}
/** Translate using the current language (non-React code). */
export function tr(key: string, params?: Record<string, string | number>): string { return trLang(getState().lang, key, params); }
/** React hook: re-renders on language change. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return (key: string, params?: Record<string, string | number>) => trLang(lang, key, params);
}
export const DICT_KEYS = { en, uz, ru };
