'use strict';
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const S = {img:null, hint:"", arch:"holo", a:null, sel:null, hidden:new Set(), view:{yaw:32,pitch:18,zoom:1,explode:0,section:null}, tab:"analysis", laser:{type:"co2",kerf:0.15,sw:600,sh:400}, aiOK:false, sample:null, server:false, drawing:false, showReg:true, addKind:null, kinds:new Map(ARCH.holo.kinds), archManual:false, fname:"", ready:Promise.resolve()};
const pill = (t,c)=>`<span class="pill" style="color:${c}">${esc(t)}</span>`;
const lvPill = l=>`<span class="pill lv${l}">${CX[l]}</span>`;
const stPill = s=>pill(ST[s].n,ST[s].c);
function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("show"); clearTimeout(toast.h); toast.h=setTimeout(()=>t.classList.remove("show"),3200); }
const DL_OK=new Set(["gif","png","jpg","jpeg","webp","mp4","webm","txt","json","md","docx","pptx","epub","csv","ttf","html","svg","pdf","xlsx","zip"]);
async function saveFile(name,data,mime){
  const blob = data instanceof Blob ? data : new Blob([data],{type:mime||"text/plain;charset=utf-8"});
  try{
    const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
    if(dl){
      let fn=name, b=blob; const ext=name.split(".").pop().toLowerCase();
      if(!DL_OK.has(ext)){ b=zip([{name,data:new Uint8Array(await blob.arrayBuffer())}]); fn=name+".zip"; }
      await dl.save({filename:fn,data:b}); toast("Saqlandi: "+fn); return;
    }
  }catch(e){ if(e&&e.code){ toast(e.code==="declined"?"Saqlash bekor qilindi":"Saqlab bo'lmadi: "+(e.message||e.code)); return; } }
  try{ const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); toast("Yuklab olindi: "+name); }
  catch(e){ toast("Faylni saqlab bo'lmadi"); }
}
const slug = ()=> (S.a?S.a.name:"forge").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"forge";

/* ---------- Namuna rasm ---------- */
function sampleImage(){
  return new Promise(res=>{
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720"><defs><radialGradient id="bg" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#10263a"/><stop offset="1" stop-color="#03060a"/></radialGradient><linearGradient id="hp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".05"/><stop offset=".5" stop-color="#22d3ee" stop-opacity=".35"/><stop offset="1" stop-color="#22d3ee" stop-opacity=".08"/></linearGradient><linearGradient id="bs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a222d"/><stop offset=".5" stop-color="#3a4757"/><stop offset="1" stop-color="#151b24"/></linearGradient><filter id="gl"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<rect width="960" height="720" fill="url(#bg)"/>
<g stroke="#22d3ee" stroke-opacity=".12">${Array.from({length:12},(_,i)=>`<line x1="${i*90-60}" y1="720" x2="${480+(i-5.5)*20}" y2="560"/>`).join("")}${[570,600,640,690].map(y=>`<line x1="0" y1="${y}" x2="960" y2="${y}"/>`).join("")}</g>
<polygon points="390,500 570,500 640,150 320,150" fill="url(#hp)" stroke="#22d3ee" stroke-opacity=".6" filter="url(#gl)"/>
<g fill="none" stroke="#7dd3fc" stroke-width="2" filter="url(#gl)"><circle cx="480" cy="320" r="62"/><ellipse cx="480" cy="320" rx="62" ry="22"/><ellipse cx="480" cy="320" rx="22" ry="62"/><circle cx="480" cy="320" r="30"/></g>
<path d="M280 560v-60a200 56 0 0 1 400 0v60a200 56 0 0 1-400 0z" fill="url(#bs)" stroke="#5b6b7e"/>
<ellipse cx="480" cy="500" rx="200" ry="56" fill="#222c39" stroke="#5b6b7e"/>
<ellipse cx="480" cy="500" rx="170" ry="44" fill="none" stroke="#39ff88" stroke-width="5" filter="url(#gl)"/>
<ellipse cx="480" cy="500" rx="110" ry="26" fill="#0a1017" stroke="#22d3ee" stroke-opacity=".7"/>
<rect x="430" y="540" width="100" height="22" rx="5" fill="#06222c" stroke="#22d3ee"/><text x="480" y="556" fill="#22d3ee" font-size="12" text-anchor="middle" font-family="monospace">HOLO-X1</text>
<g fill="#8a98a8">${[300,330,630,660].map(x=>`<circle cx="${x}" cy="548" r="5"/>`).join("")}</g>
<g stroke="#ff8a3d" stroke-width="3">${[0,1,2,3].map(i=>`<line x1="${700}" y1="${520+i*10}" x2="${740}" y2="${520+i*10}"/>`).join("")}</g>
</svg>`;
    const im=new Image(); im.onload=()=>{ const c=document.createElement("canvas"); c.width=960;c.height=720; c.getContext("2d").drawImage(im,0,0); res(c.toDataURL("image/png")); };
    im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  });
}

/* ---------- Yuklash ---------- */
function fitImage(src){
  return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>{ const m=1600,s=Math.min(1,m/Math.max(im.width,im.height)); const c=document.createElement("canvas"); c.width=Math.round(im.width*s); c.height=Math.round(im.height*s); const x=c.getContext("2d"); x.fillStyle="#000"; x.fillRect(0,0,c.width,c.height); x.drawImage(im,0,0,c.width,c.height); res(c.toDataURL("image/jpeg",0.9)); }; im.onerror=()=>rej(new Error("Rasmni o'qib bo'lmadi")); im.src=src; });
}
async function loadFile(f){
  if(!f) return; S.fname=f.name||""; S.fname=f.name||""; if(!/^image\/(png|jpeg|webp)$/.test(f.type)){ toast("Faqat PNG, JPG yoki WEBP"); return; }
  const fr=new FileReader(); fr.onload=async()=>{ try{ setImage(await fitImage(fr.result)); }catch(e){ toast(e.message); } }; fr.readAsDataURL(f);
}
function setImage(d){
  S.img=d; $("#prevImg").src=d; $("#prep").hidden=false; $("#prepTitle").textContent="Rasm tayyor";
  $("#prepNote").textContent=S.aiOK?"Claude rasmni ko'rib tahlil qiladi: komponentlar, mexanizmlar va materiallarni o'zi aniqlaydi.":"DEMO rejimi: server/AI kaliti yo'q. Rasmga eng yaqin qurilma turini tanlang. Tahlil tayyor shablon asosida tuziladi, markerlarni rasmdagi joyiga sudrab qo'yishingiz mumkin.";
  $("#archBox").hidden=S.aiOK; $$("#steps li").forEach(l=>l.className=""); if(!S.aiOK){ hintGuess(); renderBuilder(); }
  $("#prep").scrollIntoView({behavior:"smooth",block:"start"});
}
let camStream=null;
async function openCam(){
  try{ camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}); const v=$("#video"); v.srcObject=camStream; v.hidden=false; $("#snap").hidden=false; }
  catch(e){ toast("Kameraga ruxsat yo'q yoki qurilma topilmadi. Rasm yuklashdan foydalaning."); }
}
function snap(){
  const v=$("#video"); if(!v.videoWidth) return; const c=document.createElement("canvas"); c.width=v.videoWidth; c.height=v.videoHeight; c.getContext("2d").drawImage(v,0,0);
  camStream&&camStream.getTracks().forEach(t=>t.stop()); v.hidden=true; $("#snap").hidden=true; fitImage(c.toDataURL("image/jpeg",0.9)).then(setImage);
}


/* ---------- Qurilma turi va komponentlarni belgilash (DEMO rejim) ---------- */
const GRPN={struct:"KORPUS / RAMKA",mech:"MEXANIKA",elec:"ELEKTRONIKA",ui:"KO'RSATISH / INTERFEYS",opt:"OPTIKA",proc:"SIRT ISHLOVI"};
function selectArch(k,manual){ S.arch=k; if(manual) S.archManual=true; if(ARCH[k]) S.kinds=new Map(ARCH[k].kinds); renderBuilder(); }
function renderBuilder(){
  $("#archPick").innerHTML=[...Object.keys(ARCH).map(k=>[k,ARCH[k].n]),["custom","Boshqa / o'zim yig'aman"]].map(([k,n])=>`<button class="chip${k===S.arch?" sel":""}" data-k="${k}">${esc(n)}</button>`).join("");
  $$("#archPick .chip").forEach(b=>b.onclick=()=>selectArch(b.dataset.k,true));
  $("#kindPick").innerHTML=Object.keys(GRPN).map(g=>{ const ks=Object.keys(LIB).filter(k=>LIB[k].grp===g); return ks.length?`<div class="kgrp"><b>${GRPN[g]}</b><div class="chips">${ks.map(k=>`<button class="chip${S.kinds.has(k)?" sel":""}" data-k="${k}">${esc(LIB[k].n.split("(")[0].trim())}</button>`).join("")}</div></div>`:""; }).join("")+`<p class="lab">Tanlangan komponentlar: <b>${S.kinds.size}</b></p>`;
  $$("#kindPick .chip").forEach(b=>b.onclick=()=>{ const k=b.dataset.k; if(S.kinds.has(k)) S.kinds.delete(k); else S.kinds.set(k,k==="fasteners"?12:1); renderBuilder(); });
}
function hintGuess(){
  const g=guessArch(($("#hint").value||"")+" "+S.fname); const n=$("#guessNote");
  if(g&&!S.archManual&&g!==S.arch){ selectArch(g,false); }
  n.textContent=g?("Kalit so'zlar bo'yicha taklif: "+ARCH[g].n+(S.archManual?" (siz tanlagan tur o'zgarmadi)":"")):"";
}

/* ---------- Tahlil ishga tushirish ---------- */
const STEPS=["Umumiy geometriya aniqlanmoqda","Mexanizmlar va harakatlanuvchi qismlar","Bo'g'inlar, tishli g'ildiraklar, motorlar","Elektronika, sensorlar va displeylar","Ramka, korpus va mahkamlagichlar","Materiallar va ishlab chiqarish murakkabligi","Taxminiy o'lchamlar va ichki komponentlar","Fantastika -> real texnologiya xaritalash"];
function dataToBlob(d){ const m=/^data:([^;]+);base64,(.+)$/.exec(d); const bin=atob(m[2]); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return new Blob([u],{type:m[1]}); }
function forgePrompt(hint){
  const catalog=Object.keys(LIB).map(k=>`- ${k}: ${LIB[k].n} (fantastik ko'rinishi: ${LIB[k].fic})`).join("\n");
  return `Siz ko'p tarmoqli muhandislik jamoasisiz: sanoat dizayneri, mexanik muhandis, elektronika muhandisi, ishlab chiqarish texnologi va maker.
Ilova qilingan rasm kino, o'yin, konsept-art yoki xayoldagi fantastik qurilma. AVVAL rasmda aynan nima tasvirlanganini aniqlang (\"identified_object\"): qurilma turi, asosiy qismlari. Faqat rasmda ko'ringan narsaga asoslaning, boshqa mahsulot o'ylab topmang. Keyin uni bugungi texnologiyalar bilan ishlab chiqarish mumkin bo'lgan real mahsulot konseptiga aylantiring.
Qoidalar:
- Rasmda ko'ringan qismlarni aniqlang; ichki komponentlarni mantiqiy taxmin qiling va buni "note" da ayting.
- "kind" faqat quyidagi ro'yxatdan (eng yaqinini tanlang).
- x, y: komponent markazining rasmdagi o'rni foizda (0-100; x chapdan, y tepadan).
- Imkonsiz texnologiyani "imkonsiz" demang: eng yaqin real texnologiya, hozirgi cheklov, kelajak yo'nalishi; status: current | modified | experimental | speculative.
- Mavjud bo'lmagan texnologiyani uydirmang. Matnlar o'zbek tilida (lotin), qisqa va aniq.
- Agar rasmda qurol bo'lsa: faqat funksiyasiz kosplay/rekvizit (yorug'lik/ovoz effektli, otish yoki kesish mexanizmisiz) sifatida konseptlang va buni risks da ayting.

Komponent turlari:
${catalog}
${hint?`\nFoydalanuvchi izohi: ${hint}\n`:""}
FAQAT bitta JSON obyekt qaytaring:
{"identified_object":str,"product_name":str,"archetype":"holo|arm|visor|core|drone|rover|scanner|exo|prop|generic","summary":str,"geometry":str,"dimensions_mm":{"w":num,"h":num,"d":num},"overall_complexity":"Past|O'rta|Yuqori|Juda yuqori",
"components":[{"kind":str,"label":str,"fiction":str,"qty":int,"x":num,"y":num,"note":str}],"mechanisms":[str],
"tech_alternatives":[{"fiction":str,"closest_real":str,"limitation":str,"future":str,"status":"current|modified|experimental|speculative"}],"risks":[str]}
8-16 ta komponent va 3-5 ta tech_alternatives bering.`;
}
async function analyze(){
  if(!S.img){ toast("Avval rasm yuklang"); return; }
  S.hint=$("#hint").value.trim(); if(!S.aiOK&&!S.kinds.size){ toast("Kamida bitta komponent belgilang"); return; } const btn=$("#analyze"); btn.disabled=true; $("#scan").classList.add("on");
  const ol=$("#steps"); ol.innerHTML=STEPS.map(s=>`<li>${s}</li>`).join(""); const li=$$("li",ol);
  let i=0; const tick=setInterval(()=>{ if(i>0) li[i-1].className="on"; if(i<li.length){ li[i].className="cur"; i++; } },520);
  let a=null;
  if(!S.sample && window.claude && window.claude.use){ await S.ready; }
  if(S.sample){
    try{ const j=await S.sample.json(forgePrompt(S.hint),{images:dataToBlob(S.img),modelTier:"default",cache:false}); a=fromAI(j); }
    catch(e){ toast("Claude tahlili ishlamadi ("+((e&&(e.code||e.message))||"xato")+"). "+(S.server?"Server orqali urinib ko'riladi.":"DEMO shablonga o'tildi.")); }
  }
  if(!a && S.server){
    try{
      const r=await fetch("/api/forge",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({image:S.img,hint:S.hint,kinds:Object.keys(LIB).map(k=>({k,n:LIB[k].n,g:LIB[k].fic}))})});
      const j=await r.json(); if(!r.ok) throw new Error(j.error||"Server xatosi"); a=fromAI(j);
    }catch(e){ toast("AI tahlil ishlamadi ("+e.message+"). DEMO shablonga o'tildi."); }
  }
  if(!a && !S.aiOK){ await new Promise(r=>setTimeout(r,STEPS.length*520)); }
  let vis=null; try{ vis=await segmentImage(S.img); }catch(e){}
  if(!a){ const custom=S.arch==="custom"; a=buildAnalysis(S.arch,{kinds:[...S.kinds],name:custom?"Maxsus qurilma":undefined,summary:(custom?"":ARCH[S.arch].desc+" ")+(S.hint?"Izoh: "+S.hint:(custom?"Foydalanuvchi belgilagan komponentlardan tuzilgan qurilma.":""))}); }
  if(a){ a.vis=vis; if(a.mode!=="ai"&&vis){ a.matchInfo=matchRegions(a.comps,vis)||null; } }
  clearInterval(tick); li.forEach(l=>l.className="on"); $("#scan").classList.remove("on"); btn.disabled=false;
  S.a=a; S.sel=a.comps[0].id; S.hidden=new Set(); S.view={yaw:32,pitch:18,zoom:1,explode:0,section:null}; S.tab="analysis";
  setTimeout(()=>{ $("#hero").hidden=true; $("#dash").hidden=false; $("#newBtn").hidden=false; setMode(); renderTabs(); window.scrollTo({top:0}); },500);
}
function fromAI(j){
  const clamp=v=>Math.max(3,Math.min(97,+v||50)); const byKind={};
  (j.components||[]).forEach((c,i)=>{ if(!LIB[c.kind]) return; if(byKind[c.kind]){ byKind[c.kind].qty+=Math.max(1,c.qty|0); return; }
    byKind[c.kind]={id:"c"+Object.keys(byKind).length,kind:c.kind,qty:Math.max(1,c.qty|0),label:String(c.label||LIB[c.kind].n),fiction:String(c.fiction||LIB[c.kind].fic),note:String(c.note||""),x:clamp(c.x),y:clamp(c.y)}; });
  const comps=Object.values(byKind); if(!comps.length) throw new Error("Komponent aniqlanmadi");
  const num=(v,def,lo,hi)=>{ v=parseFloat(v); return isFinite(v)?Math.min(hi,Math.max(lo,v)):def; };
  const d=j.dimensions_mm||{}; const arch=ARCH[j.archetype]?j.archetype:"generic";
  return {mode:"ai",identified:String(j.identified_object||""),arch,name:String(j.product_name||"Aniqlangan qurilma"),summary:String(j.summary||""),geometry:String(j.geometry||""),dims:[num(d.w,150,20,1000),num(d.h,150,20,1000),num(d.d,150,20,1000)],overall:CX.includes(j.overall_complexity)?j.overall_complexity:null,comps,
    alts:(Array.isArray(j.tech_alternatives)?j.tech_alternatives:[]).map(t=>({fic:String(t.fiction||"-"),real:String(t.closest_real||"-"),lim:String(t.limitation||"-"),fut:String(t.future||"-"),st:ST[t.status]?t.status:"experimental"})),risks:(Array.isArray(j.risks)&&j.risks.length?j.risks.map(String):defaultRisks(comps)),mechanisms:Array.isArray(j.mechanisms)?j.mechanisms.map(String):[]};
}
function setMode(){ const b=$("#modeBadge"); if(S.a&&S.a.mode==="ai"){ b.textContent="AI tahlil · Claude"; b.className="badge ai"; } else if(S.aiOK){ b.textContent="Claude AI tayyor"; b.className="badge ai"; } else { b.textContent="DEMO rejim"; b.className="badge"; } }

/* ---------- Tablar ---------- */
const TABS=[["analysis","AI TAHLIL"],["reality","REALITY KONVERSIYA"],["model","3D MODEL"],["materials","MATERIALLAR"],["machines","MASHINALAR"],["bom","BOM"],["electronics","ELEKTRONIKA"],["laser","LAZER"],["print","3D BOSMA"],["cost","NARX"],["mfg","ISHLAB CHIQARISH"],["report","HISOBOT"]];
function renderTabs(){
  S.addKind=null; $("#panel").classList.remove("addmode");
  $("#tabs").innerHTML=TABS.map(([k,n],i)=>`<button class="tab${S.tab===k?" on":""}" data-t="${k}" role="tab">${String(i+1).padStart(2,"0")} ${n}</button>`).join("");
  $$(".tab").forEach(b=>b.onclick=()=>{ S.tab=b.dataset.t; renderTabs(); });
  const p=$("#panel"); p.style.animation="none"; p.offsetHeight; p.style.animation="";
  RENDER[S.tab](p);
}
const RENDER={};
const cOf = id => S.a.comps.find(c=>c.id===id);

/* --- 1. AI TAHLIL --- */
RENDER.analysis=function(p){
  const a=S.a, ks=a.comps.map(c=>c.kind), cnt=(f)=>a.comps.filter(c=>f(c.kind)).reduce((s,c)=>s+c.qty,0);
  const dim=dimsOf(a).map(v=>Math.round(v)); const D=a.mode==="ai"?a.dims.map(Math.round):dim;
  const diff=difficulty(a); const overall=a.overall||CX[Math.max(...diff.map(d=>d.l))];
  const tiles=[["Geometriya",a.geometry||ARCH[a.arch]?.n||"Modulli qurilma"],["Mexanizmlar",(a.mechanisms.length||cnt(k=>LIB[k].grp==="mech"&&!["fasteners","cooling"].includes(k)))+" ta"],["Harakatlanuvchi qismlar",cnt(k=>["motor_servo","motor_stepper","gearbox","gear","joint","arm_link","gripper"].includes(k))+" ta"],["Bo'g'inlar",cnt(k=>["joint","arm_link"].includes(k))+" ta"],["Tishli g'ildiraklar",cnt(k=>["gear","gearbox"].includes(k))+" ta"],["Motorlar",cnt(k=>["motor_servo","motor_stepper"].includes(k))+" ta"],["Elektronika",cnt(k=>LIB[k].grp==="elec")+" blok"],["Sensorlar",cnt(k=>k==="sensor")+" guruh"],["Displeylar / yoritish",cnt(k=>["display_oled","holo_screen","led_ring","core_light","lens_visor"].includes(k))+" ta"],["Ramka / korpus",cnt(k=>LIB[k].grp==="struct")+" ta"],["Mahkamlagichlar",ks.includes("fasteners")?a.comps.find(c=>c.kind==="fasteners").qty+" dona":"-"],["Materiallar",uniq(ks.map(k=>LIB[k].mk)).filter(m=>m!=="elec").length+" xil"],["Murakkablik",overall],["Taxminiy gabarit",D.join(" × ")+" mm"],["Ichki komponentlar",a.comps.length+" ta"],["Ishlab chiqarish",pipeline(a).filter(x=>x.on).length+" bosqich"]];
  p.innerHTML=`
  <div class="card"><h2 style="margin:0 0 4px">${esc(a.name)}</h2><p class="mut" style="margin:0">${esc(a.summary)}</p>${a.mode==="demo"?`<p class="mut" style="margin:8px 0 0;font-size:.82rem">⚠ DEMO tahlil (AI emas). Rasm kompyuter ko'rishi bilan rang va shakl bo'yicha ${a.vis?a.vis.regions.length:0} ta bo'lakka ajratildi; ${a.matchInfo?`${a.matchInfo.seen} ta komponent aniq bo'lakka bog'landi, ${a.matchInfo.inferred} tasi ichki (taxminiy)`:"komponentlar taxminiy joylashtirildi"}. Mahsulot turi va komponent nomlari sizning tanlovingiz (${esc(ARCH[a.arch]?ARCH[a.arch].n:"Maxsus")}) asosida; noto'g'ri bo'lsa, markerni bosib turini o'zgartiring yoki yangisini qo'shing. Rasmni haqiqiy tushunish uchun Claude AI rejimi kerak.</p>`:`<p style="margin:8px 0 0;color:var(--gr);font-size:.82rem">✔ Rasm Claude tomonidan ko'rilib tahlil qilingan.</p>${a.identified?`<div class="ident"><b>AI rasmda ko'rdi:</b> ${esc(a.identified)}</div>`:""}`}</div>
  <div class="anagrid" id="anaGrid">
    <div><div class="stage" id="stage"><img src="${S.img}" alt=""><svg id="lines" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></svg><div class="pinlayer" id="pins"></div></div>
      <div class="regtog">${a.vis?`<label><input type="checkbox" id="regChk" ${S.showReg?"checked":""}> Rasmdan ajratilgan bo'laklar (${a.vis.regions.length})</label>`:""}<span>Qattiq marker = rasmdagi bo'lak · punktir = ichki (taxminiy)</span></div><p class="mut" style="font-size:.78rem">Markerni bosing, tafsilot ochiladi. Sudrab joyini o'zgartiring.</p></div>
    <div><div class="card" id="detail"></div><div class="complist" style="margin-top:10px" id="clist"></div></div>
  </div>
  <h3>ANIQLANGAN ELEMENTLAR</h3><div class="grid g4">${tiles.map(([k,v])=>`<div class="stat"><small>${k}</small><b style="font-size:.95rem">${esc(v)}</b></div>`).join("")}</div>
  <h3>KERAKLI STANOKLAR · ANIMATSION MODELLAR</h3><div class="mstrip">${mach(a).slice(0,8).map(m=>machineCard(m,a)).join("")}</div><div class="row"><button class="btn sm" id="gom">Barcha stanoklar va ustaxona darajalari →</button></div>
  <h3>MUHANDISLIK QIYINLIK KO'RSATKICHLARI</h3><div class="grid g2">${diff.map(d=>`<div class="card"><div style="display:flex;justify-content:space-between;gap:8px"><b>${d.n}</b>${lvPill(d.l)}</div><div class="meter"><i style="width:${(d.l+1)*25}%"></i></div><small class="mut">${esc(d.why)}</small></div>`).join("")}</div>`;
  const chk=$("#regChk"); if(chk) chk.onchange=()=>{ S.showReg=chk.checked; drawPins(); };
  $("#stage").onclick=e=>{ if(!S.addKind||e.target.closest(".pin,.callout")) return; const r=$("#stage").getBoundingClientRect(); const L=LIB[S.addKind]; const c={id:"c"+Date.now(),kind:S.addKind,qty:1,label:L.n,fiction:L.fic,note:"Qo'lda qo'shildi",x:+((e.clientX-r.left)/r.width*100).toFixed(1),y:+((e.clientY-r.top)/r.height*100).toFixed(1),seen:true}; S.a.comps.push(c); S.sel=c.id; S.addKind=null; $("#anaGrid").parentElement.classList.remove("addmode"); toast("Komponent qo'shildi"); RENDER.analysis($("#panel")); };
  drawPins(); drawList(); drawDetail(); $("#gom").onclick=()=>{ S.tab="machines"; renderTabs(); };
};
function drawPins(){
  const a=S.a, layer=$("#pins"); if(!layer) return;
  layer.innerHTML=a.comps.map((c,i)=>`<div class="pin${c.id===S.sel?" sel":""}${c.seen===false?" inf":""}" data-id="${c.id}" style="left:${c.x}%;top:${c.y}%" title="${esc(LIB[c.kind].n)}">${i+1}</div>`).join("");
  // chiqarish chiziqlari va yozuvlari (chap/o'ng chetga)
  const L=[],R=[]; a.comps.forEach((c,i)=>(c.x<50?L:R).push({c,i}));
  const place=arr=>{ arr.sort((p,q)=>p.c.y-q.c.y); let last=-9; arr.forEach(o=>{ o.ly=Math.max(o.c.y,last+5.2); last=o.ly; }); };
  place(L);place(R);
  const narrow=($("#stage").clientWidth||800)<600;
  let svg="",lab=""; [[L,2],[R,98]].forEach(([arr,ex])=>arr.forEach(o=>{ svg+=`<polyline points="${o.c.x},${o.c.y} ${ex},${o.ly} ${ex<50?0:100},${o.ly}" fill="none" stroke="${o.c.id===S.sel?"#ff8a3d":"#22d3ee"}" stroke-opacity=".7" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="4 3"/>`;
    lab+=`<div class="callout" data-id="${o.c.id}" style="position:absolute;top:${o.ly}%;${ex<50?"left:0":"right:0"};transform:translateY(-50%);font:700 .62rem var(--mono);background:rgba(4,8,12,.85);color:${o.c.id===S.sel?"#ff8a3d":"#7dd3fc"};padding:1px 5px;border:1px solid rgba(34,211,238,.35);border-radius:3px;cursor:pointer;max-width:42%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${o.i+1}${narrow?"":" "+esc(LIB[o.c.kind].n.split("(")[0].trim())}</div>`; }));
  let rg=""; if(a.vis&&S.showReg){ const sc=cOf(S.sel); rg=a.vis.regions.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none" stroke="#39ff88" stroke-opacity=".4" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="3 2"/>`).join("")+(sc&&sc.box?`<rect x="${sc.box[0]}" y="${sc.box[1]}" width="${sc.box[2]}" height="${sc.box[3]}" fill="rgba(255,138,61,.12)" stroke="#ff8a3d" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`:""); }
  $("#lines").innerHTML=rg+svg; layer.insertAdjacentHTML("beforeend",lab);
  $$(".callout",layer).forEach(el=>el.onclick=()=>selectComp(el.dataset.id));
  $$(".pin",layer).forEach(el=>{
    el.onpointerdown=e=>{ e.preventDefault(); const id=el.dataset.id, st=$("#stage").getBoundingClientRect(); let moved=false; el.setPointerCapture(e.pointerId);
      el.onpointermove=ev=>{ moved=true; const c=cOf(id); c.x=Math.max(2,Math.min(98,(ev.clientX-st.left)/st.width*100)); c.y=Math.max(2,Math.min(98,(ev.clientY-st.top)/st.height*100)); el.style.left=c.x+"%"; el.style.top=c.y+"%"; };
      el.onpointerup=()=>{ el.onpointermove=el.onpointerup=null; if(moved) drawPins(); selectComp(id); }; };
  });
}
function selectComp(id){ S.sel=id; if(S.tab==="analysis"){ drawPins(); drawList(); drawDetail(); } else if(S.tab==="model"){ draw3D(); drawModelList(); drawModelDetail(); } }
function drawList(){ const el=$("#clist"); if(!el) return; el.innerHTML=S.a.comps.map((c,i)=>`<div class="compitem${c.id===S.sel?" sel":""}" data-id="${c.id}"><b>${String(i+1).padStart(2,"0")}</b><span style="flex:1">${esc(LIB[c.kind].n)}${c.qty>1?` ×${c.qty}`:""}</span>${stPill(LIB[c.kind].st)}</div>`).join(""); $$(".compitem",el).forEach(x=>x.onclick=()=>selectComp(x.dataset.id)); }
function detailHTML(c){
  const L=LIB[c.kind], M=MATS[L.mk];
  return `<h3 style="margin-top:0">${esc(L.n)}${c.qty>1?` ×${c.qty}`:""}</h3>${stPill(L.st)} ${lvPill(L.cx)}
  <div class="chain"><div class="f"><small>FANTASTIK DIZAYN</small>${esc(c.fiction)}${c.label&&c.label!==L.n?` (${esc(c.label)})`:""}</div><div class="arrow">▼</div>
  <div><small>REAL TEXNOLOGIYA</small>${esc(L.n)}</div><div><small>ISHLAB CHIQARISH USULI</small>${esc(L.method)}</div><div><small>KERAKLI MASHINA</small>${esc(L.mach.join(", ")||"Tayyor sotib olinadi")}</div><div><small>MATERIAL</small>${esc(M.n)}</div>
  <div class="l"><small>NEGA SHUNDAY</small>${esc(L.why)}</div></div>${c.note?`<p class="mut" style="font-size:.82rem">AI izohi: ${esc(c.note)}</p>`:""}`;
}
function drawDetail(){
  const el=$("#detail"); if(!el) return; const c=cOf(S.sel); el.innerHTML=detailHTML(c)+`<div class="edit"><label>Turi: <select id="kSel">${Object.keys(LIB).map(k=>`<option value="${k}"${k===c.kind?" selected":""}>${esc(LIB[k].n)}</option>`).join("")}</select></label><button class="btn sm" id="kDel">🗑 O'chirish</button></div><div class="edit"><label>Yangi komponent: <select id="kAdd">${Object.keys(LIB).filter(k=>!LIB[k].nogeo).map(k=>`<option value="${k}">${esc(LIB[k].n)}</option>`).join("")}</select></label><button class="btn sm" id="kAddBtn">＋ Rasmga qo'yish</button></div>`;
  $("#kSel").onchange=e=>{ const L=LIB[e.target.value]; c.kind=e.target.value; c.label=L.n; c.fiction=L.fic; RENDER.analysis($("#panel")); };
  $("#kDel").onclick=()=>{ if(S.a.comps.length<2){ toast("Kamida bitta komponent qolishi kerak"); return; } S.a.comps=S.a.comps.filter(x=>x.id!==c.id); S.sel=S.a.comps[0].id; RENDER.analysis($("#panel")); };
  $("#kAddBtn").onclick=()=>{ S.addKind=$("#kAdd").value; $("#anaGrid").parentElement.classList.add("addmode"); toast("Rasmda komponent turgan joyni bosing"); };
}

/* --- 2. REALITY --- */
RENDER.reality=function(p){
  const a=S.a;
  p.innerHTML=`<p class="mut">Har bir fantastik komponent bugungi texnologiya bilan qanday yasalishi. Chap: kino/o'yin dizayni → o'rta: real texnologiya va usul → o'ng: mashina, material, murakkablik.</p>`+
  a.comps.map(c=>{ const L=LIB[c.kind],M=MATS[L.mk]; return `<div class="rcard"><div><h5>FANTASTIK DIZAYN</h5><b>${esc(c.label||L.n)}</b><br>${esc(c.fiction)}</div><div class="ar">→</div><div><h5>REAL TEXNOLOGIYA → USUL</h5><b>${esc(L.n)}</b><br>${esc(L.method)}<br><div style="margin-top:6px">${stPill(L.st)}</div><small class="mut">${esc(L.why)}</small></div><div class="ar">→</div><div><h5>MASHINA</h5>${esc(L.mach.join(" · ")||"Tayyor sotib olinadi")}<h5 style="margin-top:6px">MATERIAL</h5>${esc(M.n)}<h5 style="margin-top:6px">MURAKKABLIK</h5>${lvPill(L.cx)}</div></div>`; }).join("")+
  `<h3>TEXNOLOGIYA MUQOBILLARI: KINO → REAL</h3><div class="grid g2">${a.alts.map(t=>{ const real=t.st==="current"||t.st==="modified"; return `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px">${pill(real?"REAL TEXNOLOGIYA":(t.st==="experimental"?"EKSPERIMENTAL":"SPEKULYATIV"),ST[t.st].c)}${stPill(t.st)}</div><div class="chain"><div class="f"><small>KINO TEXNOLOGIYASI</small>${esc(t.fic)}</div><div class="arrow">▼</div><div><small>ENG YAQIN MAVJUD TEXNOLOGIYA</small>${esc(t.real)}</div><div class="f" style="border-color:var(--rd)"><small>HOZIRGI CHEKLOV</small>${esc(t.lim)}</div><div class="l"><small>KELAJAK YO'NALISHI</small>${esc(t.fut)}</div></div></div>`; }).join("")}</div>`;
};

/* --- 3. 3D MODEL / CAD --- */
let raf=0, dirty=true;
RENDER.model=function(p){
  const a=S.a;
  p.innerHTML=`<div class="view3d"><div><canvas id="cv" width="960" height="600"></canvas>
    <div class="row"><button class="btn primary sm" id="b3d">▶ 3D kontseptni yaratish</button><button class="btn sm" id="bexp">Portlatilgan ko'rinish</button><button class="btn sm" id="bdraw">Ishlab chiqarish chizmasi</button><button class="btn ghost sm" id="breset">Ko'rinishni tiklash</button></div>
    <div class="row"><span class="mut" style="font-size:.78rem">Eksport:</span><button class="btn sm" data-x="stl">STL</button><button class="btn sm" data-x="step">STEP (parametrik spetsifikatsiya)</button><button class="btn sm" data-x="dxf">DXF</button><button class="btn sm" data-x="svg">SVG</button><button class="btn sm" data-x="3mf">3MF</button></div></div>
    <div class="card ctl"><label>Portlatish <input type="range" id="rExp" min="0" max="100" value="${S.view.explode*100}"></label><label>Kesim (section) <input type="range" id="rSec" min="-100" max="100" value="${S.view.section==null?100:S.view.section}"><span id="secLbl"></span></label><label>Masshtab <input type="range" id="rZoom" min="50" max="250" value="${S.view.zoom*100}"></label>
    <b style="color:var(--cy);font-size:.8rem">KOMPONENTLAR</b><div class="complist" id="mlist" style="max-height:220px"></div><div id="mdetail" style="font-size:.8rem"></div></div></div>
    <div id="drawBox" ${S.drawing?"":"hidden"}></div>
    <h3>CAD KONSEPT: KO'RINISHLAR</h3><div class="views" id="views"></div>
    <p class="mut" style="font-size:.8rem">Model parametrik konsept: komponentlar soddalashtirilgan primitivlar (quti/silindr) bilan ko'rsatilgan. STEP o'rniga parametrik CAD spetsifikatsiya beriladi (to'liq STEP/CAD detallash muhandis ishi).</p>`;
  const cv=$("#cv");
  const fit=()=>{ const W=cv.parentElement.clientWidth||800, ratio=W<560?1:0.625, dpr=Math.min(2,window.devicePixelRatio||1); cv.style.height=Math.round(W*ratio)+"px"; cv.width=Math.round(W*dpr); cv.height=Math.round(W*ratio*dpr); };
  fit(); window._fit=fit;
  const reqDraw=()=>{ dirty=true; if(!raf) raf=requestAnimationFrame(()=>{ raf=0; if(dirty){ dirty=false; draw3D(); } }); };
  window._req=reqDraw;
  let drag=null,moved=0;
  cv.onpointerdown=e=>{ cv.setPointerCapture(e.pointerId); drag={x:e.clientX,y:e.clientY}; moved=0; cv.style.cursor="grabbing"; };
  cv.onpointermove=e=>{ if(!drag) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; moved+=Math.abs(dx)+Math.abs(dy); drag={x:e.clientX,y:e.clientY}; S.view.yaw+=dx*0.5; S.view.pitch=Math.max(-85,Math.min(85,S.view.pitch+dy*0.4)); reqDraw(); };
  cv.onpointerup=e=>{ cv.style.cursor="grab"; if(drag&&moved<5){ const r=cv.getBoundingClientRect(); pick((e.clientX-r.left)/r.width*cv.width,(e.clientY-r.top)/r.height*cv.height); } drag=null; };
  cv.onwheel=e=>{ e.preventDefault(); S.view.zoom=Math.max(.5,Math.min(2.5,S.view.zoom*(e.deltaY<0?1.08:0.92))); $("#rZoom").value=S.view.zoom*100; reqDraw(); };
  $("#rExp").oninput=e=>{ S.view.explode=e.target.value/100; reqDraw(); renderViews(); };
  $("#rSec").oninput=e=>{ const v=+e.target.value; S.view.section=v>=100?null:v*0.9; $("#secLbl").textContent=v>=100?" (o'chiq)":" z ≤ "+Math.round(S.view.section)+" mm"; reqDraw(); renderViews(); };
  $("#rZoom").oninput=e=>{ S.view.zoom=e.target.value/100; reqDraw(); };
  $("#b3d").onclick=()=>animateAssemble(); $("#bexp").onclick=()=>{ const to=S.view.explode>0.3?0:0.9; tween(S.view.explode,to,700,v=>{ S.view.explode=v; $("#rExp").value=v*100; reqDraw(); },renderViews); };
  $("#bdraw").onclick=()=>{ S.drawing=!S.drawing; $("#drawBox").hidden=!S.drawing; $("#drawBox").innerHTML=S.drawing?`<h3>ISHLAB CHIQARISH CHIZMASI</h3><div class="drawing">${drawingSVG(S.a)}</div>`:""; };
  $("#breset").onclick=()=>{ S.view={yaw:32,pitch:18,zoom:1,explode:0,section:null}; RENDER.model($("#panel")); };
  $$("[data-x]").forEach(b=>b.onclick=()=>exportModel(b.dataset.x));
  if(S.drawing){ $("#drawBox").innerHTML=`<h3>ISHLAB CHIQARISH CHIZMASI</h3><div class="drawing">${drawingSVG(S.a)}</div>`; }
  drawModelList(); drawModelDetail(); renderViews(); draw3D();
};
function tween(a,b,ms,fn,done){ const t0=performance.now(); const step=t=>{ const k=Math.min(1,(t-t0)/ms), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; fn(a+(b-a)*e); if(k<1) requestAnimationFrame(step); else done&&done(); }; requestAnimationFrame(step); }
function animateAssemble(){ tween(1.2,0,1600,v=>{ S.view.explode=v; $("#rExp").value=v*100; window._req&&window._req(); },renderViews); }
function draw3D(){ const cv=$("#cv"); if(!cv) return; const ctx=cv.getContext("2d"); const polys=render(S.a,{...S.view,sectionZ:S.view.section,w:cv.width,h:cv.height,hidden:S.hidden,sel:S.sel}); S._polys=polys; paintCanvas(ctx,polys,cv.width,cv.height);
  ctx.fillStyle="rgba(34,211,238,.7)"; ctx.font=Math.round(cv.width/80)+"px ui-monospace,monospace"; ctx.fillText("FUTURE FORGE · konsept model",14,cv.height-12); }
function pick(x,y){ const polys=S._polys||[]; for(let i=polys.length-1;i>=0;i--){ const q=polys[i].pts; let inside=false; for(let a=0,b=q.length-1;a<q.length;b=a++){ if(((q[a][1]>y)!==(q[b][1]>y)) && (x<(q[b][0]-q[a][0])*(y-q[a][1])/(q[b][1]-q[a][1])+q[a][0])) inside=!inside; } if(inside){ selectComp(polys[i].cid); return; } } }
function drawModelList(){ const el=$("#mlist"); if(!el) return; el.innerHTML=S.a.comps.filter(c=>!LIB[c.kind].nogeo).map(c=>`<div class="compitem${c.id===S.sel?" sel":""}" data-id="${c.id}"><input type="checkbox" ${S.hidden.has(c.id)?"":"checked"} data-v="${c.id}" style="width:auto;margin:0" aria-label="Ko'rsatish"><span style="flex:1">${esc(LIB[c.kind].n)}</span></div>`).join("");
  $$(".compitem",el).forEach(x=>x.onclick=e=>{ if(e.target.dataset.v) return; selectComp(x.dataset.id); }); $$("[data-v]",el).forEach(cb=>cb.onchange=()=>{ cb.checked?S.hidden.delete(cb.dataset.v):S.hidden.add(cb.dataset.v); window._req(); renderViews(); }); }
function drawModelDetail(){ const el=$("#mdetail"); if(!el) return; const c=cOf(S.sel), L=LIB[c.kind]; el.innerHTML=`<b style="color:var(--tx)">${esc(L.n)}</b><br>${esc(MATS[L.mk].n)} · ${esc(L.method)}`; }
function renderViews(){
  const el=$("#views"); if(!el) return; const a=S.a, o={ortho:true,w:300,h:220,zoom:.8,hidden:S.hidden,sel:null};
  const V=[["OLDIDAN",{yaw:0,pitch:0}],["YONIDAN",{yaw:90,pitch:0}],["USTIDAN",{yaw:0,pitch:90}],["KESIM (z=0)",{yaw:0,pitch:0,sectionZ:0}],["PORTLATILGAN",{yaw:32,pitch:18,ortho:false,explode:.9}]];
  el.innerHTML=V.map(([n,v])=>`<div class="vbox">${paintSVG(render(a,{...o,...v}),300,220,{bg:"#04070b"})}<small>${n}</small></div>`).join("");
}
function exportModel(t){
  const a=S.a, n=slug();
  if(t==="stl") saveFile(n+".stl",stlText(a,null,n),"model/stl");
  else if(t==="3mf") saveFile(n+".3mf",threeMF(a));
  else if(t==="step") saveFile(n+"-parametrik-cad-spec.json",paramSpec(a),"application/json");
  else if(t==="dxf") saveFile(n+"-chizma.dxf",dxfDrawing(a),"application/dxf");
  else if(t==="svg") saveFile(n+"-chizma.svg",drawingSVG(a),"image/svg+xml");
}

/* --- 4. MATERIALLAR --- */
RENDER.materials=function(p){
  const a=S.a, used=new Set(a.comps.map(c=>LIB[c.kind].mk));
  p.innerHTML=`<div class="tw"><table><tr><th>Komponent</th><th>Material</th><th>Xossalari</th><th>Sabab</th><th>Usul</th><th>Muqobil material</th></tr>${a.comps.map(c=>{ const L=LIB[c.kind],M=MATS[L.mk]; return `<tr><td>${esc(L.n)}</td><td><b>${esc(M.n)}</b></td><td>${esc(M.props)}</td><td>${esc(L.why)}</td><td>${esc(L.method)}</td><td>${esc(L.alt)}</td></tr>`; }).join("")}</table></div>
  <h3>MATERIALLAR BAZASI</h3><div class="grid auto">${Object.entries(MATS).map(([k,M])=>`<div class="mach" ${used.has(k)?'style="border-color:var(--gr)"':""}>${used.has(k)?'<span class="cat" style="color:var(--gr)">BU LOYIHADA ISHLATILADI</span>':'<span class="cat">QO\'SHIMCHA</span>'}<b>${esc(M.n)}</b><p>${esc(M.props)}</p><p><b style="display:inline">Qayerda:</b> ${esc(M.use)}</p><p><b style="display:inline">Usul:</b> ${esc(M.how)}</p><p><b style="display:inline">Muqobil:</b> ${esc(M.alt)}</p></div>`).join("")}</div>`;
};

/* --- 5. MASHINALAR (animatsion modellar) --- */
function machineCard(m,a){
  const used=a.comps.filter(c=>LIB[c.kind].mach.includes(m)).map(c=>LIB[c.kind].n.split("(")[0].trim());
  return `<div class="mcard">${machineSVG(m)}<span class="cat"><i class="run"></i>${MACH[m]}</span><b>${esc(m)}</b><p>${esc(MACH_INFO[m])}</p><p class="use"><b style="display:inline">Bu loyihada:</b> ${esc(used.join(", ")||"yordamchi asbob")}</p></div>`;
}
function animsPause(root,on){ $$("svg.manim",root).forEach(s=>{ try{ on?s.pauseAnimations():s.unpauseAnimations(); }catch(e){} }); }
RENDER.machines=function(p){
  const a=S.a, ms=mach(a), cats=["LASER","CNC","3D","ELEKTRONIKA","FABRIKATSIYA","SIRT ISHLOVI"], fit=tierFit(a);
  p.innerHTML=`<div class="row" style="justify-content:space-between"><h3 style="margin:0">ISHLAB CHIQARISH SEXI · ANIMATSION STANOKLAR</h3><button class="btn sm" id="mpause">⏸ Animatsiyani to'xtatish</button></div><p class="mut">Faqat yuklangan qurilmaga tegishli ${ms.length} ta stanok/asbob. Har bir model ish jarayonini ko'rsatadi.</p>`+
  cats.map(cat=>{ const list=ms.filter(m=>MACH[m]===cat); return list.length?`<h3>${cat}</h3><div class="grid auto">${list.map(m=>machineCard(m,a)).join("")}</div>`:""; }).join("")+
  `<h3>O'ZIM YASAYMAN: USTAXONA DARAJALARI</h3><div class="grid g3">${Object.values(fit).map(t=>`<div class="tier"><b>${esc(t.n)}</b><div class="meter"><i style="width:${t.pct}%"></i></div><div class="pill ${t.pct>=80?"lv0":t.pct>=50?"lv2":"lv3"}">${t.pct}% qismlar o'zingizda yasaladi</div><p class="mut" style="font-size:.8rem">${esc(t.note)}</p>${t.miss.length?`<p style="font-size:.8rem"><b>Tashqaridan buyurtma / sotib olish:</b><br>${t.miss.map(esc).join(", ")}</p>`:'<p style="font-size:.8rem;color:var(--gr)">Hammasini shu darajada yasash mumkin.</p>'}</div>`).join("")}</div>
  <p class="mut" style="font-size:.8rem">PCB va ba'zi metall detallar odatda servisga (JLCPCB, PCBWay, mahalliy CNC ustaxona) buyurtma qilinadi: bu kichik ustaxona uchun ham normal yo'l.</p>`;
  let paused=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches; animsPause(p,paused); $("#mpause").textContent=paused?"▶ Animatsiyani yoqish":"⏸ Animatsiyani to'xtatish";
  $("#mpause").onclick=()=>{ paused=!paused; animsPause(p,paused); $("#mpause").textContent=paused?"▶ Animatsiyani yoqish":"⏸ Animatsiyani to'xtatish"; };
};

/* --- 6. BOM --- */
RENDER.bom=function(p){
  const rows=bomRows(S.a), tot=rows.reduce((s,r)=>s+r.cost,0);
  p.innerHTML=`<div class="row"><button class="btn primary sm" id="xl">⬇ Excel BOM (.xlsx)</button><button class="btn sm" id="csv">CSV</button><span class="mut" style="font-size:.8rem">Narxlar taxminiy prototip narxlari (${cfg.cur}).</span></div>
  <div class="tw bom"><table><tr><th>#</th><th>Detal</th><th class="n">Soni</th><th>Material</th><th>Ishlab chiqarish usuli</th><th>Mashina</th><th>Turi</th><th>Qiyinlik</th><th class="n">Taxminiy narx</th></tr>${rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.part)}</b></td><td class="n">${r.qty}</td><td>${esc(r.mat)}</td><td>${esc(r.method)}</td><td>${esc(r.machine)}</td><td>${pill(r.mfg,/sotib/i.test(r.mfg)?"#22d3ee":"#ff8a3d")}</td><td>${r.diff}</td><td class="n">${money(r.cost)}</td></tr>`).join("")}<tr><td colspan="8" class="n"><b>JAMI (faqat detallar, mehnatsiz)</b></td><td class="n"><b>${money(tot)}</b></td></tr></table></div>`;
  $("#xl").onclick=()=>saveFile(slug()+"-BOM.xlsx",bomXLSX());
  $("#csv").onclick=()=>saveFile(slug()+"-BOM.csv","﻿"+[["Detal","Soni","Material","Usul","Mashina","Turi","Qiyinlik","Narx (USD)"],...rows.map(r=>[r.part,r.qty,r.mat,r.method,r.machine,r.mfg,r.diff,rnd(r.cost,2)])].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n"),"text/csv;charset=utf-8");
};
function bomXLSX(){ const rows=bomRows(S.a), cm=costModel(S.a);
  return makeXLSX([{name:"BOM",rows:[["Detal","Soni","Material","Ishlab chiqarish usuli","Mashina","Turi","Qiyinlik","Taxminiy narx (USD)"],...rows.map(r=>[r.part,r.qty,r.mat,r.method,r.machine,r.mfg,r.diff,rnd(r.cost,2)]),["JAMI","","","","","","",rnd(rows.reduce((s,r)=>s+r.cost,0),2)]]},
    {name:"Narx",rows:[["Kategoriya","Prototip (USD)","10 dona (dona, USD)","100 dona (dona, USD)","1000 dona (dona, USD)"],...CATS.map(([k,n])=>[n,rnd(cm.scale[1].per[k],2),rnd(cm.scale[10].per[k],2),rnd(cm.scale[100].per[k],2),rnd(cm.scale[1000].per[k],2)]),["Jami dona narxi",rnd(cm.scale[1].unit,2),rnd(cm.scale[10].unit,2),rnd(cm.scale[100].unit,2),rnd(cm.scale[1000].unit,2)],["Taxminiy! AI-generated; professional verification required.","","","",""]]}]); }

/* --- 7. ELEKTRONIKA + DASTUR --- */
RENDER.electronics=function(p){
  const bl=electronics(S.a), sw=software(S.a);
  const bw=150,gap=46, W=bl.length*(bw+gap)-gap+40;
  const svg=`<svg viewBox="0 0 ${W} 140" xmlns="http://www.w3.org/2000/svg" font-family="ui-monospace,monospace"><g class="flow">${bl.map((b,i)=>i?`<line x1="${20+i*(bw+gap)-gap+2}" y1="70" x2="${20+i*(bw+gap)-2}" y2="70" stroke="#39ff88" stroke-width="2"/>`:"").join("")}</g>${bl.map((b,i)=>`<g transform="translate(${20+i*(bw+gap)},30)"><rect width="${bw}" height="80" rx="10" fill="#08131b" stroke="#22d3ee"/><text x="${bw/2}" y="34" fill="#22d3ee" font-size="13" font-weight="700" text-anchor="middle">${esc(b.n.toUpperCase())}</text><text x="${bw/2}" y="56" fill="#7f93a7" font-size="10" text-anchor="middle">${b.items.length} komponent</text></g>`).join("")}</svg>`;
  p.innerHTML=`<h3 style="margin-top:0">ELEKTRONIKA BLOK-SXEMASI</h3><div class="diag">${svg}</div><div class="grid auto" style="margin-top:12px">${bl.map(b=>`<div class="card"><b style="color:var(--cy)">${esc(b.n)}</b><ul style="margin:6px 0 0;padding-left:18px;color:var(--tx);font-size:.84rem">${b.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>
  <p class="mut" style="font-size:.8rem">Faqat bugun mavjud komponentlar tavsiya qilingan. Aniq nominallar (tok, kuchlanish) sxemotexnik tomonidan hisoblanishi kerak.</p>`+
  (sw?`<h3>DASTURIY ARXITEKTURA</h3><div class="diag"><svg viewBox="0 0 900 230" font-family="ui-monospace,monospace"><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4 0 8z" fill="#39ff88"/></marker></defs>
    ${[["FIRMWARE","ESP32",20,80],["BLE / Wi-Fi","aloqa",210,80],["MOBIL ILOVA","Flutter / RN",400,20],["MQTT BROKER","Mosquitto",400,140],["REST API","server",600,140],["VEB-DASHBOARD","telemetriya",760,80]].map(([t,s,x,y])=>`<g transform="translate(${x},${y})"><rect width="${t==="VEB-DASHBOARD"?130:150}" height="66" rx="10" fill="#08131b" stroke="#22d3ee"/><text x="${t==="VEB-DASHBOARD"?65:75}" y="28" fill="#22d3ee" font-size="12" font-weight="700" text-anchor="middle">${t}</text><text x="${t==="VEB-DASHBOARD"?65:75}" y="48" fill="#7f93a7" font-size="10" text-anchor="middle">${s}</text></g>`).join("")}
    <g class="flow" stroke="#39ff88" stroke-width="2" fill="none" marker-end="url(#ah)"><line x1="170" y1="113" x2="208" y2="113"/><path d="M360 100 L400 65"/><path d="M360 126 L400 165"/><line x1="550" y1="173" x2="598" y2="173"/><path d="M750 160 L770 146"/></g></svg></div>
    <div class="grid auto" style="margin-top:12px">${sw.map(b=>`<div class="card"><b style="color:var(--cy)">${esc(b.n)}</b><ul style="margin:6px 0 0;padding-left:18px;font-size:.84rem">${b.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>`:"");
};

/* --- 8. LAZER --- */
RENDER.laser=function(p){
  const a=S.a, shapes=laserShapes(a), L=S.laser;
  if(!shapes.length){ p.innerHTML=`<div class="card">Bu qurilmada lazer bilan kesiladigan detal aniqlanmadi.</div>`; return; }
  const sheets=nest(shapes,L.sw,L.sh);
  p.innerHTML=`<div class="row"><label class="mut">Lazer turi <select id="lt"><option value="co2">CO2</option><option value="diode">Diod</option><option value="fiber">Fiber</option></select></label><label class="mut">Kerf (mm) <input id="kerf" type="number" step="0.05" min="0" max="1" value="${L.kerf}" style="width:80px"></label><label class="mut">List (mm) <input id="sw" type="number" value="${L.sw}" style="width:80px"> × <input id="sh" type="number" value="${L.sh}" style="width:80px"></label></div>
  <div class="legend"><span style="color:#ff3b3b"><i style="background:#ff0000"></i>CUT (kesish)</span><span style="color:#5b7bff"><i style="background:#0000ff"></i>ENGRAVE (gravyura)</span></div>
  <div class="tw"><table><tr><th>Detal</th><th class="n">Soni</th><th>Material</th><th class="n">Qalinlik</th><th>Hajm</th></tr>${shapes.map(s=>`<tr><td>${esc(s.name)}</td><td class="n">${s.qty||1}</td><td>${esc(MATS[s.mat].n)}</td><td class="n">${s.thk} mm</td><td>${s.type==="disc"?`Ø${s.r*2} mm`:`${s.w} × ${s.h} mm`}</td></tr>`).join("")}</table></div>
  ${sheets.map((sh,i)=>{ const pr=laserParams(sh.mat,sh.thk,L.type); return `<h3>LIST ${i+1}: ${esc(MATS[sh.mat].n)} ${sh.thk} mm <small class="mut">· joylashuv (nesting) ${sh.util}% ishlatilgan</small></h3>
   <div class="sheet" data-i="${i}">${laserSVG(sh,L.kerf)}</div>
   <div class="grid g2" style="margin-top:8px"><div class="card"><b>Tavsiya etilgan sozlamalar (${L.type.toUpperCase()})</b>${pr&&pr.cut?`<p style="margin:6px 0 0"><b>CUT:</b> quvvat ${esc(pr.cut[0])} · tezlik ${esc(pr.cut[1])} ${/mm\/min/.test(pr.cut[1])?"":"mm/s"} · o'tishlar ${esc(pr.cut[2])}</p>`:`<p style="margin:6px 0 0;color:var(--or)">Bu lazer turi ushbu materialni kesmaydi/tavsiya etilmaydi. Boshqa lazer turini tanlang.</p>`}${pr&&pr.eng?`<p style="margin:4px 0 0"><b>ENGRAVE:</b> quvvat ${esc(pr.eng[0])} · tezlik ${esc(pr.eng[1])} · o'tishlar ${esc(pr.eng[2])}</p>`:""}<p class="mut" style="font-size:.76rem;margin:6px 0 0">Boshlang'ich qiymatlar: har doim chiqindi material bilan sinab, mashinangizga moslang. Kerf kompensatsiyasi ${L.kerf} mm hisobga olingan.</p></div>
   <div class="card"><b>Eksport</b><div class="row"><button class="btn sm" data-e="svg" data-i="${i}">SVG</button><button class="btn sm" data-e="dxf" data-i="${i}">DXF</button><button class="btn sm" data-e="png" data-i="${i}">PNG</button></div><p class="mut" style="font-size:.76rem;margin:0">DXF/SVG da CUT va ENGRAVE alohida qatlamlarda (qizil/ko'k).</p></div></div>`; }).join("")}`;
  $("#lt").value=L.type;
  const re=()=>RENDER.laser($("#panel"));
  $("#lt").onchange=e=>{ L.type=e.target.value; re(); }; $("#kerf").onchange=e=>{ L.kerf=Math.max(0,+e.target.value||0); re(); }; $("#sw").onchange=e=>{ L.sw=Math.max(100,+e.target.value||600); re(); }; $("#sh").onchange=e=>{ L.sh=Math.max(100,+e.target.value||400); re(); };
  $$("[data-e]").forEach(b=>b.onclick=()=>laserExport(b.dataset.e,sheets[+b.dataset.i],+b.dataset.i));
};
function laserExport(t,sh,i){
  const n=slug()+"-lazer-list"+(i+1);
  if(t==="svg") saveFile(n+".svg",laserSVG(sh,S.laser.kerf,false),"image/svg+xml");
  else if(t==="dxf") saveFile(n+".dxf",laserDXF(sh,S.laser.kerf),"application/dxf");
  else { const svg=laserSVG(sh,S.laser.kerf,true).replace("<svg ",'<svg style="background:#fff" '); const im=new Image(); im.onload=()=>{ const sc=4,c=document.createElement("canvas"); c.width=sh.w*sc; c.height=sh.h*sc; const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,c.width,c.height); x.drawImage(im,0,0,c.width,c.height); c.toBlob(b=>saveFile(n+".png",b),"image/png"); }; im.onerror=()=>toast("PNG yaratib bo'lmadi"); im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/,`width="${sh.w*4}" height="${sh.h*4}"`)); }
}

/* --- 9. 3D BOSMA --- */
RENDER.print=function(p){
  const rows=printRows(S.a);
  if(!rows.length){ p.innerHTML=`<div class="card">Bu qurilmada 3D bosma bilan tayyorlanadigan detal aniqlanmadi.</div>`; return; }
  p.innerHTML=`<div class="row"><button class="btn primary sm" data-p="stl">Hammasi STL</button><button class="btn sm" data-p="3mf">Hammasi 3MF</button><span class="mut" style="font-size:.8rem">Eksport qilinadigan shakl konsept primitivlari: haqiqiy CAD detali bilan almashtiring.</span></div>
  <div class="tw"><table><tr><th>Detal</th><th>Material</th><th class="n">Soplo</th><th class="n">Qatlam</th><th class="n">To'ldirish</th><th class="n">Devor</th><th>Support</th><th>Yo'nalish</th><th class="n">Vaqt (~)</th><th>Eksport</th></tr>${rows.map(r=>`<tr><td><b>${esc(r.L.n)}</b>${r.c.qty>1?` ×${r.c.qty}`:""}</td><td>${esc(MATS[r.L.mk].n)}</td><td class="n">${r.P.nozzle} mm</td><td class="n">${r.P.layer} mm</td><td class="n">${r.P.infill}%</td><td class="n">${r.P.walls}</td><td>${esc(r.P.support)}</td><td>${esc(r.P.orient)}</td><td class="n">${rnd(r.hrs,1)} soat</td><td><button class="btn sm" data-p="stl" data-c="${r.c.id}">STL</button> <button class="btn sm" data-p="3mf" data-c="${r.c.id}">3MF</button></td></tr>`).join("")}<tr><td colspan="8" class="n"><b>Jami bosma vaqti (taxminiy)</b></td><td class="n"><b>${rnd(rows.reduce((s,r)=>s+r.hrs,0),1)} soat</b></td><td></td></tr></table></div>
  <p class="mut" style="font-size:.8rem">Vaqt hajm, to'ldirish va oqim tezligidan taxminiy hisoblangan; slicer (Cura/PrusaSlicer) aniq natija beradi.</p>`;
  $$("[data-p]").forEach(b=>b.onclick=()=>{ const cid=b.dataset.c||null, n=slug()+(cid?"-"+LIB[cOf(cid).kind].n.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g,""):""); b.dataset.p==="stl"?saveFile(n+".stl",stlText(S.a,cid,n),"model/stl"):saveFile(n+".3mf",threeMF(S.a,cid)); });
};

/* --- 10. NARX --- */
RENDER.cost=function(p){
  const cm=costModel(S.a), N=[1,10,100,1000], tot=cm.scale[1].unit;
  p.innerHTML=`<div class="card"><div class="row"><label class="mut">Valyuta <select id="cur2"><option>USD</option><option>UZS</option><option>EUR</option></select></label><label class="mut">1 USD = <input id="rUZS" type="number" value="${cfg.rates.UZS}" style="width:90px"> so'm</label><label class="mut">1 USD = <input id="rEUR" type="number" step="0.01" value="${cfg.rates.EUR}" style="width:70px"> EUR</label></div>
  <p style="margin:0;color:var(--or);font-size:.85rem">⚠ Barcha narxlar TAXMINIY (aniqlik taxminan −30% / +60%). Mintaqa, yetkazib beruvchi va hajmga qarab keskin farq qiladi. Valyuta kurslarini o'zingiz kiriting.</p></div>
  <h3>NARX TAHLILI (DONA NARXI)</h3><div class="tw"><table><tr><th>Kategoriya</th>${N.map(n=>`<th class="n">${n===1?"Prototip":n+" dona"}</th>`).join("")}</tr>${CATS.map(([k,n])=>`<tr><td>${n}</td>${N.map(x=>`<td class="n">${money(cm.scale[x].per[k])}</td>`).join("")}</tr>`).join("")}<tr><td><b>Dona narxi</b></td>${N.map(x=>`<td class="n"><b>${money(cm.scale[x].unit)}</b></td>`).join("")}</tr><tr><td>Qolip/moslama (bir martalik, taxminiy)</td>${N.map(x=>`<td class="n">${money(cm.scale[x].nre)}</td>`).join("")}</tr><tr><td><b>JAMI partiya</b></td>${N.map(x=>`<td class="n"><b>${money(cm.scale[x].total)}</b></td>`).join("")}</tr></table></div>
  <h3>PROTOTIP XARAJATI TARKIBI</h3><div class="bars">${CATS.map(([k,n])=>`<div class="br"><span>${n}</span><div class="bar"><i style="width:${rnd(cm.base[k]/tot*100)}%"></i></div><span class="n" style="font-family:var(--mono)">${money(cm.base[k])}</span></div>`).join("")}</div>
  <p class="mut" style="font-size:.8rem">Mehnat: ~${rnd(cm.hrs)} soat × $18/soat (taxminiy). Ommaviy ishlab chiqarishda qolip (injection molding) va avtomatlashtirish xarajati alohida hisoblanishi kerak.</p>`;
  $("#cur2").value=cfg.cur; const re=()=>{ $("#cur").value=cfg.cur; RENDER.cost($("#panel")); };
  $("#cur2").onchange=e=>{ cfg.cur=e.target.value; re(); }; $("#rUZS").onchange=e=>{ cfg.rates.UZS=+e.target.value||12700; re(); }; $("#rEUR").onchange=e=>{ cfg.rates.EUR=+e.target.value||0.92; re(); };
};

/* --- 11. ISHLAB CHIQARISH --- */
RENDER.mfg=function(p){
  const pl=pipeline(S.a); let day=0;
  p.innerHTML=`<h3 style="margin-top:0">ISHLAB CHIQARISH KETMA-KETLIGI</h3><div class="pipe">${pl.map((s,i)=>{ if(s.on) day+=s.days; return `<div class="pnode${s.on?"":" off"}"><div class="pnum">${String(i+1).padStart(2,"0")}</div><div class="pbody"><b><span>${esc(s.n)}</span><small>${s.on?`~${s.days} kun`:"bu loyihada kerak emas"}</small></b><small>${esc(s.d)}</small></div></div>`; }).join("")}</div>
  <div class="stat" style="max-width:340px"><small>Prototipgacha taxminiy jami (ketma-ket)</small><b>~${day} ish kuni</b></div>
  <h3>MAHSULOT ISHLAB CHIQISH YO'L XARITASI</h3><div class="road">${ROAD.map((r,i)=>`<div class="rstep"><i>${i+1}</i><b>${r}</b><small>${ROAD_D[i]}</small></div>`).join("")}</div>`;
};

/* --- 12. HISOBOT --- */
RENDER.report=function(p){
  const secs=reportData(S.a);
  p.innerHTML=`<div class="row"><button class="btn primary" id="rpdf">⬇ PDF</button><button class="btn" id="rdoc">⬇ DOCX</button><button class="btn" id="rxl">⬇ Excel BOM</button><button class="btn ghost" id="rprint">Chop etish</button></div>
  <div class="card" style="border-color:var(--or)"><b>⚠</b> AI-generated engineering concepts require professional verification before fabrication or use.</div>
  <div class="rep" style="margin-top:10px">${secs.map(s=>`<h4>${esc(s.h)}</h4>${s.p.map(esc).join("\n")}`).join("\n")}</div>`;
  const t=S.a.name+" - Muhandislik hisoboti";
  $("#rpdf").onclick=()=>saveFile(slug()+"-hisobot.pdf",makePDF("FUTURE FORGE AI - "+t,secs));
  $("#rdoc").onclick=()=>saveFile(slug()+"-hisobot.docx",makeDOCX(t,secs,[["Detal","Soni","Material","Usul","Mashina","Turi","Narx (USD)"],...bomRows(S.a).map(r=>[r.part,String(r.qty),r.mat,r.method,r.machine,r.mfg,String(rnd(r.cost,2))])]));
  $("#rxl").onclick=()=>saveFile(slug()+"-BOM.xlsx",bomXLSX());
  $("#rprint").onclick=()=>{ try{ window.print(); }catch(e){ toast("Chop etish bu muhitda mavjud emas. PDF yuklab oling."); } };
};

/* ---------- Boshlash ---------- */
function init(){
  renderBuilder(); let ht=0; $("#hint").addEventListener("input",()=>{ clearTimeout(ht); ht=setTimeout(hintGuess,300); });
  $("#pick").onclick=()=>$("#file").click(); $("#file").onchange=e=>{ loadFile(e.target.files[0]); };
  const d=$("#drop"); ["dragenter","dragover"].forEach(ev=>d.addEventListener(ev,e=>{ e.preventDefault(); d.classList.add("over"); })); ["dragleave","drop"].forEach(ev=>d.addEventListener(ev,e=>{ e.preventDefault(); d.classList.remove("over"); })); d.addEventListener("drop",e=>loadFile(e.dataTransfer.files[0]));
  d.addEventListener("keydown",e=>{ if(e.key==="Enter") $("#file").click(); });
  $("#cam").onclick=openCam; $("#snap").onclick=snap;
  $("#sample").onclick=async()=>{ S.fname=""; S.archManual=true; selectArch("holo",true); setImage(await sampleImage()); };
  $("#analyze").onclick=analyze;
  $("#cur").onchange=e=>{ cfg.cur=e.target.value; if(S.a) RENDER[S.tab]($("#panel")); };
  $("#newBtn").onclick=()=>{ $("#file").value=""; $("#dash").hidden=true; $("#hero").hidden=false; $("#newBtn").hidden=true; S.a=null; $("#prep").hidden=true; setMode(); window.scrollTo({top:0}); };
  fetch("/api/status").then(r=>r.ok?r.json():null).then(j=>{ if(j&&j.ai){ S.server=true; S.aiOK=true; setMode(); } }).catch(()=>{});
  if(window.claude&&window.claude.use){ S.ready=new Promise(res=>{ const fin=()=>res(); setTimeout(fin,11000); window.claude.use("sample").then(async s=>{ if(s){ const l=await s.limits().catch(()=>null); if(l&&l.images){ S.sample=s; S.aiOK=true; setMode(); if(S.img) setImage(S.img); } } fin(); }).catch(fin); }); }
}
let rz=0; window.addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(()=>{ if(!S.a) return; if(S.tab==="model"&&window._fit){ window._fit(); draw3D(); } else if(S.tab==="analysis"){ drawPins(); } },150); });
init();
