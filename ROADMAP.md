# Molecule Compliance — the plan (2026-09-10)

One register, one gate, one evidence path. Six sections sit on top of it; the firm's profile decides which are
live. Three rules never change: every duty points to the exact sentence SEBI wrote; nothing enters the register
until a named person at Molecule signs it; what we cannot prove shows as a gap.

```
WHERE WE ARE (2026-09-15)
  PMS          register 286 approved (240 PMS / 46 AIF post-registration), 83 rejected or withdrawn, all decided by
               Pranjal from review sheets; 2 evidence files bound. Corpus = PMS master circular (287 paras) + PM
               Regulations 2020 incl. Schedules II–IV (144 units). Extraction COMPLETE for both sources (every "shall" paragraph run and decided; 2 model holdouts
               closed as covered). Document vault derived from the register (284 asks). Runs locally only.
  AIF          nothing on registration — AIF Regulations 2012 not in the corpus. Category I and III paragraphs
               were never drafted; applicability rejects anything not Category II. Waits for phase 2.
  WATCHTOWER   polls RSS + 5 SEBI listing pages + APMI (7 sources), per-source status, watch CLI. Live poll WORKS from
               the Node runtime (31a, 2026-09-15: 295 catches, all sources 200); the workerd blocker is moot.
               Catch -> work item (fetch, pdftotext, collect, re-run) still manual. /api/watch/poll is ungated (fix 31c).
  ELSE         runs locally on `npm run serve` (Node, sqlite in .state/); wrangler dev no longer needed. AWS port:
               31a done, 31b Terraform in flight, 31c cut-over next; officer names are placeholders; no MCP.

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
    1e  deployment on Molecule's infra   Pranjal's call 2026-09-11: Molecule runs AWS, not Cloudflare. Two steps:
        1e-i  STUDY (worker task, no code)  inventory Molecule's AWS: account/region, how services run today
                                         (Lambda / ECS / EC2), IaC tool, secrets store, DNS/domain, who deploys,
                                         any India-residency or access rules. Report back; I size the port.
        1e-ii PORT (sized 2026-09-12 from INFRA-2026-09.md in the infra repo)
              Molecule = one AWS account, ap-south-1, ECS Fargate, Terraform + GitHub Actions OIDC -> ECR/ECS,
              RDS Postgres, Secrets Manager, Route53 with a wildcard cert; frontends on Vercel; no NAT
              (public-subnet tasks reach the internet directly). Compliance app -> compliance.moleculeatomsapis.com.
              The worker's platform surface is tiny: env.PONEGLYPH_STATE.get/put, three env strings
              (GATE_TOKEN, OPEN_ROUTER_KEY, MODEL), ctx.waitUntil, fetch(Request)->Response, scheduled().
              Shape: ONE Node container. server.mjs wraps the existing worker: http.createServer ->
              Request/Response adapter -> worker.fetch; static `out/` served by the same process; hourly
              setInterval calls scheduled(); waitUntil = fire-and-forget. State store = node:sqlite file
              (Node 22.5+, zero deps) on an EFS volume; register.json in git stays the durable truth.
              [PRANJAL: sqlite+EFS (recommended, zero deps, same code locally) or a Postgres table (`pg` dep,
              RDS already there)?] Secrets from Secrets Manager into the task env via Terraform. Side effect:
              `node server.mjs` replaces wrangler dev locally and the watchtower poll works from the laptop.
              Steps: 31a adapter + sqlite store + Dockerfile, run locally, live poll passes; 31b Terraform in
              the infra repo (ECR, task def, service, ALB rule, EFS, secrets, GH Actions job); 31c cut over:
              deploy, `npm run pull -- https://compliance.moleculeatomsapis.com`, retire wrangler.
    done looks like: every PMS duty SEBI wrote is in the register or ruled out with a reason; dates,
    proof and gaps are live; the watchtower catches the next PMS circular and hands it to the pipeline.
    1e STATUS 2026-09-15: 31a done (Node runtime). 31b/31c PARKED by Pranjal — laptop first, the Fargate port later.

  PHASE 1-OPS  PMS READY FOR THE OPERATIONS TEAM, ON PRANJAL'S LAPTOP (Pranjal's call 2026-09-15)
    What ops does with it: see what is due (dashboard) -> do the duty -> attach the proof (register row, gate token,
    signs with their name) -> gaps close; read the watchtower list weekly; the inspector view for SEBI. The server is
    `npm run serve` on the laptop (Node + sqlite in .state/), reached over the LAN; register.json in git is the truth.
    32  one surface            delete the demo shell: persona toggle, sandbox strip, entry gate (/ -> /dashboard/),
                               empty pages (agents, remediation, amendments), dead "Export" buttons, pitch deck, wording.
    33  AIF rows as reference  46 AIF duties stop counting as PMS gaps: while the entity's aif-status fact is not
                               "registered" they render greyed "switches on at AIF registration" and leave every count.
    34  attach from the vault  the document vault's "Supply this document" posts to the same evidence API as the
                               register row (title, file -> sha256 in the browser, officer, token); the ask flips to
                               supplied. Bulk: one document bound to many duties in one go [needs Pranjal's answer on
                               what evidences the 132 ongoing prohibitions — quarterly compliance certificate? internal
                               audit report? board minutes?].
    35  fresh every morning    `npm run refresh` = pull -> build -> commit register.json; launchd: serve at login on
                               :8787, refresh daily 06:00 IST. Pages are static, so the dashboard's dates and statuses
                               are as fresh as the last refresh; the page says "as of <refresh time>".
    36  OPS.md runbook         start/stop, the LAN URL, who holds the gate token, attach flow, weekly watch list,
                               what to do when the watchtower says "applies" (fetch -> pdftotext -> collect -> run ->
                               review sheet -> decide), where the evidence files live (a folder the firm owns).
    Pranjal's side: officer names + appointment dates into data/tenant.ts and entity.ts; gate token handed to the
    ops lead; laptop hostname/IP for the LAN URL; the evidence-for-prohibitions answer (34).
    done looks like: an ops person opens the LAN URL, sees the PMS duties due this month with dates, attaches a proof
    and watches the gap close, and nothing on any page is a placeholder, a demo, or an AIF duty counted as a gap.

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
  4  Compliance Officer and Principal Officer: names, appointment dates, PO's NISM XXI-B certificate (1c)
  5  state store for AWS: sqlite on EFS (recommended) or Postgres table (1e-ii)
  later: order of the three AIF tracks; stage of each category; AIF Regulations PDF; MCP client
```
