# Molecule Compliance — roadmap (PMS only)

One register, one gate, one evidence path. Every duty points to the exact sentence SEBI wrote; nothing enters the
register until a named officer signs it; what we cannot prove shows as a gap. register.json in git is the truth; the
running app (Node + sqlite on Pranjal's laptop, `npm run serve`) is the working copy. AWS later.

We work module by module: plan the module in the session, cut tasks one at a time, implement, close, next.
Nothing planned is deleted; a control without a backend is disabled with a truthful label. Officers appear by alias
(Compliance Officer, Principal Officer, Operations) for now. Anchal holds the gate token.

## Goal

A live, working PMS compliance manager for a firm that has run for four years. The tool says which documents the
firm needs; Pranjal drops what exists into a folder; the tool classifies each file, reads the fields the asks need,
checks it against the duties it evidences, and stores it in the vault. What is missing shows as a gap, what does not
apply is waived with a reason, what is stale shows as expired. AIF is parked, not removed, until the firm is registered.

## Where we stand (2026-09-15)

Built: corpus (PMS MC 2025, PM Regulations 2020, AIF MC), extraction pipeline with 5-check verifier and human gate,
register of 286 approved duties (240 PMS / 46 AIF) with schedules, 284 document asks (237 PMS), evidence bind by hash,
hash-chained audit, watchtower polling 7 sources, Node runtime with sqlite state, per-ask upload → pdftotext →
verbatim-grounded machine read → officer verify/reject (module 1).
Not built: AIF still counted everywhere; no list of the real-world documents the asks resolve to; no folder intake;
vault statuses stop at received/verified; no tasks; no amendment path; static pages stale until a rebuild.

## Modules, in order

| # | Module | Done looks like |
|---|--------|-----------------|
| 0 | Honest surface | done — no demo wording; unbuilt controls say "not available yet" |
| 1 | Documents in | done — upload against an ask, pdftotext, machine read grounded verbatim, officer verify binds evidence to every duty the document unlocks |
| 2 | PMS only | one switch parks MC-AIF-2026: its duties and asks leave every count, tile, filter and list; they stay in register.json and appear as "AIF — parked, not available yet" where a rulebook is named; the AIF preset and applicability code stay as they are |
| 3 | Document catalogue | the 237 PMS asks are grouped into the firm documents that actually satisfy them (Disclosure Document, client agreement template, code of conduct, compliance certificates, audit reports, SEBI filings and acknowledgements, registers …), each kind listing the asks it covers and its cadence; grouping proposed by the model from the ask text, reviewed in a REVIEW sheet, committed as data; a checklist page and a printable folder list tell Pranjal what to collect |
| 4 | Folder intake | PDFs dropped in an inbox folder are picked up by one command: sha, pdftotext, classify into a catalogue kind (verbatim-grounded title and dates), then the existing read runs against that kind's asks; the vault shows each file as received with its proposal; the officer verifies in bulk; a file that fits no kind lands as volunteered, never guessed |
| 5 | Vault kept current | statuses live from the API, not the build: required / received / verified / expired (validUntil or refresh cadence passed) / waived (reason + signer, gated — the honest answer for event asks the firm has never triggered); live stat tiles, browser clock, breadcrumb fix; filters by status, kind, chapter; history per ask |
| 6 | Tasks for people | every periodic duty raises a task for its next due date, owner = the duty's control owner alias; event and one-time duties get tasks by hand; a task closes when the duty's evidence lands; overdue computed daily; the team page is the day's list per person |
| 7 | New SEBI documents and amendments | a watchtower catch marked "applies" becomes a work item: fetch, pdftotext, collect as a new corpus version, diff by paragraph, re-run only changed paragraphs, gate; an approved redraft supersedes the old duty (evidence history kept); the amendments page shows the redline |
| 8 | Fresh and reachable | `npm run refresh` (pull → build → commit), launchd (serve at login, refresh daily), LAN URL, OPS.md runbook |

Parked until Pranjal says so: AIF (unpark the switch, profile stage facts, AIF Regulations collect, Cat II onboarding),
Ask (MCP), Inspection on real data, AWS deployment.

## Design decisions that hold across modules

- Files live on disk under `STATE_DIR/files/<sha256>` (the laptop today, EFS later); metadata in the session state.
- The worker stays platform-free: the Node adapter hands it `env.PDFTEXT` (pdftotext) and `env.FILES` the way it
  hands it `env.ASSETS` and `env.PONEGLYPH_STATE`.
- Machine reads are proposals: extracted fields, classifications and "satisfies" verdicts go through the same
  officer gate as duties; every value must be a verbatim substring of the document text or the verifier rejects it.
- Catalogue kinds are derived from the asks and reviewed by a person; a kind with no ask behind it does not exist.
- Parked is a data switch, not a deletion: AIF rows stay in register.json and in the corpus; only the view filters.
- Pages that change during the day (vault, tasks, register) read `/api/state`; the daily rebuild keeps the rest.
- Amendments never edit a duty in place: a new draft `supersedes` the old id; the old row keeps its evidence trail.

## Rules that never change

- A count in a spec is a claim about the source, not a target; if the parse disagrees, report, do not bend.
- One duty, one line; prohibitions stay even for instruments not held; process duties for instruments not held are
  rejected; applicant-stage steps are history.
- Never invent facts about Molecule — unknowns are [PRANJAL] slots.
- Ponytail: shortest working diff, no new dependencies, verbatim regulatory text.

## Sources not yet collected

- AIF Regulations 2012, last amended 14 Jul 2026: sebi.gov.in …/jul-2026/…-_102975.html (PDF attachdocs/jul-2026/1785301664601.pdf) — parked with AIF
- PMS related-party circular 2022 (given/sources) — on purpose: MC 2025 ch 3.4–3.7 consolidates it.
