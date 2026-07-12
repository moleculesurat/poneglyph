import type { EvidenceArtifact } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   The evidence vault — simulated artifacts bound to the obligation
   register (data/obligations.ts). Three kinds:
     document   — uploaded artifacts (connector: manual-upload)
     data-check — connector-run queries against live systems of record
     live-scan  — Walrus scan engine probes (connector: walrus-scan)
   Every artifact is content-hashed and carries its own history timeline.
   All facts fictional; sim "today" = 2026-07-12.
   ══════════════════════════════════════════════════════════════════════ */

export const evidence: EvidenceArtifact[] = [
  /* ── Documents ─────────────────────────────────────────────────────── */
  {
    id: "EV-001",
    kind: "document",
    title: "Net worth certificate — H2 FY26 (Oct 2025 – Mar 2026)",
    description:
      "CA-certified net worth certificate for the half-year ended 31 Mar 2026, computed per the L.C. Gupta method, with NSE and BSE portal acknowledgement receipts appended.",
    connector: "manual-upload",
    obligationIds: ["OBL-SB-001"],
    capturedAt: "2026-04-21T11:42:00+05:30",
    hash: "a3f19c04be72",
    history: [
      { at: "2026-04-21T11:42:00+05:30", event: "captured", hash: "a3f19c04be72" },
      { at: "2026-04-21T11:47:00+05:30", event: "bound to OBL-SB-001", hash: "a3f19c04be72" },
    ],
    detail: {
      docPages: 6,
      docExcerpt:
        "…we certify that the net worth of Walrus Securitas Broking Ltd (SEBI Reg. No. INZ000247319) as on 31 March 2026, computed in accordance with the method prescribed by the Dr. L.C. Gupta Committee, stands at ₹9.84 crore, which exceeds the minimum net worth prescribed for a stock broker with the firm's activity profile. Acknowledgement: NSE ENIT ref NW/2026/H2/48291, filed 20-Apr-2026; BSE ref BEFS-NW-26-11374, filed 20-Apr-2026.",
    },
  },
  {
    id: "EV-002",
    kind: "document",
    title: "Compliance officer appointment — board resolution & intimation",
    description:
      "Certified true copy of the board resolution appointing Priya Nair as Compliance Officer, together with the intimation letters filed with NSE and BSE and her NISM-Series-III-A certification record.",
    connector: "manual-upload",
    obligationIds: ["OBL-SB-002"],
    capturedAt: "2026-04-09T15:18:00+05:30",
    hash: "7d02e5b1c9a4",
    history: [
      { at: "2026-04-09T15:18:00+05:30", event: "captured", hash: "7d02e5b1c9a4" },
      { at: "2026-04-09T15:23:00+05:30", event: "bound to OBL-SB-002", hash: "7d02e5b1c9a4" },
    ],
    detail: {
      docPages: 4,
      docExcerpt:
        "RESOLVED THAT Ms. Priya Nair, holding a valid NISM-Series-III-A (Securities Intermediaries Compliance) certification (cert. no. NISM-201234-IIIA, valid to 14-Aug-2027), be and is hereby appointed as the Compliance Officer of the Company with effect from 1 April 2026, and that the Company Secretary be authorised to intimate the appointment to the stock exchanges within the prescribed period. Intimation acknowledged: NSE ref MEM/CO/2026/3312 dt. 03-Apr-2026; BSE ref DCS/CO/26/0987 dt. 03-Apr-2026.",
    },
  },
  {
    id: "EV-007",
    kind: "document",
    title: "DDPI migration completion report",
    description:
      "Closure report on migration of all client authorisations from Power of Attorney to Demat Debit and Pledge Instruction, with CDSL confirmation that zero PoA-based debits remain enabled.",
    connector: "manual-upload",
    obligationIds: ["OBL-SB-007"],
    capturedAt: "2026-05-06T10:05:00+05:30",
    hash: "e84b7f20d13c",
    history: [
      { at: "2026-05-06T10:05:00+05:30", event: "captured", hash: "e84b7f20d13c" },
      { at: "2026-05-06T10:09:00+05:30", event: "bound to OBL-SB-007", hash: "e84b7f20d13c" },
    ],
    detail: {
      docPages: 9,
      docExcerpt:
        "Migration summary as on 30-Apr-2026: 12,408 active demat accounts reviewed; 11,893 accounts operate on executed DDPI mandates; 515 accounts hold no debit authorisation (client-initiated delivery only). PoA-based debit instructions enabled: 0. Depository confirmation: CDSL letter DP/OPS/2026/1147 dt. 02-May-2026 confirms no live PoA mapping against DP ID 12088700.",
    },
  },
  {
    id: "EV-011",
    kind: "document",
    title: "Internal audit report H2 FY26 + branch/AP inspection pack",
    description:
      "Half-yearly internal audit report (Oct 2025 – Mar 2026) by M/s Kelkar & Rao LLP with board-review minute and exchange filing receipt, bundled with the FY26 branch and authorised-person inspection reports.",
    connector: "manual-upload",
    obligationIds: ["OBL-SB-013", "OBL-SB-014"],
    capturedAt: "2026-05-28T17:31:00+05:30",
    hash: "50c9ad3e6f18",
    history: [
      { at: "2026-05-28T17:31:00+05:30", event: "captured", hash: "50c9ad3e6f18" },
      { at: "2026-05-28T17:36:00+05:30", event: "bound to OBL-SB-013, OBL-SB-014", hash: "50c9ad3e6f18" },
    ],
    detail: {
      docPages: 34,
      docExcerpt:
        "Internal audit for the half-year ended 31-Mar-2026: 4 observations (all minor), 0 major non-conformities; all observations closed by 15-May-2026 with evidence annexed. Report placed before the Board on 22-May-2026 (minute 7.3) and filed on NSE ENIT (ref IA/2026/H2/2210) and BSE BEFS (ref IA-26-0841). Inspection annexure: 2 of 2 branches and 9 of 9 authorised persons inspected in FY26; 3 advisory findings, none rising to escalation threshold.",
    },
  },
  {
    id: "EV-013",
    kind: "document",
    title: "ODR portal enrolment confirmation",
    description:
      "Enrolment confirmation on the SMART ODR portal, including the market-participant identifier allotted to the firm and a snapshot of the website disclosure linking clients to the portal.",
    connector: "manual-upload",
    obligationIds: ["OBL-SB-017"],
    capturedAt: "2026-04-14T12:57:00+05:30",
    hash: "b6e83a91f245",
    history: [
      { at: "2026-04-14T12:57:00+05:30", event: "captured", hash: "b6e83a91f245" },
      { at: "2026-04-14T13:01:00+05:30", event: "bound to OBL-SB-017", hash: "b6e83a91f245" },
    ],
    detail: {
      docPages: 3,
      docExcerpt:
        "This is to confirm that Walrus Securitas Broking Ltd (SEBI Reg. No. INZ000247319) is enrolled on the SMART ODR portal as a market participant with identifier MP-STK-08834, effective 10-Apr-2026. Dispute references initiated against the participant will be routed to the registered escalation contact (compliance@walrussecuritas.com). Website disclosure verified: ODR link published on the investor-grievance page with the prescribed text.",
    },
  },
  {
    id: "EV-017",
    kind: "document",
    title: "Cyber incident response SOP + tabletop drill record",
    description:
      "Board-noted cyber incident response SOP defining the 6-hour reporting workflow to SEBI/CERT-In and exchanges, with the record of the Q1 FY27 tabletop drill including timing evidence.",
    connector: "manual-upload",
    obligationIds: ["OBL-SB-022"],
    capturedAt: "2026-06-19T16:44:00+05:30",
    hash: "c17f4e82ab60",
    history: [
      { at: "2026-06-19T16:44:00+05:30", event: "captured", hash: "c17f4e82ab60" },
      { at: "2026-06-19T16:49:00+05:30", event: "bound to OBL-SB-022", hash: "c17f4e82ab60" },
    ],
    detail: {
      docPages: 18,
      docExcerpt:
        "SOP §4 (Regulatory reporting): on classification of an incident as reportable, the incident commander shall file the initial report to SEBI (via the designated portal), CERT-In and the stock exchanges within 6 hours of detection, followed by the detailed RCA within the prescribed window. Drill record 12-Jun-2026 (simulated ransomware on the back-office segment): detection-to-initial-report elapsed time 3h 41m; gaps noted — contact tree for the DR site out of date (remediated 16-Jun-2026).",
    },
  },
  {
    id: "EV-018",
    kind: "document",
    title: "Advertisement approval register FY27 YTD",
    description:
      "Register of all client-facing advertisements and marketing material released in FY27 to date, each entry cross-referenced to the prior exchange approval obtained before release.",
    connector: "manual-upload",
    obligationIds: ["OBL-SB-020"],
    capturedAt: "2026-07-02T09:26:00+05:30",
    hash: "48d1b0c7e93a",
    history: [
      { at: "2026-07-02T09:26:00+05:30", event: "captured", hash: "48d1b0c7e93a" },
      { at: "2026-07-02T09:30:00+05:30", event: "bound to OBL-SB-020", hash: "48d1b0c7e93a" },
    ],
    detail: {
      docPages: 5,
      docExcerpt:
        "FY27 YTD (01-Apr-2026 to 30-Jun-2026): 7 advertisements released — 4 digital banners, 2 social-media campaigns, 1 print insert. Prior approvals on record for 7 of 7 (NSE ref series ADV/2026/0331–0417). Nil instances of release preceding approval. Register maintained per the exchange advertisement code; each entry carries creative hash, approval reference, release date and withdrawal date where applicable.",
    },
  },
  {
    id: "EV-020",
    kind: "document",
    title: "DRAFT — Unpaid securities handling policy (CUSPA regime)",
    description:
      "Draft board policy governing handling of clients' unpaid securities under the CUSPA pledge regime, fixing the disposal window at 5 trading days. Pending board approval — scheduled for the 28-Aug-2026 board meeting.",
    connector: "manual-upload",
    obligationIds: ["OBL-SB-104"],
    capturedAt: "2026-07-09T18:12:00+05:30",
    hash: "f2a68d1c470b",
    history: [
      { at: "2026-07-09T18:12:00+05:30", event: "captured (draft v0.3)", hash: "f2a68d1c470b" },
      { at: "2026-07-09T18:16:00+05:30", event: "bound to OBL-SB-104 — pending board approval", hash: "f2a68d1c470b" },
    ],
    detail: {
      docPages: 11,
      docExcerpt:
        "[DRAFT v0.3 — not yet approved by the Board] §3.2: securities remaining unpaid shall be pledged to the designated Client Unpaid Securities Pledgee Account on settlement day and disposed of, or released against payment, no later than the close of the 5th trading day from the pay-out date. §3.5: un-invoked pledges shall auto-release to the client's demat account on day 6 without client request. §5: no unpaid security shall be transferred, pledged onward or otherwise encumbered in favour of any bank or NBFC. Placed for approval: Board meeting scheduled 28-Aug-2026.",
    },
  },

  /* ── Data checks ───────────────────────────────────────────────────── */
  {
    id: "EV-003",
    kind: "data-check",
    title: "Designated director residency check — FY26",
    description:
      "Residency day-count for the designated director computed from the HR travel log and immigration-stamp register, attested against the ≥182-day requirement.",
    connector: "backoffice-api",
    obligationIds: ["OBL-SB-003"],
    capturedAt: "2026-04-11T08:30:00+05:30",
    hash: "1e9c5f72d0b8",
    history: [
      { at: "2026-04-11T08:30:00+05:30", event: "captured", hash: "1e9c5f72d0b8" },
      { at: "2026-04-11T08:31:00+05:30", event: "bound to OBL-SB-003", hash: "1e9c5f72d0b8" },
    ],
    detail: {
      checkQuery:
        "SELECT director, SUM(days_in_india) AS days FROM hr.travel_log WHERE fy = 'FY26' AND role = 'designated-director' GROUP BY director",
      checkResult:
        "Anshuman Atrey — 311 days in India during FY26 (threshold ≥182). PASS. Attestation signed 10-Apr-2026; supporting passport-stamp register archived under DOC/HR/FY26/RES-01.",
    },
  },
  {
    id: "EV-004",
    kind: "data-check",
    title: "Client fund segregation — daily report feed",
    description:
      "Daily segregation computation (client funds vs own funds) pulled from the back-office ledger, with exchange submission receipts for each trading day of the current quarter.",
    connector: "backoffice-api",
    obligationIds: ["OBL-SB-004"],
    capturedAt: "2026-07-11T20:15:00+05:30",
    hash: "6ba4e0d92c57",
    history: [
      { at: "2026-04-01T20:15:00+05:30", event: "captured (feed enabled)", hash: "3c81f6a2d904" },
      { at: "2026-07-11T20:15:00+05:30", event: "refreshed — latest trading day appended", hash: "6ba4e0d92c57" },
    ],
    detail: {
      checkQuery:
        "SELECT trade_date, client_funds_total, own_funds_total, segregation_flag, exch_ack_ref FROM ledger.daily_segregation WHERE trade_date >= '2026-04-01' ORDER BY trade_date DESC",
      checkResult:
        "68 of 68 trading days (01-Apr to 11-Jul-2026) segregated with exchange acknowledgement on file. Latest: 11-Jul-2026 — client funds ₹41.27 Cr held across designated client bank accounts, zero commingling flags, NSE ack SEG/2026/07/11/48812. PASS.",
    },
  },
  {
    id: "EV-005",
    kind: "data-check",
    title: "End-of-day client fund upstreaming confirmations",
    description:
      "Daily confirmations from the clearing corporation that end-of-day client fund balances were upstreamed, reconciled against the firm's designated client bank accounts.",
    connector: "exchange-api",
    obligationIds: ["OBL-SB-005"],
    capturedAt: "2026-07-11T21:03:00+05:30",
    hash: "d05f8c31a4e6",
    history: [
      { at: "2026-04-01T21:00:00+05:30", event: "captured (feed enabled)", hash: "92e04b7c5a1d" },
      { at: "2026-07-11T21:03:00+05:30", event: "refreshed — latest confirmation appended", hash: "d05f8c31a4e6" },
    ],
    detail: {
      checkQuery:
        "GET /clearing/v2/upstreaming/confirmations?member=INZ000247319&from=2026-04-01&to=2026-07-11",
      checkResult:
        "68 of 68 trading days confirmed upstreamed by 09:00 next day. Latest: 11-Jul-2026 — ₹40.91 Cr upstreamed to NCL (ref NCL/UPS/2026/193/07741); residual float ₹0.36 Cr within the permitted operational threshold. 0 late confirmations in the period. PASS.",
    },
  },
  {
    id: "EV-006",
    kind: "data-check",
    title: "Running account settlement register — Q1 FY27",
    description:
      "Settlement register extract showing every client on a 30- or 90-day running-account cycle settled within the cycle, with retention statement dispatch records.",
    connector: "backoffice-api",
    obligationIds: ["OBL-SB-006"],
    capturedAt: "2026-07-05T07:40:00+05:30",
    hash: "83c2f7a05d19",
    history: [
      { at: "2026-07-05T07:40:00+05:30", event: "captured", hash: "83c2f7a05d19" },
      { at: "2026-07-05T07:41:00+05:30", event: "bound to OBL-SB-006", hash: "83c2f7a05d19" },
    ],
    detail: {
      checkQuery:
        "SELECT cycle, COUNT(*) AS clients, SUM(CASE WHEN settled_within_cycle THEN 1 ELSE 0 END) AS on_time FROM ops.running_account_settlement WHERE quarter = '2026-Q2' GROUP BY cycle",
      checkResult:
        "30-day cycle: 9,214 clients, 9,214 settled on time. 90-day cycle: 3,194 clients, 3,194 settled on time. Retention statements dispatched with each settlement (dispatch log cross-referenced). 0 breaches. PASS.",
    },
  },
  {
    id: "EV-008",
    kind: "data-check",
    title: "KRA validation status — active client base",
    description:
      "Export of KRA validation status for all active clients, confirming KYC records are registered/validated with a KRA and risk profiling exists prior to first trade.",
    connector: "kra-api",
    obligationIds: ["OBL-SB-008"],
    capturedAt: "2026-06-30T06:12:00+05:30",
    hash: "97ad20e6b3f4",
    history: [
      { at: "2026-05-31T06:10:00+05:30", event: "captured", hash: "4f6b1d83c2e0" },
      { at: "2026-06-30T06:12:00+05:30", event: "refreshed — monthly batch re-pull", hash: "97ad20e6b3f4" },
    ],
    detail: {
      checkQuery:
        "POST /kra/v1/status/batch { pan_list: <12,408 active clients>, fields: [\"kra_status\", \"validated_on\"] }",
      checkResult:
        "12,408 active clients checked against CVL-KRA: 12,371 'KYC Validated', 37 'KYC Registered' (validation in transit, all onboarded <30 days). 0 'On Hold' / 'Rejected'. Risk profiling on file for 12,408 of 12,408 prior to first trade. PASS.",
    },
  },
  {
    id: "EV-009",
    kind: "data-check",
    title: "Upfront margin reporting acknowledgements — daily",
    description:
      "Daily acknowledgements from the exchanges for margin collection reporting, with the short-collection register showing penalty instances and client-passthrough exclusions.",
    connector: "exchange-api",
    obligationIds: ["OBL-SB-010"],
    capturedAt: "2026-07-11T22:10:00+05:30",
    hash: "2c74b9f0e851",
    history: [
      { at: "2026-04-01T22:05:00+05:30", event: "captured (feed enabled)", hash: "a90d3e57c6b2" },
      { at: "2026-07-11T22:10:00+05:30", event: "refreshed — latest acknowledgement appended", hash: "2c74b9f0e851" },
    ],
    detail: {
      checkQuery:
        "GET /margin/v3/reporting/acks?member=INZ000247319&segment=ALL&from=2026-04-01&to=2026-07-11",
      checkResult:
        "68 of 68 trading days reported by T+5 with exchange acknowledgement. Short-collection instances in the period: 14 (0.02% of client-days); penalty debited to the firm in all 14, none passed to clients. Latest ack: NSE MRG/ACK/2026/193/33108 dt. 11-Jul-2026. PASS.",
    },
  },
  {
    id: "EV-010",
    kind: "data-check",
    title: "Daily margin statements & peak margin compliance feed",
    description:
      "Dispatch log for daily margin statements to every client with delivery statistics, combined with the four-snapshot peak margin compliance summary for the same period.",
    connector: "backoffice-api",
    obligationIds: ["OBL-SB-011", "OBL-SB-012"],
    capturedAt: "2026-07-11T23:02:00+05:30",
    hash: "5f18e6c2a973",
    history: [
      { at: "2026-04-01T23:00:00+05:30", event: "captured (feed enabled)", hash: "708c4d2f1e9a" },
      { at: "2026-07-11T23:02:00+05:30", event: "refreshed — latest trading day appended", hash: "5f18e6c2a973" },
    ],
    detail: {
      checkQuery:
        "SELECT trade_date, stmts_generated, stmts_delivered, bounce_count, peak_margin_breaches FROM ops.margin_dispatch JOIN risk.peak_margin USING (trade_date) WHERE trade_date >= '2026-04-01' ORDER BY trade_date DESC",
      checkResult:
        "Statements: 68 of 68 trading days, avg 12,371 statements/day generated and dispatched by 00:30; delivery rate 99.6% (bounces re-sent via SMS link within 24h). Peak margin: 0 breaches across all four intraday snapshots in the period. Latest day 11-Jul-2026: 12,384 dispatched, 41 bounces re-sent, 0 peak breaches. PASS.",
    },
  },
  {
    id: "EV-012",
    kind: "data-check",
    title: "SCORES aging + investor charter website check",
    description:
      "SCORES complaint aging report showing no complaint pending beyond 21 days, paired with an automated snapshot verifying the investor charter and monthly complaint data remain published on the website.",
    connector: "backoffice-api",
    obligationIds: ["OBL-SB-015", "OBL-SB-016"],
    capturedAt: "2026-07-10T06:35:00+05:30",
    hash: "e6902b8d4c1f",
    history: [
      { at: "2026-06-10T06:30:00+05:30", event: "captured", hash: "b45a7c09e3d6" },
      { at: "2026-07-10T06:35:00+05:30", event: "refreshed — monthly re-run", hash: "e6902b8d4c1f" },
    ],
    detail: {
      checkQuery:
        "GET /scores/v2/complaints?member=INZ000247319&status=open · GET https://walrussecuritas.com/investor-charter (snapshot + checksum)",
      checkResult:
        "SCORES: 3 complaints open, oldest aged 9 days; 22 resolved FY27 YTD, avg resolution 11.4 days, 0 beyond 21 days. Website: investor charter present (last updated 04-Apr-2026), monthly complaint disclosure current through Jun-2026, page checksum matches prior snapshot. PASS.",
    },
  },
  {
    id: "EV-014",
    kind: "data-check",
    title: "Records retention config + ECN dispatch SLA",
    description:
      "Archival system retention-policy verification (5-year preservation, WORM storage, integrity sampling) combined with the contract-note dispatch log measured against the 24-hour SLA.",
    connector: "backoffice-api",
    obligationIds: ["OBL-SB-018", "OBL-SB-019"],
    capturedAt: "2026-06-25T07:55:00+05:30",
    hash: "3a5d90c7f2e8",
    history: [
      { at: "2026-06-25T07:55:00+05:30", event: "captured", hash: "3a5d90c7f2e8" },
      { at: "2026-06-25T07:56:00+05:30", event: "bound to OBL-SB-018, OBL-SB-019", hash: "3a5d90c7f2e8" },
    ],
    detail: {
      checkQuery:
        "GET /archive/v1/policy?class=books-of-account · SELECT trade_date, ecn_sent, within_24h FROM ops.ecn_dispatch WHERE trade_date >= '2026-04-01'",
      checkResult:
        "Retention: policy 'books-of-account' set to 1,825 days on WORM object storage, deletion locks active; integrity sample 200 of 200 records readable with matching checksums. ECN: 100% of contract notes for the period dispatched within 24 hours (worst case 6h 12m); digital signature valid on all sampled notes. PASS.",
    },
  },
  {
    id: "EV-019",
    kind: "data-check",
    title: "Nomination coverage report — active accounts",
    description:
      "Coverage computation across all active accounts for nomination or signed opt-out. Coverage stands at 94.1% — below the 100% requirement; the residual 214 accounts are under re-papering (TSK-008).",
    connector: "depository-api",
    obligationIds: ["OBL-SB-009"],
    capturedAt: "2026-07-08T06:20:00+05:30",
    hash: "b91c3e57f0a2",
    history: [
      { at: "2026-05-15T06:18:00+05:30", event: "captured — coverage 91.7%", hash: "6d20f8b4a9c3" },
      { at: "2026-07-08T06:20:00+05:30", event: "refreshed — coverage 94.1%, 214 accounts residual", hash: "b91c3e57f0a2" },
    ],
    detail: {
      checkQuery:
        "SELECT COUNT(*) FILTER (WHERE nomination_on_file OR optout_on_file) * 100.0 / COUNT(*) AS coverage_pct, COUNT(*) FILTER (WHERE NOT nomination_on_file AND NOT optout_on_file) AS residual FROM dp.active_accounts",
      checkResult:
        "Coverage: 94.1% (11,676 of 12,408 accounts with nomination; 518 with signed opt-out; 214 with neither). SHORTFALL — 214 accounts lack nomination or opt-out. Remediation in progress under TSK-008 (re-papering drive, due 30-Sep-2026). FAIL — obligation flagged at-risk.",
    },
  },

  /* ── Live scans (Walrus scan engine) ───────────────────────────────── */
  {
    id: "EV-015",
    kind: "live-scan",
    title: "VAPT — trading & back-office perimeter",
    description:
      "Vulnerability assessment and penetration test across the trading front-end, back-office APIs and admin plane. Two medium findings remain open pending re-test (TSK-009); closure re-validation scheduled.",
    connector: "walrus-scan",
    obligationIds: ["OBL-SB-021"],
    capturedAt: "2026-05-20T02:10:00+05:30",
    hash: "0c8e2f9a61d4",
    history: [
      { at: "2026-05-20T02:10:00+05:30", event: "captured — initial VAPT sweep, 7 findings", hash: "4a1f7d30c8b5" },
      { at: "2026-06-24T02:15:00+05:30", event: "re-verified — 5 of 7 findings closed on re-scan; 2 medium remain open", hash: "0c8e2f9a61d4" },
    ],
    detail: {
      scanTool: "walrus-scan v2.4 (VAPT profile: OWASP ASVS L2 + network layer)",
      scanFindings:
        "Initial sweep 20-May-2026: 7 findings — 0 critical, 1 high (session fixation on legacy admin login), 4 medium, 2 low. Re-verification 24-Jun-2026: high finding CLOSED (legacy login decommissioned), 3 medium and 2 low CLOSED on re-scan. OPEN: WS-2026-0412 (medium — TLS 1.1 accepted on back-office reporting endpoint), WS-2026-0418 (medium — verbose stack traces on internal API error path). Re-test scheduled under TSK-009, due 20-Aug-2026.",
    },
  },
  {
    id: "EV-016",
    kind: "live-scan",
    title: "Log retention & MFA posture scan — critical systems",
    description:
      "Automated posture scan verifying 180-day log retention across critical systems and multi-factor authentication enforcement on every privileged and remote-access path.",
    connector: "walrus-scan",
    obligationIds: ["OBL-SB-023"],
    capturedAt: "2026-07-01T03:05:00+05:30",
    hash: "8d47a1c5e29f",
    history: [
      { at: "2026-06-01T03:00:00+05:30", event: "captured", hash: "17e5c9b2d480" },
      { at: "2026-07-01T03:05:00+05:30", event: "refreshed — monthly scheduled scan", hash: "8d47a1c5e29f" },
    ],
    detail: {
      scanTool: "walrus-scan v2.4 (posture profile: log-retention + IAM)",
      scanFindings:
        "Log retention: 14 of 14 critical systems shipping to the central SIEM; oldest retained event 196 days (requirement ≥180); retention lock verified on the storage tier. MFA: 41 of 41 privileged accounts enforce TOTP or hardware key; VPN and bastion require MFA; 0 legacy exemptions found. Break-glass accounts: 2, both vaulted with dual-approval checkout. PASS — no findings.",
    },
  },
];
