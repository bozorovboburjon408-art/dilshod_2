import { useState } from 'react';
import { useData } from '../lib/data';
import { useUI } from '../lib/store';
import { DOC_CATEGORIES } from '../lib/types';
import { Field, Na, SourceBlock, StatusBadge } from './bits';
import { DrawingView } from './Drawing';
import { PartMini3D } from './PartMini3D';

type Tab = 'info' | 'repair' | 'docs' | 'drawing' | 'model';
const TABS: [Tab, string][] = [['info', 'Ma‘lumot'], ['repair', 'Ta‘mirlash'], ['docs', 'PDF hujjat'], ['drawing', '2D chizma'], ['model', '3D model']];

export function PartPanel() {
  const { catalog, partByPartId, asmById, modelUrl } = useData();
  const { selectedId, panelOpen, closePanel, openPdf, toggleExplode, go } = useUI();
  const [tab, setTab] = useState<Tab>('info');
  const part = selectedId ? partByPartId.get(selectedId) : null;
  if (!panelOpen || !part) return null;

  const asm = part.assembly_id ? asmById.get(part.assembly_id) : null;
  const docs = catalog.part_documents.filter((x) => x.part_id === part.id).map((x) => ({ link: x, doc: catalog.documents.find((d) => d.id === x.document_id)! })).filter((x) => x.doc);
  const drawings = catalog.part_drawings.filter((d) => d.part_id === part.id);
  const failures = catalog.failures.filter((f) => f.part_id === part.id);
  const repairs = catalog.repair_methods.filter((r) => r.part_id === part.id);
  const own3d = catalog.part_models.find((m) => m.part_id === part.id && m.is_active);
  const siblings = asm ? catalog.parts.filter((p) => p.assembly_id === asm.id).length : 0;

  return (
    <aside className="absolute inset-x-0 bottom-0 z-30 flex max-h-[55%] flex-col border-t border-line bg-panel/95 shadow-2xl backdrop-blur md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:border-l md:border-t-0">
      <div className="flex items-start gap-3 border-b border-line p-4">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] text-accent">{part.part_id}</div>
          <h2 className="text-base font-semibold uppercase leading-snug">{part.name}</h2>
          {part.name_ru && <div className="text-sm text-mute">{part.name_ru}</div>}
          <div className="mt-1.5"><StatusBadge status={part.data_status} /></div>
        </div>
        <button className="btn" onClick={closePanel} aria-label="Yopish">✕</button>
      </div>
      <div className="flex overflow-x-auto border-b border-line">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wider ${tab === k ? 'border-b-2 border-accent text-accent' : 'text-mute hover:text-ink'}`}>{l}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'info' && (
          <>
            <Field label="Part ID" value={part.part_id} mono />
            <Field label="Katalog raqami" value={part.part_number} mono />
            <Field label="Chizma raqami" value={part.drawing_number} mono />
            <Field label="Pozitsiya raqami" value={part.position_number} mono />
            <Field label="Yig‘ma birligi" value={asm ? `${asm.name}${asm.code ? ` (${asm.code})` : ''}` : null} />
            <Field label="Ekskavatordagi miqdori" value={part.quantity} unit="dona" />
            <Field label="Materiali" value={part.material} />
            <Field label="Og‘irligi" value={part.weight} unit="kg" />
            <Field label="Asosiy o‘lchamlari" value={part.dimensions} />
            <Field label="Texnik vazifasi" value={part.function} />
            <Field label="Ishlash prinsipi" value={part.working_principle} />
            <Field label="Texnik xususiyatlari" value={part.specifications} />
            <Field label="Ekspluatatsiya talablari" value={part.operating_requirements} />
            <Field label="Tavsif" value={part.description} />
            <Field label="3D obyekt (model_object_id)" value={part.model_object_id} mono />
            <SourceBlock s={part} />
          </>
        )}
        {tab === 'repair' && (
          <>
            <Field label="Yeyilish chegarasi" value={part.wear_limit} />
            <Field label="Texnik xizmat" value={part.maintenance} />
            <Field label="Ta‘mirlash usuli" value={part.repair_method} />
            <Field label="Montaj / demontaj ma‘lumotlari" value={part.mounting_info} />
            <div className="label mt-4">Ehtimoliy nosozliklar va sabablari</div>
            {!failures.length ? <Na /> : failures.map((f) => (
              <div key={f.id} className="mb-2 rounded border border-line p-2 text-sm">
                <div className="font-medium">{f.description ?? <Na />}</div>
                <div className="text-mute">Belgilari: {f.symptoms ?? <Na />}</div>
                <div className="text-mute">Sabablari: {f.causes ?? <Na />}</div>
                <SourceBlock s={f} />
              </div>
            ))}
            <div className="label mt-4">Ta‘mirlash usullari</div>
            {!repairs.length ? <Na /> : repairs.map((r) => (
              <div key={r.id} className="mb-2 rounded border border-line p-2 text-sm">
                <div className="font-medium">{r.title ?? 'Usul'}</div>
                <div className="whitespace-pre-line">{r.method ?? <Na />}</div>
                <div className="text-mute">Montaj: {r.mount_info ?? <Na />}</div>
                <div className="text-mute">Demontaj: {r.dismount_info ?? <Na />}</div>
                <div className="text-mute">Asboblar: {r.tools ?? <Na />}</div>
                <SourceBlock s={r} />
              </div>
            ))}
          </>
        )}
        {tab === 'docs' && (
          !docs.length ? <Na /> : docs.map(({ link, doc }) => (
            <div key={link.id} className="mb-3 rounded border border-line p-3 text-sm">
              <div className="text-[11px] text-mute">{DOC_CATEGORIES[doc.category]?.icon} {DOC_CATEGORIES[doc.category]?.label ?? doc.category}</div>
              <div className="font-medium">{doc.title}</div>
              <div className="font-mono text-[11px] text-mute">{doc.document_number ?? ''} · sahifa: {link.page ?? <Na />}</div>
              {link.note && <div className="mt-1 text-xs">{link.note}</div>}
              <div className="mt-2">
                {doc.file_url ? <button className="btn-primary" onClick={() => openPdf(doc.id, link.page ?? 1)}>Hujjatni ochish{link.page ? ` · ${link.page}-bet` : ''}</button>
                  : doc.source_url ? <a className="btn-primary inline-block" href={doc.source_url} target="_blank" rel="noreferrer">Hujjatni ochish (tashqi manba)</a> : <Na />}
              </div>
              <SourceBlock s={doc} />
            </div>
          ))
        )}
        {tab === 'drawing' && <DrawingView part={part} drawings={drawings} />}
        {tab === 'model' && <PartMini3D part={part} modelUrl={own3d ? modelUrl(own3d) : null} />}
      </div>
      <div className="flex gap-2 border-t border-line p-3">
        {siblings > 1 && <button className="btn flex-1" onClick={() => toggleExplode(asm!.id)}>Birlikni yoyish ({siblings})</button>}
        <button className="btn flex-1" onClick={() => go('parts')}>Katalogga</button>
      </div>
    </aside>
  );
}
