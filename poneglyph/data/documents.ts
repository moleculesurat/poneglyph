import type { CompanyDocument, DocumentRequirement } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Document requirements & the firm's document set — how the engine
   LEARNS the company.

   The product idea lives here. A licence does not determine what a firm
   owes; the firm's *profile* does. Every requirement below carries a
   `triggeredBy` string naming the profile fact that made the engine ask,
   and a `clauseRef` naming the provision behind the ask. Two brokers
   holding the same registration certificate walk out of onboarding with
   different requirement sets — and the engine files the reasoning for
   both the asks and the non-asks.

   ── WHAT IS REAL ────────────────────────────────────────────────────
   Only the public, checkable facts about Angel One Limited: identity,
   listing (ISIN INE732I01021 · NSE ANGELONE · BSE 543235), net worth,
   revenue, net profit, reported client base and NSE market share. These
   appear as extracted fields on DOC-015 and are sourced to reconciled
   XBRL filings and the June 2026 business update.

   ── WHAT IS SIMULATED ───────────────────────────────────────────────
   Every document's *contents* — file names, page counts, versions,
   audit periods, finding counts, validity windows, upload trail and all
   operational extractions. These are ILLUSTRATIVE and are NOT assertions
   about Angel One's actual documents or actual compliance. No real
   filing text is reproduced; no registration number beyond the publicly
   displayed INZ000161534 appears anywhere; no GIIN, member code or
   inspection finding is invented. Uploaders are the sandbox compliance
   team, not Angel One employees.

   ── COUNTS ──────────────────────────────────────────────────────────
   28 requirements. 26 were RAISED as asks (DOC-REQ-001…026); 2 were
   evaluated and NOT raised (DOC-REQ-027, 028) — the engine records why
   it did not ask, which matters as much as why it did.
   Of the 26 asks: 14 verified · 4 received · 2 expired · 6 required.
   22 documents: 14 verified · 4 received · 2 expired · 2 waived.
   The 6 `required` asks have no document at all — that is the gap.

   ── COVERAGE AFTER THE CORPUS PASS ──────────────────────────────────
   RUN-049 extracted the Part IV, V, VI, IX and X chapters the base pass
   never reached, so requirements that previously pointed at the nearest
   adjacent obligation now point at the real one. Two of the obligations
   it raised are gaps, and both are reachable from an open ask: the algo
   approvals-and-identifier duty from DOC-REQ-017, the outsourcing policy
   duty from DOC-REQ-023. No requirement was added — every new obligation
   already had an ask that could carry it.

   ── CLAUSE CITATION CONVENTION ──────────────────────────────────────
   Where `data/corpus.ts` carries the provision, the excerpt is quoted
   from it verbatim and the para number matches (4.1, 26.2, 46.4, 61.1,
   72.3, 73.1, 101.1 …). Where it does not, the para is the subject
   number from the Master Circular's table of contents (16, 18, 42, 60,
   61, 82, 92, 93 …) and the excerpt names the subject rather than
   quoting text the sandbox does not hold.

   Sim-today is 2026-07-12. Anything with `validUntil` before that date
   is expired by construction and stays expired forever.
   ══════════════════════════════════════════════════════════════════════ */

/* ── The requirement matrix ────────────────────────────────────────── */

export const documentRequirements: DocumentRequirement[] = [
  /* ── Part I · Registration of Stock Brokers ──────────────────────── */
  {
    id: "DOC-REQ-001",
    name: "SEBI certificate of registration — stock broker",
    description:
      "The certificate of registration granted under the SEBI (Stock Brokers) Regulations. Until it is supplied and signed off, the registration number displayed on the firm's website is a declared fact and nothing in the register can be traced to a verified licence.",
    category: "registration",
    part: "I",
    chapter: "registration",
    triggeredBy:
      "Registration line declared as INZ000161534 (stock broker) — public display, unverified until the certificate is on file",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "1",
      excerpt:
        "Registration of stock brokers — a single registration is granted across recognised stock exchanges and segments, and the certificate of registration shall be displayed by the stock broker.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-001", "OBL-SB-002", "OBL-SB-003"],
    acceptedFormats: ["PDF"],
    refreshCadence: "On any modification to the certificate",
  },
  {
    id: "DOC-REQ-002",
    name: "Exchange membership certificates (NSE, BSE)",
    description:
      "Trading membership certificates for each recognised stock exchange on whose platform the firm deals. The set determines which exchange-facing filings, inspections and approvals bind the firm.",
    category: "registration",
    part: "I",
    chapter: "registration",
    triggeredBy: "Profile exchanges: NSE and BSE",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "2",
      excerpt:
        "Membership of stock exchange — a stock broker shall be admitted as a trading member of each recognised stock exchange on whose platform it deals, and shall comply with the byelaws of that exchange.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-001", "OBL-SB-014", "OBL-SB-020"],
    acceptedFormats: ["PDF", "JPG"],
  },
  {
    id: "DOC-REQ-003",
    name: "Certificate of incorporation with MoA and AoA",
    description:
      "Constitutional documents of the applicant. Establishes that the applicant is a body corporate, fixes the jurisdiction of incorporation, and confirms the objects clause permits securities-market intermediation.",
    category: "constitutional",
    part: "I",
    chapter: "registration",
    triggeredBy: "Applicant constitution: body corporate incorporated in India",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "6",
      excerpt:
        "Corporate entities — where the applicant is a body corporate, the memorandum and articles of association shall permit the applicant to carry on the business of a stock broker.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-002", "OBL-SB-003"],
    acceptedFormats: ["PDF"],
    refreshCadence: "On amendment of the MoA or AoA",
  },

  /* ── Part II · Supervision & Oversight ───────────────────────────── */
  {
    id: "DOC-REQ-004",
    name: "QSB designation intimation from the exchange",
    description:
      "The exchange's written intimation that the firm has been designated a Qualified Stock Broker. The engine computed the designation from the firm's own parameters; the intimation is what turns a computed designation into a verified one, and it dates the enhanced obligations.",
    category: "registration",
    part: "II",
    chapter: "supervision",
    triggeredBy:
      "Computed QSB parameters: approx. 6.76 million NSE active clients derived from a 14.79% share of NSE's 4.57 crore active base",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "18",
      excerpt:
        "Framework for Qualified Stock Brokers — stock brokers designated as QSBs shall discharge enhanced obligations and responsibilities in governance, risk management, cyber resilience and investor grievance redressal.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-013", "OBL-SB-015", "OBL-SB-021", "OBL-SB-023"],
    acceptedFormats: ["PDF"],
    refreshCadence: "Annual — the exchange republishes the QSB list each financial year",
  },
  {
    id: "DOC-REQ-005",
    name: "Annual system audit report",
    description:
      "System audit carried out annually against the exchange-prescribed terms of reference. The applicable ToR varies by broker type — a firm running algorithmic trading and internet-based trading is audited against a wider scope than one that does not.",
    category: "audit",
    part: "II",
    chapter: "supervision",
    triggeredBy: "Part II item 16 — annual system audit binds every trading member",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "16",
      excerpt:
        "Annual system audit — every stock broker shall carry out an annual system audit in accordance with the terms of reference specified by the stock exchanges, through an auditor of the prescribed category.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-019", "OBL-SB-021", "OBL-SB-023", "OBL-SB-024", "OBL-SB-033"],
    acceptedFormats: ["PDF"],
    refreshCadence: "Annual",
  },
  {
    id: "DOC-REQ-006",
    name: "Half-yearly internal audit report",
    description:
      "Complete internal audit by an independent chartered accountant or company secretary, placed before the board and submitted to the exchange.",
    category: "audit",
    part: "II",
    chapter: "supervision",
    triggeredBy: "Stock broker registration — half-yearly internal audit binds all brokers",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "61.1",
      excerpt:
        "Every stock broker shall carry out a complete internal audit on a half-yearly basis by an independent qualified chartered accountant or company secretary, and the report thereof shall be placed before the board of the stock broker and submitted to the stock exchange.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-013", "OBL-SB-014", "OBL-SB-018"],
    acceptedFormats: ["PDF"],
    refreshCadence: "Half-yearly",
  },
  {
    id: "DOC-REQ-007",
    name: "Client securities reconciliation and Early Warning Mechanism records",
    description:
      "Reconciliation of client securities against depository statements, together with the records fed into the Early Warning Mechanism operated to detect diversion of client securities.",
    category: "operational",
    part: "II",
    chapter: "supervision",
    triggeredBy: "Part II item 17 — applies to brokers holding client securities",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "17",
      excerpt:
        "Early Warning Mechanism — to prevent diversion of client securities, stock exchanges and depositories shall share information and stock brokers shall furnish the prescribed data on client securities holdings.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-004", "OBL-SB-006", "OBL-SB-007"],
    acceptedFormats: ["PDF", "XLSX", "CSV"],
    refreshCadence: "Monthly reconciliation",
  },

  /* ── Part III · Dealings with Client ─────────────────────────────── */
  {
    id: "DOC-REQ-008",
    name: "Client account opening kit with Rights and Obligations document",
    description:
      "The standard account opening set issued to every client: Rights and Obligations, Risk Disclosure Document, nomination or opt-out form, and the KRA linkage that precedes activation.",
    category: "operational",
    part: "III",
    chapter: "client-dealings",
    triggeredBy: "Retail client dealing at scale — 3.86 crore reported client base",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "30.3",
      excerpt:
        "No stock broker shall onboard a client without completing the Know Your Client process through a KYC Registration Agency, carrying out risk profiling of the client, and executing the prescribed account-opening documentation.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-007", "OBL-SB-008", "OBL-SB-009"],
    acceptedFormats: ["PDF"],
    refreshCadence: "On any modification to the standard kit",
  },
  {
    id: "DOC-REQ-009",
    name: "Running account settlement policy and settlement register",
    description:
      "Board-approved policy setting the client's 30-day or 90-day settlement preference, plus the register evidencing that actual settlement of funds took place within the elected cycle.",
    category: "policy",
    part: "III",
    chapter: "client-dealings",
    triggeredBy: "Part III item 47 — applies to brokers holding client funds in a running account",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "26.2",
      excerpt:
        "The actual settlement of funds of the running account shall be done by the stock broker at least once within a gap of thirty or ninety days between two settlements, as per the preference of the client, and a statement of accounts shall be sent to the client on the date of settlement.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-005", "OBL-SB-006"],
    acceptedFormats: ["PDF", "XLSX"],
    refreshCadence: "Quarterly settlement cycle; policy reviewed annually",
  },
  {
    id: "DOC-REQ-010",
    name: "Margin Trading Facility policy and daily reporting",
    description:
      "Board-approved MTF policy with the daily exposure reporting filed with the exchange. Asked only because the profile carries the margin-trading-facility segment — a broker without MTF is never asked for this.",
    category: "policy",
    part: "III",
    chapter: "margin",
    triggeredBy: "Segment detected: margin-trading-facility",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "44",
      excerpt:
        "Margin Trading Facility — a stock broker offering the facility shall frame a board-approved policy setting out the terms, the securities eligible for funding and the sources of funds, and shall report its MTF exposure to the stock exchange daily.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-010", "OBL-SB-011", "OBL-SB-012"],
    acceptedFormats: ["PDF", "XLSX"],
    refreshCadence: "Daily reporting; policy reviewed annually",
  },
  {
    id: "DOC-REQ-011",
    name: "Client collateral segregation and monitoring reports",
    description:
      "Client-level segregation and monitoring of collateral, reported to the exchange, with the pledge and re-pledge register reconciled against the depository.",
    category: "operational",
    part: "III",
    chapter: "margin",
    triggeredBy: "Part III item 42 — collateral held at client level",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "42",
      excerpt:
        "Segregation and monitoring of collateral at client level — stock brokers shall report client-level allocation of collateral in the prescribed file format and shall not use the collateral of one client for another.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-004", "OBL-SB-010", "OBL-SB-012"],
    acceptedFormats: ["PDF", "XLSX", "CSV"],
    refreshCadence: "Daily",
  },
  {
    id: "DOC-REQ-012",
    name: "Board-approved unpaid securities policy (CUSPA)",
    description:
      "Policy on handling clients' unpaid securities under the amended Para 46 regime, which may not permit a payment window exceeding five trading days from pay-out. The ask did not exist nine days ago; the Jul 3, 2026 amendment created it.",
    category: "policy",
    part: "III",
    chapter: "unpaid-securities",
    triggeredBy:
      "Amendment: Para 46 as amended on 3 Jul 2026 (CUSPA pledge-based mechanism) — caught by the watchtower, mapped by RUN-047",
    clauseRef: {
      circularId: "CIRC-CUSPA-2026",
      para: "46.4",
      excerpt:
        "The trading member shall frame a policy on handling of clients' unpaid securities, approved by its board, which shall in no case permit a payment window exceeding five trading days from the date of pay-out.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-104", "OBL-SB-105", "OBL-SB-108", "OBL-SB-110"],
    acceptedFormats: ["PDF"],
    refreshCadence: "Annual board review",
  },
  {
    id: "DOC-REQ-013",
    name: "DDPI specimen and client authorisation log",
    description:
      "Specimen Demat Debit and Pledge Instruction with the log of client authorisations, evidencing that no power of attorney is taken over client demat accounts.",
    category: "operational",
    part: "III",
    chapter: "client-dealings",
    triggeredBy: "Part III item 36 — broker takes client authorisation over demat for pay-in and pledge",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "28.1",
      excerpt:
        "Stock brokers shall not obtain a power of attorney for the operation of client demat accounts and shall use only the Demat Debit and Pledge Instruction (DDPI) for the limited purposes specified, executed with the explicit consent of the client.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-007"],
    acceptedFormats: ["PDF"],
    refreshCadence: "On any modification to the specimen",
  },

  /* ── Part IV · Technology Related Provisions ─────────────────────── */
  {
    id: "DOC-REQ-014",
    name: "Cyber Security and Cyber Resilience policy (CSCRF)",
    description:
      "Board-approved cyber security and cyber resilience policy written to the CSCRF. The depth demanded scales with the grade — a self-certification entity and a Qualified RE are not asked for the same document.",
    category: "policy",
    part: "IV",
    chapter: "cyber",
    triggeredBy: "CSCRF grade computed as Qualified Regulated Entity",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "60",
      excerpt:
        "Cyber Security and Cyber Resilience Framework (CSCRF) for SEBI Regulated Entities — regulated entities shall adopt the framework, graded by entity size, and shall put in place a board-approved cyber security and cyber resilience policy.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-021", "OBL-SB-022", "OBL-SB-023"],
    acceptedFormats: ["PDF"],
    refreshCadence: "Annual board review",
  },
  {
    id: "DOC-REQ-015",
    name: "VAPT report with finding closure evidence",
    description:
      "Vulnerability assessment and penetration testing of critical systems, with closure of findings and re-validation of that closure within the CSCRF timelines.",
    category: "audit",
    part: "IV",
    chapter: "cyber",
    triggeredBy: "CSCRF — VAPT of critical systems binds every regulated entity, at a periodicity set by grade",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "101.1",
      excerpt:
        "Regulated entities shall conduct a comprehensive vulnerability assessment and penetration testing (VAPT) of their critical systems at the prescribed periodicity, and shall close the findings thereof and carry out a re-validation of the closure within the timelines specified in the Cybersecurity and Cyber Resilience Framework.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-021"],
    acceptedFormats: ["PDF"],
    refreshCadence: "Annual",
  },
  {
    id: "DOC-REQ-016",
    name: "Security Operations Centre arrangement evidence",
    description:
      "Evidence of the SOC arrangement — own, group or third-party managed — with its coverage and board reporting cadence. Asked because the computed CSCRF grade is Qualified RE; a smaller entity may instead onboard the Market SOC.",
    category: "operational",
    part: "IV",
    chapter: "cyber",
    triggeredBy: "CSCRF grade: Qualified RE — own, group or third-party SOC required",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "60",
      excerpt:
        "Cyber Security and Cyber Resilience Framework (CSCRF) — regulated entities shall have continuous security monitoring through a Security Operations Centre, of a type commensurate with the entity's grade under the framework.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-022", "OBL-SB-023"],
    acceptedFormats: ["PDF"],
    refreshCadence: "Annual attestation, aligned to the engagement term",
  },
  {
    id: "DOC-REQ-017",
    name: "Algorithmic trading approvals and strategy inventory",
    description:
      "Exchange approvals for each algorithm offered or used, with the current inventory of live strategies and their unique identifiers. Asked only because the profile carries the algo-trading segment. Two Part IV obligations hang off it: the approval-and-identifier duty itself, which the register carries as a gap for want of this document, and the pre-trade risk gate on the order paths those strategies route through.",
    category: "operational",
    part: "IV",
    chapter: "technology",
    triggeredBy: "Segment detected: algo-trading",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "62",
      excerpt:
        "Algorithmic trading — every algorithm shall be approved by the stock exchange and tagged with a unique identifier, and stock brokers shall maintain an inventory of approved algorithms along with the approvals obtained.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-025", "OBL-SB-026"],
    acceptedFormats: ["PDF", "XLSX"],
    refreshCadence: "On each new strategy approval; annual inventory attestation",
  },
  {
    id: "DOC-REQ-018",
    name: "AI/ML systems reporting form (Annexure-26)",
    description:
      "Quarterly reporting of artificial intelligence and machine learning applications offered to or used for clients, in the prescribed format. The register still carries no AI/ML obligation of its own — the ask precedes the obligation, which is the point of it. What it now blocks is Part X: the Annexure-26 return is one of the periodic returns the consolidated quarterly report has to account for, so the consolidated filing cannot be verified complete while this one is outstanding. It reaches no further than that — the onboarding answer put no order-handling model in production, so nothing here touches the algorithmic-trading approvals.",
    category: "operational",
    part: "IV",
    chapter: "technology",
    triggeredBy: "Part IV item 61 — AI/ML applications offered to clients in the securities market",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "61",
      excerpt:
        "Reporting for artificial intelligence and machine learning applications — stock brokers offering or using AI or ML based products, services or solutions shall report the prescribed particulars in Annexure-26 on a quarterly basis.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-032"],
    acceptedFormats: ["PDF", "XLSX"],
    refreshCadence: "Quarterly",
  },

  /* ── Part V · Change in Status, Constitution, Control, Affiliation ─ */
  {
    id: "DOC-REQ-019",
    name: "Shareholding pattern and change-in-control approvals",
    description:
      "Quarterly shareholding pattern as filed with the exchanges, together with any prior approval obtained for a change in control. Asked in this form because the entity is listed — an unlisted broker is asked for its share register instead. Both limbs of Part V sit in the register behind this ask: the periodic return, which carries bound evidence, and the prior-approval gate, which carries none and stays an agent-proposed mapping until the compliance officer rules on it.",
    category: "constitutional",
    part: "V",
    chapter: "change-control",
    triggeredBy: "Listed entity — ISIN INE732I01021, NSE: ANGELONE, BSE: 543235",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "66",
      excerpt:
        "Change in control — prior approval of the Board shall be obtained for any change in control of the stock broker, and changes in status or constitution shall be reported periodically to the stock exchanges.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-001", "OBL-SB-002", "OBL-SB-003", "OBL-SB-027", "OBL-SB-028"],
    acceptedFormats: ["PDF", "XML"],
    refreshCadence: "Quarterly",
  },

  /* ── Part VI · FATCA ─────────────────────────────────────────────── */
  {
    id: "DOC-REQ-020",
    name: "FATCA and CRS registration record",
    description:
      "Registration record and classification under the Inter-Governmental Agreement with the USA and the Multilateral Competent Authority Agreement, with the due-diligence procedure applied at account opening.",
    category: "registration",
    part: "VI",
    chapter: "fatca",
    triggeredBy:
      "Financial institution status under the India–US IGA — the firm holds client securities and is a reporting financial institution",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "69",
      excerpt:
        "Foreign Accounts Tax Compliance Act — registered intermediaries shall register with the US Internal Revenue Service under the Inter-Governmental Agreement and shall carry out the prescribed due diligence and reporting.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-008", "OBL-SB-029"],
    acceptedFormats: ["PDF"],
    refreshCadence: "Annual reporting cycle",
  },

  /* ── Part VII · Investor Grievance Redressal ─────────────────────── */
  {
    id: "DOC-REQ-021",
    name: "Investor Charter with complaint disclosure and SCORES record",
    description:
      "The Investor Charter as displayed, the monthly complaint disclosure table, and evidence of an active SCORES registration through which complaints are resolved within twenty-one days.",
    category: "operational",
    part: "VII",
    chapter: "grievance",
    triggeredBy: "Part VII items 72–74 — investor-facing disclosures bind every registered broker",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "72.3",
      excerpt:
        "Every stock broker shall prominently display the Investor Charter and the data on complaints received and their disposal on its website, and shall bring the Investor Charter to the notice of its clients.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-015", "OBL-SB-016"],
    acceptedFormats: ["PDF"],
    refreshCadence: "Monthly complaint disclosure; charter reviewed annually",
  },
  {
    id: "DOC-REQ-022",
    name: "ODR platform enrolment record",
    description:
      "Enrolment on the Online Dispute Resolution portal, with the designated nodal officer and the linkage published on the firm's grievance page.",
    category: "operational",
    part: "VII",
    chapter: "grievance",
    triggeredBy: "Part VII item 73 — ODR enrolment binds every stock broker",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "73.1",
      excerpt:
        "Every stock broker shall enrol on the Online Dispute Resolution (ODR) portal and shall facilitate resolution of disputes with its clients through the ODR mechanism in the manner prescribed.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-017"],
    acceptedFormats: ["PDF"],
  },

  /* ── Part IX · Miscellaneous ─────────────────────────────────────── */
  {
    id: "DOC-REQ-023",
    name: "Outsourcing policy and vendor register",
    description:
      "Board-approved outsourcing policy with the register of vendors, the activities outsourced to each, and confirmation that no core activity has been outsourced. The corpus pass put the outsourcing duty into the register; nothing verifies it, because this document has not arrived — so it is carried as a gap rather than assumed from the vendor arrangements the engine can already see.",
    category: "policy",
    part: "IX",
    chapter: "outsourcing",
    triggeredBy: "Part IX item 82 — outsourcing by intermediaries",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "82",
      excerpt:
        "Outsourcing by intermediaries — core business activities and compliance functions shall not be outsourced, and intermediaries shall have a board-approved outsourcing policy together with a register of the activities outsourced and the service providers engaged.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-018", "OBL-SB-023", "OBL-SB-030"],
    acceptedFormats: ["PDF", "XLSX"],
    refreshCadence: "Annual board review",
  },
  {
    id: "DOC-REQ-024",
    name: "Conflicts of interest policy",
    description:
      "Policy and internal procedures to identify, avoid and disclose conflicts of interest, covering research, distribution, proprietary trading and employee dealing.",
    category: "policy",
    part: "IX",
    chapter: "outsourcing",
    triggeredBy: "Part IX item 83 — conflicts of interest of intermediaries and their associates",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "83",
      excerpt:
        "Conflict of interest — intermediaries shall lay down policies and internal procedures to identify and avoid or deal with conflicts of interest, and shall disclose to clients any conflict that cannot be avoided.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-002", "OBL-SB-020", "OBL-SB-031"],
    acceptedFormats: ["PDF"],
    refreshCadence: "Annual board review",
  },
  {
    id: "DOC-REQ-025",
    name: "Upstreaming of client funds — daily reports",
    description:
      "Daily reports evidencing end-of-day upstreaming of client funds to the clearing corporations in the permitted instruments, with exceptions listed.",
    category: "operational",
    part: "IX",
    chapter: "books-records",
    triggeredBy: "Part IX item 92 — the firm holds client funds",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "92",
      excerpt:
        "Upstreaming of client funds — SEBI registered intermediaries shall upstream all client funds to the clearing corporations on an end-of-day basis, in cash, fixed deposits or units of overnight mutual fund schemes, in the manner prescribed.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-004", "OBL-SB-005"],
    acceptedFormats: ["PDF", "XLSX", "CSV"],
    refreshCadence: "Daily",
  },

  /* ── Part X · Reporting Requirements ─────────────────────────────── */
  {
    id: "DOC-REQ-026",
    name: "Consolidated quarterly reporting form (Annexure-28)",
    description:
      "The consolidated periodic report owed to the exchanges and to SEBI in the prescribed format, which carries net worth, margin, audit and grievance particulars in a single filing.",
    category: "operational",
    part: "X",
    chapter: "reporting",
    triggeredBy: "Part X — consolidated reporting binds every registered stock broker",
    clauseRef: {
      circularId: "MC-SB-2025",
      para: "93",
      excerpt:
        "Reporting requirements — stock brokers shall submit the consolidated periodic report in the format at Annexure-28 to the stock exchanges within the timelines specified.",
    },
    mandatory: true,
    unlocks: ["OBL-SB-001", "OBL-SB-013", "OBL-SB-015", "OBL-SB-032"],
    acceptedFormats: ["PDF", "XLSX"],
    refreshCadence: "Quarterly",
  },

  /* ── Evaluated and NOT raised ────────────────────────────────────────
     The registration scan walks every SEBI intermediary category and
     records the ones that produced no ask. A firm should be able to see
     what it was NOT asked for, and why — an unrecorded non-ask is
     indistinguishable from an oversight. Both carry `mandatory: false`
     and resolve to a waived document record. */
  {
    id: "DOC-REQ-027",
    name: "Portfolio management activity report",
    description:
      "Half-yearly activity and client-assets report required of a SEBI-registered Portfolio Manager. Evaluated during the registration scan and not raised — the profile carries no Portfolio Manager registration.",
    category: "registration",
    part: "I",
    chapter: "registration",
    triggeredBy:
      "Registration scan: no SEBI Portfolio Manager registration found in the profile supplied (registrations on file are stock broker, depository participant and research analyst)",
    mandatory: false,
    unlocks: [],
    acceptedFormats: ["PDF"],
  },
  {
    id: "DOC-REQ-028",
    name: "Mutual fund scheme compliance certificate",
    description:
      "Scheme-level compliance certificate and expense-ratio disclosure required of an asset management company. Evaluated during the registration scan and not raised — the mutual fund business is carried on by a separate legal entity, which is not the entity onboarded here.",
    category: "registration",
    part: "I",
    chapter: "registration",
    triggeredBy:
      "Registration scan: no AMC or mutual fund registration held by this legal entity — the same basis on which CATCH-004 (AMC disclosure circular) was ruled not-applicable",
    mandatory: false,
    unlocks: [],
    acceptedFormats: ["PDF"],
  },
];

/* ── The firm's document set ───────────────────────────────────────────
   One record per requirement that has been answered. The six requirements
   with no record here — DOC-REQ-004, 012, 017, 018, 023, 026 — are the
   open gaps. Extractions are what the engine read; every extraction is a
   claim the compliance officer can reject, and anything below 0.75
   confidence lands in the human-review queue by construction. */

export const companyDocuments: CompanyDocument[] = [
  {
    id: "DOC-001",
    requirementId: "DOC-REQ-001",
    name: "SEBI certificate of registration — stock broker",
    category: "registration",
    status: "received",
    fileName: "sebi-cor-stock-broker-INZ000161534.pdf",
    pages: 2,
    uploadedAt: "2026-06-24T10:12:00+05:30",
    uploadedBy: "Gayatri Jaiswal",
    hash: "3c81f0a7d452",
    extracted: [
      {
        field: "Registration number",
        value: "INZ000161534",
        confidence: 0.97,
        locator: "p.1, header block",
      },
      {
        field: "Registered entity",
        value: "Angel One Limited",
        confidence: 0.98,
        locator: "p.1, grantee line",
      },
      {
        field: "Registration category",
        value: "Stock Broker",
        confidence: 0.96,
        locator: "p.1, category line",
      },
      {
        field: "Recognised stock exchanges named",
        value: "National Stock Exchange of India Limited; BSE Limited",
        confidence: 0.88,
        locator: "p.1, schedule",
      },
      {
        field: "Validity",
        value: "Permanent, subject to payment of fees and continued compliance",
        confidence: 0.72,
        locator: "p.2, conditions block — clause wording did not parse cleanly",
      },
    ],
    supportsObligations: ["OBL-SB-001", "OBL-SB-002", "OBL-SB-003"],
    notes:
      "Parsed and held at `received`. Until the compliance officer signs off, INZ000161534 stays a declared fact in the entity profile — the engine will not promote a number to verified on its own reading.",
  },
  {
    id: "DOC-002",
    requirementId: "DOC-REQ-002",
    name: "Exchange membership certificates — NSE and BSE",
    category: "registration",
    status: "verified",
    fileName: "exchange-membership-nse-bse.pdf",
    pages: 6,
    uploadedAt: "2026-05-11T15:37:00+05:30",
    uploadedBy: "Rohan Iyer",
    hash: "a70d2be6194f",
    extracted: [
      {
        field: "Exchange 1",
        value: "National Stock Exchange of India Limited — trading member",
        confidence: 0.93,
        locator: "p.1",
      },
      {
        field: "Exchange 2",
        value: "BSE Limited — trading member",
        confidence: 0.91,
        locator: "p.4",
      },
      {
        field: "Clearing arrangement",
        value: "Cleared through the respective clearing corporations of each exchange",
        confidence: 0.79,
        locator: "p.5, annexure",
      },
      {
        field: "Certificates in the bundle",
        value: "2",
        confidence: 0.99,
        locator: "document structure",
      },
    ],
    supportsObligations: ["OBL-SB-001", "OBL-SB-014", "OBL-SB-020"],
    notes:
      "Member codes are not captured in the sandbox. The exchange set is what the engine needs — it is what decides which exchange-facing filings appear in the register.",
  },
  {
    id: "DOC-003",
    requirementId: "DOC-REQ-003",
    name: "Certificate of incorporation with MoA and AoA",
    category: "constitutional",
    status: "verified",
    fileName: "coi-moa-aoa.pdf",
    pages: 48,
    uploadedAt: "2026-02-17T12:04:00+05:30",
    uploadedBy: "Gayatri Jaiswal",
    hash: "e5b391cd7a08",
    extracted: [
      { field: "Legal name", value: "Angel One Limited", confidence: 0.99, locator: "p.1" },
      {
        field: "Constitution",
        value: "Public limited company incorporated in India",
        confidence: 0.94,
        locator: "p.1",
      },
      {
        field: "Registered office jurisdiction",
        value: "Mumbai, Maharashtra",
        confidence: 0.92,
        locator: "p.2",
      },
      {
        field: "Objects clause",
        value: "Main objects include dealing in securities as a member of recognised stock exchanges",
        confidence: 0.87,
        locator: "MoA, Clause III(A)",
      },
      {
        field: "Articles",
        value: "Permit issue and listing of equity shares on recognised stock exchanges",
        confidence: 0.83,
        locator: "AoA, Part II",
      },
    ],
    supportsObligations: ["OBL-SB-002", "OBL-SB-003"],
  },
  {
    id: "DOC-004",
    requirementId: "DOC-REQ-005",
    name: "Annual system audit report — FY2025-26",
    category: "audit",
    status: "verified",
    fileName: "annual-system-audit-fy2025-26.pdf",
    pages: 132,
    uploadedAt: "2026-06-02T18:22:00+05:30",
    uploadedBy: "Dev Khanna",
    validFrom: "2026-05-30",
    validUntil: "2027-06-30",
    hash: "1d64ac9b03fe",
    extracted: [
      {
        field: "Audit period",
        value: "01-Apr-2025 to 31-Mar-2026",
        confidence: 0.96,
        locator: "p.3, scope statement",
      },
      {
        field: "Terms of reference applied",
        value:
          "Exchange ToR for trading members running algorithmic trading and internet-based trading",
        confidence: 0.89,
        locator: "p.4, ToR mapping table",
      },
      {
        field: "Auditor category",
        value: "CERT-In empanelled auditor",
        confidence: 0.93,
        locator: "p.2, auditor declaration",
      },
      {
        field: "Systems in scope",
        value: "Order management, risk management, algo engine, internet trading platform",
        confidence: 0.85,
        locator: "p.6, system inventory",
      },
      {
        field: "Observations",
        value: "18 raised, 16 closed, 2 open (both graded medium)",
        confidence: 0.9,
        locator: "p.118, closure summary",
      },
    ],
    supportsObligations: ["OBL-SB-019", "OBL-SB-021", "OBL-SB-023", "OBL-SB-024", "OBL-SB-033"],
    notes:
      "The ToR line is the interesting extraction: it is the audit scope that the algo-trading segment forced, and it is why DOC-REQ-017 was raised. Filing this report with the exchange is a separate Part X duty from performing the audit — the report is here, the submission acknowledgement is not, which is why that obligation stays an agent-proposed mapping rather than a met one.",
  },
  {
    id: "DOC-005",
    requirementId: "DOC-REQ-006",
    name: "Internal audit report — H2 FY2025-26",
    category: "audit",
    status: "verified",
    fileName: "internal-audit-h2-fy2025-26.pdf",
    pages: 64,
    uploadedAt: "2026-05-04T11:09:00+05:30",
    uploadedBy: "Priya Nair",
    validFrom: "2026-04-28",
    validUntil: "2026-10-31",
    hash: "b209e4f7c831",
    extracted: [
      {
        field: "Audit half",
        value: "October 2025 to March 2026",
        confidence: 0.97,
        locator: "p.1, cover",
      },
      {
        field: "Auditor",
        value: "Independent chartered accountant firm, not the statutory auditor",
        confidence: 0.9,
        locator: "p.2, engagement letter extract",
      },
      {
        field: "Board placement",
        value: "Placed before the board on 28-Apr-2026",
        confidence: 0.92,
        locator: "p.3, covering note",
      },
      {
        field: "Exchange submission",
        value: "Acknowledgement enclosed",
        confidence: 0.86,
        locator: "p.63, annexure",
      },
      {
        field: "Observations",
        value: "9 raised, 9 closed",
        confidence: 0.9,
        locator: "p.58, observation register",
      },
    ],
    supportsObligations: ["OBL-SB-013", "OBL-SB-014", "OBL-SB-018"],
    notes:
      "Half-yearly cadence. The next report covering Apr-Sep 2026 is due by 31-Oct-2026; the engine will flip this record to expired on that date without being told.",
  },
  {
    id: "DOC-006",
    requirementId: "DOC-REQ-007",
    name: "Client securities reconciliation and Early Warning records — June 2026",
    category: "operational",
    status: "received",
    fileName: "client-securities-reconciliation-jun-2026.xlsx",
    uploadedAt: "2026-07-03T09:51:00+05:30",
    uploadedBy: "Rohan Iyer",
    hash: "62fa17c9de40",
    extracted: [
      {
        field: "Reconciliation date",
        value: "30-Jun-2026",
        confidence: 0.95,
        locator: "sheet 1, header row",
      },
      {
        field: "Client securities vs depository statement",
        value: "Reconciled, no unexplained difference in the reported period",
        confidence: 0.88,
        locator: "sheet 1, summary block",
      },
      {
        field: "Early Warning Mechanism upload reference",
        value: "Reference present but not machine-readable in the supplied sheet",
        confidence: 0.69,
        locator: "sheet 3, footer — flagged for human review",
      },
      {
        field: "Holding statement basis",
        value: "Depository statement pulled at end of day, client-level",
        confidence: 0.84,
        locator: "sheet 2, method note",
      },
    ],
    supportsObligations: ["OBL-SB-004", "OBL-SB-006", "OBL-SB-007"],
    notes:
      "Three sheets. Held at `received` because the Early Warning upload reference fell below the review threshold — the engine will not claim a control it could not read.",
  },
  {
    id: "DOC-007",
    requirementId: "DOC-REQ-008",
    name: "Client account opening kit with Rights and Obligations",
    category: "operational",
    status: "verified",
    fileName: "account-opening-kit-v9-2.pdf",
    pages: 86,
    uploadedAt: "2026-03-09T16:45:00+05:30",
    uploadedBy: "Rohan Iyer",
    validFrom: "2026-02-01",
    hash: "8ce140b7a2d9",
    extracted: [
      {
        field: "Kit version",
        value: "9.2, effective 01-Feb-2026",
        confidence: 0.94,
        locator: "p.1, version block",
      },
      {
        field: "Rights and Obligations document",
        value: "Present, exchange-prescribed format",
        confidence: 0.96,
        locator: "p.11",
      },
      {
        field: "Risk Disclosure Document",
        value: "Present",
        confidence: 0.95,
        locator: "p.29",
      },
      {
        field: "Nomination / opt-out form",
        value: "Present, both options offered",
        confidence: 0.93,
        locator: "p.44",
      },
      {
        field: "KRA linkage",
        value: "KYC uploaded to a KYC Registration Agency before account activation",
        confidence: 0.86,
        locator: "p.7, process note",
      },
    ],
    supportsObligations: ["OBL-SB-007", "OBL-SB-008", "OBL-SB-009"],
  },
  {
    id: "DOC-008",
    requirementId: "DOC-REQ-009",
    name: "Running account settlement policy and settlement register",
    category: "policy",
    status: "verified",
    fileName: "running-account-settlement-policy-and-register.pdf",
    pages: 41,
    uploadedAt: "2026-02-04T10:28:00+05:30",
    uploadedBy: "Rohan Iyer",
    validFrom: "2026-01-30",
    validUntil: "2027-01-31",
    hash: "47ab6ec2f503",
    extracted: [
      {
        field: "Settlement preference options offered",
        value: "30-day and 90-day, elected by the client",
        confidence: 0.95,
        locator: "p.4, clause 3",
      },
      {
        field: "Latest settlement cycle executed",
        value: "Quarter ended 30-Jun-2026",
        confidence: 0.9,
        locator: "register, p.22",
      },
      {
        field: "Statement of accounts despatch",
        value: "Issued to the client on the settlement date",
        confidence: 0.88,
        locator: "p.6, clause 7",
      },
      {
        field: "Board approval",
        value: "Approved by the board on 30-Jan-2026",
        confidence: 0.92,
        locator: "p.2, approval page",
      },
    ],
    supportsObligations: ["OBL-SB-005", "OBL-SB-006"],
  },
  {
    id: "DOC-009",
    requirementId: "DOC-REQ-010",
    name: "Margin Trading Facility policy and daily reporting — June 2026",
    category: "policy",
    status: "received",
    fileName: "mtf-policy-and-daily-reporting-jun-2026.pdf",
    pages: 27,
    uploadedAt: "2026-07-07T14:16:00+05:30",
    uploadedBy: "Rohan Iyer",
    hash: "d3f70a5c9e21",
    extracted: [
      {
        field: "Facility",
        value: "Margin Trading Facility offered under the exchange framework",
        confidence: 0.93,
        locator: "p.1",
      },
      {
        field: "Policy version",
        value: "4.0, board approved",
        confidence: 0.89,
        locator: "p.2, approval page",
      },
      {
        field: "Daily exposure reporting",
        value: "Filed with the exchange on every trading day in the reported month",
        confidence: 0.84,
        locator: "p.14, filing log",
      },
      {
        field: "Funding source disclosure",
        value: "Sources of funds for the facility disclosed in the policy",
        confidence: 0.79,
        locator: "p.9, clause 11",
      },
    ],
    supportsObligations: ["OBL-SB-010", "OBL-SB-011", "OBL-SB-012"],
    notes:
      "Awaiting the compliance officer's sign-off. The MTF segment is what raised this ask; withdraw the segment from the profile and the requirement disappears with it.",
  },
  {
    id: "DOC-010",
    requirementId: "DOC-REQ-011",
    name: "Client collateral segregation and monitoring reports — June 2026",
    category: "operational",
    status: "verified",
    fileName: "client-collateral-segregation-jun-2026.pdf",
    pages: 19,
    uploadedAt: "2026-07-02T08:34:00+05:30",
    uploadedBy: "Rohan Iyer",
    validFrom: "2026-06-01",
    validUntil: "2026-07-31",
    hash: "0ba9d5271ce6",
    extracted: [
      {
        field: "Reporting basis",
        value: "Client-level segregation, daily file to the exchange",
        confidence: 0.94,
        locator: "p.1, method",
      },
      {
        field: "Period covered",
        value: "01-Jun-2026 to 30-Jun-2026",
        confidence: 0.96,
        locator: "p.1, header",
      },
      {
        field: "Exceptions flagged",
        value: "Nil in the reported period",
        confidence: 0.9,
        locator: "p.17, exception register",
      },
      {
        field: "Pledge / re-pledge register",
        value: "Reconciled against the depository record",
        confidence: 0.85,
        locator: "p.12",
      },
    ],
    supportsObligations: ["OBL-SB-004", "OBL-SB-010", "OBL-SB-012"],
  },
  {
    id: "DOC-011",
    requirementId: "DOC-REQ-013",
    name: "DDPI specimen and client authorisation log",
    category: "operational",
    status: "verified",
    fileName: "ddpi-specimen-and-authorisation-log.pdf",
    pages: 12,
    uploadedAt: "2026-04-15T13:02:00+05:30",
    uploadedBy: "Rohan Iyer",
    hash: "5f8c31e0ad74",
    extracted: [
      {
        field: "Instrument used",
        value: "Demat Debit and Pledge Instruction (DDPI)",
        confidence: 0.97,
        locator: "p.1, title",
      },
      {
        field: "Power of attorney",
        value: "Not taken for the operation of client demat accounts",
        confidence: 0.91,
        locator: "p.2, declaration",
      },
      {
        field: "Permitted purposes enumerated",
        value: "4 — pay-in of securities, margin pledge, mutual fund redemption, tendering in offers",
        confidence: 0.93,
        locator: "p.3, clause 2",
      },
      {
        field: "Consent capture",
        value: "Wet signature and Aadhaar e-sign, both accepted",
        confidence: 0.82,
        locator: "p.8, process note",
      },
    ],
    supportsObligations: ["OBL-SB-007"],
  },
  {
    id: "DOC-012",
    requirementId: "DOC-REQ-014",
    name: "Cyber Security and Cyber Resilience policy — v6.0",
    category: "policy",
    status: "verified",
    fileName: "cscrf-policy-v6-0.pdf",
    pages: 78,
    uploadedAt: "2026-03-26T17:58:00+05:30",
    uploadedBy: "Dev Khanna",
    validFrom: "2026-03-20",
    validUntil: "2027-03-31",
    hash: "9e2740bcf158",
    extracted: [
      {
        field: "CSCRF classification adopted",
        value: "Qualified Regulated Entity",
        confidence: 0.9,
        locator: "p.5, applicability",
      },
      {
        field: "Policy version and approval",
        value: "6.0, approved by the board on 20-Mar-2026",
        confidence: 0.94,
        locator: "p.2, approval page",
      },
      {
        field: "Incident reporting timeline stated",
        value: "6 hours to the exchange and to SEBI",
        confidence: 0.95,
        locator: "p.41, clause 12.3",
      },
      {
        field: "Log retention stated",
        value: "180 days rolling for critical systems",
        confidence: 0.93,
        locator: "p.47, clause 14.1",
      },
      {
        field: "Cyber Capability Index",
        value: "Self-assessment performed for the current cycle",
        confidence: 0.8,
        locator: "p.68, annexure C",
      },
    ],
    supportsObligations: ["OBL-SB-021", "OBL-SB-022", "OBL-SB-023"],
    notes:
      "The classification line is the load-bearing extraction: it is what the engine matches against its own computed CSCRF grade. Agreement between the two is a check, not an assumption.",
  },
  {
    id: "DOC-013",
    requirementId: "DOC-REQ-015",
    name: "VAPT report with closure evidence — cycle 2025-26",
    category: "audit",
    status: "expired",
    fileName: "vapt-report-cycle-2025-26.pdf",
    pages: 214,
    uploadedAt: "2026-02-06T19:31:00+05:30",
    uploadedBy: "Dev Khanna",
    validFrom: "2025-07-01",
    validUntil: "2026-06-30",
    hash: "c4519da8036b",
    extracted: [
      {
        field: "VAPT cycle",
        value: "FY2025-26, testing conducted Dec 2025 to Jan 2026",
        confidence: 0.93,
        locator: "p.2, engagement summary",
      },
      {
        field: "Auditor category",
        value: "CERT-In empanelled",
        confidence: 0.92,
        locator: "p.1, cover",
      },
      {
        field: "Findings",
        value: "14 total — 0 critical, 3 high, 6 medium, 5 low",
        confidence: 0.88,
        locator: "p.9, findings summary",
      },
      {
        field: "Closure at report date",
        value: "12 closed, 2 medium open",
        confidence: 0.86,
        locator: "p.201, closure tracker",
      },
      {
        field: "Re-validation of closure",
        value: "Pending for the 2 open medium findings",
        confidence: 0.83,
        locator: "p.203",
      },
    ],
    supportsObligations: ["OBL-SB-021"],
    notes:
      "Annual cycle lapsed on 30-Jun-2026, twelve days before the sandbox clock. The re-test is tracked as TSK-009 and OBL-SB-021 stays at-risk until closure is re-validated. Simulated posture, not a statement about the firm's actual testing.",
  },
  {
    id: "DOC-014",
    requirementId: "DOC-REQ-016",
    name: "SOC engagement and attestation — 2025-26 term",
    category: "operational",
    status: "expired",
    fileName: "soc-engagement-attestation-2025-26.pdf",
    pages: 31,
    uploadedAt: "2026-01-19T10:47:00+05:30",
    uploadedBy: "Dev Khanna",
    validFrom: "2025-07-01",
    validUntil: "2026-06-30",
    hash: "76e0c8134fda",
    extracted: [
      {
        field: "Arrangement type",
        value: "Third-party managed SOC, 24x7 monitoring",
        confidence: 0.9,
        locator: "p.1, engagement summary",
      },
      {
        field: "Engagement term",
        value: "01-Jul-2025 to 30-Jun-2026",
        confidence: 0.95,
        locator: "p.2, term clause",
      },
      {
        field: "Monitoring coverage",
        value: "Trading platform, core network, endpoints",
        confidence: 0.84,
        locator: "p.7, scope schedule",
      },
      {
        field: "Board reporting cadence",
        value: "Quarterly",
        confidence: 0.87,
        locator: "p.11, clause 8",
      },
    ],
    supportsObligations: ["OBL-SB-022", "OBL-SB-023"],
    notes:
      "Lapsed on the same date as DOC-013 — both sit on the one infosec renewal cycle, so a single missed renewal takes out two controls. No renewal evidence has been supplied to the sandbox. Simulated posture.",
  },
  {
    id: "DOC-015",
    requirementId: "DOC-REQ-019",
    name: "Listed-entity filing bundle — FY2025-26 financials, shareholding pattern, Q1 business update",
    category: "financial",
    status: "verified",
    fileName: "listed-entity-filing-bundle-fy2025-26.pdf",
    pages: 168,
    uploadedAt: "2026-07-06T09:40:00+05:30",
    uploadedBy: "Anshuman Atrey",
    validFrom: "2026-04-01",
    validUntil: "2026-09-30",
    hash: "2af6019bd7c3",
    extracted: [
      { field: "ISIN", value: "INE732I01021", confidence: 0.99, locator: "cover page" },
      {
        field: "Listing",
        value: "NSE: ANGELONE · BSE: 543235",
        confidence: 0.98,
        locator: "cover page",
      },
      {
        field: "Net worth (total equity, FY2025-26 standalone)",
        value: "Rs 6,201.98 crore",
        confidence: 0.96,
        locator: "XBRL balance sheet — total equity",
      },
      {
        field: "Net worth (FY2024-25 standalone, comparative)",
        value: "Rs 5,597.87 crore",
        confidence: 0.95,
        locator: "XBRL balance sheet — prior-year column",
      },
      {
        field: "Revenue (FY2025-26 standalone)",
        value: "Rs 5,054.07 crore",
        confidence: 0.96,
        locator: "XBRL statement of profit and loss",
      },
      {
        field: "Net profit (FY2024-25 standalone)",
        value: "Rs 1,215.95 crore",
        confidence: 0.94,
        locator: "XBRL statement of profit and loss",
      },
      {
        field: "Client base",
        value: "3.86 crore (38.59 million), up 18.8% year on year",
        confidence: 0.92,
        locator: "June 2026 business update",
      },
      {
        field: "NSE market share",
        value: "14.79%",
        confidence: 0.9,
        locator: "June 2026 business update",
      },
      {
        field: "NSE active clients (derived)",
        value: "approx. 6.76 million — 14.79% of NSE's 4.57 crore active base (Mar 2026)",
        confidence: 0.62,
        locator: "derived, not stated in the filing — flagged for human review",
      },
    ],
    supportsObligations: ["OBL-SB-001", "OBL-SB-002", "OBL-SB-003", "OBL-SB-028"],
    notes:
      "The only document in this set whose extracted values are real. Financials are reconciled from XBRL filings with the exchanges via the Molecule financials engine; the client base and market share come from the published June 2026 business update. The derived active-client count is the engine's own arithmetic, sits below the review threshold, and is the number that drives the QSB computation — which is exactly why DOC-REQ-004 asks the exchange to confirm it rather than trusting the derivation.",
  },
  {
    id: "DOC-016",
    requirementId: "DOC-REQ-020",
    name: "FATCA and CRS registration record",
    category: "registration",
    status: "verified",
    fileName: "fatca-crs-registration-record.pdf",
    pages: 8,
    uploadedAt: "2026-04-22T12:19:00+05:30",
    uploadedBy: "Priya Nair",
    validFrom: "2026-04-01",
    validUntil: "2027-03-31",
    hash: "b18f3c7092ae",
    extracted: [
      {
        field: "Classification",
        value: "Reporting Financial Institution under the India–US IGA (Model 1)",
        confidence: 0.88,
        locator: "p.1, classification line",
      },
      {
        field: "Global Intermediary Identification Number",
        value: "On file — number masked in the sandbox",
        confidence: 0.8,
        locator: "p.2, registration block",
      },
      {
        field: "CRS due diligence",
        value: "Documented procedure for new and pre-existing accounts",
        confidence: 0.86,
        locator: "p.4",
      },
      {
        field: "Self-certification capture",
        value: "Collected within the account opening kit",
        confidence: 0.9,
        locator: "p.5, cross-reference",
      },
    ],
    supportsObligations: ["OBL-SB-008", "OBL-SB-029"],
    notes:
      "The identification number is deliberately not reproduced. The sandbox holds the fact of registration, not the identifier.",
  },
  {
    id: "DOC-017",
    requirementId: "DOC-REQ-021",
    name: "Investor Charter and complaint disclosure — June 2026",
    category: "operational",
    status: "verified",
    fileName: "investor-charter-complaint-disclosure-jun-2026.pdf",
    pages: 14,
    uploadedAt: "2026-07-05T11:26:00+05:30",
    uploadedBy: "Priya Nair",
    validFrom: "2026-07-05",
    validUntil: "2026-08-07",
    hash: "ef4207a6cb95",
    extracted: [
      {
        field: "Investor Charter display",
        value: "Published on the website, linked from the grievance page",
        confidence: 0.95,
        locator: "p.1, screenshot annexure",
      },
      {
        field: "Complaint disclosure month",
        value: "June 2026",
        confidence: 0.96,
        locator: "p.6, disclosure table",
      },
      {
        field: "SCORES registration",
        value: "Active; action taken reports filed through the portal",
        confidence: 0.9,
        locator: "p.9",
      },
      {
        field: "Disclosure format",
        value: "Exchange-prescribed monthly table, all rows populated",
        confidence: 0.88,
        locator: "p.6",
      },
    ],
    supportsObligations: ["OBL-SB-015", "OBL-SB-016"],
    notes:
      "Monthly cadence — this record lapses when the July disclosure falls due on 07-Aug-2026.",
  },
  {
    id: "DOC-018",
    requirementId: "DOC-REQ-022",
    name: "ODR platform enrolment record",
    category: "operational",
    status: "verified",
    fileName: "odr-portal-enrolment-record.pdf",
    pages: 5,
    uploadedAt: "2026-04-14T13:12:00+05:30",
    uploadedBy: "Priya Nair",
    hash: "3d95be810c27",
    extracted: [
      {
        field: "Platform",
        value: "SMART ODR portal",
        confidence: 0.94,
        locator: "p.1",
      },
      {
        field: "Enrolment status",
        value: "Active",
        confidence: 0.92,
        locator: "p.1, status line",
      },
      {
        field: "Nodal officer",
        value: "Designated and published on the grievance page",
        confidence: 0.87,
        locator: "p.3",
      },
      {
        field: "Website linkage",
        value: "ODR link present on the grievance page",
        confidence: 0.79,
        locator: "p.4, screenshot — link text partially obscured",
      },
    ],
    supportsObligations: ["OBL-SB-017"],
  },
  {
    id: "DOC-019",
    requirementId: "DOC-REQ-024",
    name: "Conflicts of interest policy — v3.0",
    category: "policy",
    status: "received",
    fileName: "conflicts-of-interest-policy-v3-0.pdf",
    pages: 22,
    uploadedAt: "2026-05-06T15:44:00+05:30",
    uploadedBy: "Priya Nair",
    validFrom: "2026-04-24",
    validUntil: "2027-04-30",
    hash: "50ca7e2f61b8",
    extracted: [
      {
        field: "Policy version and approval",
        value: "3.0, approved by the board on 24-Apr-2026",
        confidence: 0.91,
        locator: "p.2, approval page",
      },
      {
        field: "Scope",
        value: "Research, distribution and proprietary trading activity",
        confidence: 0.85,
        locator: "p.4, clause 2",
      },
      {
        field: "Employee dealing",
        value: "Pre-clearance procedure documented",
        confidence: 0.83,
        locator: "p.13, clause 9",
      },
      {
        field: "Attestation cycle",
        value: "Annual attestation by covered employees",
        confidence: 0.8,
        locator: "p.18, clause 14",
      },
    ],
    supportsObligations: ["OBL-SB-002", "OBL-SB-020", "OBL-SB-031"],
    notes:
      "Parsed; awaiting the compliance officer's sign-off. The Part IX conflicts obligation is carried on the evidence bundle drawn from this policy and its register — the document record stays at `received` until the officer signs, and the two states are tracked separately on purpose.",
  },
  {
    id: "DOC-020",
    requirementId: "DOC-REQ-025",
    name: "Upstreaming of client funds — daily reports, June 2026",
    category: "operational",
    status: "verified",
    fileName: "upstreaming-client-funds-jun-2026.pdf",
    pages: 33,
    uploadedAt: "2026-07-01T08:12:00+05:30",
    uploadedBy: "Rohan Iyer",
    validFrom: "2026-06-01",
    validUntil: "2026-07-31",
    hash: "a8317fd06e29",
    extracted: [
      {
        field: "Period and trading days",
        value: "01-Jun-2026 to 30-Jun-2026, 21 trading days",
        confidence: 0.94,
        locator: "p.1, header",
      },
      {
        field: "Upstreaming mode",
        value: "To the clearing corporations on an end-of-day basis",
        confidence: 0.92,
        locator: "p.2, method note",
      },
      {
        field: "Permitted instruments used",
        value: "Cash, fixed deposits and units of overnight mutual fund schemes",
        confidence: 0.87,
        locator: "p.4, instrument breakdown",
      },
      {
        field: "Exceptions",
        value: "No short-upstreaming instance recorded in the reported period",
        confidence: 0.85,
        locator: "p.31, exception log",
      },
    ],
    supportsObligations: ["OBL-SB-004", "OBL-SB-005"],
    notes:
      "Amounts are not extracted. The engine records the shape of the control — daily, end-of-day, permitted instruments, exceptions — not the firm's balances.",
  },

  /* ── Waivers: what the engine did NOT ask, and why ─────────────────
     A waiver is a filed decision. It carries the profile fact that made
     the ask unnecessary, so an inspector can audit the non-ask the same
     way they audit an ask. */
  {
    id: "DOC-021",
    requirementId: "DOC-REQ-027",
    name: "Portfolio management activity report — not requested",
    category: "registration",
    status: "waived",
    extracted: [],
    supportsObligations: [],
    waivedReason:
      "No SEBI Portfolio Manager registration was found in the entity profile. The registrations on file are stock broker, depository participant and research analyst, none of which carries the portfolio-management reporting obligation. The requirement is re-evaluated on every profile change — add a Portfolio Manager registration and this ask is raised automatically.",
    notes:
      "Filed by the registration scan during onboarding. Absence of a registration is a finding, not a silence.",
  },
  {
    id: "DOC-022",
    requirementId: "DOC-REQ-028",
    name: "Mutual fund scheme compliance certificate — not requested",
    category: "registration",
    status: "waived",
    extracted: [],
    supportsObligations: [],
    waivedReason:
      "The onboarded legal entity holds no AMC or mutual fund registration. The group's asset-management business sits in a separate legal entity that is outside the scope of this registration and this register. The watchtower reached the same conclusion independently when it ruled CATCH-004, an AMC-addressed circular, not-applicable.",
    notes:
      "Two different components — the registration scan and the applicability agent — arrived at the same exclusion from the same profile fact. That agreement is the check.",
  },
];

/* ── Lookups ───────────────────────────────────────────────────────── */

const REQUIREMENT_BY_ID = new Map(documentRequirements.map((r) => [r.id, r]));

export function requirementOf(id: string): DocumentRequirement | undefined {
  return REQUIREMENT_BY_ID.get(id);
}

export function documentsFor(requirementId: string): CompanyDocument[] {
  return companyDocuments.filter((d) => d.requirementId === requirementId);
}
