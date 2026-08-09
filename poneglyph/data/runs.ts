import type { PipelineRun } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Agent pipeline runs — the glass box, chronological (RUN-041 → RUN-049).
   Every run is a deterministic pipeline over ephemeral agents: watcher →
   applicability → diff → extraction → verifier → human gate. The schema
   is permanent; the agents are not. Traces are ReAct-style and replayable;
   nothing enters the register without passing the verifier, and nothing
   with material judgement passes the human gate unsigned.
   RUN-047 is the CUSPA amendment re-map — the run this sandbox is built
   around. RUN-049 is the corpus-completion pass that closed the coverage
   deficit onboarding left behind.
   ══════════════════════════════════════════════════════════════════════ */

export const runs: PipelineRun[] = [
  /* ── RUN-041 — initial ingest of the Master Circular ────────────────── */
  {
    id: "RUN-041",
    trigger: "watchtower catch CATCH-001 — Master Circular for Stock Brokers",
    startedAt: "2025-06-18T06:04:11+05:30",
    durationSec: 387,
    status: "completed",
    steps: [
      {
        agent: "watcher",
        at: "2025-06-18T06:04:11+05:30",
        action: "Fetched SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2025/91 (Master Circular for Stock Brokers, 214 pp).",
        observation: "New master circular; supersedes MC-SB-2024 in full. Queued as corpus root MC-SB-2025.",
      },
      {
        agent: "applicability",
        at: "2025-06-18T06:04:38+05:30",
        thought:
          "Addressee line covers all recognised stock exchanges and stock brokers. Tenant holds stock-broker registration INZ000161534 and trading memberships on NSE and BSE — the entire instrument binds; no chapter is out of scope.",
        action: "match_addressee(tenant.registrations, circular.addressees)",
        observation: "Verdict: applies (confidence 0.99). All 9 chapters in scope for full extraction.",
      },
      {
        agent: "diff",
        at: "2025-06-18T06:05:02+05:30",
        action: "diff(MC-SB-2025, corpus) — no prior corpus root exists in this tenant.",
        observation: "Initial ingest: every chapter treated as added. No delta computation required.",
      },
      {
        agent: "extraction",
        at: "2025-06-18T06:05:31+05:30",
        thought:
          "Registration & governance chapter: paras 4.1, 5.2, 5.6 each state a discrete duty with its own evidence surface — net worth certification, compliance officer, director residency.",
        action: "extract_obligations(chapter=registration)",
        observation: "OBL-SB-001…003 drafted, each grounded to its paragraph with verbatim excerpt and char offsets.",
      },
      {
        agent: "extraction",
        at: "2025-06-18T06:06:14+05:30",
        thought:
          "Client-dealings chapter is the densest: segregation, upstreaming, running-account settlement, DDPI, KYC gate, nomination. Para 46 (unpaid securities / CUSA) also lands here as its own chapter key.",
        action: "extract_obligations(chapters=client-dealings, unpaid-securities)",
        observation: "OBL-SB-004…009 drafted. Para 46 CUSA duties folded into segregation controls at this ingest.",
      },
      {
        agent: "extraction",
        at: "2025-06-18T06:07:20+05:30",
        action: "extract_obligations(chapters=margin, supervision, grievance, books-records, advertisement, cyber)",
        observation:
          "OBL-SB-010…023 drafted: margin trio (52.1, 54.2, 55.1), internal audit + AP inspections, SCORES/charter/ODR, retention + contract notes, advertisement approval, CSCRF trio (101.1, 102.4, 103.2).",
      },
      {
        agent: "verifier",
        at: "2025-06-18T06:09:03+05:30",
        action: "run_checks(citations-resolve, deadlines-parse, applicability-match, schema-valid, hash-chain-append)",
        observation: "5/5 passed across 23 drafted obligations. 23 register entries hashed and appended.",
      },
      {
        agent: "human-gate",
        at: "2025-06-18T06:10:38+05:30",
        action: "Queued all 23 obligation mappings for compliance-officer review (initial ingest — full review required).",
        observation: "Priya Nair approved 23/23 on 2025-06-20; nomination coverage flagged for tracking, TSK-008 raised.",
      },
    ],
    verifierChecks: [
      { name: "citations-resolve", pass: true, note: "23/23 clause excerpts found verbatim at stated char offsets in MC-SB-2025." },
      { name: "deadlines-parse", pass: true, note: "All stated periodicities (half-yearly, daily, 30/90-day, annual) parsed to schedules." },
      { name: "applicability-match", pass: true, note: "All 23 obligations scoped stock-broker; consistent with tenant registration." },
      { name: "schema-valid", pass: true, note: "23/23 entries validate against the obligation ontology; no missing evidence specs." },
      { name: "hash-chain-append", pass: true, note: "Register hashes computed; audit chain extended without break." },
    ],
    outputs: {
      obligationsCreated: [
        "OBL-SB-001", "OBL-SB-002", "OBL-SB-003", "OBL-SB-004", "OBL-SB-005",
        "OBL-SB-006", "OBL-SB-007", "OBL-SB-008", "OBL-SB-009", "OBL-SB-010",
        "OBL-SB-011", "OBL-SB-012", "OBL-SB-013", "OBL-SB-014", "OBL-SB-015",
        "OBL-SB-016", "OBL-SB-017", "OBL-SB-018", "OBL-SB-019", "OBL-SB-020",
        "OBL-SB-021", "OBL-SB-022", "OBL-SB-023",
      ],
      obligationsUpdated: [],
      tasksCreated: ["TSK-008"],
    },
  },

  /* ── RUN-042 — scheduled evidence re-verification ───────────────────── */
  {
    id: "RUN-042",
    trigger: "manual re-verify — scheduled evidence refresh (compliance calendar, May)",
    startedAt: "2026-05-14T09:15:44+05:30",
    durationSec: 236,
    status: "completed",
    steps: [
      {
        agent: "verifier",
        at: "2026-05-14T09:15:44+05:30",
        action: "Re-ran connector checks on all data-check and live-scan evidence (backoffice-api, exchange-api, depository-api, kra-api, poneglyph-scan).",
        observation: "14 artifacts re-verified clean; 2 exceptions raised for review.",
      },
      {
        agent: "verifier",
        at: "2026-05-14T09:17:29+05:30",
        thought:
          "Poneglyph scan re-test on EV-015 shows 2 medium VAPT findings still open with re-validation due 2026-08-20 — OBL-SB-021 cannot stay 'met'. Nomination coverage on EV-019 reads 94.1% of active accounts — OBL-SB-009 requires every account covered.",
        action: "reclassify(OBL-SB-021 → at-risk, OBL-SB-009 → at-risk)",
        observation: "2 obligations moved to at-risk with fresh evidence hashes; re-verified events appended to EV-015 and EV-019 history.",
      },
      {
        agent: "human-gate",
        at: "2026-05-14T09:19:12+05:30",
        action: "Status downgrades notified to compliance officer (no approval required for evidence-driven reclassification).",
        observation: "Acknowledged by Priya Nair 2026-05-14.",
      },
    ],
    verifierChecks: [
      { name: "citations-resolve", pass: true, note: "No clause changes in scope; citations unchanged." },
      { name: "deadlines-parse", pass: true, note: "VAPT re-validation deadline 2026-08-20 parsed from CSCRF timeline." },
      { name: "applicability-match", pass: true, note: "No scope changes." },
      { name: "schema-valid", pass: true, note: "2 updated entries re-validated." },
      { name: "hash-chain-append", pass: true, note: "Evidence re-verified events hashed and chained." },
    ],
    outputs: {
      obligationsCreated: [],
      obligationsUpdated: ["OBL-SB-009", "OBL-SB-021"],
      tasksCreated: [],
    },
  },

  /* ── RUN-043 — daily poll, no-op ────────────────────────────────────── */
  {
    id: "RUN-043",
    trigger: "scheduled daily poll — sebi.gov.in",
    startedAt: "2026-06-01T06:00:03+05:30",
    durationSec: 47,
    status: "completed",
    steps: [
      {
        agent: "watcher",
        at: "2026-06-01T06:00:03+05:30",
        action: "Polled circulars, master circulars, regulations, press releases and consultation papers indexes.",
        observation: "0 new documents matching tenant registration scope since last poll. No pipeline triggered.",
      },
    ],
    verifierChecks: [],
    outputs: { obligationsCreated: [], obligationsUpdated: [], tasksCreated: [] },
  },

  /* ── RUN-044 — CSCRF clarification re-map (cyber chapter only) ──────── */
  {
    id: "RUN-044",
    trigger: "watchtower catch CATCH-002 — CSCRF clarifications, re-map at FY26-27 effectivity",
    startedAt: "2026-06-04T10:32:17+05:30",
    durationSec: 194,
    status: "completed",
    steps: [
      {
        agent: "applicability",
        at: "2026-06-04T10:32:17+05:30",
        thought:
          "Circular addresses all regulated entities but its operative text is confined to CSCRF matters — the cyber chapter. Tenant is self-certification category (not a QSB), so the recalibrated VAPT and re-validation timelines apply. Chapters outside cyber are untouched.",
        action: "scope_remap(chapters=[cyber])",
        observation: "Verdict: partial (confidence 0.87). Re-map limited to OBL-SB-021…023.",
      },
      {
        agent: "diff",
        at: "2026-06-04T10:33:02+05:30",
        action: "diff(CSCRF clarification, MC-SB-2025 paras 101.1, 102.4, 103.2)",
        observation:
          "No paragraph text replaced; clarification adjusts timelines and scope readings — VAPT closure re-validation reckoned from final report date, 6h incident clock from detection, 180d log retention includes cloud-hosted critical systems.",
      },
      {
        agent: "extraction",
        at: "2026-06-04T10:34:15+05:30",
        thought:
          "No new obligations — the three cyber entries absorb the clarified timelines. OBL-SB-021 gains a hard re-validation deadline of 2026-08-20 for the 2 open medium findings; a remediation task is needed to hit it.",
        action: "update_obligations(OBL-SB-021, OBL-SB-022, OBL-SB-023); create_task(VAPT re-test)",
        observation: "3 obligations updated in place; TSK-009 drafted against OBL-SB-021, owner Dev Khanna, due 2026-08-20.",
      },
      {
        agent: "verifier",
        at: "2026-06-04T10:35:08+05:30",
        action: "run_checks(citations-resolve, deadlines-parse, applicability-match, schema-valid, hash-chain-append)",
        observation: "5/5 passed on 3 updated entries and 1 new task.",
      },
      {
        agent: "human-gate",
        at: "2026-06-04T10:35:31+05:30",
        action: "Timeline-only updates queued for compliance-officer sign-off.",
        observation: "Approved by Priya Nair 2026-06-04.",
      },
    ],
    verifierChecks: [
      { name: "citations-resolve", pass: true, note: "Cyber-chapter citations unchanged and still resolve in MC-SB-2025." },
      { name: "deadlines-parse", pass: true, note: "Re-validation deadline 2026-08-20 and 6h/180d windows parsed." },
      { name: "applicability-match", pass: true, note: "Self-certification category confirmed against tenant profile (qsb: false)." },
      { name: "schema-valid", pass: true, note: "3 updates + TSK-009 validate." },
      { name: "hash-chain-append", pass: true, note: "Chain extended; prior hashes preserved." },
    ],
    outputs: {
      obligationsCreated: [],
      obligationsUpdated: ["OBL-SB-021", "OBL-SB-022", "OBL-SB-023"],
      tasksCreated: ["TSK-009"],
    },
  },

  /* ── RUN-045 — SB (Amendment) Regulations, 2026 pre-commencement ────── */
  {
    id: "RUN-045",
    trigger: "watchtower catch CATCH-003 — SB (Amendment) Regulations 2026, re-map ahead of Jul 1 commencement",
    startedAt: "2026-06-19T14:08:50+05:30",
    durationSec: 152,
    status: "completed",
    steps: [
      {
        agent: "applicability",
        at: "2026-06-19T14:08:50+05:30",
        thought:
          "Amendment to the parent SEBI (Stock Brokers) Regulations, 1992 — the regulation the tenant's certificate is issued under. Binds by definition; commencement clause fixes 2026-07-01, so the re-map runs before go-live.",
        action: "match_addressee(tenant.registrations, regulation.scope)",
        observation: "Verdict: applies (confidence 0.97). Operative changes confined to registration & governance chapter.",
      },
      {
        agent: "diff",
        at: "2026-06-19T14:09:21+05:30",
        action: "diff(amendment text, MC-SB-2025 paras 5.2, 5.6)",
        observation:
          "2 affected mappings: compliance-officer reporting line moves to the board (touches 5.2 framing); designated-director residency test moves to a rolling 12-month day-count (touches 5.6 framing).",
      },
      {
        agent: "extraction",
        at: "2026-06-19T14:10:04+05:30",
        action: "update_obligations(OBL-SB-002, OBL-SB-003)",
        observation:
          "Controls updated: CO charter re-pointed to board reporting; residency attestation switched to rolling 12-month day-count with same 182-day floor. No new obligations, no new tasks — existing evidence remains valid.",
      },
      {
        agent: "verifier",
        at: "2026-06-19T14:10:47+05:30",
        action: "run_checks(citations-resolve, deadlines-parse, applicability-match, schema-valid, hash-chain-append)",
        observation: "5/5 passed on 2 updated entries.",
      },
      {
        agent: "human-gate",
        at: "2026-06-19T14:11:10+05:30",
        action: "Updates queued for compliance-officer sign-off ahead of commencement.",
        observation: "Approved by Priya Nair 2026-06-20.",
      },
    ],
    verifierChecks: [
      { name: "citations-resolve", pass: true, note: "Updated framing traced to gazette notification No. SEBI/LAD-NRO/GN/2026/221." },
      { name: "deadlines-parse", pass: true, note: "Commencement 2026-07-01 parsed from the notification's commencement clause." },
      { name: "applicability-match", pass: true, note: "Parent-regulation scope matches tenant registration INZ000161534." },
      { name: "schema-valid", pass: true, note: "2 updates validate; controls and evidence specs intact." },
      { name: "hash-chain-append", pass: true, note: "Chain extended; both update events hashed." },
    ],
    outputs: {
      obligationsCreated: [],
      obligationsUpdated: ["OBL-SB-002", "OBL-SB-003"],
      tasksCreated: [],
    },
  },

  /* ── RUN-046 — daily poll, no-op ────────────────────────────────────── */
  {
    id: "RUN-046",
    trigger: "scheduled daily poll — sebi.gov.in",
    startedAt: "2026-07-02T06:00:02+05:30",
    durationSec: 43,
    status: "completed",
    steps: [
      {
        agent: "watcher",
        at: "2026-07-02T06:00:02+05:30",
        action: "Polled circulars, master circulars, regulations, press releases and consultation papers indexes.",
        observation: "0 new documents matching tenant registration scope since last poll. No pipeline triggered.",
      },
    ],
    verifierChecks: [],
    outputs: { obligationsCreated: [], obligationsUpdated: [], tasksCreated: [] },
  },

  /* ══ RUN-047 — the CUSPA amendment re-map (hero run) ═══════════════════
     Watcher caught the Jul 3 circular at 11:37; the pipeline ran end-to-end
     in just over five minutes and stopped, deliberately, at the human gate. */
  {
    id: "RUN-047",
    trigger: "watchtower catch CATCH-005 — CUSPA amendment to Para 46, Master Circular for Stock Brokers",
    startedAt: "2026-07-03T11:42:08+05:30",
    durationSec: 312,
    status: "awaiting-approval",
    steps: [
      {
        agent: "watcher",
        at: "2026-07-03T11:42:08+05:30",
        action:
          "Fetched circular HO/38/11/(9)2026-MIRSD-POD/I/15382/2026 — 'Handling of Clients' Unpaid Securities by Trading Members' (11 pp, issued 2026-07-03).",
        observation:
          "Document parses clean. Subject line names the Master Circular for Stock Brokers; operative paragraphs numbered 46.1–46.14. Registered in corpus as CIRC-CUSPA-2026 and handed to the applicability agent.",
      },
      {
        agent: "applicability",
        at: "2026-07-03T11:42:41+05:30",
        thought:
          "The addressee line reads 'all recognised stock exchanges and all trading members of stock exchanges'. The tenant holds stock-broker registration INZ000161534 and is a trading member of NSE and BSE — squarely in scope. The circular explicitly amends Para 46 of MC-SB-2025, the corpus root this register is extracted from, so this is not a new standalone duty set: it is a rewrite of ground the register already stands on.",
        action: "match_addressee(tenant.registrations, circular.addressees); locate_amended_text(MC-SB-2025)",
        observation:
          "Verdict: applies (confidence 0.99). Amended target resolved to MC-SB-2025 chapter 'unpaid-securities' (Para 46). Cited operative text: 'Every trading member shall open a separate demat account designated as the Client Unpaid Securities Pledgee Account (CUSPA), tagged as such with the depository'. All existing Para 46 mappings marked stale pending diff.",
      },
      {
        agent: "applicability",
        at: "2026-07-03T11:43:12+05:30",
        thought:
          "Materiality check before committing a full re-map: the mechanism changes from account-transfer (CUSA) to pledge-based (CUSPA). That is an operational rebuild — new demat account, auto-pledge at pay-out, client intimation, a five-trading-day window with day-six auto-release, daily reconciliation — not a renumbering. Phased effectivity in 46.14 means deadlines must be computed, not copied.",
        action: "classify_materiality(CIRC-CUSPA-2026)",
        observation: "Material amendment. Full diff-and-extract pipeline authorised for the unpaid-securities chapter.",
      },
      {
        agent: "diff",
        at: "2026-07-03T11:43:40+05:30",
        thought:
          "Align amendment paragraphs against MC-SB-2025 Para 46 (three existing paras: 46.1, 46.2, 46.3-prohibition). New text renumbers and extends the paragraph range to 46.14, so alignment is by subject matter, not by number alone.",
        action: "diff(CIRC-CUSPA-2026, MC-SB-2025.unpaid-securities)",
        observation:
          "10 changed blocks. Modified: 46.1 (CUSA account → tagged CUSPA pledgee account), 46.2 (transfer-or-dispose → transfer-then-auto-pledge, no client instruction), 46.9 (general third-party prohibition → explicit bank/NBFC prohibition including own funding). Added: 46.3 (email/SMS intimation with mandated fields), 46.4 (board policy, ≤5-trading-day window), 46.5 (invoke to unpaid extent or day-6 auto-release), 46.6 (extension by 6 p.m. day 5, max one week), 46.11 (daily reconciliation, records preserved), 46.12 (client agreements & T&C update), 46.14 (phased effectivity).",
      },
      {
        agent: "extraction",
        at: "2026-07-03T11:44:26+05:30",
        thought:
          "Blocks 46.1–46.3 carry the account and flow mechanics. Each is a discrete duty with its own evidence surface: a depository confirmation for the tagged account, a pledge-creation log reconciled to unpaid positions, and a notification dispatch log tied to pledge events.",
        action: "extract_obligations(blocks=[46.1, 46.2, 46.3])",
        observation:
          "OBL-SB-101 (open dedicated CUSPA pledgee account, one-time), OBL-SB-102 (auto-pledge unpaid securities on pay-out, ongoing), OBL-SB-103 (email/SMS intimation on pledge creation, event-driven) drafted, each grounded to its paragraph with verbatim excerpt and char offsets.",
      },
      {
        agent: "extraction",
        at: "2026-07-03T11:45:09+05:30",
        thought:
          "Blocks 46.4–46.6 and 46.9 carry the governance and prohibition duties. The board policy in 46.4 embeds a hard parameter — payment window capped at five trading days — which must be stated in the obligation, not buried in the control. 46.6 is permissive ('may request') but creates a real SOP duty with a 6 p.m. day-5 cutoff if ever exercised.",
        action: "extract_obligations(blocks=[46.4, 46.5, 46.6, 46.9])",
        observation:
          "OBL-SB-104 (board-approved unpaid-securities policy, ≤5-day window), OBL-SB-105 (day-6 auto-release of un-invoked pledges), OBL-SB-108 (extension requests by 6 p.m. day 5), OBL-SB-106 (no transfer of unpaid securities to banks/NBFCs) drafted.",
      },
      {
        agent: "extraction",
        at: "2026-07-03T11:45:52+05:30",
        thought:
          "46.11 is a daily periodic with a record-preservation tail. 46.12 and 46.14 are phase-2: T&C re-papering across 12,408 active clients, and the effectivity tracker itself — paras 46.1–46.11 bite three months after exchange operational guidelines (due within 30 days, so ~2026-08-02 → phase 1 ~2026-11-02); 46.12–46.14 bite six months from issuance → 2027-01-03.",
        action: "extract_obligations(blocks=[46.11, 46.12, 46.14]); compute_deadlines(46.14)",
        observation:
          "OBL-SB-107 (daily reconciliation of pledgeable value vs unpaid obligations), OBL-SB-110 (update client agreements & T&C), OBL-SB-109 (track phased effectivity) drafted. Deadlines pinned: phase 1 2026-11-02, phase 2 2027-01-03. Extraction complete: 10 obligations, OBL-SB-101…110; 7 remediation tasks drafted against the gaps (TSK-001…007).",
      },
      {
        agent: "verifier",
        at: "2026-07-03T11:46:31+05:30",
        action: "run_checks(citations-resolve, deadlines-parse, applicability-match, schema-valid, hash-chain-append) on 10 drafted obligations + 7 drafted tasks",
        observation: "5/5 checks passed. Zero corrections required; drafts sealed and hashed.",
      },
      {
        agent: "human-gate",
        at: "2026-07-03T11:47:05+05:30",
        thought:
          "Three of the ten mappings embed judgement the pipeline should not sign alone: OBL-SB-104 fixes a board-policy parameter, OBL-SB-106 restates a prohibition whose breach is an enforcement matter, OBL-SB-108 encodes a discretionary process as a standing SOP duty.",
        action: "queue_for_approval([OBL-SB-104, OBL-SB-106, OBL-SB-108], approver=Priya Nair); auto-approve remaining 7 per gate policy (mechanical mappings, verifier-clean)",
        observation:
          "7 mappings entered the register approved; 3 held at pending-review awaiting Priya Nair. Run parked at awaiting-approval — the register will not show these three as settled until a human signs.",
      },
    ],
    verifierChecks: [
      {
        name: "citations-resolve",
        pass: true,
        note: "10/10 clause excerpts found verbatim at stated char offsets in CIRC-CUSPA-2026; amended-target link to MC-SB-2025 Para 46 resolves.",
      },
      {
        name: "deadlines-parse",
        pass: true,
        note: "Phased effectivity in 46.14 computed: guidelines due 2026-08-02 (30d), phase 1 2026-11-02 (+3 mo), phase 2 2027-01-03 (6 mo from issuance). All 10 deadline fields consistent.",
      },
      {
        name: "applicability-match",
        pass: true,
        note: "All 10 obligations scoped stock-broker; addressee 'all trading members' matches tenant registration INZ000161534 (NSE, BSE).",
      },
      {
        name: "schema-valid",
        pass: true,
        note: "10/10 entries validate against the obligation ontology — clause refs, controls, evidence specs and owners all present.",
      },
      {
        name: "hash-chain-append",
        pass: true,
        note: "10 register hashes computed and appended to the audit chain; prior chain verified intact before append.",
      },
    ],
    outputs: {
      obligationsCreated: [
        "OBL-SB-101", "OBL-SB-102", "OBL-SB-103", "OBL-SB-104", "OBL-SB-105",
        "OBL-SB-106", "OBL-SB-107", "OBL-SB-108", "OBL-SB-109", "OBL-SB-110",
      ],
      obligationsUpdated: [],
      tasksCreated: ["TSK-001", "TSK-002", "TSK-003", "TSK-004", "TSK-005", "TSK-006", "TSK-007"],
    },
  },

  /* ── RUN-048 — daily poll, no-op (this morning) ─────────────────────── */
  {
    id: "RUN-048",
    trigger: "scheduled daily poll — sebi.gov.in",
    startedAt: "2026-07-12T06:00:04+05:30",
    durationSec: 41,
    status: "completed",
    steps: [
      {
        agent: "watcher",
        at: "2026-07-12T06:00:04+05:30",
        action: "Polled sebi.gov.in/legal/circulars — 2 documents indexed since last poll.",
        observation: "Both addressed to mutual funds / AMCs; no operative clause reaches a stock broker. Filed without action.",
      },
      {
        agent: "watcher",
        at: "2026-07-12T06:00:19+05:30",
        action: "Polled master circulars, regulations and gazette notifications indexes.",
        observation: "0 new documents since last poll.",
      },
      {
        agent: "watcher",
        at: "2026-07-12T06:00:31+05:30",
        action: "Polled press releases and consultation papers; re-checked CATCH-006 (retail algo consultation) for a final circular.",
        observation: "No final circular yet; comment window open until 2026-07-30. Monitor entry unchanged.",
      },
      {
        agent: "watcher",
        at: "2026-07-12T06:00:42+05:30",
        action: "Checked NSE/BSE circular feeds for CUSPA operational guidelines (expected by 2026-08-02).",
        observation: "Not yet issued. Phase-1 deadline projection for OBL-SB-101…107 unchanged at 2026-11-02. Poll complete — 0 catches, 0 runs triggered. Next poll 2026-07-13 06:00 IST.",
      },
    ],
    verifierChecks: [],
    outputs: { obligationsCreated: [], obligationsUpdated: [], tasksCreated: [] },
  },

  /* ══ RUN-049 — corpus-completion pass over the unextracted Parts ═══════
     Onboarding bound the scope; this run fills it. ONB-001 bound nine of
     the ten Parts, but the register only ever held entries extracted by
     RUN-041 — Parts V, VI and X held nothing at all, and Parts IV and IX
     were covered only in part. A bound Part with no extracted content is
     a coverage deficit, not a zero, and this run closes it. Part VIII is
     the one zero that stays: it is a determination, re-stated in trace. */
  {
    id: "RUN-049",
    trigger:
      "corpus-completion pass — Parts bound at onboarding ONB-001 that held no extracted content (IV, V, VI, IX, X)",
    startedAt: "2026-07-12T08:14:26+05:30",
    durationSec: 268,
    status: "awaiting-approval",
    steps: [
      {
        agent: "watcher",
        at: "2026-07-12T08:14:26+05:30",
        thought:
          "Onboarding session ONB-001 bound nine Parts on 2026-07-10, but the register it joined them to was extracted by RUN-041 — before that scope existed. Binding a Part and extracting it are two different acts, and the gap between them is invisible unless something goes looking for it.",
        action: "reconcile(corpus=MC-SB-2025, scope=ONB-001.boundParts, register)",
        observation:
          "Coverage deficit confirmed on 5 Parts. Empty: V (change in status, constitution, control), VI (FATCA), X (reporting requirements). Partial: IV covered only by the cyber chapter, IX only by advertisement and books-records. Parts I, II, III and VII fully covered by RUN-041. Scoped extraction pass opened.",
      },
      {
        agent: "applicability",
        at: "2026-07-12T08:14:51+05:30",
        thought:
          "No re-derivation of scope here — ONB-001 already bound these Parts against the confirmed profile with named triggers, and re-deciding them would make the onboarding determination meaningless. This run inherits that verdict and confines itself to extraction over the chapters those Parts roll up to.",
        action:
          "inherit_scope(ONB-001); select_chapters([technology → IV, change-control → V, fatca → VI, outsourcing → IX, reporting → X])",
        observation:
          "Verdict inherited: applies (ONB-001, nine Parts bound). 5 chapters selected, 13 paragraphs in scope. Cyber, advertisement and books-records left untouched — already extracted, and re-extraction would duplicate rather than complete.",
      },
      {
        agent: "applicability",
        at: "2026-07-12T08:15:14+05:30",
        thought:
          "Part VIII is the obvious remaining zero and the tempting one to fill. It must not be filled. Its default provisions bind only on a default event, and this profile carries no declared default — extracting them now would put obligations in the register that nothing on the profile triggers, which is manufacturing scope to make a table look complete.",
        action: "confirm_exclusion('VIII', source=ONB-001, mode='dormant-with-trigger-watch')",
        observation:
          "Part VIII NOT extracted. Exclusion re-affirmed as recorded at onboarding, with the standing trigger watch intact: any default-event signal on the exchange feed re-binds the Part and re-runs this extraction against it. Part VIII stays at zero by determination, not by omission.",
      },
      {
        agent: "extraction",
        at: "2026-07-12T08:15:47+05:30",
        thought:
          "Technology chapter (Part IV), paras 50.2, 57.3 and 62.1. Each carries a distinct evidence surface: a signed-and-delivered contract note archive, a gateway configuration probe, and an approval register per strategy. 50.2 also embeds a dated condition the clause states outright — the signing certificate must be valid at all times — so the certificate's own expiry becomes the obligation's deadline.",
        action: "extract_obligations(chapter=technology, paras=[50.2, 57.3, 62.1])",
        observation:
          "OBL-SB-024 (digitally signed ECNs with proof of delivery, at-risk — signing certificate lapses 2026-08-14, renewal unevidenced), OBL-SB-026 (pre-trade risk checks on DMA and smart order routing, met), OBL-SB-025 (exchange approval and unique identifier per algorithm, gap — no approval letters or strategy inventory on file) drafted. Part IV coverage 3 → 6.",
      },
      {
        agent: "extraction",
        at: "2026-07-12T08:16:29+05:30",
        thought:
          "Change-control (Part V) paras 66.1 and 67.2 are a prior-approval gate and a quarterly return — two duties, not one. FATCA (Part VI) paras 69.1 and 70.2 are one duty in two movements: registration under the IGA/MCAA is meaningless without the due diligence and reporting that follow it, and splitting them would produce an obligation nobody can evidence separately.",
        action:
          "extract_obligations(chapters=[change-control, fatca], paras=[66.1, 67.2, 69.1, 70.2])",
        observation:
          "OBL-SB-027 (prior approval before any change in control, event-driven — no evidence, nil-change attestation not yet on file), OBL-SB-028 (quarterly shareholding/directors/constitution return, met, next due 2026-10-15) drafted. OBL-SB-029 drafted from 69.1 with 70.2 folded into its scope as the reportable-account limb. Parts V 0 → 2, VI 0 → 1.",
      },
      {
        agent: "extraction",
        at: "2026-07-12T08:17:11+05:30",
        thought:
          "Outsourcing (Part IX) 82.1 and 84.1 are the two standing policy duties; 82.3 is the carve-out that gives 82.1 its teeth, so it belongs inside that obligation rather than beside it. Reporting (Part X) 93.1 and 93.4 are two filings. 93.6 is different in kind — it is a quality standard over every report in the Part, not a filing of its own. Folding it into both entries is a judgement about coverage, and a judgement is what the human gate is for.",
        action:
          "extract_obligations(chapters=[outsourcing, reporting], paras=[82.1, 82.3, 84.1, 93.1, 93.4, 93.6])",
        observation:
          "OBL-SB-030 (board-approved outsourcing policy and vendor register, 82.3 core-activity carve-out folded in, gap — no policy or register on file), OBL-SB-031 (conflicts of interest policy and client disclosure, met), OBL-SB-032 (Annexure-28 consolidated quarterly return, due 2026-10-15), OBL-SB-033 (annual system audit report, due 2026-09-30) drafted. 93.6 carried as a completeness-and-certification condition on both reporting entries, flagged for the gate. Parts IX 3 → 5, X 0 → 2. Extraction complete: 10 obligations, OBL-SB-024…033.",
      },
      {
        agent: "verifier",
        at: "2026-07-12T08:17:58+05:30",
        action:
          "run_checks(citations-resolve, deadlines-parse, applicability-match, schema-valid, hash-chain-append) on 10 drafted obligations",
        observation:
          "5/5 checks passed. Zero corrections required; drafts sealed and hashed. Register now 43 entries across 9 of the 10 Parts.",
      },
      {
        agent: "human-gate",
        at: "2026-07-12T08:18:34+05:30",
        thought:
          "Three of the ten carry judgement the pipeline should not sign alone. OBL-SB-027 turns a prior-approval gate into a standing nil-change attestation, which is a secretarial process decision. OBL-SB-032 and OBL-SB-033 both absorb para 93.6 as a condition rather than instantiating it — defensible, but it is the engine deciding what does not become an obligation, and that decision needs a human name on it.",
        action:
          "queue_for_approval([OBL-SB-027, OBL-SB-032, OBL-SB-033], approver=Priya Nair); auto-approve remaining 7 per gate policy (mechanical mappings, verifier-clean)",
        observation:
          "7 mappings entered the register approved on 2026-07-12; 3 held at pending-review awaiting Priya Nair. Two approved entries carry open posture — OBL-SB-025 and OBL-SB-030 as gaps, OBL-SB-024 as at-risk — and are queued for remediation intake; tasks are raised once the entries settle. Run parked at awaiting-approval.",
      },
    ],
    verifierChecks: [
      {
        name: "citations-resolve",
        pass: true,
        note: "10/10 clause excerpts found verbatim at their stated character offsets in MC-SB-2025; all 5 newly parsed chapters resolve against the same corpus root ingested by RUN-041.",
      },
      {
        name: "deadlines-parse",
        pass: true,
        note: "4 dated entries parsed: signing certificate expiry 2026-08-14 (OBL-SB-024), fifteen-days-from-quarter-end 2026-10-15 (OBL-SB-028, OBL-SB-032), 30 September cut-off 2026-09-30 (OBL-SB-033). The remaining 6 are ongoing or event-driven and carry no date by design.",
      },
      {
        name: "applicability-match",
        pass: true,
        note: "All 10 obligations scoped stock-broker and traced to a Part bound at ONB-001. Register now covers 9 of 10 Parts; Part VIII carries no entry by determination, with its trigger watch re-affirmed in this run.",
      },
      {
        name: "schema-valid",
        pass: true,
        note: "10/10 entries validate against the obligation ontology — clause refs, controls, evidence specs and owners all present. 3 entries carry no approver and are held at pending-review, as the gate intends.",
      },
      {
        name: "hash-chain-append",
        pass: true,
        note: "10 register hashes computed and appended; prior chain verified intact through AE-0040 before append.",
      },
    ],
    outputs: {
      obligationsCreated: [
        "OBL-SB-024", "OBL-SB-025", "OBL-SB-026", "OBL-SB-027", "OBL-SB-028",
        "OBL-SB-029", "OBL-SB-030", "OBL-SB-031", "OBL-SB-032", "OBL-SB-033",
      ],
      obligationsUpdated: [],
      tasksCreated: ["TSK-010", "TSK-011"],
    },
  },
];
