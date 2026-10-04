/* ChemEdu — o'quv kontenti: mavzular, testlar, tajribalar, SDS, shablonlar, bilimlar bazasi */
(function () {
  const CE = (window.CE = window.CE || {});

  const FIELDS = [
    { id: 'inorg', name: 'Noorganik kimyo', color: 'blue', topics: [
      { t: 'Atom tuzilishi va davriy qonun', key: ["Atom yadro va elektron qobiqlardan iborat", "Elektron konfiguratsiya Madelung qoidasi bo'yicha to'ldiriladi", "Davriy qonun: xossalar atom raqamiga davriy bog'liq", "Atom radiusi, ionlanish energiyasi va elektromanfiylik davr/guruh bo'ylab o'zgaradi"], formula: 'E(n,l): n + l qoidasi', ex: "Fe (Z=26): [Ar] 3d6 4s2" },
      { t: 'Kimyoviy bog\'lanish turlari', key: ["Ion bog'lanish: ΔEN > 1,7", "Kovalent qutbli va qutbsiz bog'lanish", "Metall bog'lanish — elektron «dengiz»", "Vodorod bog'lanish suv va oqsillar xossalarini belgilaydi"], formula: 'ΔEN = |EN₁ − EN₂|', ex: "NaCl — ion, HCl — qutbli kovalent, Cl₂ — qutbsiz" },
      { t: 'Oksidlar, kislotalar, asoslar va tuzlar', key: ["Oksidlar: asosli, kislotali, amfoter, befarq", "Kislotalar H⁺ beradi, asoslar OH⁻ beradi", "Neytrallanish reaksiyasida tuz va suv hosil bo'ladi", "Amfoter birikmalar (Al₂O₃, ZnO) ham kislota, ham asos bilan reaksiyaga kirishadi"], formula: 'Kislota + Asos → Tuz + H₂O', ex: "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O" },
      { t: 'Oksidlanish-qaytarilish reaksiyalari', key: ["Oksidlanish darajasi — shartli zaryad", "Oksidlovchi elektron qabul qiladi, qaytaruvchi beradi", "Elektron balans usuli koeffitsientlarni topadi", "Galvanik element — OQR dan elektr energiyasi"], formula: 'Σ e⁻(berilgan) = Σ e⁻(olingan)', ex: "Zn + CuSO₄ → ZnSO₄ + Cu" },
      { t: 'Metallar va ularning birikmalari', key: ["Metallar kuchlanish qatori", "Qotishmalar: po'lat, bronza, jez", "Metallurgiya: pirometallurgiya va gidrometallurgiya", "Korroziya va himoya usullari"], formula: 'Mⁿ⁺ + ne⁻ → M', ex: "Fe₂O₃ + 3CO → 2Fe + 3CO₂" },
      { t: 'Metallmaslar: galogenlar, VI va V guruh', key: ["Galogenlarning oksidlovchilik xossasi F > Cl > Br > I", "Sulfat kislota ishlab chiqarish (kontakt usuli)", "Ammiak sintezi (Xaber–Bosh)", "Fosfor va fosforitlarning qayta ishlanishi"], formula: 'N₂ + 3H₂ ⇌ 2NH₃', ex: "Ca₃(PO₄)₂ + 3H₂SO₄ → 3CaSO₄ + 2H₃PO₄" },
      { t: 'Kompleks birikmalar', key: ["Markaziy ion, ligandlar, koordinatsion son", "Kristall maydon nazariyasi", "Ligand almashinish va barqarorlik doimiysi", "Analitik va biologik ahamiyati (gemoglobin)"], formula: '[M(L)ₙ]ᵐ⁺', ex: "K₄[Fe(CN)₆] — sariq qon tuzi" }
    ] },
    { id: 'org', name: 'Organik kimyo', color: 'red', topics: [
      { t: 'Alkanlar va sikloalkanlar', key: ["sp³ gibridlanish, σ-bog'lar", "Gomologik qator CₙH₂ₙ₊₂", "Radikal almashinish (galogenlash)", "Konformatsiyalar: staggered va eclipsed"], formula: 'CₙH₂ₙ₊₂', ex: "CH₄ + Cl₂ →(hν) CH₃Cl + HCl" },
      { t: 'Alkenlar va alkinlar', key: ["π-bog' va qo'shilish reaksiyalari", "Markovnikov qoidasi", "Polimerlanish: polietilen, polipropilen", "Alkinlarning kislotaliligi"], formula: 'CₙH₂ₙ / CₙH₂ₙ₋₂', ex: "CH₂=CH₂ + HBr → CH₃CH₂Br" },
      { t: 'Aromatik birikmalar', key: ["Hyukkel qoidasi: 4n+2 π-elektron", "Elektrofil almashinish (SEAr)", "Orientantlar: o-, p- va m-yo'naltiruvchilar", "Benzol — rezonans barqarorligi"], formula: '4n + 2 = π-elektronlar', ex: "C₆H₆ + HNO₃ →(H₂SO₄) C₆H₅NO₂ + H₂O" },
      { t: 'Spirtlar, fenollar va efirlar', key: ["Gidroksil guruhli birikmalar", "Spirtlarning oksidlanishi aldegid va ketonlarga", "Degidratatsiya: efir yoki alken", "Fenolning kislotali xossalari"], formula: 'R–OH', ex: "CH₃CH₂OH →[O] CH₃CHO → CH₃COOH" },
      { t: 'Karbonil birikmalar va karbon kislotalar', key: ["Nukleofil qo'shilish", "Eterifikatsiya", "Aldol kondensatsiya", "Kumush ko'zgu reaksiyasi"], formula: 'RCOOH + R′OH ⇌ RCOOR′ + H₂O', ex: "CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O" },
      { t: 'Aminlar va aminokislotalar', key: ["Aminlarning asosliligi", "Aminokislotalarning amfoterligi", "Peptid bog'i", "Izoelektrik nuqta"], formula: 'R–NH₂', ex: "Glitsin: NH₂CH₂COOH ⇌ ⁺NH₃CH₂COO⁻" },
      { t: 'Izomeriya va stereokimyo', key: ["Strukturaviy va fazoviy izomeriya", "Xirallik va enantiomerlar", "R/S nomenklaturasi", "cis–trans izomeriya"], formula: '2ⁿ stereoizomer (n — xiral markaz)', ex: "Sut kislota: L- va D-shakllar" }
    ] },
    { id: 'anal', name: 'Analitik kimyo', color: 'cyan', topics: [
      { t: 'Eritmalar konsentratsiyasi', key: ["Molyarlik, molallik, normallik, massa ulushi", "Suyultirish qonuni", "Standart eritmalar tayyorlash", "Birlik konvertatsiyasi"], formula: 'C = n / V;  C₁V₁ = C₂V₂', ex: "0,1 M NaOH, 500 mL: m = 0,1·0,5·40 = 2,00 g" },
      { t: 'Kislota-asosli titrlash', key: ["Ekvivalent nuqta va indikator", "Titrlash egri chizig'i", "Kuchli va kuchsiz elektrolitlar", "Bufer eritmalar"], formula: 'C₁V₁ = C₂V₂ (ekv. nuqtada)', ex: "25 mL 0,1 M HCl ← 25 mL 0,1 M NaOH, pH=7" },
      { t: 'pH va bufer eritmalar', key: ["pH = −lg[H⁺]", "Kuchsiz kislota Ka", "Henderson–Hasselbalch tenglamasi", "Bufer sig'imi"], formula: 'pH = pKa + lg([A⁻]/[HA])', ex: "Atsetat bufer: pKa=4,76" },
      { t: 'Cho\'kma hosil bo\'lishi va eruvchanlik', key: ["Eruvchanlik ko'paytmasi Ksp", "Bir ismli ion ta'siri", "Gravimetrik tahlil", "Cho'ktirish sharoitlari"], formula: 'Ksp = [Aᵐ⁺]ᵃ[Bⁿ⁻]ᵇ', ex: "AgCl: Ksp = 1,8·10⁻¹⁰" },
      { t: 'Spektrofotometriya', key: ["Buger–Lambert–Ber qonuni", "Kalibrlash grafigi", "Optik zichlik va o'tkazuvchanlik", "Aniqlash chegarasi"], formula: 'A = ε·l·c', ex: "A = 0,45; ε = 9000; l = 1 sm → c = 5·10⁻⁵ M" },
      { t: 'Xromatografiya', key: ["Harakatchan va qo'zg'almas faza", "Rf, ushlanish vaqti, ajratish", "GC va HPLC prinsipi", "Sifat va miqdoriy tahlil"], formula: 'Rf = l_modda / l_erituvchi', ex: "Rf = 0,45 — qog'oz xromatografiyasi" },
      { t: 'Tahlil natijalarini statistik qayta ishlash', key: ["O'rtacha, standart og'ish, ishonch oralig'i", "Student t-mezoni", "Q-test: shubhali natijani chiqarish", "Aniqlik va to'g'rilik"], formula: 'x̄ ± t·s/√n', ex: "n=5, s=0,02, t(95%)=2,78" }
    ] },
    { id: 'phys', name: 'Fizik kimyo', color: 'purple', topics: [
      { t: 'Termodinamika asoslari', key: ["Birinchi qonun: ΔU = Q − W", "Entalpiya va Gess qonuni", "Entropiya va Gibbs energiyasi", "Jarayon yo'nalishi: ΔG < 0"], formula: 'ΔG = ΔH − TΔS', ex: "CH₄ yonishi: ΔH° = −890 kJ/mol" },
      { t: 'Kimyoviy kinetika', key: ["Reaksiya tezligi va tartibi", "Arrenius tenglamasi", "Katalizning ta'siri", "Yarim parchalanish davri"], formula: 'k = A·e^(−Ea/RT)', ex: "1-tartibli: t½ = ln2 / k" },
      { t: 'Kimyoviy muvozanat', key: ["Muvozanat doimiysi K", "Le Shatelye prinsipi", "K va ΔG° orasidagi bog'liqlik", "Gaz va eritma muvozanatlari"], formula: 'ΔG° = −RT·lnK', ex: "N₂ + 3H₂ ⇌ 2NH₃: bosim oshsa — NH₃ ko'payadi" },
      { t: 'Elektrokimyo', key: ["Elektrod potensiali", "Nernst tenglamasi", "Elektroliz va Faradey qonunlari", "Akkumulyator va yoqilg'i elementlari"], formula: 'E = E° − (RT/nF)·lnQ', ex: "Daniel elementi: E° = 1,10 V" },
      { t: 'Gaz qonunlari', key: ["Boyl–Mariott, Sharl, Gey-Lyussak", "Ideal gaz holat tenglamasi", "Dalton qonuni", "Real gazlar — Van-der-Vaals"], formula: 'PV = nRT', ex: "1 mol, 273,15 K, 1 atm: V = 22,4 L" },
      { t: 'Eritmalar xossalari (kolligativ)', key: ["Bug' bosimining pasayishi (Raul)", "Qaynash harorati ko'tarilishi", "Muzlash harorati pasayishi", "Osmotik bosim"], formula: 'ΔT = i·K·m', ex: "1 m NaCl: ΔT_muz ≈ −3,7 °C" }
    ] },
    { id: 'bio', name: 'Biokimyo', color: 'green', topics: [
      { t: 'Aminokislotalar va oqsillar', key: ["20 ta standart aminokislota", "Birlamchi–to'rtlamchi struktura", "Denaturatsiya", "Elektroforez"], formula: 'pI = (pKa₁ + pKa₂) / 2', ex: "Glitsin pI ≈ 5,97" },
      { t: 'Fermentlar kinetikasi', key: ["Faol markaz va substrat", "Michaelis–Menten tenglamasi", "Ingibitorlar: raqobatli va raqobatsiz", "Lineweaver–Burk grafigi"], formula: 'v = Vmax·[S] / (Km + [S])', ex: "[S] = Km bo'lsa, v = Vmax/2" },
      { t: 'Uglevodlar', key: ["Monosaxaridlar, disaxaridlar, polisaxaridlar", "Glyukoza halqali shakli", "Glikoliz", "Kraxmal va sellyuloza"], formula: 'C₆H₁₂O₆', ex: "Glikoliz: glyukoza → 2 piruvat + 2 ATP" },
      { t: 'Lipidlar va membranalar', key: ["Yog' kislotalari", "Fosfolipid qo'sh qavat", "β-oksidlanish", "Xolesterin"], formula: 'Triglitserid = glitserin + 3 yog\' kislotasi', ex: "Stearin kislota C₁₇H₃₅COOH" },
      { t: 'Nuklein kislotalar', key: ["DNK va RNK tuzilishi", "Komplementarlik: A–T, G–C", "Replikatsiya, transkripsiya, translatsiya", "PZR (PCR) prinsipi"], formula: 'Chargaff qoidasi: A=T, G=C', ex: "DNK qo'sh spirali" },
      { t: 'Bioenergetika va metabolizm', key: ["ATP — universal energiya valyutasi", "Krebs sikli", "Oksidlovchi fosforlanish", "Fotosintez"], formula: 'ATP + H₂O → ADP + Pᵢ (ΔG° ≈ −30,5 kJ/mol)', ex: "1 glyukoza → ~30–32 ATP" }
    ] },
    { id: 'mat', name: 'Materialshunoslik', color: 'orange', topics: [
      { t: 'Kristall tuzilish va nuqsonlar', key: ["Bravais panjaralari", "Miller indekslari", "Nuqta, chiziqli va sirt nuqsonlari", "Rentgen difraksiyasi (XRD)"], formula: 'nλ = 2d·sinθ  (Bregg)', ex: "Cu — FCC, a = 3,61 Å" },
      { t: 'Metall va qotishmalar', key: ["Faza diagrammalari", "Temir–uglerod diagrammasi", "Termik ishlov: toblash, bo'shatish", "Mexanik xossalar"], formula: 'Gibbs fazalar qoidasi: F = C − P + 2', ex: "Po'lat: 0,02–2,14 % C" },
      { t: 'Polimerlar va kompozitlar', key: ["Polimerlanish: zanjirli va bosqichli", "Molekulyar massa taqsimoti", "Shishalanish harorati Tg", "Tolali kompozitlar"], formula: 'Mn = Σ NᵢMᵢ / Σ Nᵢ', ex: "PET, PVX, kevlar" },
      { t: 'Keramika va shisha', key: ["Oksidli va nooksidli keramika", "Sinterlash", "Shishalanish", "Issiqlikka chidamlilik"], formula: 'Sinterlash: T ≈ 0,5–0,8 Tm', ex: "Al₂O₃ — yuqori qattiqlik" },
      { t: 'Nanomateriallar', key: ["Kvant o'lchamli effekt", "Sintez: sol-gel, CVD, gidrotermal", "Xarakterlash: TEM, SEM, BET", "Katalizdagi qo'llanilishi"], formula: 'Sirt/hajm ∝ 1/r', ex: "TiO₂ nanozarrachalari — fotokatalizator" },
      { t: 'Konchilik kimyosi va foydali qazilmalar', key: ["Rudalarni boyitish: flotatsiya, magnit, gravitatsion", "Fosforitlar va nodir yer elementlari", "Gidrometallurgiya: yuvish (leaching)", "Atrof-muhit va chiqindilarni qayta ishlash"], formula: "Ajratib olish = (m_konsentrat·c_k) / (m_ruda·c_r)·100%", ex: "Fosforitdan P₂O₅ ajratib olish darajasi" }
    ] }
  ];

  const TESTS = [
    // Noorganik
    { f: 'inorg', q: "Fe (Z = 26) atomining tashqi elektron konfiguratsiyasi qaysi?", o: ["3d⁶ 4s²", "3d⁸", "4s² 4p⁶", "3d⁵ 4s³"], a: 0, e: "26 ta elektron: [Ar] 3d⁶ 4s²." },
    { f: 'inorg', q: "Qaysi birikmada ion bog'lanish mavjud?", o: ["HCl", "NaCl", "Cl₂", "CH₄"], a: 1, e: "ΔEN(Na, Cl) = 2,23 > 1,7 — ion bog'lanish." },
    { f: 'inorg', q: "H₂SO₄ dagi oltingugurtning oksidlanish darajasi:", o: ["+2", "+4", "+6", "−2"], a: 2, e: "2(+1) + x + 4(−2) = 0 → x = +6." },
    { f: 'inorg', q: "Amfoter oksidni toping:", o: ["Na₂O", "CO₂", "Al₂O₃", "SO₃"], a: 2, e: "Al₂O₃ ham kislota, ham asos bilan reaksiyaga kirishadi." },
    { f: 'inorg', q: "Ammiak sanoatda qanday usulda olinadi?", o: ["Kontakt usuli", "Xaber–Bosh jarayoni", "Solve usuli", "Elektroliz"], a: 1, e: "N₂ + 3H₂ ⇌ 2NH₃ (Fe katalizator, yuqori bosim)." },
    { f: 'inorg', q: "Davr bo'ylab chapdan o'ngga atom radiusi:", o: ["ortadi", "kamayadi", "o'zgarmaydi", "avval ortib, so'ng kamayadi"], a: 1, e: "Yadro zaryadi ortadi, elektronlar kuchliroq tortiladi." },
    { f: 'inorg', q: "Eng kuchli oksidlovchi galogen:", o: ["I₂", "Br₂", "Cl₂", "F₂"], a: 3, e: "Ftor eng elektromanfiy element." },
    { f: 'inorg', q: "K₄[Fe(CN)₆] dagi temirning oksidlanish darajasi:", o: ["+1", "+2", "+3", "+6"], a: 1, e: "4(+1) + x + 6(−1) = 0 → x = +2." },
    // Organik
    { f: 'org', q: "Metan molekulasida uglerod qanday gibridlanishda?", o: ["sp", "sp²", "sp³", "dsp²"], a: 2, e: "4 ta σ-bog' → sp³, tetraedr, 109,5°." },
    { f: 'org', q: "Benzol uchun Hyukkel qoidasiga ko'ra π-elektronlar soni:", o: ["4", "6", "8", "10"], a: 1, e: "4n+2, n=1 → 6 ta π-elektron." },
    { f: 'org', q: "Etanolning oksidlanishidan avval qaysi modda hosil bo'ladi?", o: ["Sirka kislota", "Atsetaldegid", "Atseton", "Etilen"], a: 1, e: "Birlamchi spirt → aldegid → kislota." },
    { f: 'org', q: "Propenga HBr qo'shilganda asosiy mahsulot:", o: ["1-bromopropan", "2-bromopropan", "1,2-dibromopropan", "Propan"], a: 1, e: "Markovnikov qoidasi: H ko'proq vodorodli C ga qo'shiladi." },
    { f: 'org', q: "Aminokislotalarning umumiy xususiyati:", o: ["Faqat kislotali", "Faqat asosli", "Amfoter", "Befarq"], a: 2, e: "–COOH va –NH₂ guruhlari bor." },
    { f: 'org', q: "Eterifikatsiya reaksiyasida hosil bo'ladi:", o: ["Murakkab efir va suv", "Aldegid", "Alken", "Amin"], a: 0, e: "Kislota + spirt ⇌ murakkab efir + suv." },
    { f: 'org', q: "C₄H₁₀ formulasi uchun nechta izomer mavjud?", o: ["1", "2", "3", "4"], a: 1, e: "n-butan va izobutan." },
    { f: 'org', q: "Atsetilen molekulasidagi C≡C bog'ida nechta π-bog' bor?", o: ["0", "1", "2", "3"], a: 2, e: "Uch bog' = 1σ + 2π." },
    // Analitik
    { f: 'anal', q: "0,1 M NaOH eritmasidan 500 mL tayyorlash uchun qancha NaOH kerak (M = 40 g/mol)?", o: ["1,0 g", "2,0 g", "4,0 g", "20 g"], a: 1, e: "m = 0,1 · 0,5 · 40 = 2,0 g." },
    { f: 'anal', q: "0,001 M HCl eritmasining pH qiymati:", o: ["1", "2", "3", "11"], a: 2, e: "pH = −lg 10⁻³ = 3." },
    { f: 'anal', q: "Buger–Lambert–Ber qonuni:", o: ["A = ε·l·c", "PV = nRT", "E = mc²", "ΔG = ΔH − TΔS"], a: 0, e: "Yorug'lik yutilishi konsentratsiyaga to'g'ri proporsional." },
    { f: 'anal', q: "Kuchli kislotani kuchli asos bilan titrlashda ekvivalent nuqta pH i:", o: ["< 7", "= 7", "> 7", "= 14"], a: 1, e: "Hosil bo'lgan tuz gidrolizlanmaydi." },
    { f: 'anal', q: "Qaysi eritma bufer hisoblanadi?", o: ["HCl + NaCl", "CH₃COOH + CH₃COONa", "NaOH + NaCl", "H₂SO₄ + Na₂SO₄"], a: 1, e: "Kuchsiz kislota va uning tuzi." },
    { f: 'anal', q: "Rf qiymati qanday hisoblanadi?", o: ["Modda yo'li / erituvchi yo'li", "Erituvchi yo'li / modda yo'li", "Modda massasi / hajmi", "ΔA / Δc"], a: 0, e: "Rf ∈ [0; 1]." },
    { f: 'anal', q: "Suyultirish qonuni:", o: ["C₁V₁ = C₂V₂", "C₁/V₁ = C₂/V₂", "C₁ + V₁ = C₂ + V₂", "C₁·C₂ = V₁·V₂"], a: 0, e: "Erigan modda miqdori o'zgarmaydi." },
    { f: 'anal', q: "AgCl uchun Ksp ifodasi:", o: ["[Ag⁺]·[Cl⁻]", "[Ag⁺]/[Cl⁻]", "[AgCl]", "[Ag⁺]²·[Cl⁻]"], a: 0, e: "Qattiq faza konsentratsiyasi kiritilmaydi." },
    // Fizik
    { f: 'phys', q: "Reaksiya o'z-o'zidan boradigan shart:", o: ["ΔG > 0", "ΔG < 0", "ΔH > 0", "ΔS < 0"], a: 1, e: "Gibbs energiyasi kamayadi." },
    { f: 'phys', q: "Normal sharoitda (273,15 K, 1 atm) 1 mol ideal gaz hajmi:", o: ["11,2 L", "22,4 L", "24,5 L", "1 L"], a: 1, e: "V = nRT/P = 22,4 L." },
    { f: 'phys', q: "Katalizator nimani o'zgartiradi?", o: ["ΔH ni", "Aktivlanish energiyasini", "Muvozanat doimiysini", "ΔG° ni"], a: 1, e: "Ea kamayadi, K o'zgarmaydi." },
    { f: 'phys', q: "Nernst tenglamasida 25 °C da (RT/F)·ln → 0,0592·lg ning koeffitsienti:", o: ["0,0592 V", "0,592 V", "1,0 V", "96485 V"], a: 0, e: "2,303·RT/F = 0,0592 V." },
    { f: 'phys', q: "Le Shatelye prinsipiga ko'ra N₂ + 3H₂ ⇌ 2NH₃ da bosim oshirilsa:", o: ["Muvozanat o'ngga siljiydi", "Chapga siljiydi", "O'zgarmaydi", "K ortadi"], a: 0, e: "Gaz mollari kamayadigan tomonga." },
    { f: 'phys', q: "1-tartibli reaksiya yarim parchalanish davri:", o: ["ln2 / k", "1 / k[A]₀", "[A]₀ / 2k", "k / ln2"], a: 0, e: "Boshlang'ich konsentratsiyaga bog'liq emas." },
    // Biokimyo
    { f: 'bio', q: "Michaelis–Menten tenglamasida Km:", o: ["v = Vmax/2 dagi [S]", "Eng katta tezlik", "Fermentning massasi", "pH optimumi"], a: 0, e: "Substratga moyillik o'lchovi." },
    { f: 'bio', q: "DNKdagi adeninning komplementar juftligi:", o: ["Guanin", "Sitozin", "Timin", "Urasil"], a: 2, e: "A–T (2 ta vodorod bog'), G–C (3 ta)." },
    { f: 'bio', q: "Glikoliz qayerda sodir bo'ladi?", o: ["Mitoxondriya matriksi", "Sitoplazma", "Yadro", "Lizosoma"], a: 1, e: "Sitozolda, kislorodsiz ham boradi." },
    { f: 'bio', q: "Universal energiya tashuvchi molekula:", o: ["ATP", "DNK", "Glyukoza", "NaCl"], a: 0, e: "Adenozintrifosfat." },
    { f: 'bio', q: "Peptid bog'i qaysi guruhlar orasida hosil bo'ladi?", o: ["–COOH va –NH₂", "–OH va –OH", "–SH va –SH", "–CHO va –OH"], a: 0, e: "Suv ajralib chiqadi." },
    { f: 'bio', q: "Oqsil denaturatsiyasida buziladi:", o: ["Birlamchi struktura", "Ikkilamchi–to'rtlamchi struktura", "Peptid bog'lari", "Aminokislota tarkibi"], a: 1, e: "Birlamchi struktura saqlanadi." },
    // Materialshunoslik
    { f: 'mat', q: "Bregg tenglamasi:", o: ["nλ = 2d·sinθ", "E = hν", "σ = F/A", "PV = nRT"], a: 0, e: "Rentgen difraksiyasi asosi." },
    { f: 'mat', q: "Po'latdagi uglerod miqdori taxminan:", o: ["< 0,02 %", "0,02–2,14 %", "2,14–6,67 %", "> 10 %"], a: 1, e: "Cho'yan — 2,14 % dan yuqori." },
    { f: 'mat', q: "Polimerning shishalanish harorati belgisi:", o: ["Tm", "Tg", "Tb", "Tc"], a: 1, e: "Amorf polimerlarda muhim." },
    { f: 'mat', q: "Fosforitlardan fosfor o'g'itlari olishda asosan qaysi kislota ishlatiladi?", o: ["H₂SO₄", "HCl", "HNO₃ (faqat)", "H₂CO₃"], a: 0, e: "Ca₃(PO₄)₂ + 3H₂SO₄ → 2H₃PO₄ + 3CaSO₄." },
    { f: 'mat', q: "Mis qaysi kristall panjara turiga ega?", o: ["BCC", "FCC", "HCP", "Olmos"], a: 1, e: "Yoqli markazlashgan kub." },
    { f: 'mat', q: "Nanozarrachalarda sirt/hajm nisbati o'lcham kamayganda:", o: ["ortadi", "kamayadi", "o'zgarmaydi", "nolga teng"], a: 0, e: "∝ 1/r." }
  ];

  const EXPERIMENTS = [
    { n: 'Kislota-asosli titrlash', f: 'anal', d: 60, lvl: 'Boshlang\'ich', mat: ["0,1 M NaOH", "HCl noma'lum konsentratsiya", "Fenolftalein", "Byuretka 25 mL", "Konussimon kolba 250 mL", "Pipetka 10 mL"], steps: ["Byuretkani NaOH bilan to'ldiring.", "Kolbaga 10,00 mL HCl pipetkalang, 2–3 tomchi indikator qo'shing.", "Och pushti rang 30 s turg'un bo'lguncha titrlang.", "Hajmni yozing, kamida 3 marta takrorlang.", "C(HCl) = C(NaOH)·V(NaOH)/V(HCl) ni hisoblang."], safety: ["Ko'zoynak va qo'lqop taqing", "NaOH teriga tegsa — ko'p suv bilan yuving"] },
    { n: 'Mis kuporosi kristallarini o\'stirish', f: 'inorg', d: 1440, lvl: 'Boshlang\'ich', mat: ["CuSO₄·5H₂O", "Distillangan suv", "Stakan", "Isitgich", "Ip"], steps: ["60 °C suvda to'yingan eritma tayyorlang.", "Issiq eritmani filtrlang.", "Sekin sovitib, ipga kichik urug' kristall osing.", "24 soatdan so'ng kristallni oling va quriting."], safety: ["Mis tuzlari zaharli — og'izga olmang", "Ish so'ng qo'lni yuving"] },
    { n: 'Fosfatlarni cho\'ktirish va gravimetriya', f: 'mat', d: 120, lvl: "O'rta", mat: ["Fosforit namunasi", "HNO₃ (1:1)", "Molibden reagenti", "Filtr qog'ozi", "Muffel pech"], steps: ["Namunani aniq tortib (0,5 g) kislotada eriting.", "Cho'ktiruvchi reagent qo'shing.", "Cho'kmani filtrlab yuving.", "Muffelda 800 °C da qizdirib, doimiy massagacha torting.", "P₂O₅ foizini hisoblang."], safety: ["Mo'rili shkafda ishlang", "Issiq tigelni qisqich bilan oling"] },
    { n: 'Qog\'oz xromatografiyasi (siyoh rangi)', f: 'anal', d: 45, lvl: "Boshlang'ich", mat: ["Xromatografiya qog'ozi", "Etanol:suv (1:1)", "Rangli markerlar", "Stakan"], steps: ["Boshlang'ich chiziqni qalamda chizing.", "Nuqta qo'ying va quriting.", "Qog'ozni erituvchiga tushiring (chiziqdan past).", "Front yuqoriga chiqqach, belgilab quriting.", "Har bir komponent uchun Rf ni hisoblang."], safety: ["Etanol yonuvchan — olovdan uzoqda"] },
    { n: 'Neytrallanish issiqligini kalorimetrda aniqlash', f: 'phys', d: 50, lvl: "O'rta", mat: ["1 M HCl", "1 M NaOH", "Penoplast kalorimetr", "Termometr 0,1 °C"], steps: ["50 mL HCl va 50 mL NaOH haroratini o'lchang.", "Aralashtirib, maksimal haroratni yozing.", "q = m·c·ΔT (c = 4,18 J/g·K).", "ΔH = −q / n(H₂O)."], safety: ["Ko'zoynak taqing"] },
    { n: 'Spektrofotometrik kalibrlash (KMnO₄)', f: 'anal', d: 90, lvl: "O'rta", mat: ["KMnO₄ standart", "Spektrofotometr", "Kyuvetalar", "Volumetrik kolbalar"], steps: ["5 ta standart eritma tayyorlang.", "λ = 525 nm da A ni o'lchang.", "A–c grafigini quring (kalkulyatorda).", "Noma'lum namuna konsentratsiyasini toping."], safety: ["KMnO₄ kuchli oksidlovchi"] },
    { n: 'Galvanik element (Daniel)', f: 'phys', d: 40, lvl: "Boshlang'ich", mat: ["Zn plastinka", "Cu plastinka", "ZnSO₄ 1 M", "CuSO₄ 1 M", "Tuz ko'prigi", "Voltmetr"], steps: ["Ikki yarim elementni yig'ing.", "Tuz ko'prigi bilan ulang.", "EYuK ni voltmetrda o'lchang.", "Nazariy qiymat (1,10 V) bilan solishtiring."], safety: ["Mis va rux tuzlarini kanalizatsiyaga to'kmang"] },
    { n: 'Na₂S₂O₃ + HCl reaksiya kinetikasi', f: 'phys', d: 60, lvl: "O'rta", mat: ["Na₂S₂O₃ eritmalari", "2 M HCl", "Sekundomer", "Stakan va belgi qog'ozi"], steps: ["Turli konsentratsiyalarni tayyorlang.", "HCl qo'shib, loyqalanish (belgi ko'rinmay qolguncha) vaqtini o'lchang.", "1/t – C grafigi orqali tartibini aniqlang."], safety: ["SO₂ ajraladi — shamollatish"] },
    { n: 'Etanolni oddiy haydash (distillash)', f: 'org', d: 90, lvl: "O'rta", mat: ["Etanol–suv aralashmasi", "Haydash qurilmasi", "Qaynatgich toshchalar", "Termometr"], steps: ["Qurilmani yig'ing.", "Sekin qizdiring.", "Harorat ~78 °C da fraksiyani yig'ing.", "Zichlik orqali tozalikni baholang."], safety: ["Ochiq olovdan foydalanmang", "Qurilma yopiq bo'lmasin"] },
    { n: 'Aspirin sintezi', f: 'org', d: 120, lvl: "Ilg'or", mat: ["Salitsil kislota 2 g", "Sirka angidrid 5 mL", "H₃PO₄ (katalizator)", "Muz", "Byuxner voronkasi"], steps: ["Reagentlarni kolbada aralashtiring.", "85 °C suv hammomida 15 daqiqa qizdiring.", "Muzli suv qo'shib kristallantiring.", "Filtrlang, qayta kristallang, unumni hisoblang."], safety: ["Sirka angidrid korroziv — mo'rida ishlang", "Qo'lqop va ko'zoynak majburiy"] },
    { n: 'Suv elektrolizi', f: 'phys', d: 30, lvl: "Boshlang'ich", mat: ["Hoffman apparati yoki 2 probirka", "Na₂SO₄ eritmasi", "Grafit elektrodlar", "Tok manbai"], steps: ["Eritmani to'ldiring.", "6 V tok bering.", "H₂ va O₂ hajm nisbatini (2:1) kuzating.", "Faradey qonuni bilan solishtiring."], safety: ["H₂ portlovchi — olovsiz!"] },
    { n: 'Universal indikator bilan pH shkalasi', f: 'anal', d: 30, lvl: "Boshlang'ich", mat: ["Universal indikator", "pH 1–13 eritmalari", "Probirkalar"], steps: ["Har bir probirkaga indikator tomizing.", "Rang shkalasini tuzing.", "Noma'lum eritma pH ini aniqlang."], safety: ["Ko'zoynak taqing"] }
  ];

  const SDS = [
    { n: 'Xlorid kislota', f: 'HCl', cas: '7647-01-0', g: ['korroziv', 'zararli'], h: ["H290 Metallarni korroziyaga uchratishi mumkin", "H314 Teri kuyishi va ko'z jarohati", "H335 Nafas yo'llarini bezovta qilishi mumkin"], ppe: "Kislotaga chidamli qo'lqop, himoya ko'zoynagi, mo'ri", aid: "Teriga tegsa — 15 daqiqa suv bilan yuving. Ko'zga tegsa — ochiq ushlab yuving, shifokor.", st: "Yopiq idish, asoslardan va metallardan ajrating" },
    { n: 'Sulfat kislota', f: 'H2SO4', cas: '7664-93-9', g: ['korroziv'], h: ["H290 Metallarni korroziyaga uchratishi mumkin", "H314 Teri kuyishi va ko'z jarohati"], ppe: "Qo'lqop, himoya kiyimi, yuz qalqoni", aid: "Ko'p miqdorda suv bilan yuving. Suyultirishda KISLOTANI suvga quying.", st: "Organik moddalar va asoslardan ajrating" },
    { n: 'Nitrat kislota', f: 'HNO3', cas: '7697-37-2', g: ['korroziv', 'oksidlovchi'], h: ["H272 Yong'inni kuchaytirishi mumkin", "H314 Teri kuyishi va ko'z jarohati", "H331 Nafas olganda zaharli"], ppe: "Qo'lqop, ko'zoynak, mo'ri", aid: "Suv bilan yuving; nafas olganda — toza havoga chiqaring.", st: "Yonuvchan moddalardan ajrating" },
    { n: 'Natriy gidroksid', f: 'NaOH', cas: '1310-73-2', g: ['korroziv'], h: ["H290 Metallarni korroziyaga uchratishi mumkin", "H314 Teri kuyishi va ko'z jarohati"], ppe: "Qo'lqop, himoya ko'zoynagi", aid: "Darhol ko'p suv bilan yuving, kamida 15 daqiqa.", st: "Kislotalardan va alyuminiydan ajrating, mahkam yoping" },
    { n: 'Ammiak (suvli)', f: 'NH3', cas: '7664-41-7', g: ['korroziv', 'atrof'], h: ["H314 Teri kuyishi va ko'z jarohati", "H335 Nafas yo'llarini bezovta qiladi", "H400 Suv organizmlari uchun juda zaharli"], ppe: "Mo'ri, qo'lqop, ko'zoynak", aid: "Toza havo; ko'zni yuving.", st: "Sovuq, shamollatiladigan joy" },
    { n: 'Etanol', f: 'C2H5OH', cas: '64-17-5', g: ['yonuvchan'], h: ["H225 Juda yonuvchan suyuqlik va bug'", "H319 Ko'zni jiddiy bezovta qiladi"], ppe: "Ko'zoynak, qo'lqop", aid: "Ko'z — suv bilan yuvish; ichilsa — shifokor.", st: "Olovdan va uchqundan uzoqda" },
    { n: 'Metanol', f: 'CH3OH', cas: '67-56-1', g: ['yonuvchan', 'zaharli', 'zararli'], h: ["H225 Juda yonuvchan", "H301+H311+H331 Yutganda, teriga tegsa, nafas olganda zaharli", "H370 Ko'rish nervi va MNSga zarar (ko'rlik)"], ppe: "Mo'ri, nitril qo'lqop, ko'zoynak", aid: "Yutilsa — DARHOL shifokor (ko'rlik xavfi).", st: "Yopiq, yonuvchanlar uchun shkaf" },
    { n: 'Atseton', f: 'C3H6O', cas: '67-64-1', g: ['yonuvchan', 'zararli'], h: ["H225 Juda yonuvchan", "H319 Ko'zni jiddiy bezovta qiladi", "H336 Uyquchanlik va bosh aylanishi"], ppe: "Ko'zoynak, qo'lqop, shamollatish", aid: "Toza havo, ko'zni suv bilan yuving.", st: "Olovdan uzoqda, yopiq idishda" },
    { n: 'Benzol', f: 'C6H6', cas: '71-43-2', g: ['yonuvchan', 'zaharli', 'zararli'], h: ["H225 Juda yonuvchan", "H350 Saraton kasalligini keltirib chiqarishi mumkin", "H340 Genetik nuqsonlar", "H372 Uzoq ta'sirda organlarga zarar"], ppe: "Faqat mo'ri, maxsus qo'lqop; imkon bo'lsa o'rnini bosuvchi (toluol) ishlating", aid: "Toza havo, shifokor.", st: "Yonuvchanlar shkafi, kirish cheklangan" },
    { n: 'Toluol', f: 'C7H8', cas: '108-88-3', g: ['yonuvchan', 'zararli'], h: ["H225 Juda yonuvchan", "H304 Yutilsa va nafas yo'llariga tushsa o'limga olib kelishi mumkin", "H361d Homilaga zarar", "H373 Organlarga zarar"], ppe: "Mo'ri, qo'lqop, ko'zoynak", aid: "Qusdirmang! Shifokorga murojaat.", st: "Yonuvchanlar shkafi" },
    { n: 'Kaliy permanganat', f: 'KMnO4', cas: '7722-64-7', g: ['oksidlovchi', 'korroziv', 'atrof'], h: ["H272 Yong'inni kuchaytirishi mumkin", "H302 Yutganda zararli", "H314 Teri kuyishi", "H410 Suv organizmlari uchun juda zaharli"], ppe: "Qo'lqop, ko'zoynak", aid: "Suv bilan yuving.", st: "Organik moddalardan va qaytaruvchilardan ajrating" },
    { n: 'Vodorod peroksid (30%)', f: 'H2O2', cas: '7722-84-1', g: ['oksidlovchi', 'korroziv'], h: ["H271/H272 Yong'inni kuchaytiradi", "H302 Yutganda zararli", "H318 Ko'zni jiddiy shikastlaydi"], ppe: "Qo'lqop, yuz qalqoni", aid: "Ko'p suv bilan yuving.", st: "Salqin, qorong'i joyda, ventilyatsiyali qopqoq" },
    { n: 'Mis(II) sulfat', f: 'CuSO4', cas: '7758-98-7', g: ['zararli', 'atrof'], h: ["H302 Yutganda zararli", "H319 Ko'zni bezovta qiladi", "H410 Suv organizmlari uchun juda zaharli"], ppe: "Qo'lqop, ko'zoynak", aid: "Suv bilan yuving.", st: "Quruq joyda" },
    { n: 'Xloroform', f: 'CHCl3', cas: '67-66-3', g: ['zararli', 'zaharli'], h: ["H302 Yutganda zararli", "H351 Saraton kasalligini keltirishi taxmin qilinadi", "H373 Jigar va buyrakka zarar"], ppe: "Mo'ri, maxsus qo'lqop", aid: "Toza havo, shifokor.", st: "Yorug'likdan himoya, ingibitor bilan" },
    { n: 'Sirka kislota (muzli)', f: 'CH3COOH', cas: '64-19-7', g: ['yonuvchan', 'korroziv'], h: ["H226 Yonuvchan suyuqlik", "H314 Teri kuyishi va ko'z jarohati"], ppe: "Qo'lqop, ko'zoynak, mo'ri", aid: "Suv bilan yuvish.", st: "Asoslardan va oksidlovchilardan ajrating" },
    { n: 'Formaldegid (37%)', f: 'CH2O', cas: '50-00-0', g: ['zaharli', 'korroziv', 'zararli'], h: ["H301+H311+H331 Zaharli", "H314 Teri kuyishi", "H317 Allergik reaksiya", "H350 Saraton kasalligini keltirishi mumkin"], ppe: "Faqat mo'rida, qo'lqop, yuz qalqoni", aid: "Teri va ko'zni ko'p suv bilan yuving.", st: "Yopiq idish, sovuq joy" }
  ];
  const GHS = { korroziv: ['Korroziv', '#7c3aed'], yonuvchan: ['Yonuvchan', '#ef4444'], zaharli: ['O\'ta zaharli', '#111827'], zararli: ['Zararli', '#f59e0b'], oksidlovchi: ['Oksidlovchi', '#f97316'], atrof: ['Atrof-muhitga xavfli', '#16a34a'] };

  const TEMPLATES = [
    { id: 'lab', n: 'Laboratoriya ishi hisoboti', ico: 'flask', body: "LABORATORIYA ISHI HISOBOTI\n\nMavzu: \nTalaba / tadqiqotchi: \nSana: \n\n1. Maqsad\n\n2. Nazariy asos (asosiy tenglamalar)\n\n3. Reaktivlar va asbob-uskunalar\n\n4. Ish tartibi\n\n5. Natijalar (jadval va hisoblashlar)\n   | № | Ko'rsatkich | Qiymat | Birlik |\n   |---|-------------|--------|--------|\n\n6. Xatoliklar tahlili (o'rtacha, standart og'ish)\n\n7. Xulosa\n\n8. Xavfsizlik choralari\n" },
    { id: 'article', n: 'Ilmiy maqola tuzilmasi (IMRaD)', ico: 'doc', body: "SARLAVHA (aniq, 12–15 so'z)\n\nMualliflar, tashkilot, ORCID, e-pochta\n\nAnnotatsiya (150–250 so'z): dolzarblik, maqsad, usul, asosiy natija, xulosa\nKalit so'zlar: 5–7 ta\n\n1. Kirish — muammo, adabiyotlar sharhi, bo'shliq, tadqiqot maqsadi\n2. Materiallar va usullar — takrorlash mumkin bo'lishi uchun batafsil\n3. Natijalar — jadval, rasm, statistik tahlil\n4. Muhokama — natijalar talqini, boshqa ishlar bilan taqqoslash, cheklovlar\n5. Xulosa\n\nMinnatdorchilik / Moliyalashtirish\nFoydalanilgan adabiyotlar (jurnal talabiga ko'ra)\n" },
    { id: 'thesis', n: 'Dissertatsiya rejasi', ico: 'cap', body: "DISSERTATSIYA REJASI\n\nMavzu: \nIlmiy rahbar: \nIxtisoslik shifri: \n\nKIRISH\n  Mavzuning dolzarbligi · Maqsad va vazifalar · Ilmiy yangilik · Amaliy ahamiyat · Himoyaga olib chiqiladigan holatlar\n\nI BOB. ADABIYOTLAR TAHLILI\n  1.1 Muammoning hozirgi holati\n  1.2 Mavjud usullar va ularning kamchiliklari\n  1.3 I bob bo'yicha xulosalar\n\nII BOB. TAJRIBA USULLARI VA MATERIALLAR\n\nIII BOB. TAJRIBA NATIJALARI VA MUHOKAMA\n\nIV BOB. TEXNOLOGIK / AMALIY QISM, IQTISODIY SAMARADORLIK\n\nXULOSA\nFOYDALANILGAN ADABIYOTLAR\nILOVALAR\n" },
    { id: 'grant', n: 'Grant loyihasi arizasi', ico: 'coin', body: "GRANT LOYIHASI ARIZASI\n\n1. Loyiha nomi\n2. Annotatsiya (200 so'z)\n3. Muammo va dolzarbligi\n4. Maqsad va vazifalar (SMART)\n5. Kutilayotgan natijalar va indikatorlar\n6. Ish rejasi (bosqichlar, muddatlar, mas'ullar)\n7. Metodologiya\n8. Jamoa tarkibi va tajribasi\n9. Byudjet (xodimlar, uskunalar, materiallar, safar, nashr)\n10. Risklar va ularni kamaytirish\n11. Ta'sir va tarqatish (nashrlar, konferensiyalar, patent)\n" },
    { id: 'protocol', n: 'Tajriba protokoli', ico: 'clip', body: "TAJRIBA PROTOKOLI № ___\n\nSana / vaqt: \nTajribachi: \nMaqsad: \nGipoteza: \n\nReaktivlar (nomi, toza-lik, partiya raqami):\nUskunalar (model, kalibrlash sanasi):\n\nTartib (qadamlar):\n1.\n2.\n3.\n\nO'lchovlar:\nKuzatishlar:\nAnomaliyalar:\nXavfsizlik / chiqindi utilizatsiyasi:\nKeyingi qadam:\n" },
    { id: 'lesson', n: "Dars ishlanmasi (45 daqiqa)", ico: 'book', body: "DARS ISHLANMASI\n\nFan / mavzu: \nSinf / kurs: \nDavomiyligi: 45 daqiqa\n\nO'quv maqsadlari (Bloom):\n- Eslab qoladi:\n- Tushunadi:\n- Qo'llaydi:\n\nVaqt taqsimoti:\n 0–5   Tashkiliy qism, motivatsiya\n 5–15  Yangi mavzu tushuntirish\n 15–30 Misollar yechish (jamoa ishi)\n 30–40 Mustaqil topshiriq / laboratoriya ko'rsatma\n 40–45 Xulosa, uy vazifasi, baholash\n\nResurslar:\nBaholash mezoni (rubrika):\nUy vazifasi:\n" },
    { id: 'abstract', n: 'Konferensiya tezisi', ico: 'doc', body: "TEZIS\n\nSarlavha: \nMualliflar va tashkilot: \n\nMatn (1–2 bet):\n  Muammo (2–3 gap)\n  Usul (2–3 gap)\n  Asosiy natijalar (raqamlar bilan)\n  Xulosa va amaliy ahamiyati\n\nKalit so'zlar: \nAdabiyotlar (3–5 ta):\n" }
  ];

  const KB = [
    { k: ['mol', 'avogadro'], t: "Mol — modda miqdori birligi", a: "1 mol = 6,022·10²³ zarra (Avogadro soni Nₐ). n = m / M = N / Nₐ = V / 22,4 (n.s. gaz uchun)." },
    { k: ['ph', 'vodorod ko\'rsatkich'], t: "pH nima?", a: "pH = −lg[H⁺]. 25 °C da pH + pOH = 14. pH < 7 — kislotali, = 7 — neytral, > 7 — ishqoriy." },
    { k: ['titrlash', 'titrlash'], t: "Titrlash", a: "Noma'lum konsentratsiyali eritma standart eritma bilan ekvivalent nuqtagacha reaksiyaga kiritiladi. C₁V₁ = C₂V₂ (1:1 stexiometriyada)." },
    { k: ['oksidlanish', 'qaytarilish', 'redoks'], t: "Oksidlanish-qaytarilish", a: "Oksidlanish — elektron berish (oksidlanish darajasi ortadi), qaytarilish — elektron olish. Oksidlovchi qaytariladi, qaytaruvchi oksidlanadi." },
    { k: ['katalizator', 'kataliz'], t: "Katalizator", a: "Reaksiya aktivlanish energiyasini kamaytirib tezlashtiradi, o'zi sarflanmaydi va muvozanat holatini o'zgartirmaydi." },
    { k: ['le shatelye', 'muvozanat', 'le chatelier'], t: "Le Shatelye prinsipi", a: "Muvozanatdagi tizimga tashqi ta'sir bo'lsa, muvozanat bu ta'sirni kamaytiradigan tomonga siljiydi (konsentratsiya, bosim, harorat)." },
    { k: ['bufer'], t: "Bufer eritmalar", a: "Kuchsiz kislota va uning tuzi (yoki kuchsiz asos va tuzi) aralashmasi. pH = pKa + lg([A⁻]/[HA]). Oz miqdorda kislota/asos qo'shilganda pH deyarli o'zgarmaydi." },
    { k: ['gibridlanish', 'sp3', 'sp2'], t: "Gibridlanish", a: "sp — chiziqli (180°), sp² — tekis uchburchak (120°), sp³ — tetraedr (109,5°). Uglerodning bog'lar soni va geometriyasini tushuntiradi." },
    { k: ['entalpiya', 'gess'], t: "Entalpiya va Gess qonuni", a: "Reaksiyaning issiqlik effekti yo'lga bog'liq emas: ΔH° = ΣΔHf°(mahsulotlar) − ΣΔHf°(reaktivlar)." },
    { k: ['gibbs', 'erkin energiya'], t: "Gibbs energiyasi", a: "ΔG = ΔH − TΔS. ΔG < 0 — jarayon o'z-o'zidan boradi. ΔG° = −RT·lnK." },
    { k: ['elektroliz', 'faradey'], t: "Elektroliz", a: "Faradey qonuni: m = (M·I·t) / (n·F), F = 96485 C/mol." },
    { k: ['izomer'], t: "Izomeriya", a: "Molekulyar formulasi bir xil, tuzilishi/fazoviy joylashuvi har xil birikmalar: strukturaviy, cis–trans, optik (enantiomerlar)." },
    { k: ['kislota', 'asos', 'bronsted', 'lyuis'], t: "Kislota va asoslar", a: "Arrenius: H⁺ / OH⁻ beradi. Brensted–Louri: proton donori/akseptori. Lyuis: elektron juft akseptori/donori." },
    { k: ['ideal gaz'], t: "Ideal gaz tenglamasi", a: "PV = nRT. R = 0,082057 L·atm/(mol·K) = 8,314 J/(mol·K)." },
    { k: ['spektr', 'ber', 'lambert'], t: "Buger–Lambert–Ber qonuni", a: "A = ε·l·c. Optik zichlik konsentratsiya va kyuveta qalinligiga to'g'ri proporsional." },
    { k: ['fosforit', 'fosfat'], t: "Fosforitlar", a: "Fosforitlar — Ca₅(PO₄)₃F asosli cho'kindi jinslar. Boyitish: flotatsiya, kuydirish; qayta ishlash: sulfat kislota bilan parchalash (ekstraksion fosfat kislota) → o'g'itlar." },
    { k: ['flotatsiya', 'boyitish'], t: "Flotatsiya", a: "Rudani suv va reagentlar (kollektor, ko'pik hosil qiluvchi, depressor) bilan aralashtirib, havo purkash orqali foydali mineral zarralarini ko'pikka ajratish usuli." },
    { k: ['nodir', 'rare earth', 'lantanoid'], t: "Nodir yer elementlari", a: "17 ta element (lantanoidlar + Sc, Y). Ajratish: ekstraksiya, ion almashinish. Magnitlar, katalizatorlar, lyuminoforlar." },
    { k: ['gidrometallurgiya', 'leaching', 'yuvish'], t: "Gidrometallurgiya", a: "Metallarni rudadan suvli eritmalar bilan ajratish: yuvish (leaching), tozalash (ekstraksiya, sorbsiya), ajratib olish (cho'ktirish, elektroliz)." },
    { k: ['gipoteza', 'tadqiqot dizayn'], t: "Ilmiy gipoteza", a: "Gipoteza tekshirilishi mumkin va rad etilishi mumkin bo'lgan taxmin bo'lishi kerak: «X ni Y gacha oshirsak, Z o'zgaradi». H₀ va H₁ ni aniq belgilang." }
  ];

  const SLIDE_RES = [
    { n: 'Kimyo darsliklari', u: 'https://openstax.org/subjects/science' }, { n: 'Ilmiy maqolalar bazasi (OpenAlex)', u: 'https://openalex.org/' },
    { n: 'Laboratoriya protokollari', u: 'https://www.jove.com/' }, { n: 'Konferensiyalar (ACS)', u: 'https://www.acs.org/meetings.html' },
    { n: 'Shablonlar', u: '#/templates' }, { n: 'Grantlar', u: '#/projects' }
  ];
  const LINKS = {
    scholar: (q) => 'https://scholar.google.com/scholar?q=' + encodeURIComponent(q), pubchem: (q) => 'https://pubchem.ncbi.nlm.nih.gov/#query=' + encodeURIComponent(q),
    scopus: (q) => 'https://www.scopus.com/results/results.uri?s=' + encodeURIComponent('TITLE-ABS-KEY(' + q + ')'), wos: (q) => 'https://www.webofscience.com/wos/woscc/basic-search?q=' + encodeURIComponent(q),
    rsc: (q) => 'https://pubs.rsc.org/en/results?searchtext=' + encodeURIComponent(q), acs: (q) => 'https://pubs.acs.org/action/doSearch?AllField=' + encodeURIComponent(q)
  };
  const CONF_LINKS = [{ n: 'ACS Meetings', u: 'https://www.acs.org/meetings.html' }, { n: 'IUPAC Events', u: 'https://iupac.org/events/' }, { n: 'Conference Index — Chemistry', u: 'https://conferenceindex.org/conferences/chemistry' }, { n: 'EuChemS', u: 'https://www.euchems.eu/events/' }];

  Object.assign(CE, { FIELDS, TESTS, EXPERIMENTS, SDS, GHS, TEMPLATES, KB, LINKS, CONF_LINKS, SLIDE_RES });
})();
