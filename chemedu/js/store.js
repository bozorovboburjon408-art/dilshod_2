/* ChemEdu — holat va lokal saqlash (localStorage), yordamchi funksiyalar */
(function () {
  const CE = (window.CE = window.CE || {});
  const KEY = 'chemedu.v1';
  const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
  const MONTHS_S = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (n, base) => { const d = base ? new Date(base) : new Date(); d.setDate(d.getDate() + n); return d; };
  const fmtDate = (s) => { const [y, m, d] = s.split('-').map(Number); return `${d}-${MONTHS_S[m - 1]}, ${y}`; };
  const ago = (t) => {
    const s = Math.max(1, Math.round((Date.now() - t) / 1000));
    if (s < 60) return 'hozir'; const m = Math.round(s / 60); if (m < 60) return `${m} daqiqa oldin`;
    const h = Math.round(m / 60); if (h < 24) return `${h} soat oldin`; const d = Math.round(h / 24); return `${d} kun oldin`;
  };
  let _id = Date.now();
  const uid = () => 'i' + (_id++).toString(36);
  const H = 3600e3;

  function seed() {
    const now = Date.now(), t = iso(new Date());
    const st = ['Karimov Aziz|KT-21', 'Rahimova Malika|KT-21', 'Toshmatov Jasur|KT-21', 'Yusupova Nodira|KT-21', 'Abdullayev Sardor|KT-22', 'Ergasheva Dilnoza|KT-22', 'Normatov Bekzod|KT-22', 'Qodirova Zarina|KT-22', 'Olimov Sherzod|KT-23', 'Hamidova Madina|KT-23', 'Ismoilov Otabek|KT-23', 'Saidova Gulnora|KT-23'];
    const students = st.map((s, i) => { const [name, group] = s.split('|'); return { id: 's' + i, name, group, email: name.split(' ')[1].toLowerCase() + '.' + name.split(' ')[0].toLowerCase() + '@talaba.example' }; });
    const grade = (i, j) => 55 + ((i * 37 + j * 23) % 46);
    const mk = (id, title, due, max, topic, cnt) => ({ id, title, due, max, topic, grades: Object.fromEntries(students.slice(0, cnt).map((s, i) => [s.id, grade(i, id.length + cnt)])) });
    return {
      v: 1, theme: 'auto',
      profile: { name: 'Juraqulov Dilshod', role: "O'qituvchi / Tadqiqotchi", org: 'Navoiy konchilik va texnologiyalar universiteti' },
      lessons: [
        { id: uid(), title: "Fosforitlarni boyitish: flotatsiya asoslari", field: 'mat', date: iso(addDays(-3)), slides: 9 },
        { id: uid(), title: "Kislota-asosli titrlash", field: 'anal', date: iso(addDays(-9)), slides: 9 },
        { id: uid(), title: "Alkenlar va alkinlar", field: 'org', date: iso(addDays(-15)), slides: 9 }
      ],
      projects: [
        { id: uid(), title: "Fosforit rudasini qayta ishlash texnologiyasini takomillashtirish", type: 'Grant', status: 'Jarayonda', budget: 120, deadline: iso(addDays(120)), progress: 55, desc: "Past navli fosforitlardan P₂O₅ ajratib olish darajasini oshirish." },
        { id: uid(), title: "Nodir yer elementlarini gidrometallurgik ajratish", type: 'Loyiha', status: 'Jarayonda', budget: 45, deadline: iso(addDays(210)), progress: 30, desc: "Yuvish va ekstraksiya sharoitlarini optimallashtirish." },
        { id: uid(), title: "Fosforit boyitish katalizatorlari sharhi", type: 'Maqola', status: 'Yozilmoqda', budget: 0, deadline: iso(addDays(40)), progress: 65, desc: "Review maqola — Applied Catalysis uchun." },
        { id: uid(), title: "Talabalar uchun virtual laboratoriya", type: 'Loyiha', status: 'Rejalashtirilgan', budget: 15, deadline: iso(addDays(300)), progress: 10, desc: "Raqamli o'quv laboratoriyasi prototipi." }
      ],
      articles: [
        { id: uid(), title: "Recent advances in phosphate rock processing", authors: 'Smith J., Lee K.', journal: 'Journal of Cleaner Production', year: 2024, doi: '', tags: ['fosforit'], notes: '' },
        { id: uid(), title: "Hydrometallurgical methods for rare earth extraction", authors: 'Garcia M., Chen L.', journal: 'Chemical Engineering Journal', year: 2023, doi: '', tags: ['nodir yer'], notes: '' },
        { id: uid(), title: "Catalysts for phosphate beneficiation", authors: 'Ivanov A., Petrov S.', journal: 'Applied Catalysis B', year: 2024, doi: '', tags: ['kataliz'], notes: '' }
      ],
      students,
      assignments: [mk('a1', 'Eritmalar konsentratsiyasi bo\'yicha masalalar', iso(addDays(-12)), 100, 'Analitik kimyo', 12), mk('a2', 'Laboratoriya hisoboti: titrlash', iso(addDays(-4)), 100, 'Analitik kimyo', 8), mk('a3', 'OQR tenglamalarini balanslash', iso(addDays(3)), 50, 'Noorganik kimyo', 0), mk('a4', 'Aromatik birikmalar — test', iso(addDays(9)), 100, 'Organik kimyo', 0)],
      events: [
        { id: uid(), date: t, time: '10:00', title: "Ma'ruza: Analitik kimyo", color: 'blue' }, { id: uid(), date: t, time: '13:00', title: 'Laboratoriya ishi', color: 'amber' },
        { id: uid(), date: t, time: '15:00', title: 'Doktorant bilan uchrashuv', color: 'green' }, { id: uid(), date: t, time: '17:00', title: 'Maqola muhokamasi', color: 'red' },
        { id: uid(), date: iso(addDays(2)), time: '09:00', title: 'Kafedra yig\'ilishi', color: 'blue' }, { id: uid(), date: iso(addDays(5)), time: '11:00', title: 'Grant hisoboti topshirish', color: 'red' }
      ],
      activity: [
        { id: uid(), t: now - 1 * H, ico: 'doc', c: 'red', text: 'Maqola saqlandi' }, { id: uid(), t: now - 4 * H, ico: 'flask', c: 'green', text: "Laboratoriya ishi qo'shildi" },
        { id: uid(), t: now - 6 * H, ico: 'calc', c: 'blue', text: 'Hisoblash bajarildi' }, { id: uid(), t: now - 24 * H, ico: 'slides', c: 'amber', text: 'Dars slaydi yaratildi' }, { id: uid(), t: now - 26 * H, ico: 'scale', c: 'purple', text: 'Reaksiya balanslandi' }
      ],
      journal: [
        { id: uid(), date: iso(addDays(-6)), title: 'Fosforit namunasi № 3 — kislotada eritish', exp: 'Fosfatlarni cho\'ktirish va gravimetriya', notes: "0,5012 g namuna HNO₃ (1:1) da eritildi. Qoldiq 4,2 %.", result: 'P₂O₅ = 24,1 %' },
        { id: uid(), date: iso(addDays(-2)), title: 'HCl standartlash', exp: 'Kislota-asosli titrlash', notes: '3 ta parallel titrlash: 24,95; 25,05; 25,00 mL', result: 'C(HCl) = 0,1002 M' }
      ],
      thesis: {
        title: "Fosforit rudalarini boyitish va qayta ishlashning samarali texnologiyasi", mavzu: true,
        groups: [
          { id: 'g1', name: 'Adabiyotlar tahlili', items: [['Asosiy manbalarni yig\'ish', 1], ['Sharh jadvalini tuzish', 1], ['I bobni yozish', 1]] },
          { id: 'g2', name: 'Eksperiment rejasini tayyorlash', items: [['Gipoteza va maqsad', 1], ['Usullarni tanlash', 1], ['Reaktivlar ro\'yxati', 1], ['Dispersiya rejasi', 1], ['Etika va xavfsizlik', 1]] },
          { id: 'g3', name: 'Laboratoriya natijalarini tahlil qilish', items: [['1-seriya', 1], ['2-seriya', 1], ['3-seriya', 0], ['Statistik ishlov', 0], ['Grafiklar', 0]] },
          { id: 'g4', name: 'Maqola yozish', items: [['Kirish', 1], ['Natijalar', 0], ['Muhokama', 0]] },
          { id: 'g5', name: 'Dissertatsiya boblarini tayyorlash', items: [['II bob', 0], ['III bob', 0], ['IV bob', 0], ['Xulosa va annotatsiya', 0]] }
        ].map((g) => ({ ...g, items: g.items.map(([t, d]) => ({ t, done: !!d })) })),
        chapters: [{ n: 'Kirish', w: 1200, goal: 1500 }, { n: 'I bob. Adabiyotlar tahlili', w: 9800, goal: 10000 }, { n: 'II bob. Usullar', w: 2400, goal: 8000 }, { n: 'III bob. Natijalar', w: 0, goal: 14000 }]
      },
      conferences: [
        { id: uid(), name: 'Respublika yosh olimlar konferensiyasi (namuna)', date: iso(addDays(75)), place: 'Navoiy', deadline: iso(addDays(40)), status: 'Rejada', url: '' },
        { id: uid(), name: 'Xalqaro kimyo konferensiyasi (namuna)', date: iso(addDays(160)), place: 'Onlayn', deadline: iso(addDays(100)), status: 'Tezis tayyorlanmoqda', url: '' }
      ],
      notifications: [
        { id: uid(), t: now - 1 * H, text: "Grant hisobotini topshirish muddati yaqinlashmoqda", read: false, href: '#/projects' },
        { id: uid(), t: now - 5 * H, text: "A3 topshirig'i uchun muddat 3 kundan so'ng", read: false, href: '#/assignments' },
        { id: uid(), t: now - 30 * H, text: "Yangi test natijalari tayyor", read: true, href: '#/tests' }
      ],
      tests: [], docs: [], refs: [], chat: {}, saved: []
    };
  }

  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state || state.v !== 1) state = seed();
  let timer = null;
  const db = {
    s: state,
    save() { clearTimeout(timer); timer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(db.s)); } catch (e) { /* kvota */ } }, 120); },
    reset() { db.s = seed(); try { localStorage.removeItem(KEY); } catch (e) { /* */ } CE.bus.emit('reset'); db.save(); },
    log(ico, c, text) { db.s.activity.unshift({ id: uid(), t: Date.now(), ico, c, text }); db.s.activity.length = Math.min(db.s.activity.length, 30); db.save(); CE.bus.emit('activity'); },
    notify(text, href) { db.s.notifications.unshift({ id: uid(), t: Date.now(), text, read: false, href: href || '#/home' }); db.save(); CE.bus.emit('notify'); }
  };
  const bus = { m: {}, on(e, f) { (this.m[e] = this.m[e] || []).push(f); }, emit(e, d) { (this.m[e] || []).forEach((f) => f(d)); } };
  Object.assign(CE, { db, bus, uid, iso, addDays, fmtDate, ago, MONTHS, MONTHS_S });
})();
