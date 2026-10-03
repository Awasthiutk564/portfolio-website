# sources/

Drop updated source files here and push; the **Sync portfolio** workflow rebuilds `data/profile.json` and the site redeploys.

| File | What happens |
| --- | --- |
| `sources/resume.pdf` | Published as `/resume.pdf` (the download button) and parsed by Gemini into `content/resume.json`. Needs the `GEMINI_API_KEY` repo secret. |
| `sources/linkedin/Positions.csv` etc. | Parsed into `content/linkedin.json`. |

## ⚠️ LinkedIn: upload only these six CSVs

This repository is **public**. Upload only:

`Positions.csv`, `Education.csv`, `Certifications.csv`, `Skills.csv`, `Projects.csv`, `Honors.csv`

**Never** upload the whole export ZIP or `Profile.csv`. They contain your messages, connections, email, address and birth date. The workflow deletes anything else it finds in `sources/linkedin/`, but a file you push stays in git history.
