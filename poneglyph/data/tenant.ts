import type { Tenant } from "@/lib/schema";

/* Molecule Ventures LLP's own profile — a real firm onboarding itself.
   Every profile fact lives in data/entity.ts and carries its provenance.
   Nothing here asserts a compliance posture; the register fills only through
   the pipeline and the human gate. */

export const tenant: Tenant = {
  name: "Molecule Ventures LLP",
  sebiRegNo: "INP000007216",
  type: "portfolio-manager",
  city: "Surat",
  simToday: "2026-09-09", // as-of date of the profile facts; stage [5] replaces with a real clock
  team: [
    { name: "Compliance Officer", role: "Compliance Officer", initials: "CO" },
    { name: "Principal Officer", role: "Principal Officer", initials: "PO" },
  ],
};
