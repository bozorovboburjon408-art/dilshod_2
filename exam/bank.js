// Oflayn zaxira: AI serveri yo'q bo'lganda ishlaydigan tayyor mavzular.
const BANK = {
  informatika: [
    ['Kompyuterning "miyasi" deb qaysi qurilma ataladi?', ['Protsessor', 'Monitor', 'Klaviatura', 'Printer'], 0, 'Protsessor (CPU) barcha buyruqlarni bajaradi.'],
    ['1 bayt necha bitga teng?', ['4', '8', '16', '1024'], 1, '1 bayt = 8 bit.'],
    ['Quyidagilardan qaysi biri operatsion tizim?', ['Excel', 'Chrome', 'Linux', 'Word'], 2, 'Linux — operatsion tizim, qolganlari dasturlar.'],
    ['RAM xotirasi nima uchun ishlatiladi?', ['Fayllarni doimiy saqlash', 'Ishlayotgan dasturlar ma\'lumotini vaqtincha saqlash', 'Tasvirni chiqarish', 'Internetga ulanish'], 1, 'RAM — tezkor, vaqtinchalik xotira.'],
    ['Veb-sahifalar yoziladigan belgilash tili qaysi?', ['Python', 'HTML', 'SQL', 'C++'], 1, 'HTML — sahifa tuzilishini belgilaydi.'],
    ['Ikkilik sanoq tizimida qaysi raqamlar ishlatiladi?', ['0 va 1', '1 va 2', '0 dan 9 gacha', '0 dan 7 gacha'], 0, 'Ikkilik tizim faqat 0 va 1 dan iborat.'],
    ['Ikkilik 101 o\'nlik sanoq tizimida nechaga teng?', ['3', '4', '5', '6'], 2, '1·4 + 0·2 + 1·1 = 5.'],
    ['Kompyuter tarmog\'ida ma\'lumotlarni yo\'naltiruvchi qurilma qaysi?', ['Router', 'Skaner', 'Sichqoncha', 'Kolonka'], 0, 'Router tarmoqlar orasida paketlarni yo\'naltiradi.'],
    ['Quyidagilardan qaysi biri kirish qurilmasi?', ['Printer', 'Monitor', 'Skaner', 'Proyektor'], 2, 'Skaner ma\'lumotni kompyuterga kiritadi.'],
    ['URL nimani bildiradi?', ['Internetdagi resurs manzilini', 'Antivirus turini', 'Dastur tilini', 'Xotira hajmini'], 0, 'URL — resursning to\'liq manzili.'],
  ],
  matematika: [
    ['12 × 12 nechaga teng?', ['124', '144', '154', '134'], 1, '12² = 144.'],
    ['Uchburchak ichki burchaklari yig\'indisi necha gradus?', ['90°', '270°', '180°', '360°'], 2, 'Har qanday uchburchakda yig\'indi 180°.'],
    ['x + 7 = 15 tenglamada x nechaga teng?', ['6', '7', '8', '22'], 2, 'x = 15 − 7 = 8.'],
    ['Radiusi 3 bo\'lgan doira yuzi (π ≈ 3,14)?', ['18,84', '28,26', '9,42', '56,52'], 1, 'S = πr² = 3,14·9 = 28,26.'],
    ['Quyidagilardan qaysi biri tub son?', ['21', '27', '29', '33'], 2, '29 faqat 1 ga va o\'ziga bo\'linadi.'],
    ['√81 nechaga teng?', ['7', '8', '9', '10'], 2, '9·9 = 81.'],
    ['50 ning 20 foizi nechaga teng?', ['5', '10', '15', '20'], 1, '50 · 0,2 = 10.'],
    ['To\'g\'ri to\'rtburchak tomonlari 5 va 8 bo\'lsa, perimetri?', ['13', '26', '40', '80'], 1, 'P = 2(5+8) = 26.'],
    ['2³ nechaga teng?', ['6', '8', '9', '16'], 1, '2·2·2 = 8.'],
    ['Quyidagilardan qaysi biri juft son?', ['37', '51', '64', '79'], 2, '64 ikkiga qoldiqsiz bo\'linadi.'],
  ],
};
