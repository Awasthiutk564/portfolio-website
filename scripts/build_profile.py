#!/usr/bin/env python3
"""
Merge every source into data/profile.json, the single file the site and the
Booglu chatbot read:

    content/manual.json    hand-written baseline (always present)
    content/linkedin.json  from your LinkedIn export   (import_linkedin.py)
    content/resume.json    from your résumé PDF         (import_resume.py)
    data/github.json       live repos + contributions   (sync_github.py)

Rules: for list sections (experience, education, certifications) items are
matched by company+title / school / name; LinkedIn beats résumé beats manual,
so updating LinkedIn or your résumé updates the site. Scalars in "basics" keep
your hand-written value when there is one. Skills found in LinkedIn/résumé that
aren't in a manual category land in an "Also" group.

    python scripts/build_profile.py
"""
import datetime
import json
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "data", "profile.json")


def load(rel):
    p = os.path.join(ROOT, rel)
    return json.load(open(p)) if os.path.exists(p) else None


def norm(*parts):
    return re.sub(r"[^a-z0-9]+", "", " ".join(p or "" for p in parts).lower())


KEYS = {
    "experience": lambda x: norm(x.get("company"), x.get("title")),
    "education": lambda x: norm(x.get("institution")),
    "certifications": lambda x: norm(x.get("name")),
    "honors": lambda x: norm(x.get("title")),
}


def merge_list(section, layers):
    """layers: lowest priority first. Higher layers override matching items
    field by field (non-empty values only), and add new items."""
    merged, order = {}, []
    for layer in layers:
        for item in (layer or {}).get(section, []) or []:
            k = KEYS[section](item)
            if not k:
                continue
            if k not in merged:
                merged[k] = {}
                order.append(k)
            merged[k].update({f: v for f, v in item.items() if v not in (None, "", [])})
            # an explicit "still going" from a higher layer must clear an old end date
            if "end" in item and item["end"] is None and section == "experience":
                merged[k]["end"] = None
    items = [merged[k] for k in order]
    if section in ("experience", "education"):
        # current (no end date) first, then most recent; undated entries last
        items.sort(key=lambda x: (x.get("end") or ("9999" if x.get("start") else "0000"),
                                  x.get("start") or ""), reverse=True)
    return items


def main():
    manual = load("content/manual.json")
    linkedin = load("content/linkedin.json")
    resume = load("content/resume.json")
    github = load("data/github.json")
    layers = [manual, resume, linkedin]  # low -> high priority

    basics = {}
    for layer in [linkedin, resume, manual]:  # manual scalars win
        for k, v in ((layer or {}).get("basics") or {}).items():
            if v not in (None, "", []):
                basics[k] = v

    # skills: manual categories, plus anything new from linkedin / résumé
    skills = [dict(c, items=list(c["items"])) for c in manual.get("skills", [])]
    known = {norm(s) for c in skills for s in c["items"]}
    extra = []
    for layer in (linkedin, resume):
        for s in (layer or {}).get("skills", []) or []:
            if norm(s) and norm(s) not in known:
                known.add(norm(s))
                extra.append(s)
    if extra:
        skills.append({"category": "Also", "items": extra})

    # projects: featured repos enriched with live GitHub data, then non-GitHub ones.
    # Featured = the repos pinned on your GitHub profile, in pin order; with no
    # pins it falls back to featured_projects. Either way featured_projects
    # supplies the hand-written title/tagline/tags for any of your repos.
    login = (github or {}).get("user", {}).get("login", "Awasthiutk564")
    repos = {r["name"].lower(): r for r in (github or {}).get("repos", [])}
    notes = {f["repo"].lower(): f for f in manual.get("featured_projects", [])}
    hidden = {norm(n) for n in manual.get("hidden_repos", [])}
    pins = (github or {}).get("pinned") or []
    if pins:
        featured = [(r, notes.get(r["name"].lower(), {}) if r["owner"].lower() == login.lower() else {}) for r in pins]
    else:
        featured = [(repos.get(f["repo"].lower(), {}), f) for f in manual.get("featured_projects", [])]

    def project(r, f, is_featured):
        name = r.get("name") or f["repo"]
        return {
            "title": f.get("title") or name.replace("-", " ").replace("_", " "),
            "repo": name,
            "tagline": f.get("tagline"),
            "description": f.get("description") or r.get("description"),
            "tags": r.get("topics") or f.get("tags") or ([r["language"]] if r.get("language") else []),
            "url": r.get("url") or f"https://github.com/{login}/{name}",
            "homepage": r.get("homepage"),
            "language": r.get("language"),
            "stars": r.get("stars", 0),
            "forks": r.get("forks", 0),
            "pushed_at": r.get("pushed_at"),
            "featured": is_featured,
        }

    projects, seen = [], set()
    for r, f in featured:
        projects.append(project(r, f, True))
        seen.update({norm(projects[-1]["repo"]), norm(projects[-1]["title"])})
    # every other public, non-fork repo shows up automatically as you create it
    for r in (github or {}).get("repos", []):
        if r["fork"] or r["archived"] or norm(r["name"]) in seen or norm(r["name"]) in hidden:
            continue
        if r["name"].lower() == login.lower():
            continue  # the profile README repo
        projects.append(project(r, notes.get(r["name"].lower(), {}), False))
        seen.update({norm(r["name"]), norm(projects[-1]["title"])})
    for layer in [manual, resume, linkedin]:
        for p in (layer or {}).get("projects", []) or []:
            if norm(p.get("title")) and norm(p.get("title")) not in seen:
                seen.add(norm(p["title"]))
                projects.append({**p, "featured": False, "repo": None})

    profile = {
        "basics": basics,
        "focus": manual.get("focus", []),
        "now": manual.get("now", {}),
        "experience": merge_list("experience", layers),
        "education": merge_list("education", layers),
        "certifications": merge_list("certifications", layers),
        "honors": merge_list("honors", layers),
        "skills": skills,
        "skill_icons": manual.get("skill_icons", ""),
        "projects": projects,
        "github": {k: github[k] for k in ("user", "totals", "languages", "contributions")} if github else None,
        "_meta": {
            "built_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sources": {
                "manual": True,
                "linkedin": (linkedin or {}).get("_imported_at"),
                "resume": (resume or {}).get("_imported_at"),
                "github": (github or {}).get("generated_at"),
            },
            "resume_pdf": os.path.exists(os.path.join(ROOT, "data", "resume.pdf")),
        },
    }

    if os.path.exists(OUT):
        old = json.load(open(OUT))
        old["_meta"]["built_at"] = profile["_meta"]["built_at"]
        if old == profile:
            print("profile unchanged")
            return
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)
    print(f"wrote {OUT}: {len(profile['experience'])} roles, {len(profile['projects'])} projects, "
          f"{len(profile['certifications'])} certifications")


if __name__ == "__main__":
    main()
