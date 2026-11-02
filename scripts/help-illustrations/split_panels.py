"""Split a vertically stacked three-panel image into three 3:2 frames.

usage: python split_panels.py IN.png OUT_DIR PREFIX [--cx 0.5]

The gaps are the brightest uniform rows near the thirds; trimming of an outer
frame is capped at 5 % of the height; all three frames get the same height.
"""
import argparse, statistics
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument("src"); ap.add_argument("outdir"); ap.add_argument("prefix")
ap.add_argument("--cx", type=float, default=0.5); a = ap.parse_args()
im = Image.open(a.src).convert("RGB"); W, H = im.size
S = 4; small = im.resize((W // S, H // S)); px = small.load(); w, h = small.size
def row_stats(y):
    cols = [px[x, y] for x in range(w)]
    med = tuple(statistics.median(c[i] for c in cols) for i in range(3))
    uni = sum(1 for c in cols if max(abs(c[i] - med[i]) for i in range(3)) <= 6) / w
    return med, uni
stats = [row_stats(y) for y in range(h)]
def uniform(y): med, uni = stats[y]; return uni > 0.9 and min(med) > 222
def best_gap(lo, hi):
    win = [y for y in range(int(lo * h), int(hi * h)) if uniform(y)]
    assert win, f"no uniform light rows in {lo:.2f}-{hi:.2f}"
    peak = max(min(stats[y][0]) for y in win)          # brightest uniform rows = the gap
    ys = [y for y in win if min(stats[y][0]) >= peak - 3]
    runs, cur = [], [ys[0]]
    for y in ys[1:]:
        if y == cur[-1] + 1: cur.append(y)
        else: runs.append(cur); cur = [y]
    runs.append(cur); run = max(runs, key=len); return run[0], run[-1] + 1
g1 = best_gap(0.29, 0.38); g2 = best_gap(0.62, 0.71)
gap_col = stats[(g1[0] + g1[1]) // 2][0]
def like_gap(y): med, uni = stats[y]; return uni > 0.9 and max(abs(med[i] - gap_col[i]) for i in range(3)) <= 4
LIM = int(0.05 * h)
top = 0
while top < LIM and like_gap(top): top += 1
bot = h
while bot > h - LIM and like_gap(bot - 1): bot -= 1
a1, b1 = g1; a2, b2 = g2
while a1 > g1[0] - LIM and like_gap(a1 - 1): a1 -= 1
while b1 < g1[1] + LIM and like_gap(b1): b1 += 1
while a2 > g2[0] - LIM and like_gap(a2 - 1): a2 -= 1
while b2 < g2[1] + LIM and like_gap(b2): b2 += 1
bands = [(top * S, a1 * S), (b1 * S, a2 * S), (b2 * S, bot * S)]
ph = min(y1 - y0 for y0, y1 in bands)  # same height for all three
for state, (y0, y1) in zip(("h", "s", "b"), bands):
    yc = (y0 + y1) // 2; y0 = yc - ph // 2; y1 = y0 + ph
    pw = min(W, int(round(ph * 1.5))); x0 = max(0, min(W - pw, int(W * a.cx - pw / 2)))
    tile = im.crop((x0, y0, x0 + pw, y1)); out = f"{a.outdir}/{a.prefix}-{state}.png"
    tile.save(out, optimize=True); print("wrote", out, tile.size, "band", (y0, y1))
