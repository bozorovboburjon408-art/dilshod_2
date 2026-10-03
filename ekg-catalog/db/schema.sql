-- GENERATED from server/src/schema.js (npm run db:schema). Do not edit by hand.

CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT,
  manufacturer TEXT,
  description TEXT,
  bucket_volume_m3 NUMERIC(14,3),
  status TEXT,
  specs JSONB,
  source TEXT,
  source_url TEXT,
  source_document TEXT,
  source_page TEXT,
  UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT,
  standard TEXT,
  description TEXT,
  source TEXT,
  source_url TEXT,
  source_document TEXT,
  source_page TEXT
);

CREATE TABLE IF NOT EXISTS assemblies (
  id TEXT PRIMARY KEY,
  machine_id TEXT REFERENCES machines(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT,
  name_ru TEXT,
  description TEXT,
  explode_vector JSONB,
  explode_lift NUMERIC(14,3),
  sort INTEGER,
  data_status TEXT,
  source TEXT,
  source_url TEXT,
  source_document TEXT,
  source_page TEXT
);

CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  part_id TEXT,
  machine_id TEXT REFERENCES machines(id) ON DELETE CASCADE,
  assembly_id TEXT REFERENCES assemblies(id) ON DELETE CASCADE,
  name TEXT,
  name_ru TEXT,
  part_type TEXT,
  part_number TEXT,
  drawing_number TEXT,
  position_number TEXT,
  quantity INTEGER,
  material TEXT,
  weight NUMERIC(14,3),
  dimensions TEXT,
  description TEXT,
  function TEXT,
  working_principle TEXT,
  specifications TEXT,
  operating_requirements TEXT,
  wear_limit TEXT,
  maintenance TEXT,
  repair_method TEXT,
  mounting_info TEXT,
  model_object_id TEXT,
  explode_order INTEGER,
  data_status TEXT,
  source TEXT,
  source_url TEXT,
  source_document TEXT,
  source_page TEXT,
  UNIQUE (part_id)
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  machine_id TEXT REFERENCES machines(id) ON DELETE CASCADE,
  category TEXT,
  title TEXT,
  document_number TEXT,
  file_url TEXT,
  language TEXT,
  total_pages INTEGER,
  is_demo BOOLEAN,
  source TEXT,
  source_url TEXT,
  source_document TEXT,
  source_page TEXT
);

CREATE TABLE IF NOT EXISTS part_documents (
  id TEXT PRIMARY KEY,
  part_id TEXT REFERENCES parts(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  page INTEGER,
  note TEXT
);

CREATE TABLE IF NOT EXISTS part_drawings (
  id TEXT PRIMARY KEY,
  part_id TEXT REFERENCES parts(id) ON DELETE CASCADE,
  title TEXT,
  drawing_number TEXT,
  file_url TEXT,
  file_type TEXT,
  source TEXT,
  source_url TEXT,
  source_document TEXT,
  source_page TEXT
);

CREATE TABLE IF NOT EXISTS part_models (
  id TEXT PRIMARY KEY,
  machine_id TEXT REFERENCES machines(id) ON DELETE CASCADE,
  part_id TEXT REFERENCES parts(id) ON DELETE CASCADE,
  name TEXT,
  format TEXT,
  file_url TEXT,
  converted_url TEXT,
  conversion_status TEXT,
  conversion_message TEXT,
  is_active BOOLEAN,
  source TEXT,
  source_url TEXT,
  source_document TEXT,
  source_page TEXT
);

CREATE TABLE IF NOT EXISTS failures (
  id TEXT PRIMARY KEY,
  part_id TEXT REFERENCES parts(id) ON DELETE CASCADE,
  description TEXT,
  symptoms TEXT,
  causes TEXT,
  sort INTEGER,
  source TEXT,
  source_url TEXT,
  source_document TEXT,
  source_page TEXT
);

CREATE TABLE IF NOT EXISTS repair_methods (
  id TEXT PRIMARY KEY,
  part_id TEXT REFERENCES parts(id) ON DELETE CASCADE,
  title TEXT,
  method TEXT,
  mount_info TEXT,
  dismount_info TEXT,
  tools TEXT,
  source TEXT,
  source_url TEXT,
  source_document TEXT,
  source_page TEXT
);

CREATE INDEX IF NOT EXISTS parts_assembly_idx ON parts(assembly_id);
CREATE INDEX IF NOT EXISTS parts_model_object_idx ON parts(model_object_id);
CREATE INDEX IF NOT EXISTS parts_number_idx ON parts(part_number);
