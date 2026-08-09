import type { ScraperCatch } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Watchtower — what the scraper caught on sebi.gov.in, newest first.
   Every applicability verdict is clause-level and cited: the agent reads
   the addressee line and operative text of the document, matches it
   against the tenant's registrations (stock broker, INZ000161534, NSE/BSE,
   no other SEBI registration), and writes down exactly why it applies,
   partially applies, or does not apply. Verdicts of "applies"/"partial"
   trigger a pipeline run; "not-applicable" is filed with reasons and
   never touches the register.
   ══════════════════════════════════════════════════════════════════════ */

export const catches: ScraperCatch[] = [
  {
    id: "CATCH-006",
    title:
      "Consultation Paper on Safeguards for Retail Participation in Algorithmic Trading",
    circularNumber: "Consultation Paper — MIRSD (Jul 2026)",
    url: "https://www.sebi.gov.in/reports-and-statistics/reports/jul-2026/consultation-paper-retail-algo-safeguards.html",
    source: "sebi.gov.in / reports & consultations",
    docType: "press-release",
    fetchedAt: "2026-07-09T06:00:41+05:30",
    applicability: {
      verdict: "partial",
      reasoning:
        "This is a consultation paper, not a binding circular — it creates no obligation today. It does, however, propose direct duties for stock brokers offering API-based order routing to retail clients: broker-level approval of retail algos, unique algo IDs tagged on every order, and a two-factor kill switch. The tenant exposes an order API to 3,112 of its 12,408 active clients, so if these proposals are adopted, they will bind. Verdict: monitor — no run triggered, no register change; the watcher will re-evaluate when the final circular issues. Comment window closes 2026-07-30.",
      citedText:
        "brokers providing application programming interface (API) access to retail investors shall register each algorithm with the stock exchange and tag every order with a unique algo identifier",
      confidence: 0.74,
    },
  },
  {
    id: "CATCH-005",
    title:
      "Handling of Clients' Unpaid Securities by Trading Members — Amendment to Master Circular for Stock Brokers",
    circularNumber: "HO/38/11/(9)2026-MIRSD-POD/I/15382/2026",
    url: "https://www.sebi.gov.in/legal/circulars/jul-2026/handling-of-clients-unpaid-securities-by-trading-members.html",
    source: "sebi.gov.in / circulars",
    docType: "circular",
    fetchedAt: "2026-07-03T11:37:22+05:30",
    applicability: {
      verdict: "applies",
      reasoning:
        "The circular is addressed to 'all trading members of stock exchanges' and amends Para 46 of the Master Circular for Stock Brokers (MC-SB-2025), which this register is built on. The tenant is a SEBI-registered stock broker (INZ000161534) and a trading member of NSE and BSE, so every operative paragraph binds. The substance is not cosmetic: it replaces the CUSA account-transfer regime with a pledge-based CUSPA mechanism — a new tagged pledgee demat account, auto-pledge on pay-out, mandatory client intimation, a hard five-trading-day payment window with day-six auto-release, and daily reconciliation. Every existing Para 46 mapping is stale as of this catch. Full re-map pipeline triggered.",
      citedText:
        "Every trading member shall open a separate demat account designated as the 'Client Unpaid Securities Pledgee Account' (CUSPA), tagged as such with the depository, exclusively for taking a pledge of unpaid securities of clients.",
      confidence: 0.99,
    },
    triggeredRunId: "RUN-047",
  },
  {
    id: "CATCH-004",
    title:
      "Disclosure of Total Expense Ratio by Asset Management Companies — Revised Format",
    circularNumber: "SEBI/HO/IMD/IMD-PoD-1/P/CIR/2026/54",
    url: "https://www.sebi.gov.in/legal/circulars/apr-2026/disclosure-of-total-expense-ratio-by-amcs-revised-format.html",
    source: "sebi.gov.in / circulars",
    docType: "circular",
    fetchedAt: "2026-04-14T06:00:37+05:30",
    applicability: {
      verdict: "not-applicable",
      reasoning:
        "The circular is addressed to 'all Asset Management Companies (AMCs) and Association of Mutual Funds in India (AMFI)' and every operative clause is framed on the AMC — TER computation, scheme-level disclosure on AMC websites, and AMFI consolidation. The tenant holds a single SEBI registration as a stock broker (INZ000161534) and holds no AMC registration, sponsors no mutual fund, and acts as investment manager to no scheme. Distribution of mutual fund units by a broker does not attract any clause of this circular; the disclosure duty sits with the AMC. Filed without action — no run triggered, register untouched.",
      citedText:
        "All AMCs shall disclose the Total Expense Ratio of each scheme, on a daily basis, in the revised format set out in the Annexure, on their websites and on the AMFI website.",
      confidence: 0.98,
    },
  },
  {
    id: "CATCH-002",
    title:
      "Clarifications on the Cybersecurity and Cyber Resilience Framework (CSCRF) for SEBI Regulated Entities",
    circularNumber: "SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2026/17",
    url: "https://www.sebi.gov.in/legal/circulars/feb-2026/clarifications-on-cscrf-for-regulated-entities.html",
    source: "sebi.gov.in / circulars",
    docType: "circular",
    fetchedAt: "2026-02-11T06:00:19+05:30",
    applicability: {
      verdict: "partial",
      reasoning:
        "The circular is addressed to all SEBI regulated entities, which includes the tenant, but its operative content touches only the CSCRF chapter of the register (cyber — paras 101–103 of MC-SB-2025). It recalibrates VAPT periodicity and closure re-validation timelines by entity category, confirms the six-hour incident-reporting clock runs from detection, and clarifies that the 180-day log-retention window applies to all critical systems including cloud-hosted ones. As a self-certification-category broker (not a QSB), the tenant's VAPT cadence and re-validation deadline change; the other eight chapters of the register are untouched. Partial re-map scheduled for the cyber chapter at the framework's stated effectivity for the FY26-27 audit cycle.",
      citedText:
        "REs in the self-certification category shall close all VAPT findings and carry out re-validation of closure within the timelines specified, reckoned from the date of the final VAPT report.",
      confidence: 0.87,
    },
    triggeredRunId: "RUN-044",
  },
  {
    id: "CATCH-003",
    title:
      "Securities and Exchange Board of India (Stock Brokers) (Amendment) Regulations, 2026",
    circularNumber: "No. SEBI/LAD-NRO/GN/2026/221",
    url: "https://www.sebi.gov.in/legal/regulations/jan-2026/sebi-stock-brokers-amendment-regulations-2026.html",
    source: "sebi.gov.in / regulations",
    docType: "regulation",
    fetchedAt: "2026-01-08T06:00:12+05:30",
    applicability: {
      verdict: "applies",
      reasoning:
        "Gazette notification amending the SEBI (Stock Brokers) Regulations, 1992 — the parent regulation under which the tenant's certificate of registration (INZ000161534) is issued, so it binds by definition. The operative changes sit in the registration-and-governance chapter: the compliance officer's reporting line is fixed to the board rather than the managing director, and the designated-director residency test moves from a financial-year day-count to a rolling twelve-month day-count. Obligations OBL-SB-002 and OBL-SB-003 carry stale clause framing until re-mapped. The regulation commences on 2026-07-01 per its commencement clause; re-map run scheduled ahead of commencement rather than at notification.",
      citedText:
        "at least one designated director who is resident in India, having stayed in India for a total period of not less than one hundred and eighty-two days during the preceding twelve months",
      confidence: 0.97,
    },
    triggeredRunId: "RUN-045",
  },
  {
    id: "CATCH-001",
    title: "Master Circular for Stock Brokers",
    circularNumber: "SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2025/91",
    url: "https://www.sebi.gov.in/legal/master-circulars/jun-2025/master-circular-for-stock-brokers.html",
    source: "sebi.gov.in / master circulars",
    docType: "master-circular",
    fetchedAt: "2025-06-18T06:00:08+05:30",
    applicability: {
      verdict: "applies",
      reasoning:
        "Consolidated master circular addressed to all recognised stock exchanges and stock brokers, superseding the 2024 master circular in full. The tenant is a registered stock broker and trading member of NSE and BSE, so the entire instrument applies — all nine chapters, registration through cyber. This is the founding document of the register: the initial-ingest pipeline extracted the complete base obligation set (OBL-SB-001 through OBL-SB-023) from this catch, each grounded to its paragraph, and every subsequent catch is evaluated as a delta against it.",
      citedText:
        "This Master Circular supersedes the Master Circular for Stock Brokers dated May 22, 2024, and consolidates all circulars and directions issued to stock brokers as on the date of issuance.",
      confidence: 0.99,
    },
    triggeredRunId: "RUN-041",
  },
];
