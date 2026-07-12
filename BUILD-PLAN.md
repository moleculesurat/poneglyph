# BUILD-PLAN — Poneglyph Sandbox (frontend-only demo)

_What we're building for PS2: a **frontend sandbox** of the Poneglyph agentic-compliance engine. No real backend — every screen runs on realistic simulated data. Everything is clickable / expandable / openable / redirectable, **nothing is actionable** (actions show a "sandbox" toast or play a simulation)._

## Frame

- **Product:** Poneglyph — by Walrus Securitas
- **Demo tenant (dummy company):** **Walrus Securitas Broking Ltd** — a fictionalized, "public" version of Walrus Securitas re-imagined as a SEBI-registered stock broker (SEBI reg no. INZ000XXXXXX, member NSE + BSE, non-QSB, ~12,000 clients — the exact "smaller intermediary" the PS names). Simulated facts seeded from walrus-hq (team, incorporation) + invented broker ops data.
- **Corpus:** Master Circular for Stock Brokers (Jun 17, 2025) + **Jul 3, 2026 CUSPA amendment** (hero diff scenario) + SB Regulations 2026 + CSCRF chapter (cyber evidence connector).
- **Stack:** Next.js (App Router) + typed simulated data — the JSON data files literally implement our open obligation schema, so the "schema" deliverable and the demo data are the same artifact.
- **Two windows, one graph:** persona toggle in the top bar — **Broker Compliance** view ↔ **SEBI Inspector** (read-only) view. Same data, different lens.

## Global chrome

- **Sandbox strip (always visible, very top):** thin mono uppercase bar — `SANDBOX ENVIRONMENT — REALISTIC SIMULATED DATA · NOTHING HERE IS ACTIONABLE` — ink bg, orange accent tick.
- **Brand system (from walrus-hq/graphic-designer):** white theme; ink `#141417`, orange `#fe5301` (single loud note); Aleo 300 serif display + Host Grotesk 600 accent spans with orange gradient text-clip; Azeret Mono uppercase labels w/ letterspacing; reticle corner ticks; dot-grid + warm wash + grain layers; marked-cards (plus-mark corners); hairlines (solid + dashed); CTA chips with `6px 6px 22px 6px` radius. Keep `brand.css` / `patterns.css` tokens verbatim — feed and product read as one brand.
- **Top bar:** walrus mark + `PONEGLYPH` wordmark · tenant chip (Walrus Securitas Broking Ltd · INZ000…) · persona toggle (Broker / Inspector) · sim-clock ("today: Jul 12 2026").

## Tabs (Broker window)

### 1 · Overview — "Command Deck"
- Compliance posture score (big serif number, gradient accent) + trend sparkline
- Obligations by status: met / gap / at-risk / pending-review (stat tiles)
- **Deadline timeline** — CUSPA phased deadlines rendered as a horizontal timeline (exchange guidelines ~Aug 2026 → +3mo tranche → +6mo tranche → Jan 3 2027)
- Gap heat-map by master-circular chapter
- Latest regulatory events feed (last 5) + agent activity ticker
- Everything clicks through to its tab

### 2 · Watchtower — the scraper tab (user-required)
- **Live scraper run:** terminal-style streaming log of the watcher agent polling sebi.gov.in (animated replay) — last poll time, next poll ETA, sources watched (circulars page, master circulars, press releases)
- **Latest catches list:** each fetched circular w/ timestamp, PDF badge, and the **applicability verdict** ("affects us? YES / NO / PARTIAL") with the agent's cited reasoning — expandable
- Hero item: `HO/38/11/(9)2026-MIRSD-POD/I/15382/2026 · Jul 3 2026 · Unpaid securities (CUSPA)` → APPLIES · triggered pipeline run #47
- Non-applicable example for contrast (e.g., an AMC-only circular → "NO — addressed to AMCs; we hold no AMC registration")

### 3 · Obligation Register — the core
- Filterable/sortable table: chapter · type (one-time / ongoing / periodic / event-driven) · status · owner · deadline
- Row expand: exact source clause text (para no. + char offset), mapped control, evidence spec, SLA, hash
- Click clause → **Clause Viewer**: the circular rendered with the clause highlighted (marker-highlight style), breadcrumbs (circular → chapter → para)
- ~22 obligations across: client-fund segregation, running account settlement, margin reporting, KYC/DDPI, grievance/SCORES, books & records, advertisement code, cyber/system audit
- "Pending review" rows show the **human-in-the-loop approval UI** (approve / reject / edit mapping — sandbox-disabled)

### 4 · Amendment Diff — the hero
- **Old Para 46 (Jun 2025) vs new Para 46 (Jul 3, 2026) side-by-side redline** (added/removed/changed, orange highlights)
- Delta-obligations extracted: ~10 new (CUSPA account, auto-pledge, email/SMS notify, 5-day cap, day-6 auto-release, daily reconciliation, 6PM extension window, bank/NBFC transfer prohibition…)
- "Re-mapped only what changed" visual: untouched obligations greyed, changed ones animated in
- Each delta → spawned remediation task with the real phased deadline
- Amendment history timeline (Aug 2024 MC → Jun 2025 MC → Jul 2026 amendment)

### 5 · Evidence Vault
- Evidence artifacts grid, 3 connector types:
  - **Document** — board resolution PDF, unpaid-securities policy doc (openable preview)
  - **Data check** — "CUSPA account exists at depository", "client SMS log day-of-pledge", "daily reconciliation report present"
  - **Live scan** — Walrus scan results bound to cyber-chapter obligations (TLS, MFA, log retention) — positioned as *one connector*, not the headline
- Each artifact: hash + timestamp + clause backlink + re-verification history (shows one re-test event)
- Gap state: obligation with **no** bound evidence → orange "GAP" chip → links to its remediation task

### 6 · Remediation
- Task queue (list + kanban toggle): task ← obligation ← clause chain visible on every card
- Owner, SLA (from the circular's real deadlines), status (open / in-progress / done / overdue)
- CUSPA tasks pre-populated: "Open CUSPA pledgee account", "Implement auto-pledge flow", "Client notification templates", "5-day policy update", "Daily reconciliation job"

### 7 · Agent Console — the glass box
- Every pipeline run listed: run #, trigger (scraper catch / manual / re-verify), agents involved, duration, verifier result
- **Replayable trace** per run: step-by-step ReAct-style log — applicability agent → extraction agent → deterministic verifier checks (citations resolve ✓, deadlines parse ✓, applicability matches registry ✓) → human approval gate
- "Why this mapping?" — the explainability answer for any obligation, one click from the register
- Architecture placard: *deterministic pipeline, ephemeral LLM workers, schema is the permanent thing* (the Norm-Ai/Anthropic pattern, stated proudly)

### 8 · Audit Trail
- Hash-chained event log: extraction, approval, evidence bind, status change, re-verification — each with `hash` + `prev_hash`
- **"Verify chain" button** — animates a full-chain verification pass (sandbox simulation)
- Filter by obligation → the inspector's walk-back: control → clause → evidence → every event that ever touched it

### 9 · MCP — "Connect your agent"
- MCP server card: endpoint, tool list (`get_obligations`, `check_compliance_status`, `explain_mapping`, `get_evidence`, `get_amendments`) with schemas
- Copy-paste config snippets (Claude Desktop / Claude Code / any MCP client)
- **Playground:** simulated chat — ask "are we CUSPA-compliant?" and watch the tool calls + responses render (scripted simulation)
- **"Share with SEBI":** generate an inspector-scoped read-only MCP token — the pitch that SEBI itself can audit agentically

### Inspector window (persona toggle — not a tab)
- Read-only recolored variant (inspector chrome badge): Register + Evidence + Audit Trail + MCP only
- Landing: "Inspection session — Walrus Securitas Broking Ltd" → click any control → walk back to exact clause + evidence + tamper-evident history
- Cross-firm teaser panel: "12 brokers on this ontology — comparable compliance, zero divergent interpretations" (the SupTech vision slide, in-product)

## Simulated data set (all realistic, all fake)

- 1 tenant (Walrus Securitas Broking Ltd), 4 team owners (compliance officer, ops head, CTO, CEO)
- 2 corpora versions (MC Jun 2025, MC + Jul 2026 amendment), ~22 base obligations + ~10 CUSPA delta
- ~15 evidence artifacts across 3 connector types, 3 open gaps, 8 remediation tasks
- ~6 scraper catches (mix of applies / not-applies), ~8 pipeline runs with traces
- ~40 audit-trail events, hash-chained
- Sim-clock pinned to Jul 2026 so "9 days ago" stays true forever

## Build order

1. Schema + simulated data files (the foundation — doubles as the open-source ontology deliverable)
2. App shell: brand system port, sandbox strip, top bar, persona toggle, tab nav
3. Register + Clause Viewer → 4. Amendment Diff → 5. Watchtower → 6. Overview → 7. Evidence Vault + Remediation → 8. Agent Console + Audit Trail → 9. MCP tab → 10. Inspector window polish

_Cut from the tail if time runs short — never the head._
