// End-to-end check in a real browser. Usage: node tests/e2e/run.cjs <fixtures-dir> <download-dir> [url]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const [fx, dl, url = 'http://localhost:4173/studio.html'] = process.argv.slice(2);
fs.mkdirSync(dl, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 950 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  const T = (id) => `[data-testid="${id}"]`;
  const settle = async () => { await p.waitForFunction(() => !document.querySelector('[data-testid=busy]'), null, { timeout: 60000 }); await p.waitForTimeout(500); };
  const checksOk = async () => (await p.locator(`${T('checks')} .bad`).count()) === 0 && (await p.locator(`${T('checks')} .ok`).count()) === 4;
  const upload = async (files) => { await p.setInputFiles(T('file-input'), files.map((f) => path.join(fx, f))); await p.waitForTimeout(600); await settle(); };
  const info = async () => p.textContent(T('model-info'));

  await p.goto(url);
  await p.waitForSelector(T('stats'), { timeout: 30000 });
  await settle();
  ok(await checksOk(), 'default demo: all validation checks pass');
  ok((await p.textContent(T('stat-panels'))) === '7', 'house has 7 faces');

  // languages
  for (const [lang, word] of [['ru', 'Экспорт'], ['en', 'Export'], ['uz', 'Eksport']]) {
    await p.selectOption(T('lang'), lang);
    ok((await p.textContent(T('export-btn'))).includes(word), `language ${lang}`);
  }

  // demos
  for (const d of ['factory', 'tower', 'cube', 'house']) {
    await p.selectOption(T('demo-select'), d); await p.waitForTimeout(400); await settle();
    ok(await checksOk(), `demo ${d}: checks pass (${await p.textContent(T('stat-panels'))} faces, ${await p.textContent(T('stat-sheets'))} sheets)`);
  }

  // file formats
  await upload(['lshape.stl']); ok((await info()).includes('lshape (STL)'), 'STL loaded'); ok(await checksOk(), 'STL checks pass');
  await upload(['cube.obj', 'cube.mtl', 'tex.png']); ok((await info()).includes('cube (OBJ)'), 'OBJ+MTL+texture loaded'); ok(await checksOk(), 'OBJ checks pass');
  await p.screenshot({ path: path.join(dl, 'obj.png') });
  await upload(['box.glb']); ok((await info()).includes('box (GLB)'), 'GLB loaded'); ok(await checksOk(), 'GLB checks pass');
  await p.screenshot({ path: path.join(dl, 'glb.png') });
  await upload(['prism.fbx']); ok((await info()).includes('prism (FBX)'), 'FBX loaded'); ok(await checksOk(), 'FBX checks pass');

  // errors are shown clearly
  for (const f of ['broken.stl', 'empty.obj', 'tex.png']) {
    await p.setInputFiles(T('file-input'), path.join(fx, f)); await p.waitForSelector(T('toast'), { timeout: 8000 });
    ok((await p.getAttribute(T('toast'), 'class')).includes('error'), `error toast for ${f}: "${(await p.textContent(T('toast'))).trim()}"`);
  }

  // back to the demo house for editing
  await p.selectOption(T('lang'), 'en');
  await p.selectOption(T('demo-select'), 'house'); await settle();

  // sheet settings
  const vb = async () => (await p.getAttribute(T('sheet-svg'), 'viewBox'));
  ok((await vb()) === '0 0 210 297', 'A4 portrait viewBox');
  await p.click(T('orient-landscape')); await settle(); ok((await vb()) === '0 0 297 210', 'A4 landscape');
  await p.click(T('orient-portrait'));
  await p.selectOption(T('sheet-preset'), 'A3'); await settle(); ok((await vb()) === '0 0 297 420', 'A3');
  await p.selectOption(T('sheet-preset'), 'A2'); await settle(); ok((await vb()) === '0 0 420 594', 'A2');
  await p.selectOption(T('sheet-preset'), 'custom'); await p.fill(T('custom-w'), '260'); await p.fill(T('custom-h'), '330'); await settle();
  ok((await vb()) === '0 0 260 330', 'custom 260x330');
  await p.fill(T('margin'), '2'); await p.waitForTimeout(300); await p.locator(T('margin')).blur();
  ok(Number(await p.inputValue(T('margin'))) >= 5, 'margin cannot go below 5 mm');
  await p.selectOption(T('sheet-preset'), 'A4');
  await p.fill(T('dim-X'), '140'); await settle();
  ok((await info()).includes('140'), 'size change applied (X=140)');
  ok(await checksOk(), 'checks pass after resize');
  await p.fill(T('dim-X'), '90'); await settle();

  // tab width
  await p.fill(T('dim-X'), '90');
  await p.locator(T('tab-width')).evaluate((el) => { el.value = '8'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  await settle(); ok(await checksOk(), 'tab width 8 mm: checks pass');

  // texture: select a face on the 2D sheet and apply brick
  const firstPanel = p.locator(`${T('sheet-svg')} g path[stroke=none]`).first();
  await firstPanel.click({ force: true });
  ok((await p.textContent(T('tex-hint'))).includes('1'), 'face selected from 2D view');
  const before = await p.locator(T('sheet-svg') + ' image').getAttribute('href');
  await p.click(T('thumb-brick')); await p.waitForTimeout(900);
  const after = await p.locator(T('sheet-svg') + ' image').getAttribute('href');
  ok(before !== after, 'texture change repaints the 2D print layer');
  await p.setInputFiles(T('tex-upload'), [path.join(fx, 'tex.tif')]); await p.waitForTimeout(900);
  ok((await p.locator('.thumbs .thumb').count()) > 18, 'TIFF texture decoded and added to library');
  await p.setInputFiles(T('tex-upload'), [path.join(fx, 'tex.jpg'), path.join(fx, 'tex.png')]); await p.waitForTimeout(700);
  await p.fill(T('tex-scale'), '25'); await p.fill(T('tex-rot'), '30'); await p.waitForTimeout(500);

  // decals: text + logo
  await p.locator('summary', { hasText: '6' }).click();
  await p.click(T('add-text')); await p.fill(T('decal-text'), 'LASER 3D'); await p.waitForTimeout(500);
  await p.click(T('thumb-logo')); await p.waitForTimeout(500);

  // manual cut edge
  await p.click(T('tool-cut'));
  const foldLine = p.locator(`${T('sheet-svg')} line[stroke="rgba(255,0,255,0.35)"]`).first();
  const nBefore = await p.locator(`${T('sheet-svg')} line[stroke="rgba(255,0,255,0.35)"]`).count();
  await foldLine.click({ force: true }); await settle();
  ok((await p.textContent(T('manual-count'))) === '1', `manual cut registered (folds before: ${nBefore})`);
  ok(await checksOk(), 'checks pass after manual cut');
  await p.click(T('clear-cuts')); await settle(); await p.click(T('tool-select'));
  await p.screenshot({ path: path.join(dl, 'edited.png') });

  // export
  await p.click(T('export-btn')); await p.waitForSelector(T('export-modal'));
  ok((await p.locator(`${T('export-modal')} svg image`).count()) === 1, '2D export preview shown');
  await p.click(T('ex-tiff'));
  await p.click(T('ex-go')); await p.waitForSelector(T('ex-files'), { timeout: 120000 });
  const names = await p.locator(T('ex-file')).allTextContents();
  console.log('files:', names.map((n) => n.trim()).join(' | '));
  const kinds = ['.png', '.tif', '_print_300dpi.pdf', '_laser.svg', '_laser.dxf', '_production.pdf', '_assembly_instructions.pdf'];
  for (const k of kinds) ok(names.some((n) => n.includes(k)), `export contains *${k}`);
  const n = await p.locator(T('ex-file')).count();
  for (let i = 0; i < n; i++) {
    const [d] = await Promise.all([p.waitForEvent('download'), p.locator(T('ex-file')).nth(i).click()]);
    await d.saveAs(path.join(dl, d.suggestedFilename()));
  }
  const [z] = await Promise.all([p.waitForEvent('download'), p.click(T('ex-zip'))]);
  await z.saveAs(path.join(dl, z.suggestedFilename()));
  await p.screenshot({ path: path.join(dl, 'export.png') });
  await p.keyboard.press('Escape');

  // mobile layout
  await p.setViewportSize({ width: 390, height: 800 });
  await p.waitForTimeout(400);
  ok(await p.locator(T('nav-settings')).isVisible(), 'mobile navigation visible');
  await p.click(T('nav-view2d')); await p.waitForTimeout(300);
  ok(await p.locator(T('sheet-svg')).isVisible(), 'mobile: 2D view');
  await p.screenshot({ path: path.join(dl, 'mobile2d.png') });
  await p.click(T('nav-view3d')); await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(dl, 'mobile3d.png') });
  await p.click(T('nav-settings')); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(dl, 'mobile-settings.png') });

  const real = errors.filter((e) => !/GPU stall|ReadPixels|GL Driver|Failed to load resource/.test(e));
  ok(real.length === 0, 'no console errors' + (real.length ? ': ' + real.slice(0, 5).join(' || ') : ''));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
