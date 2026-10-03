import { useMemo, useState } from 'react';
import { useData } from '../lib/data';
import { useUI } from '../lib/store';
import { DOC_CATEGORIES, NA } from '../lib/types';
import { Na, PageTitle, SourceBlock, StatusBadge } from '../components/bits';
import { SearchBox } from '../components/SearchBox';

const Wrap = ({ children }: { children: React.ReactNode }) => <div className="h-full overflow-auto"><div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div></div>;
const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) => (
  <div className="min-w-[150px] flex-1"><label className="label">{label}</label>
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}><option value="">Barchasi</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
);

export function PartsCatalogPage() {
  const { catalog, asmById } = useData();
  const showPart = useUI((s) => s.showPart);
  const [f, setF] = useState({ asm: '', type: '', mat: '', pos: '' });
  const rows = useMemo(() => catalog.parts.filter((p) =>
    (!f.asm || p.assembly_id === f.asm) && (!f.type || p.part_type === f.type) &&
    (!f.mat || p.material === f.mat) && (!f.pos || (p.position_number ?? '').toLowerCase().includes(f.pos.toLowerCase()))), [catalog.parts, f]);
  const types = [...new Set(catalog.parts.map((p) => p.part_type).filter(Boolean))] as string[];
  const mats = [...new Set(catalog.parts.map((p) => p.material).filter(Boolean))] as string[];
  return (
    <Wrap>
      <PageTitle title="Ehtiyot qismlar katalogi" sub={`${catalog.machine.code} · ${rows.length} / ${catalog.parts.length} ta detal · qatorni bosing — 3D modelda ko‘rsatiladi`} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select label="Yig‘ma birlik" value={f.asm} onChange={(v) => setF({ ...f, asm: v })} options={catalog.assemblies.map((a) => [a.id, a.name])} />
        <Select label="Detal turi" value={f.type} onChange={(v) => setF({ ...f, type: v })} options={types.map((t) => [t, t])} />
        <Select label="Material" value={f.mat} onChange={(v) => setF({ ...f, mat: v })} options={mats.map((t) => [t, t])} />
        <div className="min-w-[150px] flex-1"><label className="label">Pozitsiya</label><input className="input" value={f.pos} onChange={(e) => setF({ ...f, pos: e.target.value })} placeholder="№" /></div>
      </div>
      <div className="overflow-x-auto rounded border border-line bg-panel">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-line bg-raised/60"><tr>{['№', 'Detal nomi', 'Part ID', 'Katalog raqami', 'Pozitsiya', 'Miqdor', 'Material', 'Yig‘ma birlik', 'Holat'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id} className="cursor-pointer border-b border-line/60 hover:bg-raised/70" onClick={() => showPart(p.part_id)}>
                <td className="td text-mute">{i + 1}</td>
                <td className="td font-medium">{p.name}{p.name_ru && <div className="text-xs font-normal text-mute">{p.name_ru}</div>}</td>
                <td className="td font-mono text-xs text-accent">{p.part_id}</td>
                <td className="td font-mono text-xs">{p.part_number ?? <Na />}</td>
                <td className="td font-mono text-xs">{p.position_number ?? <Na />}</td>
                <td className="td">{p.quantity ?? <Na />}</td>
                <td className="td">{p.material ?? <Na />}</td>
                <td className="td">{p.assembly_id ? asmById.get(p.assembly_id)?.name : <Na />}</td>
                <td className="td"><StatusBadge status={p.data_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Wrap>
  );
}

export function AssembliesPage() {
  const { catalog } = useData();
  const { go, toggleExplode, focusAssembly, setHighlightAsm, reset } = useUI();
  return (
    <Wrap>
      <PageTitle title="Yig‘ma birliklar" sub="Birlikni 3D modelda ko‘rish yoki qismlarga ajratish (exploded view)" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.assemblies.map((a) => {
          const ps = catalog.parts.filter((p) => p.assembly_id === a.id);
          return (
            <div key={a.id} className="rounded border border-line bg-panel p-4">
              <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{a.name}</h3><span className="chip">{ps.length} detal</span></div>
              {a.name_ru && <div className="text-sm text-mute">{a.name_ru}</div>}
              <div className="mt-1 font-mono text-xs">{a.code ?? <Na />}</div>
              <div className="mt-2"><StatusBadge status={a.data_status} /></div>
              <ul className="mt-3 max-h-28 overflow-auto text-xs text-mute">{ps.map((p) => <li key={p.id}>· {p.name}</li>)}</ul>
              <div className="mt-3 flex gap-2">
                <button className="btn flex-1" onClick={() => { reset(); go('home'); setHighlightAsm(a.id); focusAssembly(ps.map((p) => p.part_id)); }}>3D da ko‘rish</button>
                <button className="btn flex-1" disabled={ps.length < 2} onClick={() => { reset(); go('home'); setTimeout(() => toggleExplode(a.id), 300); }}>Exploded</button>
              </div>
              {a.source_url && <SourceBlock s={a} />}
            </div>
          );
        })}
      </div>
    </Wrap>
  );
}

export function DocumentsPage() {
  const { catalog, partByPartId } = useData();
  const openPdf = useUI((s) => s.openPdf);
  const showPart = useUI((s) => s.showPart);
  const [cat, setCat] = useState('');
  const docs = catalog.documents.filter((d) => !cat || d.category === cat);
  const partsOf = (id: string) => catalog.part_documents.filter((x) => x.document_id === id);
  return (
    <Wrap>
      <PageTitle title="Hujjatlar" sub="Har bir hujjat detallarga part_documents orqali bog‘lanadi (hujjat → sahifa → detal)" />
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={`btn ${!cat ? 'btn-on' : ''}`} onClick={() => setCat('')}>Barchasi</button>
        {Object.entries(DOC_CATEGORIES).map(([k, c]) => <button key={k} className={`btn ${cat === k ? 'btn-on' : ''}`} onClick={() => setCat(k)}>{c.icon} {c.label}</button>)}
      </div>
      {!docs.length && <div className="text-sm"><Na /></div>}
      <div className="grid gap-3 md:grid-cols-2">
        {docs.map((d) => (
          <div key={d.id} className="rounded border border-line bg-panel p-4">
            <div className="text-xs text-mute">{DOC_CATEGORIES[d.category]?.icon} {DOC_CATEGORIES[d.category]?.label ?? d.category}{d.is_demo && <span className="ml-2 rounded border border-amber-500/60 px-1 text-amber-500">DEMO</span>}</div>
            <h3 className="font-semibold">{d.title}</h3>
            <div className="font-mono text-xs text-mute">{d.document_number ?? NA} {d.total_pages ? `· ${d.total_pages} bet` : ''}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {d.file_url && <button className="btn-primary" onClick={() => openPdf(d.id, 1)}>Ochish</button>}
              {d.source_url && <a className="btn" href={d.source_url} target="_blank" rel="noreferrer">Tashqi manba ↗</a>}
              {!d.file_url && !d.source_url && <Na />}
            </div>
            {partsOf(d.id).length > 0 && (
              <div className="mt-3 text-xs"><div className="label">Bog‘langan detallar</div>
                {partsOf(d.id).map((l) => { const p = catalog.parts.find((x) => x.id === l.part_id); return p && (
                  <button key={l.id} className="mr-1 mb-1 rounded border border-line px-1.5 py-0.5 hover:border-accent" onClick={() => showPart(partByPartId.get(p.part_id)!.part_id)}>
                    {p.part_number ?? p.part_id}{l.page ? ` · b.${l.page}` : ''}</button>); })}
              </div>
            )}
            <SourceBlock s={d} />
          </div>
        ))}
      </div>
    </Wrap>
  );
}

export function SearchPage() {
  return <Wrap><PageTitle title="Qidiruv" sub="Nom (uz/ru), Part ID, katalog raqami, chizma raqami, pozitsiya, yig‘ma birlik, material" /><div className="max-w-3xl"><SearchBox /></div></Wrap>;
}

export function SpecsPage() {
  const { catalog } = useData();
  const m = catalog.machine;
  return (
    <Wrap>
      <PageTitle title={`Texnik ma'lumotlar — ${m.code}`} sub={m.name} />
      <div className="mb-3 rounded border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-500">
        Quyidagi qiymatlar veb-qidiruv natijalaridan olingan (ikkilamchi manba) va asl hujjat bilan hali tekshirilmagan. Manbasi topilmagan parametrlar kiritilmagan.
      </div>
      <div className="overflow-x-auto rounded border border-line bg-panel">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-line bg-raised/60"><tr><th className="th">Parametr</th><th className="th">Qiymat</th><th className="th">Birlik</th><th className="th">Manba</th></tr></thead>
          <tbody>
            {(m.specs ?? []).map((s, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="td">{s.label}</td><td className="td font-mono">{s.value}</td><td className="td text-mute">{s.unit ?? ''}</td>
                <td className="td text-xs">{s.source_url ? <a className="text-accent underline" href={s.source_url} target="_blank" rel="noreferrer">{s.source_document ?? s.source_url}</a> : <Na />}</td>
              </tr>
            ))}
            {!(m.specs ?? []).length && <tr><td className="td" colSpan={4}><Na /></td></tr>}
          </tbody>
        </table>
      </div>
      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-mute">Boshqa mashinalar (kelgusi versiyalar)</h2>
      <div className="flex flex-wrap gap-2">{catalog.machines.map((x) => <span key={x.id} className={`chip ${x.id === m.id ? '!border-accent !text-accent' : ''}`}>{x.code} · {x.status}</span>)}</div>
    </Wrap>
  );
}
