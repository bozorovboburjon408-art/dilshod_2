"""EKG-15 maketi: 3 mm fanera uchun lazer kesish fayllari (CorelDRAW SVG formati).
Ishga tushirish:  python3 generate.py   -> sheet-1.svg, sheet-2.svg ... va parts.md
"""
import math, os, sys
SK = "/root/.claude/skills/synced/52a811f1-b2ca-4870-9d80-3808a921e92f_499c02e7-41e0-4155-8007-47746c27b6c5/laser-cut-svg/scripts"
sys.path.insert(0, os.environ.get("CORELSVG", SK))
from corel_svg import Sheet, shelf_pack

T = 3.0          # fanera qalinligi
CL = 0.0         # pazga qo'shimcha zazor (3 mm fanerada press-fit uchun 0; erkin uchun 0.1-0.2)
SW = T + CL      # paz kengligi
SHEET_W, SHEET_H = 700, 600

def rect(x, y, w, h): return [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
def hslot(cx, cy, l): return rect(cx - l / 2, cy - SW / 2, l, SW)   # gorizontal paz (uzunlik l)
def vslot(cx, cy, l): return rect(cx - SW / 2, cy - l / 2, SW, l)   # vertikal paz

def tabbed(w, h, bot=(), top=(), left=(), right=()):
    """To'g'ri to'rtburchak, chetlarida T balandlikdagi tishlar. Tish: (markaz, uzunlik)."""
    p = [(0, 0)]
    for c, l in sorted(top): p += [(c - l / 2, 0), (c - l / 2, -T), (c + l / 2, -T), (c + l / 2, 0)]
    p.append((w, 0))
    for c, l in sorted(right): p += [(w, c - l / 2), (w + T, c - l / 2), (w + T, c + l / 2), (w, c + l / 2)]
    p.append((w, h))
    for c, l in sorted(bot, reverse=True): p += [(c + l / 2, h), (c + l / 2, h + T), (c - l / 2, h + T), (c - l / 2, h)]
    p.append((0, h))
    for c, l in sorted(left, reverse=True): p += [(0, c + l / 2), (-T, c + l / 2), (-T, c - l / 2), (0, c - l / 2)]
    return p

def stadium(w, h, n=14):
    r = h / 2; p = []
    for i in range(n + 1):
        a = -math.pi / 2 + math.pi * i / n; p.append((w - r + r * math.cos(a), r + r * math.sin(a)))
    for i in range(n + 1):
        a = math.pi / 2 + math.pi * i / n; p.append((r + r * math.cos(a), r + r * math.sin(a)))
    return p

def gear(cx, cy, ro, ri, teeth):
    p = []
    for i in range(teeth):
        a = 2 * math.pi * i / teeth; s = 2 * math.pi / teeth
        for k, r in ((0, ri), (.18, ro), (.5, ro), (.68, ri)):
            p.append((cx + r * math.cos(a + k * s), cy + r * math.sin(a + k * s)))
    return p

def spoke_wheel(r, n, hub=3.0):
    """Spitsali g'ildirak: tashqi aylana + spitsalar orasidagi teshiklar + o'q teshigi."""
    out = [("circle", r, r, r), ("circle", r, r, hub)]
    for i in range(n):
        a0 = 2 * math.pi * i / n; da = 2 * math.pi / n; g = 0.13 * da * 1.0
        ri, ro = hub + 3.5, r - 3.0
        pts = []
        for k in range(7): a = a0 + g + (da - 2 * g) * k / 6; pts.append((r + ro * math.cos(a), r + ro * math.sin(a)))
        for k in range(6, -1, -1): a = a0 + g + (da - 2 * g) * k / 6; pts.append((r + ri * math.cos(a), r + ri * math.sin(a)))
        out.append(pts)
    return out

def truss(L, h1, h2, nseg, slot_x=(), bar=4.5):
    """Konussimon ferma paneli (L x h1 -> h2), uchburchak oynalar."""
    hh = lambda x: h1 - (h1 - h2) * x / L
    top = lambda x: (h1 - hh(x)) / 2
    outer = [(0, top(0)), (L, top(L)), (L, top(L) + hh(L)), (0, h1)]
    holes = []; seg = L / nseg
    for i in range(nseg):
        x0, x1 = i * seg + bar * .7, (i + 1) * seg - bar * .7; xm = (x0 + x1) / 2
        tp = lambda x: top(x) + bar; bt = lambda x: top(x) + hh(x) - bar
        holes.append([(x0, bt(x0)), (x1, bt(x1)), (xm, tp(xm))] if i % 2 == 0 else [(x0, tp(x0)), (x1, tp(x1)), (xm, bt(xm))])
    for sx in slot_x: holes.append(vslot(sx, h1 / 2, 8))
    holes += [("circle", 7, h1 / 2, 2.5), ("circle", L - 6, h1 / 2, 2.5)]
    return [outer] + holes

PARTS = []   # (nom, soni, [konturlar])
def part(name, qty, outlines): PARTS.append((name, qty, outlines))

# ---------- Korpus (190 x 100 x 50) ----------
HL, HW, HH = 190, 100, 50
wall_x = (25, 95, 165)
floor = [rect(0, 0, HL, HW)]
for y in (15, 85):
    for x in wall_x: floor.append(hslot(x, y, 10))
for x in (15, 175):
    for y in (36.5, 63.5): floor.append(vslot(x, y, 10))
floor += [("circle", HL / 2, HW / 2, 8)]
part("Korpus poli", 1, floor)
side = [tabbed(HL, HH, bot=[(x, 10) for x in wall_x], top=[(x, 10) for x in wall_x])]
for i, wx in enumerate((45, 90, 135)): side.append(rect(wx - 14, 12, 28, 22))
for x in (15, 175): side.append(vslot(x, HH / 2, 20))
part("Korpus yon devori", 2, side)
endw = [tabbed(67, HH, bot=[(20, 10), (47, 10)], top=[(20, 10), (47, 10)], left=[(HH / 2, 20)], right=[(HH / 2, 20)])]
endw.append(rect(15, 12, 37, 22))
part("Korpus old/orqa devori", 2, endw)
roof = [rect(0, 0, HL, HW)]
for y in (15, 85):
    for x in wall_x: roof.append(hslot(x, y, 10))
for x in (15, 175):
    for y in (36.5, 63.5): roof.append(vslot(x, y, 10))
roof += [rect(HL - 76, HW / 2 - 23, 46, 46)]          # kabina o'rni (kabina poli 46x46 shu yerga o'tiradi)
part("Korpus tomi", 1, roof)

# ---------- Kabina (46 x 46 x 36) ----------
cb = [rect(0, 0, 46, 46)]
for x in (15, 31): cb += [hslot(x, 4.5, 10), hslot(x, 41.5, 10)]
for y in (15, 31): cb += [vslot(4.5, y, 10), vslot(41.5, y, 10)]
part("Kabina asosi", 1, cb)
cw = [tabbed(40, 36, bot=[(12, 10), (28, 10)])] + [rect(5, 8, 13, 15), rect(22, 8, 13, 15)]
part("Kabina devori", 4, cw)
part("Kabina tomi", 1, [rect(0, 0, 50, 50)])

# ---------- Aylanma platforma ----------
part("Aylanma disk", 1, [("circle", 46, 46, 46), ("circle", 46, 46, 10)] + [("circle", 46 + 30 * math.cos(i * math.pi / 4), 46 + 30 * math.sin(i * math.pi / 4), 3) for i in range(8)])
part("Aylanma halqa", 1, [("circle", 40, 40, 40), ("circle", 40, 40, 24)])
part("Tayanch xalqa", 1, [("circle", 28, 28, 28), ("circle", 28, 28, 12)])

# ---------- Gusenitsa ----------
part("Gusenitsa ramasi", 2, [stadium(220, 28)] + [("circle", 14 + i * 32, 14, 3) for i in range(7)] + [rect(14 + i * 32 + 8, 9, 16, 10) for i in range(6)])
part("Tayanch g'ildirak", 10, [("circle", 9, 9, 9), ("circle", 9, 9, 3)])
part("Yetaklovchi g'ildirak", 4, [gear(15, 15, 15, 12, 16), ("circle", 15, 15, 3)])
part("Gusenitsa zveno", 60, [rect(0, 0, 14, 24), ("circle", 3.5, 12, 1.5), ("circle", 10.5, 12, 1.5)])

# ---------- Strela, A-ramka, bloklar ----------
part("Strela paneli", 2, truss(280, 36, 20, 8, slot_x=(70, 140, 210)))
part("Strela ko'ndalang", 3, [tabbed(54, 14, left=[(7, 8)], right=[(7, 8)], bot=[], top=[])] if False else [tabbed(54, 14, left=[(7, 8)], right=[(7, 8)])])
part("Kanat bloki", 2, spoke_wheel(18, 6))
part("A-ramka paneli", 2, [[(0, 90), (14, 0), (46, 0), (60, 90)], [(30, 12), (40, 32), (20, 32)], [(15, 40), (45, 40), (50, 76), (10, 76)], vslot(30, 36, 8)])
part("A-ramka tayanchi", 2, [tabbed(54, 12, left=[(6, 8)], right=[(6, 8)])])

# ---------- Kovsh ----------
bs = [[(0, 6), (8, 0), (56, 0), (66, 56), (10, 56), (0, 44)], vslot(4.5, 29, 14), hslot(27, 50.5, 14), ("circle", 58, 8, 2.5), ("circle", 20, 8, 2.5)]
part("Kovsh yon plastinasi", 2, bs)
part("Kovsh orqasi", 1, [tabbed(40, 38, left=[(19, 14)], right=[(19, 14)])])
bot = [tabbed(40, 56, left=[(36, 14)], right=[(36, 14)])] + [rect(4 + i * 8 - 3, 52 - SW / 2 + 0, 6, SW) for i in range(5)]
part("Kovsh tubi", 1, [bot[0]] + [hslot(4 + i * 8 + 0, 52, 6) for i in range(5)])
part("Kovsh tishi", 5, [[(0, 0), (6, 0), (6, 3), (7, 3), (7, 14)] if False else [(1, 0), (7, 0), (7, 3), (8, 3), (8, 0.0 + 3), (8, 16), (4, 20), (0, 16), (0, 3), (1, 3)]])
part("Rukoyat", 2, [stadium(130, 12), ("circle", 6, 6, 2.5), ("circle", 124, 6, 2.5)])

# ---------- Qo'shimcha ----------
part("Orqa og'irlik", 5, [rect(0, 0, 90, 40), ("circle", 8, 8, 2), ("circle", 82, 32, 2)])
part("Panjara (uzun)", 2, [rect(0, 0, 190, 14)] + [rect(5 + i * 23, 3.5, 18, 7) for i in range(8)])
part("Panjara (qisqa)", 2, [rect(0, 0, 100, 14)] + [rect(5 + i * 23, 3.5, 18, 7) for i in range(4)])
part("Zina", 2, [rect(0, 0, 12, 46)] + [rect(3, 5 + i * 10, 6, 5) for i in range(4)])
# sinov kartasi: paz kengligi sinovi (kerf) + 10x10 teshik/tiqin
tc = [rect(0, 0, 60, 24)] + [vslot(8 + i * 11, 12, 12)[:0] or rect(8 + i * 11 - (T - 0.2 + 0.1 * i) / 2, 6, T - 0.2 + 0.1 * i, 12) for i in range(5)]
part("Sinov kartasi A", 1, tc)
part("Sinov kartasi B (10x10 tiqin)", 1, [rect(0, 0, 10, 10)])

# ---------- Joylashtirish ----------
def bbox(outer):
    if isinstance(outer, tuple): _, cx, cy, r = outer; return cx - r, cy - r, cx + r, cy + r
    xs, ys = [p[0] for p in outer], [p[1] for p in outer]; return min(xs), min(ys), max(xs), max(ys)
def shift(o, dx, dy):
    return ("circle", o[1] + dx, o[2] + dy, o[3]) if isinstance(o, tuple) else [(x + dx, y + dy) for x, y in o]

items = []
for name, qty, outl in PARTS:
    x0, y0, x1, y1 = bbox(outl[0])
    for _ in range(qty): items.append((name, outl, x0, y0, x1 - x0, y1 - y0))
items.sort(key=lambda it: -it[5])
sheets, cur = [], []
for it in items:
    try: shelf_pack([(i[4], i[5]) for i in cur + [it]], SHEET_W, SHEET_H)
    except ValueError: sheets.append(cur); cur = []
    cur.append(it)
sheets.append(cur)

out = os.path.dirname(os.path.abspath(__file__))
md = ["# EKG-15 — detallar ro'yxati", f"Material: {T:g} mm fanera, varaq {SHEET_W}x{SHEET_H} mm, paz kengligi {SW:g} mm.", ""]
for n, cur in enumerate(sheets, 1):
    s = Sheet(SHEET_W, SHEET_H)
    pos = shelf_pack([(i[4], i[5]) for i in cur], SHEET_W, SHEET_H)
    for (name, outl, x0, y0, w, h), (px, py) in zip(cur, pos): s.compound([shift(o, px - x0, py - y0) for o in outl])
    s.save(os.path.join(out, f"sheet-{n}.svg"))
    md.append(f"## sheet-{n}.svg — {len(cur)} detal")
    from collections import Counter
    for k, v in Counter(i[0] for i in cur).items(): md.append(f"- {k} × {v}")
    md.append("")
open(os.path.join(out, "parts.md"), "w", encoding="utf-8").write("\n".join(md))
print(len(items), "detal,", len(sheets), "varaq")
