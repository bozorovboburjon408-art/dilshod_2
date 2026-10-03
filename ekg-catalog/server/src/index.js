import express from 'express';
import multer from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TABLES, TABLE_NAMES } from './schema.js';
import { seed } from '../seed/ekg10.js';
import { createJsonStore } from './store/json.js';
import { createPgStore } from './store/pg.js';
import { login, requireAdmin } from './auth.js';
import { enqueueConversion } from './converter/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const uploads = join(root, 'uploads');
mkdirSync(uploads, { recursive: true });

const store = process.env.DATABASE_URL
  ? createPgStore(process.env.DATABASE_URL, seed)
  : createJsonStore(join(root, 'data', 'db.json'), seed);
await store.init();

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/files', express.static(uploads), express.static(join(root, 'seed', 'files')));

// ---- public: whole catalogue of one machine in a single payload (small data set)
app.get('/api/catalog', async (req, res) => {
  const code = String(req.query.machine || 'EKG-10');
  const all = Object.fromEntries(await Promise.all(TABLE_NAMES.map(async (t) => [t, await store.list(t)])));
  const machine = all.machines.find((m) => m.code === code);
  if (!machine) return res.status(404).json({ error: `Machine ${code} not found` });
  const parts = all.parts.filter((p) => p.machine_id === machine.id);
  const ids = new Set(parts.map((p) => p.id));
  const byPart = (rows) => rows.filter((r) => ids.has(r.part_id));
  res.json({
    store: store.kind,
    machines: all.machines, machine,
    assemblies: all.assemblies.filter((a) => a.machine_id === machine.id).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    parts,
    documents: all.documents.filter((d) => d.machine_id === machine.id),
    part_documents: byPart(all.part_documents),
    part_drawings: byPart(all.part_drawings),
    part_models: all.part_models.filter((m) => m.machine_id === machine.id || ids.has(m.part_id)),
    materials: all.materials,
    failures: byPart(all.failures).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    repair_methods: byPart(all.repair_methods),
  });
});

// ---- admin
app.post('/api/auth/login', (req, res) => {
  const token = login(req.body?.user, req.body?.password);
  token ? res.json({ token }) : res.status(401).json({ error: 'Login yoki parol noto‘g‘ri' });
});

const admin = express.Router();
admin.use(requireAdmin);

const ALLOWED = /^\.(pdf|png|jpe?g|svg|webp|glb|gltf|obj|step|stp)$/i;
const upload = multer({
  storage: multer.diskStorage({
    destination: uploads,
    filename: (_r, f, cb) => cb(null, `${Date.now()}-${f.originalname.replace(/[^\w.\-]+/g, '_')}`),
  }),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => (ALLOWED.test(extname(f.originalname)) ? cb(null, true) : cb(new Error('Fayl turi ruxsat etilmagan'))),
});
admin.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fayl yo‘q' });
  res.json({ url: `/files/${req.file.filename}`, name: req.file.originalname, size: req.file.size, ext: extname(req.file.originalname).slice(1).toLowerCase() });
});

const tableOf = (req, res, next) => (TABLES[req.params.table] ? next() : res.status(404).json({ error: 'Unknown table' }));
admin.get('/:table', tableOf, async (req, res) => res.json(await store.list(req.params.table)));
admin.put('/:table', tableOf, async (req, res) => {
  const t = req.params.table;
  if (!req.body?.id) return res.status(400).json({ error: 'id kerak' });
  try {
    const row = await store.upsert(t, req.body);
    if (t === 'part_models' && ['step', 'stp'].includes(String(row.format).toLowerCase()) && !['ready', 'processing'].includes(row.conversion_status)) {
      await enqueueConversion(store, row, uploads);
    }
    res.json(await (async () => (await store.list(t)).find((r) => r.id === row.id))());
  } catch (e) { res.status(400).json({ error: e.message }); }
});
admin.delete('/:table/:id', tableOf, async (req, res) => { await store.remove(req.params.table, req.params.id); res.json({ ok: true }); });
app.use('/api/admin', admin);

app.use((err, _req, res, _next) => res.status(400).json({ error: err.message }));

// production: serve the built client
const dist = join(root, '..', 'client', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')));
}

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`[api] http://localhost:${port}  store=${store.kind}`));
