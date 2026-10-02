'use strict';

const TRENDS = [
  {id:'ai', name:'Sunʻiy intellekt', brand:'Aql', desc:'Shaxsiylashtirish, bashorat, avtomatik qarorlar',
   enabler:"sunʻiy intellekt", shift:"har bir inson oʻz shaxsiy AI yordamchisiga ega boʻladi",
   feats:["Foydalanuvchi odatlarini oʻrganib, shaxsiy tavsiyalar beradi","Muammoni yuz berishidan oldin bashorat qiladi","Oddiy ovoz yoki matn orqali boshqariladi"]},
  {id:'iot', name:'Aqlli sensorlar / IoT', brand:'Sezgi', desc:'Hamma narsa oʻlchanadi va ulanadi',
   enabler:"arzon sensorlar va IoT", shift:"kundalik buyumlar atrofni sezadi va bir-biri bilan gaplashadi",
   feats:["Real vaqtda maʻlumot yigʻadi (sensor)","Telefon/markazga avtomatik signal yuboradi","Batareyasi uzoq, oʻrnatish oson"]},
  {id:'eco', name:'Doiraviy iqtisod', brand:'Eko', desc:'Chiqindisiz, qayta ishlash, qayta foydalanish',
   enabler:"doiraviy iqtisod prinsiplari", shift:"chiqindi — yangi xomashyo, mahsulotlar taʻmirlanadi va qaytariladi",
   feats:["Qayta ishlangan/biologik materialdan tayyorlanadi","Taʻmirlash va qaytarib olish tizimi bor","Uglerod izi foydalanuvchiga koʻrsatiladi"]},
  {id:'health', name:'Uzoq umr va salomatlik', brand:'Hayot', desc:'Qarish jamiyati, profilaktika, ruhiy salomatlik',
   enabler:"profilaktik salomatlik texnologiyalari", shift:"aholi keksayadi, odamlar kasallikni oldini olishga eʻtibor beradi",
   feats:["Salomatlik koʻrsatkichlarini bezovta qilmay kuzatadi","Yaqinlar/shifokor bilan xavfsiz bogʻlanadi","Ruhiy holatni qoʻllab-quvvatlaydi"]},
  {id:'remote', name:'Masofaviy va gibrid hayot', brand:'Ulan', desc:'Ish, oʻqish va xizmatlar istalgan joydan',
   enabler:"masofaviy hamkorlik vositalari", shift:"ish va oʻqish joyga bogʻliq boʻlmaydi",
   feats:["Istalgan joyda, oflayn rejimda ham ishlaydi","Jamoa/oila bilan sinxron hamkorlik","Kontekstga qarab moslashadi"]},
  {id:'local', name:'Mahalliy ishlab chiqarish (3D)', brand:'Yasa', desc:'3D bosma, mikro-fabrikalar, kastomizatsiya',
   enabler:"3D bosma va mahalliy mikro-ishlab chiqarish", shift:"mahsulotlar buyurtma boʻyicha, yaqin joyda tayyorlanadi",
   feats:["Foydalanuvchi oʻlchamiga moslab tayyorlanadi","Ehtiyot qismlari mahalliy bosib chiqariladi","Modulli: qismlarni almashtirish mumkin"]},
  {id:'access', name:'Inklyuziv dizayn', brand:'Barcha', desc:'Hamma uchun: yosh, imkoniyat, til',
   enabler:"inklyuziv dizayn tamoyillari", shift:"mahsulot har qanday qobiliyatdagi odam uchun qulay boʻlishi talab etiladi",
   feats:["Ovoz, tasvir va teginish orqali ishlaydi","Koʻp tilli va oddiy interfeys","Yoʻriqnomasiz, birinchi urinishdayoq tushunarli"]},
  {id:'energy', name:'Toza energiya', brand:'Quyosh', desc:'Quyosh, batareyalar, energiya mustaqilligi',
   enabler:"toza va arzon energiya", shift:"energiya mahalliy ishlab chiqariladi va saqlanadi",
   feats:["Quyosh yoki kinetik energiyadan oʻzi quvvatlanadi","Ozgina energiya sarflaydi","Tarmoqsiz joyda ham ishlaydi"]},
  {id:'data', name:'Maʻlumot va maxfiylik', brand:'Ishonch', desc:'Shaxsiy maʻlumotga egalik, ishonch',
   enabler:"maxfiylikni saqlovchi maʻlumot texnologiyalari", shift:"odamlar oʻz maʻlumotiga oʻzlari egalik qilishni talab qiladi",
   feats:["Maʻlumot qurilmaning oʻzida qayta ishlanadi","Foydalanuvchi nimani ulashishni oʻzi tanlaydi","Shaffof va tushunarli maxfiylik sozlamalari"]},
  {id:'community', name:'Hamjamiyat va ulashish', brand:'Birga', desc:'Ulashish iqtisodi, mahalla, platformalar',
   enabler:"hamjamiyat platformalari", shift:"egalik oʻrniga ulashish va birgalikda foydalanish ustun boʻladi",
   feats:["Qoʻshnilar/hamjamiyat bilan ulashish mumkin","Ishtirokchilar mukofot/obro' oladi","Hamjamiyat mahsulotni birga yaxshilaydi"]}
];

// SCAMPER-ga asoslangan yondashuvlar
const LENSES = [
  {k:'S', name:'Almashtirish', tag:"SCAMPER · Substitute",
   fmt:(p,t)=>`Mavjud yechimni (${p.current||'hozirgi usul'}) ${t.enabler} bilan almashtiradi. Eskirgan usulni butunlay yangi yondashuvga oʻtkazadi.`,
   form:'Qurilma + ilova'},
  {k:'C', name:'Birlashtirish', tag:"SCAMPER · Combine",
   fmt:(p,t)=>`Bir nechta alohida vazifani (kuzatish, eslatish, hamkorlik) bitta mahsulotda ${t.enabler} orqali birlashtiradi.`,
   form:'Platforma'},
  {k:'A', name:'Moslashtirish', tag:"SCAMPER · Adapt",
   fmt:(p,t)=>`Boshqa sohada isbotlangan modelni (masalan, obuna yoki oʻyin mexanikasi) shu muammoga moslashtiradi, ${t.enabler} bilan kuchaytiradi.`,
   form:'Xizmat'},
  {k:'M', name:'Oʻzgartirish', tag:"SCAMPER · Modify",
   fmt:(p,t)=>`Mahsulot oʻlchami, shakli yoki tajribasini keskin oʻzgartiradi: ${p.persona||'foydalanuvchi'} uchun sezilmas va tabiiy boʻladi.`,
   form:'Kiyiladigan / ixcham qurilma'},
  {k:'P', name:'Boshqa maqsadda', tag:"SCAMPER · Put to other use",
   fmt:(p,t)=>`Allaqachon mavjud infratuzilmani (telefon, maishiy texnika, jamoat joylari) yangi maqsadda ishlatadi — ${t.enabler} yordamida.`,
   form:'Dasturiy qoʻshimcha'},
  {k:'E', name:'Olib tashlash', tag:"SCAMPER · Eliminate",
   fmt:(p,t)=>`Murakkab qadamlarni butunlay yoʻq qiladi: foydalanuvchi hech narsa sozlamaydi, ${t.enabler} hammasini oʻzi bajaradi.`,
   form:'Avtomatik xizmat'},
  {k:'R', name:'Teskari qarash', tag:"SCAMPER · Reverse",
   fmt:(p,t)=>`Rolni teskari qiladi: muammoni hal qilish oʻrniga, uni oldindan oldini oladi; foydalanuvchi emas, tizim tashabbus koʻrsatadi (${t.enabler}).`,
   form:'Proaktiv tizim'}
];

const SUFFIX = ['Mate','Lab','Go','Nest','Flow','Pal','Loop','Pod','Ly','Bridge'];
const $ = s => document.querySelector(s);
const STORE = 'fps-state-v1';

let state = load() || {step:1, trends:[], ideas:[], pick:null, canvas:{}, f:{}};

function load(){ try{return JSON.parse(localStorage.getItem(STORE));}catch(e){return null;} }
function save(){ try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){} }

const FIELDS = ['problem','why','current','persona','goal','pain','context','constraints','horizon','signals','world'];
const LABELS = ['Muammo','Foydalanuvchi','Kelajak sintezi','Gʻoyalar','Artefakt'];

function readFields(){ FIELDS.forEach(id=>{ state.f[id] = $('#'+id).value.trim(); }); }
function writeFields(){ FIELDS.forEach(id=>{ if(state.f[id]!=null) $('#'+id).value = state.f[id]; }); }

function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
const trendById = id => TRENDS.find(t=>t.id===id);

function makeIdeas(){
  const p = state.f;
  const ts = state.trends.map(trendById);
  const lenses = shuffle(LENSES).slice(0,6);
  state.ideas = lenses.map((l,i)=>{
    // har bir gʻoyaga 1–2 ta kelajak kuchi
    const main = ts[i % ts.length];
    const second = ts.length>1 ? ts[(i+1+Math.floor(Math.random()*(ts.length-1))) % ts.length] : null;
    const used = second && second.id!==main.id ? [main,second] : [main];
    const name = used[0].brand + SUFFIX[Math.floor(Math.random()*SUFFIX.length)];
    return {
      id:i, name, lens:l.k, tag:l.tag, lensName:l.name, form:l.form,
      trends:used.map(t=>t.id),
      pitch:l.fmt(p,main) + (used[1]?` Shuningdek "${used[1].name}" kuchidan foydalanadi.`:'')
    };
  });
  state.pick = null;
}

function buildCanvas(idea){
  const p = state.f, h = +p.horizon||5;
  const ts = idea.trends.map(trendById);
  const feats = [];
  ts.forEach(t=>t.feats.forEach(f=>feats.push(f)));
  const who = p.persona || 'maqsadli foydalanuvchi';
  return {
    name: idea.name,
    promise: `${who} uchun "${p.problem}" muammosini ${idea.lensName.toLowerCase()} yondashuvi bilan hal qiluvchi ${idea.form.toLowerCase()}. ${p.goal?`U ${p.goal.toLowerCase()}ga osonroq erishadi.`:''}`,
    forwho: `${who}.\nMaqsadi: ${p.goal||'—'}\nOgʻrigʻi: ${p.pain||'—'}\nKontekst: ${p.context||'—'}`,
    problem: `${p.problem}\nOqibati: ${p.why||'—'}\nHozirgi yechim: ${p.current||'—'}`,
    features: feats.slice(0,5).map((f,i)=>`${i+1}. ${f}`).join('\n'),
    artifact: `Ko'rinishi: ${idea.form.toLowerCase()} — ${who} hayotiga tabiiy singib ketadigan, oddiy va tanish shakl. Material, rang va o'lchamni foydalanuvchi muhitiga moslang.\nHarakati (dinamikasi): ${idea.lensName.toLowerCase()} usulida ishlaydi — vaziyat o'zgarganda o'zi moslashadi.\nVazifasi: "${p.problem}" muammosini kundalik foydalanishda kamaytirish.\nMa'nosi: foydalanuvchiga nazorat va ishonch hissini qaytaradi.`,
    strategy: `Tadqiqot: signallar — ${p.signals||'hali kiritilmagan'}.\nDizayn: artefaktni ${h} yillik kelajak dunyosiga mos loyihalash va sinash.\nStrategiya: bugun kichik qadam (MVP) → ${h} yilda masshtab. Ta'sirni o'lchang: kimning hayoti qanday yaxshilandi?`,
    future: (p.world?`Kelajak dunyosi: ${p.world}\n`:'') + ts.map(t=>`• ${t.name}: ${t.shift}.`).join('\n') + `\n${h} yildan keyin ushbu mahsulot shu dunyoga tabiiy mos tushadi.`,
    prototype: `1-hafta: Qogʻoz/Figma eskizi va "sehrgar" (qoʻlda bajariladigan) prototip — ${who} bilan sinash.\n2–4-hafta: Ishlaydigan minimal prototip (MVP) — faqat bitta asosiy funksiya.\n2–3-oy: 10–20 foydalanuvchida dala sinovi, fikr-mulohaza.\nKeyin: ${h} yillik yoʻl xaritasi — ${ts.map(t=>t.name.toLowerCase()).join(', ')} imkoniyatlarini bosqichma-bosqich qoʻshish.`,
    validate: `Gipoteza: ${who} bu muammoni haqiqatan ogʻriqli deb biladi va yangi yechimga oʻtadi.\nSinov: 5–8 ta chuqur suhbat + prototipni ishlatib koʻrish.\nOʻlchov: muammo chastotasining kamayishi, takror foydalanish, "tavsiya qilaman" ulushi.\nMuvaffaqiyat mezoni: sinovchilarning kamida 60%i qayta foydalanadi.`,
    risks: `• Cheklov: ${p.constraints||'aniqlanmagan'}\n• Texnologiya hali yetilmagan boʻlishi mumkin — soddaroq muqobilini tayyorlab qoʻying\n• Foydalanuvchi ishonchi va maxfiylik\n• Narx va ishlab chiqarish imkoniyati`,
    business: `Variantlar: obuna · qurilma + xizmat · hamkor tashkilotlar (B2B2C) · hamjamiyat/grant moliyasi.\nBirinchi qadam: kimdir bu uchun pul toʻlaydimi — tezkor sinab koʻring.`
  };
}

const CV_BOXES = [
  ['promise','Qiymat taklifi',true],['forwho','Kim uchun',false],['problem','Muammo',false],
  ['artifact','Artefakt: ko‘rinishi va vazifasi',true],['features','Asosiy funksiyalar',false],['strategy','Tadqiqot · dizayn · strategiya',false],['future','Kelajak stsenariysi',false],
  ['prototype','Prototip rejasi',true],['validate','Tekshiruv',false],['risks','Xavflar',false],['business','Biznes model',true]
];

function renderSteps(){
  const el = $('#steps'); el.innerHTML='';
  LABELS.forEach((l,i)=>{
    const b = document.createElement('button');
    b.textContent = `${i+1}. ${l}`;
    b.className = i+1===state.step?'on':(i+1<state.step?'done':'');
    b.onclick = ()=>go(i+1);
    el.appendChild(b);
  });
}

function renderTrends(){
  const box = $('#trends'); box.innerHTML='';
  TRENDS.forEach(t=>{
    const b = document.createElement('button');
    b.className = 'trend'+(state.trends.includes(t.id)?' sel':'');
    b.innerHTML = `<b>${t.name}</b><span>${t.desc}</span>`;
    b.onclick = ()=>{
      const i = state.trends.indexOf(t.id);
      if(i>=0) state.trends.splice(i,1); else state.trends.push(t.id);
      save(); renderTrends();
    };
    box.appendChild(b);
  });
}

function renderIdeas(){
  const box = $('#ideas'); box.innerHTML='';
  $('#count').textContent = state.ideas.length? `${state.ideas.length} ta konsepsiya` : '';
  if(!state.ideas.length){ box.innerHTML='<div class="empty">Hozircha gʻoya yoʻq. "Yangi gʻoyalar" tugmasini bosing.</div>'; return; }
  state.ideas.forEach(d=>{
    const c = document.createElement('div'); c.className='card';
    const tn = d.trends.map(id=>trendById(id).name).join(' + ');
    c.innerHTML = `<span class="tag">${d.tag}</span><h3></h3><p></p><p class="hint"></p><button class="btn">Shuni tanlash →</button>`;
    c.querySelector('h3').textContent = d.name + ' — ' + d.form;
    c.querySelector('p').textContent = d.pitch;
    c.querySelector('.hint').textContent = 'Kuchlar: '+tn;
    c.querySelector('button').onclick = ()=>{
      state.pick = d.id; state.canvas = buildCanvas(d); save(); go(5);
    };
    box.appendChild(c);
  });
}

function renderCanvas(){
  const box = $('#canvas');
  if(state.pick==null){ box.innerHTML='<div class="empty">Avval 4-qadamda konsepsiya tanlang.</div>'; return; }
  box.innerHTML = '<label>Mahsulot nomi<input id="cvname"></label><div class="cv"></div>';
  $('#cvname').value = state.canvas.name;
  $('#cvname').oninput = e=>{ state.canvas.name=e.target.value; save(); };
  const cv = box.querySelector('.cv');
  CV_BOXES.forEach(([k,title,wide])=>{
    const d = document.createElement('div'); d.className='box'+(wide?' wide':'');
    d.innerHTML = `<h4></h4><div contenteditable="true" spellcheck="false"></div>`;
    d.querySelector('h4').textContent = title;
    const ed = d.querySelector('[contenteditable]');
    ed.textContent = state.canvas[k]||'';
    ed.oninput = ()=>{ state.canvas[k]=ed.innerText; save(); };
    cv.appendChild(d);
  });
}

function canvasText(){
  const c = state.canvas;
  return [`MAHSULOT: ${c.name}`,'',...CV_BOXES.map(([k,t])=>`## ${t}\n${c[k]||''}\n`)].join('\n');
}

function validate(step){
  if(step===1 && state.step===1 && !state.f.problem){ alert("Avval muammoni yozing."); return false; }
  return true;
}

function go(n){
  if(state.step===1||state.step===2||state.step===3) readFields();
  if(n>state.step && !validate(state.step)) return;
  if(n>=4 && !state.f.problem){ alert("Avval muammoni yozing."); n=1; }
  if(n===4){
    if(!state.trends.length){ alert("Kamida bitta kelajak kuchini tanlang."); n=3; }
    else if(!state.ideas.length){ makeIdeas(); }
  }
  state.step = n; save(); render();
  window.scrollTo({top:0,behavior:'smooth'});
}

function render(){
  document.querySelectorAll('.step').forEach(s=>s.hidden = +s.dataset.step!==state.step);
  renderSteps();
  if(state.step===3) renderTrends();
  if(state.step===4) renderIdeas();
  if(state.step===5) renderCanvas();
  $('#prev').style.visibility = state.step===1?'hidden':'visible';
  $('#next').style.display = state.step===5?'none':'';
}

// Hodisalar
$('#next').onclick = ()=>go(state.step+1);
$('#prev').onclick = ()=>go(state.step-1);
$('#regen').onclick = ()=>{ makeIdeas(); save(); renderIdeas(); };
$('#reset').onclick = ()=>{ if(confirm("Hamma maʻlumot oʻchiriladi. Davom etamizmi?")){ localStorage.removeItem(STORE); location.reload(); } };
$('#copy').onclick = async ()=>{ try{ await navigator.clipboard.writeText(canvasText()); alert('Nusxa olindi'); }catch(e){ alert('Nusxa olib boʻlmadi'); } };
$('#print').onclick = ()=>window.print();
$('#download').onclick = ()=>{
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([canvasText()],{type:'text/plain;charset=utf-8'}));
  a.download = (state.canvas.name||'mahsulot')+'.txt'; a.click(); URL.revokeObjectURL(a.href);
};
document.querySelectorAll('.chip[data-ex]').forEach(b=>b.onclick=()=>{
  const [p,w,c] = b.dataset.ex.split('|');
  $('#problem').value=p; $('#why').value=w; $('#current').value=c;
});
FIELDS.forEach(id=>$('#'+id).addEventListener('input',readFields));

writeFields();
render();
