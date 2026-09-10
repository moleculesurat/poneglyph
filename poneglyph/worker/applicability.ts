/* ══════════════════════════════════════════════════════════════════════
   The applicability agent — plain code, no model.

   It answers one question before any token is spent: does this clause
   bind THIS firm? The comparison is against the onboarded entity profile
   in data/entity.ts — the capacities Molecule Ventures LLP holds and the
   business segments it declares — not against a generic notion of "a broker".

   Getting a "no" here is the cheap, correct outcome: the run completes
   with a cited verdict and the extraction model is never called.

   NOTE ON HONESTY: this reads the entity's own declared profile and the
   clause text. It never asserts anything about the firm's compliance.
   ══════════════════════════════════════════════════════════════════════ */

import type { ApplicabilityVerdict, BusinessSegment, IntermediaryType } from "../lib/schema";
import { CHAPTER_LABEL } from "../lib/domains";
import { molecule } from "../data/entity";

/** Phrases a circular uses for each intermediary capacity. */
const CAPACITY_PHRASES: Record<IntermediaryType, string[]> = {
  "stock-broker": ["stock broker", "stock brokers", "broker", "trading member", "member of the stock exchange"],
  "depository-participant": ["depository participant", "participant", "demat account"],
  "investment-adviser": ["investment adviser", "investment advisor"],
  amc: ["asset management company", "mutual fund scheme", "asset manager"],
  rta: ["registrar to an issue", "share transfer agent", "registrar and transfer agent"],
  "portfolio-manager": ["portfolio manager", "portfolio managers"],
  "aif-manager": ["alternative investment fund", "alternative investment funds", "aif", "aifs", "manager of the aif", "sponsor"],
};

/** Phrases that mark a clause as belonging to a business line. Only the
    segments the firm actually declares are searched for. */
// ponytail: substring match, "discretionary portfolio" also hits "non-discretionary portfolio"; split when a declared segment misfires
const SEGMENT_PHRASES: Partial<Record<BusinessSegment, string[]>> = {
  "pms-discretionary": ["discretionary portfolio"],
  "pms-non-discretionary": ["non-discretionary"],
  "pms-advisory": ["advisory services", "advisory client"],
  "aif-category-ii": ["category ii"],
};

function hits(haystack: string, phrases: string[]): string[] {
  return phrases.filter((p) => haystack.includes(p));
}

/* ── AIF category scope ─────────────────────────────────────────────────
   The firm manages a Category II AIF only. A rule whose scope names another
   category or fund type — and never the firm's own — does not bind it. Read
   against the chapter title as well as the clause, because a master circular
   often sets the category once in the chapter heading. */

// ponytail: held AIF category hardcoded until entity.segments carries aif-category-ii (Pranjal: after registration)
const HELD_AIF_CATEGORIES = ["ii"];
const NAMES_HELD = /\bcategory\s+ii\b(?!i)|\bcategory\s+i\s*(?:,|and|&)\s*ii\b|\bcategories\s+i\s*(?:,|and|&)\s*ii\b|\ball (?:categories of )?aifs?\b|\bevery aif\b/;
const FOREIGN_SCOPE: [RegExp, string][] = [
  [/\bcategory\s+i\b(?!i)/, "Category I"], [/\bcategory\s+iii\b/, "Category III"],
  [/\bangel funds?\b/, "Angel Funds"], [/\blarge value funds?\b|\blvfs?\b/, "Large Value Funds"],
  [/\bopen[- ]ended\b/, "open-ended schemes"], [/\bventure capital funds?\b|\bvcfs?\b/, "Venture Capital Funds"],
];

/** the sentence in `clause` containing the first match of `re`, original case */
function matchedSentence(clause: string, re: RegExp): string {
  const m = re.exec(clause.toLowerCase());
  if (!m) return clause;
  const start = clause.lastIndexOf(".", m.index) + 1;
  const dot = clause.indexOf(".", m.index);
  return clause.slice(start, dot === -1 ? clause.length : dot + 1).trim();
}

/** the slice of a profile this agent compares a clause against. Defaults to
    the seeded Molecule profile; the profile in data/entity.ts. */
export interface ApplicabilityEntity {
  legalName: string;
  intermediaryTypes: IntermediaryType[];
  segments: BusinessSegment[];
}

const seededEntity: ApplicabilityEntity = {
  legalName: molecule.legalName,
  intermediaryTypes: molecule.intermediaryTypes,
  segments: molecule.segments,
};

export interface ApplicabilityOutcome {
  verdict: ApplicabilityVerdict;
  /** true ⇒ the clause is worth spending an extraction call on */
  proceed: boolean;
  /** the clause phrases that carried the decision, for the trace */
  matchedCapacities: string[];
  matchedSegments: BusinessSegment[];
  matchedForeignCapacities: IntermediaryType[];
  matchedScope?: string;
}

export function assessApplicability(
  clauseText: string,
  chapter?: string,
  entity: ApplicabilityEntity = seededEntity,
): ApplicabilityOutcome {
  const held = new Set<IntermediaryType>(entity.intermediaryTypes);
  const declaredSegments = new Set<BusinessSegment>(entity.segments);
  const text = clauseText.toLowerCase();

  /* ── AIF category scope — before any capacity check ───────────────────
     Only when the firm actually holds the AIF-manager capacity. */
  const chapterTitle = chapter ? CHAPTER_LABEL[chapter] ?? "" : "";
  const scope = `${chapterTitle}\n${clauseText}`.toLowerCase();
  if (held.has("aif-manager") && !NAMES_HELD.test(scope)) {
    const foreign = FOREIGN_SCOPE.find(([re]) => re.test(scope));
    if (foreign) {
      const [re, label] = foreign;
      const inTitle = chapterTitle.length > 0 && re.test(chapterTitle.toLowerCase());
      const where = inTitle ? "chapter title" : "clause";
      const citedText = (inTitle ? chapterTitle : matchedSentence(clauseText, re)).slice(0, 180);
      return {
        verdict: {
          verdict: "not-applicable",
          reasoning: `The ${where} addresses ${label}. ${entity.legalName} manages Category II only; a rule scoped to ${label} does not enter this register.`,
          citedText,
          confidence: 0.9,
        },
        proceed: false,
        matchedCapacities: [],
        matchedSegments: [],
        matchedForeignCapacities: [],
        matchedScope: label,
      };
    }
  }

  const matchedCapacities: string[] = [];
  for (const capacity of held) {
    matchedCapacities.push(...hits(text, CAPACITY_PHRASES[capacity]));
  }

  const matchedForeignCapacities: IntermediaryType[] = [];
  for (const capacity of Object.keys(CAPACITY_PHRASES) as IntermediaryType[]) {
    if (held.has(capacity)) continue;
    if (hits(text, CAPACITY_PHRASES[capacity]).length > 0) matchedForeignCapacities.push(capacity);
  }

  const matchedSegments: BusinessSegment[] = [];
  for (const segment of declaredSegments) {
    const phrases = SEGMENT_PHRASES[segment];
    if (phrases && hits(text, phrases).length > 0) matchedSegments.push(segment);
  }

  /* ── the three outcomes ─────────────────────────────────────────────── */

  if (matchedCapacities.length === 0 && matchedForeignCapacities.length > 0) {
    const names = matchedForeignCapacities.join(", ");
    return {
      verdict: {
        verdict: "not-applicable",
        reasoning: `The clause addresses ${names}. ${entity.legalName} is onboarded as ${entity.intermediaryTypes.join(" and ")} and declares no such capacity, and the clause carries no phrase addressing a capacity the firm holds. The rulebook for an intermediary the firm is not does not enter this register.`,
        citedText: clauseText.slice(0, 180),
        confidence: 0.86,
      },
      proceed: false,
      matchedCapacities,
      matchedSegments,
      matchedForeignCapacities,
    };
  }

  if (matchedCapacities.length > 0) {
    const segmentNote =
      matchedSegments.length > 0
        ? ` It also touches declared business lines: ${matchedSegments.join(", ")}.`
        : "";
    return {
      verdict: {
        verdict: "applies",
        reasoning: `The clause addresses "${matchedCapacities[0]}". ${entity.legalName} holds that capacity — ${entity.intermediaryTypes.join(", ")}.${segmentNote}`,
        citedText: clauseText.slice(0, 180),
        confidence: matchedSegments.length > 0 ? 0.96 : 0.92,
      },
      proceed: true,
      matchedCapacities,
      matchedSegments,
      matchedForeignCapacities,
    };
  }

  /* Neither an addressed capacity nor a foreign one. In a master circular the
     addressee is set once at the head of the instrument and most paragraphs
     never repeat it, so silence here is not a "no". We proceed, and we say
     plainly that we are relying on the parent instrument rather than on
     anything in the paragraph itself. */
  return {
    verdict: {
      verdict: "partial",
      reasoning: `The paragraph names no intermediary capacity of its own. Applicability is therefore inherited from the parent instrument, whose addressee line binds ${entity.intermediaryTypes.join(" and ")}, and not established from the clause text. Proceeding to extraction on that basis; the verifier still requires every drafted obligation to scope to a capacity the firm holds.`,
      citedText: clauseText.slice(0, 180),
      confidence: 0.64,
    },
    proceed: true,
    matchedCapacities,
    matchedSegments,
    matchedForeignCapacities,
  };
}
