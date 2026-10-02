'use strict';
/* Oflayn kompyuter ko'rishi: rasmni rang/shakl bo'yicha bo'laklarga ajratadi (taxminiy).
   Bu AI emas: faqat piksellar (fon ajratish, rang klasterlari, bog'langan bo'laklar). */
function segmentImage(src){
  return new Promise((resolve)=>{
    const im=new Image();
    im.onerror=()=>resolve(null);
    im.onload=()=>{
      try{
        const M=128, s=Math.min(1,M/Math.max(im.width,im.height)), W=Math.max(8,Math.round(im.width*s)), H=Math.max(8,Math.round(im.height*s));
        const c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d",{willReadFrequently:true}); x.drawImage(im,0,0,W,H);
        resolve(segmentPixels(x.getImageData(0,0,W,H).data,W,H));
      }catch(e){ resolve(null); }
    };
    im.src=src;
  });
}
function segmentPixels(d,W,H){
  const N=W*H, R=new Float32Array(N), G=new Float32Array(N), B=new Float32Array(N), L=new Float32Array(N), S=new Float32Array(N);
  for(let i=0;i<N;i++){ const r=d[i*4]/255,g=d[i*4+1]/255,b=d[i*4+2]/255, mx=Math.max(r,g,b), mn=Math.min(r,g,b); R[i]=r;G[i]=g;B[i]=b; L[i]=0.299*r+0.587*g+0.114*b; S[i]=mx?(mx-mn)/mx:0; }
  // fon rangi: chet piksellarining medianasi
  const edge=[]; const m=Math.max(2,Math.round(Math.min(W,H)*0.06));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++) if(x<m||y<m||x>=W-m||y>=H-m) edge.push(y*W+x);
  const med=a=>{ const t=a.slice().sort((p,q)=>p-q); return t[t.length>>1]; };
  const bg=[med(edge.map(i=>R[i])),med(edge.map(i=>G[i])),med(edge.map(i=>B[i]))];
  // fon bilan farq + chegara (Sobel)
  const score=new Float32Array(N); let mxs=1e-6;
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){ const i=y*W+x;
    const gx=-L[i-W-1]-2*L[i-1]-L[i+W-1]+L[i-W+1]+2*L[i+1]+L[i+W+1], gy=-L[i-W-1]-2*L[i-W]-L[i-W+1]+L[i+W-1]+2*L[i+W]+L[i+W+1];
    const dist=Math.hypot(R[i]-bg[0],G[i]-bg[1],B[i]-bg[2]); score[i]=dist+0.5*Math.hypot(gx,gy)/4; mxs=Math.max(mxs,score[i]); }
  // Otsu
  const hist=new Array(64).fill(0); for(let i=0;i<N;i++) hist[Math.min(63,(score[i]/mxs*63)|0)]++;
  let sum=0; for(let t=0;t<64;t++) sum+=t*hist[t]; let wB=0,sB=0,best=0,thr=8;
  for(let t=0;t<64;t++){ wB+=hist[t]; if(!wB) continue; const wF=N-wB; if(!wF) break; sB+=t*hist[t]; const mB=sB/wB, mF=(sum-sB)/wF, v=wB*wF*(mB-mF)*(mB-mF); if(v>best){best=v;thr=t;} }
  let fg=new Uint8Array(N); let cnt=0; const T=(thr+1)/63*mxs*0.42; for(let i=0;i<N;i++){ if(score[i]>T){fg[i]=1;cnt++;} }
  if(cnt<N*0.01||cnt>N*0.92){ fg.fill(1); cnt=N; }
  // kichik teshiklarni yopish
  const close=a=>{ const o=new Uint8Array(N); for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){ const i=y*W+x; o[i]=a[i]|a[i-1]|a[i+1]|a[i-W]|a[i+W]; } const e=new Uint8Array(N); for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){ const i=y*W+x; e[i]=o[i]&o[i-1]&o[i+1]&o[i-W]&o[i+W]; } return e; };
  if(cnt<N) fg=close(fg);
  // asosiy obyekt chegarasi
  let x0=W,y0=H,x1=0,y1=0,fc=0; for(let y=0;y<H;y++)for(let x=0;x<W;x++) if(fg[y*W+x]){ fc++; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  if(!fc){ x0=0;y0=0;x1=W-1;y1=H-1; }
  const idx=[]; for(let i=0;i<N;i++) if(fg[i]||cnt===N) idx.push(i);
  if(idx.length<30) return {W,H,regions:[],main:{x:0,y:0,w:100,h:100},fgFrac:0,k:0};
  // 1) superpikselar: rang + joylashuv bo'yicha ixcham klasterlar
  const K0=Math.min(34,Math.max(10,Math.round(idx.length/130)));
  const feat=i=>[R[i],G[i],B[i],(i%W)/W*0.55,((i/W)|0)/H*0.55];
  const F=idx.map(feat); const cen=[F[0].slice()];
  while(cen.length<K0){ let bi=0,bd=-1; for(let j=0;j<F.length;j+=2){ let md=1e9; for(const c of cen){ let q=0; for(let k=0;k<5;k++){ const t=F[j][k]-c[k]; q+=t*t; } if(q<md)md=q; } if(md>bd){bd=md;bi=j;} } cen.push(F[bi].slice()); }
  const lab=new Int16Array(N).fill(-1);
  for(let it=0;it<7;it++){
    const acc=cen.map(()=>[0,0,0,0,0,0]);
    for(let j=0;j<F.length;j++){ let bj=0,bd=1e9; for(let q=0;q<K0;q++){ let s2=0; for(let k=0;k<5;k++){ const t=F[j][k]-cen[q][k]; s2+=t*t; } if(s2<bd){bd=s2;bj=q;} } lab[idx[j]]=bj; const a=acc[bj]; for(let k=0;k<5;k++) a[k]+=F[j][k]; a[5]++; }
    for(let q=0;q<K0;q++) if(acc[q][5]) for(let k=0;k<5;k++) cen[q][k]=acc[q][k]/acc[q][5];
  }
  // 2) klaster ichida bog'langan bo'laklar (komponentlar)
  const comp=new Int32Array(N).fill(-1), cs=[]; 
  for(const start of idx){ if(comp[start]>=0) continue; const id=cs.length, cl=lab[start], st=[start]; comp[start]=id; const o={n:0,r:0,g:0,b:0}; 
    while(st.length){ const p=st.pop(); o.n++; o.r+=R[p]; o.g+=G[p]; o.b+=B[p]; const px=p%W, py=(p/W)|0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy) continue; const nx=px+dx, ny=py+dy; if(nx<0||ny<0||nx>=W||ny>=H) continue; const q=ny*W+nx; if(comp[q]<0&&lab[q]===cl){ comp[q]=id; st.push(q); } } }
    cs.push(o); }
  // 3) qo'shni va rangi o'xshash komponentlarni birlashtirish (union-find)
  const par=cs.map((_,i)=>i), find=a=>{ while(par[a]!==a){ par[a]=par[par[a]]; a=par[a]; } return a; };
  const col=i=>[cs[i].r/cs[i].n,cs[i].g/cs[i].n,cs[i].b/cs[i].n], nc=a=>{ const s2=a[0]+a[1]+a[2]+0.15; return [a[0]/s2,a[1]/s2,a[2]/s2,0.299*a[0]+0.587*a[1]+0.114*a[2]]; }, cd=(a,b)=>{ const p=nc(a),q=nc(b); return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2])*1.6+Math.abs(Math.log((p[3]+0.04)/(q[3]+0.04)))*0.45; };
  const pairs=new Map(); for(let y=0;y<H;y++)for(let x=0;x<W;x++){ const i=y*W+x, a=comp[i]; if(a<0) continue; for(const q of [i+1,i+W]){ if(q>=N||(q===i+1&&x===W-1)) continue; const b=comp[q]; if(b>=0&&b!==a){ const k=a<b?a+"_"+b:b+"_"+a; pairs.set(k,(pairs.get(k)||0)+1); } } }
  [...pairs.keys()].forEach(k=>{ const [a,b]=k.split("_").map(Number); const small=Math.min(cs[a].n,cs[b].n)<idx.length*0.004; if(cd(col(a),col(b))<(small?0.12:0.1)) par[find(a)]=find(b); });
  // 4) birlashgan bo'laklar statistikasi
  const grp=new Map();
  for(const i of idx){ const g=find(comp[i]); let o=grp.get(g); if(!o){ o={a:0,sx:0,sy:0,x0:W,y0:H,x1:0,y1:0,sl:0,ss:0}; grp.set(g,o); } const px=i%W, py=(i/W)|0; o.a++; o.sx+=px; o.sy+=py; o.sl+=L[i]; o.ss+=S[i]; if(px<o.x0)o.x0=px; if(px>o.x1)o.x1=px; if(py<o.y0)o.y0=py; if(py>o.y1)o.y1=py; }
  const regs=[]; const minA=Math.max(10,N*0.002); const bgL=0.299*bg[0]+0.587*bg[1]+0.114*bg[2];
  grp.forEach(o=>{ if(o.a<minA) return; const bw=o.x1-o.x0+1, bh=o.y1-o.y0+1, L0=o.sl/o.a, S0=o.ss/o.a;
    regs.push({cx:o.sx/o.a/W*100, cy:o.sy/o.a/H*100, x:o.x0/W*100, y:o.y0/H*100, w:bw/W*100, h:bh/H*100, area:o.a/N, fill:o.a/(bw*bh), aspect:bw/bh, L:L0, S:S0, contrast:Math.abs(L0-bgL)+S0*0.6}); });
  const mainBox=Math.max(1e-6,(x1-x0+1)*(y1-y0+1)/N);
  regs.forEach(r=>{ r.sal=Math.pow(r.area,0.55)*(0.4+r.contrast); r.emis=(r.S>0.6&&r.L>0.25)||(r.L>0.6&&r.S>0.3); r.dark=r.L<0.28&&r.S<0.6; r.big=(r.w*r.h/10000)/mainBox>0.22; r.elong=r.aspect>2.4||r.aspect<0.42; r.round=r.fill>0.6&&r.fill<0.92&&r.aspect>0.7&&r.aspect<1.45; r.small=(r.w*r.h/10000)/mainBox<0.04; });
  regs.sort((p,q)=>q.sal-p.sal);
  const pick=[]; for(const r of regs){ if(pick.every(p=>Math.hypot(p.cx-r.cx,p.cy-r.cy)>4)) pick.push(r); if(pick.length>=28) break; }
  return {W,H,regions:pick,main:{x:x0/W*100,y:y0/H*100,w:(x1-x0+1)/W*100,h:(y1-y0+1)/H*100},fgFrac:fc/N,k:K0};
}

/* Komponentlarni topilgan bo'laklarga bog'lash (belgilar bo'yicha o'xshashlik) */
const TAGS={
  led_ring:{emis:3,elong:1,round:1}, holo_screen:{emis:3,big:2}, core_light:{emis:3,elong:2}, light_tube:{emis:3,elong:3}, display_oled:{emis:2,dark:1,small:1},
  housing_led:{big:3,emis:1}, housing_alu:{big:3,dark:1}, housing_print:{big:3}, frame_sheet:{big:2,elong:1,dark:1}, frame_profile:{elong:3}, shield_panel:{big:2,dark:1}, lens_visor:{big:2,elong:1},
  arm_link:{elong:3}, grip:{elong:2,dark:1}, antenna:{elong:2,small:2}, rotor:{round:3,big:1}, wheel:{round:3,dark:1}, motor_servo:{round:2,dark:1}, motor_stepper:{round:3}, gearbox:{round:2}, gear:{round:3}, bearing:{round:2,small:2},
  joint:{round:2}, cooling:{round:2}, sensor:{round:1,small:2}, camera:{round:2,small:2,dark:1}, optics:{round:2,emis:1}, speaker:{round:2,small:1}, gripper:{elong:1,big:1},
  pcb:{dark:2,small:1}, mcu:{dark:2,small:2}, battery:{dark:2,big:1}, power:{dark:1,small:2}, ui_panel:{small:2,emis:1}
};
const VISIBLE=new Set(["housing_led","housing_alu","housing_print","frame_sheet","frame_profile","shield_panel","holo_screen","led_ring","core_light","light_tube","display_oled","lens_visor","ui_panel","camera","antenna","rotor","wheel","arm_link","grip","gripper","optics","speaker"]);
const POSY={holo_screen:.2,optics:.2,antenna:.1,rotor:.5,lens_visor:.4,led_ring:.68,housing_led:.8,housing_alu:.82,housing_print:.75,frame_sheet:.9,frame_profile:.5,ui_panel:.88,grip:.85,wheel:.9,display_oled:.4,core_light:.45,light_tube:.35,camera:.4,speaker:.6,shield_panel:.5,arm_link:.5,gripper:.15};
function matchRegions(comps,vis){
  if(!vis||!vis.regions.length) return false;
  const m=vis.main, regs=vis.regions.map((r,i)=>({...r,i,used:false,ry:Math.min(1,Math.max(0,(r.cy-m.y)/Math.max(1,m.h)))})), out={};
  const aff=(k,r)=>{ const t=TAGS[k]||{}; let s=0; for(const f of ["emis","big","elong","round","dark","small"]) if(t[f]&&r[f]) s+=t[f]; if(t.emis&&!r.emis) s-=1.5; if(t.big&&!r.big) s-=1.5; if(POSY[k]!=null) s+=3.2*(1-Math.abs(r.ry-POSY[k])); return s+r.sal*2; };
  const order=comps.filter(c=>VISIBLE.has(c.kind)).map(c=>({c,best:Math.max(...regs.map(r=>aff(c.kind,r)))})).sort((p,q)=>q.best-p.best);
  order.forEach(({c})=>{ let bi=-1,bs=2.2; regs.forEach(r=>{ if(r.used) return; const s=aff(c.kind,r); if(s>bs){bs=s;bi=r.i;} }); if(bi>=0){ regs[bi].used=true; out[c.id]=regs[bi]; } });
  // ko'rinadigan komponentlar: bo'lak markaziga; qolganlari: ichki (taxminiy) - asosiy obyekt ichida
  let j=0;
  comps.forEach(c=>{ const r=out[c.id];
    if(r){ c.x=+r.cx.toFixed(1); c.y=+r.cy.toFixed(1); c.seen=true; c.box=[r.x,r.y,r.w,r.h]; }
    else { const a=(j++)*2.399963, rr=Math.sqrt((j%9+1)/10); c.x=+Math.min(97,Math.max(3,m.x+m.w/2+Math.cos(a)*rr*m.w*0.42)).toFixed(1); c.y=+Math.min(97,Math.max(3,m.y+m.h/2+Math.sin(a)*rr*m.h*0.42)).toFixed(1); c.seen=false; c.box=null; }
  });
  return {seen:comps.filter(c=>c.seen).length, inferred:comps.filter(c=>!c.seen).length};
}
