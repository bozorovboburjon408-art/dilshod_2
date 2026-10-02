'use strict';
/* FUTURE FORGE AI: hisob-kitob, 3D dvigatel, eksport */

const LOT = new Set(["fasteners","finish","cable"]);
const rnd = (n,d=0)=>{const k=10**d;return Math.round(n*k)/k;};
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uniq = a => [...new Set(a)];

/* ---------- Tahlil obyektini qurish ---------- */
function buildAnalysis(archKey, opts={}){
  const A = ARCH[archKey] || (opts.kinds?{n:"Maxsus qurilma",desc:"Foydalanuvchi belgilagan komponentlardan tuzilgan qurilma.",dims:[160,120,160],alts:[],kinds:[]}:ARCH.holo);
  const kl = (opts.kinds||A.kinds).filter(([k])=>LIB[k]);
  const comps = kl.map(([kind,qty],i)=>{
    const m = (opts.markers||{})[kind];
    return {id:"c"+i, kind, qty, label:LIB[kind].n, fiction:LIB[kind].fic, note:"", ...autoMarker(i,kl.length,archKey,kind,m)};
  });
  return {mode:opts.mode||"demo", arch:ARCH[archKey]?archKey:"generic", name:opts.name||A.n, summary:opts.summary||A.desc, geometry:opts.geometry||"", dims:opts.dims||A.dims.slice(),
    overall:opts.overall||null, comps, alts:opts.alts||(A.alts||[]).map(a=>({fic:a.fic, real:a.real, lim:a.lim, fut:a.fut, st:a.st})), risks:opts.risks||defaultRisks(comps), mechanisms:opts.mechanisms||[]};
}
const HOLO_MARK = {housing_led:[50,80], frame_sheet:[30,86], motor_stepper:[50,74], gearbox:[56,68], bearing:[44,70], pcb:[34,76], mcu:[40,79], sensor:[63,79], battery:[27,78], power:[70,77], holo_screen:[50,30], led_ring:[50,66], cooling:[74,82], ui_panel:[50,92], fasteners:[20,92], finish:[82,56]};
function autoMarker(i,n,arch,kind,m){
  if(m) return {x:m[0],y:m[1]};
  if(arch==="holo" && HOLO_MARK[kind]) return {x:HOLO_MARK[kind][0], y:HOLO_MARK[kind][1]};
  const a = -Math.PI/2 + i/n*Math.PI*2;
  return {x:rnd(50+32*Math.cos(a),1), y:rnd(50+34*Math.sin(a),1)};
}
function defaultRisks(comps){
  const r=["Barcha raqamlar taxminiy: aniq o'lchamlar, yuklama va xavfsizlik hisoblari professional muhandis tomonidan tekshirilishi shart."];
  const kinds = comps.map(c=>c.kind);
  if(kinds.includes("battery")) r.push("Li-ion batareya: BMS, himoya sxemasi va xavfsiz joylashtirish shart (qisqa tutashuv, qizish, yong'in xavfi).");
  if(kinds.includes("holo_screen")) r.push("'Gologramma' real 3D emas: ko'rish burchagi va yorqinlik cheklangan bo'ladi.");
  if(kinds.some(k=>["motor_servo","motor_stepper","arm_link","joint"].includes(k))) r.push("Harakatlanuvchi qismlar: qisish/kesish xavfi; himoya qopqoqlari va favqulodda to'xtatish kerak.");
  if(kinds.includes("core_light")) r.push("'Energiya yadrosi' faqat vizual effekt; real energiya batareyadan olinadi.");
  if(kinds.includes("lens_visor")) r.push("Ko'zga yaqin yorug'lik manbalari: ko'z xavfsizligi me'yorlariga rioya qiling.");
  if(kinds.includes("rotor")) r.push("Aylanuvchi parraklar jarohat xavfi: himoya halqalari, xavfsiz sinov joyi va mahalliy dron qonunlariga rioya qiling.");
  if(kinds.includes("light_tube")) r.push("Yorug' tayoq faqat rekvizit/namoyish buyumi: haqiqiy energiya yoki kesuvchi funksiya yo'q va qo'shilmasligi kerak.");
  if(kinds.includes("wheel")) r.push("Harakatlanuvchi platforma: to'qnashuv sensori va favqulodda to'xtatish tugmasi tavsiya etiladi.");
  r.push("Sertifikatsiya (CE/FCC, batareya xavfsizligi) kichik seriya oldidan talab etilishi mumkin.");
  return r;
}
const mach = a => uniq(a.comps.flatMap(c=>LIB[c.kind].mach));
const hasElec = a => a.comps.some(c=>LIB[c.kind].grp==="elec");
function lineCost(c){ const L=LIB[c.kind]; return LOT.has(c.kind)? L.cost : L.cost*c.qty; }

/* ---------- BOM ---------- */
function bomRows(a, cur){
  return a.comps.map(c=>{const L=LIB[c.kind]; return {part:L.n, qty:c.qty, mat:MATS[L.mk].n, method:L.method, machine:L.mach.length?L.mach.join(", "):"-", mfg:L.mfg, diff:CX[L.cx], cost:lineCost(c), cid:c.id};});
}

/* ---------- Narx ---------- */
const CATS = [["materials","Materiallar"],["electronics","Elektronika"],["mechanical","Mexanik komponentlar"],["machining","Mexanik ishlov (CNC)"],["print","3D bosma"],["laser","Lazer kesish"],["assembly","Elektronika yig'ish"],["finishing","Sirt ishlovi"],["labor","Mehnat"]];
const BUY = new Set(["materials","electronics","mechanical"]);
const FAB_F = {1:1,10:0.6,100:0.35,1000:0.2}, BUY_F = {1:1,10:0.85,100:0.65,1000:0.5};
function costModel(a){
  const base = {}; CATS.forEach(([k])=>base[k]=0);
  let hrs = 0;
  a.comps.forEach(c=>{ const L=LIB[c.kind]; base[L.cat]+=lineCost(c); hrs += (L.hrs||0)*(LOT.has(c.kind)?1:Math.min(c.qty,3)); });
  hrs += 4 + 3; // yig'ish + sinov
  base.labor = hrs*18;
  const out = {};
  [1,10,100,1000].forEach(n=>{
    const per = {}; let unit=0;
    CATS.forEach(([k])=>{ per[k] = base[k]*(BUY.has(k)?BUY_F[n]:FAB_F[n]); unit+=per[k]; });
    const nre = n===1 ? 0 : (n===10? 150 : n===100? 900 : 6000); // moslama/qolip xarajati (taxminiy)
    out[n] = {per, unit, total: unit*n + nre, nre};
  });
  return {base, hrs, scale:out};
}
const CUR = {USD:{r:1,s:"$"}, UZS:{r:12700,s:"so'm"}, EUR:{r:0.92,s:"€"}};
const cfg = {cur:"USD", rates:{USD:1,UZS:12700,EUR:0.92}};
function money(usd){ const v = usd*cfg.rates[cfg.cur]; const d = cfg.cur==="UZS"?0:(v<100?2:0); const t = v.toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d}); return cfg.cur==="USD"?"$"+t : cfg.cur==="EUR"? t+" €" : t+" so'm"; }

/* ---------- Qiyinlik ko'rsatkichlari ---------- */
function difficulty(a){
  const ks = a.comps.map(c=>c.kind), has = k=>ks.includes(k), cnt = g=>a.comps.filter(c=>LIB[c.kind].grp===g).length;
  const lvl = n => n<=1?0:n<=3?1:n<=5?2:3;
  const mechN = a.comps.filter(c=>["mech"].includes(LIB[c.kind].grp)&&!["fasteners","cooling"].includes(c.kind)).length;
  const elecN = cnt("elec");
  const maxCx = Math.max(...a.comps.map(c=>LIB[c.kind].cx));
  const mats = uniq(a.comps.map(c=>LIB[c.kind].mk)).filter(m=>m!=="elec");
  const hard = mats.filter(m=>["cf","ss304","pc","al6061"].includes(m)).length;
  const ms = mach(a); const heavy = ms.filter(m=>["CNC frezer (mill)","CNC tokarlik (lathe)","Fiber lazer","Bukish mashinasi (press brake)","Sanoat 3D printeri (SLS/MJF/metall)","Termoformovka stansiyasi"].includes(m)).length;
  const sw = has("mcu") ? (has("sensor")||has("holo_screen")||has("display_oled") ? 2 : 1) : 0;
  const swLvl = has("lens_visor") ? 3 : sw;
  const items = [
   ["Mexanik murakkablik", lvl(mechN+ (has("joint")?2:0)), mechN? `${mechN} ta harakatlanuvchi/uzatma elementi (motor, reduktor, podshipnik, bo'g'in). Moslik va yuk hisoblari kerak.`:"Harakatlanuvchi qismlar kam."],
   ["Elektronika murakkabligi", lvl(elecN+(has("pcb")?1:0)), `${elecN} ta elektron blok${has("pcb")?", maxsus PCB":""}. Quvvat, aloqa va sensorlar integratsiyasi.`],
   ["Dasturiy murakkablik", swLvl, has("mcu")?"Firmware, sensor/aktuator boshqaruvi va telefon ilovasi/BLE aloqasi.":"Dastur deyarli kerak emas."],
   ["Ishlab chiqarish murakkabligi", Math.min(3, Math.max(maxCx, lvl(heavy+1))), `Eng murakkab qism darajasi: ${CX[maxCx]}. Ko'p turli texnologiyani (${ms.map(m=>MACH[m]).filter((v,i,x)=>x.indexOf(v)===i).join(", ")||"-"}) birlashtirish talab etiladi.`],
   ["Material qiyinligi", lvl(hard+1), hard? "Alyuminiy/polikarbonat/uglerod kabi ishlov talab qiladigan materiallar bor.":"Asosan oson ishlanadigan materiallar (akril, PETG)."],
   ["Kerakli uskunalar", lvl(Math.ceil(ms.length/3)), `${ms.length} xil uskuna/asbob kerak (jami ro'yxat "Mashinalar" bo'limida).`],
   ["Prototip qiyinligi", Math.min(3, Math.max(0, maxCx-(a.comps.some(c=>LIB[c.kind].st==="experimental")?0:1)+ (a.comps.some(c=>LIB[c.kind].st==="experimental")?1:0))), a.comps.some(c=>LIB[c.kind].st==="experimental")?"Eksperimental qism bor: bir necha takrorlash sikli kerak bo'ladi.":"Tayyor modullar bilan funksional prototipni tez yig'ish mumkin."]
  ];
  return items.map(([n,l,why])=>({n,l,why}));
}

/* ---------- Pipeline ---------- */
function pipeline(a){
  const s = {mach:mach(a), hasElec:hasElec(a)};
  return PIPE.map(p=>({...p, on:p.need(s), days:Math.max(1,Math.round(p.days*(1+0.3*Math.max(...a.comps.map(c=>LIB[c.kind].cx)))))}));
}

/* ---------- Ustaxona darajasi ---------- */
function tierFit(a){
  const res={};
  Object.entries(TIERS).forEach(([k,t])=>{
    const ok=[], miss=[];
    a.comps.filter(c=>LIB[c.kind].mach.length).forEach(c=>{
      const L=LIB[c.kind]; const fit = L.mach.some(m=>t.list.includes(m));
      (fit?ok:miss).push(L.n);
    });
    const total = ok.length+miss.length;
    res[k]={n:t.n, note:t.note, ok, miss, pct: total? Math.round(ok.length/total*100):100};
  });
  return res;
}

/* ---------- Elektronika arxitekturasi ---------- */
function electronics(a){
  const ks=a.comps.map(c=>c.kind), has=k=>ks.includes(k);
  const blocks=[];
  blocks.push({k:"power", n:"Quvvat", items:[has("battery")&&"Li-ion 18650 3S/2S blok", has("power")&&"BMS (3S 20A) + DC-DC (buck 5V/3.3V)", "Asosiy o'chirgich + saqlagich"].filter(Boolean)});
  if(has("mcu")) blocks.push({k:"ctrl", n:"Kontroller", items:[ks.includes("arm_link")||has("motor_servo")?"STM32G4 (motor boshqaruvi) yoki ESP32-S3":"ESP32-S3 (Wi-Fi/BLE)","Ixtiyoriy: Raspberry Pi Zero 2 W (kompyuter ko'rish uchun)"]});
  if(has("sensor")) blocks.push({k:"sens", n:"Sensorlar", items:["IMU: MPU6050 / BNO055","Masofa: VL53L0X (ToF)","Harorat/namlik: BME280", has("motor_servo")||has("motor_stepper")?"Enkoder / Hall sensor":null].filter(Boolean)});
  const act=[];
  if(has("motor_stepper")) act.push("NEMA17 + TMC2209 drayver");
  if(has("motor_servo")) act.push("Servo (DS3218) yoki BLDC + ESC/SimpleFOC");
  if(has("led_ring")||has("core_light")) act.push("WS2812B LED (MOSFET orqali quvvat)");
  if(has("cooling")) act.push("5V fan (MOSFET IRLZ44N bilan PWM)");
  if(has("battery")) act.push("Rele/MOSFET yuk kaliti");
  if(act.length) blocks.push({k:"act", n:"Aktuatorlar", items:act});
  if(has("mcu")) blocks.push({k:"comm", n:"Aloqa", items:["Bluetooth LE (telefon bilan)","Wi-Fi (MQTT / REST)","Ixtiyoriy: LoRa (uzoq masofa)"]});
  const disp=[]; if(has("display_oled")) disp.push("OLED SSD1306 / TFT ST7789"); if(has("holo_screen")) disp.push("Proyektor yoki shaffof ekran (HDMI/MIPI)"); if(has("led_ring")) disp.push("LED indikatsiya"); if(has("ui_panel")) disp.push("Tugmalar/enkoder paneli");
  if(disp.length) blocks.push({k:"disp", n:"Ko'rsatish", items:disp});
  return blocks;
}
function software(a){
  const ks=a.comps.map(c=>c.kind);
  if(!ks.includes("mcu")) return null;
  return [
   {n:"Firmware", items:["ESP32 (Arduino / ESP-IDF / PlatformIO)","Sensor va aktuator drayverlari","Holat mashinasi, xavfsizlik taymerlari"]},
   {n:"Mobil ilova", items:["Flutter / React Native","BLE orqali ulanish va sozlash","Firmware yangilash (OTA)"]},
   {n:"Aloqa qatlami", items:["Bluetooth LE (yaqin)","Wi-Fi + MQTT (Mosquitto broker)","REST API (sozlamalar va telemetriya)"]},
   {n:"Veb-dashboard", items:["Telemetriya grafiklari","Qurilmalar ro'yxati va holat","Foydalanuvchi va ruxsatlar"]}
  ];
}

/* ---------- 3D: instansiyalar ---------- */
function instances(a){
  const lay = LAYOUT[a.arch] || {};
  const out=[]; let auto=0;
  a.comps.forEach(c=>{
    const L=LIB[c.kind]; if(L.nogeo) return;
    let g = lay[c.kind];
    if(!g){ const i=auto++; g=["b",20,12,16,-50+(i%4)*34,8,-60-Math.floor(i/4)*26]; }
    const [sh,sx,sy,sz,px,py,pz,rep]=g;
    (rep||[[0,0,0]]).forEach((o,j)=>out.push({cid:c.id, kind:c.kind, sh, sx, sy, sz, rot:o[3]||0, c:[px+o[0],py+o[1],pz+o[2]], color:L.color, emis:!!L.emis, glass:["housing_led","holo_screen","lens_visor","optics"].includes(c.kind)}));
  });
  return out;
}
function meshOf(ins, off=[0,0,0]){
  const cx=ins.c[0]+off[0], cy=ins.c[1]+off[1], cz=ins.c[2]+off[2];
  const rot=(ins.rot||0)*Math.PI/180, cr=Math.cos(rot), sr=Math.sin(rot);
  const T=p=>[p[0]*cr+p[2]*sr+cx, p[1]+cy, -p[0]*sr+p[2]*cr+cz];
  const P=[];
  if(ins.sh==="b"){
    const x=ins.sx/2,y=ins.sy/2,z=ins.sz/2;
    const v=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]].map(T);
    [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]].forEach(f=>P.push(f.map(i=>v[i])));
  } else if(ins.sh==="r"){
    const N=22, ro=ins.sx, ri=ins.sz, h=ins.sy/2, ot=[],ob=[],it=[],ib=[];
    for(let i=0;i<N;i++){ const t=i/N*Math.PI*2, co=Math.cos(t), si=Math.sin(t); ot.push(T([ro*co,h,ro*si])); ob.push(T([ro*co,-h,ro*si])); it.push(T([ri*co,h,ri*si])); ib.push(T([ri*co,-h,ri*si])); }
    for(let i=0;i<N;i++){ const j=(i+1)%N; P.push([ob[i],ob[j],ot[j],ot[i]]); P.push([it[i],it[j],ib[j],ib[i]]); P.push([ot[i],ot[j],it[j],it[i]]); P.push([ib[i],ib[j],ob[j],ob[i]]); }
  } else {
    const N=18, r=ins.sx, h=ins.sy/2, top=[], bot=[], ax=ins.sh; // c: Y o'qi, x: X o'qi, z: Z o'qi
    const mp=(a,b,t)=> ax==="x"? [t,a,b] : ax==="z"? [a,b,t] : [a,t,b];
    for(let i=0;i<N;i++){ const t=i/N*Math.PI*2, a=r*Math.cos(t), b=r*Math.sin(t); top.push(T(mp(a,b,h))); bot.push(T(mp(a,b,-h))); }
    for(let i=0;i<N;i++){ const j=(i+1)%N; P.push([bot[i],bot[j],top[j],top[i]]); }
    P.push(top.slice().reverse()); P.push(bot.slice());
  }
  return P;
}
const _bc=new WeakMap();
function bounds(a){
  if(_bc.has(a)) return _bc.get(a);
  const mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  instances(a).forEach(i=>meshOf(i).forEach(p=>p.forEach(v=>{ for(let k=0;k<3;k++){ mn[k]=Math.min(mn[k],v[k]); mx[k]=Math.max(mx[k],v[k]); } })));
  const r = mn[0]>mx[0] ? {mn:[0,0,0],mx:[1,1,1]} : {mn,mx}; _bc.set(a,r); return r;
}
function center(a){ const b=bounds(a); return [0,1,2].map(k=>(b.mn[k]+b.mx[k])/2); }

/* ---------- 3D: proyeksiya va chizish ---------- */
function clipPoly(poly, axis, val, keepLE){
  const out=[]; const f=p=>keepLE? p[axis]<=val : p[axis]>=val;
  for(let i=0;i<poly.length;i++){
    const A=poly[i],B=poly[(i+1)%poly.length],fa=f(A),fb=f(B);
    if(fa) out.push(A);
    if(fa!==fb){ const t=(val-A[axis])/(B[axis]-A[axis]); out.push([A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t]); }
  }
  return out;
}
function render(a, o){
  const {yaw=30,pitch=20,ortho=false,w=800,h=500,zoom=1,explode=0,hidden=new Set(),sel=null,sectionZ=null,ghost=false}=o;
  const cosY=Math.cos(yaw*Math.PI/180), sinY=Math.sin(yaw*Math.PI/180), cosP=Math.cos(pitch*Math.PI/180), sinP=Math.sin(pitch*Math.PI/180);
  const C=center(a), D=900, scale=(Math.min(w,h)/(Math.max(...[0,1,2].map(k=>bounds(a).mx[k]-bounds(a).mn[k]))*(1.3+explode*0.7)))*zoom;
  const tr=p=>{ let x=p[0]*cosY+p[2]*sinY, z=-p[0]*sinY+p[2]*cosY, y=p[1]; const y2=y*cosP-z*sinP, z2=y*sinP+z*cosP; return [x,y2,z2]; };
  const cc = tr(C);
  const polys=[]; const L=[0.35,0.8,0.5]; const ll=Math.hypot(...L);
  instances(a).forEach(ins=>{
    if(hidden.has(ins.cid)) return;
    const off = explode? [ (ins.c[0]-C[0])*explode*0.9, (ins.c[1]-C[1])*explode*1.3, (ins.c[2]-C[2])*explode*0.9 ] : [0,0,0];
    meshOf(ins,off).forEach(poly=>{
      if(sectionZ!=null){ poly=clipPoly(poly,2,sectionZ,true); if(poly.length<3) return; }
      const t=poly.map(tr);
      const e1=[t[1][0]-t[0][0],t[1][1]-t[0][1],t[1][2]-t[0][2]], e2=[t[2][0]-t[0][0],t[2][1]-t[0][1],t[2][2]-t[0][2]];
      let n=[e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]]; const nl=Math.hypot(...n)||1; n=n.map(v=>v/nl);
      const lit=Math.max(0.15,(n[0]*L[0]+n[1]*L[1]+n[2]*L[2])/ll);
      const pts=t.map(p=>{ const s=ortho?1:D/(D-(p[2]-cc[2])); return [w/2+(p[0]-cc[0])*scale*s, h/2-(p[1]-cc[1])*scale*s]; });
      const depth=t.reduce((s,p)=>s+p[2],0)/t.length;
      polys.push({pts, depth, lit, cid:ins.cid, color:ins.color, emis:ins.emis, glass:ins.glass, sel:ins.cid===sel});
    });
  });
  polys.sort((p,q)=>p.depth-q.depth);
  return polys;
}
function shade(hex,k){ const n=parseInt(hex.slice(1),16); const r=Math.min(255,Math.round(((n>>16)&255)*k)), g=Math.min(255,Math.round(((n>>8)&255)*k)), b=Math.min(255,Math.round((n&255)*k)); return `rgb(${r},${g},${b})`; }
function paintCanvas(ctx, polys, w, h, opts={}){
  ctx.clearRect(0,0,w,h);
  polys.forEach(p=>{
    ctx.beginPath(); p.pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.closePath();
    const alpha = p.glass?0.35:(p.sel?1:0.92);
    ctx.globalAlpha=alpha; ctx.fillStyle=p.emis?shade(p.color,0.7+p.lit*0.6):shade(p.color,0.35+p.lit*0.85); ctx.fill();
    ctx.globalAlpha=1; ctx.lineWidth=p.sel?1.8:0.7; ctx.strokeStyle=p.sel?"#ffb020":(p.emis?"rgba(57,255,136,.9)":"rgba(34,211,238,.55)"); ctx.stroke();
  });
}
function paintSVG(polys, w, h, opts={}){
  const body = polys.map(p=>`<polygon points="${p.pts.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" ")}" fill="${opts.line?'none':shade(p.color,0.35+p.lit*0.85)}" fill-opacity="${p.glass?0.35:0.92}" stroke="${opts.stroke||'#22d3ee'}" stroke-width="${opts.sw||0.6}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${opts.bg?`<rect width="${w}" height="${h}" fill="${opts.bg}"/>`:""}${body}</svg>`;
}
function dimsOf(a){ const b=bounds(a); return [0,1,2].map(k=>b.mx[k]-b.mn[k]); }

/* ---------- Eksport: STL / ZIP / 3MF / DXF ---------- */
function tris(a, cid){
  const T=[]; instances(a).filter(i=>!cid||i.cid===cid).forEach(i=>meshOf(i).forEach(p=>{ for(let k=1;k<p.length-1;k++) T.push([p[0],p[k],p[k+1]]); }));
  return T;
}
function stlText(a, cid, name="forge"){
  let s=`solid ${name}\n`;
  tris(a,cid).forEach(t=>{ const u=[t[1][0]-t[0][0],t[1][1]-t[0][1],t[1][2]-t[0][2]], v=[t[2][0]-t[0][0],t[2][1]-t[0][1],t[2][2]-t[0][2]];
    let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]; const l=Math.hypot(...n)||1; n=n.map(x=>x/l);
    s+=`facet normal ${n.join(" ")}\n outer loop\n${t.map(p=>`  vertex ${p.map(x=>x.toFixed(4)).join(" ")}`).join("\n")}\n endloop\nendfacet\n`; });
  return s+`endsolid ${name}\n`;
}
const CRC=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
const enc = s => new TextEncoder().encode(s);
function zip(files){ // files: [{name, data:string|Uint8Array}] (saqlash usuli)
  const parts=[], cd=[]; let off=0;
  files.forEach(f=>{
    const d = typeof f.data==="string"?enc(f.data):f.data, nm=enc(f.name), crc=crc32(d);
    const h=new DataView(new ArrayBuffer(30)); h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,0,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nm.length,true);h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),nm,d);
    const c=new DataView(new ArrayBuffer(46)); c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,0,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cd.push(new Uint8Array(c.buffer),nm); off+=30+nm.length+d.length;
  });
  const cdLen=cd.reduce((s,x)=>s+x.length,0);
  const e=new DataView(new ArrayBuffer(22)); e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cdLen,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,new Uint8Array(e.buffer)],{type:"application/zip"});
}
function threeMF(a,cid){
  const verts=[], tri=[]; tris(a,cid).forEach(t=>{ const b=verts.length; t.forEach(p=>verts.push(p)); tri.push([b,b+1,b+2]); });
  const model=`<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><object id="1" type="model"><mesh><vertices>${verts.map(p=>`<vertex x="${p[0].toFixed(3)}" y="${(-p[2]).toFixed(3)}" z="${p[1].toFixed(3)}"/>`).join("")}</vertices><triangles>${tri.map(t=>`<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join("")}</triangles></mesh></object></resources><build><item objectid="1"/></build></model>`;
  return zip([{name:"[Content_Types].xml",data:`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`},
    {name:"_rels/.rels",data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`},
    {name:"3D/3dmodel.model",data:model}]);
}
function viewsSVGData(a){ // 3 ortografik ko'rinish (chizma varag'i)
  const W=1000,H=420, mk=(yaw,pitch,x0,y0,w,h)=>({polys:render(a,{yaw,pitch,ortho:true,w,h,zoom:1}),x0,y0,w,h});
  return [["OLDIDAN",0,0,20,40],["YONIDAN",90,0,360,40],["USTIDAN",0,90,700,40]].map(([n,yaw,pitch,x0,y0])=>({n, x0, y0, polys:render(a,{yaw,pitch,ortho:true,w:280,h:300,zoom:0.95})}));
}
function drawingSVG(a, d){
  const dim=dimsOf(a).map(v=>Math.round(v));
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 440" width="1000" height="440"><rect width="1000" height="440" fill="#0b0f14"/><rect x="8" y="8" width="984" height="424" fill="none" stroke="#22d3ee" stroke-width="1"/>`;
  viewsSVGData(a).forEach(v=>{
    s+=`<g transform="translate(${v.x0},${v.y0})"><rect width="280" height="300" fill="none" stroke="#1e3a4a" stroke-dasharray="4 3"/>`+v.polys.map(p=>`<polygon points="${p.pts.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" ")}" fill="none" stroke="#22d3ee" stroke-width=".7"/>`).join("")+`<text x="140" y="322" fill="#7dd3fc" font-size="13" text-anchor="middle" font-family="monospace">${v.n}</text></g>`;
  });
  s+=`<text x="20" y="400" fill="#39ff88" font-size="12" font-family="monospace">${esc(a.name)} | gabarit ~ ${dim[0]} x ${dim[1]} x ${dim[2]} mm (X x Y x Z) | masshtab: sxematik | KONSEPT chizma</text><text x="20" y="418" fill="#ffb020" font-size="11" font-family="monospace">AI konsepti: ishlab chiqarishdan oldin professional tekshiruv talab etiladi</text></svg>`;
  return s;
}
function dxfDrawing(a){
  let s="0\nSECTION\n2\nENTITIES\n";
  const line=(l,x1,y1,x2,y2)=>{ s+=`0\nLINE\n8\n${l}\n10\n${x1.toFixed(3)}\n20\n${y1.toFixed(3)}\n30\n0\n11\n${x2.toFixed(3)}\n21\n${y2.toFixed(3)}\n31\n0\n`; };
  viewsSVGData(a).forEach((v,vi)=>{ v.polys.forEach(p=>{ for(let i=0;i<p.pts.length;i++){ const A=p.pts[i],B=p.pts[(i+1)%p.pts.length]; line(["FRONT","SIDE","TOP"][vi], A[0]+vi*320, 300-A[1], B[0]+vi*320, 300-B[1]); } }); });
  return s+"0\nENDSEC\n0\nEOF\n";
}
function paramSpec(a){
  const lay=LAYOUT[a.arch]||{};
  const parts=instances(a).map((i,k)=>({id:k+1, component:LIB[i.kind].n, shape:i.sh==="b"?"box":i.sh==="r"?"ring (outer radius=size.radius, inner=size.inner)":"cylinder (axis "+(i.sh==="x"?"X":i.sh==="z"?"Z":"Y")+")", size_mm:i.sh==="b"?{x:i.sx,y:i.sy,z:i.sz}:i.sh==="r"?{radius:i.sx,height:i.sy,inner:i.sz}:{radius:i.sx,length:i.sy}, rotation_y_deg:i.rot||0, center_mm:{x:i.c[0],y:i.c[1],z:i.c[2]}, material:MATS[LIB[i.kind].mk].n}));
  return JSON.stringify({format:"FUTURE FORGE parametrik CAD spetsifikatsiyasi", note:"Bu STEP fayl emas. Quyidagi parametrlar Fusion 360 / FreeCAD / Onshape / SolidWorks da modelni qayta qurish uchun yetarli konsept asosdir. Haqiqiy detallash (tolerans, rezba, filet, yig'ish mate'lari) CAD muhandisi tomonidan bajariladi.", product:a.name, units:"mm", coordinate_system:"Y yuqoriga, Z oldinga", overall_dimensions_mm:dimsOf(a).map(v=>Math.round(v)), parts, suggested_workflow:["Har bir 'parts' qatoridan sketch + extrude/revolve","Korpus uchun devor qalinligi 2-3 mm (3D bosma) yoki 3 mm (akril)","Mahkamlagich teshiklari: M3 uchun 3.2 mm o'tkazuvchi, 2.5 mm rezba oldi","Tolerans: 3D bosma +/-0.2 mm, CNC +/-0.05 mm, lazer +/-0.1 mm","STEP/STL ni shu spetsifikatsiya asosida eksport qiling"]}, null, 2);
}

/* ---------- Lazer rejimi ---------- */
function laserShapes(a){
  const [W,H,Dp]=a.dims; const out=[];
  a.comps.forEach(c=>{
    const L=LIB[c.kind]; if(!L.laser) return;
    const mk=L.mk, thk = mk==="al6061"?1.5:3;
    const mkS=(name,o)=>out.push({cid:c.id, kind:c.kind, name, mat:mk, thk, qty:o.qty||1, ...o});
    if(c.kind==="housing_led"){ const s=Math.round(Math.min(W,Dp)*0.8), hh=46;
      mkS("Korpus yon paneli",{type:"rect",w:s,h:hh,qty:4,holes:[{t:"r",x:6,y:hh/2-5,w:3,h:10},{t:"r",x:s-9,y:hh/2-5,w:3,h:10}],eng:[{t:"line",x1:12,y1:hh/2,x2:s-12,y2:hh/2},{t:"text",x:s/2-20,y:hh/2-8,s:8,txt:"FORGE"}]});
      mkS("Yuqori halqa plata",{type:"disc",r:s/2,holes:[{t:"c",x:s/2,y:s/2,r:s/2-14},...[[8,8],[s-8,8],[8,s-8],[s-8,s-8]].map(p=>({t:"c",x:p[0],y:p[1],r:1.7}))],eng:[{t:"circle",x:s/2,y:s/2,r:s/2-7}]});
      mkS("Asos plata",{type:"rect",w:s,h:s,holes:[{t:"c",x:s/2,y:s/2,r:6},...[[8,8],[s-8,8],[8,s-8],[s-8,s-8]].map(p=>({t:"c",x:p[0],y:p[1],r:1.7}))],eng:[{t:"text",x:10,y:s-8,s:6,txt:"FUTURE FORGE"}]}); }
    else if(c.kind==="frame_sheet"){ const w=Math.round(W*0.8),h=Math.round(Dp*0.8);
      mkS("Ramka plata (yoyilma)",{type:"rect",w:w,h:h,holes:[...[[10,10],[w-10,10],[10,h-10],[w-10,h-10]].map(p=>({t:"c",x:p[0],y:p[1],r:2.2})),{t:"r",x:w/2-15,y:h/2-3,w:30,h:6}],eng:[{t:"line",x1:20,y1:0,x2:20,y2:h},{t:"line",x1:w-20,y1:0,x2:w-20,y2:h},{t:"text",x:w/2-18,y:h-10,s:6,txt:"BUKISH CHIZIG'I"}]}); }
    else if(c.kind==="holo_screen"){ mkS("Shaffof ekran paneli",{type:"rect",w:90,h:110,holes:[],eng:[{t:"rect",x:4,y:4,w:82,h:102},{t:"line",x1:4,y1:30,x2:86,y2:30},{t:"text",x:12,y:20,s:8,txt:"HOLO"}]}); }
    else if(c.kind==="optics"){ mkS("Optika diski",{type:"disc",r:25,qty:2,holes:[{t:"c",x:25,y:25,r:3}],eng:[{t:"circle",x:25,y:25,r:18}]}); }
    else if(c.kind==="ui_panel"){ mkS("Boshqaruv paneli",{type:"rect",w:60,h:30,holes:[{t:"c",x:12,y:15,r:6},{t:"c",x:30,y:15,r:6},{t:"c",x:48,y:15,r:6}],eng:[{t:"text",x:6,y:27,s:4,txt:"ON"},{t:"text",x:25,y:27,s:4,txt:"MODE"},{t:"text",x:44,y:27,s:4,txt:"SET"}]}); }
    else if(c.kind==="core_light"){ mkS("Yadro diffuzor diski",{type:"disc",r:30,qty:2,holes:[...[0,1,2,3,4,5].map(i=>({t:"c",x:30+22*Math.cos(i*Math.PI/3),y:30+22*Math.sin(i*Math.PI/3),r:2})),{t:"c",x:30,y:30,r:4}],eng:[{t:"circle",x:30,y:30,r:14},{t:"circle",x:30,y:30,r:9}]}); }
  });
  return out;
}
function nest(shapes, sw=600, sh=400, gap=6){
  const groups={}; shapes.forEach(s=>{ const k=s.mat+"|"+s.thk; (groups[k]=groups[k]||[]).push(s); });
  const sheets=[];
  Object.entries(groups).forEach(([k,list])=>{
    const items=[]; list.forEach(s=>{ for(let i=0;i<(s.qty||1);i++) items.push(s); });
    items.sort((p,q)=>sz(q).h-sz(p).h);
    let sheet=null,x=0,y=0,rowH=0;
    const newSheet=()=>{ sheet={mat:list[0].mat, thk:list[0].thk, w:sw, h:sh, items:[]}; sheets.push(sheet); x=gap;y=gap;rowH=0; };
    newSheet();
    items.forEach(s=>{ const {w,h}=sz(s);
      if(x+w+gap>sw){ x=gap; y+=rowH+gap; rowH=0; }
      if(y+h+gap>sh){ newSheet(); }
      sheet.items.push({s,x,y}); x+=w+gap; rowH=Math.max(rowH,h);
    });
  });
  sheets.forEach(sh2=>{ const used=sh2.items.reduce((t,i)=>t+(i.s.type==="disc"?Math.PI*i.s.r*i.s.r:i.s.w*i.s.h),0); sh2.util=Math.round(used/(sh2.w*sh2.h)*100); });
  return sheets;
  function sz(s){ return s.type==="disc"?{w:s.r*2,h:s.r*2}:{w:s.w,h:s.h}; }
}
function laserSVG(sheet, kerf=0.15, showBox=true){
  const k=kerf/2; let cut="",eng="";
  sheet.items.forEach(({s,x,y})=>{
    const g=[];
    if(s.type==="disc") cut+=`<circle cx="${x+s.r}" cy="${y+s.r}" r="${(s.r+k).toFixed(3)}"/>`;
    else cut+=`<rect x="${(x-k).toFixed(3)}" y="${(y-k).toFixed(3)}" width="${(s.w+kerf).toFixed(3)}" height="${(s.h+kerf).toFixed(3)}"/>`;
    (s.holes||[]).forEach(h=>{ if(h.t==="c") cut+=`<circle cx="${x+h.x}" cy="${y+h.y}" r="${Math.max(0.2,h.r-k).toFixed(3)}"/>`; else cut+=`<rect x="${(x+h.x+k).toFixed(3)}" y="${(y+h.y+k).toFixed(3)}" width="${(h.w-kerf).toFixed(3)}" height="${(h.h-kerf).toFixed(3)}"/>`; });
    (s.eng||[]).forEach(e=>{ if(e.t==="line") eng+=`<line x1="${x+e.x1}" y1="${y+e.y1}" x2="${x+e.x2}" y2="${y+e.y2}"/>`; else if(e.t==="rect") eng+=`<rect x="${x+e.x}" y="${y+e.y}" width="${e.w}" height="${e.h}"/>`; else if(e.t==="circle") eng+=`<circle cx="${x+e.x}" cy="${y+e.y}" r="${e.r}"/>`; else if(e.t==="text") eng+=`<text x="${x+e.x}" y="${y+e.y}" font-size="${e.s}" font-family="monospace" fill="#0000ff" stroke="none">${esc(e.txt)}</text>`; });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheet.w} ${sheet.h}" width="${sheet.w}mm" height="${sheet.h}mm">${showBox?`<rect width="${sheet.w}" height="${sheet.h}" fill="none" stroke="#888" stroke-width=".3" stroke-dasharray="3 2"/>`:""}<g id="CUT" fill="none" stroke="#ff0000" stroke-width="0.1">${cut}</g><g id="ENGRAVE" fill="none" stroke="#0000ff" stroke-width="0.1">${eng}</g></svg>`;
}
function laserDXF(sheet, kerf=0.15){
  const k=kerf/2, H=sheet.h; let s="0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n0\nLAYER\n2\nCUT\n70\n0\n62\n1\n6\nCONTINUOUS\n0\nLAYER\n2\nENGRAVE\n70\n0\n62\n5\n6\nCONTINUOUS\n0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n";
  const ln=(l,x1,y1,x2,y2)=>{ s+=`0\nLINE\n8\n${l}\n10\n${x1.toFixed(3)}\n20\n${(H-y1).toFixed(3)}\n30\n0\n11\n${x2.toFixed(3)}\n21\n${(H-y2).toFixed(3)}\n31\n0\n`; };
  const ci=(l,x,y,r)=>{ s+=`0\nCIRCLE\n8\n${l}\n10\n${x.toFixed(3)}\n20\n${(H-y).toFixed(3)}\n30\n0\n40\n${r.toFixed(3)}\n`; };
  const rc=(l,x,y,w,h)=>{ ln(l,x,y,x+w,y); ln(l,x+w,y,x+w,y+h); ln(l,x+w,y+h,x,y+h); ln(l,x,y+h,x,y); };
  sheet.items.forEach(({s:sh,x,y})=>{
    if(sh.type==="disc") ci("CUT",x+sh.r,y+sh.r,sh.r+k); else rc("CUT",x-k,y-k,sh.w+kerf,sh.h+kerf);
    (sh.holes||[]).forEach(h=>{ if(h.t==="c") ci("CUT",x+h.x,y+h.y,Math.max(0.2,h.r-k)); else rc("CUT",x+h.x+k,y+h.y+k,h.w-kerf,h.h-kerf); });
    (sh.eng||[]).forEach(e=>{ if(e.t==="line") ln("ENGRAVE",x+e.x1,y+e.y1,x+e.x2,y+e.y2); else if(e.t==="rect") rc("ENGRAVE",x+e.x,y+e.y,e.w,e.h); else if(e.t==="circle") ci("ENGRAVE",x+e.x,y+e.y,e.r); else if(e.t==="text") s+=`0\nTEXT\n8\nENGRAVE\n10\n${(x+e.x).toFixed(3)}\n20\n${(H-(y+e.y)).toFixed(3)}\n30\n0\n40\n${e.s}\n1\n${e.txt}\n`; });
  });
  return s+"0\nENDSEC\n0\nEOF\n";
}
function laserParams(mat,thk,type){
  const t=LASER_TBL[mat]; if(!t) return null;
  const cut=t[thk]||t[Object.keys(t).filter(k=>k!=="engrave")[0]];
  return {cut:cut&&cut[type], eng:t.engrave&&t.engrave[type]};
}

/* ---------- 3D bosma ---------- */
function printRows(a){
  return a.comps.filter(c=>LIB[c.kind].print).map(c=>{
    const L=LIB[c.kind], P=L.print; const g=((LAYOUT[a.arch]||{})[c.kind])||["b",30,20,20];
    const bbox = g[0]==="b"? g[1]*g[2]*g[3] : Math.PI*g[1]*g[1]*g[2];
    const hollow = c.kind==="housing_print"?0.12:(c.kind==="gear"?0.5:0.3);
    const ext = bbox*hollow*(0.35+P.infill/100*0.65);
    const flow = P.nozzle*P.layer*50;
    const hrs = ext/flow/3600*1.25*c.qty;
    return {c, L, P, hrs, vol:bbox*hollow};
  });
}

/* ---------- Hisobot ---------- */
function reportData(a, an){
  const rows=bomRows(a), cm=costModel(a), diff=difficulty(a), ms=mach(a), el=electronics(a), sw=software(a), pr=printRows(a), ls=laserShapes(a);
  const S=[];
  S.push({h:"1. Mahsulot tavsifi", p:[`${a.name}`, a.summary, a.geometry||"", `Tahlil rejimi: ${a.mode==="ai"?"Claude AI (rasm tahlili)":"DEMO (shablon asosida; rasm to'g'ridan-to'g'ri tahlil qilinmagan)"}`]});
  S.push({h:"2. Rasm tahlili va muhandislik talqini", p:a.comps.map(c=>`- ${LIB[c.kind].n} x${c.qty}: ${c.label&&c.label!==LIB[c.kind].n?c.label+". ":""}Fantastik ko'rinish: ${c.fiction}. Reallik: ${LIB[c.kind].method}. Holat: ${ST[LIB[c.kind].st].n}.`)});
  S.push({h:"3. Komponentlar ro'yxati", p:rows.map(r=>`- ${r.part} (x${r.qty})`)});
  S.push({h:"4. Materiallar", p:uniq(a.comps.map(c=>LIB[c.kind].mk)).map(k=>`- ${MATS[k].n}: ${MATS[k].props}. Usul: ${MATS[k].how}. Muqobil: ${MATS[k].alt}`)});
  S.push({h:"5. Ishlab chiqarish texnologiyasi", p:pipeline(a).filter(p=>p.on).map((p,i)=>`${i+1}. ${p.n}: ${p.d} (~${p.days} kun)`)});
  S.push({h:"6. Kerakli mashinalar", p:ms.map(m=>`- [${MACH[m]}] ${m}: ${MACH_INFO[m]}`)});
  S.push({h:"7. Elektronika", p:el.flatMap(b=>[`${b.n}:`,...b.items.map(i=>"  - "+i)])});
  if(sw) S.push({h:"8. Dasturiy arxitektura", p:sw.flatMap(b=>[`${b.n}:`,...b.items.map(i=>"  - "+i)])});
  S.push({h:"9. CAD talablari", p:[`Gabarit: ~${dimsOf(a).map(v=>Math.round(v)).join(" x ")} mm`, "Parametrik model har bir komponent uchun alohida, yig'ma holatda yaratiladi.", "Tolerans: 3D bosma +/-0.2 mm, CNC +/-0.05 mm, lazer +/-0.1 mm."]});
  S.push({h:"10. Lazer talablari", p:ls.length? ls.map(s=>`- ${s.name} x${s.qty||1}: ${MATS[s.mat].n}, ${s.thk} mm`) : ["Lazer bilan kesiladigan detal aniqlanmadi."]});
  S.push({h:"11. 3D bosma talablari", p:pr.length? pr.map(r=>`- ${r.L.n}: ${MATS[r.L.mk].n}, soplo ${r.P.nozzle} mm, qatlam ${r.P.layer} mm, to'ldirish ${r.P.infill}%, devor ${r.P.walls}, qo'llab-quvvatlash: ${r.P.support}, ~${rnd(r.hrs,1)} soat`) : ["3D bosma detali aniqlanmadi."]});
  S.push({h:"12. BOM (xarajat bilan)", p:rows.map(r=>`- ${r.part} | x${r.qty} | ${r.mat} | ${r.mfg} | ${money(r.cost)}`)});
  S.push({h:"13. Taxminiy narx", p:[...CATS.map(([k,n])=>`${n}: ${money(cm.base[k])}`), ...[1,10,100,1000].map(n=>`${n===1?"Prototip":n+" dona"}: dona narxi ${money(cm.scale[n].unit)}, jami ${money(cm.scale[n].total)}`), "Barcha narxlar taxminiy (-30%/+60% chegarada), mintaqa va yetkazib beruvchiga qarab keskin farq qiladi."]});
  S.push({h:"14. Prototip va ishlab chiqarish rejasi", p:ROAD.map((r,i)=>`${i+1}. ${r}: ${ROAD_D[i]}`)});
  S.push({h:"15. Qiyinlik tahlili", p:diff.map(d=>`- ${d.n}: ${CX[d.l]}. ${d.why}`)});
  S.push({h:"16. Xavflar va texnik cheklovlar", p:[...a.risks, ...a.alts.filter(x=>x.st==="speculative"||x.st==="experimental").map(x=>`- ${x.fic}: ${x.lim}`)]});
  S.push({h:"Ogohlantirish", p:["AI tomonidan yaratilgan muhandislik konseptlari ishlab chiqarish yoki foydalanishdan oldin professional tekshiruvni talab qiladi."]});
  return S;
}
