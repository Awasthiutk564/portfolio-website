#!/usr/bin/env python3
"""
Pull live GitHub data for the portfolio: public repos (stars, forks,
languages, last push), the repos pinned on your profile, plus the last year's
contribution calendar.

Writes data/github.json. Uses only the standard library so the workflow needs
no installs. GITHUB_TOKEN is optional but avoids the 60 req/h anonymous limit;
reading pinned repos needs it (GraphQL has no anonymous access), so without it
the last known pins are kept.

    python scripts/sync_github.py
"""
import datetime
import json
import os
import re
import sys
import urllib.request
from html.parser import HTMLParser

USER = os.environ.get("GH_USER", "Awasthiutk564")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "data", "github.json")
# the repo this sync commits to: every sync commit bumps its pushed_at
SELF = os.environ.get("GITHUB_REPOSITORY", f"{USER}/portfolio-website").lower()


def get(url, accept="application/vnd.github+json"):
    headers = {"User-Agent": "portfolio-sync/1.0", "Accept": accept}
    if TOKEN and "api.github.com" in url:
        headers["Authorization"] = f"Bearer {TOKEN}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as r:
        body = r.read().decode()
    return json.loads(body) if accept.endswith("json") else body


def graphql(query, **variables):
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=json.dumps({"query": query, "variables": variables}).encode(),
        headers={"User-Agent": "portfolio-sync/1.0", "Authorization": f"Bearer {TOKEN}"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        body = json.loads(r.read().decode())
    if body.get("errors"):
        raise RuntimeError("; ".join(e.get("message", "") for e in body["errors"]))
    return body["data"]


PINNED = """
query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name owner { login } url homepageUrl description isPrivate isFork isArchived
          primaryLanguage { name } stargazerCount forkCount pushedAt
          repositoryTopics(first: 10) { nodes { topic { name } } }
        }
      }
    }
  }
}
"""


def pinned():
    """Repos pinned on the profile, in pin order, shaped like the repo list."""
    nodes = graphql(PINNED, login=USER)["user"]["pinnedItems"]["nodes"]
    return [{
        "name": n["name"],
        "owner": n["owner"]["login"],
        "url": n["url"],
        "homepage": n.get("homepageUrl") or None,
        "description": n.get("description"),
        "language": (n.get("primaryLanguage") or {}).get("name"),
        "topics": [t["topic"]["name"] for t in n["repositoryTopics"]["nodes"]],
        "stars": n["stargazerCount"],
        "forks": n["forkCount"],
        "fork": n["isFork"],
        "archived": n["isArchived"],
        "pushed_at": n.get("pushedAt"),
    } for n in nodes if n and not n.get("isPrivate")]


def stable(data):
    """What counts as a change: not the timestamp, and not this repo's own
    pushed_at, which the previous sync commit just moved (an hourly sync would
    otherwise commit and redeploy every hour forever)."""
    mine = f"https://github.com/{SELF}"
    fix = lambda rs: [{**r, "pushed_at": None} if r["url"].lower() == mine else r for r in rs or []]
    return {**data, "generated_at": None, "repos": fix(data.get("repos")), "pinned": fix(data.get("pinned"))}


class CalendarParser(HTMLParser):
    """Collect (date, cell id) from calendar cells and the tooltip text per id."""

    def __init__(self):
        super().__init__()
        self.cells, self.tips, self._tip = [], {}, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "td" and "ContributionCalendar-day" in (a.get("class") or "") and a.get("data-date"):
            self.cells.append((a["data-date"], a.get("id")))
        elif tag == "tool-tip" and a.get("for"):
            self._tip = a["for"]
            self.tips[self._tip] = ""

    def handle_endtag(self, tag):
        if tag == "tool-tip":
            self._tip = None

    def handle_data(self, data):
        if self._tip:
            self.tips[self._tip] += data


def contributions():
    html = get(f"https://github.com/users/{USER}/contributions", accept="text/html")
    p = CalendarParser()
    p.feed(html)
    days = []
    for date, cid in p.cells:
        text = p.tips.get(cid, "").strip()
        m = re.match(r"(\d+)", text)
        days.append({"date": date, "count": int(m.group(1)) if m and "No contributions" not in text else 0})
    days.sort(key=lambda d: d["date"])
    return days


def streaks(days):
    longest = run = 0
    for d in days:
        run = run + 1 if d["count"] else 0
        longest = max(longest, run)
    i = len(days) - 1
    if i >= 0 and days[i]["count"] == 0:
        i -= 1  # today isn't over yet
    current = 0
    while i >= 0 and days[i]["count"]:
        current += 1
        i -= 1
    return current, longest


def main():
    user = get(f"https://api.github.com/users/{USER}")
    repos = get(f"https://api.github.com/users/{USER}/repos?per_page=100&type=owner&sort=pushed")

    out_repos, lang_bytes = [], {}
    for r in repos:
        if r.get("private"):
            continue
        langs = {}
        if not r["fork"]:
            try:
                langs = get(r["languages_url"])
            except Exception as e:  # one repo failing shouldn't sink the sync
                print(f"languages for {r['name']} failed: {e}", file=sys.stderr)
            for k, v in langs.items():
                lang_bytes[k] = lang_bytes.get(k, 0) + v
        out_repos.append({
            "name": r["name"],
            "url": r["html_url"],
            "homepage": r.get("homepage") or None,
            "description": r.get("description"),
            "language": r.get("language"),
            "languages": list(langs.keys())[:5],
            "topics": r.get("topics", []),
            "stars": r["stargazers_count"],
            "forks": r["forks_count"],
            "fork": r["fork"],
            "archived": r.get("archived", False),
            "created_at": r["created_at"],
            "pushed_at": r["pushed_at"],
        })

    try:
        days = contributions()
    except Exception as e:
        print(f"contribution calendar failed: {e}", file=sys.stderr)
        days = []
    current, longest = streaks(days)
    own = [r for r in out_repos if not r["fork"]]

    old = json.load(open(OUT)) if os.path.exists(OUT) else {}
    try:
        pins = pinned()
    except Exception as e:  # keep the last known pins rather than reshuffling the site
        print(f"pinned repos failed: {e}", file=sys.stderr)
        pins = old.get("pinned", [])

    data = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "user": {
            "login": user["login"],
            "url": user["html_url"],
            "avatar": user["avatar_url"],
            "followers": user["followers"],
            "public_repos": user["public_repos"],
        },
        "totals": {
            "repos": len(own),
            "stars": sum(r["stars"] for r in own),
            "forks": sum(r["forks"] for r in own),
            "contributions": sum(d["count"] for d in days),
            "active_days": sum(1 for d in days if d["count"]),
            "current_streak": current,
            "longest_streak": longest,
        },
        "languages": dict(sorted(lang_bytes.items(), key=lambda kv: -kv[1])),
        "repos": out_repos,
        "pinned": pins,
        "contributions": days,
    }

    # don't churn a commit (and a redeploy) when nothing real moved
    if old and stable(old) == stable(data):
        print("github data unchanged")
        return
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(data, f, indent=2)
    print(f"wrote {OUT}: {len(own)} repos, {len(pins)} pinned, {data['totals']['contributions']} contributions")


if __name__ == "__main__":
    main()
