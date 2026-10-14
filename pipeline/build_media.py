"""Convert the approved images in design/media/ into web/public/media/.

Only the files listed in design/MEDIA_LIST.md are copied. Photos become WebP,
max 1600 px on the long edge, under 200 KB each (CLAUDE.md "Speed"). The hero
truck and the SVG backups are copied as they are: the truck is already a small
733 px WebP and must not be resampled.

Usage:  python pipeline/build_media.py
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
SRC, SRC_PHOTOS = ROOT / "design/media", ROOT / "design/media/photos"
OUT = ROOT / "web/public/media"

MAX_EDGE = 1600
MAX_KB = 200

# Portrait photos never render taller than a card, so capping their long edge
# lower keeps the compression quality high instead of spending pixels on height
# the layout never uses.
MAX_EDGE_OVERRIDE = {"p7-cold-snap-street.jpg": 1200}

# Photos listed in design/MEDIA_LIST.md. Converted to WebP.
PHOTOS = [
    "p1-winter-highway-truck.jpg",
    "p2-steel-drums.jpg",
    "p4-bulk-tank-trailer.jpg",
    "p7-cold-snap-street.jpg",
    "p8-arrived-cold.jpg",
    "p9-closing-band-aerial-terminal.jpg",
]

# Copied byte for byte: already optimised, or vector.
VERBATIM = [
    "hero-truck-branded.webp",
    "hero-truck-unbranded.webp",
    "tank-truck.svg",
    "truck-top-view.svg",
]


def convert(src: Path, dst: Path, max_edge: int = MAX_EDGE) -> str:
    # design/MEDIA_LIST.md: every photo displays in black and white. Converting
    # for real (rather than only with a CSS filter) drops the chroma channels,
    # which buys a lot of quality inside the size budget and keeps the look even
    # if the CSS filter is not applied.
    im = Image.open(src).convert("L")
    w, h = im.size
    if max(w, h) > max_edge:
        scale = max_edge / max(w, h)
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

    # Step quality down until the file fits the budget.
    for q in (82, 76, 70, 64, 58, 52, 46, 40):
        im.save(dst, "WEBP", quality=q, method=6)
        if dst.stat().st_size <= MAX_KB * 1024:
            break
    kb = dst.stat().st_size / 1024
    flag = "" if kb <= MAX_KB else "  OVER BUDGET"
    return f"{dst.name:40} {im.size[0]}x{im.size[1]}  q={q}  {kb:6.1f} KB{flag}"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    missing, over = [], []

    for name in PHOTOS:
        src = SRC_PHOTOS / name
        if not src.exists():
            missing.append(str(src.relative_to(ROOT)))
            continue
        line = convert(src, OUT / (Path(name).stem + ".webp"),
                       MAX_EDGE_OVERRIDE.get(name, MAX_EDGE))
        if "OVER BUDGET" in line:
            over.append(line)
        print(line)

    for name in VERBATIM:
        src = SRC / name
        if not src.exists():
            missing.append(str(src.relative_to(ROOT)))
            continue
        (OUT / name).write_bytes(src.read_bytes())
        print(f"{name:40} copied as-is    {(OUT / name).stat().st_size / 1024:6.1f} KB")

    if missing:
        print("\nMISSING (listed in design/MEDIA_LIST.md but not on disk):")
        for m in missing:
            print("  " + m)
    if over:
        print(f"\n{len(over)} file(s) over the {MAX_KB} KB budget.")
    total = sum(f.stat().st_size for f in OUT.iterdir() if f.is_file())
    print(f"\n{len(list(OUT.iterdir()))} files in web/public/media/, {total / 1024:.0f} KB total")
    return 1 if (missing or over) else 0


if __name__ == "__main__":
    raise SystemExit(main())
