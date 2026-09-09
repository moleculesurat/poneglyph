/* ══════════════════════════════════════════════════════════════════════
   SEBI regulatory domains — derived from the collected corpus.

   A Part is one circular (its id). SEBI_DOMAINS, CHAPTER_PART and
   CHAPTER_LABEL are computed from `circulars` (data/corpus.ts, read from the
   collected JSON) — one domain per circular, chapters and titles straight
   from the source. Nothing here is hand-typed.

   This file remains the single source of truth for chapter → Part rollup and
   for human labels. UI must import from here, never redeclare a map.
   ══════════════════════════════════════════════════════════════════════ */

import { circulars } from "@/data/corpus";
import type { ChapterKey, CscrfGrade, SebiPart } from "@/lib/schema";

/* types live in the schema (the ontology); re-exported here for convenience */
export type { CscrfGrade, SebiPart };

export interface SebiDomain {
  part: SebiPart;
  /** the circular title */
  title: string;
  /** plain-language gloss for the UI */
  blurb: string;
  /** register chapters that roll up into this Part */
  chapters: ChapterKey[];
  /** short summary of the Part's extent */
  items: string;
}

/* ── One Part per circular, computed from the corpus ───────────────── */

export const SEBI_DOMAINS: SebiDomain[] = circulars.map((c) => ({
  part: c.id,
  title: c.title,
  blurb: `${c.number} · issued ${c.issuedOn}`,
  chapters: c.chapters.map((ch) => ch.key),
  items: `${c.chapters.length} chapters`,
}));

/* ── Chapter → Part rollup, and chapter labels ─────────────────────── */

export const CHAPTER_PART: Record<ChapterKey, SebiPart> = Object.fromEntries(
  circulars.flatMap((c) => c.chapters.map((ch) => [ch.key, c.id])),
);

export const CHAPTER_LABEL: Record<ChapterKey, string> = Object.fromEntries(
  circulars.flatMap((c) => c.chapters.map((ch) => [ch.key, ch.title])),
);

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

/** Part label for chips: the circular title, e.g. "Master Circular for Portfolio Managers" */
export function partLabel(part: SebiPart): string {
  return DOMAIN_BY_PART.get(part)?.title ?? part;
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
