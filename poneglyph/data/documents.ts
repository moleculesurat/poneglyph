import type { CompanyDocument, DocumentRequirement } from "@/lib/schema";

/* Document management. Both registers are empty until onboarding (stage [0])
   and the pipeline determine what the entity must supply. */

export const documentRequirements: DocumentRequirement[] = [];

export const companyDocuments: CompanyDocument[] = [];

/* ── Lookups ───────────────────────────────────────────────────────── */

const REQUIREMENT_BY_ID = new Map(documentRequirements.map((r) => [r.id, r]));

export function requirementOf(id: string): DocumentRequirement | undefined {
  return REQUIREMENT_BY_ID.get(id);
}

export function documentsFor(requirementId: string): CompanyDocument[] {
  return companyDocuments.filter((d) => d.requirementId === requirementId);
}
