"""Compose a base scene with a circular magnifier inset cut from a three-panel macro.

usage: python compose_inset.py BASE.png MACRO3PANEL.png OUT_DIR PREFIX --point x,y --inset cx,cy,r [--src-r 45] [--macro-cx 0.49]

The inset shows the H/S/B panel of the macro; the teal ring, the small source
ring at --point and the leader line are drawn here. Used by Q1 and Q3.
"""
import argparse, math
from PIL import Image, ImageDraw

TEAL = (0, 98, 107, 255)

def skin_bands(img, thresh=0.25):
    small = img.convert("RGB").resize((img.width // 8, img.height // 8))
    px = small.load(); w, h = small.size
    rows = [sum(1 for x in range(w) if (lambda r, g, b: r > g > b and r - b > 35 and r > 150)(*px[x, y])) / w for y in range(h)]
    bands, cur = [], None
    for y, f in enumerate(rows):
        if f > thresh and cur is None: cur = y
        elif f <= thresh and cur is not None: bands.append((cur * 8, y * 8)); cur = None
    if cur is not None: bands.append((cur * 8, h * 8))
    return sorted(sorted(bands, key=lambda b: b[1] - b[0])[-3:])

def circle_crop(img, size):
    img = img.resize((size, size), Image.LANCZOS).convert("RGBA")
    m = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(m).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    img.putalpha(m.resize((size, size), Image.LANCZOS)); return img

ap = argparse.ArgumentParser()
ap.add_argument("base"); ap.add_argument("macro"); ap.add_argument("outdir"); ap.add_argument("prefix")
ap.add_argument("--point", required=True); ap.add_argument("--inset", required=True)
ap.add_argument("--src-r", type=int, default=45); ap.add_argument("--macro-cx", type=float, default=0.49)
a = ap.parse_args()
base = Image.open(a.base).convert("RGBA"); W, H = base.size
macro = Image.open(a.macro).convert("RGB"); bands = skin_bands(macro); assert len(bands) == 3, bands
fx, fy = (int(v) for v in a.point.split(",")); icx, icy, ir = (int(v) for v in a.inset.split(","))
lw = max(3, W // 420)
for state, (y0, y1) in zip(("h", "s", "b"), bands):
    side = y1 - y0; cx = int(macro.width * a.macro_cx)
    tile = macro.crop((cx - side // 2, y0, cx - side // 2 + side, y1))
    c = base.copy(); d = ImageDraw.Draw(c)
    ang = math.atan2(icy - fy, icx - fx)
    d.line((fx + math.cos(ang) * a.src_r, fy + math.sin(ang) * a.src_r, icx - math.cos(ang) * ir, icy - math.sin(ang) * ir), fill=TEAL, width=lw)
    d.ellipse((fx - a.src_r, fy - a.src_r, fx + a.src_r, fy + a.src_r), outline=TEAL, width=lw)
    c.alpha_composite(circle_crop(tile, ir * 2), (icx - ir, icy - ir))
    d.ellipse((icx - ir, icy - ir, icx + ir, icy + ir), outline=TEAL, width=lw + 2)
    out = f"{a.outdir}/{a.prefix}-{state}.png"; c.convert("RGB").save(out, optimize=True); print("wrote", out)
