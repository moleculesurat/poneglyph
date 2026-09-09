# HANDOFF — Molecule compliance pipeline (read this first after /clear)

Updated 2026-09-09 (evening). Repo: /Users/pranjal/Code/poneglyph (app in poneglyph/). Branch `molecule`.
Remotes: `origin` = github.com/moleculesurat/poneglyph (fork), `upstream` = walrus-securitas/poneglyph.

## Roles (do not drift)
- Pranjal runs a SEPARATE worker session that edits code. I (Claude) never edit code.
- My loop: write ONE low-level task prompt (self-contained, files + exact changes + acceptance
  checks + "commit, push, report back") -> Pranjal pastes it to the worker -> worker reports ->
  I VERIFY by running checks myself (never trust the report) -> accept/reject -> next prompt.
- No subagents/workflows. Web search OK. Ponytail mode on: shortest working diff, no new deps,
  verbatim regulatory text, never invent rules. I commit only docs (ROADMAP.md, HANDOFF.md).

## The goal (ROADMAP.md is the validated plan)
Molecule Ventures LLP: SEBI Portfolio Manager INP000007216 since 2021 (~Rs 777 cr AUM, 431
clients, Nov 2025), setting up a Category II AIF now. Build a pipeline, not hand-typed data:
[0] PROFILE -> [1] COLLECT -> [2] EXTRACT -> [3] ANALYSE -> [4] REGISTER -> [5] SCHEDULE ->
[6] PROVE -> [7] MONITOR -> [8] SHOW, plus an AIF launch checklist (one-time duties A-I).
Rules: every duty quotes the exact source sentence; nothing enters the register without a named
human sign-off; unproven = gap, never "done".

## What the fork already has (from the hackathon build)
Cloudflare Worker behind /api/*: hourly SEBI RSS watchtower (keyword triage, no model), one LLM
extraction call (Kimi, OpenAI-style; needs KIMI_* secrets), 5-check deterministic verifier
(exact-substring grounding), human gate (only writer of the register), real SHA-256 audit chain,
KV sessions. Everything else was static Angel One stock-broker demo data. Tenant/verifier/
watchtower still hard-wired to "stock-broker" until stage 0 lands.

## Done (commits on `molecule`)
- d20505d MOLECULE-TODO.md (OLD data-swap plan, now STALE) + given/sources/*.txt (pdftotext
  dumps: PMS MC 16 Jul 2025, AIF MC 3 Jun 2026, CSCRF clarifications 30 Apr 2025, PMS
  related-party circular 26 Aug 2022).
- 05c5aca ROADMAP.md (validated).
- 4029c57 worker: poneglyph/scripts/collect.mjs -> data/collected/mc-pm-2025.json (7 ch, 287
  paras) and mc-aif-2026.json (25 ch, 509 paras). Deterministic, `npm run collect`.
- 0073ed1 worker: footnote-stripper fix (was eating "para 2.4.1" -> "para 2.."). VERIFIED by me:
  zero damage patterns, all cross-refs/decimals present verbatim in source.

## Done today (all VERIFIED by me: tsc, build, wrangler dry-run, pages 200, greps, applicability probe)
- 6425cad app reads collected corpus; taxonomy derived from `circulars`; broker demo register deleted;
  audit = one genesis event AE-0001 hash 492a3eac54e5; presets PMS 5.1.2 / AIF 21.1.2 / broker control.
- 003ee9d stage [0]: tenant + entity = Molecule (portfolio-manager + aif-manager, 5 declared facts w/
  provenance, cscrfBasis verbatim from CSCRF clarifications 2.6/2.7/4 = self-certification, NOT M-SOC
  exempt); applicability/verifier/extract/watch read capacities from the profile; onboarding = profile stub.
  Team names are ROLE placeholders ("Compliance Officer", "Principal Officer") — Pranjal to fill.
- e85ccbd deleted live-onboard path (worker/onboard.ts, /api/onboard, liveEntity), QSB, onboarding
  session data/components; BusinessSegment = pms-discretionary|pms-non-discretionary|pms-advisory|
  aif-category-ii; entity.segments = [] until Pranjal declares which PMS lines Molecule runs.
- Probe (npx tsx, assessApplicability on the 3 presets): applies / applies / not-applicable. Re-run after
  any applicability change.

## Architecture facts learned
- Register lives ONLY in KV, per-visitor session (cookie pg_sid -> sess:<uuid>); /register /dashboard
  /audit pages render static seed data (now empty); only /live reads /api. So approvals are invisible
  outside /live and vanish per browser. Hackathon leftovers: /api/audit/tamper (corrupts the chain on
  purpose), /api/session/reset (wipes the register). No auth on the gate.
- Extraction needs an OpenAI-compatible endpoint: KIMI_API_KEY/KIMI_BASE_URL/KIMI_MODEL (Worker secrets or
  poneglyph/.dev.vars for `wrangler dev`). Pranjal has not yet supplied a key.
- wrangler.jsonc still pins Techgenie2050's account_id + poneglyph.walrussecuritas.com + KV id.

## Done (continued, all VERIFIED)
- 31fef04 4a: one shared session sid "molecule" (no cookies); x-gate-token (env GATE_TOKEN) required on
  POST /api/runs + /api/obligations/:id/decision (401); tamper + reset routes/UI deleted; dev.vars.example.
- 0ffeddc 4b: scripts/pull-register.mjs (`npm run pull`) -> data/collected/register.json (approved
  obligations + audit chain, no timestamp, idempotent); data/obligations.ts + data/audit.ts import it;
  seedSession seeds register + id sequence from it. Fresh KV reseed verifies intact, tip 492a3eac54e5.
- d151573 docs: hackathon planning docs + given/0*-*.md deleted; root README rewritten. Left: given/*.pdf,
  given/NOTE.md, DEMO-SCRIPT.txt, chat.txt, poneglyph/DESIGN.md (still says Angel One — worker fixes later).
- verifier.parseCadence already accepts "15 calendar days", "7 working days", named cadences, T+N.

- fe356a7 5-prep: scripts/run-paras.mjs (`npm run paras -- list|run`), 24/51/75 candidates, error paths
  verified (503 no model, unset/wrong token, para not found).

- b8ad754 6: OpenRouter is the provider (OPEN_ROUTER_KEY, optional MODEL, default anthropic/claude-sonnet-5,
  base URL constant); facts: AUM Rs 1,000 cr+ and 500 clients (Sep 2026, declared by Pranjal), segments
  ["pms-discretionary"], new fact pms-automation-threshold (PMS MC 2.7.3.1 applies at >= Rs 1,000 cr).
- FIRST REAL RUN (RUN-050, MC-PM-2025 5.1.2, 10 s, 557 completion tokens): 5/5 checks, 2 drafts.
  OBL-SB-201 "Upload monthly report on SEBI Intermediaries Portal", periodic, 7 working days, excerpt
  verbatim chars 40-134 — GOOD. OBL-SB-202 "No hard copy submission required" — NOT a duty (a relief
  sentence); prompt SCOPE needs "a statement that something is not required / exempted / permitted is not
  an obligation". Drafts sit in local KV only (.wrangler/state), nothing approved.
- Pranjal's decisions: placeholders for team names are fine for now; Molecule runs discretionary PMS only;
  provider = OpenRouter.

- 8229070 7: SCOPE excludes relief/permission + procedure sentences (fixed the hard-copy draft); ids OBL-001…
  Fresh KV rerun: 5.1.2 -> OBL-001 upload monthly report, periodic, 7 working days, chars 40-134;
  21.1.2 -> OBL-002 quarterly activity report, periodic, "quarterly" (15 calendar days in excerpt), chars 0-170.
  Both 5/5, pending in local KV. These two are the reference drafts for model comparisons.
- Pranjal edited README/dev.vars.example (uncommitted) to default MODEL z-ai/glm-5.3-flash (~30x cheaper than
  sonnet-5 on OpenRouter). .dev.vars has no MODEL line, so code default decides.

## In progress (prompt given, awaiting report)
Task 8: DEFAULT_MODEL -> z-ai/glm-5.3-flash, commit Pranjal's doc edits (fix "anthropic/z-ai" typo), fresh KV,
rerun 5.1.2 + 21.1.2 on GLM, compare to reference drafts. If GLM misses grounding or emits non-duties,
revert default to sonnet-5 (report first).

## Next tasks (one prompt each)
5.  Task 8: /live pending queue (app/live/PendingQueue.tsx: list all pending drafts from /api/state with the
    GateCard approve/reject). Task 9: `run MC-PM-2025 all` + `run MC-AIF-2026 all` (75 paras, ~15 min);
    Pranjal approves/rejects in the queue; `npm run pull`; commit register.json.
6.  Pranjal fills tenant.team names and entity.segments. poneglyph/DESIGN.md + poneglyph/README.md de-Angel.
7.  [5] SCHEDULE (frequency -> next due dates from the FY calendar), [6] PROVE (evidence upload/bind),
    [8] SHOW (/register, /dashboard render from register.json — already do, via data/*.ts), [7] MONITOR.
    Collect residual: footnote marker at source line end survives (PMS 5.1.2 "each month 67 and").
8.  Deployment: Molecule's Cloudflare account/KV/domain in wrangler.jsonc; `wrangler secret put` GATE_TOKEN
    + KIMI_*. Run ids restart at RUN-050 on a fresh KV (runs are not pulled) — acceptable, note it.

## Key facts the tasks depend on
- CSCRF tiers (given/sources/cscrf-clarifications-2025-04-30.txt para 2.6/2.7/4): PM AUM
  > Rs 3,000 cr = mid-size else self-certification; AIF manager summed corpus >= 10,000 cr mid,
  3,000-10,000 small, <= 3,000 self-cert; self-cert with < 100 clients exempt from Market-SOC;
  dual registration takes higher; fixed per FY from prior-FY data. PMS AUM >= Rs 1,000 cr ->
  automated order/allocation system (PMS MC 2.7.3.1). Molecule = self-cert, NOT M-SOC exempt.
- Key cadences: PMS monthly report 7 working days (5.1.2); offsite data quarterly 15 days (5.4.3);
  net worth cert 6 months (5.2.1.1); PO compliance cert 60 days (5.2.1.2); CMM quarterly 1 month.
  AIF QAR 15 days (21.1.2), AAR 30 days (21.1.1), CTR 30 days (21.2.2), PPM audit 6 months
  (21.3.2), valuation half-yearly, NAV to depositories 30 days (11.3.1), CO NISM III-C by
  1 Jan 2027 (17.1.1). Cat II: Rs 20 cr corpus, Rs 1 cr ticket, 1,000 investors, sponsor 2.5%
  or Rs 5 cr, 3-yr tenure, 25% concentration, borrowing 30d/4x/10%.
- Watch item: SEBI consultation paper 23 Jul 2026 on new PMS Regulations.

## Mistakes made, lessons
- First task list (MOLECULE-TODO.md) framed the work as hand-swapping taxonomy + seed data.
  Pranjal corrected: it is a PIPELINE (collect -> extract -> ...). Worker had already done the
  hand-typed spine swap -> parked in stash, superseded. Lesson: validate the roadmap before
  cutting tasks; derive data from sources, never hand-type it.
- My collect prompt told the worker to strip footnote digits after "closing punctuation";
  that spec corrupted cross-refs/decimals. Lesson: when specifying text transforms, name the
  false-positive cases and demand assertions for them.
- Reviews must run the checks (determinism, greps against source, tsc); the worker's reports
  were honest but the bug only showed up by testing.
- Keep prompts to one task; the worker executes exactly what is written.
- Spec warts I caused today: told the worker to add "custodian" to DOMAIN_TERMS without removing it from
  FOREIGN_TERMS; named only two broker phrasings so a third survived. Lesson: for term-list edits say
  "grep X must return N lines" instead of naming phrasings.
- Never let the worker invent facts about Molecule: unknowns become [PRANJAL: ...] slots or role placeholders.
