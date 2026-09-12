import type { CompanyDocument, DocumentCategory, DocumentRequirement } from "@/lib/schema";
import { obligations } from "./obligations";
import { evidence } from "./evidence";

/* Document management — derived, never hand-typed.
   Requirements come from every `document` evidenceSpec on an approved obligation;
   company documents come from the bound `document` evidence artifacts. Both flow
   from the register — approve/bind through the app, then `npm run pull`. */

/* description keyword → category, first match wins */
const CATEGORY_RULES: [string[], DocumentCategory][] = [
  [["audit"], "audit"],
  [["policy", "code of conduct", "procedure", "sop"], "policy"],
  [["net worth", "balance sheet", "financial statement", "audited"], "financial"],
  [["board", "partners", "resolution", "minutes", "committee"], "governance"],
  [["certificate of registration", "nism", "sebi registration"], "registration"],
  [["incorporation", "llp agreement"], "constitutional"],
];

function categoryFor(description: string): DocumentCategory {
  const d = description.toLowerCase();
  for (const [keywords, category] of CATEGORY_RULES)
    if (keywords.some((k) => d.includes(k))) return category;
  return "operational";
}

export const documentRequirements: DocumentRequirement[] = obligations.flatMap((o) =>
  o.evidenceSpec
    .filter((spec) => spec.kind === "document")
    .map((spec, i) => ({
      id: `DOC-REQ-${o.id}-${i + 1}`,
      name: spec.description,
      description: o.title,
      category: categoryFor(spec.description),
      part: o.clause.circularId,
      chapter: o.clause.chapter,
      clauseRef: { circularId: o.clause.circularId, para: o.clause.para, excerpt: o.clause.excerpt },
      triggeredBy: `Approved duty ${o.id}`,
      mandatory: true,
      unlocks: [o.id],
      acceptedFormats: ["pdf"],
      ...(o.frequency ? { refreshCadence: o.frequency } : {}),
    })),
);

export const companyDocuments: CompanyDocument[] = evidence
  .filter((a) => a.kind === "document")
  .map((a) => {
    const req = documentRequirements.find((r) => r.unlocks.some((id) => a.obligationIds.includes(id)));
    return {
      id: a.id,
      ...(req ? { requirementId: req.id } : {}),
      name: a.title,
      category: req ? req.category : ("operational" as DocumentCategory),
      status: "received" as const,
      hash: a.hash,
      uploadedAt: a.capturedAt,
      extracted: [],
      supportsObligations: a.obligationIds,
    };
  });

/* ── Lookups ───────────────────────────────────────────────────────── */

const REQUIREMENT_BY_ID = new Map(documentRequirements.map((r) => [r.id, r]));

export function requirementOf(id: string): DocumentRequirement | undefined {
  return REQUIREMENT_BY_ID.get(id);
}

export function documentsFor(requirementId: string): CompanyDocument[] {
  return companyDocuments.filter((d) => d.requirementId === requirementId);
}
