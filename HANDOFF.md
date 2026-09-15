# HANDOFF — Molecule compliance (read after /clear; then ROADMAP.md)

Written 2026-09-15, end of session 4. Repo /Users/pranjal/Code/poneglyph, app in poneglyph/, branch `molecule`,
origin github.com/moleculesurat/poneglyph. Memory dir has the working rules (docs discipline, disable-not-delete).

## How we work
- Pranjal runs a SEPARATE worker session that edits code. I never edit code; I commit docs only.
- Loop: I write ONE task prompt in chat (files, exact changes, acceptance commands with expected values, "commit, push,
  report") -> Pranjal pastes it to the worker with the preface "You are the worker: implement, run acceptance, report
  verbatim" -> I VERIFY every report myself on a fresh store (`PORT=879x STATE_DIR=<scratch> node server.mjs`) -> accept.
- Module by module: plan the module in the session, cut tasks one at a time, implement, close. ROADMAP.md is the concise
  module guide; edit it only when the plan changes. HANDOFF.md is written once, at session end. Task prompts live in chat.
- Nothing planned is deleted; a control without a backend is disabled with "not available yet". Never invent facts about
  Molecule ([PRANJAL] slots). Officers appear by alias (Compliance Officer, Principal Officer, Operations). Anchal
  (Operations) holds the gate token. Ponytail: shortest diff, no new deps, verbatim regulatory text.

## State (all verified by me)
- Register: 286 approved (240 PMS / 46 AIF), 83 rejected/withdrawn; OBL-401 (no leveraging for derivatives) still
  pending-review in Pranjal's KV — approve + `npm run pull` -> 287. Both PMS sources fully extracted.
- Runtime (task 31a): `npm run serve` = esbuild bundle of worker/index.ts -> dist/worker.mjs + server.mjs (Node http ->
  worker.fetch, static out/, hourly scheduled()), store.mjs = KV shim on node:sqlite in `.state/`. Wrangler no longer
  needed locally. Watchtower live poll works from Node: 7 sources, HTTP 200, ~295 catches. AWS port PARKED (31b/31c).
- Module 0 honest surface (task 32): demo wording gone; unbuilt controls say "not available yet"; title "Molecule Compliance".
- Module 1 documents in — CLOSED (tasks 33–36, browser-verified by me with headless Playwright, 6/6 steps):
  33 `POST /api/documents` multipart -> file at `STATE_DIR/files/<sha>.pdf` + `.txt` sidecar (pdftotext), bindings
     env.FILES / env.PDFTEXT from server.mjs (worker stays platform-free), `GET /api/documents/:id/text`, documents pulled
     into register.json and reseeded.
  34 `POST /api/documents/:id/read` -> model proposal (verdict per ask satisfies/partial/no, fields, validFrom/Until);
     verifier: every value/quote/locator verbatim in the text; one correction round then 422. `chatJson` in extract.ts.
  35 `POST /api/documents/:id/decision` verify|reject; verify binds ONE evidence artefact (connector vault-upload) to
     every duty the asks unlock (bulk); reject keeps the trail. Audit subjectType "document".
  36 Vault UI: supply form with AskPicker, Read, Verify/Reject, live status per ask, Volunteered section, Signer select.
- Not built: vault stat tiles are static; expired/waived statuses; tasks; amendments; daily refresh; OPS.md.

## Pitfalls met this session (keep)
- register.json is INLINED into dist/worker.mjs at `npm run bundle` time. `node server.mjs` after a pull serves a stale seed;
  `npm run serve` rebundles. Any refresh script must bundle AND build.
- Before acceptance curls, `lsof -nP -iTCP:<port> -sTCP:LISTEN`: a leftover server answers for the one you think you started.
- `npm run pull` stamps the base URL into register.json line 2; compare from line 3 or pull from the same port.
- pdftotext ends the text with a form feed (pages = split("\f") after stripping the trailing one); chars != bytes (₹, quotes).
- The free-tier model (z-ai/glm-5.3-flash) sometimes hangs to the 240 s timeout; a retry usually returns in 1–2 min.
- Claims in a spec are claims about the code, not targets; the worker reports, nobody bends the code (several of my
  expected values were wrong: pages 78/79, chars vs bytes, audit counts, "five toasts" that were three).
- A shell guard refuses `aws` without `--profile`; heredocs containing such lines are blocked whole — use the Write tool.
- The worker session once answered a task prompt as if it were a coordinator; prefix pastes with "You are the worker".
- UI acceptance: I can drive a browser with Playwright installed in the scratchpad (`npm i playwright` +
  `npx playwright install chromium`, script walk.cjs there); wait for the panel refresh before reading chips.

## Seen, not yet fixed (module 2 list)
- Header shows "SIM-TODAY 2026-09-09" from data/tenant.ts simToday (pinned); due-date maths on static pages uses build date.
- Breadcrumb says "Dashboard" on every page: findCrumb misses the trailing slash of the static export.
- Six "sandbox" comments remain in worker/ (comments only). `POST /api/watch/poll` is NOT gated (matters when public).

## Next: Module 2 — vault kept current (plan proposed, awaiting Pranjal's yes)
1. Live stat tiles from /api/state; pinned date -> browser clock; crumb fix.
2. Expired: validUntil passed or refresh cadence older than the last period -> expired, duty reopens as gap (lib/schedule).
3. Waived: ask waived with reason + signer (gated), out of the required count, visible in the inspector view.
4. AIF asks and duties as reference (out of every count) until the aif-status fact says registered.
Then modules 3 (tasks for people), 4 (new documents + amendments), 5 (refresh + launchd + OPS.md).

## Open on Pranjal's side
- What document evidences the 132 ongoing prohibitions (quarterly compliance certificate? internal audit? board minutes?).
- Does a waiver need a second signer or the token holder's alias?
- Approve OBL-401 + pull. Laptop LAN address (module 5). Officer names stay aliases for now (decided).
- Parked 31b prompt (Terraform for mv-compliance) was in git history at commit c3efc3f (HANDOFF.md bottom) if AWS resumes.
