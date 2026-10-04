// Statik sayt + ixtiyoriy Claude tahlili (/api/analyze).
// Ishga tushirish: ANTHROPIC_API_KEY=... npm start
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const client = new Anthropic();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const STATUSES = ['current', 'modified', 'experimental', 'speculative'];

const SYSTEM = `Siz kelajak mahsulotlarini loyihalash bo'yicha mutaxassis va amaliy muhandis-dizaynersiz.
Foydalanuvchi kelajak yoki fantastik rasm yuboradi. Vazifangiz: rasmdagi narsani HOZIRGI sharoitda (bugungi texnologiya, materiallar va byudjet bilan) qanday yasash mumkinligini ko'rsatish.
Javobni o'zbek tilida, quyidagi bo'limlar bilan yozing:
## Rasmda nima ko'rinyapti
## Qismlarga ajratish (har bir qism uchun: bugun mumkinmi? tayyorlik darajasi)
## Bugungi yaqinlashtirish usullari (aniq texnologiya, material, tayyor modul nomlari)
## Zarur narsalar ro'yxati (qismlar, asboblar, dasturlar, ko'nikmalar, odamlar)
## Bosqichli reja (maket, kontseptni isbotlash, prototip, pilot; har biriga taxminiy muddat)
## Xavflar va nima hali mumkin emas
Aniq bo'ling, taxmin qilsangiz buni ayting, bo'lmagan imkoniyatlarni va'da qilmang.`;

async function analyze(body) {
  const m = /^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/.exec(body.image || '');
  if (!m) throw Object.assign(new Error("Rasm formati noto'g'ri"), { status: 400 });
  const text = [
    body.note && `Foydalanuvchi izohi: ${body.note}`,
    body.parts?.length && `Foydalanuvchi belgilagan qismlar: ${body.parts.join(', ')}`,
    body.context && `Loyiha konteksti:\n${String(body.context).slice(0, 8000)}`,
  ].filter(Boolean).join('\n\n') || "Rasmni tahlil qiling.";
  const stream = client.messages.stream({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: SYSTEM,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
      { type: 'text', text },
    ] }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === 'refusal') throw Object.assign(new Error("Model so'rovni rad etdi"), { status: 422 });
  return msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}


// ---- FUTURE FORGE: rasmni Claude ko'rib tahlil qiladi, natija tuzilgan JSON ----
const FORGE_SYSTEM = `Siz ko'p tarmoqli muhandislik jamoasisiz: sanoat dizayneri, mexanik muhandis, elektronika muhandisi, ishlab chiqarish texnologi va maker.
Foydalanuvchi kino, o'yin, konsept-art yoki xayoldagi fantastik qurilma rasmini yuboradi. AVVAL rasmda aynan nima tasvirlanganini identified_object da aniqlang va faqat ko'ringan narsaga asoslaning (boshqa mahsulot o'ylab topmang). Keyin uni bugungi texnologiyalar bilan ishlab chiqarish mumkin bo'lgan real mahsulot konseptiga aylantiring.
Qoidalar:
- Rasmda aslida ko'ringan qismlarni aniqlang; ko'rinmaydigan ichki komponentlarni mantiqiy taxmin qiling va buni "note" maydonida ayting.
- Har bir komponent uchun "kind" faqat berilgan ro'yxatdan tanlanadi (eng yaqinini tanlang).
- x va y rasmdagi komponent markazining foizdagi o'rni (0-100, x chapdan, y tepadan).
- Imkonsiz texnologiyalarni "imkonsiz" demang: eng yaqin real texnologiyani, hozirgi cheklovni va kelajak yo'nalishini yozing; status: current, modified, experimental yoki speculative.
- Mavjud bo'lmagan texnologiyani uydirmang. Barcha matnlar o'zbek tilida (lotin), qisqa va aniq.
- dimensions_mm: mahsulotning taxminiy gabaritlari (mm).
- Agar rasmda qurol bo'lsa: faqat funksiyasiz kosplay/rekvizit (yorug'lik/ovoz effektli, otish yoki kesish mexanizmisiz) sifatida konseptlang va risks da ayting.`;

function forgeSchema(kinds) {
  const str = { type: 'string' }, num = { type: 'number' };
  return {
    type: 'object', additionalProperties: false,
    required: ['identified_object', 'product_name', 'archetype', 'summary', 'geometry', 'dimensions_mm', 'overall_complexity', 'components', 'mechanisms', 'tech_alternatives', 'risks'],
    properties: {
      identified_object: str,
      product_name: str,
      archetype: { type: 'string', enum: ['holo', 'arm', 'visor', 'core', 'drone', 'rover', 'scanner', 'exo', 'prop', 'generic'] },
      summary: str, geometry: str,
      dimensions_mm: { type: 'object', additionalProperties: false, required: ['w', 'h', 'd'], properties: { w: num, h: num, d: num } },
      overall_complexity: { type: 'string', enum: ['Past', "O'rta", 'Yuqori', 'Juda yuqori'] },
      components: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['kind', 'label', 'fiction', 'qty', 'x', 'y', 'note'],
        properties: { kind: { type: 'string', enum: kinds }, label: str, fiction: str, qty: { type: 'integer' }, x: num, y: num, note: str } } },
      mechanisms: { type: 'array', items: str },
      tech_alternatives: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['fiction', 'closest_real', 'limitation', 'future', 'status'],
        properties: { fiction: str, closest_real: str, limitation: str, future: str, status: { type: 'string', enum: STATUSES } } } },
      risks: { type: 'array', items: str },
    },
  };
}

async function forge(body) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(body.image || '');
  if (!m) throw Object.assign(new Error("Rasm formati noto'g'ri"), { status: 400 });
  const kinds = (body.kinds || []).filter(k => k && /^[a-z_0-9]+$/.test(k.k)).slice(0, 80);
  if (!kinds.length) throw Object.assign(new Error('kinds yo‘q'), { status: 400 });
  const catalog = kinds.map(k => `- ${k.k}: ${k.n} (fantastik ko'rinishi: ${k.g})`).join('\n');
  const text = `Komponent turlari (kind):\n${catalog}\n\n` + (body.hint ? `Foydalanuvchi izohi: ${String(body.hint).slice(0, 1000)}\n\n` : '') +
    "Rasmni tahlil qiling va JSON qaytaring. Archetype: holo, arm, visor, core, drone, rover, scanner, exo, prop, aks holda generic.";
  const stream = client.messages.stream({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: FORGE_SYSTEM,
    output_config: { format: { type: 'json_schema', schema: forgeSchema(kinds.map(k => k.k)) } },
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
      { type: 'text', text },
    ] }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === 'refusal') throw Object.assign(new Error("Model so'rovni rad etdi"), { status: 422 });
  const out = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
  try { return JSON.parse(out); } catch { throw Object.assign(new Error("Model javobini o'qib bo'lmadi"), { status: 502 }); }
}

// ---- IMTIHON: mavzu bo'yicha test savollarini Claude tuzadi ----
const EXAM_SYSTEM = `Siz tajribali o'qituvchi va test tuzuvchisiz. Berilgan mavzu bo'yicha imtihon testi tuzing.
Qoidalar: savollar o'zbek tilida (lotin); har savolda aynan 4 ta variant va faqat bitta to'g'ri javob; variantlar ishonarli va bir xil uzunlikda; to'g'ri javob o'rni (correct: 0-3) aralash bo'lsin; savollar oson, o'rta va qiyin darajada aralash; takrorlanmasin; faqat aniq, tekshirilgan faktlar; explanation — to'g'ri javobning 1 gaplik izohi.`;

async function exam(body) {
  const topic = String(body.topic || '').trim().slice(0, 200);
  const count = Math.min(Math.max(parseInt(body.count) || 10, 5), 40);
  if (!topic) throw Object.assign(new Error('Mavzu kiritilmagan'), { status: 400 });
  const schema = { type: 'object', additionalProperties: false, required: ['questions'], properties: { questions: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['q', 'options', 'correct', 'explanation'],
    properties: { q: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, correct: { type: 'integer' }, explanation: { type: 'string' } } } } } };
  const msg = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    system: EXAM_SYSTEM,
    output_config: { format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content: `Mavzu: ${topic}\nSavollar soni: ${count}` }],
  });
  if (msg.stop_reason === 'refusal') throw Object.assign(new Error("Model so'rovni rad etdi"), { status: 422 });
  let data;
  try { data = JSON.parse(msg.content.filter(b => b.type === 'text').map(b => b.text).join('')); } catch { throw Object.assign(new Error("Model javobini o'qib bo'lmadi"), { status: 502 }); }
  const questions = (data.questions || []).filter(x => x.q && Array.isArray(x.options) && x.options.length === 4 && x.correct >= 0 && x.correct < 4);
  if (!questions.length) throw Object.assign(new Error('Savollar tuzilmadi'), { status: 502 });
  return { topic, questions };
}

http.createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
  try {
    if (req.method === 'GET' && req.url === '/api/status') return send(200, { ai: !!process.env.ANTHROPIC_API_KEY });
    if (req.method === 'POST' && req.url === '/api/exam') {
      if (!process.env.ANTHROPIC_API_KEY) return send(503, { error: 'ANTHROPIC_API_KEY o\u2018rnatilmagan' });
      let raw = '';
      for await (const c of req) { raw += c; if (raw.length > 1e5) return send(413, { error: 'So\u2018rov juda katta' }); }
      return send(200, await exam(JSON.parse(raw)));
    }
    if (req.method === 'POST' && req.url === '/api/forge') {
      if (!process.env.ANTHROPIC_API_KEY) return send(503, { error: 'ANTHROPIC_API_KEY o\u2018rnatilmagan' });
      let raw = ''; let size = 0;
      for await (const c of req) { size += c.length; if (size > 14e6) return send(413, { error: 'Rasm juda katta' }); raw += c; }
      return send(200, await forge(JSON.parse(raw)));
    }
    if (req.method === 'POST' && req.url === '/api/analyze') {
      if (!process.env.ANTHROPIC_API_KEY) return send(503, { error: 'ANTHROPIC_API_KEY o‘rnatilmagan' });
      let raw = ''; let size = 0;
      for await (const c of req) { size += c.length; if (size > 12e6) return send(413, { error: 'Rasm juda katta' }); raw += c; }
      return send(200, { text: await analyze(JSON.parse(raw)) });
    }
    const p = req.url.split('?')[0];
    const file = path.join(root, p === '/' ? 'index.html' : p.endsWith('/') ? p + 'index.html' : p);
    if (!file.startsWith(root + path.sep) || !TYPES[path.extname(file)] || !fs.existsSync(file) || /server\.js$/.test(file)) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    send(e.status && e.status < 600 ? e.status : 500, { error: e.message || 'Server xatosi' });
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
