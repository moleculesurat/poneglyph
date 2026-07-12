# WIN-PLAN — 26 bullets to win SEBI TechSprint PS2 (Agentic Compliance)

_The full grouped plan, verbatim. Map + locked decisions live in [`STRATEGY.md`](STRATEGY.md); official facts in [`given/`](given/00-INDEX.md); submission draft in [`round1-idea.md`](round1-idea.md)._

## The wedge (positioning)
1. Do **not** ship a "circular → obligation table" RAG chatbot — that's table-stakes, incumbents already sell it, a SEBI jury has seen it. Dead on arrival.
2. Win on the one thing none of them demo: a **closed, regulator-grade auditable loop on LIVE SEBI text** — clause → control → evidence → gap → remediation, every node traceable.
3. Go **one persona deep**: a SEBI-registered **stockbroker** — literally the "smaller intermediary with limited compliance resources" the PS names.
4. Corpus = the PS's suggested **Master Circular for Stock Brokers** (on-brief), but make the **hero slice its cyber-security & system-audit obligations (CSCRF-linked)** — because that's *your* home turf.
5. This is the unfair edge: CSCRF **mandates VAPT/SOC/audit**, so your **Walrus Securitas scans + vapt findings ARE the evidence layer**. You bind real security evidence to real obligations *live* — no lawyer-built RegTech on that stage can.

## The hand (use the assets, don't rebuild)
6. **redink is the spine:** its controls-matrix (`Control ID · Status · Evidence Reference`) = the SEBI obligation register verbatim; per-finding audit fields = the audit trail; `certin` manifest = the India template. ~70% reskin, not rewrite.
7. **Walrus Securitas is the agentic runtime:** provider-agnostic LLM + **ReAct trace** gives you "agentic" *and* an explainable, replayable decision log (auditability) on day one — swap Finding→Obligation in the prompts.
8. **Walrus Securitas's scanners + MCP are your live-evidence puller:** point them at the broker's stack to fetch proof of a control ("TLS enforced", "MFA on", "logs retained ≥180d") instead of human screenshots — the live-evidence piece incumbents lack.
9. **vapt is your ledger + real demo data:** FINDINGS-TRACKER→REMEDIATION-MASTER→re-verify is a working obligation→evidence→tiered-SLA→gap lifecycle; the WALRUS array→report generator is already a "structured-object → auditable document" renderer.
10. **the dashboard app (Next.js) is your UI:** it already ships findings/evidence/history views — reskin to an obligation register + gap heat-map. No UI from scratch.

## The build (scope the demo — nothing more)
11. Hero flow: ingest one real CSCRF/SB clause → agent extracts obligation + maps to a broker control → pulls/links evidence → flags met/gap → spawns a remediation task w/ SLA → **every node links back to the exact clause line**.
12. Then the **diff loop** (PS2's hard, unsaturated half): feed an amended circular → auto-diff vs prior → re-map only changed obligations → spawn new gap tasks. Demo it **live on a real 2024→2025 SEBI update**. Almost nobody shows this.
13. **Trust architecture:** LLM-agent *proposes* the mapping; a **deterministic rules-as-code verifier checks it** (Droit-style). Kills the "can't trust an LLM with compliance" objection before the jury says it.
14. **Make the audit trail the product:** hash-chained, tamper-evident log; clause-anchored evidence (obligation ↔ artifact ↔ source line). Tagline: *"a SEBI inspector clicks any control and walks back to the exact circular line."*
15. **Tight corpus:** 1 master circular, ~15–25 obligations, 1 persona, 2–3 controls with live evidence. PS needs "≥1 concrete scenario" — over-deliver on depth, not breadth.

## Auditability (judge criterion #1, your moat)
16. Ground every obligation in its source clause with citation + offset — grounded extraction, but auditable end-to-end (no free-floating LLM claims).
17. Show **explainability**: replay Walrus Securitas's ReAct trace for any control = "why the agent mapped this clause here." Regulators love a glass box.
18. Show **ongoing, not one-shot**: timestamp+hash each evidence artifact and demo a re-verification event (vapt already does this — a fix got re-tested). Proves the "ongoing compliance management" half.

## The scrappy edge (scores with a govt jury)
19. **Open-source a "SEBI obligation ontology" + tiny eval set** (circular → obligations). ClauseMatch did this for ADGM and won credibility — it makes you the standard-setter, catnip for SEBI.
20. **Publish a measured number**: "X% obligation-extraction accuracy on N clauses vs human labels." Validate before you pitch (rigor) — no incumbent shows a SEBI-specific accuracy figure.
21. **Frame as public infra** for India's thousands of small brokers/RIAs priced out of Big-4 compliance → directly hits "alignment with SEBI's mandate" (investor protection via stronger intermediaries).
22. **Anchor to a live pain**: the CSCRF compliance scramble for small intermediaries (2025) — you're solving a problem the jury knows is real *right now*.

## Round-1 submission (Jul 12)
23. Lead the idea with the wedge in one line: *"security-compliance closed loop for a SEBI stockbroker, demoed on the Stock-Broker master circular's cyber obligations, where the evidence is real security scans."* Name corpus + persona; promise the diff→remediate loop.
24. Drop Walrus Securitas + vapt as instant credibility: *"we already run an agentic security-evidence engine and real VAPT audits — we're reskinning a working auditable loop to SEBI text, not starting from zero."*
25. Demo on **real data** (vapt WALRUS/findings reskinned to CSCRF clauses), record the optional **≤3-min video** even of a thin slice + GitHub link — an idea+video crushes an idea-only entry.
26. Pre-empt scale: show the same manifest-driven engine ingest a 2nd circular (LODR or RA/IA) **with zero code change** = scalable across SEBI's whole rulebook.

---

**One-line thesis:** _incumbents extract, checklists track — nobody closes the auditable loop on live SEBI text. You win by being the **security-compliance closed loop for a SEBI broker**, with real scan-evidence and a regulator-grade audit trail, reskinned from three things you already built._

---

## Reframe (Jul 12 discussion) — locked decisions

1. **PS2 is financial-regulatory compliance, NOT cyber compliance.** The Master Circular for Stock Brokers is ~90% conduct/operational/financial obligations (client-fund segregation, margin, KYC, grievances, reporting) and only ~10% cyber (CSCRF/system-audit chapter). Not labour-law stuff (washrooms/fire/ergonomics) — different regulators entirely.
2. **Therefore: de-center the cyber hero-slice.** Walrus's live-scan evidence covers only the cyber chapter; leaning the whole demo on it looks like we solved the one chapter that matched our existing product. Reposition cyber evidence as *one connector* (the most automated one); demo document/report/ledger-based evidence binding for the mainstream obligations.
3. **The engine transfers, the domain doesn't** — honest claim: same extract→map→evidence→audit-trail→diff loop we built for cyber, pointed at SEBI text.
4. **Primary user = the intermediary** (broker's compliance team) — the PS is written from their seat, both challenges. This is RegTech, not SupTech.
5. **But add an "Inspector View"** — read-only regulator portal on the same data (click control → walk back to clause → evidence → tamper-evident trail). Nearly free (same data, different lens), hits the judges directly, and answers the PS's "divergent interpretations" pain: shared open ontology = standardized, comparable compliance across firms.
6. **Pitch line:** *"One obligation graph, two windows — the broker manages compliance through one, SEBI verifies it through the other."*
