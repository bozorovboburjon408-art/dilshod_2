# FUTURE FORGE AI

Fantastik g'oyani real mahsulotga aylantir. Rasm yuklanadi, tahlil qilinadi, so'ng 12 bo'limli dashboard chiqadi:
AI tahlil, reality konversiya, 3D model/CAD, materiallar, mashinalar, BOM, elektronika va dastur, lazer, 3D bosma, narx, ishlab chiqarish, hisobot.

## Ishga tushirish
- Oflayn/DEMO: `forge/index.html` ni brauzerda oching (qurilma turi shablon asosida tanlanadi).
- Claude bilan haqiqiy rasm tahlili (server):
  ```
  npm install
  ANTHROPIC_API_KEY=... npm start     # http://localhost:3000/forge/
  ```
- Claude artifact ichida `sample` ruxsati orqali serversiz ishlaydi.

## Eksport
STL, 3MF, DXF, SVG, PNG, XLSX, DOCX, PDF, CSV. STEP o'rniga parametrik CAD spetsifikatsiya (JSON) beriladi.
Narx, vaqt va parametrlar taxminiy; AI konseptlari professional tekshiruvni talab qiladi.
