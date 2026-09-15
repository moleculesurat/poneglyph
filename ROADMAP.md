# Molecule Compliance — roadmap

One register, one gate, one evidence path. Every duty points to the exact sentence SEBI wrote; nothing enters the
register until a named person at Molecule signs it; what we cannot prove shows as a gap. Register.json in git is
the truth; the running app (Node + sqlite, `npm run serve`) is the working copy.

We work module by module: pick the module, plan it in the session, cut tasks one at a time, implement, close it.

## Modules

| # | Module | What it is | Status (2026-09-15) |
|---|--------|------------|---------------------|
| 0 | Profile | who Molecule is; capacities, facts with provenance, officers | facts in; officer names are placeholders |
| 1 | PMS register | duties from the PMS Master Circular 2025 + PM Regulations 2020, gate, evidence, schedule | DONE: 286 approved, both sources fully extracted, 284 document asks derived |
| 2 | Runtime | one Node process: API + static site + hourly watch poll, sqlite state | DONE on the laptop (task 31a); AWS Fargate port parked |
| 3 | PMS for operations | the surface the ops team uses daily, on Pranjal's laptop | **CURRENT** |
| 4 | Watchtower | polls 7 SEBI/APMI sources, triages catches; catch -> work item | polling works; work item is manual |
| 5 | AIF | onboarding tracks per category; rules tabs Cat I/II/III; AIF Regulations 2012 collect | not started; 46 post-registration duties already in the register |
| 6 | Ask (MCP) | Claude as a client of the register: read tools, then write tools behind the gate | not started |
| 7 | Inspection | read-only view of the register + audit chain for SEBI | exists, untested on real data |
| 8 | Deployment | ECS Fargate behind the shared ALB, EFS state, GitHub Actions deploy | parked by Pranjal (laptop first) |

## Module 3 — PMS for operations (current)

What ops does: see what is due -> do the duty -> attach the proof (signed with their name, gate token) -> the gap
closes; read the watchtower list weekly; open the inspector view for SEBI.

Done looks like: an ops person opens the LAN URL, sees the PMS duties due this month with dates, attaches a proof
and watches the gap close; nothing on any page is a placeholder, a demo, or an AIF duty counted as a gap.

Steps, one task each:
1. One surface — delete the demo shell (persona toggle, sandbox strip, entry gate, empty pages, dead buttons).
2. AIF rows as reference — greyed, out of every count, until the aif-status fact says registered.
3. Attach from the vault — "Supply this document" posts to the evidence API; one document to many duties in one go.
4. Fresh every morning — `npm run refresh` (pull -> build -> commit) and launchd (serve at login, refresh daily).
5. OPS.md — the runbook for the ops team.

Pranjal's inputs for this module: officer names + appointment dates; what document evidences the ongoing
prohibitions (for step 3); who holds the gate token; the laptop's LAN address.

## Order after module 3

Watchtower work item (4) -> AIF (5: profile stage facts, Regulations collect, onboarding Cat II first, rules tabs)
-> Ask (6) -> Inspection on real data (7) -> Deployment (8) when Pranjal says so.

## Sources not yet collected

- AIF Regulations 2012, last amended 14 Jul 2026: sebi.gov.in …/jul-2026/…-_102975.html (PDF attachdocs/jul-2026/1785301664601.pdf)
- PMS related-party circular 2022 (given/sources) — on purpose: MC 2025 ch 3.4–3.7 consolidates it.

## Rules that never change

- A count in a spec is a claim about the source, not a target; if the parse disagrees, report, do not bend.
- One duty, one line; prohibitions stay in the register even for instruments not held; active process duties for
  instruments not held are rejected; applicant-stage steps are history.
- Never invent facts about Molecule — unknowns are [PRANJAL] slots.
- Ponytail: shortest working diff, no new dependencies, verbatim regulatory text.
