import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCatalog } from './api';
import type { Assembly, Catalog, Part, PartModel } from './types';

interface Ctx {
  catalog: Catalog; reload: () => Promise<void>;
  partByPartId: Map<string, Part>; partByNode: Map<string, Part>; asmById: Map<string, Assembly>;
  machineModel: PartModel | null; modelUrl: (m: PartModel) => string | null;
}
export const DataContext = createContext<Ctx | null>(null);
export const useData = () => { const c = useContext(DataContext); if (!c) throw new Error('DataProvider missing'); return c; };

export const modelUrl = (m: PartModel): string | null => m.converted_url || (['glb', 'gltf', 'obj'].includes(m.format) ? m.file_url : null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => { try { setCatalog(await fetchCatalog('EKG-10')); setError(null); } catch (e) { setError((e as Error).message); } }, []);
  useEffect(() => { void reload(); }, [reload]);

  const value = useMemo<Ctx | null>(() => {
    if (!catalog) return null;
    const machineModel = catalog.part_models.find((m) => !m.part_id && m.is_active && modelUrl(m)) ?? null;
    return {
      catalog, reload,
      partByPartId: new Map(catalog.parts.map((p) => [p.part_id, p])),
      partByNode: new Map(catalog.parts.filter((p) => p.model_object_id).map((p) => [p.model_object_id as string, p])),
      asmById: new Map(catalog.assemblies.map((a) => [a.id, a])),
      machineModel, modelUrl,
    };
  }, [catalog, reload]);

  if (error) return <div className="grid h-full place-items-center p-6 text-center"><div><div className="text-lg font-semibold">API bilan aloqa yo‘q</div><div className="mt-2 text-sm text-mute">{error}. Serverni ishga tushiring: <code className="font-mono">npm run dev</code></div><button className="btn mt-4" onClick={() => void reload()}>Qayta urinish</button></div></div>;
  if (!value) return <div className="grid h-full place-items-center text-sm text-mute">Katalog yuklanmoqda…</div>;
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
