import type { Tenant } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Demo tenant — Angel One Limited, a real SEBI-registered stock broker
   listed on NSE + BSE.

   WHAT IS REAL: the entity's identity and its public financial facts —
   ISIN, listing, net worth, revenue, reported client base, NSE market
   share. These come from public XBRL filings and published business
   updates, and each carries provenance in `data/entity.ts`.

   WHAT IS SIMULATED: everything about compliance posture — obligations
   met vs gapped, evidence artifacts, remediation tasks, audit events.
   These are ILLUSTRATIVE and are NOT assertions about Angel One's actual
   compliance. Angel One is used here as a realistic onboarding subject
   because its scale makes the QSB and CSCRF paths concrete.

   Sim-clock is pinned to 2026-07-12, so the June-2026 business update is
   the latest reported figure and "SEBI amended Para 46 nine days ago"
   stays true forever.
   ══════════════════════════════════════════════════════════════════════ */

export const tenant: Tenant = {
  name: "Angel One Limited",
  /* Publicly displayed broker registration (SEBI mandates display).
     Held as `declared` until the registration certificate is uploaded —
     the onboarding flow asks for it rather than assuming it. */
  sebiRegNo: "INZ000161534",
  type: "stock-broker",
  exchanges: ["NSE", "BSE"],
  /* Computed during onboarding from active-client and volume parameters,
     pending confirmation against the exchange's published QSB list. */
  qsb: true,
  /* NSE *active* clients — derived from 14.79% share of NSE's 4.57 cr
     active base (Mar 2026). Distinct from the 3.86 cr total client base;
     the QSB framework counts active clients. */
  activeClients: 6_760_000,
  city: "Mumbai",
  simToday: "2026-07-12",
  team: [
    { name: "Priya Nair", role: "Compliance Officer", initials: "PN" },
    { name: "Anshuman Atrey", role: "Engagement Lead", initials: "AA" },
    { name: "Gayatri Jaiswal", role: "Onboarding Analyst", initials: "GJ" },
    { name: "Dev Khanna", role: "Head of Technology", initials: "DK" },
    { name: "Rohan Iyer", role: "Head of Operations", initials: "RI" },
  ],
};
