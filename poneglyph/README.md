# Poneglyph — Agentic Compliance Sandbox

**From regulatory text to operational action.** A frontend sandbox of Poneglyph — Walrus Securitas' agentic compliance engine for SEBI market intermediaries — built for **SEBI Securities Market TechSprint PS2 (Agentic Compliance)**.

> ⚠ Sandbox: everything is explorable, nothing is actionable. All data is **realistic but simulated** (clause text is a paraphrase of public SEBI material, written for this demo). The tenant — *Walrus Securitas Broking Ltd* — is a fictional SEBI-registered stock broker. Sim-clock is pinned to **2026-07-12** so "SEBI amended Para 46 nine days ago" stays true forever.

## Run it

```sh
npm install
npm run dev        # http://localhost:3000
# or production:
npm run build && npm run start
```

## What's inside

One obligation graph, two windows — switch **Broker ↔ SEBI Inspector** from the profile menu at the bottom of the sidebar. The shell is a real-SaaS layout: grouped sidebar nav (Oversight / Compliance / Engine), breadcrumbs + route slug in the sticky header, tenant card, profile dropdown.

| Tab | What it shows |
|-----|---------------|
| **Overview** | Posture, CUSPA deadline runway, chapter heat-map, latest catches & runs |
| **Watchtower** | The scraper agent's poll log + every caught circular with clause-cited applicability verdicts |
| **Register** | All 33 obligations (23 Master Circular + 10 CUSPA delta), each expandable to clause → control → evidence → hash |
| **Amendments** | The hero: old vs new Para 46 clause-level redline (Jul 3, 2026 CUSPA circular), 10 re-mapped / 23 untouched |
| **Evidence** | 20 artifacts across 3 connectors: documents, data checks, live Walrus scans — hashed, historied |
| **Remediation** | 9 tasks chained task ← obligation ← clause, deadlines from the circular itself |
| **Agent Console** | Replayable ReAct traces per pipeline run; deterministic verifier checks; the human gate |
| **Audit Trail** | 40 hash-chained events + an in-browser "verify chain" walk |
| **MCP** | The register as 7 read-only MCP tools + scripted playground + inspector-scoped token for SEBI |
| **Inspector** | The SEBI-side read-only window — the walk-back, start to finish |

## Architecture stance (what the real product does)

New circular → new **job** through a fixed pipeline (`watch → applicability → extract → verify → human gate`), not a new free-roaming agent. LLM workers are ephemeral; the **typed obligation ontology** (`lib/schema.ts`) is the permanent thing; a deterministic verifier checks every agent proposal before it enters the register. The simulated data in `data/` implements that schema exactly.

## Repo map

- `lib/schema.ts` — the open SEBI obligation ontology (the schema **is** the product)
- `data/` — simulated corpus, register, evidence, runs, audit chain, MCP surface
- `app/` — one route per tab; `app/page.tsx` is the design exemplar
- `components/` + `app/globals.css` — the Walrus Securitas brand system (same tokens as the social graphics engine in walrus-hq)
- `DESIGN.md` — the build contract (brand rules, data contract, page specs)
