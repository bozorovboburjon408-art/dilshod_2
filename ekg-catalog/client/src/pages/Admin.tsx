import { useEffect, useMemo, useState } from 'react';
import { GLTFLoader, OBJLoader } from 'three-stdlib';
import { adminApi, getToken } from '../lib/api';
import { useData } from '../lib/data';
import { PageTitle } from '../components/bits';
import { EKG10_NODES } from '../model/layout';
import type { Part } from '../lib/types';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
interface F { key: string; label: string; type?: 'text' | 'area' | 'num' | 'select' | 'file' | 'bool' | 'json'; options?: [string, string][]; accept?: string; wide?: boolean; readonly?: boolean }
const SRC: F[] = [
  { key: 'source', label: 'SOURCE' }, { key: 'source_url', label: 'SOURCE URL' },
  { key: 'source_document', label: 'DOCUMENT NAME' }, { key: 'source_page', label: 'PAGE NUMBER' },
];

function Login({ onDone }: { onDone: () => void }) {
  const [u, setU] = useState('admin'); const [p, setP] = useState(''); const [err, setErr] = useState('');
  return (
    <form className="mx-auto mt-16 w-[min(22rem,92%)] space-y-3 rounded border border-line bg-panel p-5" onSubmit={async (e) => { e.preventDefault(); try { await adminApi.login(u, p); onDone(); } catch (x) { setErr((x as Error).message); } }}>
      <h1 className="text-sm font-semibold uppercase tracking-wider">Admin login</h1>
      <div><label className="label">Login</label><input className="input" value={u} onChange={(e) => setU(e.target.value)} /></div>
      <div><label className="label">Parol</label><input className="input" type="password" value={p} onChange={(e) => setP(e.target.value)} autoFocus /></div>
      {err && <div className="text-xs text-red-500">{err}</div>}
      <button className="btn-primary w-full">Kirish</button>
      <p className="text-[11px] text-mute">Dev standarti: admin / admin123. Productionda ADMIN_USER, ADMIN_PASSWORD o‘zgaruvchilarini o‘rnating.</p>
    </form>
  );
}

function Crud({ table, rows, fields, listCols, defaults = {}, makeId, onChanged }: { table: string; rows: Row[]; fields: F[]; listCols: string[]; defaults?: Row; makeId?: (f: Row) => string; onChanged: () => Promise<void> }) {
  const [form, setForm] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const label = (k: string) => fields.find((f) => f.key === k)?.label ?? k;
  const show = (r: Row, k: string) => { const f = fields.find((x) => x.key === k); const v = r[k]; if (f?.type === 'select') return f.options?.find(([o]) => o === v)?.[1] ?? v; return typeof v === 'object' && v ? JSON.stringify(v).slice(0, 40) : String(v ?? '—'); };

  async function save() {
    if (!form) return; setBusy(true); setMsg('');
    try {
      const row = { ...form }; row.id ||= makeId ? makeId(row) : `${table.slice(0, 4)}-${Date.now().toString(36)}`;
      await adminApi.upsert(table, row); await onChanged(); setForm(null);
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  async function del(r: Row) { if (confirm(`O‘chirilsinmi? ${r.id}`)) { await adminApi.remove(table, r.id); await onChanged(); } }
  async function upload(f: F, file: File) {
    setBusy(true); setMsg('');
    try {
      const r = await adminApi.upload(file);
      setForm((x) => ({ ...x, [f.key]: r.url, ...(table === 'part_models' ? { format: r.ext === 'stp' ? 'step' : r.ext, name: x?.name || r.name } : {}), ...(table === 'part_drawings' ? { file_type: r.ext, title: x?.title || r.name } : {}), ...(table === 'documents' ? { title: x?.title || r.name } : {}) }));
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2"><button className="btn-primary" onClick={() => setForm({ ...defaults })}>+ Yangi</button><span className="text-xs text-mute">{rows.length} ta yozuv</span></div>
      {form && (
        <div className="mb-4 rounded border border-accent/60 bg-panel p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key} className={f.wide || f.type === 'area' || f.type === 'json' ? 'sm:col-span-2 lg:col-span-3' : ''}>
                <label className="label">{f.label}</label>
                {f.type === 'area' || f.type === 'json' ? <textarea className="input min-h-[70px] font-sans" value={typeof form[f.key] === 'object' && form[f.key] ? JSON.stringify(form[f.key], null, 1) : form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
                  : f.type === 'select' ? <select className="input" value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)}><option value="">— yo‘q —</option>{f.options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  : f.type === 'bool' ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form[f.key]} onChange={(e) => set(f.key, e.target.checked)} /> Ha</label>
                  : f.type === 'file' ? <div><input className="input mb-1" value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder="/files/…" /><input type="file" accept={f.accept} className="text-xs" onChange={(e) => e.target.files?.[0] && void upload(f, e.target.files[0])} /></div>
                  : <input className="input" type={f.type === 'num' ? 'number' : 'text'} step="any" disabled={f.readonly} value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />}
              </div>
            ))}
          </div>
          {msg && <div className="mt-2 text-xs text-red-500">{msg}</div>}
          <div className="mt-4 flex gap-2"><button className="btn-primary" disabled={busy} onClick={() => void save()}>{busy ? '…' : 'Saqlash'}</button><button className="btn" onClick={() => setForm(null)}>Bekor</button></div>
        </div>
      )}
      <div className="overflow-x-auto rounded border border-line bg-panel">
        <table className="w-full"><thead className="border-b border-line bg-raised/60"><tr>{listCols.map((c) => <th key={c} className="th">{label(c)}</th>)}<th className="th" /></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-b border-line/60">{listCols.map((c) => <td key={c} className="td max-w-[260px] truncate">{show(r, c)}</td>)}
              <td className="td whitespace-nowrap text-right"><button className="btn mr-1" onClick={() => setForm({ ...r })}>Tahrir</button><button className="btn" onClick={() => void del(r)}>✕</button></td></tr>))}
            {!rows.length && <tr><td className="td text-mute" colSpan={listCols.length + 1}>Bo‘sh</td></tr>}</tbody></table>
      </div>
    </div>
  );
}

/** Link 3D object/node names to part_id. Node list comes from the active GLB/OBJ, or the built-in placeholder. */
function Mapping({ onChanged }: { onChanged: () => Promise<void> }) {
  const { catalog, machineModel, modelUrl } = useData();
  const [nodes, setNodes] = useState<string[]>(EKG10_NODES.map((n) => n.id));
  const [msg, setMsg] = useState('');
  const url = machineModel ? modelUrl(machineModel) : null;
  useEffect(() => {
    if (!url) { setNodes(EKG10_NODES.map((n) => n.id)); return; }
    const done = (root: { traverse: (f: (o: { name: string }) => void) => void }) => { const s = new Set<string>(); root.traverse((o) => o.name && s.add(o.name)); setNodes([...s]); };
    if (machineModel?.format === 'obj' && !machineModel.converted_url) new OBJLoader().load(url, done, undefined, (e) => setMsg(String(e)));
    else new GLTFLoader().load(url, (g) => done(g.scene), undefined, (e) => setMsg(String(e)));
  }, [url, machineModel]);
  const owner = useMemo(() => new Map(catalog.parts.filter((p) => p.model_object_id).map((p) => [p.model_object_id as string, p])), [catalog.parts]);

  async function assign(node: string, partId: string) {
    setMsg('');
    try {
      const prev = owner.get(node);
      if (prev && prev.id !== partId) await adminApi.upsert('parts', { id: prev.id, model_object_id: null });
      if (partId) {
        const p = catalog.parts.find((x) => x.id === partId) as Part;
        for (const other of catalog.parts.filter((x) => x.id !== p.id && x.model_object_id === node)) await adminApi.upsert('parts', { id: other.id, model_object_id: null });
        await adminApi.upsert('parts', { id: p.id, model_object_id: node });
      }
      await onChanged();
    } catch (e) { setMsg((e as Error).message); }
  }
  return (
    <div>
      <p className="mb-3 text-xs text-mute">{url ? `Faol model: ${machineModel?.name ?? url}` : 'Faol GLB yo‘q — ichki placeholder model nodelari ko‘rsatilmoqda.'} Nodeni DB dagi detal (part_id) bilan bog‘lang.</p>
      {msg && <div className="mb-2 text-xs text-red-500">{msg}</div>}
      <div className="overflow-x-auto rounded border border-line bg-panel">
        <table className="w-full"><thead className="border-b border-line bg-raised/60"><tr><th className="th">3D Object (node)</th><th className="th">Database part_id</th></tr></thead>
          <tbody>{nodes.map((n) => (
            <tr key={n} className="border-b border-line/60"><td className="td font-mono text-xs">{n}</td>
              <td className="td"><select className="input !py-1" value={owner.get(n)?.id ?? ''} onChange={(e) => void assign(n, e.target.value)}><option value="">— bog‘lanmagan —</option>{catalog.parts.map((p) => <option key={p.id} value={p.id}>{p.part_id} · {p.name}</option>)}</select></td></tr>))}</tbody></table>
      </div>
    </div>
  );
}

export function AdminPage() {
  const { catalog, reload } = useData();
  const [authed, setAuthed] = useState(!!getToken());
  const [tab, setTab] = useState('parts');
  const [all, setAll] = useState<Record<string, Row[]>>({});
  const refreshAll = async () => {
    await reload();
    try { const t = ['materials', 'machines'] as const; const res = await Promise.all(t.map(async (k) => [k, await fetch(`/api/admin/${k}`, { headers: { authorization: `Bearer ${getToken()}` } }).then((r) => r.json())])); setAll(Object.fromEntries(res)); } catch { /* ignore */ }
  };
  useEffect(() => { if (authed) void refreshAll(); }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!authed) return <div className="h-full overflow-auto"><Login onDone={() => setAuthed(true)} /></div>;

  const mid = catalog.machine.id;
  const partOpts: [string, string][] = catalog.parts.map((p) => [p.id, `${p.part_id} · ${p.name}`]);
  const asmOpts: [string, string][] = catalog.assemblies.map((a) => [a.id, a.name]);
  const docOpts: [string, string][] = catalog.documents.map((d) => [d.id, d.title]);
  const machOpts: [string, string][] = catalog.machines.map((m) => [m.id, m.code]);
  const cat: [string, string][] = [['operation_manual', 'Ekspluatatsiya qo‘llanmasi'], ['parts_catalog', 'Ehtiyot qismlar katalogi'], ['drawings', 'Chizmalar'], ['repair_manual', 'Ta‘mirlash qo‘llanmasi'], ['maintenance', 'Texnik xizmat ko‘rsatish'], ['tech_params', 'Texnik parametrlar']];
  const status: [string, string][] = [['verified', 'verified'], ['secondary', 'secondary'], ['placeholder', 'placeholder']];
  const common = { onChanged: refreshAll };

  const tabs: Record<string, [string, JSX.Element]> = {
    parts: ['Detallar', <Crud key="p" table="parts" rows={catalog.parts} listCols={['part_id', 'name', 'part_number', 'assembly_id', 'model_object_id', 'data_status']} defaults={{ machine_id: mid, data_status: 'placeholder' }} makeId={(f) => f.part_id} {...common}
      fields={[
        { key: 'part_id', label: 'Part ID (unikal)' }, { key: 'machine_id', label: 'Mashina', type: 'select', options: machOpts }, { key: 'assembly_id', label: 'Yig‘ma birlik', type: 'select', options: asmOpts },
        { key: 'name', label: 'Nomi (uz)' }, { key: 'name_ru', label: 'Nomi (ru)' }, { key: 'part_type', label: 'Detal turi' },
        { key: 'part_number', label: 'Katalog raqami' }, { key: 'drawing_number', label: 'Chizma raqami' }, { key: 'position_number', label: 'Pozitsiya raqami' },
        { key: 'quantity', label: 'Miqdor', type: 'num' }, { key: 'material', label: 'Material' }, { key: 'weight', label: 'Og‘irligi (kg)', type: 'num' },
        { key: 'dimensions', label: 'O‘lchamlar' }, { key: 'model_object_id', label: '3D object (model_object_id)' }, { key: 'explode_order', label: 'Exploded tartibi', type: 'num' },
        { key: 'data_status', label: 'Ma‘lumot holati', type: 'select', options: status },
        { key: 'description', label: 'Tavsif', type: 'area' }, { key: 'function', label: 'Texnik vazifasi', type: 'area' }, { key: 'working_principle', label: 'Ishlash prinsipi', type: 'area' },
        { key: 'specifications', label: 'Texnik xususiyatlari', type: 'area' }, { key: 'operating_requirements', label: 'Ekspluatatsiya talablari', type: 'area' },
        { key: 'wear_limit', label: 'Yeyilish chegarasi', type: 'area' }, { key: 'maintenance', label: 'Texnik xizmat', type: 'area' }, { key: 'repair_method', label: 'Ta‘mirlash usuli', type: 'area' }, { key: 'mounting_info', label: 'Montaj/demontaj', type: 'area' }, ...SRC]} />],
    assemblies: ['Yig‘ma birliklar', <Crud key="a" table="assemblies" rows={catalog.assemblies} listCols={['code', 'name', 'name_ru', 'data_status']} defaults={{ machine_id: mid, data_status: 'placeholder' }} {...common}
      fields={[{ key: 'machine_id', label: 'Mashina', type: 'select', options: machOpts }, { key: 'code', label: 'Birlik raqami' }, { key: 'name', label: 'Nomi (uz)' }, { key: 'name_ru', label: 'Nomi (ru)' }, { key: 'sort', label: 'Tartib', type: 'num' }, { key: 'data_status', label: 'Holat', type: 'select', options: status }, { key: 'explode_vector', label: 'Explode vektori [x,y,z]', type: 'json' }, { key: 'explode_lift', label: 'Explode ko‘tarish (Y)', type: 'num' }, { key: 'description', label: 'Tavsif', type: 'area' }, ...SRC]} />],
    documents: ['Hujjatlar', <Crud key="d" table="documents" rows={catalog.documents} listCols={['category', 'title', 'document_number', 'file_url']} defaults={{ machine_id: mid }} {...common}
      fields={[{ key: 'machine_id', label: 'Mashina', type: 'select', options: machOpts }, { key: 'category', label: 'Kategoriya', type: 'select', options: cat }, { key: 'title', label: 'Nomi' }, { key: 'document_number', label: 'Hujjat raqami' }, { key: 'file_url', label: 'PDF fayl', type: 'file', accept: '.pdf' }, { key: 'language', label: 'Til' }, { key: 'total_pages', label: 'Betlar soni', type: 'num' }, { key: 'is_demo', label: 'Demo hujjat', type: 'bool' }, ...SRC]} />],
    part_documents: ['Hujjat ↔ detal', <Crud key="pd" table="part_documents" rows={catalog.part_documents} listCols={['part_id', 'document_id', 'page']} {...common}
      fields={[{ key: 'part_id', label: 'Detal', type: 'select', options: partOpts }, { key: 'document_id', label: 'Hujjat', type: 'select', options: docOpts }, { key: 'page', label: 'Sahifa', type: 'num' }, { key: 'note', label: 'Izoh' }]} />],
    drawings: ['Chizmalar (2D)', <Crud key="dr" table="part_drawings" rows={catalog.part_drawings} listCols={['part_id', 'title', 'drawing_number', 'file_url']} {...common}
      fields={[{ key: 'part_id', label: 'Detal', type: 'select', options: partOpts }, { key: 'title', label: 'Nomi' }, { key: 'drawing_number', label: 'Chizma raqami' }, { key: 'file_url', label: 'Fayl (PNG/JPG/SVG/PDF)', type: 'file', accept: '.png,.jpg,.jpeg,.svg,.webp,.pdf' }, { key: 'file_type', label: 'Fayl turi' }, ...SRC]} />],
    models: ['3D modellar', <Crud key="m" table="part_models" rows={catalog.part_models} listCols={['name', 'part_id', 'format', 'conversion_status', 'is_active']} defaults={{ machine_id: mid, is_active: true }} {...common}
      fields={[{ key: 'machine_id', label: 'Mashina', type: 'select', options: machOpts }, { key: 'part_id', label: 'Detal (bo‘sh = butun mashina)', type: 'select', options: partOpts }, { key: 'name', label: 'Nomi' }, { key: 'file_url', label: 'Fayl: GLB / GLTF / OBJ / STEP', type: 'file', accept: '.glb,.gltf,.obj,.step,.stp' }, { key: 'format', label: 'Format', type: 'select', options: [['glb', 'GLB'], ['gltf', 'GLTF'], ['obj', 'OBJ'], ['step', 'STEP (serverda GLB ga konvert)']] }, { key: 'converted_url', label: 'Konvertatsiya natijasi (GLB)' }, { key: 'conversion_status', label: 'Konvertatsiya holati', readonly: true }, { key: 'conversion_message', label: 'Xabar', readonly: true }, { key: 'is_active', label: 'Faol', type: 'bool' }, ...SRC]} />],
    mapping: ['3D ↔ DB bog‘lash', <Mapping key="map" {...common} />],
    failures: ['Nosozliklar', <Crud key="f" table="failures" rows={catalog.failures} listCols={['part_id', 'description', 'causes']} {...common}
      fields={[{ key: 'part_id', label: 'Detal', type: 'select', options: partOpts }, { key: 'description', label: 'Nosozlik', type: 'area' }, { key: 'symptoms', label: 'Belgilari', type: 'area' }, { key: 'causes', label: 'Sabablari', type: 'area' }, { key: 'sort', label: 'Tartib', type: 'num' }, ...SRC]} />],
    repairs: ['Ta‘mirlash usullari', <Crud key="r" table="repair_methods" rows={catalog.repair_methods} listCols={['part_id', 'title']} {...common}
      fields={[{ key: 'part_id', label: 'Detal', type: 'select', options: partOpts }, { key: 'title', label: 'Nomi' }, { key: 'method', label: 'Usul', type: 'area' }, { key: 'mount_info', label: 'Montaj', type: 'area' }, { key: 'dismount_info', label: 'Demontaj', type: 'area' }, { key: 'tools', label: 'Asboblar', type: 'area' }, ...SRC]} />],
    materials: ['Materiallar', <Crud key="mat" table="materials" rows={all.materials ?? catalog.materials} listCols={['name', 'standard']} {...common}
      fields={[{ key: 'name', label: 'Nomi' }, { key: 'standard', label: 'Standart' }, { key: 'description', label: 'Tavsif', type: 'area' }, ...SRC]} />],
  };

  return (
    <div className="h-full overflow-auto"><div className="mx-auto max-w-7xl p-4 md:p-6">
      <PageTitle title="Admin panel" sub={`${catalog.machine.code} · baza: ${catalog.store}`} right={<button className="btn" onClick={() => { localStorage.removeItem('ekg-admin-token'); setAuthed(false); }}>Chiqish</button>} />
      <div className="mb-4 flex flex-wrap gap-1">{Object.entries(tabs).map(([k, [l]]) => <button key={k} className={`btn ${tab === k ? 'btn-on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tabs[tab][1]}
    </div></div>
  );
}
