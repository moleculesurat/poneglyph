import type { EntityFact, EntityProfile } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Entity profile — Angel One Limited.

   This is the output of onboarding and the input to every applicability
   decision downstream. Which Parts of the Master Circular bind, which
   documents get asked for, which obligations land in the register — all
   of it is computed from the facts below. Change a fact, and the register
   changes. That is the point.

   ── WHAT IS REAL ────────────────────────────────────────────────────
   Angel One Limited is a real, listed, SEBI-registered stock broker.
   The identity and financial facts carried here are public and checkable:
   ISIN, exchange listing, net worth and revenue from the standalone XBRL
   results filed with NSE and BSE, net profit from the FY2024-25 filing,
   client base and NSE market share from the published business updates.
   Each such fact is marked `verified: true` and names its source. The
   financials were reconciled through the Molecule financials engine
   against the filed XBRL, not transcribed from press coverage.

   ── WHAT IS DECLARED OR DERIVED ─────────────────────────────────────
   The broker registration number INZ000161534 is publicly displayed by
   the firm, but Poneglyph holds it as `declared` and `verified: false`
   until the registration certificate arrives against DOC-REQ-001. The
   engine does not promote a number to verified because it appeared on a
   website. Exchange memberships beyond the listing venues, the CDSL
   depository participation, and the business segments are likewise
   declared inputs. Anything computed by us — the NSE active-client count,
   the net-worth growth — is marked `derived` and `verified: false`, with
   the arithmetic written out so it can be checked or rejected.

   ── WHAT IS SIMULATED ───────────────────────────────────────────────
   Every element of compliance POSTURE elsewhere in this sandbox —
   obligations met versus gapped, evidence artifacts, remediation tasks,
   audit events, document contents — is ILLUSTRATIVE. None of it is an
   assertion about Angel One's actual compliance, and nothing here states
   or implies a finding, a violation, an inspection outcome or a penalty.
   This is an illustrative onboarding of a public entity using public
   filings. The named compliance team is the sandbox's own; they are not
   Angel One employees.

   ── ONE HONEST GAP IN THE FINANCIALS ────────────────────────────────
   FY2025-26 net profit is not carried in this profile. Net worth and
   revenue for FY2025-26 were reconciled; the profit line was not, so it
   is absent rather than estimated. The most recent reconciled profit
   figure is FY2024-25. An engine that fills gaps by inference is an
   engine that cannot be audited.
   ══════════════════════════════════════════════════════════════════════ */

export const angelOne: EntityProfile = {
  id: "ENT-001",
  legalName: "Angel One Limited",
  shortName: "Angel One",
  isin: "INE732I01021",
  tickers: [
    { exchange: "NSE", symbol: "ANGELONE" },
    { exchange: "BSE", symbol: "543235" },
  ],
  listed: true,
  incorporatedIn: "India · Maharashtra (registered office Mumbai)",

  /* A single legal person carrying two SEBI intermediary capacities.
     No AMC and no RTA capacity is declared, so those rulebooks never
     enter the register. */
  intermediaryTypes: ["stock-broker", "depository-participant"],

  /* Declared business lines. Each one switches on a different obligation
     set — this is why two firms holding the same broking licence do not
     owe the same things. Portfolio management, investment advisory and
     the debt segment are deliberately absent: see `segments-not-run`. */
  segments: [
    "equity-cash",
    "equity-derivatives",
    "currency-derivatives",
    "commodity-derivatives",
    "depository-participant",
    "margin-trading-facility",
    "algo-trading",
    "internet-trading",
    "research-analyst",
    "mutual-fund-distribution",
  ],

  exchanges: ["NSE", "BSE", "MCX"],
  depositories: ["CDSL"],

  /* One number is public and displayed by the firm; it is still held as
     declared. The rest are masked in the sandbox — Poneglyph will not
     print a registration number it has not read off a certificate. */
  registrations: [
    {
      category: "Stock Broker",
      authority: "SEBI",
      number: "INZ000161534",
      masked: false,
    },
    {
      category: "Trading Member — Capital Market & F&O",
      authority: "NSE",
      number: "TM-••••••",
      masked: true,
    },
    {
      category: "Trading Member — Equity & Derivatives",
      authority: "BSE",
      number: "TM-••••••",
      masked: true,
    },
    {
      category: "Trading Member — Commodity Derivatives",
      authority: "MCX",
      number: "TM-••••••",
      masked: true,
    },
    {
      category: "Depository Participant",
      authority: "CDSL",
      number: "IN-DP-CDSL-••••••",
      masked: true,
    },
    {
      category: "Research Analyst",
      authority: "SEBI",
      number: "INH•••••••••",
      masked: true,
    },
    {
      category: "Mutual Fund Distributor",
      authority: "AMFI",
      number: "ARN-•••••",
      masked: true,
    },
  ],

  /* ── Facts, each with provenance ─────────────────────────────────────
     `verified: true` is reserved for facts drawn from a public, checkable
     source. Declared and derived facts stay false until a document or an
     exchange record closes them. */
  facts: [
    {
      key: "legal-name",
      label: "Legal name",
      value: "Angel One Limited",
      provenance: "filing",
      source:
        "Corporate identity as carried in the standalone financial results for FY2025-26 filed with NSE and BSE in XBRL, and on the exchange listing records.",
      asOf: "2026-07-12",
      verified: true,
    },
    {
      key: "isin",
      label: "ISIN",
      value: "INE732I01021",
      provenance: "exchange",
      source: "Depository-allotted ISIN as quoted on the NSE and BSE equity segments.",
      asOf: "2026-07-12",
      verified: true,
    },
    {
      key: "listing",
      label: "Listing status",
      value: "Listed — NSE: ANGELONE · BSE: 543235",
      provenance: "exchange",
      source:
        "NSE and BSE equity-segment listing records. Listing brings the LODR disclosure regime alongside the intermediary obligations mapped here.",
      asOf: "2026-07-12",
      verified: true,
    },
    {
      key: "registered-office",
      label: "Jurisdiction of incorporation",
      value: "India · Maharashtra (registered office Mumbai)",
      provenance: "filing",
      source:
        "Registered-office address as carried in the exchange filings; an Indian company, so the Master Circular for Stock Brokers applies in full rather than through an IFSC or foreign-entity carve-out.",
      asOf: "2026-07-12",
      verified: true,
    },
    {
      key: "net-worth-fy26",
      label: "Net worth (FY2025-26)",
      value: "₹6,201.98 crore",
      rupees: 62_019_800_000,
      provenance: "filing",
      source:
        "Total equity, standalone, FY2025-26 XBRL results filed with NSE and BSE; reconciled through the Molecule financials engine.",
      asOf: "2026-03-31",
      verified: true,
    },
    {
      key: "net-worth-fy25",
      label: "Net worth (FY2024-25)",
      value: "₹5,597.87 crore",
      rupees: 55_978_700_000,
      provenance: "filing",
      source:
        "Total equity, standalone, FY2024-25 XBRL results filed with NSE and BSE; carried so the year-on-year movement is visible rather than asserted.",
      asOf: "2025-03-31",
      verified: true,
    },
    {
      key: "net-worth-growth",
      label: "Net-worth movement (FY25 → FY26)",
      value: "+₹604.11 crore · +10.79%",
      rupees: 6_041_100_000,
      provenance: "derived",
      source:
        "Computed by Poneglyph: ₹6,201.98 cr − ₹5,597.87 cr = ₹604.11 cr; ₹604.11 cr ÷ ₹5,597.87 cr = 10.79%. Both inputs are filed figures; the movement itself is our arithmetic and is not a reported line item.",
      asOf: "2026-03-31",
      verified: false,
    },
    {
      key: "revenue-fy26",
      label: "Revenue (FY2025-26)",
      value: "₹5,054.07 crore",
      rupees: 50_540_700_000,
      provenance: "filing",
      source:
        "Total revenue, standalone, FY2025-26 XBRL results filed with NSE and BSE; reconciled through the Molecule financials engine.",
      asOf: "2026-03-31",
      verified: true,
    },
    {
      key: "net-profit-fy25",
      label: "Net profit (FY2024-25)",
      value: "₹1,215.95 crore",
      rupees: 12_159_500_000,
      provenance: "filing",
      source:
        "Profit after tax, standalone, FY2024-25 XBRL results filed with NSE and BSE. The FY2025-26 profit line was not reconciled at profile build time and is therefore absent, not estimated.",
      asOf: "2025-03-31",
      verified: true,
    },
    {
      key: "client-base-total",
      label: "Total client base",
      value: "38.59 million (3.86 crore) · +18.8% YoY",
      provenance: "exchange",
      source:
        "June 2026 monthly business update published to NSE and BSE. This is the cumulative client base, distinct from the exchange-defined active-client count used for QSB.",
      asOf: "2026-06-30",
      verified: true,
    },
    {
      key: "client-base-fy26",
      label: "Client base at FY2025-26 close",
      value: "37.39 million · +20.5% YoY from 31.02 million",
      provenance: "exchange",
      source:
        "FY2025-26 business update published to NSE and BSE; prior-year comparative 31.02 million at FY2024-25 close.",
      asOf: "2026-03-31",
      verified: true,
    },
    {
      key: "nse-market-share",
      label: "NSE active-client market share",
      value: "14.79% (from 15.40%, −61 bps)",
      provenance: "exchange",
      source:
        "NSE active-client share reported in the published business update; prior-period comparative 15.40%. Share is falling while the absolute base grows — both facts are carried, neither is smoothed.",
      asOf: "2026-03-31",
      verified: true,
    },
    {
      key: "nse-active-base",
      label: "NSE market-wide active clients",
      value: "4.57 crore (45.7 million)",
      provenance: "exchange",
      source:
        "Total active clients across all members on NSE, March 2026, as published by the exchange. Carried as the denominator for the derived figure below.",
      asOf: "2026-03-31",
      verified: true,
    },
    {
      key: "nse-active-clients",
      label: "NSE active clients (derived)",
      value: "≈ 6.76 million",
      provenance: "derived",
      source:
        "Computed by Poneglyph, not reported by the firm: 14.79% × 4.57 crore = 6,759,030 ≈ 6.76 million. This is the QSB-relevant count, and it is an estimate — the exchange's own active-client figure for the member supersedes it the moment it is supplied.",
      asOf: "2026-03-31",
      verified: false,
    },
    {
      key: "sebi-reg-no",
      label: "SEBI broker registration number",
      value: "INZ000161534 (declared)",
      provenance: "declared",
      source:
        "Publicly displayed by the firm as SEBI requires. Poneglyph holds it as declared and unverified until the registration certificate is supplied against DOC-REQ-001; a number read off a website is not a registration record.",
      asOf: "2026-07-12",
      verified: false,
    },
    {
      key: "exchange-memberships",
      label: "Exchange memberships",
      value: "NSE, BSE (declared) · MCX (declared)",
      provenance: "declared",
      source:
        "NSE and BSE are independently evidenced as listing venues, but membership as a trading member is a separate record. MCX membership is inferred from the declared commodity-derivatives segment. All three await the exchange membership certificates before the profile treats them as verified.",
      asOf: "2026-07-12",
      verified: false,
    },
    {
      key: "depository-participation",
      label: "Depository participation",
      value: "CDSL (declared)",
      provenance: "declared",
      source:
        "Declared at onboarding and consistent with the depository-participant segment. The DP registration number is masked in this sandbox and the capacity stays declared until the CDSL certificate is supplied.",
      asOf: "2026-07-12",
      verified: false,
    },
    {
      key: "segments-not-run",
      label: "Segments not declared — obligation sets ruled out",
      value: "Portfolio management · Investment advisory · Debt segment",
      provenance: "declared",
      source:
        "No portfolio-manager, investment-adviser or debt-segment activity was declared at onboarding. The SEBI (Portfolio Managers) Regulations, 2020 and the SEBI (Investment Advisers) Regulations, 2013 obligation sets are therefore not mapped into this register, and the debt-segment provisions of the Master Circular are left unscoped. A single declaration reverses any of the three and the register rebuilds — the exclusion is a live determination, not a permanent judgement.",
      asOf: "2026-07-12",
      verified: false,
    },
  ],

  /* ── QSB designation ─────────────────────────────────────────────────
     COMPUTED by Poneglyph from public data. It is not read off SEBI's or
     the exchanges' published QSB list, and it is not a claim that the
     firm has been designated. One parameter can be estimated from public
     sources; six cannot be seen from outside the firm at all. */
  qsb: true,
  qsbBasis: [
    "Determination: QSB — COMPUTED, UNCONFIRMED. Poneglyph designates on the one parameter it can estimate from public data and flags the other six as unseen. The designation is provisional until reconciled against the QSB list published by the exchanges; that reconciliation is an open item, not a formality already done.",
    "Active clients — CROSSES. ≈6.76 million NSE active clients, derived as 14.79% of NSE's 4.57 crore active base (March 2026). At roughly one in seven active clients on the exchange, the firm sits in the top cohort on this parameter alone, which is what makes the enhanced-obligation regime the correct default posture.",
    "Total available client assets — NOT COMPUTABLE. The published standalone results do not break out client assets held. The client-asset and segregation statement has been requested from the firm; the parameter stays unscored until it arrives.",
    "Trading volumes excluding proprietary — NOT COMPUTABLE. Member-level volume is not disclosed in the filings; only exchange-issued data can settle this parameter.",
    "End-of-day margin obligations of all clients — NOT COMPUTABLE. Visible to the clearing corporation and the member, not to a third party working from public filings.",
    "Proprietary trading volumes (parameter added 2024) — NOT COMPUTABLE. Not separately disclosed at member level in the public filings.",
    "Compliance score (parameter added 2024) — NOT COMPUTABLE. Assigned by the exchanges from inspection and reporting history; it cannot be reconstructed from outside and Poneglyph will not proxy it.",
    "Grievance redressal score (parameter added 2024) — NOT COMPUTABLE. Assigned by the exchanges. The firm's published complaint disclosures are a proxy at best and are not treated as the score.",
    "Consequence of the determination: Part II item 18 enhanced obligations are loaded into the register now, on the reasoning that under-scoping a systemically significant broker is the more expensive error. If the exchange list contradicts this, the register de-scopes and the audit trail records both the original basis and the correction.",
  ],

  /* ── CSCRF grade ─────────────────────────────────────────────────────
     CSCRF (Aug 20, 2024) grades regulated entities by size and sets the
     depth of the cyber obligations from that grade. */
  cscrfGrade: "qualified",
  cscrfBasis:
    "Graded a Qualified RE under the Cybersecurity & Cyber Resilience Framework. The grade follows the size band: a broker carrying a 38.59 million client base, ≈6.76 million derived NSE active clients and ₹6,201.98 crore of net worth is not a self-certification, basic or mid-size entity on any reading of the thresholds, and the MII band is reserved for stock exchanges, depositories and clearing corporations — capacities this entity does not hold. That places it in the deepest tier short of an MII, which is where the QSB-designated brokers sit. Because the grade is anchored to the QSB determination above, it inherits the same caveat: COMPUTED, UNCONFIRMED, and re-graded automatically if the QSB reconciliation moves. CSCRF supersedes the earlier SEBI cyber circulars and took effect Jan 1, 2025 for entities already covered by one, so the transition question is settled for this entity and only the graded depth is in play.",

  /* ── Scope: which Parts of the Master Circular bind ──────────────────
     Nine of ten Parts bind and are mapped. The tenth is a real
     applicability determination, not a manufactured exclusion. */
  applicableParts: ["I", "II", "III", "IV", "V", "VI", "VII", "IX", "X"],
  excludedParts: [
    {
      part: "VIII",
      reason:
        "Not applicable as a standing obligation. Part VIII sets the standard operating procedure that runs when a trading or clearing member is declared in default, and the recovery of assets and client funds that follows. It is triggered by an event, not held open continuously: absent a default declaration by an exchange or clearing corporation, it produces nothing for a compliance officer to do, evidence, or be inspected on, and mapping it would inflate the register with obligations that cannot be met or breached. The determination is scoped, not deleted — the clauses stay attached to the entity and dormant, and the Part re-arms the moment an exchange default notice reaches the Watchtower. Reviewable on any change in the firm's membership standing. This says nothing about the firm's financial condition; it is a statement about which clauses are live today.",
    },
  ],
};

/* Only one entity is onboarded in this sandbox. The array exists because
   applicability is an entity-level computation, not a global constant —
   a second firm with different segments produces a different register
   from the same corpus, which is the whole argument for the ontology. */
export const entities: EntityProfile[] = [angelOne];

const FACT_INDEX: Map<string, EntityFact> = new Map(angelOne.facts.map((f) => [f.key, f]));

/** Look up a profile fact by key. Returns undefined rather than a
    placeholder — a missing fact is a real state in this engine, and the
    UI is expected to render the absence rather than paper over it. */
export function factOf(key: string): EntityFact | undefined {
  return FACT_INDEX.get(key);
}
