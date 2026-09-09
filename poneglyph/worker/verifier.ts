/* ══════════════════════════════════════════════════════════════════════
   The verifier — five deterministic checks. No model, no judgement, no
   probability. Plain code over the actual text and the actual chain.

   citations-resolve is the one that earns the product its licence: it takes
   the excerpt the model claims to have read and searches for it in the
   clause text with an exact string search. A hallucinated citation cannot
   survive it. On a pass it also records the real character offsets, so the
   register's `charStart`/`charEnd` are measured rather than asserted.

   If ANY check fails the run stops, nothing is drafted into the session,
   and the failure is shown as it happened.
   ══════════════════════════════════════════════════════════════════════ */

import type {
  EvidenceSpec,
  IntermediaryType,
  ObligationType,
  VerifierCheck,
} from "../lib/schema";
import type { RawObligation } from "./extract";
import { normaliseAppliesTo, normaliseEvidenceKind, normaliseType } from "./extract";
import { molecule } from "../data/entity";

export const TENANT_CAPACITIES: IntermediaryType[] = molecule.intermediaryTypes;

/** A model output normalised into the ontology and located in the clause.
    Offsets are -1 until citations-resolve finds the excerpt. */
export interface DraftObligation {
  raw: RawObligation;
  title: string;
  summary: string;
  excerpt: string;
  type: ObligationType | null;
  frequency?: string;
  deadline?: string;
  appliesTo: IntermediaryType[];
  droppedCapacities: string[];
  control: { name: string; description: string };
  evidenceSpec: EvidenceSpec[];
  charStart: number;
  charEnd: number;
}

/* ── Cadence and date parsing ───────────────────────────────────────── */

const NAMED_CADENCES = new Set([
  "daily",
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "half-yearly",
  "half yearly",
  "semi-annual",
  "annual",
  "annually",
  "yearly",
  "continuous",
  "continuously",
  "event-driven",
  "on occurrence",
]);

const T_PLUS = /^t\s*\+\s*\d+$/;
const DAY_WINDOW = /^(?:within\s+)?\d+(?:\s*(?:or|\/|to|-)\s*\d+)?\s*(?:calendar\s+|trading\s+|working\s+|business\s+)?(?:day|days|week|weeks|month|months)$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type CadenceKind = "date" | "cadence" | null;

/** Resolve an emitted cadence or deadline string. Returns null when it is
    neither a real date nor a cadence the scheduler could act on — which is
    the only interesting answer, because that is what fails the run. */
export function parseCadence(value: string): CadenceKind {
  const text = value.trim().toLowerCase();
  if (text.length === 0) return null;

  if (ISO_DATE.test(text)) {
    const [y, m, d] = text.split("-").map(Number);
    const probe = new Date(Date.UTC(y, m - 1, d));
    const real =
      probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
    return real ? "date" : null;
  }

  if (NAMED_CADENCES.has(text)) return "cadence";
  if (T_PLUS.test(text)) return "cadence";
  if (DAY_WINDOW.test(text)) return "cadence";
  return null;
}

/* ── Normalisation into drafts ──────────────────────────────────────── */

export function buildDrafts(raw: RawObligation[], clauseText: string): DraftObligation[] {
  return raw.map((item): DraftObligation => {
    const { mapped, dropped } = normaliseAppliesTo(item.appliesTo);
    const charStart = clauseText.indexOf(item.excerpt);
    const deadlineKind = item.deadline ? parseCadence(item.deadline) : null;

    return {
      raw: item,
      title: item.title.trim(),
      summary: item.summary.trim(),
      excerpt: item.excerpt,
      type: normaliseType(item.type),
      /* a "deadline" the model wrote as a relative window is a cadence; keep
         it as frequency rather than pretending it is a calendar date */
      frequency:
        item.frequency?.trim() ||
        (deadlineKind === "cadence" && item.deadline ? item.deadline.trim() : undefined),
      deadline: deadlineKind === "date" && item.deadline ? item.deadline.trim() : undefined,
      appliesTo: mapped,
      droppedCapacities: dropped,
      control: { name: item.control.name.trim(), description: item.control.description.trim() },
      evidenceSpec: item.evidenceSpec
        .map((s): EvidenceSpec | null => {
          const kind = normaliseEvidenceKind(s.kind);
          return kind ? { kind, description: s.description.trim() } : null;
        })
        .filter((s): s is EvidenceSpec => s !== null),
      charStart,
      charEnd: charStart === -1 ? -1 : charStart + item.excerpt.length,
    };
  });
}

/* ── The five checks ────────────────────────────────────────────────── */

export interface VerifierContext {
  clauseText: string;
  para: string;
  circularId: string;
  /** the hash the next audit event must chain onto */
  chainTip: string;
  /** the prevHash the pipeline is about to write */
  proposedPrevHash: string;
  /** result of recomputing the existing trail from GENESIS, right now */
  chainIntact: boolean;
  chainBreaks: number;
  chainLength: number;
}

export interface VerifierOutcome {
  checks: VerifierCheck[];
  pass: boolean;
}

function citationsResolve(drafts: DraftObligation[], ctx: VerifierContext): VerifierCheck {
  const misses = drafts.filter((d) => d.charStart === -1);
  if (misses.length > 0) {
    const sample = misses[0].excerpt.slice(0, 90);
    return {
      name: "citations-resolve",
      pass: false,
      note: `${misses.length}/${drafts.length} excerpts were not found in ${ctx.circularId} para ${ctx.para}. First miss: "${sample}${misses[0].excerpt.length > 90 ? "…" : ""}". An excerpt that does not occur verbatim in the clause is an ungrounded citation; the run stops here.`,
    };
  }
  const offsets = drafts.map((d) => `${d.charStart}–${d.charEnd}`).join(", ");
  return {
    name: "citations-resolve",
    pass: true,
    note:
      drafts.length === 0
        ? `No obligations drafted, so there is nothing to ground.`
        : `${drafts.length}/${drafts.length} excerpts located verbatim in ${ctx.circularId} para ${ctx.para} by exact string search; char offsets ${offsets} recorded from the match position, not asserted.`,
  };
}

function deadlinesParse(drafts: DraftObligation[]): VerifierCheck {
  const failures: string[] = [];
  const resolved: string[] = [];

  for (const d of drafts) {
    for (const [field, value] of [
      ["deadline", d.raw.deadline],
      ["frequency", d.raw.frequency],
    ] as const) {
      if (!value || value.trim().length === 0) continue; // absent is a pass
      const kind = parseCadence(value);
      if (kind === null) failures.push(`${field} "${value}" on "${d.title}"`);
      else resolved.push(`${value} → ${kind}`);
    }
  }

  if (failures.length > 0) {
    return {
      name: "deadlines-parse",
      pass: false,
      note: `${failures.length} emitted value(s) resolved to neither a calendar date nor a schedulable cadence: ${failures.join("; ")}. A deadline the engine cannot put on a calendar cannot be monitored, so it is rejected rather than stored as prose.`,
    };
  }
  return {
    name: "deadlines-parse",
    pass: true,
    note:
      resolved.length === 0
        ? "No deadline or cadence stated in the clause; absence is not a failure."
        : `All stated periodicities parsed: ${resolved.join(", ")}.`,
  };
}

function applicabilityMatch(drafts: DraftObligation[]): VerifierCheck {
  const offScope = drafts.filter((d) => !d.appliesTo.some((c) => TENANT_CAPACITIES.includes(c)));
  if (offScope.length > 0) {
    const dropped = offScope.flatMap((d) => d.droppedCapacities);
    return {
      name: "applicability-match",
      pass: false,
      note: `${offScope.length}/${drafts.length} drafted obligations do not scope to ${TENANT_CAPACITIES.join(" or ")}. First: "${offScope[0].title}" scoped to [${offScope[0].appliesTo.join(", ") || "nothing recognisable"}]${dropped.length > 0 ? `; unmapped labels dropped: ${dropped.join(", ")}` : ""}. The register only carries duties that bind this tenant.`,
    };
  }
  const dropped = drafts.flatMap((d) => d.droppedCapacities);
  return {
    name: "applicability-match",
    pass: true,
    note:
      drafts.length === 0
        ? "No obligations drafted; nothing to scope."
        : `All ${drafts.length} drafted obligations scope to ${TENANT_CAPACITIES.join(" or ")}, consistent with the onboarded entity profile.${dropped.length > 0 ? ` Unrecognised capacity labels dropped rather than guessed: ${dropped.join(", ")}.` : ""}`,
  };
}

function schemaValid(drafts: DraftObligation[]): VerifierCheck {
  const problems: string[] = [];
  drafts.forEach((d, i) => {
    if (d.title.length === 0) problems.push(`[${i}] title empty`);
    if (d.summary.length === 0) problems.push(`[${i}] summary empty`);
    if (d.type === null) problems.push(`[${i}] type "${d.raw.type}" is not an ObligationType`);
    if (d.appliesTo.length === 0) problems.push(`[${i}] appliesTo resolved to nothing`);
    if (d.control.name.length === 0) problems.push(`[${i}] control.name empty`);
    if (d.evidenceSpec.length === 0) problems.push(`[${i}] no usable evidenceSpec`);
    if (d.excerpt.length === 0) problems.push(`[${i}] excerpt empty`);
  });

  if (problems.length > 0) {
    return {
      name: "schema-valid",
      pass: false,
      note: `${problems.length} field violation(s) against lib/schema.ts Obligation: ${problems.slice(0, 6).join("; ")}${problems.length > 6 ? " …" : ""}.`,
    };
  }
  return {
    name: "schema-valid",
    pass: true,
    note:
      drafts.length === 0
        ? "Nothing drafted; schema check vacuous."
        : `All ${drafts.length} drafts carry the required Obligation fields with correct types (title, summary, clause, type, appliesTo, control, evidenceSpec).`,
  };
}

function hashChainAppend(ctx: VerifierContext): VerifierCheck {
  if (!ctx.chainIntact) {
    return {
      name: "hash-chain-append",
      pass: false,
      note: `The existing trail does not verify — ${ctx.chainBreaks} break(s) found by recomputing all ${ctx.chainLength} events from GENESIS. Appending to a trail that has already been altered would inherit the break and disguise it. Reset the session to restore a clean chain.`,
    };
  }
  if (ctx.proposedPrevHash !== ctx.chainTip) {
    return {
      name: "hash-chain-append",
      pass: false,
      note: `Append point rejected — the pending entry names prevHash ${ctx.proposedPrevHash} but the chain tip is ${ctx.chainTip}. Writing it would fork the trail.`,
    };
  }
  return {
    name: "hash-chain-append",
    pass: true,
    note: `Trail recomputed from GENESIS: ${ctx.chainLength} events, 0 breaks. The pending entry chains onto tip ${ctx.chainTip}. Every hash is SHA-256 over the canonical event string; no stored hash was trusted.`,
  };
}

export function runVerifier(drafts: DraftObligation[], ctx: VerifierContext): VerifierOutcome {
  const checks: VerifierCheck[] = [
    citationsResolve(drafts, ctx),
    deadlinesParse(drafts),
    applicabilityMatch(drafts),
    schemaValid(drafts),
    hashChainAppend(ctx),
  ];
  return { checks, pass: checks.every((c) => c.pass) };
}

/* ── Pre-check, used only to spend the second model attempt well ────────
   Same rules as the checks above, phrased back at the model. It never
   repairs anything; it only decides whether a corrective retry is worth
   making. The real verifier still runs afterwards and can still fail. */
export function precheck(raw: RawObligation[], clauseText: string): string | null {
  const drafts = buildDrafts(raw, clauseText);

  const miss = drafts.find((d) => d.charStart === -1);
  if (miss) {
    return `the excerpt "${miss.excerpt.slice(0, 120)}" for "${miss.title}" is not a verbatim substring of the clause text. Copy the characters directly out of the clause.`;
  }

  for (const d of drafts) {
    for (const [field, value] of [
      ["deadline", d.raw.deadline],
      ["frequency", d.raw.frequency],
    ] as const) {
      if (value && value.trim() && parseCadence(value) === null) {
        return `"${value}" was given as ${field} on "${d.title}", and it is neither a YYYY-MM-DD date nor an accepted cadence. Use null, or one of the accepted cadence values.`;
      }
    }
  }

  const offScope = drafts.find((d) => !d.appliesTo.some((c) => TENANT_CAPACITIES.includes(c)));
  if (offScope && drafts.length > 0) {
    return `"${offScope.title}" has appliesTo ${JSON.stringify(offScope.raw.appliesTo)}, which does not include any of ${JSON.stringify(TENANT_CAPACITIES)}. Use only the exact enum values listed in the schema.`;
  }

  const broken = drafts.find(
    (d) => d.type === null || d.evidenceSpec.length === 0 || d.title.length === 0,
  );
  if (broken) {
    return `"${broken.title || "an obligation"}" is missing a valid "type", "title" or "evidenceSpec" entry.`;
  }

  return null;
}
