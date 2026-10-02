'use strict';

const $ = s => document.querySelector(s);
function toast(msg){
  let t=document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
  t.textContent=msg; t.className='show'; clearTimeout(toast.h); toast.h=setTimeout(()=>t.className='',3500);
}
const STORE = 'fps-state-v2';
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// 1A varaq qatorlari
const ROWS = [
  {k:'tech', name:'Yangi texnologiya', hint:'Kelajak uchun qaysi texnologiyalarni o‘rganmoqchisiz?', ex:'Mashinaviy o‘rganish, Blokcheyn, Sintetik biologiya, Nanotexnologiya, 3D bosma, IoT',
   sample:['Mashinaviy o‘rganish','IoT sensorlar','3D bosma','Sintetik biologiya']},
  {k:'problem', name:'Muammo / chaqiriq', hint:'Qaysi muammoni hal qilmoqchisiz? Ijtimoiy yoki ekologik bo‘lishi mumkin.', ex:'Iqlim o‘zgarishi, Diabet, Oziq-ovqat xavfsizligi, Okean plastigi, Gender tengsizligi',
   sample:['Iqlim o‘zgarishi','Oziq-ovqat xavfsizligi','Yolg‘izlik','Toza suv tanqisligi']},
  {k:'biz', name:'Biznes imkoniyat', hint:'Qaysi biznes imkoniyatlari va trendlarni ko‘ryapsiz?', ex:'P2P, Obuna, Hamjamiyat a‘zoligi, Ulashish iqtisodi',
   sample:['Obuna','P2P ulashish','Hamjamiyat a‘zoligi','Masofaviy xizmat']},
  {k:'future', name:'Kelajaklar', hint:'Qaysi kelajak stsenariylari sizni hayajonlantiradi? Yaqin, o‘rta yoki uzoq bo‘lishi mumkin.', ex:'3 kunlik ish haftasi, ekologik utopiya, planetalararo savdo',
   sample:['3 kunlik ish haftasi','Ekologik utopiya','Pulsiz dunyo','Ishdan keyingi jamiyat']}
];

const CATS = [
  {k:'probable', name:'Ehtimol (probable)', d:'Ehtimoli yuqori; hozirgi trendlar davomi', c:'#2f9e6a'},
  {k:'plausible', name:'Mumkin (plausible)', d:'Bugungi tushunchaga ko‘ra bo‘lishi mumkin', c:'#3b82f6'},
  {k:'possible', name:'Imkoniyatli (possible)', d:'Hozircha noma’lum narsalarga bog‘liq', c:'#d49a1d'},
  {k:'impossible', name:'Imkonsiz (impossible)', d:'Bema‘ni yoki sodir bo‘lmaydigan ko‘rinadi', c:'#d1493f'}
];
const HORS = [
  {k:'present', name:'Hozir (0)'},{k:'near', name:'Yaqin kelajak (1)'},
  {k:'mid', name:'O‘rta kelajak (2)'},{k:'far', name:'Uzoq kelajak (3)'}
];
const LABELS = ['Boshlang‘ich nuqta','Kelajak g‘ildiragi','Konus: tekis','Konus: loyihalangan','Teskari xarit. + g‘oya','Artefakt','Rasm → bugun'];

function blank(){
  const a = {}; ROWS.forEach(r=>a[r.k]=['','','','']);
  const br = ()=>({t:'',s:'',a:''});
  return {step:1, a, combos:['','',''], start:'',
    wheel:{pos:[br(),br()], neg:[br(),br()]}, cat:{}, hor:{}, past:'',
    target:'', persona:'', pain:'', imgNote:'', comps:[], needs:{}, ideas:[], pick:null, canvas:{}};
}
let state = load() || blank();
function load(){ try{const s=JSON.parse(localStorage.getItem(STORE)); return s&&s.a?Object.assign(blank(),s):null;}catch(e){return null;} }
function save(){ try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){} }

// yo'l bo'yicha o'qish/yozish: "wheel.pos.0.t"
function getp(path){ return path.split('.').reduce((o,k)=>o==null?o:o[k],state); }
function setp(path,v){ const ks=path.split('.'); const last=ks.pop(); ks.reduce((o,k)=>o[k],state)[last]=v; }
function bind(root){
  root.querySelectorAll('[data-k]').forEach(el=>{
    const v = getp(el.dataset.k); if(v!=null && el.tagName!=='SELECT') el.value = v;
    el.oninput = el.onchange = ()=>{ setp(el.dataset.k, el.value); save(); if(el.dataset.re) render(); };
  });
}

// ---- Tugunlar (g'ildirakdan) ----
function nodes(){
  const out=[];
  [['pos','Ijobiy'],['neg','Salbiy']].forEach(([sg])=>{
    state.wheel[sg].forEach((b,i)=>{
      [['t',1],['s',2],['a',3]].forEach(([f,o])=>{
        if(b[f] && b[f].trim()) out.push({id:`${sg}${i}${f}`, text:b[f].trim(), sign:sg, order:o});
      });
    });
  });
  return out;
}
const nodeById = id => nodes().find(n=>n.id===id);
const dot = n => `<span class="dot ${n.sign}"></span>`;

// ---- 1: Boshlang'ich nuqta ----
function renderStart(){
  $('#rows').innerHTML = ROWS.map(r=>`<div class="rowset"><h4>${r.name}</h4><p class="hint">${r.hint} Masalan: ${r.ex}</p>
    <div class="four">${[0,1,2,3].map(i=>`<input data-k="a.${r.k}.${i}" placeholder="${i+1}">`).join('')}</div></div>`).join('');
  $('#combos').innerHTML = [0,1,2].map(i=>`<div class="combo"><b>${i+1}</b><input data-k="combos.${i}" data-re="1" placeholder="Masalan: Mashinaviy o‘rganish + yolg‘izlik + obuna + ekologik utopiya"></div>`).join('');
  bind($('#rows')); bind($('#combos'));
  const opts = state.combos.filter(c=>c.trim());
  $('#startpick').innerHTML = opts.length ? opts.map(c=>`<button class="pick${state.start===c?' sel':''}" data-c="${esc(c)}">${esc(c)}</button>`).join('') : '<span class="hint">Avval kamida bitta kombinatsiyani yozing.</span>';
  $('#startpick').querySelectorAll('.pick').forEach(b=>b.onclick=()=>{ state.start=b.dataset.c; save(); renderStart(); });
}
function pickRand(arr){ const f=arr.filter(x=>x.trim()); return f.length?f[Math.floor(Math.random()*f.length)]:''; }
function suggestCombos(){
  state.combos = [0,1,2].map(()=>ROWS.map(r=>pickRand(state.a[r.k])).filter(Boolean).join(' + '));
  save(); renderStart();
}

// ---- 2: G'ildirak ----
const ORD = {t:'1-tartib: aniq oqibat', s:'2-tartib: tadqiqotga asoslangan', a:'3-tartib: qo‘shni sohalar'};
function renderWheel(){
  $('#center').textContent = 'Markaz: ' + (state.start||'(1-qadamda boshlang‘ich nuqtani tanlang)');
  const mk = (sg,i)=>{
    const lab = sg==='pos'?'Ijobiy':'Salbiy';
    return `<div class="branch ${sg}"><h4>${lab} oqibat ${i+1}</h4>${['t','s','a'].map(f=>
      `<label>${ORD[f]}<input data-k="wheel.${sg}.${i}.${f}" data-re="" placeholder="${f==='t'?'Nima sodir bo‘ladi?':'Bundan keyin nima?'}"></label>`).join('')}</div>`;
  };
  $('#wheel').innerHTML = mk('pos',0)+mk('neg',0)+mk('pos',1)+mk('neg',1);
  bind($('#wheel'));
}

// ---- 3: Tekis konus ----
function renderCone1(){
  $('#legend').innerHTML = CATS.map(c=>`<span><span class="dot" style="background:${c.c}"></span><b>${c.name}</b> — ${c.d}</span>`).join('');
  const ns = nodes();
  if(!ns.length){ $('#cone1').innerHTML='<div class="empty">Avval 2-qadamda g‘ildirakni to‘ldiring.</div>'; return; }
  $('#cone1').innerHTML = `<div class="nodes">${ns.map(n=>`<div class="nodebar"><div>${dot(n)}${esc(n.text)}</div>
    <select data-n="${n.id}"><option value="">— joylashtirmaslik —</option>${CATS.map(c=>`<option value="${c.k}"${state.cat[n.id]===c.k?' selected':''}>${c.name}</option>`).join('')}</select></div>`).join('')}</div>
    <p class="hint">${Object.values(state.cat).filter(Boolean).length} ta tugun joylandi (tavsiya: 10–15).</p>`;
  $('#cone1').querySelectorAll('select').forEach(s=>s.onchange=()=>{ state.cat[s.dataset.n]=s.value; save(); renderCone1(); });
}

// ---- 4: Loyihalangan konus ----
function placed(){ return nodes().filter(n=>state.cat[n.id]); }
function renderCone2(){
  bind($('#cone2').previousElementSibling);
  const ns = placed();
  $('#cone2').innerHTML = ns.length ? `<div class="nodes">${ns.map(n=>`<div class="nodebar"><div>${dot(n)}${esc(n.text)} <small>(${CATS.find(c=>c.k===state.cat[n.id]).name})</small></div>
    <select data-n="${n.id}"><option value="">— vaqtni tanlang —</option>${HORS.map(h=>`<option value="${h.k}"${state.hor[n.id]===h.k?' selected':''}>${h.name}</option>`).join('')}</select></div>`).join('')}</div>`
    : '<div class="empty">Avval 3-qadamda tugunlarni kelajak turiga joylang.</div>';
  $('#cone2').querySelectorAll('select').forEach(s=>s.onchange=()=>{ state.hor[s.dataset.n]=s.value; save(); renderCone2(); });
  renderMatrix(ns);
}
function renderMatrix(ns){
  if(!ns.length){ $('#matrix').innerHTML=''; return; }
  $('#matrix').innerHTML = `<table class="mx"><tr><th></th>${HORS.map(h=>`<th>${h.name}</th>`).join('')}</tr>${CATS.map(c=>
    `<tr><th style="border-left:6px solid ${c.c}">${c.name}</th>${HORS.map(h=>`<td>${ns.filter(n=>state.cat[n.id]===c.k&&state.hor[n.id]===h.k).map(n=>`<span class="nd">${dot(n)}${esc(n.text)}</span>`).join('')}</td>`).join('')}</tr>`).join('')}</table>`;
}

// ---- 5: Teskari xaritalash ----
function backSteps(){
  const t = nodeById(state.target);
  const byH = h => placed().filter(n=>state.hor[n.id]===h && n.id!==state.target).map(n=>'• '+n.text).join('\n');
  const who = state.persona || 'foydalanuvchi';
  return [
    ['Uzoq kelajak (istalgan natija)', t ? t.text : '(tugunni tanlang)'],
    ['O‘rta kelajak — buning uchun nima bo‘lishi kerak?', byH('mid') || 'Xaritangizda o‘rta kelajak tugunlari yo‘q. Savol: uzoq kelajakdan bir qadam oldin nima sodir bo‘lgan bo‘lishi kerak?'],
    ['Yaqin kelajak — buning uchun nima bo‘lishi kerak?', byH('near') || 'Yaqin kelajak tugunlari yo‘q. Savol: o‘rta kelajak uchun qaysi sharoitlar yaratilishi kerak?'],
    ['Hozir', (byH('present') ? byH('present')+'\n' : '') + `Birinchi qadam: ${who} bilan 5 ta suhbat o‘tkazing va eng kichik prototipni tayyorlang.`]
  ];
}
function renderTarget(){
  const ns = placed();
  $('#target').innerHTML = '<option value="">— tanlang —</option>' + ns.map(n=>`<option value="${n.id}"${state.target===n.id?' selected':''}>${esc(n.text)} (${CATS.find(c=>c.k===state.cat[n.id]).name})</option>`).join('');
  $('#target').onchange = ()=>{ state.target=$('#target').value; save(); renderBack(); };
  bind($('#target').closest('section'));
  $('#target').onchange = ()=>{ state.target=$('#target').value; save(); renderBack(); };
}
function renderBack(){
  $('#back').innerHTML = backSteps().map(([h,t])=>`<div><b>${esc(h)}</b>${esc(t)}</div>`).join('');
}

// ---- G'oya generatsiyasi: SCAMPER ----
const LENSES = [
  {name:'Almashtirish', form:'Qurilma + ilova', fmt:c=>`Mavjud yechimni ${c.tech} bilan almashtiradi va "${c.problem}" muammosini butunlay yangi yo‘l bilan hal qiladi.`},
  {name:'Birlashtirish', form:'Platforma', fmt:c=>`${c.tech} va ${c.biz} modelini birlashtirib, "${c.problem}" ga qarshi bitta yagona tizim yaratadi.`},
  {name:'Moslashtirish', form:'Xizmat', fmt:c=>`Boshqa sohada isbotlangan ${c.biz} modelini "${c.problem}" muammosiga moslashtiradi, ${c.tech} bilan kuchaytiradi.`},
  {name:'O‘zgartirish', form:'Ixcham / kiyiladigan qurilma', fmt:c=>`Mahsulot shakli va tajribasini o‘zgartiradi: ${c.who} uchun sezilmas bo‘lib, ${c.tech} orqali "${c.problem}" ni kamaytiradi.`},
  {name:'Boshqa maqsadda', form:'Dasturiy qo‘shimcha', fmt:c=>`Mavjud infratuzilmani yangi maqsadda ishlatadi: ${c.tech} yordamida "${c.problem}" ni hal qiladi.`},
  {name:'Olib tashlash', form:'Avtomatik xizmat', fmt:c=>`Murakkab qadamlarni yo‘q qiladi: ${c.who} hech narsa sozlamaydi, ${c.tech} hammasini o‘zi bajaradi.`},
  {name:'Teskari qarash', form:'Proaktiv tizim', fmt:c=>`Muammoni hal qilish o‘rniga uning oldini oladi: tizim tashabbus ko‘rsatadi (${c.tech}), ${c.future} dunyosiga mos.`}
];
const SUFFIX = ['Mate','Lab','Go','Nest','Flow','Pal','Loop','Pod','Ly','Bridge'];
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
const fill = (arr,def) => { const f=arr.filter(x=>x.trim()); return f.length?f:[def]; };

function makeIdeas(){
  const T = fill(state.a.tech,'yangi texnologiya'), P = fill(state.a.problem,'bu muammo'),
        B = fill(state.a.biz,'yangi biznes model'), F = fill(state.a.future,'kelajak');
  const t = state.target && nodeById(state.target);
  state.ideas = shuffle(LENSES).slice(0,6).map((l,i)=>{
    const c = {tech:T[i%T.length], problem:P[Math.floor(Math.random()*P.length)], biz:B[Math.floor(Math.random()*B.length)],
               future:t?t.text:F[Math.floor(Math.random()*F.length)], who:state.persona||'foydalanuvchi'};
    return {id:i, name:c.tech.split(' ')[0].replace(/[^\p{L}]/gu,'') + SUFFIX[Math.floor(Math.random()*SUFFIX.length)],
      lens:l.name, form:l.form, c, pitch:l.fmt(c)};
  });
  state.pick=null;
}
function renderIdeas(){
  $('#count').textContent = state.ideas.length ? `${state.ideas.length} ta konsepsiya` : '';
  if(!state.ideas.length){ $('#ideas').innerHTML='<div class="empty">"Yangi g‘oyalar" tugmasini bosing.</div>'; return; }
  $('#ideas').innerHTML = state.ideas.map(d=>`<div class="card"><span class="tag">SCAMPER · ${esc(d.lens)}</span>
    <h3>${esc(d.name)} — ${esc(d.form)}</h3><p>${esc(d.pitch)}</p>
    <p class="hint">Texnologiya: ${esc(d.c.tech)} · Biznes: ${esc(d.c.biz)}</p>
    <button class="btn" data-i="${d.id}">Shuni tanlash →</button></div>`).join('');
  $('#ideas').querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const d = state.ideas.find(x=>x.id==b.dataset.i); state.pick=d.id; state.canvas=buildCanvas(d); save(); go(6);
  });
}

// ---- 6: Artefakt ----
function buildCanvas(d){
  const c=d.c, who=state.persona||'maqsadli foydalanuvchi', t=nodeById(state.target);
  return {
    name:d.name,
    promise:`${who} uchun "${c.problem}" muammosini ${d.lens.toLowerCase()} yondashuvi bilan hal qiluvchi ${d.form.toLowerCase()}.`,
    start:`Boshlang‘ich nuqta: ${state.start||'—'}\nO‘tmish: ${state.past||'—'}`,
    artifact:`Ko‘rinishi: ${d.form.toLowerCase()}, ${who} hayotiga tabiiy singadigan oddiy shakl. Material, rang va o‘lchamni foydalanuvchi muhitiga moslang.\nHarakati (dinamikasi): ${c.tech} yordamida vaziyat o‘zgarganda o‘zi moslashadi.\nVazifasi: "${c.problem}" ni kundalik foydalanishda kamaytirish.\nMa‘nosi: ${state.pain?`"${state.pain}" og‘rig‘ini yengillashtiradi va `:''}foydalanuvchiga nazorat va ishonch qaytaradi.`,
    future:`Istalgan kelajak: ${t?t.text:'—'}\nOqibatlar xaritasidan:\n${placed().slice(0,6).map(n=>`${n.sign==='pos'?'[+]':'[−]'} ${n.text} (${CATS.find(x=>x.k===state.cat[n.id]).k})`).join('\n')||'—'}`,
    backcast:backSteps().map(([h,x])=>`${h}:\n${x}`).join('\n\n'),
    prototype:`1-hafta: Qog‘oz/Figma eskizi va qo‘lda bajariladigan prototip, ${who} bilan sinash.\n2–4-hafta: Bitta asosiy funksiyali MVP.\n2–3-oy: 10–20 foydalanuvchida dala sinovi.\nKeyin: konusdagi yaqin va o‘rta kelajak tugunlariga mos bosqichma-bosqich rivojlantirish.`,
    validate:`Gipoteza: ${who} bu muammoni og‘riqli deb biladi va yangi yechimga o‘tadi.\nSinov: 5–8 chuqur suhbat + prototipni ishlatish.\nO‘lchov: takror foydalanish, muammo chastotasining kamayishi.\nMezon: sinovchilarning kamida 60%i qayta foydalanadi.`,
    risks:`• Salbiy oqibatlar (g‘ildirakdan):\n${nodes().filter(n=>n.sign==='neg').map(n=>'  - '+n.text).join('\n')||'  -'}\n• Texnologiya yetilmagan bo‘lishi mumkin: soddaroq muqobil tayyorlang\n• Ishonch va maxfiylik; narx va ishlab chiqarish`,
    business:`Biznes imkoniyat: ${c.biz}.\nBirinchi qadam: kimdir bu uchun pul to‘laydimi, tezkor sinab ko‘ring.`
  };
}
const CV_BOXES = [['promise','Qiymat taklifi',true],['start','Boshlang‘ich nuqta',false],['future','Kelajak konteksti',false],
  ['artifact','Artefakt: ko‘rinishi va vazifasi',true],['backcast','Teskari xaritalash',true],['prototype','Prototip rejasi',false],
  ['validate','Tekshiruv',false],['risks','Xavflar',false],['business','Biznes model',false]];
function renderCanvas(){
  const box=$('#canvas');
  if(state.pick==null){ box.innerHTML='<div class="empty">Avval 5-qadamda konsepsiya tanlang.</div>'; return; }
  box.innerHTML = '<label>Mahsulot nomi<input id="cvname"></label><div class="cv"></div>';
  $('#cvname').value=state.canvas.name; $('#cvname').oninput=e=>{state.canvas.name=e.target.value;save();};
  const cv=box.querySelector('.cv');
  CV_BOXES.forEach(([k,title,wide])=>{
    const d=document.createElement('div'); d.className='box'+(wide?' wide':'');
    d.innerHTML='<h4></h4><div contenteditable="true" spellcheck="false"></div>';
    d.querySelector('h4').textContent=title;
    const ed=d.querySelector('[contenteditable]'); ed.textContent=state.canvas[k]||'';
    ed.oninput=()=>{state.canvas[k]=ed.innerText;save();};
    cv.appendChild(d);
  });
}
const canvasText = ()=>[`MAHSULOT: ${state.canvas.name}`,'',...CV_BOXES.map(([k,t])=>`## ${t}\n${state.canvas[k]||''}\n`)].join('\n');

// ---- Navigatsiya ----
function go(n){
  if(n>=2 && !state.start){ toast('Avval 1-qadamda boshlang‘ich nuqtani tanlang.'); n=1; }
  else if(n>=3 && !nodes().length){ toast('Avval g‘ildirakni to‘ldiring.'); n=2; }
  else if(n>=5 && !placed().length){ toast('Avval tugunlarni konusga joylang.'); n=3; }
  state.step=n; save(); render(); window.scrollTo({top:0,behavior:'smooth'});
}
function render(){
  document.querySelectorAll('.step').forEach(s=>s.hidden=+s.dataset.step!==state.step);
  $('#steps').innerHTML = LABELS.map((l,i)=>`<button class="${i+1===state.step?'on':(i+1<state.step?'done':'')}" data-s="${i+1}">${i+1}. ${l}</button>`).join('');
  $('#steps').querySelectorAll('button').forEach(b=>b.onclick=()=>go(+b.dataset.s));
  ({1:renderStart,2:renderWheel,3:renderCone1,4:renderCone2,5:()=>{renderTarget();renderBack();renderIdeas();},6:renderCanvas,7:renderReality})[state.step]();
  bind($('#cone2').parentElement);
  $('#prev').style.visibility=state.step===1?'hidden':'visible';
  $('#next').style.display=state.step===7?'none':'';
}

$('#next').onclick=()=>go(state.step+1);
$('#prev').onclick=()=>go(state.step-1);
$('#regen').onclick=()=>{ makeIdeas(); save(); renderIdeas(); };
$('#suggest').onclick=suggestCombos;
$('#sample').onclick=()=>{ ROWS.forEach(r=>state.a[r.k]=r.sample.slice()); save(); renderStart(); };
let resetArmed=false;
$('#reset').onclick=()=>{
  if(!resetArmed){ resetArmed=true; $('#reset').textContent='Aniqmi? Hammasi o‘chadi — yana bosing'; setTimeout(()=>{resetArmed=false;$('#reset').textContent='Boshidan boshlash';},4000); return; }
  state=blank(); try{localStorage.removeItem(STORE);}catch(e){} imgData=null; resetArmed=false; $('#reset').textContent='Boshidan boshlash'; render();
};
$('#copy').onclick=async()=>{ try{ await navigator.clipboard.writeText(canvasText()); toast('Nusxa olindi'); }catch(e){ toast('Nusxa olib bo‘lmadi'); } };
$('#print').onclick=()=>window.print();
$('#download').onclick=()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([canvasText()],{type:'text/plain;charset=utf-8'})); a.download=(state.canvas.name||'mahsulot')+'.txt'; a.click(); URL.revokeObjectURL(a.href); };
// ---- 7: Rasmdan haqiqatga ----
let imgData = null; // brauzer xotirasida (saqlanmaydi)
const norm = s => String(s||'').toLowerCase().replace(/[‘’ʻ'`]/g,'');
function contextText(){ return [state.start,state.imgNote,state.persona,state.pain, state.canvas.promise,state.canvas.artifact,state.canvas.name, state.ideas.map(i=>i.pitch).join(' ')].join(' '); }
function autoComps(){
  const t = norm(contextText());
  return KB.map(k=>({id:k.id,n:k.kw.filter(w=>norm(w).length>=4&&t.includes(norm(w))).length}))
    .filter(x=>x.n).sort((a,b)=>b.n-a.n).slice(0,5).map(x=>x.id);
}
function renderReality(){
  bind($('#drop').parentElement);
  if(!state.comps.length) state.comps = autoComps();
  $('#comps').innerHTML = KB.map(k=>`<button class="trend${state.comps.includes(k.id)?' sel':''}" data-c="${k.id}"><b>${esc(k.name)}</b><span>Bugun: ${TRL_TXT(k.trl)} (TRL ${k.trl}/9)</span></button>`).join('');
  $('#comps').querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const i=state.comps.indexOf(b.dataset.c); if(i>=0) state.comps.splice(i,1); else state.comps.push(b.dataset.c);
    save(); renderReality();
  });
  if(imgData){ $('#preview').src=imgData; $('#preview').hidden=false; $('#dropHint').hidden=true; }
  renderPlan();
}
function loadImage(file){
  if(!file||!file.type.startsWith('image/')) return;
  const fr=new FileReader();
  fr.onload=()=>{ const im=new Image(); im.onload=()=>{
      const m=1280, s=Math.min(1,m/Math.max(im.width,im.height));
      const c=document.createElement('canvas'); c.width=Math.round(im.width*s); c.height=Math.round(im.height*s);
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      imgData=c.toDataURL('image/jpeg',0.85); renderReality();
    }; im.src=fr.result; };
  fr.readAsDataURL(file);
}
function renderPlan(){
  const sel = KB.filter(k=>state.comps.includes(k.id));
  const box = $('#planOut');
  if(!sel.length){ box.innerHTML=''; return; }
  const avg = sel.reduce((s,k)=>s+k.trl,0)/sel.length;
  const hardest = sel.slice().sort((a,b)=>a.trl-b.trl)[0];
  const cost = Math.round(sel.reduce((s,k)=>s+k.cost,0)/sel.length*10)/10;
  const uniq = key => [...new Set(sel.flatMap(k=>k[key]))];
  const li = arr => arr.map(x=>`<li>${esc(x)}</li>`).join('');
  const need = (grp,arr) => arr.map((x,i)=>{ const id=grp+':'+x; return `<label class="chk"><input type="checkbox" data-n="${esc(id)}"${state.needs[id]?' checked':''}> ${esc(x)}</label>`; }).join('');
  box.innerHTML = `
  <h3>Haqiqiylik jadvali</h3>
  <p class="hint">Umumiy tayyorlik: <b>${avg.toFixed(1)}/9</b> — eng qiyin qism: <b>${esc(hardest.name)}</b> (TRL ${hardest.trl}). Nisbiy murakkablik/narx: ${cost}/5.</p>
  <table class="mx"><tr><th>Qism</th><th>Bugungi holat</th><th>Bugun qanday yasaladi</th><th>Hali yetishmaydi</th></tr>
  ${sel.map(k=>`<tr><td><b>${esc(k.name)}</b><br><small>TRL ${k.trl} · ${TRL_TXT(k.trl)}</small></td><td>${k.trl>=8?'✅':k.trl>=6?'🟡':'🔴'}</td><td>${esc(k.today)}</td><td>${esc(k.gap)}</td></tr>`).join('')}</table>
  <h3>Bosqichli reja: fantastikadan prototipgacha</h3>
  <div class="phases">
    <div><b>0-bosqich: Maket (1–2 hafta)</b><ul>${li(sel.map(k=>k.name+': '+k.mock))}</ul></div>
    <div><b>1-bosqich: Kontseptni isbotlash (2–4 hafta)</b><ul>${li(sel.map(k=>k.name+': '+k.poc))}</ul></div>
    <div><b>2-bosqich: Prototip (2–3 oy)</b><ul>${li(sel.map(k=>k.name+': '+k.proto))}</ul></div>
    <div><b>3-bosqich: Pilot va kengaytirish</b><ul><li>10–20 haqiqiy foydalanuvchida sinov</li><li>Narx, ishlab chiqarish va hamkorlar</li><li>Xaritadagi o‘rta/uzoq kelajak tugunlariga mos yangi imkoniyatlarni qo‘shish</li></ul></div>
  </div>
  <h3>Kerakli narsalar ro‘yxati (ehtiyojlar)</h3>
  <div class="needs">
    <div><h4>Qismlar va materiallar</h4>${need('p',uniq('parts'))}</div>
    <div><h4>Asbob-uskuna va dasturlar</h4>${need('t',uniq('tools'))}</div>
    <div><h4>Ko‘nikma va odamlar</h4>${need('s',uniq('skills'))}</div>
  </div>
  <div class="row"><button class="btn" id="dlPlan">Rejani .txt yuklab olish</button></div>`;
  box.querySelectorAll('[data-n]').forEach(c=>c.onchange=()=>{ state.needs[c.dataset.n]=c.checked; save(); });
  $('#dlPlan').onclick=()=>download('yasash-rejasi.txt', planText(sel));
}
function planText(sel){
  const L=[`YASASH REJASI: ${state.canvas.name||state.start||''}`,'',`Rasm izohi: ${state.imgNote||'—'}`,''];
  sel.forEach(k=>L.push(`## ${k.name} (TRL ${k.trl}/9, ${TRL_TXT(k.trl)})`,`Bugun: ${k.today}`,`Yetishmaydi: ${k.gap}`,`Maket: ${k.mock}`,`Isbot: ${k.poc}`,`Prototip: ${k.proto}`,`Qismlar: ${k.parts.join('; ')}`,`Asboblar: ${k.tools.join('; ')}`,`Ko‘nikmalar: ${k.skills.join('; ')}`,''));
  return L.join('\n');
}
function download(name,text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})); a.download=name; a.click(); URL.revokeObjectURL(a.href); }

// Claude bilan tahlil (ixtiyoriy, server kerak)
function md(s){
  return esc(s).split('\n').map(l=>{
    l=l.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
    if(/^#{1,3} /.test(l)) return '<h4>'+l.replace(/^#+ /,'')+'</h4>';
    if(/^\s*[-*] /.test(l)) return '<div class="li">• '+l.replace(/^\s*[-*] /,'')+'</div>';
    return l?'<p>'+l+'</p>':'';
  }).join('');
}
async function askClaude(){
  const out=$('#aiOut'); out.hidden=false;
  if(!imgData){ out.innerHTML='<p>Avval rasmni yuklang.</p>'; return; }
  out.innerHTML='<p>Claude rasmni tahlil qilmoqda… (1 daqiqagacha vaqt olishi mumkin)</p>';
  try{
    const r=await fetch('/api/analyze',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({image:imgData,note:state.imgNote,context:state.canvas.name?canvasText():contextText(),
        parts:KB.filter(k=>state.comps.includes(k.id)).map(k=>k.name)})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error||('Server xatosi '+r.status));
    out.innerHTML=md(j.text||'');
  }catch(e){
    out.innerHTML='<p><b>AI rejimi mavjud emas:</b> '+esc(e.message)+'</p><p>Ishga tushirish: <code>npm install</code>, so‘ng <code>ANTHROPIC_API_KEY=... npm start</code> va <code>http://localhost:3000</code> manzilini oching. Usiz ham yuqoridagi oflayn reja ishlaydi.</p>';
  }
}
$('#file').onchange=e=>loadImage(e.target.files[0]);
['dragover','drop'].forEach(ev=>$('#drop').addEventListener(ev,e=>{ e.preventDefault(); if(ev==='drop') loadImage(e.dataTransfer.files[0]); }));
$('#plan').onclick=()=>{ if(!state.comps.length) state.comps=autoComps(); save(); renderReality(); $('#planOut').scrollIntoView({behavior:'smooth'}); };
$('#ai').onclick=askClaude;

render();
