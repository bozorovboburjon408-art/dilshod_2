// EKG-10 seed data.
//
// DATA ACCURACY RULES (spec section 17):
//  * Nothing technical is guessed. Every field we do not have a source for stays null and the UI
//    renders "Ma'lumot mavjud emas".
//  * `data_status`:
//      verified    - taken from a primary document (none yet)
//      secondary   - read from a web search result / reseller page, NOT yet checked against the original
//      placeholder - structural node of the demo 3D model; name only, no catalogue data
//  * The only catalogue facts found so far (via web search, see SRC_* below):
//      - 3536.05.00.001 = "ВЕНЕЦ ЗУБЧАТЫЙ", listed under assembly 3536.05.00.000 (ходовая тележка)
//      - Operating manual number 3536.00.00.000 РЭ
//      - Basic machine parameters (mass, boom length, ...)
//    The sites ekg-5.com / exkavator.ru could not be opened from the build environment (blocked),
//    so those values are flagged `secondary`.

const M = 'ekg-10';

const SRC_CATALOG = {
  source: 'Veb-qidiruv natijasi (ekg-5.com ehtiyot qismlar katalogi)',
  source_url: 'https://www.ekg-5.com/spares/ekg-10',
  source_document: 'Каталог запчастей ЭКГ-10 (veb-sahifa)',
  source_page: null,
};
const SRC_SPECS = {
  source: 'Veb-qidiruv natijasi (Ижорские заводы / exkavator.ru)',
  source_url: 'https://exkavator.ru/excapedia/technic/ijorskie_zavodi_ekg-10',
  source_document: 'Характеристики экскаватора ЭКГ-10',
  source_page: null,
};
const SRC_MANUAL = {
  source: 'Veb-qidiruv natijasi (studmed.ru)',
  source_url: 'https://www.studmed.ru/rukovodstvo-po-ekspluatacii-ekskavatory-karernye-gusenichnye-tipa-ekg-10-ekg-8us-i-ekg-5u_f1c59c27d93.html',
  source_document: 'Руководство по эксплуатации 3536.00.00.000 РЭ',
  source_page: null,
};

const spec = (label, value, unit) => ({ label, value, unit, verification: 'secondary', ...SRC_SPECS });

const machines = [
  {
    id: M, code: 'EKG-10', name: 'EKG-10 kon elektr ekskavatori (mexanik kurak, arqonli napor)',
    manufacturer: 'Ижорские заводы (manba bo‘yicha)',
    description: 'Ochiq konlarda foydali qazilma va qoplama jinslarni qazish va transport vositalariga ortish uchun mo‘ljallangan.',
    bucket_volume_m3: 10, status: 'active',
    specs: [
      spec('Kovsh hajmi', '10', 'm³'),
      spec('Ekskavator massasi', '395', 't'),
      spec('Quvvat (manbada: «мощность 800 кВт»)', '800', 'kVt'),
      spec('Asosiy kovsh massasi', '16,2', 't'),
      spec('Strela uzunligi', '13,86', 'm'),
      spec('Rukoyat yurishi', '4,55', 'm'),
      spec('Aylanuvchi platforma ostidagi tiniqlik', '2,77', 'm'),
      spec('Orqa qism aylanish radiusi', '7,78', 'm'),
      spec('Gusenitsa yurish uzunligi', '8,2', 'm'),
      spec('Hisobiy sikl davomiyligi (90° burilishda)', '26', 's'),
      spec('Gorizontal maydondagi tezlik', '0,7', 'km/soat'),
      spec('Eng katta ko‘tarilish burchagi', '12', '°'),
    ],
    ...SRC_SPECS,
  },
  // Future machines: models/parts/documents are added per machine_id (first version = EKG-10 only).
  ...['EKG-5', 'EKG-8', 'EKG-12', 'EKG-15'].map((c) => ({
    id: c.toLowerCase(), code: c, name: `${c} (keyingi versiya)`, status: 'planned',
    manufacturer: null, description: null, bucket_volume_m3: null, specs: [],
    source: null, source_url: null, source_document: null, source_page: null,
  })),
];

// Assemblies of the demo model. Only the crawler assembly number comes from a source.
const A = (id, name, name_ru, extra = {}) => ({
  id: `asm-${id}`, machine_id: M, code: null, name, name_ru, description: null,
  explode_vector: null, explode_lift: 0, sort: 0, data_status: 'placeholder',
  source: null, source_url: null, source_document: null, source_page: null, ...extra,
});
const assemblies = [
  A('crawler', 'Yurish aravachasi', 'Ходовая тележка', {
    code: '3536.05.00.000', sort: 1, data_status: 'secondary', ...SRC_CATALOG,
    description: 'Birlik raqami va nomi veb-qidiruv natijasiga ko‘ra (ekg-5.com), asl hujjat bilan tasdiqlanmagan.',
  }),
  A('platform', 'Platforma', 'Платформа', { sort: 2 }),
  A('revolving', 'Aylanuvchi platforma', 'Поворотная платформа', { sort: 3 }),
  A('hoist', 'Ko‘tarish mexanizmi', 'Подъёмный механизм', { sort: 4 }),
  A('pressure', 'Napor mexanizmi', 'Напорный механизм', { sort: 5 }),
  A('swing', 'Burilish mexanizmi', 'Поворотный механизм', { sort: 6 }),
  A('gearbox', 'Reduktor', 'Редуктор', { sort: 7, explode_vector: [0, -1.3, 0], explode_lift: 3.8 }),
  A('attachment', 'Ishchi uskuna', 'Рабочее оборудование', { sort: 8 }),
  A('other', 'Boshqa qismlar', 'Прочие части', { sort: 9 }),
];

// [part_id, node, name(uz), name(ru), type, assembly, explode_order]
const P = [
  ['EKG10-CRAWLER-001', 'crawler_track_left_01', 'Chap gusenitsa', 'Гусеничный ход левый', 'track', 'crawler'],
  ['EKG10-CRAWLER-002', 'crawler_track_right_01', 'O‘ng gusenitsa', 'Гусеничный ход правый', 'track', 'crawler'],
  ['EKG10-CRAWLER-003', 'crawler_frame_01', 'Yurish ramasi', 'Рама ходовой тележки', 'frame', 'crawler'],
  ['EKG10-CRAWLER-004', 'drive_wheel_left_01', 'Chap yetaklovchi g‘ildirak', 'Ведущее колесо левое', 'wheel', 'crawler'],
  ['EKG10-CRAWLER-005', 'drive_wheel_right_01', 'O‘ng yetaklovchi g‘ildirak', 'Ведущее колесо правое', 'wheel', 'crawler'],
  ['EKG10-GEAR-001', 'gear_ring_01', 'Tishli toj (venets)', 'Венец зубчатый', 'gear', 'crawler'],
  ['EKG10-PLATFORM-001', 'platform_01', 'Platforma (asos rama)', 'Платформа', 'frame', 'platform'],
  ['EKG10-REVPLAT-001', 'revolving_platform_01', 'Aylanuvchi platforma (mashina xonasi)', 'Поворотная платформа (машинное отделение)', 'frame', 'revolving'],
  ['EKG10-CAB-001', 'operator_cab_01', 'Mashinist kabinasi', 'Кабина машиниста', 'other', 'other'],
  ['EKG10-CWT-001', 'counterweight_01', 'Qarshi yuk', 'Противовес', 'other', 'other'],
  ['EKG10-AFRAME-001', 'a_frame_01', 'Pilon (A-ramka)', 'Стойка (А-образная рама)', 'frame', 'revolving'],
  ['EKG10-HOIST-001', 'hoist_drum_01', 'Ko‘tarish barabani', 'Подъёмный барабан', 'drum', 'hoist'],
  ['EKG10-HOIST-002', 'hoist_motor_01', 'Ko‘tarish dvigateli', 'Двигатель подъёма', 'motor', 'hoist'],
  ['EKG10-PRESS-001', 'pressure_shaft_01', 'Napor vali', 'Напорный вал', 'shaft', 'pressure'],
  ['EKG10-PRESS-002', 'pressure_motor_01', 'Napor dvigateli', 'Двигатель напора', 'motor', 'pressure'],
  ['EKG10-SWING-001', 'swing_motor_01', 'Burilish dvigateli', 'Двигатель поворота', 'motor', 'swing'],
  ['EKG10-SWING-002', 'swing_pinion_01', 'Burilish shesternyasi', 'Поворотная шестерня', 'gear', 'swing'],
  ['EKG10-GBOX-001', 'gearbox_housing_01', 'Reduktor korpusi', 'Корпус редуктора', 'housing', 'gearbox', 0],
  ['EKG10-SHAFT-001', 'gearbox_shaft_01', 'Reduktor vali', 'Вал редуктора', 'shaft', 'gearbox', 1],
  ['EKG10-BEARING-001', 'gearbox_bearing_01', 'Podshipnik', 'Подшипник', 'bearing', 'gearbox', 2],
  ['EKG10-GEAR-002', 'gearbox_gear_01', 'Shesternya', 'Шестерня', 'gear', 'gearbox', 3],
  ['EKG10-BOLT-001', 'gearbox_bolt_01', 'Bolt', 'Болт', 'fastener', 'gearbox', 4],
  ['EKG10-NUT-001', 'gearbox_nut_01', 'Gayka', 'Гайка', 'fastener', 'gearbox', 5],
  ['EKG10-BOOM-001', 'boom_01', 'Strela', 'Стрела', 'working-equipment', 'attachment'],
  ['EKG10-SHEAVE-001', 'boom_sheave_01', 'Strela bloki', 'Блок стрелы', 'other', 'attachment'],
  ['EKG10-HANDLE-001', 'handle_01', 'Rukoyat', 'Рукоять', 'working-equipment', 'attachment'],
  ['EKG10-BUCKET-001', 'bucket_01', 'Kovsh (10 m³)', 'Ковш (10 м³)', 'working-equipment', 'attachment'],
];

const NONE = {
  part_number: null, drawing_number: null, position_number: null, quantity: null, material: null,
  weight: null, dimensions: null, description: null, function: null, working_principle: null,
  specifications: null, operating_requirements: null, wear_limit: null, maintenance: null,
  repair_method: null, mounting_info: null,
  source: null, source_url: null, source_document: null, source_page: null,
};

const parts = P.map(([part_id, node, name, name_ru, part_type, asm, order]) => {
  const base = {
    id: part_id, part_id, machine_id: M, assembly_id: `asm-${asm}`, name, name_ru, part_type,
    model_object_id: node, explode_order: order ?? null, data_status: 'placeholder', ...NONE,
  };
  if (part_id === 'EKG10-GEAR-001') {
    return {
      ...base, part_number: '3536.05.00.001', name_ru: 'ВЕНЕЦ ЗУБЧАТЫЙ', data_status: 'secondary', ...SRC_CATALOG,
      description: 'Nomi va katalog raqami veb-qidiruv natijasidan (ekg-5.com, birlik 3536.05.00.000). Boshqa ma‘lumotlar topilmadi.',
    };
  }
  return base;
});

const documents = [
  {
    id: 'doc-manual-re', machine_id: M, category: 'operation_manual',
    title: 'Руководство по эксплуатации экскаваторов карьерных гусеничных типа ЭКГ-10, ЭКГ-8ус и ЭКГ-5у',
    document_number: '3536.00.00.000 РЭ', file_url: null, language: 'ru', total_pages: null, is_demo: false, ...SRC_MANUAL,
  },
  {
    id: 'doc-catalog-web', machine_id: M, category: 'parts_catalog',
    title: 'Каталог запчастей ЭКГ-10 (veb-katalog)', document_number: null, file_url: null,
    language: 'ru', total_pages: null, is_demo: false, ...SRC_CATALOG,
  },
  {
    id: 'doc-viewer-demo', machine_id: M, category: 'drawings',
    title: 'PDF viewer DEMO (haqiqiy hujjat emas)', document_number: null,
    file_url: '/files/demo-viewer.pdf', language: 'uz', total_pages: 3, is_demo: true,
    source: 'Demo fayl', source_url: null, source_document: null, source_page: null,
  },
];

const part_documents = [
  { id: 'pd-gear001-catalog', part_id: 'EKG10-GEAR-001', document_id: 'doc-catalog-web', page: null, note: 'Veb-katalogdagi pozitsiya 3536.05.00.001' },
  { id: 'pd-gear001-manual', part_id: 'EKG10-GEAR-001', document_id: 'doc-manual-re', page: null, note: 'Sahifa raqami aniqlanmagan' },
];


export const seed = {
  machines,
  materials: [],
  assemblies,
  parts,
  documents,
  part_documents,
  part_drawings: [],
  part_models: [], // empty => built-in procedural placeholder model; upload a GLB in the admin panel
  failures: [],
  repair_methods: [],
};
