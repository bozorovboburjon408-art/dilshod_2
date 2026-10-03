import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { TABLE_NAMES, cleanRow } from '../schema.js';

// Zero-setup store: one JSON file. Same interface as the PostgreSQL store.
export function createJsonStore(file, seed) {
  let db;
  const save = () => { writeFileSync(file + '.tmp', JSON.stringify(db, null, 2)); renameSync(file + '.tmp', file); };
  return {
    kind: 'json',
    async init() {
      mkdirSync(dirname(file), { recursive: true });
      db = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : structuredClone(seed);
      for (const t of TABLE_NAMES) db[t] ||= [];
      save();
    },
    async list(t) { return db[t]; },
    async upsert(t, row) {
      const r = cleanRow(t, row);
      const i = db[t].findIndex((x) => x.id === r.id);
      if (i >= 0) db[t][i] = { ...db[t][i], ...r }; else db[t].push(r);
      save();
      return db[t].find((x) => x.id === r.id);
    },
    async remove(t, id) {
      db[t] = db[t].filter((x) => x.id !== id);
      // emulate ON DELETE CASCADE
      if (t === 'parts') for (const c of ['part_documents', 'part_drawings', 'part_models', 'failures', 'repair_methods']) db[c] = db[c].filter((x) => x.part_id !== id);
      if (t === 'documents') db.part_documents = db.part_documents.filter((x) => x.document_id !== id);
      save();
    },
  };
}
