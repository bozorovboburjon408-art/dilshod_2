import { DataProvider, useData } from './lib/data';
import { ROUTES, useUI, type Route } from './lib/store';
import { Viewer } from './viewer/Viewer';
import { AssembliesPage, DocumentsPage, PartsCatalogPage, SearchPage, SpecsPage } from './pages/Pages';
import { AdminPage } from './pages/Admin';
import { PdfModal } from './components/PdfModal';

const MENU: [Route, string][] = [
  ['home', '3D MODEL'], ['parts', 'EHTIYOT QISMLAR'], ['assemblies', 'YIG‘MA BIRLIKLAR'],
  ['documents', 'HUJJATLAR'], ['search', 'QIDIRUV'], ['specs', 'TEXNIK MA’LUMOTLAR'],
];

function Header() {
  const { route, go, theme, toggleTheme } = useUI();
  const { catalog } = useData();
  return (
    <header className="z-40 flex shrink-0 items-center gap-4 border-b border-line bg-panel px-3 py-2 md:px-5">
      <button onClick={() => go('home')} className="flex items-baseline gap-1.5 whitespace-nowrap text-sm font-bold tracking-[0.18em]">
        <span className="inline-block h-3 w-3 -translate-y-px bg-accent" />EKG-10 <span className="font-medium text-mute">DIGITAL</span>
      </button>
      <nav className="flex flex-1 gap-0.5 overflow-x-auto">
        {MENU.map(([r, l]) => (
          <button key={r} onClick={() => go(r)} className={`whitespace-nowrap rounded px-2.5 py-1.5 text-[11px] font-semibold tracking-wider ${route === r ? 'bg-accent text-white' : 'text-mute hover:bg-raised hover:text-ink'}`}>{l}</button>
        ))}
      </nav>
      <span className="chip hidden lg:inline-block" title="Ma'lumotlar bazasi">{catalog.store}</span>
      <button className="btn" onClick={() => go('admin')} title="Admin">⚙</button>
      <button className="btn" onClick={toggleTheme} aria-label="Tema">{theme === 'dark' ? '☀' : '☾'}</button>
    </header>
  );
}

function Page() {
  const route = useUI((s) => s.route);
  const pages: Record<Route, JSX.Element> = {
    home: <Viewer />, parts: <PartsCatalogPage />, assemblies: <AssembliesPage />, documents: <DocumentsPage />,
    search: <SearchPage />, specs: <SpecsPage />, admin: <AdminPage />,
  };
  return pages[ROUTES.includes(route) ? route : 'home'];
}

export default function App() {
  return (
    <DataProvider>
      <div className="flex h-full flex-col">
        <Header />
        <main className="min-h-0 flex-1"><Page /></main>
      </div>
      <PdfModal />
    </DataProvider>
  );
}
