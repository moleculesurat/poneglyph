/* ══════════════════════════════════════════════════════════════════════
   SEBI regulatory domains — the real taxonomy.

   Source of truth: SEBI Master Circular for Stock Brokers,
   ref SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2024/53 (May 22, 2024), issued by
   the Market Intermediaries Regulation and Supervision Department (MIRSD).
   Part titles below are VERBATIM from that circular's Table of Contents.

   Two frameworks sit across these Parts and grade a firm's obligations:
     · CSCRF — Cybersecurity & Cyber Resilience Framework (Aug 20, 2024),
       adopted from Jan 1 / Apr 1 2025. Referenced at Part IV item 60.
     · QSB  — Qualified Stock Broker enhanced obligations (Part II item 18).

   This file is the single source of truth for chapter → Part rollup and
   for human labels. UI must import from here, never redeclare a map.
   ══════════════════════════════════════════════════════════════════════ */

import type { ChapterKey, CscrfGrade, SebiPart } from "@/lib/schema";

/* types live in the schema (the ontology); re-exported here for convenience */
export type { CscrfGrade, SebiPart };

export interface SebiDomain {
  part: SebiPart;
  /** verbatim Part title from the Master Circular's Table of Contents */
  title: string;
  /** plain-language gloss for the UI */
  blurb: string;
  /** register chapters that roll up into this Part */
  chapters: ChapterKey[];
  /** representative subject numbers from the circular's ToC */
  items: string;
}

/* ── The ten Parts, in circular order ──────────────────────────────── */

export const SEBI_DOMAINS: SebiDomain[] = [
  {
    part: "I",
    title: "Registration of Stock Brokers",
    blurb:
      "Getting and keeping the licence — antecedent verification, corporate conversion, single registration across segments, transfer of business.",
    chapters: ["registration"],
    items: "Subjects 1–12",
  },
  {
    part: "II",
    title: "Supervision & Oversight",
    blurb:
      "How the firm is watched — annual inspection by exchanges, annual system audit, the Early Warning Mechanism against diversion of client securities, and the QSB enhanced-obligation regime.",
    chapters: ["supervision"],
    items: "Subjects 13–18 (incl. QSB at 18)",
  },
  {
    part: "III",
    title: "Dealings with Client",
    blurb:
      "The largest Part — account opening and UCC, nomination, margin trading and margin collection, pledge/re-pledge, collateral segregation, handling of client securities, pay-in validation, running-account settlement.",
    chapters: ["client-dealings", "margin", "unpaid-securities"],
    items: "Subjects 19–49 (Para 46 = pay-in validation)",
  },
  {
    part: "IV",
    title: "Technology Related Provisions",
    blurb:
      "Electronic contract notes, internet/wireless trading, direct market access, smart order routing, algorithmic trading, software testing — and the Cyber Security & Cyber Resilience framework, AI/ML reporting, cloud and SaaS adoption.",
    chapters: ["technology", "cyber"],
    items: "Subjects 50–65 (CSCRF at 60, AI/ML at 61)",
  },
  {
    part: "V",
    title: "Change in Status, Constitution, Control, Affiliation",
    blurb:
      "Prior approval for change in control, periodical reporting to exchanges, NOC for subsidiaries and GIFT-IFSC ventures.",
    chapters: ["change-control"],
    items: "Subjects 66–68",
  },
  {
    part: "VI",
    title: "Foreign Accounts Tax Compliance Act Related Provisions",
    blurb:
      "FATCA registration under the Inter-Governmental Agreement with the USA, and the Multilateral Competent Authority Agreement.",
    chapters: ["fatca"],
    items: "Subjects 69–70",
  },
  {
    part: "VII",
    title: "Investor Grievance Redressal",
    blurb:
      "Exclusive complaints e-mail ID, redressal through SCORES, the Online Dispute Resolution mechanism, and publishing the Investor Charter plus complaint disclosures.",
    chapters: ["grievance"],
    items: "Subjects 71–74",
  },
  {
    part: "VIII",
    title: "Default Related Provisions",
    blurb:
      "Standard operating procedure when a trading or clearing member defaults, and recovery of assets and client funds.",
    chapters: ["default"],
    items: "Subjects 75–76",
  },
  {
    part: "IX",
    title: "Miscellaneous",
    blurb:
      "Advertisement by brokers, maintenance of books of accounts, outsourcing, conflicts of interest, website disclosures, the IRRA platform, upstreaming of client funds, bank guarantees out of client funds.",
    chapters: ["advertisement", "books-records", "outsourcing"],
    items: "Subjects 77–92 (upstreaming at 92)",
  },
  {
    part: "X",
    title: "Reporting Requirements",
    blurb:
      "The consolidated periodic reporting obligations owed to exchanges and to SEBI.",
    chapters: ["reporting"],
    items: "Subject 93 + Annexure-28",
  },
];

/* ── Chapter → Part rollup ─────────────────────────────────────────── */

export const CHAPTER_PART: Record<ChapterKey, SebiPart> = {
  registration: "I",
  supervision: "II",
  "client-dealings": "III",
  margin: "III",
  "unpaid-securities": "III",
  technology: "IV",
  cyber: "IV",
  "change-control": "V",
  fatca: "VI",
  grievance: "VII",
  default: "VIII",
  advertisement: "IX",
  "books-records": "IX",
  outsourcing: "IX",
  reporting: "X",
};

/* ── Chapter labels (single source of truth for the UI) ────────────── */

export const CHAPTER_LABEL: Record<ChapterKey, string> = {
  registration: "Registration",
  supervision: "Supervision & Oversight",
  "client-dealings": "Dealings with Client",
  margin: "Margin & Collateral",
  "unpaid-securities": "Unpaid Securities (CUSPA)",
  technology: "Trading Technology",
  cyber: "Cyber Security (CSCRF)",
  "change-control": "Change in Control",
  fatca: "FATCA",
  grievance: "Investor Grievance",
  default: "Default Management",
  advertisement: "Advertisement",
  "books-records": "Books & Records",
  outsourcing: "Outsourcing & Conduct",
  reporting: "Reporting",
};

/* ── Lookups ───────────────────────────────────────────────────────── */

const DOMAIN_BY_PART = new Map(SEBI_DOMAINS.map((d) => [d.part, d]));

export function domainOf(chapter: ChapterKey): SebiDomain {
  return DOMAIN_BY_PART.get(CHAPTER_PART[chapter]) ?? SEBI_DOMAINS[0];
}

export function partOf(chapter: ChapterKey): SebiPart {
  return CHAPTER_PART[chapter];
}

export function domainByPart(part: SebiPart): SebiDomain | undefined {
  return DOMAIN_BY_PART.get(part);
}

/** Part label for chips: "Part III · Dealings with Client" */
export function partLabel(part: SebiPart): string {
  return `Part ${part} · ${DOMAIN_BY_PART.get(part)?.title ?? ""}`;
}

/* ── The two grading frameworks ────────────────────────────────────── */

export const CSCRF = {
  name: "Cybersecurity & Cyber Resilience Framework",
  circular: "SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113",
  issuedOn: "2024-08-20",
  note:
    "Supersedes prior SEBI cyber circulars. Adoption from Jan 1, 2025 for entities already covered by a cyber circular; Apr 1, 2025 for all others. Obligations are graded by entity size.",
  /** CSCRF grades REs by size; a broker's grade drives the depth of its cyber obligations */
  grades: [
    "self-certification",
    "basic",
    "mid-size",
    "qualified",
    "mii",
  ] as const,
} as const;

export const CSCRF_GRADE_LABEL: Record<CscrfGrade, string> = {
  "self-certification": "Self-certification",
  basic: "Basic",
  "mid-size": "Mid-size",
  qualified: "Qualified RE",
  mii: "Market Infrastructure Institution",
};

export const QSB = {
  name: "Qualified Stock Broker",
  circular: "SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2023/26",
  effectiveFrom: "2023-07-01",
  note:
    "SEBI designates high-impact brokers as QSBs and loads them with enhanced obligations — governance, risk management, cyber resilience, investor grievance handling — because their failure would be systemic.",
  /** designation parameters, per the framework and its 2024 expansion */
  parameters: [
    "Number of active clients",
    "Total available client assets",
    "Trading volumes (excluding proprietary)",
    "End-of-day margin obligations of all clients",
    "Proprietary trading volumes (added 2024)",
    "Compliance score (added 2024)",
    "Grievance redressal score (added 2024)",
  ],
} as const;
