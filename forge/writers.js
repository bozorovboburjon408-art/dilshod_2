'use strict';
/* Hisobot yozuvchilari: PDF, DOCX, XLSX (kutubxonasiz) */
const SAN = {"‘":"'","’":"'","ʻ":"'","ʼ":"'","–":"-","—":"-","→":"->","≤":"<=","≥":">=","€":"EUR","·":"-","•":"-","×":"x","≈":"~"};
const san = s => String(s==null?"":s).replace(/[^\x00-\x7F]/g,c=>SAN[c]||"?");

function wrapLine(t,n){ const out=[]; t=san(t); const ind=(t.match(/^\s*/)||[""])[0]; while(t.length>n){ let k=t.lastIndexOf(" ",n); if(k<n*0.5) k=n; out.push(t.slice(0,k)); t=ind+"  "+t.slice(k).trim(); } out.push(t); return out; }
function makePDF(title, sections){
  const W=595,H=842,M=42,LH=12; const rows=[]; // {t, b}
  rows.push({t:title,b:1,big:1}); rows.push({t:"AI-generated engineering concept. Professional verification required before fabrication or use.".replace(/./g,c=>c),b:0}); rows.push({t:"",b:0});
  sections.forEach(s=>{ rows.push({t:s.h,b:1}); (s.p||[]).forEach(p=>wrapLine(p,92).forEach(l=>rows.push({t:l,b:0}))); rows.push({t:"",b:0}); });
  const per=Math.floor((H-2*M)/LH); const pages=[]; for(let i=0;i<rows.length;i+=per) pages.push(rows.slice(i,i+per));
  const esc2=s=>s.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
  const objs=[]; const add=s=>{objs.push(s);return objs.length;};
  add("<< /Type /Catalog /Pages 2 0 R >>");
  const kids=pages.map((_,i)=>5+i*2); add(`<< /Type /Pages /Kids [${kids.map(k=>k+" 0 R").join(" ")}] /Count ${pages.length} >>`);
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>"); add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>");
  pages.forEach((pg,pi)=>{
    let y=H-M; let c="BT\n";
    pg.forEach(r=>{ c+=`/F${r.b?2:1} ${r.big?13:9} Tf 1 0 0 1 ${M} ${y} Tm (${esc2(san(r.t))}) Tj\n`; y-=LH; });
    c+="ET\n"; c+=`BT /F1 7 Tf 1 0 0 1 ${M} 22 Tm (FUTURE FORGE AI | sahifa ${pi+1}/${pages.length}) Tj ET\n`;
    const pn=add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${objs.length+2} 0 R >>`);
    add(`<< /Length ${c.length} >>\nstream\n${c}endstream`);
  });
  let out="%PDF-1.4\n"; const offs=[];
  objs.forEach((o,i)=>{ offs.push(out.length); out+=`${i+1} 0 obj\n${o}\nendobj\n`; });
  const x=out.length; out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+offs.map(o=>String(o).padStart(10,"0")+" 00000 n \n").join("")+`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  const b=new Uint8Array(out.length); for(let i=0;i<out.length;i++) b[i]=out.charCodeAt(i)&255;
  return new Blob([b],{type:"application/pdf"});
}

function xe(s){ return String(s==null?"":s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
function makeDOCX(title, sections, bom){
  const P=(t,b,sz)=>`<w:p><w:r><w:rPr>${b?"<w:b/>":""}${sz?`<w:sz w:val="${sz}"/>`:""}</w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r></w:p>`;
  let body=P(title,1,36)+P("AI-generated engineering concepts require professional verification before fabrication or use.",1,20);
  sections.forEach(s=>{ body+=P(s.h,1,26); (s.p||[]).forEach(t=>body+=P(t)); });
  if(bom){ body+=P("BOM jadvali",1,26)+`<w:tbl><w:tblPr><w:tblBorders>${["top","left","bottom","right","insideH","insideV"].map(b=>`<w:${b} w:val="single" w:sz="4" w:color="888888"/>`).join("")}</w:tblBorders></w:tblPr>`+bom.map((r,i)=>`<w:tr>${r.map(c=>`<w:tc><w:p><w:r><w:rPr>${i?"":"<w:b/>"}<w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">${xe(c)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`).join("")+"</w:tbl>"; }
  return zip([
   {name:"[Content_Types].xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`},
   {name:"_rels/.rels",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`},
   {name:"word/document.xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="900" w:bottom="1000" w:left="900"/></w:sectPr></w:body></w:document>`}
  ]);
}
function colName(i){ return String.fromCharCode(65+i); }
function makeXLSX(sheets){ // sheets: [{name, rows:[[...]]}]
  const sx=(rows)=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((r,ri)=>`<row r="${ri+1}">${r.map((v,ci)=>typeof v==="number"?`<c r="${colName(ci)}${ri+1}"><v>${v}</v></c>`:`<c r="${colName(ci)}${ri+1}" t="inlineStr"><is><t xml:space="preserve">${xe(v)}</t></is></c>`).join("")}</row>`).join("")}</sheetData></worksheet>`;
  return zip([
   {name:"[Content_Types].xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`},
   {name:"_rels/.rels",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
   {name:"xl/workbook.xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${xe(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("")}</sheets></workbook>`},
   {name:"xl/_rels/workbook.xml.rels",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}</Relationships>`},
   ...sheets.map((s,i)=>({name:`xl/worksheets/sheet${i+1}.xml`,data:sx(s.rows)}))
  ]);
}
