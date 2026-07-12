# STRATEGY — how we win SEBI TechSprint PS2 (Agentic Compliance)

_Derived from a cross-check of three real assets + online prior-art (2026-07-01). Our angle, not the official brief — that's in [`given/`](given/00-INDEX.md)._

## Product
**Poneglyph** — *an agentic compliance engine that turns a SEBI master circular into a living, auditable
obligation register for market intermediaries.* Named for One Piece's indestructible tablets that preserve
an unforgeable record of true history — precisely the product's core: **the tamper-evident audit trail**
(WIN-PLAN #14); reads clean to a regulator as *"an indestructible record of truth."* Under the **Walrus Securitas**
umbrella (fits the AI-cybersec SaaS thesis). **Repo: https://github.com/atrey-dev/poneglyph**

## The map — assets → PS2
| Asset | What it really is | PS2 role |
|---|---|---|
| **redink** (`AnshumanAtrey/redink`, + `security/redink`) | manifest→section(`required_by`/`inputs`)→**controls-matrix (Control ID · Status · Evidence Reference)**→per-finding audit fields→adversarial reviewer loop | **Backbone, ~70% lift-and-reskin.** framework→sections becomes circular→obligations→evidence→audit→gap. |
| **Walrus Securitas** (`~/Desktop/code/ventures/walrus-securitas`) | agentic engine: provider-agnostic LLM + **ReAct reasoning trace** + immutable Evidence/Finding model + rule-router + Next.js dashboard + MCP | **Runtime + live-evidence generator.** The auditable reason→act→evidence loop already runs. |
| **vapt** (`side-claude-income/vapt`) | real engagement: FINDINGS-TRACKER + REMEDIATION-MASTER (tiered SLAs) + WALRUS report from a structured finding-array + re-verify events | **Real demo data + proven obligation→evidence→remediation→re-verify ledger.** Domain proof. |

## Prior-art verdict (why the gap is real)
Global incumbents (Norm Ai, Droit, Regology, Ascent, Compliance.ai) **extract** obligations; Indian RegTech
is **KYC/AML + checklists** (Signzy, IDfy, EazeMax, Affinis); AxonFlow governs AI for SEBI brokers but
**does not translate circulars to rules**. **"SEBI circular → machine-actionable, auditable rules" is
unclaimed in India — nobody closes the loop on live SEBI text.** Academic methods exist (obligation
extraction, compliance-to-code, regulatory KGs) but no SEBI application + audit layer. That gap is the game.

## Decisions (locked — mine to make)
- **Persona:** one SEBI-registered **stock broker** (the PS's "smaller intermediary with limited compliance resources").
- **Corpus:** the PS-suggested **Master Circular for Stock Brokers** (on-brief), **hero slice = its cyber-security & system-audit obligations (CSCRF-linked)** — our home turf.
- **The wedge:** because those obligations mandate VAPT/SOC/audit, **Walrus Securitas scans + vapt findings ARE the evidence layer.** We bind *real security evidence to real obligations, live* — no lawyer-built RegTech on that stage can.
- **Trust architecture:** LLM-agent **proposes** the mapping; a **deterministic rules-as-code verifier checks it** → explainable, non-hallucinated (kills the "can't trust an LLM with compliance" objection).
- **Auditability is the product, not a feature:** hash-chained, tamper-evident log; clause-anchored evidence (obligation ↔ artifact ↔ source line). *"A SEBI inspector clicks any control and walks back to the exact circular line."*
- **Scope for the demo:** 1 circular, ~15–25 obligations, 1 persona, 2–3 controls with live evidence. PS needs "≥1 concrete scenario" — over-deliver on depth, not breadth.

## Build vs reuse (honesty — no overclaim)
- **Reuse (~70%):** redink's manifest→controls-matrix→audit schema; Walrus Securitas's LLM+ReAct+Evidence model+dashboard+MCP; vapt's ledger + WALRUS renderer + real data.
- **Net-new build:** SEBI circular **ingestion + clause-grounding + amendment-diff**; **live-evidence binding** from broker systems; **rules-as-code verifier**; the SEBI **obligation ontology**.
- **The hard, unsaturated half = the amendment diff→re-map→remediate loop.** That's where we out-demo incumbents (they show static extraction).

## The 26-bullet plan
Full grouped plan → [`WIN-PLAN.md`](WIN-PLAN.md). The load-bearing five:
1. **Not** a circular→table RAG chatbot (table-stakes, DOA). **Closed auditable loop on live SEBI text.**
2. Go **one broker deep**, on the **stock-broker master circular's cyber obligations** (our edge).
3. **Real scan-evidence** bound to obligations (Walrus Securitas + vapt) — the thing no incumbent can demo.
4. **Amendment diff loop** live on a real 2024→2025 SEBI update (PS2's hard half).
5. **Agent-proposes / rules-verify** + **clause-anchored tamper-evident audit trail** (judge criterion #1).

## Scrappy edge (scores with a govt jury)
- **Open-source the SEBI obligation ontology + a tiny ground-truth eval set** (ClauseMatch did this for ADGM → credibility + standard-setter).
- **Publish a measured extraction-accuracy number** (rigor; validate before we pitch — no incumbent shows a SEBI-specific figure).
- **Frame as public infra** for India's thousands of small brokers/RIAs priced out of Big-4 compliance → hits "alignment with SEBI's mandate."

## One-line thesis
_Incumbents extract, checklists track — nobody closes the auditable loop on live SEBI text. We win as the
**security-compliance closed loop for a SEBI broker**, with real scan-evidence and a regulator-grade audit
trail, reskinned from three things we already built._

→ Round-1 submission draft: [`round1-idea.md`](round1-idea.md).
