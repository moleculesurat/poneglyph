# HANDOFF — Molecule compliance pipeline (read this first after /clear)

Updated 2026-09-10 (session 3, plan v2 agreed shape — see ROADMAP.md PLAN v2). Repo /Users/pranjal/Code/poneglyph (app in poneglyph/), branch `molecule`,
origin = github.com/moleculesurat/poneglyph. ROADMAP.md has the plan + status board; REVIEW-2026-09-10.md the draft review.

## Roles (do not drift)
- Pranjal runs a SEPARATE worker session that edits code. I (Claude) never edit code; I commit only docs
  (ROADMAP.md, HANDOFF.md, REVIEW-*.md).
- Loop: I write ONE self-contained task prompt (files, exact changes, acceptance commands with expected output,
  "commit, push, report") -> Pranjal pastes it -> worker reports -> I VERIFY by running the checks myself (tsc, build,
  wrangler dry-run, greps, `npx -y tsx` probes, curl against `npx wrangler dev --port 8787`) -> accept/reject -> next.
- Ponytail on: shortest working diff, no new deps, verbatim regulatory text, never invent rules or facts about Molecule.
  Unknown facts become [PRANJAL: …] slots. Pranjal is the human gate; I only recommend.

## What exists (all verified)
- Corpus: `npm run collect` -> data/collected/mc-pm-2025.json, mc-aif-2026.json (paragraph JSON from given/sources/*.txt).
- Profile: data/entity.ts + data/tenant.ts = Molecule Ventures LLP, PM INP000007216 + aif-manager (Cat II in prep),
  AUM Rs 1,000 cr+, 500 clients (Sep 2026, declared by Pranjal), segments ["pms-discretionary"], CSCRF self-cert,
  NOT M-SOC exempt. Team = ROLE PLACEHOLDERS ("Compliance Officer", "Principal Officer").
- Worker (Cloudflare, /api/*): one shared session sid "molecule"; x-gate-token (env GATE_TOKEN) on all write routes;
  applicability (capacities + chapter title + AIF-category regexes) -> OpenRouter extraction (OPEN_ROUTER_KEY, MODEL
  default z-ai/glm-5.3-flash, 16k tokens, no reasoning cap by Pranjal's order) -> 5-check verifier -> gate ->
  evidence bind (POST /api/obligations/:id/evidence, sha256 of the file, file stays with the firm) -> SHA-256 chain.
  tamper/reset/onboard/mcp demo routes deleted.
- Scripts: `npm run paras -- list|run <circ> <paras|all>` (skips drafted paras, survives dropped connections),
  `npm run decide -- approve|reject ids`, `npm run attach -- OBL-x --title … --file path`, `npm run pull`
  (worker -> data/collected/register.json: approved obligations + evidence + audit chain; idempotent; the worker
  reseeds a fresh KV from it). All need `npx wrangler dev --port 8787` running and `export GATE_TOKEN=$(grep
  '^GATE_TOKEN=' .dev.vars | cut -d= -f2)`. .dev.vars is gitignored (GATE_TOKEN, OPEN_ROUTER_KEY).
- Register in git (0f65e97, 3025146): 86 approved (40 PMS / 46 AIF; 31 periodic, 41 event-driven, 10 ongoing,
  4 one-time), 31 rejected, 0 pending, EV-001 (test file ev.txt) bound to OBL-001, 355 events, tip a94246dffa92.
  Every excerpt verbatim in the corpus. All 75 "shall + time limit" paragraphs are drafted or ruled out.
- lib/schedule.ts: parseSchedule (period + window from the excerpt only), nextDue (from the LAST period end),
  effectiveStatus (met periodic duty re-opens as gap once evidence is older than the last period end). 20 date cases pass.
- UI: /live (run one paragraph, gate queue, chain), /register (live overlay from /api/state, attach-evidence form,
  hash computed in browser), /dashboard (upcoming filings + runway from schedule), /onboarding = profile stub.
  Hackathon residue purged (Angel One, CUSPA, QSB, fake MCP). Left: given/*.pdf, DEMO-SCRIPT.txt, chat.txt,
  poneglyph/DESIGN.md + poneglyph/README.md still hackathon-flavoured.

## Pranjal's facts/decisions so far
Discretionary PMS only; distributors YES; ETCD no; CDS no; real-estate investees no; overseas limit YES;
co-investment PMS no; placeholders for names OK for now; OpenRouter + GLM; no reasoning cap.

## Open on PRANJAL's side
1. Browser test of Task 17: open localhost:8787/register/, expand an approved row, attach a real file (hash only is
   sent), gate token in the password box; row flips to Met without rebuild; then `npm run pull` + commit register.json.
2. YES/NO on extracting the other ~445 "shall" paragraphs (ongoing duties, e.g. PMS MC 2.7.3.1 automated order
   system now triggered by AUM >= Rs 1,000 cr). Suggested order: PMS ch 2, AIF ch 3, then the rest, ~50 paras a batch,
   review sheet per batch.
3. AIF Regulations 2012 consolidated PDF into given/ (or permission to fetch from sebi.gov.in) -> collect -> the AIF
   registration/launch checklist. Today the register holds only post-registration AIF duties.
4. Real Compliance Officer / Principal Officer names before anyone relies on the register (86 approvals signed
   "Compliance Officer").

## Next worker tasks (one prompt each, in order — PLAN v2 in ROADMAP.md)
1. AIF Regulations collect (after Pranjal's yes on fetching, or the PDF lands in given/): pdftotext -> given/sources/
   aif-regulations-2012-2026-07-14.txt; extend scripts/collect.mjs for Chapter/Regulation/sub-regulation numbering;
   chapter taxonomy in lib/domains.ts as before. URL + PDF link in ROADMAP.md "SOURCES TO ADD".
2. Profile: entity.ts facts `aif-stage` (not-applied|applied|in-principle|registered|first-close; today
   not-applied) and `aif-categories-held` ([PRANJAL: ii only, or ii+iii]); both declared, source slots.
3. Nav split: groups PMS · AIF Registration · AIF Rules · Watchtower · Engine · Inspection. /register stays the PMS
   register (filter part=MC-PM); /aif/registration and /aif/rules are new routes; AIF Rules greyed with
   "switches on at registration" while aif-stage != registered/first-close.
4. AIF registration section: one-time duties (type one-time, sources AIF Regs ch II + AIF MC ch 1,2,3,12) rendered
   as the ordered A–I checklist with progress; reuse AttachEvidence + effectiveStatus; no new data path.
5. Cat III: applicability tags `aifCategories` instead of rejecting; Obligation.aifCategories in schema + verifier;
   `npm run paras -- run MC-AIF-2026 <chapter 7 paras>`; /aif/rules tabs Cat II | Cat III; rows for a category not
   held render as reference, never as gap.
6. Watchtower v2: watch.ts polls RSS + circulars-all + circulars deptId=75 + master-circulars + regulations listing
   (URLs in ROADMAP.md); hand-rolled anchor/date parse; same seen/catches keys; probe the ajax paginator from the
   worker once (HTTP 530 from laptop). Then `npm run watch:pull` -> data/collected/watch.json.
7. Remaining-corpus batches (after Pranjal's yes): `npm run paras` gets `--all-shall`; PMS ch 2 first, then AIF ch 3;
   REVIEW-<date>.md per batch; decide; pull; commit.
8. [6] documents/evidence pages fed from register.json evidence.
9. Deployment: Molecule's Cloudflare account_id/KV/domain in wrangler.jsonc; secrets; `npm run pull -- https://<domain>`.
10. Small: exchange holiday list; collect footnote fix ("month 67", "]78from"); EvidenceArtifact.validUntil;
    DESIGN.md + README de-hackathon.

## Watchtower facts (probed 2026-09-10 from a laptop, curl with a browser UA, no cookies)
- RSS: HTTP 200, 30 items, 29 enforcement/recovery + 1 circular. Missed circular 104323 (AIF, Sep 2026).
- Circulars listing GET (sid=1&ssid=7&smid=0): HTTP 200, 25 items; &deptId=75 -> 25 AIF/FPI items; &deptId=9 -> IMD
  (mutual funds). No intermediary filter in the GET form. Master circulars ssid=6, regulations ssid=3 (deptId ignored).
- Ajax paginator POST sebiweb/ajax/home/getnewslistinfo.jsp -> HTTP 530 from laptop.
- AIF Regulations 2012 consolidated (last amended 14 Jul 2026) page _102975.html, PDF attachdocs/jul-2026/1785301664601.pdf.

## Lessons (keep)
- Validate the plan before cutting tasks; derive data from sources, never hand-type it.
- For text transforms and term lists, spec the false-positive cases and say "grep X must return N lines".
- Run the checks yourself; write date/logic probes with expected values — my own nextDue spec had a bug the
  probe caught (started from the current period, skipped an open window).
- Read the chapter title, not only the paragraph: AIF chapter 7 is Category III throughout.
- One task per prompt; the worker executes literally; a `[PRANJAL: …]` slot beats an invented fact.
