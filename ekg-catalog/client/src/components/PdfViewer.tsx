import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export function PdfViewer({ url, page: initial = 1, onClose, title }: { url: string; page?: number; onClose?: () => void; title?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(initial);
  const [scale, setScale] = useState(1.3);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let dead = false; setDoc(null); setErr(null);
    pdfjs.getDocument(url).promise.then((d) => { if (!dead) { setDoc(d); setPage(Math.min(Math.max(initial, 1), d.numPages)); } }, (e) => !dead && setErr(String(e?.message ?? e)));
    return () => { dead = true; };
  }, [url, initial]);

  useEffect(() => {
    if (!doc || !canvas.current) return;
    let task: RenderTask | null = null, dead = false;
    void doc.getPage(page).then((p) => {
      if (dead || !canvas.current) return;
      const vp = p.getViewport({ scale: scale * (window.devicePixelRatio || 1) });
      const c = canvas.current; c.width = vp.width; c.height = vp.height;
      c.style.width = `${vp.width / (window.devicePixelRatio || 1)}px`;
      task = p.render({ canvasContext: c.getContext('2d')!, viewport: vp });
      task.promise.catch(() => undefined);
    });
    return () => { dead = true; task?.cancel(); };
  }, [doc, page, scale]);

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-panel px-3 py-2 text-xs">
        <div className="mr-auto min-w-0 truncate font-semibold">{title ?? 'PDF'}</div>
        <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
        <span className="font-mono">{page} / {doc?.numPages ?? '…'}</span>
        <button className="btn" disabled={!doc || page >= doc.numPages} onClick={() => setPage((p) => p + 1)}>›</button>
        <button className="btn" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}>−</button>
        <button className="btn" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>＋</button>
        <a className="btn" href={url} target="_blank" rel="noreferrer">Yangi oynada</a>
        {onClose && <button className="btn btn-on" onClick={onClose}>✕ Yopish</button>}
      </div>
      <div className="flex-1 overflow-auto p-4 text-center">
        {err ? <div className="text-sm text-mute">PDF ochilmadi: {err}</div> : !doc ? <div className="text-sm text-mute">Yuklanmoqda…</div> : <canvas ref={canvas} className="mx-auto bg-white shadow-xl" />}
      </div>
    </div>
  );
}
