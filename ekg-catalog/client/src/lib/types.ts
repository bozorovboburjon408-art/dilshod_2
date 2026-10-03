export interface Source { source?: string | null; source_url?: string | null; source_document?: string | null; source_page?: string | null }
export type DataStatus = 'verified' | 'secondary' | 'placeholder';

export interface SpecItem extends Source { label: string; value: string; unit?: string | null; verification?: string }
export interface Machine extends Source { id: string; code: string; name: string; manufacturer: string | null; description: string | null; bucket_volume_m3: number | null; status: string; specs: SpecItem[] | null }
export interface Assembly extends Source { id: string; machine_id: string; code: string | null; name: string; name_ru: string | null; description: string | null; explode_vector: [number, number, number] | null; explode_lift: number | null; sort: number | null; data_status: DataStatus }
export interface Part extends Source {
  id: string; part_id: string; machine_id: string; assembly_id: string | null; name: string; name_ru: string | null; part_type: string | null;
  part_number: string | null; drawing_number: string | null; position_number: string | null; quantity: number | null; material: string | null;
  weight: number | null; dimensions: string | null; description: string | null; function: string | null; working_principle: string | null;
  specifications: string | null; operating_requirements: string | null; wear_limit: string | null; maintenance: string | null;
  repair_method: string | null; mounting_info: string | null; model_object_id: string | null; explode_order: number | null; data_status: DataStatus;
}
export interface DocumentRow extends Source { id: string; machine_id: string; category: string; title: string; document_number: string | null; file_url: string | null; language: string | null; total_pages: number | null; is_demo: boolean }
export interface PartDocument { id: string; part_id: string; document_id: string; page: number | null; note: string | null }
export interface PartDrawing extends Source { id: string; part_id: string; title: string | null; drawing_number: string | null; file_url: string | null; file_type: string | null }
export interface PartModel extends Source { id: string; machine_id: string | null; part_id: string | null; name: string | null; format: string; file_url: string | null; converted_url: string | null; conversion_status: string | null; conversion_message: string | null; is_active: boolean }
export interface Failure extends Source { id: string; part_id: string; description: string | null; symptoms: string | null; causes: string | null; sort: number | null }
export interface RepairMethod extends Source { id: string; part_id: string; title: string | null; method: string | null; mount_info: string | null; dismount_info: string | null; tools: string | null }
export interface Material extends Source { id: string; name: string; standard: string | null; description: string | null }

export interface Catalog {
  store: string; machines: Machine[]; machine: Machine; assemblies: Assembly[]; parts: Part[]; documents: DocumentRow[];
  part_documents: PartDocument[]; part_drawings: PartDrawing[]; part_models: PartModel[]; materials: Material[]; failures: Failure[]; repair_methods: RepairMethod[];
}

export const NA = 'Ma\'lumot mavjud emas';
export const DOC_CATEGORIES: Record<string, { icon: string; label: string }> = {
  operation_manual: { icon: '📘', label: 'Ekspluatatsiya qo‘llanmasi' },
  parts_catalog: { icon: '📕', label: 'Ehtiyot qismlar katalogi' },
  drawings: { icon: '📐', label: 'Chizmalar' },
  repair_manual: { icon: '🔧', label: 'Ta’mirlash qo‘llanmasi' },
  maintenance: { icon: '📋', label: 'Texnik xizmat ko‘rsatish' },
  tech_params: { icon: '📊', label: 'Texnik parametrlar' },
};
export const STATUS_LABEL: Record<string, string> = {
  verified: 'Tasdiqlangan', secondary: 'Ikkilamchi manba (tekshirilmagan)', placeholder: 'Placeholder — katalog ma\'lumoti kiritilmagan',
};
