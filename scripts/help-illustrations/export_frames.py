"""Export the approved PNG composites as 3:2 WebP frames for the app.

usage: python export_frames.py SRC_DIR OUT_DIR [--width 1200] [--height 800] [--quality 82]

Reads SRC_DIR/q{N}-{h,s,b}.png for N = 1..12, centre-crops each to width:height,
resamples with Lanczos and writes OUT_DIR/q{NN}-{state}.webp. Exits non-zero
when a source file is missing.
"""
import argparse
import pathlib
import sys

from PIL import Image

STATES = ("h", "s", "b")
QUESTIONS = range(1, 13)


def center_crop(im: Image.Image, ratio: float) -> Image.Image:
    w, h = im.size
    if w / h > ratio:
        nw = round(h * ratio)
        x0 = (w - nw) // 2
        return im.crop((x0, 0, x0 + nw, h))
    nh = round(w / ratio)
    y0 = (h - nh) // 2
    return im.crop((0, y0, w, y0 + nh))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--width", type=int, default=1200)
    ap.add_argument("--height", type=int, default=800)
    ap.add_argument("--quality", type=int, default=82)
    a = ap.parse_args()
    src, out = pathlib.Path(a.src), pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    missing = []
    for q in QUESTIONS:
        for s in STATES:
            path = src / f"q{q}-{s}.png"
            if not path.exists():
                missing.append(str(path))
                continue
            im = Image.open(path).convert("RGB")
            im = center_crop(im, a.width / a.height).resize((a.width, a.height), Image.LANCZOS)
            target = out / f"q{q:02d}-{s}.webp"
            im.save(target, "WEBP", quality=a.quality, method=6)
            print(f"{target.name} {im.size}")
    if missing:
        sys.exit("missing sources:\n  " + "\n  ".join(missing))


if __name__ == "__main__":
    main()
