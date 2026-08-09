# Poneglyph

**From regulatory text to operational action.**
An agentic compliance engine that turns a SEBI master circular into a living, auditable obligation
register for one specific market intermediary.

Built for the **SEBI Securities Market TechSprint @ Global Fintech Fest 2026** — **Problem Statement 2,
Agentic Compliance**.

### ▶ Live demo — **[poneglyph.walrussecuritas.com](https://poneglyph.walrussecuritas.com)**

<sub>Fallback: [poneglyph.techgenie2050.workers.dev](https://poneglyph.techgenie2050.workers.dev) · the app lives in [`poneglyph/`](poneglyph/)</sub>

---

## The problem, in SEBI's framing

Regulation is written as **text for humans**; compliance systems need **structured, machine-checkable
rules**. Bridging that gap is the core unsolved problem. Two pains follow:

1. When SEBI issues or amends a rule, a human reads the PDF, decides whether it binds their firm, works
   out which processes it touches, and updates them — slowly, and differently from the firm next door.
2. Compliance teams must track every existing obligation, hold **proof** each is fulfilled, and produce
   an audit trail on inspection. Smaller intermediaries have the least capacity and the most gaps.

## The thesis

> **Two brokers holding the same licence do not owe the same things.**

Most tools stop at "circular → obligation table". That's the easy half, and it's the same table for
everyone. A firm's real obligations depend on what it **is**: its segments, its scale, its designations.

So Poneglyph doesn't start from a checklist — it starts from the **firm**. Onboarding builds an entity
profile from public filings; the profile decides which Parts of the rulebook bind; those Parts generate
the document requests. Change the profile and the register changes underneath you.

In the live demo: Angel One draws **26 document asks**. A same-licence peer without QSB status, margin
trading or an algo desk draws **22** — and the app shows you why, ask by ask.

## What it does

```
ONBOARD    resolve the firm from public filings; compute which Parts bind IT
WATCH      poll SEBI daily; catch every new circular
DECIDE     rule applicability — yes / no / partly, quoting the clause that decides
EXTRACT    pull each obligation, grounded to an exact paragraph and character span
VERIFY     deterministic checks (plain code, no AI) — citations resolve, deadlines parse
HUMAN GATE a named compliance officer signs before anything enters the register
EVIDENCE   bind proof: documents, data-checks against systems of record, live scans
GAP → TASK no proof ⇒ a gap ⇒ a task with an owner and the circular's own deadline
DIFF       on amendment, diff old vs new and re-map ONLY what changed
AUDIT      every action into a hash-chained, tamper-evident log
```

**One obligation graph, two windows.** The broker manages compliance through one; SEBI verifies through
a read-only **Inspector** view of the same data — plus an **MCP** surface so a regulator's own agents can
query compliance state directly instead of requesting screenshots.

## Real vs simulated — read this before judging the data

The demo tenant is **Angel One Limited**, a real, listed, SEBI-registered stock broker
(ISIN INE732I01021 · NSE: ANGELONE · BSE: 543235). Onboarding a real firm from its own public filings
*is* the argument, so the discipline around it is strict and visible on every screen:

| | |
|---|---|
| **Real**, and sourced in-app | Identity, listing, net worth ₹6,201.98 cr (FY2025-26 standalone, XBRL), revenue ₹5,054.07 cr, client base 3.86 crore (June 2026 business update), NSE market share 14.79% |
| **Derived**, and labelled derived | ~6.76 mn NSE active clients — 14.79% of NSE's 4.57 cr active base. An estimate, not a reported figure |
| **Simulated**, and labelled illustrative | Every element of compliance posture: obligation status, evidence, tasks, audit events, document contents, the onboarding narrative |

**No claim is made about Angel One's actual compliance.** No inspection finding, penalty or violation is
depicted. No registration number was invented — the public `INZ000161534` is held as *declared* until its
certificate is supplied, and every other registration is masked. The QSB designation is **computed** from
published parameters and marked *unconfirmed*, with a document request raised for the exchange's own
designation letter. The named compliance team is this sandbox's cast, not Angel One employees.

> The app is a **sandbox**: everything is explorable, nothing is actionable. Action controls fire a
> sandbox toast. The sim-clock is pinned to **2026-07-12**, so "SEBI amended Para 46 nine days ago"
> stays true.

## The taxonomy is the real one

Obligations are organised by the **ten Parts** of the *Master Circular for Stock Brokers*
(`SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2024/53`), with verbatim Part titles read from the circular itself —
see [`poneglyph/lib/domains.ts`](poneglyph/lib/domains.ts).

| Part | | Obligations |
|---|---|---|
| I | Registration of Stock Brokers | 3 |
| II | Supervision & Oversight *(system audit, QSB)* | 2 |
| III | Dealings with Client *(the largest Part)* | 19 |
| IV | Technology Related Provisions *(CSCRF, algo, DMA)* | 6 |
| V | Change in Status, Constitution, Control | 2 |
| VI | Foreign Accounts Tax Compliance Act | 1 |
| VII | Investor Grievance Redressal *(SCORES, ODR)* | 3 |
| VIII | Default Related Provisions | **0** — see below |
| IX | Miscellaneous *(outsourcing, books, upstreaming)* | 5 |
| X | Reporting Requirements | 2 |
| | | **43** |

**Part VIII shows zero deliberately.** Default provisions bind only upon a default event, so the engine
ruled the Part event-driven, excluded it, and filed the reason under a standing trigger watch. An
unexplained zero would be a hole; an explained one is the engine working. Two overlay frameworks —
**CSCRF** (Aug 2024, graded by entity size) and **QSB** (enhanced obligations for high-impact brokers) —
sit across the Parts and decide how heavily they land.

## Architecture stance

A new regulation is a **new job through a fixed pipeline**, not a new free-roaming agent. LLM workers are
ephemeral; the **typed obligation ontology** ([`lib/schema.ts`](poneglyph/lib/schema.ts)) is the permanent
thing; a **deterministic verifier** checks every agent proposal before it enters the register; a **human
signs**. Agents propose, code checks, a person is accountable — the only shape a regulator can audit.

Every obligation is **grounded**: `excerpt === paraText.slice(charStart, charEnd)` holds for all 43, so
clicking any control walks back to the exact characters of the circular it came from.

## Run it

```sh
cd poneglyph
npm install
npm run dev        # http://localhost:3000
```

`npm run build` produces a fully static export (`out/`) — there are no API routes, server actions,
dynamic segments or middleware, so the deployed artifact is plain files on Cloudflare's edge with no
server runtime. `npm run preview` serves that build locally. (`next start` does not apply to an export.)

Deploys are automatic: a push to `main` triggers a Cloudflare Workers build and redeploy.

## Repo layout

```
poneglyph/            the application — see poneglyph/README.md for the tab-by-tab tour
  lib/schema.ts       the open SEBI obligation ontology (the schema is the product)
  lib/domains.ts      the verified Parts I–X taxonomy, CSCRF and QSB
  data/               simulated corpus, register, evidence, documents, runs, audit chain
given/                the official event dossier — rules, timeline, judging, the 4 PS PDFs
  09-compliance-domains.md   verified SEBI domain research, read from the source circulars
DEMO-SCRIPT.txt       screen-by-screen demo script and crash course
PROJECT.md STRATEGY.md WIN-PLAN.md round1-idea.md   working notes from the build
```

## Status

Round 1 (idea) cleared. This repo is the **Round 2 prototype**: deployed, CI/CD wired, 43 obligations
across 9 of 10 Parts, real-entity onboarding, document vault, amendment diff, replayable agent traces,
hash-chained audit trail, and an MCP surface.
