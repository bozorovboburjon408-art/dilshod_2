# EKG-10 DIGITAL — interactive 3D spare-parts catalog

React + TypeScript + React Three Fiber + Tailwind (client), Node/Express (server), PostgreSQL (or zero-setup JSON file), PDF.js.

```bash
npm install
npm run dev            # API :3001 + web :5173   (open http://localhost:5173)
# production
npm run build && npm start   # server serves client/dist on :3001
```

Database: without `DATABASE_URL` the server uses `server/data/db.json` (created from the seed).
With PostgreSQL: `DATABASE_URL=postgres://user:pass@host/db npm start` — tables are created and seeded on first start
(`db/schema.sql` is generated from `server/src/schema.js`: `npm run db:schema`).
Admin: `/#/admin`, `ADMIN_USER` / `ADMIN_PASSWORD` (dev default `admin` / `admin123` — change it), optional `AUTH_SECRET`.

## Using the viewer
hover → tooltip (name, Part ID, position) · click → highlight · double click / double tap → camera flies to the part + right info panel
(Info / Repair / PDF / 2D drawing / 3D tabs) · EXPLODED VIEW: with a part selected it spreads that part's assembly in `explode_order`
(e.g. reduktor: korpus → val → podshipnik → shesternya → bolt → gayka), otherwise the whole machine · SHOW PARTS: colour by assembly (legend filters) ·
search (`венец`, `3536.05.00.001`, …) and the catalog table both fly the 3D camera to the part.

## Data accuracy (spec §17)
No technical value is invented. Every row has `source`, `source_url`, `source_document`, `source_page` and `data_status`
(`verified` | `secondary` | `placeholder`); missing data renders **"Ma'lumot mavjud emas"**.

What is currently in the database, and why it is thin:
* Found via web search only: `3536.05.00.001 = ВЕНЕЦ ЗУБЧАТЫЙ` (assembly `3536.05.00.000`, ходовая тележка), manual no. `3536.00.00.000 РЭ`,
  and the machine's basic parameters (395 t, 10 m³, boom 13.86 m …). These are `secondary` — the source sites (ekg-5.com, exkavator.ru) were
  **blocked by the build environment's network proxy**, so they were NOT checked against the original pages/PDF. Verify, then set `verified` and fill page numbers.
* All other 26 parts are `placeholder`: they exist only so the demo 3D model has a node per part. Names are generic; no numbers/materials/weights.
* `/files/demo-viewer.pdf` is a generated 3-page demo for the PDF.js viewer (flagged DEMO), not an EKG-10 document.
* Importing the real catalogue = fill `parts` / `part_documents (page)` / `part_drawings` through the admin panel (or extend `server/seed`).

## 3D models
No real EKG-10 model is available, so a procedural placeholder (`client/src/model/layout.ts`, node names = `parts.model_object_id`) is used.
Admin → **3D modellar**: upload GLB/GLTF/OBJ (viewer) or STEP; mark it *Faol*. Admin → **3D ↔ DB bog'lash** maps each node name of the GLB
(e.g. `gear_ring_01`) to a `part_id` (e.g. `EKG10-GEAR-001`). Use self-contained **GLB** (a `.gltf` with external `.bin`/textures will not load).
Real models of unknown scale are auto-fitted to ~24 m and placed on the ground.

**STEP**: browsers cannot render B-rep. A STEP upload creates `part_models(conversion_status='pending')`; set `STEP_CONVERTER_CMD`
(e.g. `freecadcmd step2glb.py {input} {output}`, cadquery, or an OpenCascade/`occt-import-js` script) and the server runs it, then stores `converted_url`
and flips the status to `ready`. See `server/src/converter/index.js` — move it to a queue worker (BullMQ / pg-boss) for production.

## Multi-machine
Everything is keyed by `machine_id` (`machines` table already lists EKG-5/8/12/15 as `planned`); `GET /api/catalog?machine=EKG-15`
returns that machine's parts/assemblies/documents/models. The v1 UI loads EKG-10 only (`fetchCatalog('EKG-10')`); add a machine selector later.

## Layout
```
db/schema.sql                generated PostgreSQL schema
server/src/schema.js         tables + columns (single source of truth)  · store/{json,pg}.js · auth.js · converter/
server/seed/ekg10.js         seed with sources
client/src/viewer            Scene (registry, highlight, explode, camera rig), Viewer (HUD, tooltip)
client/src/components        PartPanel, PdfViewer, SearchBox, Drawing, PartMini3D
client/src/pages             catalog, assemblies, documents, search, specs, admin
```
Not done yet: real EKG-10 GLB, real catalogue data/drawings, STEP converter binary, role-based admin users (single admin from env).
