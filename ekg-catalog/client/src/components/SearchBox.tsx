import { useMemo, useState } from 'react';
import { useData } from '../lib/data';
import { searchParts } from '../lib/search';
import { useUI } from '../lib/store';

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const { catalog } = useData();
  const showPart = useUI((s) => s.showPart);
  const [q, setQ] = useState('');
  const hits = useMemo(() => searchParts(catalog.parts, catalog.assemblies, q), [catalog, q]);
  const asm = useMemo(() => new Map(catalog.assemblies.map((a) => [a.id, a])), [catalog.assemblies]);
  const shown = compact ? hits.slice(0, 8) : hits;

  return (
    <div>
      <input className="input shadow-lg" autoFocus={!compact} value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Qidiruv: nom, Part ID, katalog/chizma/pozitsiya raqami, material…  (masalan: венец, 3536.05.00.001)" />
      {q && (
        <ul className={`mt-1 overflow-auto rounded border border-line bg-panel/95 backdrop-blur ${compact ? 'max-h-72 shadow-xl' : ''}`}>
          {!shown.length && <li className="px-3 py-3 text-sm text-mute">Hech narsa topilmadi</li>}
          {shown.map(({ part: p }) => (
            <li key={p.part_id}>
              <button className="flex w-full items-start gap-3 border-b border-line/60 px-3 py-2 text-left hover:bg-raised" onClick={() => { showPart(p.part_id); if (compact) setQ(''); }}>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name} {p.name_ru && <span className="font-normal text-mute">· {p.name_ru}</span>}</div>
                  <div className="font-mono text-[11px] text-accent">{p.part_id}{p.part_number && <span className="text-mute"> · № {p.part_number}</span>}</div>
                </div>
                <div className="shrink-0 text-right text-[11px] text-mute">{p.assembly_id ? asm.get(p.assembly_id)?.name : '—'}</div>
              </button>
            </li>
          ))}
          {compact && hits.length > shown.length && <li className="px-3 py-2 text-[11px] text-mute">… yana {hits.length - shown.length} ta natija. To‘liq ro‘yxat: QIDIRUV bo‘limi.</li>}
        </ul>
      )}
    </div>
  );
}
