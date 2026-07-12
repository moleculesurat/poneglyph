import type { Obligation } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   The obligation register — simulated, grounded to data/corpus.ts.
   OBL-SB-001…023: base register extracted from MC-SB-2025 (RUN-041).
   OBL-SB-101…110: CUSPA delta extracted from CIRC-CUSPA-2026 (RUN-047).
   Status semantics: met · at-risk · gap · pending-review (awaiting the
   compliance officer's approval of an agent-proposed mapping).
   ══════════════════════════════════════════════════════════════════════ */

export const obligations: Obligation[] = [
  /* ── Registration & Governance ─────────────────────────────────────── */
  {
    id: "OBL-SB-001",
    title: "Half-yearly net worth certificate to exchange",
    summary:
      "Maintain prescribed net worth at all times and submit a CA-certified net worth certificate to the exchange every half-year.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "registration",
      para: "4.1",
      excerpt:
        "shall submit a net worth certificate, certified by a chartered accountant, to the stock exchange on a half-yearly basis",
      charStart: 61,
      charEnd: 178,
    },
    type: "periodic",
    frequency: "half-yearly",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-001",
      name: "Net worth certification cycle",
      description:
        "Finance calendar drives CA certification each H1/H2; certificate filed with NSE/BSE portals and archived.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "document", description: "CA-certified net worth certificate with exchange acknowledgement" },
    ],
    evidenceIds: ["EV-001"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "9f31c2ab04e7",
  },
  {
    id: "OBL-SB-002",
    title: "Qualified compliance officer appointed",
    summary:
      "Appoint a compliance officer responsible for monitoring compliance, investor grievance redressal and reporting material non-compliance to the exchange.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "registration",
      para: "5.2",
      excerpt:
        "shall appoint a qualified compliance officer who shall be responsible for monitoring compliance",
      charStart: 25,
      charEnd: 121,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-002",
      name: "Compliance officer mandate",
      description:
        "Board-appointed CO with charter; exchange intimation on appointment/change; escalation SOP for material non-compliance.",
      owner: "Priya Nair",
    },
    evidenceSpec: [
      { kind: "document", description: "Board resolution of appointment + exchange intimation" },
    ],
    evidenceIds: ["EV-002"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "b8120de49c55",
  },
  {
    id: "OBL-SB-003",
    title: "Resident designated director (≥182 days)",
    summary:
      "At least one designated director must be resident in India for not less than 182 days in the financial year.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "registration",
      para: "5.6",
      excerpt:
        "at least one designated director who is resident in India, having stayed in India for a total period of not less than one hundred and eighty-two days",
      charStart: 38,
      charEnd: 188,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-003",
      name: "Director residency attestation",
      description:
        "Annual residency declaration from designated directors, cross-checked against travel records at FY close.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Residency attestation + day-count from travel log" },
    ],
    evidenceIds: ["EV-003"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "77aa41f0be03",
  },

  /* ── Dealings with clients — funds & securities ────────────────────── */
  {
    id: "OBL-SB-004",
    title: "Daily segregation of client funds",
    summary:
      "Client funds segregated from proprietary funds at all times; no client-to-client or client-to-house use; daily segregation reporting to the exchange.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "client-dealings",
      para: "22.1",
      excerpt:
        "Client funds shall be segregated from the stock broker's own funds at all times",
      charStart: 0,
      charEnd: 80,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-004",
      name: "Segregation ledger + daily report",
      description:
        "Automated end-of-day segregation computation from back-office ledger; daily submission to exchange; exception alerts.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Daily segregation report with exchange submission receipt" },
    ],
    evidenceIds: ["EV-004"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "c410f39d2ea8",
  },
  {
    id: "OBL-SB-005",
    title: "End-of-day upstreaming of client funds",
    summary:
      "Upstream all client funds to clearing corporations end-of-day; no overnight retention beyond permitted extent.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "client-dealings",
      para: "23.4",
      excerpt:
        "All client funds shall be upstreamed by the stock broker to the clearing corporations on an end-of-day basis",
      charStart: 0,
      charEnd: 109,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-005",
      name: "EOD upstreaming job",
      description:
        "Automated EOD sweep to clearing corporation accounts with confirmation capture; residual-balance exception report.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Clearing corporation upstreaming confirmations (daily)" },
    ],
    evidenceIds: ["EV-005"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "5d2e91c07f44",
  },
  {
    id: "OBL-SB-006",
    title: "Running account settlement (30/90-day cycle)",
    summary:
      "Settle running accounts of client funds at least once every 30 or 90 days per client preference, with statement of accounts on settlement date.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "client-dealings",
      para: "26.2",
      excerpt:
        "settlement of funds of the running account shall be done by the stock broker at least once within a gap of thirty or ninety days",
      charStart: 11,
      charEnd: 140,
    },
    type: "periodic",
    frequency: "30/90 days per client",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-006",
      name: "Running account settlement engine",
      description:
        "Back-office scheduler settles each client on their elected cycle; statements dispatched same day; failures queued for manual action.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Settlement register with cycle compliance stats" },
    ],
    evidenceIds: ["EV-006"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "e07bd831a92c",
  },
  {
    id: "OBL-SB-007",
    title: "DDPI only — no PoA over client demat",
    summary:
      "No power of attorney for client demat operation; only DDPI executed with explicit client consent, limited to specified purposes.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "client-dealings",
      para: "28.1",
      excerpt:
        "shall not obtain a power of attorney for the operation of client demat accounts and shall use only the Demat Debit and Pledge Instruction (DDPI)",
      charStart: 14,
      charEnd: 158,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-007",
      name: "DDPI migration & onboarding gate",
      description:
        "Legacy PoAs revoked and migrated to DDPI; onboarding flow blocks PoA capture; periodic sample audit of mandates.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "document", description: "DDPI migration completion report + depository confirmation" },
    ],
    evidenceIds: ["EV-007"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "1a94cc07d3b6",
  },
  {
    id: "OBL-SB-008",
    title: "KYC via KRA + risk profiling before onboarding",
    summary:
      "Complete KYC through a KYC Registration Agency, risk-profile the client and execute prescribed documentation before onboarding.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "client-dealings",
      para: "30.3",
      excerpt:
        "No stock broker shall onboard a client without completing the Know Your Client process through a KYC Registration Agency",
      charStart: 0,
      charEnd: 121,
    },
    type: "event-driven",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-008",
      name: "Onboarding KYC gate",
      description:
        "Account opening blocked until KRA validation returns verified status and risk profile is recorded; nightly re-validation of modified records.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "KRA validation status export for active client base" },
    ],
    evidenceIds: ["EV-008"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "f5c3a2e8107d",
  },
  {
    id: "OBL-SB-009",
    title: "Nomination (or opt-out) for every account",
    summary:
      "Provide nomination facility in the prescribed format, or obtain opt-out declaration, for every trading and demat account.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "client-dealings",
      para: "31.5",
      excerpt:
        "shall provide the facility of nomination to its clients in the prescribed format, or obtain a declaration of opt-out, for every trading and demat account",
      charStart: 25,
      charEnd: 177,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-009",
      name: "Nomination coverage tracker",
      description:
        "Onboarding mandates nomination/opt-out; legacy book re-papering campaign tracked weekly until 100% coverage.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Nomination coverage report across active accounts" },
    ],
    evidenceIds: ["EV-019"],
    status: "at-risk",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "3be0d7f4a611",
  },

  /* ── Margin obligations ─────────────────────────────────────────────── */
  {
    id: "OBL-SB-010",
    title: "Upfront margin collection & short-collection reporting",
    summary:
      "Collect upfront margins as prescribed and report short/non-collection to the exchange for penalty processing.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "margin",
      para: "52.1",
      excerpt:
        "shall collect upfront margins from clients in the manner prescribed and shall report instances of short-collection or non-collection",
      charStart: 14,
      charEnd: 147,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-010",
      name: "Margin engine + exception reporting",
      description:
        "RMS blocks orders breaching upfront margin; daily short-collection file generated and reported to exchange.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Exchange margin reporting acknowledgements (daily)" },
    ],
    evidenceIds: ["EV-009"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "a2c85e10f9d3",
  },
  {
    id: "OBL-SB-011",
    title: "Daily margin statement to every client",
    summary:
      "Issue daily margin statements in the prescribed format disclosing collateral deposited, utilised and margin status.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "margin",
      para: "54.2",
      excerpt:
        "shall issue to each client a daily margin statement, in the prescribed format, disclosing the collateral deposited, collateral utilised and margin status",
      charStart: 25,
      charEnd: 179,
    },
    type: "periodic",
    frequency: "daily",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-011",
      name: "Margin statement dispatcher",
      description:
        "EOD batch renders and emails margin statements; bounce handling and dispatch log retained.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Dispatch log with delivery stats (daily)" },
    ],
    evidenceIds: ["EV-010"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "08de6b3c471f",
  },
  {
    id: "OBL-SB-012",
    title: "Peak margin compliance",
    summary:
      "Compute margins on intra-day peak positions and ensure peak margin obligations are met at all times.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "margin",
      para: "55.1",
      excerpt:
        "Margin requirements shall be computed on the basis of intra-day peak positions of the client",
      charStart: 0,
      charEnd: 93,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-012",
      name: "Peak margin monitor",
      description:
        "RMS snapshots intra-day positions at exchange-specified intervals; peak margin coverage validated against collateral.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Peak margin snapshot compliance summary" },
    ],
    evidenceIds: ["EV-010"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "6f17903acd28",
  },

  /* ── Supervision & internal audit ───────────────────────────────────── */
  {
    id: "OBL-SB-013",
    title: "Half-yearly internal audit",
    summary:
      "Complete internal audit each half-year by an independent CA/CS; report placed before the board and filed with the exchange.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "supervision",
      para: "61.1",
      excerpt:
        "shall carry out a complete internal audit on a half-yearly basis by an independent qualified chartered accountant or company secretary",
      charStart: 25,
      charEnd: 159,
    },
    type: "periodic",
    frequency: "half-yearly",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-013",
      name: "Internal audit engagement",
      description:
        "Empanelled independent auditor engaged per half-year; findings tracked to closure; board minute + exchange filing archived.",
      owner: "Priya Nair",
    },
    evidenceSpec: [
      { kind: "document", description: "Internal audit report + board minute + filing receipt" },
    ],
    evidenceIds: ["EV-011"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "d94a1e57b380",
  },
  {
    id: "OBL-SB-014",
    title: "Annual branch & AP inspections",
    summary:
      "Inspect the prescribed number of branches and authorised persons each year and maintain inspection records.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "supervision",
      para: "63.2",
      excerpt:
        "shall carry out an inspection of such number of branches and authorised persons every year as prescribed",
      charStart: 14,
      charEnd: 119,
    },
    type: "periodic",
    frequency: "annual",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-014",
      name: "AP inspection programme",
      description:
        "Risk-ranked inspection calendar covering all APs on rotation; findings and closure evidence logged per inspection.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "document", description: "Inspection calendar + completed inspection reports" },
    ],
    evidenceIds: ["EV-011"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "42fb08c69ae1",
  },

  /* ── Investor grievance ─────────────────────────────────────────────── */
  {
    id: "OBL-SB-015",
    title: "SCORES complaints resolved within 21 days",
    summary:
      "Resolve SCORES complaints and submit action taken reports within 21 calendar days of receipt.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "grievance",
      para: "71.1",
      excerpt:
        "shall resolve complaints received through the SEBI Complaints Redress System (SCORES) within twenty-one calendar days",
      charStart: 25,
      charEnd: 143,
    },
    type: "event-driven",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-015",
      name: "SCORES aging watch",
      description:
        "Grievance desk SLA board with day-15 escalation to CO; ATRs filed via SCORES with proof of resolution.",
      owner: "Priya Nair",
    },
    evidenceSpec: [
      { kind: "data-check", description: "SCORES aging report — zero beyond 21 days" },
    ],
    evidenceIds: ["EV-012"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "70c3f6d21b45",
  },
  {
    id: "OBL-SB-016",
    title: "Investor charter & complaint data displayed",
    summary:
      "Prominently display the Investor Charter and complaints/disposal data on the website; bring the charter to clients' notice.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "grievance",
      para: "72.3",
      excerpt:
        "shall prominently display the Investor Charter and the data on complaints received and their disposal on its website",
      charStart: 25,
      charEnd: 142,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-016",
      name: "Website disclosure job",
      description:
        "Monthly automated publish of complaint statistics; charter linked from footer and onboarding emails.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Website disclosure snapshot with publish timestamps" },
    ],
    evidenceIds: ["EV-012"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "91d50a8e3c7b",
  },
  {
    id: "OBL-SB-017",
    title: "ODR portal enrolment",
    summary:
      "Enrol on the Online Dispute Resolution portal and facilitate client dispute resolution through ODR.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "grievance",
      para: "73.1",
      excerpt:
        "shall enrol on the Online Dispute Resolution (ODR) portal and shall facilitate resolution of disputes",
      charStart: 25,
      charEnd: 127,
    },
    type: "one-time",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-017",
      name: "ODR enrolment & handling SOP",
      description:
        "Enrolled on Smart ODR; conciliation/arbitration handling SOP assigned to grievance desk.",
      owner: "Priya Nair",
    },
    evidenceSpec: [
      { kind: "document", description: "ODR enrolment confirmation" },
    ],
    evidenceIds: ["EV-013"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "ce682f1b09da",
  },

  /* ── Books, records & contract notes ───────────────────────────────── */
  {
    id: "OBL-SB-018",
    title: "Books of account preserved 5 years",
    summary:
      "Maintain prescribed books, records and documents for at least five years, with electronic copies authenticated as prescribed.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "books-records",
      para: "81.1",
      excerpt:
        "shall maintain the books of account, records and documents prescribed under the rules and regulations for a minimum period of five years",
      charStart: 25,
      charEnd: 162,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-018",
      name: "Records retention vault",
      description:
        "WORM-storage archival with 5-year+ retention policy; deletion holds enforced; quarterly retrieval drill.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Retention policy config + archival integrity check" },
    ],
    evidenceIds: ["EV-014"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "57e9b04dfa12",
  },
  {
    id: "OBL-SB-019",
    title: "Contract notes within 24 hours",
    summary:
      "Issue contract notes (including ECN) to clients in the prescribed format within 24 hours of trade execution.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "books-records",
      para: "83.2",
      excerpt:
        "shall issue a contract note to each client for trades executed, in the prescribed format, within twenty-four hours",
      charStart: 25,
      charEnd: 140,
    },
    type: "event-driven",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-019",
      name: "ECN dispatch pipeline",
      description:
        "Post-trade batch generates digitally-signed ECNs; dispatch within T+1 06:00 with delivery tracking.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "ECN dispatch log with 24h SLA stats" },
    ],
    evidenceIds: ["EV-014"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "b3d07c58e921",
  },

  /* ── Advertisement code ─────────────────────────────────────────────── */
  {
    id: "OBL-SB-020",
    title: "Prior exchange approval for advertisements",
    summary:
      "All advertisements conform to the advertisement code, carry prior exchange approval, and never promise assured returns.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "advertisement",
      para: "91.1",
      excerpt:
        "shall be issued only after obtaining prior approval of the stock exchange. No advertisement shall contain any promise or guarantee of assured or risk-free return",
      charStart: 92,
      charEnd: 253,
    },
    type: "event-driven",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-020",
      name: "Marketing approval gate",
      description:
        "All creative routed through CO review + exchange approval before release; approval register maintained.",
      owner: "Priya Nair",
    },
    evidenceSpec: [
      { kind: "document", description: "Advertisement approval register with exchange approvals" },
    ],
    evidenceIds: ["EV-018"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "f08a2d6c3517",
  },

  /* ── Cyber security & system audit (CSCRF) ─────────────────────────── */
  {
    id: "OBL-SB-021",
    title: "Periodic VAPT with closure re-validation",
    summary:
      "Conduct VAPT of critical systems at prescribed periodicity; close findings and re-validate closure within CSCRF timelines.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "cyber",
      para: "101.1",
      excerpt:
        "shall conduct a comprehensive vulnerability assessment and penetration testing (VAPT) of their critical systems at the prescribed periodicity",
      charStart: 19,
      charEnd: 160,
    },
    type: "periodic",
    frequency: "annual (CSCRF class)",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-021",
      name: "VAPT programme (Walrus)",
      description:
        "Annual VAPT executed via Walrus scan engine + manual test; findings tracked to closure with re-test evidence.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "live-scan", description: "VAPT report + re-test verification from scan engine" },
    ],
    evidenceIds: ["EV-015"],
    status: "at-risk",
    deadline: "2026-08-20",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "24c9e17b5f60",
  },
  {
    id: "OBL-SB-022",
    title: "Cyber incident reporting within 6 hours",
    summary:
      "Report cyber incidents/attacks to the exchange and SEBI within 6 hours of detection, with incident analysis to follow.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "cyber",
      para: "102.4",
      excerpt:
        "All cyber incidents and cyber attacks shall be reported to the stock exchange and to SEBI within six hours",
      charStart: 0,
      charEnd: 107,
    },
    type: "event-driven",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-022",
      name: "Incident response & reporting SOP",
      description:
        "IR runbook with 6h regulator-notification step; quarterly tabletop drill; SOC alerting wired to on-call.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "document", description: "IR SOP + latest tabletop drill record" },
    ],
    evidenceIds: ["EV-017"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "8e5b30da96c4",
  },
  {
    id: "OBL-SB-023",
    title: "180-day log retention + MFA on critical systems",
    summary:
      "Maintain logs of critical systems for a rolling 180 days and enforce multi-factor authentication for all users of critical systems.",
    clause: {
      circularId: "MC-SB-2025",
      chapter: "cyber",
      para: "103.2",
      excerpt:
        "shall maintain logs of all critical systems for a rolling period of not less than one hundred and eighty days, and shall implement multi-factor authentication",
      charStart: 19,
      charEnd: 178,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-023",
      name: "Log retention + MFA enforcement (Walrus)",
      description:
        "Central log store with 180d retention policy verified by scan; IdP policy mandates MFA on all critical-system users.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "live-scan", description: "Automated config check: retention window + MFA coverage" },
    ],
    evidenceIds: ["EV-016"],
    status: "met",
    createdByRun: "RUN-041",
    approvedBy: "Priya Nair",
    hash: "3fa61d09c8be",
  },

  /* ══ CUSPA delta — extracted by RUN-047 from CIRC-CUSPA-2026 ═══════════ */
  {
    id: "OBL-SB-101",
    title: "Open dedicated CUSPA pledgee account",
    summary:
      "Open a separate demat account tagged 'Client Unpaid Securities Pledgee Account' with the depository, used exclusively for pledges of clients' unpaid securities.",
    clause: {
      circularId: "CIRC-CUSPA-2026",
      chapter: "unpaid-securities",
      para: "46.1",
      excerpt:
        "shall open a separate demat account designated as the 'Client Unpaid Securities Pledgee Account' (CUSPA), tagged as such with the depository",
      charStart: 27,
      charEnd: 167,
    },
    type: "one-time",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-101",
      name: "CUSPA account setup",
      description:
        "Open and tag CUSPA with depository; restrict account usage to unpaid-securities pledges only.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Depository confirmation of tagged CUSPA account" },
    ],
    evidenceIds: [],
    status: "gap",
    deadline: "2026-11-02",
    createdByRun: "RUN-047",
    approvedBy: "Priya Nair",
    hash: "aa10f47e92d5",
  },
  {
    id: "OBL-SB-102",
    title: "Auto-pledge unpaid securities to CUSPA",
    summary:
      "On pay-out, transfer securities to the client's demat account and create an auto-pledge in favour of CUSPA without separate client instruction.",
    clause: {
      circularId: "CIRC-CUSPA-2026",
      chapter: "unpaid-securities",
      para: "46.2",
      excerpt:
        "followed by creation of an auto-pledge in favour of the trading member's CUSPA, without requiring any separate instruction or authorisation from the client",
      charStart: 132,
      charEnd: 287,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-102",
      name: "Auto-pledge flow",
      description:
        "Post-pay-out job creates pledges via depository API for unpaid positions; failures alert operations.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Pledge creation log reconciled to unpaid positions" },
    ],
    evidenceIds: [],
    status: "gap",
    deadline: "2026-11-02",
    createdByRun: "RUN-047",
    approvedBy: "Priya Nair",
    hash: "bb84c25d013f",
  },
  {
    id: "OBL-SB-103",
    title: "Email/SMS intimation on pledge creation",
    summary:
      "On pledge creation, intimate the client by email and SMS with securities pledged, amount outstanding, and invoke/release date.",
    clause: {
      circularId: "CIRC-CUSPA-2026",
      chapter: "unpaid-securities",
      para: "46.3",
      excerpt:
        "shall intimate the client through email and SMS, specifying the securities pledged, the amount outstanding, and the date by which the pledge shall be invoked or released",
      charStart: 63,
      charEnd: 232,
    },
    type: "event-driven",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-103",
      name: "Pledge notification templates",
      description:
        "Event-triggered email/SMS with mandated fields; delivery log retained per intimation.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Notification dispatch log tied to pledge events" },
    ],
    evidenceIds: [],
    status: "gap",
    deadline: "2026-11-02",
    createdByRun: "RUN-047",
    approvedBy: "Priya Nair",
    hash: "cc39e60b7a48",
  },
  {
    id: "OBL-SB-104",
    title: "Board-approved unpaid-securities policy (≤5-day window)",
    summary:
      "Frame a board-approved policy on handling clients' unpaid securities; payment window must not exceed five trading days from pay-out.",
    clause: {
      circularId: "CIRC-CUSPA-2026",
      chapter: "unpaid-securities",
      para: "46.4",
      excerpt:
        "shall frame a policy on handling of clients' unpaid securities, approved by its board, which shall in no case permit a payment window exceeding five trading days",
      charStart: 19,
      charEnd: 180,
    },
    type: "one-time",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-104",
      name: "Unpaid-securities policy",
      description:
        "Draft policy capping payment window at 5 trading days; board approval and client dissemination tracked.",
      owner: "Priya Nair",
    },
    evidenceSpec: [
      { kind: "document", description: "Board-approved policy document" },
    ],
    evidenceIds: ["EV-020"],
    status: "pending-review",
    deadline: "2026-11-02",
    createdByRun: "RUN-047",
    hash: "dd57a1f30c92",
  },
  {
    id: "OBL-SB-105",
    title: "Day-6 auto-release of un-invoked pledges",
    summary:
      "If the client's obligation is unmet after five trading days, invoke to the extent unpaid; otherwise the pledge auto-releases on day six.",
    clause: {
      circularId: "CIRC-CUSPA-2026",
      chapter: "unpaid-securities",
      para: "46.5",
      excerpt:
        "where the pledge is not invoked, it shall be auto-released on the sixth trading day and the securities shall be free in the client's demat account",
      charStart: 152,
      charEnd: 298,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-105",
      name: "Invoke/auto-release scheduler",
      description:
        "Day-5 invocation decisioning with day-6 auto-release fallback wired into depository pledge API.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Pledge lifecycle log: invocations and day-6 releases" },
    ],
    evidenceIds: [],
    status: "gap",
    deadline: "2026-11-02",
    createdByRun: "RUN-047",
    approvedBy: "Priya Nair",
    hash: "ee72c48d15a3",
  },
  {
    id: "OBL-SB-106",
    title: "No transfer of unpaid securities to banks/NBFCs",
    summary:
      "Unpaid client securities must never be transferred or pledged to any bank or NBFC, including for the broker's own funding.",
    clause: {
      circularId: "CIRC-CUSPA-2026",
      chapter: "unpaid-securities",
      para: "46.9",
      excerpt:
        "shall not be transferred or pledged, in any circumstance, to any bank or non-banking financial company",
      charStart: 37,
      charEnd: 140,
    },
    type: "ongoing",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-106",
      name: "Funding-use prohibition check",
      description:
        "Treasury policy prohibition + periodic reconciliation that no CUSPA holdings appear in funding collateral.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Collateral registers cross-check vs CUSPA holdings" },
    ],
    evidenceIds: [],
    status: "pending-review",
    deadline: "2026-11-02",
    createdByRun: "RUN-047",
    hash: "ff081b5e37c6",
  },
  {
    id: "OBL-SB-107",
    title: "Daily reconciliation of pledgeable value",
    summary:
      "Each trading day, reconcile the maximum value of securities eligible for CUSPA pledge against aggregate unpaid client obligations; preserve records.",
    clause: {
      circularId: "CIRC-CUSPA-2026",
      chapter: "unpaid-securities",
      para: "46.11",
      excerpt:
        "shall carry out, on each trading day, a reconciliation of the maximum value of securities eligible to be pledged to the CUSPA against the aggregate unpaid obligations",
      charStart: 19,
      charEnd: 185,
    },
    type: "periodic",
    frequency: "daily",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-107",
      name: "CUSPA reconciliation job",
      description:
        "EOD job compares pledgeable value vs unpaid obligations; exceptions raised to operations; records preserved.",
      owner: "Dev Khanna",
    },
    evidenceSpec: [
      { kind: "data-check", description: "Daily reconciliation output with preservation proof" },
    ],
    evidenceIds: [],
    status: "gap",
    deadline: "2026-11-02",
    createdByRun: "RUN-047",
    approvedBy: "Priya Nair",
    hash: "0192d3a7b8e4",
  },
  {
    id: "OBL-SB-108",
    title: "Extension requests by 6 p.m. on day 5",
    summary:
      "In exceptional circumstances, request invocation-timeline extension from the exchange by 6 p.m. on the fifth trading day, max one week at a time.",
    clause: {
      circularId: "CIRC-CUSPA-2026",
      chapter: "unpaid-securities",
      para: "46.6",
      excerpt:
        "may request an extension of the invocation timeline from the stock exchange, in the manner specified, by six p.m. on the fifth trading day",
      charStart: 55,
      charEnd: 193,
    },
    type: "event-driven",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-108",
      name: "Extension request SOP",
      description:
        "Operations SOP with 6 p.m. day-5 cutoff alarm, documented exceptional-circumstance justification, repeat-request rules.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "document", description: "SOP + extension request records (when raised)" },
    ],
    evidenceIds: [],
    status: "pending-review",
    deadline: "2026-11-02",
    createdByRun: "RUN-047",
    hash: "1204e5c9d6f7",
  },
  {
    id: "OBL-SB-109",
    title: "Track phased effectivity of the CUSPA regime",
    summary:
      "Paras 46.1–46.11 effective 3 months after exchange operational guidelines (due within 30 days); paras 46.12–46.14 effective 6 months from Jul 3, 2026.",
    clause: {
      circularId: "CIRC-CUSPA-2026",
      chapter: "unpaid-securities",
      para: "46.14",
      excerpt:
        "Paragraphs 46.1 to 46.11 shall come into force three months from the date of issuance of operational guidelines by the stock exchanges",
      charStart: 0,
      charEnd: 134,
    },
    type: "one-time",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-109",
      name: "Effectivity tracker",
      description:
        "Watch exchange operational guidelines (due ~Aug 2, 2026); pin phase-1 and phase-2 go-live dates and readiness reviews.",
      owner: "Priya Nair",
    },
    evidenceSpec: [
      { kind: "document", description: "Readiness review minutes per phase" },
    ],
    evidenceIds: [],
    status: "at-risk",
    deadline: "2027-01-03",
    createdByRun: "RUN-047",
    approvedBy: "Priya Nair",
    hash: "23b6f0a8c1d9",
  },
  {
    id: "OBL-SB-110",
    title: "Update client agreements & T&C for pledge regime",
    summary:
      "Update client agreements, terms and policies to the pledge-based mechanism and disseminate updated terms to all existing clients.",
    clause: {
      circularId: "CIRC-CUSPA-2026",
      chapter: "unpaid-securities",
      para: "46.12",
      excerpt:
        "shall ensure that their client agreements, terms and conditions, and policies are updated to reflect the pledge-based mechanism",
      charStart: 16,
      charEnd: 143,
    },
    type: "one-time",
    appliesTo: ["stock-broker"],
    control: {
      id: "CTL-110",
      name: "T&C addendum rollout",
      description:
        "Legal addendum drafted; dissemination to 12,408 active clients via email + app notice with delivery tracking.",
      owner: "Rohan Iyer",
    },
    evidenceSpec: [
      { kind: "document", description: "Updated T&C + dissemination completion report" },
    ],
    evidenceIds: [],
    status: "gap",
    deadline: "2027-01-03",
    createdByRun: "RUN-047",
    approvedBy: "Priya Nair",
    hash: "34c7a1b9d2e0",
  },
];
