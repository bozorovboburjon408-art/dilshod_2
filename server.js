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

http.createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
  try {
    if (req.method === 'POST' && req.url === '/api/analyze') {
      if (!process.env.ANTHROPIC_API_KEY) return send(503, { error: 'ANTHROPIC_API_KEY o‘rnatilmagan' });
      let raw = ''; let size = 0;
      for await (const c of req) { size += c.length; if (size > 12e6) return send(413, { error: 'Rasm juda katta' }); raw += c; }
      return send(200, { text: await analyze(JSON.parse(raw)) });
    }
    const p = req.url.split('?')[0];
    const file = path.join(root, p === '/' ? 'index.html' : p);
    if (!file.startsWith(root) || !TYPES[path.extname(file)] || !fs.existsSync(file) || /server\.js$/.test(file)) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    send(e.status && e.status < 600 ? e.status : 500, { error: e.message || 'Server xatosi' });
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
