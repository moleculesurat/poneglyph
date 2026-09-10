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

- 37548a1 8: DEFAULT_MODEL z-ai/glm-5.3-flash (Pranjal's choice, ~30x cheaper); GLM reproduced both reference
  drafts (1 draft each, 5/5, verbatim excerpts; titles wordier; 5.1.2 frequency "monthly" vs Sonnet's
  "7 working days"). Schema gap for stage [5]: cadence and filing window share one `frequency` field.

- 95b6982 9: app/live/PendingQueue.tsx — all pending drafts from /api/state, GateCard reused, mounted under the console.
- 84435f9 10: FIRST TWO APPROVALS in git: register.json = OBL-001 (PMS 5.1.2), OBL-002 (AIF 21.1.2), approved by
  "Compliance Officer" (placeholder, Pranjal's OK), status gap (no evidence), 7 events, tip 87abbb09e9e3.
  Reseed loop proven: fresh KV -> intact, same tip, re-pull byte-identical. d93fdec /live prose fixed.
- Gotcha: `npm run pull` needs `npx wrangler dev --port 8787` running (ECONNREFUSED otherwise).
- /register rows are client-rendered (RegisterTable in Suspense) so static HTML greps can't see ids; use the JS chunk.
- Pranjal's .dev.vars GATE_TOKEN was literally "<pick a real token>" — told him to set a real one.

- 7693950 11: BATCH RUN on GLM: 75 paras -> 69 pending drafts, 35 failed runs (18 finish_reason=length: GLM
  burns the 4000-token budget on reasoning; 11 invalid JSON; 8 no evidenceSpec). Drafts live in local KV
  (.wrangler/state) — DO NOT rm it until they are decided and pulled. Worker's AIF retry may still add drafts.
- e21708c REVIEW-2026-09-10.md: my recommendations on all 69 (reject 12: 3 duplicates, 9 wrong category/
  fragments; approve 53; 4 need Pranjal's facts: ETCD, distributors, CDS, real-estate investees).

- 7a52021 12: MAX_TOKENS 16000 (Pranjal: NO reasoning cap); run-paras skips drafted paras, survives dropped
  connections; scripts/decide.mjs bulk approve/reject (`npm run decide -- approve|reject ids`). 1.5.1.4 now drafts
  (3455 of 3639 completion tokens were reasoning). Pending drafts: 84; still-failed paras: 12 (list in REVIEW).
- Review sheet updated for all 84. KEY FINDING: AIF chapter 7 title = "Operational and prudential norms for
  Category III AIFs" — applicability must read the chapter title, not only the paragraph.

- 714711d 13: applicability reads chapter title + AIF category regexes (Cat I/III, Angel, LVF, open-ended, VCF);
  probe verified (7.6.2/8.2.1/12.1.5/2.6.1 not-applicable; 21.1.2/3.2.5/21.3.7 applies). 12 failed paras rerun:
  31 new drafts OBL-087..117; 7.3.3 stopped before the model. ALL 75 candidates now drafted. 115 pending in local KV.
- REVIEW-2026-09-10.md covers all 115: reject 25, approve 76, 14 conditional on 6 yes/no facts from Pranjal.
- Footnote artefacts in excerpts: only OBL-011 "]78from", OBL-098 "] 74days" (+ "month 67" in the corpus). Cosmetic; collect fix deferred.

- 0f65e97 REGISTER IN GIT: 86 approved (40 PMS, 46 AIF; 31 periodic, 41 event-driven, 10 ongoing, 4 one-time),
  31 rejected, 0 pending; 354 events, tip 0f50b24363a6. Verified: every excerpt verbatim in corpus, chain intact,
  re-pull idempotent, no rejected id in the register. Pranjal's facts: ETCD no, distributors YES, CDS no, real-estate no,
  overseas limit YES, co-investment no. All approvals signed "Compliance Officer" (placeholder).
- frequency strings in the register: annual 11, monthly 6, 30 days 6, quarterly 5, 15 days 5, 60 days 4, half-yearly 2,
  N working days 5, event-driven 16, None 21. deadline is never set. Excerpts carry the real window text.

- 472c63a + 3af4624 14/14b: lib/schedule.ts (parseSchedule from excerpt text, nextDue from the LAST period end so an
  open window is never skipped — my first spec had that bug; 20 date cases pass); dashboard "upcoming filings" table
  + DeadlineRunway fed from it; hard-coded CUSPA milestones deleted. 30/31 periodic duties parse, 29 dated.
  Working days = Mon-Fri, holidays not modelled (ponytail comment).

- d3195e1 15: CUSPA prose, fake /mcp page + data/mcp.ts, dead redline links purged. Residue with WRONG NUMBERS
  still shown: register.tsx gapsFromAmendment / watchtower.tsx cuspaRemapped filter on circularId !== "MC-SB-2025"
  (= all 86), inspector "Jul 3 amendment" hint -> Task 15b.

## In progress (prompts given, awaiting reports)
Task 15b: the three MC-SB-2025 / Jul 3 residues (tiny).
Task 16 (stage [6] PROVE, API + CLI): SessionState.evidence; POST /api/obligations/:id/evidence (gate token) binds an
EvidenceArtifact (metadata + SHA-256 of the file, file stays in Molecule's drive), obligation -> met, audit event
evidence.bound; /api/state + pull + data/evidence.ts + seed carry evidence; scripts/attach.mjs. Task 17 next: UI
form in the register row + live status overlay from /api/state; periodic duties re-open as gap after the period end.

## Next tasks (one prompt each)
5.  Decide with Pranjal whether to extract the other ~445 'shall' paragraphs (ongoing duties without a cadence),
    chapter by chapter (suggested: PMS ch 2, AIF ch 3 first). [6] PROVE: evidence upload + bind (status gap -> met).
    Collect footnote fix when convenient. Real team names before the register is relied on.
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
