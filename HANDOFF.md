# HANDOFF — Molecule compliance pipeline (read this first after /clear)

Updated 2026-09-09. Repo: /Users/pranjal/Code/poneglyph (app in poneglyph/). Branch `molecule`.
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

## In progress (prompt already given to the worker, awaiting report)
Task: app reads collected JSON as corpus; ChapterKey/SebiPart -> string; lib/domains.ts derives
SEBI_DOMAINS/CHAPTER_PART/CHAPTER_LABEL from `circulars`; delete broker demo register (obligations,
evidence, tasks, runs, catches, documents -> []; audit -> one genesis event, hash 492a3eac54e5);
stub /amendments (delete Redline.tsx); presets from collected paras (PMS 5.1.2, AIF 21.1.2,
broker control case); "Part {x}" literals -> partLabel(x); guards for empty arrays; drop the
worker's "spine-swap draft" stash. Accept only if: `npm run collect && npx tsc --noEmit &&
npm run build` pass, wrangler dry-run builds, /register /dashboard /live /audit load.
Commit msg: "molecule: app reads the collected corpus; chapter taxonomy derived; broker demo
register deleted".

## Next tasks (in order, one prompt each)
1. Stage [0] PROFILE: data/tenant.ts + data/entity.ts -> Molecule (PM + aif-manager, facts with
   provenance, cscrfGrade self-certification); IntermediaryType += portfolio-manager, aif-manager;
   BusinessSegment -> PMS/AIF lines; worker/applicability.ts + verifier.ts read capacities from the
   profile (TENANT_CAPACITY hardcode goes); watch.ts term lists flip (PM/AIF = tenant, broker =
   foreign); onboarding page -> stub on Molecule facts; remove QSB; CSCRF tiers from the Apr 2025
   circular; drop Tenant.exchanges/qsb/activeClients.
2. Stage [2]+[3]+[4] on real text: run the recurring PMS/AIF duties through /live, approve at the
   gate; then seed script or DB for approved obligations (KV is per-session today).
3. Rewrite MOLECULE-TODO.md around roadmap stages (stale). Docs cleanup (hackathon files).
4. Stage [5] SCHEDULE (cadence -> dates), [6] PROVE, [8] SHOW, [7] MONITOR tuning.
5. Deployment: Molecule's Cloudflare account/KV/domain in wrangler.jsonc, model secrets.

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
