import type { Assembly, Part } from './types';

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/ё/g, 'е').replace(/[‘’ʻʼ`']/g, "'").trim();
const compact = (s: unknown) => norm(s).replace(/[^0-9a-zа-я]/g, '');

export interface Hit { part: Part; score: number }

/** Every query token must match at least one field. ID-like fields also match ignoring punctuation. */
export function searchParts(parts: Part[], assemblies: Assembly[], query: string): Hit[] {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const asm = new Map(assemblies.map((a) => [a.id, a]));
  const hits: Hit[] = [];
  for (const p of parts) {
    const a = p.assembly_id ? asm.get(p.assembly_id) : undefined;
    const idFields = [p.part_id, p.part_number, p.drawing_number, p.position_number, p.model_object_id, a?.code];
    const textFields = [p.name, p.name_ru, a?.name, a?.name_ru, p.material, p.part_type];
    let total = 0;
    for (const t of tokens) {
      const tc = compact(t);
      let best = 0;
      for (const f of idFields) {
        const n = norm(f), c = compact(f);
        if (!n) continue;
        if (n === t || (tc && c === tc)) best = Math.max(best, 100);
        else if (n.startsWith(t) || (tc.length > 2 && c.startsWith(tc))) best = Math.max(best, 60);
        else if (n.includes(t) || (tc.length > 2 && c.includes(tc))) best = Math.max(best, 40);
      }
      for (const f of textFields) {
        const n = norm(f);
        if (!n) continue;
        if (n === t) best = Math.max(best, 90);
        else if (n.split(/[\s\-/(),]+/).some((w) => w.startsWith(t))) best = Math.max(best, 70);
        else if (n.includes(t)) best = Math.max(best, 50);
      }
      if (!best) { total = 0; break; }
      total += best;
    }
    if (total) hits.push({ part: p, score: total });
  }
  return hits.sort((x, y) => y.score - x.score || x.part.part_id.localeCompare(y.part.part_id));
}
