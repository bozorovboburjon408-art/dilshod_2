// Single source of truth for the database structure.
// Column: [name, type, referencedTable?]. First column is always the text primary key.
// Types: text | int | num | bool | json
const SRC = [
  ['source', 'text'], // where the data came from (site / organisation)
  ['source_url', 'text'],
  ['source_document', 'text'], // document name
  ['source_page', 'text'], // page number
];

export const TABLES = {
  machines: [
    ['id', 'text'], ['code', 'text'], ['name', 'text'], ['manufacturer', 'text'],
    ['description', 'text'], ['bucket_volume_m3', 'num'], ['status', 'text'],
    ['specs', 'json'], // [{label,value,unit,source,source_url,source_document,source_page,verification}]
    ...SRC,
  ],
  materials: [
    ['id', 'text'], ['name', 'text'], ['standard', 'text'], ['description', 'text'], ...SRC,
  ],
  assemblies: [
    ['id', 'text'], ['machine_id', 'text', 'machines'], ['code', 'text'], ['name', 'text'],
    ['name_ru', 'text'], ['description', 'text'],
    ['explode_vector', 'json'], ['explode_lift', 'num'], ['sort', 'int'],
    ['data_status', 'text'], ...SRC,
  ],
  parts: [
    ['id', 'text'], ['part_id', 'text'], ['machine_id', 'text', 'machines'],
    ['assembly_id', 'text', 'assemblies'], ['name', 'text'], ['name_ru', 'text'],
    ['part_type', 'text'], ['part_number', 'text'], ['drawing_number', 'text'],
    ['position_number', 'text'], ['quantity', 'int'], ['material', 'text'],
    ['weight', 'num'], // kg
    ['dimensions', 'text'], ['description', 'text'], ['function', 'text'],
    ['working_principle', 'text'], ['specifications', 'text'], ['operating_requirements', 'text'],
    ['wear_limit', 'text'], ['maintenance', 'text'], ['repair_method', 'text'],
    ['mounting_info', 'text'], ['model_object_id', 'text'], ['explode_order', 'int'],
    ['data_status', 'text'], // verified | secondary | placeholder
    ...SRC,
  ],
  documents: [
    ['id', 'text'], ['machine_id', 'text', 'machines'], ['category', 'text'], ['title', 'text'],
    ['document_number', 'text'], ['file_url', 'text'], ['language', 'text'],
    ['total_pages', 'int'], ['is_demo', 'bool'], ...SRC,
  ],
  part_documents: [
    ['id', 'text'], ['part_id', 'text', 'parts'], ['document_id', 'text', 'documents'],
    ['page', 'int'], ['note', 'text'],
  ],
  part_drawings: [
    ['id', 'text'], ['part_id', 'text', 'parts'], ['title', 'text'], ['drawing_number', 'text'],
    ['file_url', 'text'], ['file_type', 'text'], ...SRC,
  ],
  part_models: [
    ['id', 'text'], ['machine_id', 'text', 'machines'], ['part_id', 'text', 'parts'], // part_id null = whole-machine model
    ['name', 'text'], ['format', 'text'], ['file_url', 'text'], ['converted_url', 'text'],
    ['conversion_status', 'text'], ['conversion_message', 'text'], ['is_active', 'bool'], ...SRC,
  ],
  failures: [
    ['id', 'text'], ['part_id', 'text', 'parts'], ['description', 'text'], ['symptoms', 'text'],
    ['causes', 'text'], ['sort', 'int'], ...SRC,
  ],
  repair_methods: [
    ['id', 'text'], ['part_id', 'text', 'parts'], ['title', 'text'], ['method', 'text'],
    ['mount_info', 'text'], ['dismount_info', 'text'], ['tools', 'text'], ...SRC,
  ],
};

export const UNIQUE = { parts: ['part_id'], machines: ['code'] };
export const TABLE_NAMES = Object.keys(TABLES);
export const colsOf = (t) => TABLES[t].map((c) => c[0]);
export const typeOf = (t, col) => TABLES[t].find((c) => c[0] === col)?.[1];

const SQL_TYPE = { text: 'TEXT', int: 'INTEGER', num: 'NUMERIC(14,3)', bool: 'BOOLEAN', json: 'JSONB' };

export function createSql() {
  const out = ['-- GENERATED from server/src/schema.js (npm run db:schema). Do not edit by hand.\n'];
  for (const [t, cols] of Object.entries(TABLES)) {
    const lines = cols.map(([n, ty, ref], i) =>
      `  ${n} ${SQL_TYPE[ty]}${i === 0 ? ' PRIMARY KEY' : ''}${ref ? ` REFERENCES ${ref}(id) ON DELETE CASCADE` : ''}`);
    for (const u of UNIQUE[t] || []) lines.push(`  UNIQUE (${u})`);
    out.push(`CREATE TABLE IF NOT EXISTS ${t} (\n${lines.join(',\n')}\n);\n`);
  }
  out.push('CREATE INDEX IF NOT EXISTS parts_assembly_idx ON parts(assembly_id);');
  out.push('CREATE INDEX IF NOT EXISTS parts_model_object_idx ON parts(model_object_id);');
  out.push('CREATE INDEX IF NOT EXISTS parts_number_idx ON parts(part_number);');
  return out.join('\n') + '\n';
}

// Normalise an incoming row: keep known columns only, '' -> null, coerce numbers/bools.
export function cleanRow(table, row) {
  const out = {};
  for (const [n, ty] of TABLES[table]) {
    if (!(n in row)) continue;
    let v = row[n];
    if (v === '' || v === undefined) v = null;
    if (v !== null) {
      if (ty === 'int') v = Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : null;
      else if (ty === 'num') v = Number.isFinite(Number(v)) ? Number(v) : null;
      else if (ty === 'bool') v = v === true || v === 'true' || v === 1;
      else if (ty === 'json' && typeof v === 'string') { try { v = JSON.parse(v); } catch { v = null; } }
      else if (ty === 'text') v = String(v);
    }
    out[n] = v;
  }
  return out;
}
