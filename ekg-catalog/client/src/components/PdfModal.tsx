import { useData } from '../lib/data';
import { useUI } from '../lib/store';
import { PdfViewer } from './PdfViewer';

export function PdfModal() {
  const pdf = useUI((s) => s.pdf);
  const close = useUI((s) => s.closePdf);
  const { catalog } = useData();
  const doc = pdf ? catalog.documents.find((d) => d.id === pdf.documentId) : null;
  if (!pdf || !doc?.file_url) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 p-2 md:p-6" onClick={close}>
      <div className="mx-auto h-full max-w-5xl overflow-hidden rounded border border-line" onClick={(e) => e.stopPropagation()}>
        <PdfViewer url={doc.file_url} page={pdf.page} title={`${doc.title}${doc.is_demo ? ' — DEMO' : ''}`} onClose={close} />
      </div>
    </div>
  );
}
