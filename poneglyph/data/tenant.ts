import type { Tenant } from "@/lib/schema";

/* Simulated tenant — Walrus Securitas re-imagined as a small SEBI-registered
   stock broker. All facts fictional; seeded from walrus-hq for flavour. */

export const tenant: Tenant = {
  name: "Walrus Securitas Broking Ltd",
  sebiRegNo: "INZ000247319",
  type: "stock-broker",
  exchanges: ["NSE", "BSE"],
  qsb: false,
  activeClients: 12408,
  city: "Bengaluru",
  simToday: "2026-07-12",
  team: [
    { name: "Priya Nair", role: "Compliance Officer", initials: "PN" },
    { name: "Anshuman Atrey", role: "CEO", initials: "AA" },
    { name: "Gayatri Jaiswal", role: "COO", initials: "GJ" },
    { name: "Dev Khanna", role: "CTO", initials: "DK" },
    { name: "Rohan Iyer", role: "Head of Operations", initials: "RI" },
  ],
};
