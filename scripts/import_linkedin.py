#!/usr/bin/env python3
"""
Import a LinkedIn data export into content/linkedin.json.

LinkedIn has no public API for reading your own profile, and scraping it breaks
their terms (and gets blocked). The supported route is the official export:
LinkedIn -> Settings -> Data privacy -> Get a copy of your data. Drop the ZIP
(or the unzipped folder) into sources/linkedin/ and push; the workflow runs this.

PRIVACY: this repo is public, so upload ONLY the public-profile CSVs listed in
ALLOWED (Positions, Education, Certifications, Skills, Projects, Honors) --
never the whole ZIP, which also holds your messages, connections, address and
birth date. Anything else is ignored here and deleted by the workflow.

    python scripts/import_linkedin.py [path-to-zip-or-folder]
"""
import csv
import datetime
import glob
import io
import json
import os
import sys
import zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC_DIR = os.path.join(ROOT, "sources", "linkedin")
OUT = os.path.join(ROOT, "content", "linkedin.json")

ALLOWED = {"positions", "education", "certifications", "skills", "projects", "honors"}

MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


def find_source(arg):
    if arg:
        return arg
    zips = sorted(glob.glob(os.path.join(SRC_DIR, "*.zip")), key=os.path.getmtime)
    if zips:
        return zips[-1]  # newest export wins
    if glob.glob(os.path.join(SRC_DIR, "**", "*.csv"), recursive=True):
        return SRC_DIR
    return None


def read_csvs(src):
    """{lowercase file stem: [row dicts]} from a zip or folder."""
    files = {}
    if zipfile.is_zipfile(src):
        with zipfile.ZipFile(src) as z:
            for n in z.namelist():
                stem = os.path.splitext(os.path.basename(n))[0].lower()
                if n.lower().endswith(".csv") and stem in ALLOWED:
                    files[os.path.splitext(os.path.basename(n))[0].lower()] = z.read(n).decode("utf-8-sig")
    else:
        for p in glob.glob(os.path.join(src, "**", "*.csv"), recursive=True):
            if os.path.splitext(os.path.basename(p))[0].lower() not in ALLOWED:
                continue
            files[os.path.splitext(os.path.basename(p))[0].lower()] = open(p, encoding="utf-8-sig").read()

    tables = {}
    for name, text in files.items():
        lines = text.splitlines()
        # some exports prepend a "Notes:" preamble; start at the first header-looking row
        start = next((i for i, l in enumerate(lines) if "," in l and not l.lower().startswith("notes")), 0)
        rows = list(csv.DictReader(io.StringIO("\n".join(lines[start:]))))
        tables[name] = [{(k or "").strip(): (v or "").strip() for k, v in r.items()} for r in rows]
    return tables


def ym(value):
    """'Dec 2025' / '2025' / '12/2025' -> '2025-12' (or '2025')."""
    v = (value or "").strip()
    if not v:
        return None
    parts = v.replace("/", " ").split()
    if len(parts) == 2 and parts[0][:3].lower() in MONTHS:
        return f"{parts[1]}-{MONTHS[parts[0][:3].lower()]:02d}"
    if len(parts) == 2 and parts[0].isdigit():
        return f"{parts[1]}-{int(parts[0]):02d}"
    if v.isdigit():
        return v
    return v


def main():
    src = find_source(sys.argv[1] if len(sys.argv) > 1 else None)
    if not src:
        print("no LinkedIn export found in sources/linkedin/ -- skipping")
        return
    t = read_csvs(src)
    out = {"_source": "linkedin", "_imported_at": datetime.date.today().isoformat()}

    out["experience"] = [{
        "company": r.get("Company Name"),
        "title": r.get("Title"),
        "location": r.get("Location") or None,
        "start": ym(r.get("Started On")),
        "end": ym(r.get("Finished On")),
        "summary": r.get("Description") or None,
    } for r in t.get("positions", []) if r.get("Company Name")]

    out["education"] = [{
        "institution": r.get("School Name"),
        "degree": r.get("Degree Name") or None,
        "area": None,
        "start": ym(r.get("Start Date")),
        "end": ym(r.get("End Date")),
        "summary": r.get("Notes") or r.get("Activities") or None,
    } for r in t.get("education", []) if r.get("School Name")]

    out["certifications"] = [{
        "name": r.get("Name"),
        "issuer": r.get("Authority") or None,
        "date": ym(r.get("Started On")),
        "url": r.get("Url") or None,
    } for r in t.get("certifications", []) if r.get("Name")]

    out["skills"] = [r.get("Name") for r in t.get("skills", []) if r.get("Name")]

    out["projects"] = [{
        "title": r.get("Title"),
        "description": r.get("Description") or None,
        "url": r.get("Url") or None,
        "start": ym(r.get("Started On")),
        "end": ym(r.get("Finished On")),
    } for r in t.get("projects", []) if r.get("Title")]

    out["honors"] = [{
        "title": r.get("Title"),
        "description": r.get("Description") or None,
        "date": ym(r.get("Issued On")),
    } for r in t.get("honors", []) if r.get("Title")]

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"wrote {OUT}: {len(out['experience'])} positions, {len(out['education'])} schools, "
          f"{len(out['certifications'])} certifications, {len(out['skills'])} skills")


if __name__ == "__main__":
    main()
