# NOTE — provenance & how this was pulled

**Pulled:** 2026-07-01. **By:** Claude (reverse-engineered, no login).

## Source of truth
- **Event data** = HackCulture backend API, reverse-engineered. The site (`hackculture.io`) is a Next.js
  App-Router SPA — static HTML carries only SEO meta; real data loads post-hydration from
  `https://api.hackculture.io`. Frontend `/api/v1/*` paths are rewrites to that backend.
  - Working endpoint: `GET https://api.hackculture.io/api/v1/hackathon?slug=sebi-securities-market-techsprint`
  - Returns the full event object (`_id` `6a2a723b874daf06db780a1e`). Raw snapshot saved at
    `../data/sebi-event.json`.
- **Problem-statement PDFs** = Azure blob storage, direct GET (container listing is disabled, but the API
  response exposes each PS's `file` URL):
  `https://hackcultureplatform.blob.core.windows.net/event-assets/hackathons/6a2a723b874daf06db780a1e/problem_explanation_*.pdf`

## The SBI vs SEBI catch
The originally-tracked wiki entity `sbi-hackathon-gff-2026.md` is **State Bank of India's** GFF hackathon
(₹4.75L, "Agentic AI for Customer Acquisition", closed Jun 30) — a *different* event. The PS PDF chosen
(`problem_explanation_npc5i8hj0r.pdf`) belongs to **SEBI's** Securities Market TechSprint (this `_id`).
Two separate orgs, two separate hackathons, same HackCulture platform + same GFF stage. This folder is the
SEBI one. The SBI entity is left intact in the wiki as a distinct (now-closed) event.

## Re-pull
`curl -s -H "Accept: application/json" "https://api.hackculture.io/api/v1/hackathon?slug=sebi-securities-market-techsprint" -o data/sebi-event.json`
then re-derive these files. Dates in the dossier are IST (source is UTC, +5:30).
