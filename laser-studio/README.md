# Laser Model Texture Studio

3D maket (bino, sanoat obyekti, uskuna) → avtomatik 2D yoyilma + rangli qoplama + lazer kesish fayllari.
UI tillari: **O‘zbekcha · Русский · English**.

```bash
npm install
npm run build && npm start      # http://localhost:4173
# yoki ishlab chiqish rejimi:  npm run dev
```

## Imkoniyatlar

| Talab | Amalga oshirilishi |
|---|---|
| 3D yuklash | STL, OBJ (+MTL +tekstura), GLB/glTF (+bin/rasm), FBX — `src/three/loaders.ts` (Three.js). Aylantirish/zoom, mm da o‘lcham (X/Y/Z), 90° burish |
| Yoyish | Tekis (coplanar) yuzalarni panelga birlashtirish → bo‘g‘inlar (joint) → eng uzun bo‘g‘in birinchi yoyma daraxti → tekis (izometrik) detallar, ustma-ust tushishni tekshirish — `src/core/unfold.ts` |
| Tablar / buklash | 3–8 mm yelim tablari (trapetsiya → uchburchak → torroq zaxira shakllar), tog‘ (nuqta-punktir) va vodiy (punktir) buklamalar, yuza raqamlari = yig‘ish tartibi, juft chok raqamlari |
| Qo‘lda kesish | “Qirrani kesish” asbobi: 3D da qirra yoki 2D da buklama chizig‘iga bosing |
| Qoplama muharriri | Har bir yuzaga tekstura (kutubxona 18 ta + PNG/JPG/TIFF yuklash), masshtab/burilish/siljish/akslantirish, model UV teksturasi, rasm/logotip/yozuv dekallari, 1–2 mm bleed |
| Varaq | A4/A3/A2/Custom, portret/landshaft, kamida 5 mm chekka, avtomatik nesting (raster bottom-left), bir necha varaq — `src/core/nest.ts` |
| Lazer/registratsiya | SVG va DXF (R12) haqiqiy vektor, mm, 1:1. Qatlamlar: CUT (qizil, uzluksiz), FOLD (ko‘k, punktir), ENGRAVE (qora), PRINT (rangli), REGISTRATION (yashil; 4 burchakda belgi + X0/Y0 pastki-chap nol nuqta) |
| Eksport | PNG/TIFF/PDF (300 DPI, pHYs/TIFF DPI teglari), SVG, DXF, birlashtirilgan ishlab chiqarish PDF, yig‘ish yo‘riqnomasi PDF, har varaq alohida fayl, hammasi ZIP |
| Tekshiruvlar | detallar ustma-ust tushmasligi, CUT×FOLD kesishmasligi, xavfsiz chekka, sig‘masligi — interfeysda va eksport oynasida |
| Maxfiylik | Hisoblash va eksport **to‘liq brauzerda** (Web Worker). Server faqat statik fayl beradi, yuklash endpointi yo‘q (POST → 405), hech narsa saqlanmaydi; CSP `connect-src 'self'` |

### Arxitektura

```
src/core      sof geometriya (DOM yo‘q): mesh.ts, unfold.ts, nest.ts, layout.ts, svg.ts, dxf.ts, pdf.ts, files.ts (PNG-DPI, TIFF, ZIP)
src/render    textures.ts (protsedura kutubxona), paint.ts (PRINT qatlami, canvas), exporter.ts, instructions.ts
src/three     loaders.ts, Viewer.tsx
src/ui        LeftPanel, SheetView (SVG muharrir), ExportModal
server/       Node statik server (xavfsizlik sarlavhalari)
```
3D ko‘rinishdagi tekstura 2D varaqning aynan o‘zi (UV = varaqdagi joylashuv), shuning uchun “nima ko‘rsangiz — shuni chop etasiz”.

### Tekshirish

```bash
npm test                 # vitest: yoyish, nesting, eksport yozuvchilari, murakkab meshlar
npm run fixtures && npm run e2e   # Playwright: barcha formatlar, UI, eksport (server 4173 da ishlab turishi kerak)
```
Eksport fayllari `ezdxf`, `pypdf`, `pdfinfo`, Pillow bilan ham tekshirilgan.

### Ma’lum cheklovlar

- “Backend” — minimal Node server; og‘ir hisob ataylab mijozda (maxfiylik). Kerak bo‘lsa FastAPI qo‘shish mumkin, lekin foydalanuvchi fayllari serverga chiqadi.
- Model 20 000 uchburchakdan oshsa avval soddalashtirish kerak (vertex-clustering; UV yo‘qoladi).
- Zich egri modellarda (shar va h.k.) ba’zi choklarga tab sig‘maydi — statistikada “Tablar / Yelim choklari” ko‘rinadi, ogohlantirish chiqadi.
- SVG/DXF dagi raqamlar matn (TEXT) obyekti; lazer dasturida kerak bo‘lsa konturga aylantiring. DXF dagi PRINT qatlamida faqat varaq ramkasi bor (rang SVG/PDF/PNG/TIFF da).
- Buklama turi (tog‘/vodiy) yuzalar yo‘nalishi izchil bo‘lishiga tayanadi; yopiq meshlarda avtomatik tuzatiladi, ochiq meshlarda fayldagi yo‘nalish saqlanadi.
- FBX ASCII va binar o‘qiladi, lekin faqat sinov fayllari bilan tekshirilgan.
