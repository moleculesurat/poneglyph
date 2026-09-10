# HANDOFF — Molecule compliance pipeline (read this first after /clear)

Updated 2026-09-10 (end of session 2). Repo /Users/pranjal/Code/poneglyph (app in poneglyph/), branch `molecule`,
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

## Next worker tasks (one prompt each, in order)
1. AIF Regulations collect (after 3): pdftotext -> given/sources; extend scripts/collect.mjs (regulations are
   numbered differently from circulars: Chapter/Regulation/sub-regulation); derive chapter taxonomy as before.
2. Remaining-corpus batches (after 2): `npm run paras` needs a `--all-shall` selector (SHALL regex only); run per
   chapter; I write a REVIEW-<date>.md per batch; Pranjal decides; pull; commit.
3. [7] MONITOR: a watchtower catch -> re-run the paragraph(s) of the affected circular -> diff drafts vs register.
4. [6] documents/evidence pages fed from register.json evidence (currently the vault pages render empty seed arrays).
5. Deployment: Molecule's Cloudflare account_id/KV/domain in wrangler.jsonc; `wrangler secret put GATE_TOKEN
   OPEN_ROUTER_KEY`; after deploy `npm run pull -- https://<domain>` becomes the durable loop.
6. Small: exchange holiday list for working-day math; collect footnote fix ("month 67", "]78from");
   EvidenceArtifact.validUntil (validated, not stored); poneglyph/DESIGN.md + README de-hackathon.

## Lessons (keep)
- Validate the plan before cutting tasks; derive data from sources, never hand-type it.
- For text transforms and term lists, spec the false-positive cases and say "grep X must return N lines".
- Run the checks yourself; write date/logic probes with expected values — my own nextDue spec had a bug the
  probe caught (started from the current period, skipped an open window).
- Read the chapter title, not only the paragraph: AIF chapter 7 is Category III throughout.
- One task per prompt; the worker executes literally; a `[PRANJAL: …]` slot beats an invented fact.
