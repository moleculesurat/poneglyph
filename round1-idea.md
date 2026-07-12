# Round-1 Idea Submission — SEBI TechSprint PS2 (Agentic Compliance)

_Copy-paste each block into the HackCulture form. Fields marked **[FILL]** need your input. Deadline: **Jul 12 2026, 23:59 IST.** Problem statement: **PS2 — Agentic Compliance.**_

---

## Registration form
- **Name of (Organization / Startup / University):** Walrus Securitas _(pre-incorporation; or use atrey.dev)_
- **Designation:** Founder & CEO
- **City:** **[FILL — your city]**
- **LinkedIn:** https://www.linkedin.com/in/anshumanatrey _(verify handle)_

---

## Team Members — Name & Organization  *(required)*
- **Anshuman Atrey** — Founder, Walrus Securitas · security engineer (purple-team) · Walrus Securitas (agentic AI cybersecurity) — **team lead**
- **[OPTIONAL] Gayatri Jaiswal** — Co-founder, Walrus Securitas _(keep if she's on this build; else delete — solo is allowed, teams are 1–5)_

---

## Brief description of the idea  *(required — the make-or-break field)*

**Poneglyph — an agentic compliance engine that turns a SEBI master circular into a living, auditable obligation register for market intermediaries.**

Today a stock broker's compliance team reads SEBI circulars by hand, tracks obligations circular-by-circular, and scrambles to prove fulfilment at audit time. Regulation lives as unstructured human text; operational compliance needs structured, machine-actionable, auditable rules. Poneglyph closes that gap end-to-end.

For one intermediary (a SEBI-registered **stock broker**) and corpus (SEBI's **Master Circular for Stock Brokers**), Poneglyph:
1. **Watches** SEBI's website; a scraper agent catches every new circular and an **applicability agent rules whether it binds this intermediary — with clause-level cited reasoning**.
2. **Extracts** each obligation, **grounded to the exact source clause** (citation + character offset), and **maps** it to an operational control.
3. **Binds evidence** of fulfilment through three connector types: **documents** (board resolutions, audit reports), **data checks** against systems of record (exchange/depository/KRA APIs — margin acks, segregation reports, SCORES aging), and **live security scans** for the cyber-security & system-audit chapter (real scans, not screenshots).
4. **Flags gaps** and auto-generates **remediation tasks** with owners and SLAs taken from the circular's own deadlines.
5. On amendment, **diffs** the new circular against the prior version and **re-maps only what changed** — a real scenario: SEBI's **Jul 3, 2026 amendment to Para 46** (pledge-based CUSPA regime for unpaid securities) lands as a clause-level redline, 10 new obligations, and a task queue with the actual phased deadlines.

**One obligation graph, two windows.** The broker's compliance team manages obligations through one; SEBI verifies through the other — a read-only **Inspector View** where any control walks back to the exact clause, its evidence, and a **hash-chained tamper-evident audit trail**. The same register is exposed over **MCP**, so SEBI can query a firm's compliance state agentically ("are you CUSPA-compliant?") instead of requesting screenshots. Trust by design: agents **propose**, a **deterministic rules-as-code verifier checks**, and a **human compliance officer signs** — the Norm-AI/Anthropic pattern, built for a regulator.

We are not starting from zero — **a working sandbox already exists** (obligation register, amendment diff, evidence vault, agent traces, audit chain, MCP surface, inspector view, on realistic simulated data). We already operate an **agentic security-evidence engine (Walrus Securitas)** and a **compliance-report engine with a controls-matrix + audit-trail schema (redink)**, and we run **real VAPT audits**. We will **open-source the SEBI obligation ontology** and **publish a measured extraction-accuracy benchmark**.

---

## Proposed solution — business model / commercial potential  *(optional — do it)*

- **Who pays:** India's thousands of **small/mid stock brokers, RIAs and portfolio managers** who can't afford Big-4 / merchant-banker compliance but carry the same SEBI obligations. Compliance is non-optional and deadline-driven (e.g. the 2025 CSCRF rollout) — a forced-purchase market.
- **Model:** open-core SaaS. **Obligation ontology = open** (trust + standard-setting); **engine, live-evidence connectors, and audit vault = paid** per-intermediary subscription, priced an order of magnitude below manual compliance.
- **Expansion:** same manifest-driven engine scales across the SEBI rulebook (LODR, RA/IA, CSCRF, PMS) with **zero code change**, then to other Indian regulators (RBI, IRDAI). A module of the broader **Walrus Securitas** AI-cybersecurity platform → cross-sell.
- **Why now:** SEBI is actively pushing tech-enabled compliance + cyber-resilience; small intermediaries are under-served and under-resourced exactly as the PS describes.

---

## Technology stack details  *(optional — do it)*

- **Engine (Python):** redink's manifest-driven resolver + assembler (`recipe.py`, `assemble_docx.py`) reskinned circular→obligation→control; deterministic, no-LLM routing where possible.
- **Agent layer:** Walrus Securitas's provider-agnostic LLM abstraction (Claude / OpenAI / Gemini) + **ReAct reasoning engine** — produces an explainable, replayable decision trace per mapping.
- **NLP:** clause segmentation, **grounded** obligation extraction (citation + offset to source line), circular-to-circular diff for amendments.
- **Trust:** LLM proposes → **rules-as-code verifier** checks (Droit-style) → non-hallucinated outputs.
- **Evidence:** three connector classes — document vault, data checks against systems of record (exchange/depository/KRA APIs), and live scans via **Walrus Securitas scanners** for the cyber chapter; artifacts timestamped + hashed.
- **Audit:** immutable, **hash-chained tamper-evident log**; clause-anchored evidence graph.
- **Data model:** an open, typed **SEBI obligation ontology** (obligation ⇄ clause ⇄ control ⇄ evidence ⇄ task) — redink per-finding schema + Walrus Securitas immutable Evidence/Finding dataclasses evolved into the register.
- **Agent-to-agent surface:** an **MCP server** over the register (`get_obligations`, `check_compliance_status`, `explain_mapping`, …) — broker-scoped for the firm, read-only inspector-scoped token for SEBI.
- **UI:** Next.js 16 + React — obligation register, amendment redline, gap heat-map, evidence vault, replayable agent traces, audit chain, and a read-only **SEBI Inspector View** (working sandbox already built).

---

## Process flow / architecture  *(optional — do it)*

```
 SEBI circular (PDF)
      │  ingest + clause-segment
      ▼
 [Agent: extract obligation]───grounded to source clause (citation+offset)
      │
      ▼
 [Agent: map obligation → operational control]
      │           ▲
      │   rules-as-code VERIFIER (deterministic check; reject hallucinations)
      ▼
 [Bind EVIDENCE]  ◄── live pull: Walrus Securitas scanners / MCP (TLS, MFA, logs, VAPT)
      │                     + vapt findings ledger
      ▼
 [Gap check] ── met ─► audit trail entry (hash-chained)
      │
      └─ gap ─► [Remediation task: owner + SLA] ─► re-verify loop

 AMENDMENT PATH:  new circular ─► diff vs prior ─► re-map only changed obligations ─► new gap tasks
 EVERYWHERE:      every node ⇄ exact source clause  (inspector clicks control → walks back to the line)
```

---

## Demo video link (≤3 min)  *(optional — record even a thin slice; idea+video >> idea-only)*
**[FILL — paste link after recording]** · Suggested 6-shot script (record straight from the sandbox):
1. (0:00–0:20) The pain: a broker's compliance analyst hand-tracking a SEBI circular. Cut to the Overview: "SEBI amended Para 46 nine days ago — the register already moved."
2. (0:20–0:55) **Watchtower**: the scraper catches the Jul 3 CUSPA circular → applicability agent rules "applies," clause-cited (show the contrast catch that was ruled not-applicable).
3. (0:55–1:35) **Amendment diff**: old Para 46 vs new, clause-level redline → 10 obligations re-mapped, 23 untouched → tasks spawn with the circular's own phased deadlines.
4. (1:35–2:05) **Evidence vault**: document + data-check + live-scan connectors; a gap obligation with no evidence → its remediation task.
5. (2:05–2:35) **Agent console**: replay RUN-047 step-by-step (thought/action/observation) → 5/5 verifier checks → held at the human gate.
6. (2:35–3:00) **Toggle to SEBI Inspector view**: click a control → walk back to the exact clause → hash-chained audit trail → "verify chain: intact." Tagline + open-ontology promise + MCP ("SEBI can ask the register questions").

---

## GitHub repository link  *(optional)*
**https://github.com/atrey-dev/poneglyph** — the build repo; also cite the backbone **`https://github.com/AnshumanAtrey/redink`** as proof the compliance-composition engine already exists.

---

## Idea deck outline  *(optional upload — 8 slides)*
1. Title — Poneglyph: agentic compliance for SEBI intermediaries. "From regulatory text to operational action."
2. Problem — regulation = text; compliance = manual, gap-prone (PS2, in SEBI's words).
3. Insight — nobody closes the **auditable loop on live SEBI text** (prior-art gap).
4. Solution — the closed loop diagram (above) + the real scenario: the Jul 3, 2026 CUSPA amendment, diffed and re-mapped.
5. The wedge — **one obligation graph, two windows**: broker manages, SEBI verifies (Inspector View + inspector-scoped MCP). Evidence connectors incl. live security scans.
6. Trust — agent-proposes / rules-verify / human-signs + clause-anchored tamper-evident audit trail (replayable agent traces).
7. Not-from-zero — working sandbox built + Walrus Securitas + redink + real VAPT; open ontology + benchmark.
8. Impact + scale — India's small brokers; same engine across the whole SEBI rulebook (LODR, RA/IA, PMS) → RBI/IRDAI.
