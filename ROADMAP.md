# Molecule Compliance — the plan (2026-09-10)

One register, one gate, one evidence path. Six sections sit on top of it; the firm's profile decides which are
live. Three rules never change: every duty points to the exact sentence SEBI wrote; nothing enters the register
until a named person at Molecule signs it; what we cannot prove shows as a gap.

```
WHERE WE ARE
  PMS          86 approved duties from the two master circulars (40 PMS / 46 AIF post-registration), due dates
               from the sentences, evidence attach, audit chain. Runs locally only.
  AIF          nothing on registration — AIF Regulations 2012 not in the corpus. Category I and III paragraphs
               were never drafted; applicability rejects anything not Category II.
  WATCHTOWER   hourly RSS poll. Works, but the feed is 29/30 enforcement orders and missed this month's AIF
               circular. Nothing happens after a catch.
  ELSE         deployment on the hackathon Cloudflare account; officer names are placeholders; no MCP.

THE SECTIONS — in the order of the firm's life
  0 PROFILE            who Molecule is. Adds one fact per AIF category: stage of Cat I, Cat II, Cat III
                       (none → applied → in-principle → registered → first-close). Every section reads them.
  1 PMS                today's business. Register, calendar, evidence, gaps. Exists. Two sources still to
                       finish: the remaining ~445 "shall" paragraphs of the master circular, and the
                       PM Regulations 2020 (the parent rulebook — registration conditions, capital, code
                       of conduct, reporting). Same pipeline; new rows land in the same table.
  2 AIF · ONBOARDING   three registration tracks, one per category, built one at a time. Each is the ordered
                       one-time path to the certificate and first close — structure, people, application,
                       PPM, service providers, policies, sponsor money, investors, first close — with a
                       progress line. Same pipeline, gate and evidence as PMS; the view is a checklist.
                       Sources: AIF Regulations 2012 (registration chapter + category-specific conditions)
                       and AIF MC ch 1 (registration), 2 (PPM), 3 (on-boarding), 8 (angel funds, Cat I),
                       9 (special situation funds, Cat I), 12 (first close). Common duties appear in all
                       three tracks once; category-only duties appear in theirs. Order: [PRANJAL: II → III → I?]
  3 AIF · RULES        what follows registration. Tabs CAT I | CAT II | CAT III over the same register rows,
                       each tagged by the category its sentence addresses (i / ii / iii / all). A tab is
                       greyed "switches on at registration" until that category's stage says registered.
                       The 46 AIF rows move here; Cat III (MC ch 7), Cat I (ch 8, 9) and the Regulations'
                       ongoing chapters add. A category not registered renders as reference, never as a gap.
  4 WATCHTOWER         keeps 1–3 current. Polls SEBI's listing pages, not only RSS. A catch that applies
                       becomes work: fetch → pdftotext → collect → re-run only changed paragraphs →
                       review sheet → gate. Nothing enters the register unread.
  5 ASK (MCP)          Claude as a client of the register. An MCP server on the worker at /api/mcp
                       (Streamable HTTP, JSON-RPC, hand-rolled — workerd has no Node, and the protocol
                       is three methods: initialize, tools/list, tools/call). Read tools first: duties by
                       section/status/due date, one duty with its sentence, gaps, evidence for a duty,
                       watch catches, search the corpus. Write tools (approve, attach) later, behind the
                       gate token. Auth: bearer token = GATE_TOKEN works for Claude Code and the API's
                       MCP connector today; claude.ai custom connectors need OAuth [PRANJAL: which client?].
  6 INSPECTION         read-only view of 1–3 plus the audit chain, for SEBI. Exists, untested on real data.

BUILD ORDER — PMS first, end to end; then AIF; then the rest
  PHASE 1  PMS DONE (section 1 + 4 for PMS)
    1a  PM Regulations 2020 collect      pdftotext → given/sources; collect.mjs learns Chapter/Regulation/
                                         sub-regulation numbering (reused for the AIF Regulations later).
    1b  PMS corpus finished              remaining ~445 "shall" paragraphs of the PMS MC, then the PM Regs,
                                         then the related-party circular — ~50 paras a batch, one review
                                         sheet each, Pranjal decides, pull, commit.
    1c  PMS proof                        documents/evidence pages fed from the real register; holiday
                                         calendar for working-day due dates; real officer names.
    1d  watchtower on real sources       RSS + the four listing pages; catch → work item (fetch, pdftotext,
                                         collect, re-run changed paragraphs, review, gate).
    1e  deployment                       Molecule's Cloudflare account, KV, domain, secrets. The cron
                                         starts. `npm run pull -- https://<domain>` becomes the loop.
    done looks like: every PMS duty SEBI wrote is in the register or ruled out with a reason; dates,
    proof and gaps are live; the watchtower catches the next PMS circular and hands it to the pipeline.

  PHASE 2  AIF
    2a  profile stage facts + nav split  sections PMS · AIF Onboarding · AIF Rules.
    2b  AIF Regulations collect          same collect shape as 1a.
    2c  onboarding, one category at a time (section 2)   [PRANJAL: II → III → I?]
    2d  rules Cat I | II | III (section 3)   tags replace rejection; run MC ch 7, 8, 9 + Regs ongoing chapters.

  PHASE 3  ASK + HARDENING
    3a  MCP read tools (section 5); write tools behind the gate token later.
    3b  inspector view on real data; DESIGN.md / README de-hackathon.

WATCHTOWER SOURCES (verified 2026-09-10: plain GET, browser UA, no cookies, HTTP 200)
  keep  sebi.gov.in/sebirss.xml — 30 newest items of every kind
  add   circulars, all departments      HomeAction.do?doListing=yes&sid=1&ssid=7&smid=0   (25/page)
        circulars, AIF & FPI dept       …&deptId=75                                        (AIF)
        master circulars                …&ssid=6                                           (new MC versions)
        regulations                     …&ssid=3                       (AIF Regs / PM Regs "last amended")
  PMS   no department or intermediary filter exists for PMS; the all-departments page + the existing
        title terms ("portfolio manager") catch them. Hourly × 25/page is far above SEBI's daily volume.
  note  the ajax paginator answered HTTP 530 from a laptop; page 1 of each source is enough for the cron.
        Parse = anchor href + text + date cell, hand-rolled like the RSS parser. Same seen/catches keys.

SOURCES TO ADD (PDFs fetched only on Pranjal's yes)
  AIF Regulations 2012, last amended 14 Jul 2026
    https://www.sebi.gov.in/legal/regulations/jul-2026/securities-and-exchange-board-of-india-alternative-investment-funds-regulations-2012-last-amended-on-july-14-2026-_102975.html
    PDF https://www.sebi.gov.in/sebi_data/attachdocs/jul-2026/1785301664601.pdf
  PM Regulations 2020 — Pranjal's link is the 10 Feb 2025 consolidation (_92413); SEBI's regulations
    listing shows a newer one, last amended 3 Sep 2025 (_96560). Use the newer unless told otherwise.
    https://www.sebi.gov.in/legal/regulations/feb-2025/securities-and-exchange-board-of-india-portfolio-managers-regulations-2020-last-amended-on-february-10-2025-_92413.html
    https://www.sebi.gov.in/legal/regulations/sep-2025/securities-and-exchange-board-of-india-portfolio-managers-regulations-2020-last-amended-on-september-03-2025-_96560.html
  PMS related-party circular 2022 — in given/sources, not yet collected.

DATA CHANGES — the whole list
  entity.ts          facts aif-stage-i, aif-stage-ii, aif-stage-iii (declared, with source slots)
  schema.ts          Obligation.aifCategories?: ("i"|"ii"|"iii"|"all")[]
  applicability.ts   category sentence → tag, not reject
  collect.mjs        Chapter/Regulation/sub-regulation numbering for the two Regulations
  nav.ts             groups PMS · AIF Onboarding · AIF Rules · Watchtower · Ask · Engine · Inspection
  watch.ts           four listing sources beside the RSS
  worker             /api/mcp route: initialize, tools/list, tools/call; bearer = GATE_TOKEN

OPEN ON PRANJAL'S SIDE — phase 1 first
  1  browser test of attach-evidence on /register, then `npm run pull` + commit register.json
  2  PM Regulations PDF into given/, or a yes to fetch it (1a); version: Feb 2025 as linked, or Sep 2025
  3  yes/no on the remaining ~445 "shall" paragraphs (1b)
  4  real Compliance Officer / Principal Officer names (1c)
  5  Molecule's Cloudflare account, domain (1e)
  later: order of the three AIF tracks; stage of each category; AIF Regulations PDF; MCP client
```
