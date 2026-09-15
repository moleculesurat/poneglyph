# Molecule Compliance — roadmap

One register, one gate, one evidence path. Every duty points to the exact sentence SEBI wrote; nothing enters the
register until a named officer signs it; what we cannot prove shows as a gap. register.json in git is the truth; the
running app (Node + sqlite on Pranjal's laptop, `npm run serve`) is the working copy. AWS later.

We work module by module: plan the module in the session, cut tasks one at a time, implement, close, next.
Nothing planned is deleted; a control without a backend is disabled with a truthful label. Officers appear by alias
(Compliance Officer, Principal Officer) for now. Anchal holds the gate token.

## Goal

A complete, running PMS compliance check: the firm's supporting documents come in and are read against the asks;
the vault stays current (received, verified, expired, waived); people get tasks with due dates; new SEBI documents
are ingested and amendments flow into the register as redlines, not surprises.

## Where we stand (2026-09-15)

Built: corpus (PMS MC 2025, PM Regulations 2020, AIF MC), extraction pipeline with 5-check verifier and human gate,
register of 286 approved duties with schedules, evidence bind by hash, hash-chained audit, watchtower polling 7
sources, Node runtime with sqlite state, 284 document asks derived from the register.
Not built: files are not stored or read; vault statuses are only "required/received" and computed at build time; no
tasks; no amendment path (a catch stops at the watchtower); static pages go stale until a rebuild.

## Modules, in order

| # | Module | Done looks like |
|---|--------|-----------------|
| 0 | Honest surface | no demo wording; unbuilt controls say "not available yet" (task 32, in flight) |
| 1 | Documents in | Anchal uploads a PDF against an ask (or volunteers one); the server stores the file, reads it (pdftotext), the model extracts the fields the ask needs and says whether the document satisfies it, every extracted value verbatim from the file; the officer accepts → verified, evidence bound to every duty the document unlocks in one go |
| 2 | Vault kept current | statuses live from the API, not the build: required / received / verified / expired (refresh cadence or validUntil passed) / waived (with reason, gated); filters by status, category, chapter; history per ask; AIF asks shown as reference until AIF is registered |
| 3 | Tasks for people | every periodic duty raises a task for its next due date, owner = the duty's control owner alias; event-driven and one-time duties get tasks by hand; a task closes itself when the duty's evidence lands; overdue is computed daily; the team page is the day's list per person |
| 4 | New documents and amendments | a watchtower catch marked "applies" becomes a work item: fetch the PDF, pdftotext, collect as a new corpus version, diff by paragraph against the current one, re-run only added/modified paragraphs through the pipeline, gate; approving a redraft supersedes the old duty (evidence history kept); the amendments page shows the redline; a standalone new circular runs its "shall" paragraphs the same way |
| 5 | Fresh and reachable | `npm run refresh` (pull → build → commit), launchd (serve at login, refresh daily), LAN URL, OPS.md runbook |

After that: AIF (profile stage facts, AIF Regulations collect, onboarding Cat II, rules tabs), Ask (MCP), Inspection
on real data, Deployment to AWS when Pranjal says so.

## Design decisions that hold across modules

- Files live on disk under `STATE_DIR/files/<sha256>` (the laptop today, EFS later); metadata in the session state.
- The worker stays platform-free: the Node adapter hands it `env.PDFTEXT` (pdftotext) and `env.FILES` the way it
  hands it `env.ASSETS` and `env.PONEGLYPH_STATE`.
- Machine reads are proposals: extracted fields and "satisfies" verdicts go through the same officer gate as duties;
  every value must be a verbatim substring of the document text or the verifier rejects it.
- Pages that change during the day (vault, tasks, register) read `/api/state`; the daily rebuild keeps the rest.
- Amendments never edit a duty in place: a new draft `supersedes` the old id; the old row keeps its evidence trail.

## Rules that never change

- A count in a spec is a claim about the source, not a target; if the parse disagrees, report, do not bend.
- One duty, one line; prohibitions stay even for instruments not held; process duties for instruments not held are
  rejected; applicant-stage steps are history.
- Never invent facts about Molecule — unknowns are [PRANJAL] slots.
- Ponytail: shortest working diff, no new dependencies, verbatim regulatory text.

## Sources not yet collected

- AIF Regulations 2012, last amended 14 Jul 2026: sebi.gov.in …/jul-2026/…-_102975.html (PDF attachdocs/jul-2026/1785301664601.pdf)
- PMS related-party circular 2022 (given/sources) — on purpose: MC 2025 ch 3.4–3.7 consolidates it.
