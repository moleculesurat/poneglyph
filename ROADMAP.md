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

NEXT IN ORDER   browser test of attach + pull → AIF Regulations collect → remaining corpus
                (chapter by chapter) → real names → deployment
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
