# How this portfolio stays current

`data/profile.json` drives the whole site and the Booglu chatbot. The **Sync portfolio** GitHub Action rebuilds it, and Vercel redeploys on the commit.

| Source | How to update | Automatic? |
| --- | --- | --- |
| GitHub repos & contributions | Nothing to do. New public repos join "selected work" by themselves | Hourly |
| Featured projects | Pin repos on your GitHub profile (up to 6): they lead "selected work" in pin order. The title, tagline and tags in `content/manual.json` → `featured_projects` still apply to any repo; with nothing pinned, that list is the featured set | Hourly |
| Résumé | Replace `sources/resume.pdf` and push. Gemini parses it; the PDF becomes the site's download button | On push (needs `GEMINI_API_KEY` repo secret) |
| LinkedIn | LinkedIn → Settings → Data privacy → Get a copy of your data. Upload **only** `Positions.csv`, `Education.csv`, `Certifications.csv`, `Skills.csv`, `Projects.csv`, `Honors.csv` to `sources/linkedin/` | On push |
| Hand-written bits (tagline, featured projects, focus) | Edit `content/manual.json` | On push |

LinkedIn offers no API to read your own profile and blocks scraping, so the export is the only legitimate route. **Never upload the full export ZIP or `Profile.csv`**: this repo is public and those contain private data.

Priority when sources disagree: LinkedIn > résumé > manual.

## "Fresh off the feed" (one latest post from each network)

| Card | How it updates |
| --- | --- |
| GitHub | Live. Every visit reads your newest public activity (push, new repo, release, merged PR) from the GitHub API. Pushes to the profile README and this site are skipped. Nothing to do. |
| LinkedIn | After you post: GitHub → **Actions → Share LinkedIn post → Run workflow**, paste the post link (… → *Copy link to post*) and a line of text. Works from the GitHub mobile app. It updates `content/latest.json` and Vercel redeploys in about a minute. |

LinkedIn has no API for reading your own posts and blocks scraping, which is why that card needs this one step.

## Contact form → your inbox

The form emails you through Gmail. In **Vercel → Project → Settings → Environment Variables** set:

| Variable | Value |
| --- | --- |
| `EMAIL_USER` | the Gmail address that sends the email |
| `EMAIL_PASS` | a Gmail **App Password**, not your normal password. Turn on 2-Step Verification, then Google Account → Security → *App passwords* |
| `CONTACT_TO` | optional: where messages go (defaults to the email in `profile.json`) |

Redeploy afterwards, then open `/api/health`. `"smtp": "ok"` means the form can reach your inbox. If sending fails, visitors now see an error and a pre-filled "send it from your email app" link instead of a false "delivered".
