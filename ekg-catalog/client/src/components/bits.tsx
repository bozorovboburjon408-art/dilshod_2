import type { ReactNode } from 'react';
import { NA, STATUS_LABEL, type Source } from '../lib/types';

export const Na = () => <span className="italic text-mute/70">{NA}</span>;

export function Field({ label, value, mono, unit }: { label: string; value: ReactNode; mono?: boolean; unit?: string }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className="border-b border-line/60 py-2">
      <div className="label !mb-0.5">{label}</div>
      <div className={`whitespace-pre-line text-sm ${mono ? 'font-mono' : ''}`}>{empty ? <Na /> : <>{value}{unit ? ` ${unit}` : ''}</>}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const c = status === 'verified' ? 'border-emerald-500/60 text-emerald-500' : status === 'secondary' ? 'border-amber-500/60 text-amber-500' : 'border-line text-mute';
  return <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${c}`}>{STATUS_LABEL[status] ?? status}</span>;
}

/** Spec section 17: SOURCE / SOURCE URL / DOCUMENT NAME / PAGE NUMBER for every datum. */
export function SourceBlock({ s, title = 'Manba' }: { s: Source; title?: string }) {
  const any = s.source || s.source_url || s.source_document || s.source_page;
  return (
    <div className="mt-3 rounded border border-line/70 bg-raised/50 p-2 text-[11px] leading-5">
      <div className="label !mb-0.5">{title}</div>
      {!any ? <Na /> : (
        <>
          <div><span className="text-mute">Source: </span>{s.source ?? <Na />}</div>
          <div className="truncate"><span className="text-mute">Source URL: </span>{s.source_url ? <a className="text-accent underline" href={s.source_url} target="_blank" rel="noreferrer">{s.source_url}</a> : <Na />}</div>
          <div><span className="text-mute">Document: </span>{s.source_document ?? <Na />}</div>
          <div><span className="text-mute">Page: </span>{s.source_page ?? <Na />}</div>
        </>
      )}
    </div>
  );
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="mr-auto"><h1 className="text-lg font-semibold uppercase tracking-wider">{title}</h1>{sub && <p className="text-xs text-mute">{sub}</p>}</div>
      {right}
    </div>
  );
}
