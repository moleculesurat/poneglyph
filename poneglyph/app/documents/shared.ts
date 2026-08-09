/* ══════════════════════════════════════════════════════════════════════
   Document vault — shared derivations.

   Plain module (no "use client"): both the server page and the client
   explorer read from it, so the requirement → document join and the
   status counts are computed once and agree everywhere.

   A requirement with no document record is `required` — that is the gap.
   Everything here is derived from static data; nothing reads the clock.
   ══════════════════════════════════════════════════════════════════════ */

import { companyDocuments, documentRequirements } from "@/data/documents";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import type {
  CompanyDocument,
  DocumentCategory,
  DocumentRequirement,
  DocumentStatus,
  SebiPart,
} from "@/lib/schema";

/** Below this, an extraction is a claim the engine will not stand behind
    on its own — it lands in the human-review queue by construction. */
export const REVIEW_THRESHOLD = 0.75;

export const SIM_TODAY = tenant.simToday;

/* ── the requirement → document join ──────────────────────────────────── */

export const DOC_BY_REQ: Map<string, CompanyDocument> = new Map(
  companyDocuments
    .filter((d): d is CompanyDocument & { requirementId: string } => Boolean(d.requirementId))
    .map((d) => [d.requirementId, d])
);

/** Documents that arrived without an ask. The firm can volunteer; the
    engine parses them on the same path. */
export const VOLUNTEERED: CompanyDocument[] = companyDocuments.filter((d) => !d.requirementId);

export const OBL = new Map(obligations.map((o) => [o.id, o]));

export function docFor(reqId: string): CompanyDocument | undefined {
  return DOC_BY_REQ.get(reqId);
}

export function statusOf(r: DocumentRequirement): DocumentStatus {
  return DOC_BY_REQ.get(r.id)?.status ?? "required";
}

/* ── labels & tones ───────────────────────────────────────────────────── */

export type Tone = "met" | "gap" | "at-risk" | "pending" | "info" | "live";

export const DOC_STATUSES: DocumentStatus[] = [
  "verified",
  "received",
  "required",
  "expired",
  "waived",
];

export const STATUS_LABEL: Record<DocumentStatus, string> = {
  verified: "Verified",
  received: "Received",
  required: "Required",
  expired: "Expired",
  waived: "Waived",
};

/* Orange is attention only: `required` is the open gap, `expired` lapsed. */
export const STATUS_TONE: Record<DocumentStatus, Tone> = {
  verified: "met",
  received: "pending",
  required: "gap",
  expired: "at-risk",
  waived: "info",
};

export const STATUS_HINT: Record<DocumentStatus, string> = {
  verified: "parsed and signed off by the compliance officer",
  received: "parsed, awaiting the officer's sign-off",
  required: "asked for — nothing supplied",
  expired: "supplied once, now past its refresh cadence",
  waived: "evaluated and not asked for, with the reason filed",
};

export const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  constitutional: "Constitutional",
  registration: "Registration",
  policy: "Policy",
  financial: "Financial",
  audit: "Audit",
  operational: "Operational",
  governance: "Governance",
};

/* ── facets, in circular order (declaration order is Part I → X) ──────── */

export const PARTS_PRESENT: SebiPart[] = [...new Set(documentRequirements.map((r) => r.part))];

export const CATEGORIES_PRESENT: DocumentCategory[] = [
  ...new Set(documentRequirements.map((r) => r.category)),
];

export const PART_COUNTS: Record<string, number> = documentRequirements.reduce(
  (acc, r) => ((acc[r.part] = (acc[r.part] ?? 0) + 1), acc),
  {} as Record<string, number>
);

export const CATEGORY_COUNTS: Record<string, number> = documentRequirements.reduce(
  (acc, r) => ((acc[r.category] = (acc[r.category] ?? 0) + 1), acc),
  {} as Record<string, number>
);

export const STATUS_COUNTS: Record<DocumentStatus, number> = documentRequirements.reduce(
  (acc, r) => {
    const s = statusOf(r);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  },
  {} as Record<DocumentStatus, number>
);

/* ── the two lists the page opens with ────────────────────────────────── */

/** The open asks — nothing supplied against them at all. */
export const OPEN_ASKS: DocumentRequirement[] = documentRequirements.filter(
  (r) => statusOf(r) === "required"
);

/** Evaluated, deliberately not raised. The non-ask is filed like an ask. */
export const WAIVED_REQS: DocumentRequirement[] = documentRequirements.filter(
  (r) => statusOf(r) === "waived"
);

/* ── extraction statistics — the glass box, counted ───────────────────── */

export const PARSED_DOCS = companyDocuments.filter((d) => d.extracted.length > 0);

export const EXTRACTED_TOTAL = companyDocuments.reduce((n, d) => n + d.extracted.length, 0);

export const FLAGGED_EXTRACTIONS = companyDocuments.flatMap((d) =>
  d.extracted
    .filter((f) => f.confidence < REVIEW_THRESHOLD)
    .map((f) => ({ docId: d.id, docName: d.name, field: f }))
);

export function lowCount(d: CompanyDocument): number {
  return d.extracted.filter((f) => f.confidence < REVIEW_THRESHOLD).length;
}

/* ── obligations a requirement is holding up ──────────────────────────── */

/** Obligations that cannot be verified until this document arrives. */
export function blockedObligations(r: DocumentRequirement): string[] {
  return r.unlocks;
}

/** Distinct obligations waiting on the six open asks. */
export const BLOCKED_TOTAL = [...new Set(OPEN_ASKS.flatMap((r) => r.unlocks))];

/* ── validity window helpers (string compare on ISO dates only) ───────── */

export function validityNote(d: CompanyDocument): string | null {
  if (!d.validUntil) return null;
  return d.validUntil < SIM_TODAY
    ? `lapsed ${d.validUntil}`
    : `valid to ${d.validUntil}`;
}

export function hasLapsed(d: CompanyDocument): boolean {
  return Boolean(d.validUntil && d.validUntil < SIM_TODAY);
}

export const fmtStamp = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} IST`;
