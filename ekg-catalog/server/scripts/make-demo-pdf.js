// Writes a tiny 3-page PDF (no dependencies) used to demonstrate the PDF.js viewer.
import { writeFileSync } from 'node:fs';
const pages = ['PDF viewer demo - page 1', 'PDF viewer demo - page 2 (deep link target)', 'PDF viewer demo - page 3'];
const objs = [];
const add = (s) => objs.push(s) && objs.length;
add('<< /Type /Catalog /Pages 2 0 R >>');
add(`<< /Type /Pages /Kids [${pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`);
add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
pages.forEach((t, i) => {
  const stream = `BT /F1 22 Tf 60 400 Td (${t}) Tj 0 -30 Td /F1 12 Tf (This is NOT an EKG-10 document. It only demonstrates the viewer.) Tj ET`;
  add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`);
  add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
});
let out = '%PDF-1.4\n'; const off = [];
objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
const xref = out.length;
out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync(new URL('../seed/files/demo-viewer.pdf', import.meta.url), out);
