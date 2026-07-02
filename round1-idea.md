# Round-1 Idea Submission — SEBI TechSprint PS2 (Agentic Compliance)

_Copy-paste each block into the HackCulture form. Fields marked **[FILL]** need your input. Deadline: **Jul 12 2026, 23:59 IST.** Problem statement: **PS2 — Agentic Compliance.**_

---

## Registration form
- **Name of (Organization / Startup / University):** Project AISHA _(pre-incorporation; or use atrey.dev)_
- **Designation:** Founder & CEO
- **City:** **[FILL — your city]**
- **LinkedIn:** https://www.linkedin.com/in/anshumanatrey _(verify handle)_

---

## Team Members — Name & Organization  *(required)*
- **Anshuman Atrey** — Founder, Project AISHA · security engineer (purple-team) · AISHA (agentic AI cybersecurity) — **team lead**
- **[OPTIONAL] Gayatri Jaiswal** — Co-founder, Project AISHA _(keep if she's on this build; else delete — solo is allowed, teams are 1–5)_

---

## Brief description of the idea  *(required — the make-or-break field)*

**Poneglyph — an agentic compliance engine that turns a SEBI master circular into a living, auditable obligation register for market intermediaries.**

Today a stock broker's compliance team reads SEBI circulars by hand, tracks obligations circular-by-circular, and scrambles to prove fulfilment at audit time. Regulation lives as unstructured human text; operational compliance needs structured, machine-actionable, auditable rules. Poneglyph closes that gap end-to-end.

For one intermediary (a SEBI-registered **stock broker**) and corpus (SEBI's **Master Circular for Stock Brokers**), Poneglyph:
1. **Ingests** the circular; an LLM agent **extracts each obligation, grounded to the exact source clause**.
2. **Maps** every obligation to an operational control.
3. **Binds evidence** of fulfilment — and because the broker's obligations include SEBI's **cyber-security & system-audit** requirements, we pull that evidence **live from real security scans, not screenshots**.
4. **Flags gaps** and auto-generates **remediation tasks** with owners and SLAs.
5. On amendment, **diffs** the new circular against the prior version and **re-maps only what changed**.

Every node is traceable — a SEBI inspector can click any control and **walk back to the exact clause**, over a **tamper-evident audit trail** — an indestructible record of what was complied with, and when. Trust by design: the agent **proposes** each mapping; a **deterministic rules-as-code verifier checks it**, so outputs are explainable and non-hallucinated — the standard a regulator needs.

We are not starting from zero. We already operate an **agentic security-evidence engine (AISHA)** and a **compliance-report engine with a controls-matrix + audit-trail schema (redink)**, and we run **real VAPT audits**. For this TechSprint we reskin that working, auditable loop onto SEBI text — and we will **open-source the SEBI obligation ontology** and **publish a measured extraction-accuracy benchmark**.

---

## Proposed solution — business model / commercial potential  *(optional — do it)*

- **Who pays:** India's thousands of **small/mid stock brokers, RIAs and portfolio managers** who can't afford Big-4 / merchant-banker compliance but carry the same SEBI obligations. Compliance is non-optional and deadline-driven (e.g. the 2025 CSCRF rollout) — a forced-purchase market.
- **Model:** open-core SaaS. **Obligation ontology = open** (trust + standard-setting); **engine, live-evidence connectors, and audit vault = paid** per-intermediary subscription, priced an order of magnitude below manual compliance.
- **Expansion:** same manifest-driven engine scales across the SEBI rulebook (LODR, RA/IA, CSCRF, PMS) with **zero code change**, then to other Indian regulators (RBI, IRDAI). A module of the broader **AISHA** AI-cybersecurity platform → cross-sell.
- **Why now:** SEBI is actively pushing tech-enabled compliance + cyber-resilience; small intermediaries are under-served and under-resourced exactly as the PS describes.

---

## Technology stack details  *(optional — do it)*

- **Engine (Python):** redink's manifest-driven resolver + assembler (`recipe.py`, `assemble_docx.py`) reskinned circular→obligation→control; deterministic, no-LLM routing where possible.
- **Agent layer:** AISHA's provider-agnostic LLM abstraction (Claude / OpenAI / Gemini) + **ReAct reasoning engine** — produces an explainable, replayable decision trace per mapping.
- **NLP:** clause segmentation, **grounded** obligation extraction (citation + offset to source line), circular-to-circular diff for amendments.
- **Trust:** LLM proposes → **rules-as-code verifier** checks (Droit-style) → non-hallucinated outputs.
- **Evidence:** live pull via **MCP + AISHA scanners** (e.g. TLS/MFA/log-retention/VAPT status) bound to the obligation; artifacts timestamped + hashed.
- **Audit:** immutable, **hash-chained tamper-evident log**; clause-anchored evidence graph.
- **Data model:** redink per-finding schema + AISHA immutable Evidence/Finding dataclasses → obligation register.
- **UI:** Next.js 15 + React + Tailwind (AISHA-landing) — obligation register + gap heat-map; JSON/docx auditable report export.

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
 [Bind EVIDENCE]  ◄── live pull: AISHA scanners / MCP (TLS, MFA, logs, VAPT)
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
**[FILL — paste link after recording]** · Suggested 6-shot script:
1. (0:00–0:20) The pain: a broker's compliance analyst hand-tracking a SEBI circular.
2. (0:20–0:55) Ingest a **real** SEBI Stock-Broker master-circular page → agent extracts obligations, each linked to its clause.
3. (0:55–1:25) Map one cyber obligation → control → **pull live evidence from a real scan** (AISHA/vapt).
4. (1:25–1:55) Gap flagged → remediation task with SLA appears.
5. (1:55–2:35) **Amendment**: drop an updated circular → diff → only-changed obligation re-maps → new task.
6. (2:35–3:00) Click any control → **walk back to the exact clause** + tamper-evident log. Tagline + open-ontology promise.

---

## GitHub repository link  *(optional)*
**https://github.com/atrey-dev/poneglyph** — the build repo; also cite the backbone **`https://github.com/AnshumanAtrey/redink`** as proof the compliance-composition engine already exists.

---

## Idea deck outline  *(optional upload — 8 slides)*
1. Title — Poneglyph: agentic compliance for SEBI intermediaries.
2. Problem — regulation = text; compliance = manual, gap-prone (PS2, in SEBI's words).
3. Insight — nobody closes the **auditable loop on live SEBI text** (prior-art gap).
4. Solution — the closed loop diagram (above).
5. The wedge — security-compliance: real scan-evidence bound to obligations (AISHA + vapt).
6. Trust — agent-proposes / rules-verify + clause-anchored tamper-evident audit trail.
7. Not-from-zero — AISHA + redink + real VAPT = ~70% already built; open ontology + benchmark.
8. Impact + scale — India's small brokers; manifest-driven across the whole SEBI rulebook.
