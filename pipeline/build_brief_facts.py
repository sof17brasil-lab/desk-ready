"""Build web/public/data/brief_facts.json from sources/SOURCES.md.

CLAUDE.md rule 8: the site reads numbers only from web/public/data/*.json, never
from text typed into a page. So every quote, date and link on the brief page comes
from the SOURCES.md table, parsed here.

The display figures (78%, 39.3% ...) are declared in FACTS below, but none of them
is trusted on its own: each is asserted to appear inside the exact words of the row
it cites. If a source is re-read and its wording changes, the assertion fails and
the build stops rather than publishing a number its own quote no longer supports.

Usage:  python pipeline/build_brief_facts.py
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
SOURCES = ROOT / "sources/SOURCES.md"
OUT = ROOT / "web/public/data/brief_facts.json"


def norm(t: str) -> str:
    """Fold the typographic variants so a quote can be matched reliably."""
    t = unicodedata.normalize("NFKD", t)
    for a, b in [("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'),
                 ("–", "-"), ("—", "-"), (" ", " "), ("−", "-")]:
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t).strip().lower()


def parse_sources() -> dict[int, dict]:
    """Read the numbered rows of the 'Facts we may use on the site' table."""
    rows: dict[int, dict] = {}
    last_link = ""
    for line in SOURCES.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 6 or not cells[0].isdigit():
            continue
        n, source, date, words, status, link = (cells + [""] * 6)[:6]
        # "same" in the link column means the row above it.
        if link.lower().startswith("same"):
            link = last_link
        else:
            last_link = link
        rows[int(n)] = {"row": int(n), "source": source, "date": date,
                        "exact_words": words, "status": status, "link": link}
    return rows


# Each fact: the figure shown, the label, and the SOURCES rows it rests on.
# `verify` is the literal string that must appear in the cited row's exact words.
FACTS = [
    {"id": "acceptance_now", "figure": "78%", "verify": ("78%", 19),
     "label": "first-tender acceptance, Uber Freight network, Aug 2026", "rows": [19]},
    {"id": "acceptance_prior", "figure": "90 to 94%", "verify": ("90 to 94%", 20),
     "label": "the prior three years", "rows": [20]},
    {"id": "bulk_lead_time", "figure": "7 to 10 days", "verify": ("7 to 10 days", 3),
     "label": "average bulk lead time, up from 24 to 72 hours", "rows": [3]},
    {"id": "lead_time_ask", "figure": "48 to 72 hours", "verify": ("48 to 72 hours", 4),
     "label": "lead time to give carriers", "rows": [4]},
    {"id": "detention_share", "figure": "39.3%", "verify": ("39.3 percent", 27),
     "label": "of all stops had the driver detained, 2023", "rows": [27]},
    {"id": "detention_cost", "figure": "$3.6B / $11.5B", "verify": ("$3.6 billion", 28),
     "label": "direct expenses and lost productivity, industry-wide, 2023", "rows": [28]},
    {"id": "hygiene_swing", "figure": "10% or more", "verify": ("10% or more", 24),
     "label": "swing in rate evaluations from poor shipping hygiene", "rows": [24]},
    {"id": "fraud_share", "figure": "25.6%", "verify": ("25.6%", 22),
     "label": "of reported incidents were ownership-change fraud, Q2", "rows": [22]},
    {"id": "winter_otri_2025", "figure": "6.6% to 8.7%", "verify": ("6.6% to 8.7%", 32),
     "label": "tender rejections, early Jan 2025 (OTRI)", "rows": [32]},
    {"id": "winter_otri_2024", "figure": "4.2% to 5.4%", "verify": ("4.2% to 5.4%", 32),
     "label": "tender rejections, Jan 2024 (OTRI)", "rows": [32]},
    {"id": "detention_speed", "figure": "14.6%", "verify": ("14.6 percent", 29),
     "label": "faster average driving by detained trucks", "rows": [29]},
    {"id": "winter_warming", "figure": "76%", "verify": ("76%", 13),
     "label": "of U.S. locations where winter is the fastest-warming season", "rows": [13]},
    {"id": "coldest_day_warmed", "figure": "7°F", "verify": ("7°F", 14),
     "label": "average warming of the coldest day, 242 U.S. locations, 1970-2023", "rows": [14]},
]

# Quotes used on the site without a figure attached.
QUOTE_ROWS = [1, 2, 5, 8, 10, 11, 13, 14, 21, 23, 25, 26, 30, 31, 35, 36, 37, 38, 39, 40]


def main() -> int:
    rows = parse_sources()
    problems = []

    facts = []
    for f in FACTS:
        text, row_n = f["verify"]
        row = rows.get(row_n)
        if row is None:
            problems.append(f"{f['id']}: SOURCES.md has no row {row_n}")
            continue
        if norm(text) not in norm(row["exact_words"]):
            problems.append(
                f"{f['id']}: \"{text}\" is not in row {row_n}'s exact words.\n"
                f"      row {row_n} says: {row['exact_words'][:120]}")
            continue
        facts.append({"id": f["id"], "figure": f["figure"], "label": f["label"],
                      "sources": [rows[r] for r in f["rows"] if r in rows]})

    quotes = []
    for r in QUOTE_ROWS:
        if r not in rows:
            problems.append(f"quote row {r} is missing from SOURCES.md")
            continue
        quotes.append(rows[r])

    if problems:
        print("brief_facts build FAILED. Nothing written.\n")
        for p in problems:
            print("  - " + p)
        return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"facts": facts, "quotes": quotes,
                               "source_file": "sources/SOURCES.md"}, indent=1) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(facts)} figures, {len(quotes)} quotes, "
          f"all verified against their SOURCES.md row")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
