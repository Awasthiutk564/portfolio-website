# How this portfolio stays current

`data/profile.json` drives the whole site and the Booglu chatbot. The **Sync portfolio** GitHub Action rebuilds it, and Vercel redeploys on the commit.

| Source | How to update | Automatic? |
| --- | --- | --- |
| GitHub repos & contributions | Nothing to do | Daily |
| Résumé | Replace `sources/resume.pdf` and push. Gemini parses it; the PDF becomes the site's download button | On push (needs `GEMINI_API_KEY` repo secret) |
| LinkedIn | LinkedIn → Settings → Data privacy → Get a copy of your data. Upload **only** `Positions.csv`, `Education.csv`, `Certifications.csv`, `Skills.csv`, `Projects.csv`, `Honors.csv` to `sources/linkedin/` | On push |
| Hand-written bits (tagline, featured projects, focus) | Edit `content/manual.json` | On push |

LinkedIn offers no API to read your own profile and blocks scraping, so the export is the only legitimate route. **Never upload the full export ZIP or `Profile.csv`**: this repo is public and those contain private data.

Priority when sources disagree: LinkedIn > résumé > manual.
