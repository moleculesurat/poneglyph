import type { EntityFact, EntityProfile } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Molecule Ventures LLP — the onboarded entity.

   REAL: this is Molecule's own firm. The identity, SEBI PM registration and
   the two capacities it holds are real. Every fact below is DECLARED by the
   firm, carries its source, and is marked verified:false until the backing
   document is loaded — nothing here is an outside assertion.

   NOT ASSERTED: no compliance posture. Whether a duty is met or gapped is
   decided only by the pipeline and the human gate, never stated here.
   ══════════════════════════════════════════════════════════════════════ */

const DECLARED_BY = "Compliance Officer, Molecule Ventures LLP, 2026-09-09";
const declared = (doc: string): Pick<EntityFact, "provenance" | "verified" | "asOf" | "source"> => ({
  provenance: "declared",
  verified: false,
  asOf: "2026-09-09",
  source: `Declared by ${DECLARED_BY}. To be backed by ${doc}.`,
});

export const molecule: EntityProfile = {
  id: "ENT-001",
  legalName: "Molecule Ventures LLP",
  shortName: "Molecule",
  incorporatedIn: "India · LLP · Gujarat / Surat",
  intermediaryTypes: ["portfolio-manager", "aif-manager"],
  segments: [],
  registrations: [
    { category: "Portfolio Manager", authority: "SEBI", number: "INP000007216", masked: false },
    {
      category: "Alternative Investment Fund — Category II (registration in progress)",
      authority: "SEBI",
      number: "not yet applied",
      masked: false,
    },
  ],
  facts: [
    {
      key: "legal-name",
      label: "Legal name",
      value: "Molecule Ventures LLP",
      ...declared("LLP incorporation certificate"),
    },
    {
      key: "pm-registration",
      label: "PM registration",
      value: "INP000007216 · registered 2021",
      ...declared("SEBI PM registration certificate"),
    },
    {
      key: "aum",
      label: "AUM",
      value: "Rs 777 crore (Nov 2025)",
      rupees: 7_770_000_000,
      ...declared("PM monthly report to SEBI, Nov 2025 (SI Portal)"),
    },
    {
      key: "clients",
      label: "Clients",
      value: "431 (Nov 2025)",
      ...declared("PM monthly report to SEBI, Nov 2025 (SI Portal)"),
    },
    {
      key: "aif-status",
      label: "AIF status",
      value: "Category II AIF — in preparation",
      ...declared("SEBI AIF application / registration certificate"),
    },
  ],
  cscrfGrade: "self-certification",
  cscrfBasis:
    'Portfolio manager: Table 3 grades a PM with AUM "Rs. 3000 Crores and below" as a self-certification RE (para 2.6); declared AUM Rs 777 crore. AIF manager: Table 4 grades a manager whose "Sum of corpus of all AIFs, VCFs, and their schemes managed by a manager" is "Rs. 3000 Crores and below" as a self-certification RE (para 2.7); no scheme launched yet. Para 4: "In case an RE is registered under more than one category of REs, then the provision of highest category under which such an RE falls shall be applicable to that RE." Both categories resolve to self-certification. Market-SOC: para 2.6 exempts only self-certification PMs that "have less than 100 clients"; declared client count is 431, so the M-SOC requirement is NOT exempted. Facts are declared, not yet documented; the grade is re-derived when the backing documents arrive.',
  applicableParts: ["MC-PM-2025", "MC-AIF-2026"],
  excludedParts: [],
};

export const entities: EntityProfile[] = [molecule];

const FACT_INDEX: Map<string, EntityFact> = new Map(molecule.facts.map((f) => [f.key, f]));

/** Look up a profile fact by key. Returns undefined rather than a
    placeholder — a missing fact is a real state in this engine, and the
    UI is expected to render the absence rather than paper over it. */
export function factOf(key: string): EntityFact | undefined {
  return FACT_INDEX.get(key);
}
