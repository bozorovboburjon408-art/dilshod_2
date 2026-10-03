import { create } from 'zustand';

export type Route = 'home' | 'parts' | 'assemblies' | 'documents' | 'search' | 'specs' | 'admin';
export const ROUTES: Route[] = ['home', 'parts', 'assemblies', 'documents', 'search', 'specs', 'admin'];
const fromHash = (): Route => { const h = location.hash.replace(/^#\/?/, '') as Route; return ROUTES.includes(h) ? h : 'home'; };
const themeInit = (): 'dark' | 'light' => { try { return localStorage.getItem('ekg-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } };

interface UI {
  route: Route; go: (r: Route) => void;
  theme: 'dark' | 'light'; toggleTheme: () => void;
  selectedId: string | null; hoverId: string | null; panelOpen: boolean;
  highlightAsm: string | null;
  focus: { ids: string[]; nonce: number } | null;
  explode: { mode: 'off' | 'assembly' | 'all'; assemblyId: string | null };
  autoRotate: boolean; showParts: boolean;
  resetNonce: number; zoom: { dir: number; nonce: number };
  pdf: { documentId: string; page: number } | null;

  setHover: (id: string | null) => void;
  select: (id: string | null) => void;             // 1 click: highlight only
  openPanel: (id: string) => void;                 // 2 clicks: highlight + camera + info panel
  showPart: (id: string, panel?: boolean) => void; // from catalog/search: go to 3D, highlight, fly there
  closePanel: () => void;
  toggleAutoRotate: () => void; toggleShowParts: () => void;
  reset: () => void; zoomBy: (dir: number) => void;
  toggleExplode: (assemblyId?: string | null) => void;
  setHighlightAsm: (id: string | null) => void;
  focusAssembly: (partIds: string[]) => void;
  openPdf: (documentId: string, page?: number) => void; closePdf: () => void;
}

export const useUI = create<UI>((set, get) => ({
  route: fromHash(),
  go: (r) => { location.hash = r === 'home' ? '' : `/${r}`; set({ route: r }); },
  theme: themeInit(),
  toggleTheme: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('ekg-theme', theme); } catch { /* ignore */ }
    set({ theme });
  },
  selectedId: null, hoverId: null, panelOpen: false, highlightAsm: null, focus: null,
  explode: { mode: 'off', assemblyId: null }, autoRotate: false, showParts: false,
  resetNonce: 0, zoom: { dir: 0, nonce: 0 }, pdf: null,

  setHover: (hoverId) => set({ hoverId }),
  select: (id) => set({ selectedId: id, panelOpen: id ? get().panelOpen : false }),
  openPanel: (id) => set((s) => ({ selectedId: id, panelOpen: true, focus: { ids: [id], nonce: (s.focus?.nonce ?? 0) + 1 } })),
  showPart: (id, panel = true) => {
    get().go('home');
    set((s) => ({ selectedId: id, panelOpen: panel, focus: { ids: [id], nonce: (s.focus?.nonce ?? 0) + 1 } }));
  },
  closePanel: () => set({ panelOpen: false }),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  toggleShowParts: () => set((s) => ({ showParts: !s.showParts })),
  reset: () => set((s) => ({ resetNonce: s.resetNonce + 1, selectedId: null, panelOpen: false, highlightAsm: null, explode: { mode: 'off', assemblyId: null } })),
  zoomBy: (dir) => set((s) => ({ zoom: { dir, nonce: s.zoom.nonce + 1 } })),
  toggleExplode: (assemblyId = null) => set((s) => {
    const same = s.explode.mode !== 'off' && s.explode.assemblyId === (assemblyId ?? null);
    if (same) return { explode: { mode: 'off', assemblyId: null } };
    return { explode: assemblyId ? { mode: 'assembly', assemblyId } : { mode: 'all', assemblyId: null } };
  }),
  setHighlightAsm: (highlightAsm) => set({ highlightAsm }),
  focusAssembly: (ids) => set((s) => ({ focus: { ids, nonce: (s.focus?.nonce ?? 0) + 1 } })),
  openPdf: (documentId, page = 1) => set({ pdf: { documentId, page } }),
  closePdf: () => set({ pdf: null }),
}));

if (typeof window !== 'undefined') window.addEventListener('hashchange', () => useUI.setState({ route: fromHash() }));
