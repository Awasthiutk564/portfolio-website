#!/usr/bin/env python3
"""
Import sources/resume.pdf into content/resume.json.

1. Publishes the PDF as /resume.pdf so the site's download button is always
   your latest résumé.
2. If GEMINI_API_KEY is set, sends the PDF to Gemini and asks for structured
   JSON (experience, education, skills, projects, certifications...). The same
   key already powers the Booglu chatbot; add it as a repo secret for Actions.

Skips the API call when the PDF hasn't changed since the last import.

    GEMINI_API_KEY=... python scripts/import_resume.py
"""
import base64
import datetime
import hashlib
import json
import os
import shutil
import sys
import urllib.error
import urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "sources", "resume.pdf")
PUBLIC = os.path.join(ROOT, "data", "resume.pdf")  # served as /resume.pdf
OUT = os.path.join(ROOT, "content", "resume.json")
KEY = os.environ.get("GEMINI_API_KEY", "")
MODELS = [os.environ["GEMINI_MODEL"]] if os.environ.get("GEMINI_MODEL") else ["gemini-2.5-flash", "gemini-2.0-flash"]

PROMPT = """You are a résumé parser. Read the attached résumé and return ONLY a JSON
object with this exact shape (omit a key or use [] when the résumé has nothing
for it; never invent facts, numbers or dates that are not in the document):

{
  "basics": {"name": str, "label": str, "summary": str, "location": str},
  "experience": [{"company": str, "title": str, "location": str|null,
                  "start": "YYYY-MM"|null, "end": "YYYY-MM"|null,
                  "summary": str|null, "highlights": [str]}],
  "education": [{"institution": str, "degree": str|null, "area": str|null,
                 "start": "YYYY-MM"|null, "end": "YYYY-MM"|null, "summary": str|null}],
  "certifications": [{"name": str, "issuer": str|null, "date": "YYYY-MM"|null, "url": str|null}],
  "skills": [str],
  "projects": [{"title": str, "description": str|null, "url": str|null, "tags": [str]}],
  "honors": [{"title": str, "description": str|null, "date": "YYYY-MM"|null}]
}

Rules: "end" is null for a current role. Keep summaries to one or two
sentences in the résumé's own words. Do NOT include phone numbers, street
addresses, dates of birth or any ID numbers anywhere in the output."""


def sha256(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def gemini(pdf_bytes):
    body = json.dumps({
        "contents": [{"parts": [
            {"inline_data": {"mime_type": "application/pdf", "data": base64.b64encode(pdf_bytes).decode()}},
            {"text": PROMPT},
        ]}],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }).encode()
    last = None
    for model in MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        req = urllib.request.Request(url, data=body, headers={
            "Content-Type": "application/json", "x-goog-api-key": KEY})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            last = f"{model}: HTTP {e.code} {e.read().decode()[:300]}"
            if e.code == 404:  # model retired -> try the next one
                continue
            raise RuntimeError(last)
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return model, json.loads(text)
    raise RuntimeError(f"no Gemini model available ({last})")


def main():
    if not os.path.exists(SRC):
        print("no sources/resume.pdf -- skipping")
        return
    shutil.copyfile(SRC, PUBLIC)
    print(f"published {PUBLIC}")

    digest = sha256(SRC)
    if os.path.exists(OUT) and json.load(open(OUT)).get("_pdf_sha256") == digest:
        print("résumé unchanged since last import -- skipping extraction")
        return
    if not KEY:
        print("::warning::GEMINI_API_KEY not set -- résumé PDF published but not parsed. "
              "Add it under Settings -> Secrets and variables -> Actions.")
        return

    model, parsed = gemini(open(SRC, "rb").read())
    parsed = {k: v for k, v in parsed.items() if k in
              {"basics", "experience", "education", "certifications", "skills", "projects", "honors"}}
    parsed.update({"_source": "resume", "_model": model, "_pdf_sha256": digest,
                   "_imported_at": datetime.date.today().isoformat()})
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(parsed, f, indent=2, ensure_ascii=False)
    print(f"wrote {OUT} via {model}: {len(parsed.get('experience', []))} roles, "
          f"{len(parsed.get('skills', []))} skills, {len(parsed.get('projects', []))} projects")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"::error::résumé import failed: {e}")
        sys.exit(1)
