import './landing.css';

const D: Record<string, Record<string, string>> = {
  uz: {},
  ru: {
    'nav.features': 'Возможности', 'nav.how': 'Как это работает', 'nav.formats': 'Форматы', 'cta.open': 'Открыть приложение', 'cta.demo': 'Попробовать демо',
    'hero.title': 'Из 3D-макета — цветная развёртка, готовая к лазерной резке',
    'hero.sub': 'Загрузите модель — программа автоматически развернёт её, добавит клеевые клапаны, линии сгиба и номера, разместит цветную текстуру и подготовит файлы SVG, DXF, PDF, PNG, TIFF.',
    'hero.note': '🔒 Файлы обрабатываются в браузере — не загружаются на сервер и не сохраняются.',
    'f.title': 'Возможности',
    'f1.t': 'Автоматическая развёртка', 'f1.d': 'Плоские грани объединяются, перекрытия деталей проверяются, рёбра реза можно задать вручную.',
    'f2.t': 'Клапаны и сгибы', 'f2.d': 'Клеевые клапаны 3–8 мм, сгибы «гора» и «долина», номера граней и порядок сборки.',
    'f3.t': 'Цветное покрытие', 'f3.d': 'Библиотека материалов, текстуры PNG/JPG/TIFF, логотипы и текст, припуск 1–2 мм.',
    'f4.t': 'Автораскладка', 'f4.d': 'A4, A3, A2 или свой размер; безопасный отступ от края не менее 5 мм; несколько листов при необходимости.',
    'f5.t': 'Слои для лазера', 'f5.d': 'Слои CUT, FOLD, ENGRAVE, PRINT и REGISTRATION, нуль X0/Y0, метки регистрации на каждом листе.',
    'f6.t': 'Настоящий векторный экспорт', 'f6.d': 'SVG и DXF в мм, масштаб 1:1; PDF и растр 300 DPI; инструкция по сборке.',
    'h.title': 'Как это работает', h1: 'Загрузите модель или выберите демо', h2: 'Задайте размер (мм) и формат листа', h3: 'Добавьте текстуры и декор на грани', h4: 'Проверьте 2D и 3D предпросмотр', h5: 'Скачайте файлы и режьте на лазере',
    'fm.title': 'Форматы', 'fm.in': 'Вход', 'fm.out': 'Выход', 'end.title': 'Готовы начать?', foot: 'Laser Model Texture Studio — вычисления выполняются полностью в браузере.',
  },
  en: {
    'nav.features': 'Features', 'nav.how': 'How it works', 'nav.formats': 'Formats', 'cta.open': 'Open the app', 'cta.demo': 'Try the demo model',
    'hero.title': 'From a 3D model to a coloured unfolding ready for laser cutting',
    'hero.sub': 'Load a model — the app unfolds it automatically, adds glue tabs, fold lines and numbers, applies colour textures and prepares SVG, DXF, PDF, PNG and TIFF files.',
    'hero.note': '🔒 Your files are processed in the browser — never uploaded or stored.',
    'f.title': 'Features',
    'f1.t': 'Automatic unfolding', 'f1.d': 'Coplanar faces are merged, part overlaps are checked, cut edges can be set by hand.',
    'f2.t': 'Tabs and folds', 'f2.d': '3–8 mm glue tabs, mountain and valley folds, face numbers and assembly order.',
    'f3.t': 'Colour coating', 'f3.d': 'Material library, PNG/JPG/TIFF textures, logos and text, 1–2 mm bleed.',
    'f4.t': 'Automatic nesting', 'f4.d': 'A4, A3, A2 or custom size; at least 5 mm safe margin; several sheets when needed.',
    'f5.t': 'Laser layers', 'f5.d': 'CUT, FOLD, ENGRAVE, PRINT and REGISTRATION layers, X0/Y0 origin, registration marks on every sheet.',
    'f6.t': 'Real vector export', 'f6.d': 'SVG and DXF in mm at 1:1; PDF and raster at 300 DPI; assembly instructions.',
    'h.title': 'How it works', h1: 'Load a model or pick a demo', h2: 'Set the size (mm) and sheet format', h3: 'Add textures and decorations to faces', h4: 'Check the 2D and 3D preview', h5: 'Download the files and cut on the laser',
    'fm.title': 'Formats', 'fm.in': 'Input', 'fm.out': 'Output', 'end.title': 'Ready to start?', foot: 'Laser Model Texture Studio — all computation runs in your browser.',
  },
};

const els = Array.from(document.querySelectorAll<HTMLElement>('[data-i18n]'));
const uz = new Map(els.map((e) => [e, e.textContent ?? '']));
function apply(lang: string) {
  document.documentElement.lang = lang;
  for (const e of els) e.textContent = lang === 'uz' ? uz.get(e)! : D[lang]?.[e.dataset.i18n!] ?? uz.get(e)!;
  try { localStorage.setItem('lms-lang', lang); } catch { /* ignore */ }
}
const sel = document.getElementById('lang') as HTMLSelectElement;
let saved = 'uz';
try { saved = localStorage.getItem('lms-lang') ?? (navigator.language.startsWith('ru') ? 'ru' : navigator.language.startsWith('en') ? 'en' : 'uz'); } catch { /* ignore */ }
sel.value = saved; apply(saved);
sel.addEventListener('change', () => apply(sel.value));
