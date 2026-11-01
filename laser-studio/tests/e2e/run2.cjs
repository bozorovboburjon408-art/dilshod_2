// Extra browser checks: 3D picking, manual cut in 3D, oversize model, A2 300-DPI export. Usage: node tests/e2e/run2.cjs <download-dir> [url]
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const [dl, url = 'http://localhost:4173/'] = process.argv.slice(2);
fs.mkdirSync(dl, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 950 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/GPU|GL Driver/.test(m.text())) errors.push(m.text()); });
  const T = (id) => `[data-testid="${id}"]`;
  const settle = async () => { await p.waitForFunction(() => !document.querySelector('[data-testid=busy]'), null, { timeout: 90000 }); await p.waitForTimeout(500); };
  await p.goto(url); await p.waitForSelector(T('stats'), { timeout: 30000 }); await settle();

  // 3D picking
  const box = await p.locator('.viewer-host canvas').boundingBox();
  await p.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.55);
  await p.waitForTimeout(300);
  ok((await p.textContent(T('tex-hint'))).match(/1/) !== null && !(await p.textContent(T('tex-hint'))).includes('Select'), '3D click selects a face');
  await p.click(T('thumb-metal')); await p.waitForTimeout(800); await settle();
  await p.screenshot({ path: path.join(dl, 'picked3d.png') });
  // 3D cut tool
  await p.click(T('tool-cut'));
  await p.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.55);
  await settle();
  ok((await p.textContent(T('manual-count'))) === '1', '3D cut tool toggles nearest edge');
  await p.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.55); await settle();
  ok((await p.textContent(T('manual-count'))) !== '1', 'second click on the same edge restores it');
  await p.click(T('tool-select'));

  // oversize model on A4
  await p.fill(T('dim-X'), '900'); await settle();
  const checks = await p.textContent(T('checks'));
  console.log('oversize ->', (await p.locator('.warn').allTextContents()).slice(0, 2).join(' | '), '| sheets', await p.textContent(T('stat-sheets')));
  ok(await p.locator(T('stats')).isVisible(), 'oversize model does not crash the UI');
  await p.fill(T('dim-X'), '90'); await settle();

  // A2 export
  await p.selectOption(T('sheet-preset'), 'A2'); await p.fill(T('dim-X'), '300'); await settle();
  await p.click(T('export-btn')); await p.waitForSelector(T('export-modal'));
  await p.click(T('ex-tiff')); await p.click(T('ex-svg')); await p.click(T('ex-pdfInstr'));
  const t0 = Date.now();
  await p.click(T('ex-go')); await p.waitForSelector(T('ex-files'), { timeout: 240000 });
  console.log('A2 export seconds', (Date.now() - t0) / 1000);
  const names = await p.locator(T('ex-file')).allTextContents();
  console.log(names.map((s) => s.trim()).join(' | '));
  for (let i = 0; i < names.length; i++) { const [d] = await Promise.all([p.waitForEvent('download'), p.locator(T('ex-file')).nth(i).click()]); await d.saveAs(path.join(dl, 'a2_' + d.suggestedFilename())); }
  ok(names.length >= 3, 'A2 export produced files');
  ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' || ') : ''));
  await b.close(); console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
