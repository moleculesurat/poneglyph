# MOLECULE-TODO

Goal: turn this fork of Poneglyph into Molecule Ventures' compliance register. Molecule is a
SEBI-registered Portfolio Manager (INP000007216) and is launching a Category II AIF. The broker
taxonomy, tenant and seed data go; the engine mechanics (watchtower, verifier, human gate, hash
chain) stay untouched.

Working rules for whoever picks up a task:

- Shortest working diff. Reuse what exists. No new dependencies, no new abstractions.
- Never invent regulatory text. Clause text comes verbatim from `given/sources/*.txt`
  (pdftotext dumps of the real circulars). Strip footnote digits glued to words.
- Every task ends with `cd poneglyph && npx tsc --noEmit && npm run build` passing and every
  route prerendering. Task 4 also needs `npx wrangler deploy --dry-run --outdir /tmp/wr-check`.
- One commit per task on branch `molecule`, message `molecule: <task title>`. Do not push to
  `upstream` (walrus-securitas). `origin` is the fork at github.com/moleculesurat/poneglyph.
- Keep `worker/verifier.ts` check logic, `worker/gate.ts`, `worker/hash.ts`, `worker/audit.ts`
  as they are, apart from the two capacity edits named in task 4.

## Done

- [x] Forked to `moleculesurat/poneglyph`; local remotes: `origin` = fork, `upstream` = original.
- [x] Branch `molecule` created from `main`.
- [x] `npm ci` in `poneglyph/` (Node 26, wrangler 4.x present).
- [x] Primary sources dumped to `given/sources/` (PMS MC Jul 2025, AIF MC Jun 2026, CSCRF
      clarifications Apr 2025, PMS related-party circular Aug 2022).

## Task 1 · Swap the spine (`poneglyph/lib/schema.ts`, `poneglyph/lib/domains.ts`)

Keep the type names and the two-level rollup (Part → chapter) so the UI keeps working; change
the values.

- [ ] `SebiPart` becomes `"PMS" | "AIF"`. Add a comment: a Part is now one rulebook instrument.
- [ ] `ChapterKey` becomes the 32 keys below (7 PMS + 25 AIF). Chapters 7, 8, 9, 24 of the AIF
      circular do not bind a Category II fund; keep them in the taxonomy anyway, applicability
      excludes them by segment.
- [ ] `IntermediaryType`: add `"portfolio-manager" | "aif-manager"`. Keep the five broker-era
      values; the applicability agent uses them as foreign capacities.
- [ ] `BusinessSegment` becomes `"discretionary-pms" | "non-discretionary-pms" | "advisory-pms" |
      "co-investment-pms" | "aif-cat-i" | "aif-cat-ii" | "aif-cat-iii"`.
- [ ] `CscrfGrade` becomes `"self-certification" | "small-size" | "mid-size" | "qualified" | "mii"`
      (the framework has no "basic" tier).
- [ ] `EntityProfile`: delete `qsb`, `qsbBasis`, `exchanges`, `depositories`. `Tenant`: delete
      `exchanges`, `qsb`, `activeClients`.
- [ ] `domains.ts`: `SEBI_DOMAINS` has two entries. PMS: title "Master Circular for Portfolio
      Managers", items "SEBI/HO/IMD/IMD-POD-1/P/CIR/2025/104 · 16 Jul 2025 · circulars to 31 Mar
      2025". AIF: title "Master Circular for Alternative Investment Funds", items
      "HO/19/34/11(6)2025-AFD-POD1/I/12928/2026 · 3 Jun 2026, updated 16 Jun 2026 · circulars to
      31 May 2026". `CHAPTER_PART`, `CHAPTER_LABEL` (verbatim titles below), `partLabel` returns
      `${part} · ${title}`. Delete `QSB`. Replace `CSCRF` with the tier table from
      `given/sources/cscrf-clarifications-2025-04-30.txt` para 2.6, 2.7 and 4:
      PM AUM above ₹3,000 cr = mid-size, else self-certification; AIF at manager level on summed
      corpus: ₹10,000 cr and above = mid-size, ₹3,000–10,000 cr = small-size, ₹3,000 cr and below
      = self-certification; self-certification with fewer than 100 clients = exempt from
      Market-SOC; dual registration takes the higher category; category fixed for the FY from
      prior-FY data. Add `PMS_AUTOMATION_AUM_CR = 1000` (PMS MC para 2.7.3.1).

Chapter keys and verbatim titles:

| key | title |
|---|---|
| pm-registration | Registration and Post-Registration Activity |
| pm-operating | Operating Guidelines |
| pm-investments | Investments by Portfolio Managers |
| pm-disclosure | Disclosure Requirements |
| pm-reporting | Reporting Requirements |
| pm-fees | Fees and Charges |
| pm-grievance | Grievance Redressal |
| aif-registration | Requirements and clarifications pertaining to registration of AIFs |
| aif-ppm-filing | Filing of PPM for launch of AIF scheme |
| aif-onboarding | On-boarding of investors by AIFs |
| aif-instrument-conditions | Investment instrument/security specific conditions for AIFs |
| aif-overseas | Guidelines for overseas investments by AIFs and related reporting |
| aif-co-investment | Framework for AIFs to make co-investment within the AIF structure |
| aif-cat-iii | Operational and prudential norms for Category III AIFs |
| aif-angel | Operational and prudential norms for Angel Funds |
| aif-ssf | Norms for Special Situation Funds |
| aif-accreditation | Framework for Accreditation of Investors |
| aif-demat | Dematerialisation of units and investments of AIFs and collection of stamp duty on units of AIFs |
| aif-first-close | Timeline for first close and calculation of tenure of AIFs |
| aif-material-change | Material change and change in Sponsor or Manager of AIFs |
| aif-borrowing | Guidelines for Category I and II AIFs on borrowing and creation of encumbrance on equity of investee companies |
| aif-excuse | Guidelines with respect to excusing or excluding an investor from an investment of AIF |
| aif-direct-plan | Direct plan for schemes of AIFs and trail model for distribution commission in AIFs |
| aif-manager-obligations | Obligations of manager, sponsor, investment committee and trustee of AIFs |
| aif-valuation | Standardised approach to valuation of investment portfolio of AIFs |
| aif-pro-rata | Pro-rata and pari-passu rights of investors of AIFs |
| aif-due-diligence | Specific due diligence of investors and investments of AIFs |
| aif-reporting | Periodic reporting requirements for AIFs |
| aif-benchmarking | Performance Benchmarking of AIFs |
| aif-unliquidated | Flexibility to AIFs and their investors to deal with unliquidated investments of their schemes |
| aif-vcf-migration | Modalities for migration of Venture Capital Funds to AIF Regulations |
| aif-winding-up | Guidelines for winding up of AIFs with respect to retention of proceeds and 'Inoperative Fund' status |

## Task 2 · Replace the seed (`poneglyph/data/*.ts`)

Everything Angel One goes. Keep every export name the UI imports unless told otherwise.

- [ ] `tenant.ts`: name "Molecule Ventures LLP", sebiRegNo "INP000007216", type
      "portfolio-manager", city "Mumbai" (registered office per SEBI PM list; confirm), simToday
      "2026-09-09", team = two role placeholders until Molecule supplies names:
      `{ name: "Compliance Officer", role: "Compliance Officer", initials: "CO" }` and
      `{ name: "Principal Officer", role: "Principal Officer", initials: "PO" }`.
- [ ] `entity.ts`: export `molecule` (rename every `angelOne` import). intermediaryTypes
      `["portfolio-manager", "aif-manager"]`, segments `["discretionary-pms", "aif-cat-ii"]`,
      registrations: one line, SEBI Portfolio Manager INP000007216, masked false. facts, each
      with provenance: `legal-name`; `sebi-reg-no` (declared); `pms-aum` "₹776.98 crore" as of
      2025-11-30, provenance declared, verified false, source "SEBI PM monthly report as
      mirrored by PMS Bazaar; replace with Molecule's own filing"; `pms-clients` "431", same
      source; `aif-status` "Category II AIF registration not yet obtained" (declared).
      cscrfGrade "self-certification"; cscrfBasis: AUM under ₹3,000 cr, 431 clients so the
      Market-SOC exemption does not apply, category re-set each 1 April from prior-FY data.
      applicableParts `["PMS", "AIF"]`, excludedParts `[]`. Keep `entities`, `factOf`.
- [ ] `corpus.ts`: two `Circular` objects, `pmsMasterCircular` (id "MC-PM-2025", number
      "SEBI/HO/IMD/IMD-POD-1/P/CIR/2025/104", issuedOn "2025-07-16", supersedes "MC-PM-2024",
      source https://www.sebi.gov.in/legal/master-circulars/jul-2025/master-circular-for-portfolio-managers_95347.html)
      and `aifMasterCircular` (id "MC-AIF-2026", number
      "HO/19/34/11(6)2025-AFD-POD1/I/12928/2026", issuedOn "2026-06-03", supersedes
      "MC-AIF-2024", source https://www.sebi.gov.in/legal/master-circulars). All 32 chapters
      present. Seed verbatim paragraphs only for these, copied from `given/sources/`:
      PMS 2.6.1, 2.7.3.1, 2.7.4, 2.8.1, 5.1.1, 5.1.2, 5.2.1.1, 5.2.1.2, 5.2.2.4, 5.3.4.2, 5.4.3,
      5.5.1, 5.6.6, 6.1.3.1, 6.1.3.3, 6.1.3.6 (first two sentences), 6.1.4.1 (with its four
      sub-items joined).
      AIF 3.2.3, 3.2.7, 11.3.1, 12.1.1, 12.1.3, 13.2.4, 14.1.4, 17.1.1, 17.2.2, 17.5, 17.6.3,
      18.2.1, 18.3.1, 18.3.2, 20.3.2, 21.1.1, 21.1.2, 21.2.1, 21.2.2, 21.3.1, 21.3.2, 21.4.1.
      `circulars = [pmsMasterCircular, aifMasterCircular]`. Delete `cuspaCircular`,
      `cuspaAmendment`.
- [ ] `obligations.ts`, `evidence.ts`, `tasks.ts`, `runs.ts`, `watchtower.ts`: typed empty
      arrays. The register fills only through `/live` and the human gate.
- [ ] `audit.ts`: exactly one event, prevHash "GENESIS", hash "492a3eac54e5" (real SHA-256 of
      the canonical string; recompute with the node one-liner below if you change any field):
      id "AE-0001", at "2026-09-09T00:00:00+05:30", actor "system:seed", action
      "corpus.loaded", subjectType "corpus", subjectId "MC-PM-2025,MC-AIF-2026", detail
      "Register initialised for Molecule Ventures LLP. Corpus loaded: Master Circular for
      Portfolio Managers (SEBI/HO/IMD/IMD-POD-1/P/CIR/2025/104, 16 Jul 2025) and Master Circular
      for AIFs (HO/19/34/11(6)2025-AFD-POD1/I/12928/2026, 3 Jun 2026). No obligation has been
      drafted; the register fills only through the pipeline and the human gate."
      One-liner: `node -e 'const c=require("crypto");const e={...};console.log(c.createHash("sha256").update([e.id,e.at,e.actor,e.action,e.subjectType,e.subjectId,e.detail,"GENESIS"].join("|")).digest("hex").slice(0,12))'`
- [ ] `documents.ts`: `documentRequirements = []`, `companyDocuments = []`, keep
      `requirementOf` and `documentsFor`.
- [ ] `onboarding.ts`: `SEGMENT_LABEL` for the seven new segments. Delete `angelOneOnboarding`.
      Keep `blankOnboarding`; rewrite the six step blurbs without QSB or "ten Parts": designation
      = compute the CSCRF tier and the ₹1,000 cr automation trigger from declared AUM, client
      count and AIF corpus; scope = bind the PMS and AIF rulebooks the registrations make
      applicable, filing the reason for anything excluded.
- [ ] `mcp.ts`: leave for now (display strings only).

## Task 3 · Make every route compile and prerender on the new seed (`poneglyph/app`, `poneglyph/components`)

- [ ] `app/page.tsx`: keep the gate and `<EntryGateStart />`; delete the four Angel One proof
      lines and the `angelOne`, `obligations`, `SEBI_DOMAINS` imports; title names Molecule.
- [ ] `app/onboarding/page.tsx`: replace with a stub: `PageHead`, a table of `molecule.facts`
      with provenance, and `<NewOnboarding steps={blankOnboarding.steps} />`. Delete
      `FlowTimeline.tsx` and `QuestionDeck.tsx` (only this page used them).
- [ ] `app/amendments/page.tsx`: stub saying no amendment has been ingested yet and that the
      watchtower opens a run when SEBI reissues either master circular. Delete `Redline.tsx`.
- [ ] `app/dashboard/page.tsx`: delete the CUSPA alert card and `remapped`/`untouched`;
      `CHAPTER_TITLES = CHAPTER_LABEL`; guard `latestRun` (runs is empty) and the percentage
      when `obligations.length` is 0; `TENANT_FACTS` keys `sebi-reg-no`, `pms-aum`,
      `pms-clients`; sub-copy names Molecule as portfolio manager and AIF manager; tenant-line
      paragraph becomes one sentence saying figures are declared until Molecule's own filings
      are loaded.
- [ ] `app/documents/page.tsx`: delete the `excludedPart` block; replace `angelOneOnboarding`
      with `blankOnboarding` and drop the "Session … closed" sentence; provenance paragraph
      becomes one neutral sentence.
- [ ] `app/register/RegisterTable.tsx`: `Part {x}` literals become `{x}`; filter label "SEBI
      part" becomes "rulebook"; the empty-Parts sentence becomes "{label} carries no obligation
      yet"; the "Master Circular for Stock Brokers, Parts I–X" sentence reads from
      `SEBI_DOMAINS` instead.
- [ ] `app/documents/DocumentExplorer.tsx`: `Part {p}` becomes `{p}`; label "sebi part" becomes
      "rulebook".
- [ ] `app/inspector/page.tsx`: delete the Exchanges, QSB and Active clients rows; `baseCount`
      filters on "MC-PM-2025"; the two hints read "PMS rulebook" and "AIF rulebook".
- [ ] `app/remediation/page.tsx`: `earliestDue ?? "—"`; drop the RUN-047 and RUN-049 tiles or
      make them generic counts.
- [ ] `app/live/presets.ts`: three presets from the new corpus. PMS para 5.1.2, chapter
      pm-reporting, expectation applies. AIF para 21.1.2, chapter aif-reporting, expectation
      applies. Control case: one sentence addressed to "all stock brokers" with a duty, chapter
      pm-reporting, expectation not applicable and no model call.
- [ ] `components/AppShell.tsx`: menu label "Broker compliance" becomes "Molecule compliance".
      Persona key stays "broker" for now.
- [ ] Run `npx tsc --noEmit && npm run build`. Fix anything else that surfaces. Every page must
      render with empty register, evidence, tasks, runs and catches.

## Task 4 · Point the Worker at Molecule (`poneglyph/worker`)

- [ ] `applicability.ts`: import `molecule`; `ApplicabilityEntity` becomes `{ legalName,
      intermediaryTypes, segments }`; `CAPACITY_PHRASES` covers all seven types, with
      "portfolio-manager": portfolio manager, portfolio managers, portfolio management services,
      and "aif-manager": alternative investment fund, alternative investment funds, aif, aifs,
      manager of the aif, manager of an aif, investment manager of the aif; `SEGMENT_PHRASES`
      for the seven new segments; the "partial" verdict says applicability is inherited from the
      parent instrument's addressee line, without naming brokers.
- [ ] `verifier.ts`: replace `TENANT_CAPACITY` with `TENANT_CAPACITIES = molecule.intermediaryTypes`;
      `applicabilityMatch` and `precheck` pass when `appliesTo` intersects it.
- [ ] `extract.ts`: the prompt's appliesTo list carries all seven values; `CAPACITY_ALIASES`
      adds portfolio manager, portfolio managers, portfolio-manager, aif, aifs, alternative
      investment fund, alternative investment funds, aif manager, manager of aif, aif-manager.
- [ ] `watch.ts`: `TENANT_TERMS` = portfolio manager(s), alternative investment fund(s), aif(s),
      apmi; `DOMAIN_TERMS` = master circular, cscrf, cyber security, cybersecurity, cyber,
      intermediaries, intermediary, accredited investor, large value fund, co-investment,
      private placement memorandum, ppm, valuation, benchmarking, kyc, anti-money laundering,
      aml; `FOREIGN_TERMS` = stock broker(s), trading member(s), mutual fund(s), asset
      management company, amc, merchant banker(s), credit rating agency, debenture trustee,
      reit, invit, foreign portfolio investor(s), fpi, depository participant, research analyst,
      investment adviser(s). Reasoning strings say "this tenant", not "stock-broker tenant".
- [ ] `onboard.ts` + `types.ts`: rewrite onboarding minimal. Input: legalName, registrations
      `{ portfolioManager, aifManager }` as explicit booleans, segments, declared
      `{ pmsAumCr?, pmsClients?, aifCorpusCr?, aifInvestors? }`. Compute the CSCRF tier per the
      `CSCRF` table (higher of the two registrations), the Market-SOC exemption, the ₹1,000 cr
      automation trigger, applicable Parts from the registrations with a filed reason for any
      exclusion, documentRequirements `[]`. Replace `QsbDetermination` with a `SizeDetermination`
      carrying tier, basis and triggers. Drop `exchanges` from `LiveEntityProfile`.
- [ ] `pipeline.ts`: pass the new `ApplicabilityEntity` shape. `session.ts`: sequences start at
      1; obligation id prefix "OBL-".
- [ ] `npx tsc --noEmit` and `npx wrangler deploy --dry-run --outdir /tmp/wr-check` pass.

## Task 5 · Docs and hackathon residue

- [ ] Root `README.md` and `poneglyph/README.md`: short rewrite for Molecule (what it is, what
      is live vs seeded, how to run). Remove the Angel One and TechSprint framing.
- [ ] Delete `DEMO-SCRIPT.txt`, `BUILD-PLAN.md`, `STRATEGY.md`, `WIN-PLAN.md`, `round1-idea.md`,
      `chat.txt`, `PROJECT.md`, `data/sebi-event.json`, `poneglyph/public/pitch-deck.*`. Git
      history keeps them.
- [ ] Add `given/10-molecule-domains.md`: the two master circulars as the spine, the CSCRF tier
      table, and the recurring-filings table for PMS and Category II AIF. Source everything to
      `given/sources/` paragraph numbers.

## Not now (next phase, after 1–5 are green)

- Seed the recurring filings as obligations, grounded to `given/sources/` paragraphs, or run them
  through `/live` and approve at the gate: PMS monthly report (5.1.2, 7 working days), offsite
  inspection data (5.4.3, quarterly, 15 days), net worth certificate (5.2.1.1, 6 months), PO
  compliance certificate (5.2.1.2, 60 days), corporate governance report (5.2.2.4, 30 days),
  firm-level performance audit (5.3.4.2, 60 days), quarterly client report (5.5.1), CMM
  declaration (policy letter 8, quarterly, one month); AIF quarterly activity report (21.1.2, 15
  days), annual activity report (21.1.1, 30 days), CTR (21.2.2, 30 days), PPM audit (21.3.2, 6
  months), PPM changes (21.4.1, 1 month), NAV to depositories (11.3.1, 30 days), valuation
  (Reg 23, half-yearly), compliance officer NISM III-C by 1 Jan 2027 (17.1.1).
- A calendar step that turns each obligation's cadence into due dates.
- `wrangler.jsonc`: Molecule's Cloudflare account id, a fresh KV namespace, a Molecule domain;
  set `KIMI_*` or another model as Worker secrets.
- Rename persona "broker" to "firm"; sweep remaining broker copy in `app/live/LiveConsole.tsx`,
  `app/mcp/page.tsx`, `data/mcp.ts`, `app/watchtower/page.tsx`, `app/agents/page.tsx`.
- Watch the July 2026 consultation paper on new Portfolio Managers Regulations; if notified, the
  PMS spine changes.
