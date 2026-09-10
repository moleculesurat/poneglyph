# Molecule Compliance Pipeline — Roadmap

Validated 2026-09-09. Current state and next tasks live in `HANDOFF.md`. Status board below updated 2026-09-10.

```
STATUS BOARD — 2026-09-10                                [x] done  [~] in progress  [ ] pending

SOURCES (given/sources)  PMS Master Circular Jul 2025 ........................ [x]
                         AIF Master Circular Jun 2026 ........................ [x]
                         CSCRF clarifications Apr 2025 (tier facts) .......... [x]
                         PMS related-party circular 2022 ..................... [ ] not collected
                         AIF Regulations 2012 (registration duties) .......... [ ] NOT IN CORPUS — need the PDF
        │
[0] PROFILE   Molecule = PM INP000007216 + AIF manager (Cat II, in prep) ....... [x]
              AUM Rs 1,000 cr+, 500 clients, discretionary PMS, CSCRF self-cert  [x]
              real names of Compliance Officer / Principal Officer ............ [ ] placeholders
        │
[1] COLLECT   PDF text → paragraph JSON (287 PMS + 509 AIF paras) ............ [x]
              footnote digits at line ends ("month 67") ...................... [ ] cosmetic
        │
[2] EXTRACT   OpenRouter (GLM 5.3 flash), one paragraph per call, 16k tokens . [x]
              75 "shall + time limit" paragraphs → 117 drafts ............... [x]
              ~445 remaining "shall" paragraphs (ongoing duties) ............. [ ] awaiting Pranjal's go
        │
[3] ANALYSE   applicability: capacity + chapter title + AIF category ......... [x]
              5-check verifier (verbatim excerpt, cadence, scope, schema, chain) [x]
              relief / procedure sentences excluded ........................... [x]
        │
[4] REGISTER  human gate, token-guarded, /live queue + decide CLI ............. [x]
              86 approved (40 PMS / 46 AIF), 31 rejected, 0 pending .......... [x]
              register pulled into git, worker reseeds from it ............... [x]
        │
[5] SCHEDULE  due dates parsed from each duty's own sentence ................. [x]
              dashboard "upcoming filings" + runway ........................... [x]
              exchange holiday calendar (working days = Mon–Fri today) ....... [ ]
        │
[6] PROVE     evidence binds via API/CLI, sha256 kept, file stays with firm ... [x] (EV-001 test bound)
              attach from register row + live status + periodic re-open ...... [x]
              documents page / evidence vault fed from real evidence ......... [ ]
        │
[7] MONITOR   hourly SEBI RSS watchtower, term lists = PM/AIF ................. [x] (unreviewed on real feed)
              catch → re-run affected paragraph → diff against register ...... [ ]
              consultation paper 23 Jul 2026 on new PMS Regulations .......... [ ] watch item
        │
[8] SHOW      /register /dashboard /audit render the pulled register .......... [x]
              hackathon residue purged (Angel One, CUSPA, fake MCP) .......... [x]
              inspector view for a SEBI inspection ........................... [ ] exists, untested on real data

AIF LAUNCH CHECKLIST (one-time duties A–I) .................................... [ ] blocked on AIF Regulations text
DEPLOYMENT    Molecule's Cloudflare account, KV, domain, secrets .............. [ ] wrangler.jsonc still hackathon account
              today: runs locally only (wrangler dev)

NEXT IN ORDER   Pranjal's 4 answers → AIF Regulations collect → profile: AIF stage + categories
                → nav split (PMS | AIF registration | AIF rules Cat II/III | Watchtower)
                → AIF registration section → Cat III tagging + chapter 7 run → watchtower v2
                → remaining PMS corpus → real names → deployment
```

```
PLAN v2 — 2026-09-10 (Pranjal's shape: PMS as is; AIF = registration section + rules section
for Cat II and Cat III; watchtower on real sources)

THE APP BECOMES FOUR SECTIONS, ONE REGISTER UNDERNEATH

  PMS                 what exists today: register, dashboard, evidence, schedule. "Regular
                      things": finish the remaining ~445 "shall" paragraphs chapter by chapter,
                      add PMS Regulations 2020 as a source later. No structural change.

  AIF · REGISTRATION  new section. The one-time track A–I (below) as an ORDERED CHECKLIST with a
                      progress line to "certificate received" and then to "first close". Same
                      pipeline, same gate, same evidence attach as /register — only the view
                      differs (order + progress, not filters). Sources: AIF Regulations 2012
                      ch II (registration, eligibility, fees, certificate) + AIF MC 2026 ch 1
                      (registration clarifications), ch 2 (PPM filing), ch 3 (investor
                      on-boarding), ch 12 (first close / tenure). Every line is type
                      "one-time"; the profile fact aif-stage (not-applied → applied →
                      in-principle → registered → first-close) is the only switch.

  AIF · RULES         appears once aif-stage = registered (before that: visible, greyed
                      "switches on at registration"). Two tabs: CATEGORY II and CATEGORY III.
                      Same register rows, tagged by the category the sentence addresses
                      (ii / iii / all). Today applicability REJECTS Cat III paragraphs (chapter 7,
                      40 paras, never drafted); it will TAG instead. Rows whose category the firm
                      does not hold are shown as reference, not as gaps. Which categories are
                      "held" is a profile fact [PRANJAL: Cat II only, or Cat II + Cat III?].

  WATCHTOWER          the cron, on real sources (below). Catches that triage "applies" produce
                      a work item: fetch → pdftotext → collect → re-run only the changed
                      paragraphs → REVIEW sheet → gate. Nothing enters the register unread.

WATCHTOWER v2 — REAL SOURCES (verified by GET on 2026-09-10, all HTTP 200 without cookies)

  today   sebi.gov.in/sebirss.xml — 30 items, 29 enforcement/recovery, 1 circular; does NOT
          carry the Sep-2026 AIF circular on angel funds (104323). Keep it, but it is not enough.
  add     legal circulars listing, all departments, 25 newest per page
            HomeAction.do?doListing=yes&sid=1&ssid=7&smid=0
          legal circulars, AIF & FPI department (deptId=75)          → AIF circulars
            …&sid=1&ssid=7&smid=0&deptId=75
          master circulars listing (ssid=6)                          → new MC versions
          regulations listing (ssid=3)                               → "last amended on" versions
            of AIF Regulations 2012 and PM Regulations 2020
  PMS     no department/intermediary filter exists in the GET listing (deptId=9 = IMD shows
          mutual-fund items). PMS circulars are caught from the all-departments page by the
          existing title terms ("portfolio manager"). Hourly poll × 25 items/page is far above
          SEBI's daily volume, so nothing is missed.
  paging  the ajax paginator (sebiweb/ajax/home/getnewslistinfo.jsp) answered HTTP 530 from a
          laptop; the worker may fare differently — a probe task, not a dependency. Page 1 is
          enough for the cron.
  parse   listing pages are HTML tables: anchor href https://www.sebi.gov.in/legal/<type>/<mon-yyyy>/
          <slug>_<id>.html + anchor text = title + a date cell. Hand-rolled regex, like the RSS
          parser; no packages. Dedupe on URL with the existing watch:seen set; docType from the
          path as today; triage unchanged.
  cron    keep 0 * * * *; one scheduled() run polls RSS + 4 listing pages (5 fetches/hour).
  action  /watchtower shows the catch with its document URL and PDF link; `npm run watch:pull`
          writes applies-catches to data/collected/watch.json. pdftotext stays a laptop step
          (workerd has no PDF text extraction). Later: paragraph-hash diff between a master
          circular version and the corpus so only changed paragraphs re-run.

SOURCES TO ADD (URLs located; PDFs fetched only with Pranjal's yes)
  AIF Regulations 2012, last amended 14 Jul 2026
    https://www.sebi.gov.in/legal/regulations/jul-2026/securities-and-exchange-board-of-india-alternative-investment-funds-regulations-2012-last-amended-on-july-14-2026-_102975.html
    PDF https://www.sebi.gov.in/sebi_data/attachdocs/jul-2026/1785301664601.pdf
  PM Regulations 2020, last amended 3 Sep 2025 (for the PMS "registration and rules" pass, later)
    https://www.sebi.gov.in/legal/regulations/sep-2025/securities-and-exchange-board-of-india-portfolio-managers-regulations-2020-last-amended-on-september-03-2025-_96560.html
  PMS related-party circular 2022 — already in given/sources, not yet collected.

DATA CHANGES (smallest set)
  entity.ts   facts: aif-stage (declared), aif-categories-held (declared)
  schema.ts   Obligation.aifCategories?: ("i"|"ii"|"iii"|"all")[]  — set by applicability
  applicability.ts  Cat III sentence → tag, not reject; "all AIFs" → all
  nav.ts      groups: PMS · AIF Registration · AIF Rules · Watchtower · Engine · Inspection
  Nothing else: one KV, one register, one gate, one evidence path.

BUILD ORDER (one worker task each; see HANDOFF.md "Next worker tasks")
  1 AIF Regulations collect            5 Cat III: tag + run chapter 7 + tabs
  2 profile: aif-stage + categories    6 watchtower v2 sources
  3 nav split + greyed AIF rules       7 remaining PMS corpus batches
  4 AIF registration section (view)    8 real names, deployment
```

```
THE IDEA
  Feed SEBI's documents in at one end. Out comes a living list of what Molecule owes,
  with dates, owners, proof and an audit trail. Nothing in the register is typed by
  hand. Molecule's profile is the only config: PMS running since 2021, Category II AIF
  being set up now.

THREE RULES THAT NEVER CHANGE
  1. Every duty points to the exact sentence in the source document.
  2. Nothing enters the register until a named person at Molecule signs it off.
  3. What we cannot prove is shown as a gap. Never as "done".

TWO KINDS OF DUTY, ONE REGISTER
  RECURRING  - PMS today, AIF once live: monthly, quarterly, yearly filings. Repeat forever.
  ONE-TIME   - the AIF launch: things done once, in order, before first close. Then closed.
  Both ride the same pipeline. One-time duties just have a single due date.

THE PIPELINE

  SOURCES ──► [1] COLLECT ──► [2] EXTRACT ──► [3] ANALYSE ──► [4] REGISTER
                                                                   │
              [7] MONITOR ◄── [6] PROVE ◄── [5] SCHEDULE ◄─────────┘
                   └──────────► back to [1] when SEBI changes something ──► [8] SHOW

  [0] PROFILE   Who we are: PMS licence (INP000007216), AIF Cat II in progress, AUM,
                clients, corpus, officers. Decides what binds us and how heavily.
  [1] COLLECT   Pull the rules in as text, paragraph by paragraph, with URL, date and
                version: PMS master circular, AIF master circular, parent regulations,
                CSCRF, AML. Later: tax, PMLA, FEMA. Nothing retyped.
  [2] EXTRACT   Model drafts the duties in each paragraph: what, how often, by when,
                what proof. Code checks every draft quotes the paragraph word for word.
  [3] ANALYSE   Binds Molecule? PMS-only, AIF-only, both, neither. Does size change it?
                Who owns it? A human approves or rejects each one.
  [4] REGISTER  The approved list, one line per duty, tamper-evident change log.
  [5] SCHEDULE  Cadences become dates. Due this week / month / overdue. Reminders.
  [6] PROVE     Attach evidence per duty: portal receipt, CA certificate, valuer report,
                board minute. Met / gap / at-risk computed from what is attached.
  [7] MONITOR   Robot reads SEBI's feed hourly. Changed documents re-enter [1]; only
                changed paragraphs are re-extracted and re-approved. Size re-checked.
  [8] SHOW      Officer's one page: due, overdue, gaps, awaiting sign-off, distance to
                next size threshold, AIF launch progress. Read-only inspector view.

AIF LAUNCH CHECKLIST (one-time track, in order, lives in the register as [4] lines)

  A. STRUCTURE     Pick the vehicle (trust is the norm), name sponsor and manager,
                   appoint trustee, register the trust deed.
  B. PEOPLE        Manager and sponsor fit-and-proper. At least one key investment
                   person with NISM Series XIX-C or XIX-D. Compliance officer named
                   (NISM III-C needed by 1 Jan 2027, cannot be the CEO).
  C. REGISTER      Apply on SEBI's portal, pay fees, get in-principle approval,
                   submit the deed, receive the Category II certificate.
  D. THE PPM       Write the scheme document in SEBI's template. Merchant banker
                   due-diligence certificate. File 30 days before launch. Scheme fee.
  E. SERVICE       Custodian (before first investment), independent valuer, RTA for
     PROVIDERS     demat units, auditor for the PPM audit, bank account, PAN/TAN,
                   benchmarking agency, FIU-IND registration.
  F. POLICIES      Valuation, AML/KYC, conflicts, code of conduct, stewardship for
                   listed equity, investment committee terms, borrowing, grievance
                   (Investor Charter and complaints data in the PPM), cyber (self-cert).
  G. MONEY         Sponsor commitment locked: 2.5% of corpus or Rs 5 crore, whichever
                   lower. Minimum corpus Rs 20 crore at first close.
  H. INVESTORS     KYC, minimum Rs 1 crore each, FATF and land-border screening, PPM
                   acknowledged, contribution agreement matches the PPM, max 1,000.
  I. FIRST CLOSE   Within 12 months of becoming eligible. Then the AIF recurring
                   duties switch on: quarterly and annual activity reports, CTR, PPM
                   audit, half-yearly valuation, NAV to depositories, tax forms.

HOW THE FORK FITS
  The engine already has [2], part of [3], [4] and [7]'s reader. Its profile is a stock
  broker and its register is demo data. We set the profile to Molecule, delete the demo
  data, build [1], [5], [6], and let the pipeline fill the register from the real
  circulars. The AIF checklist is the first set of one-time duties it produces.

BUILD ORDER
  0 -> 1 -> 2 -> 3 -> 4 on the two master circulars gives a real, signed register,
  including the AIF launch lines. Then 5 -> 8 -> 6 -> 7. More sources are just more
  documents through the same pipe.

DONE LOOKS LIKE
  Every morning: what is due, what is overdue, what has no proof, what SEBI changed
  yesterday, how far the AIF is from first close. Every line traces to a sentence SEBI wrote.
```
