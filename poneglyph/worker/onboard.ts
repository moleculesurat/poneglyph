/* ══════════════════════════════════════════════════════════════════════
   Live onboarding — the seeded Angel One determination, computed HERE.

   POST /api/onboard takes a declared profile and runs the same four steps
   the seeded record documents — designation, scope, documents, activation
   — deterministically, with no model call and no guessing:

     · every declared figure is stamped "declared · unverified — filings
       connector out of sandbox scope" and never promoted;
     · a QSB parameter the caller did not declare is "not computable",
       never estimated (mirroring data/entity.ts qsbBasis);
     · document asks are the catalogue in data/documents.ts filtered and
       parameterised by THIS profile — no MTF segment, no MTF ask; no
       algo segment, no algo ask; and the non-ask is FILED as a waiver
       with its reason, exactly like DOC-REQ-027/028 in the seed;
     · the outcome lands on the session's hash chain via appendEvent, the
       only way anything joins the trail.
   ══════════════════════════════════════════════════════════════════════ */

import type { AuditEvent, BusinessSegment, CscrfGrade, DocumentRequirement } from "../lib/schema";
import { CSCRF_GRADE_LABEL, QSB, domainByPart } from "../lib/domains";
import { documentRequirements } from "../data/documents";
import { appendEvent } from "./audit";
import type {
  LiveDocumentRequirement,
  LiveEntity,
  LiveEntityProfile,
  QsbDetermination,
  QsbParameterScore,
  SessionState,
} from "./types";

export const DECLARED_LABEL =
  "declared · unverified — filings connector out of sandbox scope";

/* ── Input validation ───────────────────────────────────────────────── */

const EXCHANGES = ["NSE", "BSE", "MCX", "NCDEX"] as const;

const SEGMENTS: readonly BusinessSegment[] = [
  "equity-cash",
  "equity-derivatives",
  "currency-derivatives",
  "commodity-derivatives",
  "debt-segment",
  "depository-participant",
  "research-analyst",
  "investment-adviser",
  "portfolio-manager",
  "mutual-fund-distribution",
  "margin-trading-facility",
  "algo-trading",
  "internet-trading",
];

export interface OnboardInput {
  legalName: string;
  exchanges: string[];
  segments: BusinessSegment[];
  otherRegistrations: { portfolioManager: boolean; investmentAdviser: boolean };
  declared: { activeClients?: number; netWorthCr?: number; clientAssetsCr?: number };
}

export type OnboardParse = { ok: true; input: OnboardInput } | { ok: false; error: string };

function readDeclaredNumber(
  raw: Record<string, unknown>,
  field: "activeClients" | "netWorthCr" | "clientAssetsCr",
  max: number,
  integer: boolean,
): { value?: number; error?: string } {
  const value = raw[field];
  if (value === undefined || value === null) return {};
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    return {
      error: `declared.${field} must be a ${integer ? "non-negative integer" : "finite non-negative number"} no greater than ${max}`,
    };
  }
  return { value };
}

export function parseOnboardInput(body: Record<string, unknown>): OnboardParse {
  const legalName = typeof body.legalName === "string" ? body.legalName.trim() : "";
  if (legalName.length < 2 || legalName.length > 120) {
    return { ok: false, error: "legalName is required — 2 to 120 characters" };
  }

  if (!Array.isArray(body.exchanges) || body.exchanges.length === 0) {
    return {
      ok: false,
      error: `exchanges must be a non-empty array drawn from ${EXCHANGES.join("/")}`,
    };
  }
  const exchanges: string[] = [];
  for (const raw of body.exchanges) {
    if (typeof raw !== "string" || !(EXCHANGES as readonly string[]).includes(raw)) {
      return {
        ok: false,
        error: `"${String(raw)}" is not a recognised exchange — expected a subset of ${EXCHANGES.join("/")}`,
      };
    }
    if (!exchanges.includes(raw)) exchanges.push(raw);
  }

  if (!Array.isArray(body.segments) || body.segments.length === 0) {
    return { ok: false, error: "segments must be a non-empty array of BusinessSegment values" };
  }
  const segments: BusinessSegment[] = [];
  for (const raw of body.segments) {
    if (typeof raw !== "string" || !(SEGMENTS as readonly string[]).includes(raw)) {
      return {
        ok: false,
        error: `"${String(raw)}" is not a BusinessSegment from lib/schema.ts`,
      };
    }
    const segment = raw as BusinessSegment;
    if (!segments.includes(segment)) segments.push(segment);
  }

  const regsRaw = body.otherRegistrations;
  if (regsRaw === null || typeof regsRaw !== "object" || Array.isArray(regsRaw)) {
    return {
      ok: false,
      error: "otherRegistrations must be an object carrying portfolioManager and investmentAdviser",
    };
  }
  const regs = regsRaw as Record<string, unknown>;
  if (typeof regs.portfolioManager !== "boolean" || typeof regs.investmentAdviser !== "boolean") {
    return {
      ok: false,
      error:
        "otherRegistrations.portfolioManager and .investmentAdviser must both be explicit booleans — the engine will not assume a registration either way",
    };
  }

  const declaredRaw =
    body.declared !== null && typeof body.declared === "object" && !Array.isArray(body.declared)
      ? (body.declared as Record<string, unknown>)
      : {};
  const activeClients = readDeclaredNumber(declaredRaw, "activeClients", 1_000_000_000, true);
  if (activeClients.error) return { ok: false, error: activeClients.error };
  const netWorthCr = readDeclaredNumber(declaredRaw, "netWorthCr", 10_000_000, false);
  if (netWorthCr.error) return { ok: false, error: netWorthCr.error };
  const clientAssetsCr = readDeclaredNumber(declaredRaw, "clientAssetsCr", 100_000_000, false);
  if (clientAssetsCr.error) return { ok: false, error: clientAssetsCr.error };

  return {
    ok: true,
    input: {
      legalName,
      exchanges,
      segments,
      otherRegistrations: {
        portfolioManager: regs.portfolioManager,
        investmentAdviser: regs.investmentAdviser,
      },
      declared: {
        ...(activeClients.value !== undefined ? { activeClients: activeClients.value } : {}),
        ...(netWorthCr.value !== undefined ? { netWorthCr: netWorthCr.value } : {}),
        ...(clientAssetsCr.value !== undefined ? { clientAssetsCr: clientAssetsCr.value } : {}),
      },
    },
  };
}

/* ── Step 1 · QSB designation — computed, unconfirmed, never guessed ── */

/** heuristic top-cohort bands, named as such in every note they produce —
    the exchanges score these parameters against the full member population,
    which this sandbox cannot see */
const QSB_ACTIVE_CLIENT_BAND = 1_000_000;
const QSB_CLIENT_ASSETS_BAND_CR = 25_000;

function inr(n: number): string {
  return n.toLocaleString("en-IN");
}

export function scoreQsb(input: OnboardInput): QsbDetermination {
  const { activeClients, clientAssetsCr } = input.declared;
  const [pActive, pAssets, pVolumes, pMargin, pProp, pCompliance, pGrievance] = QSB.parameters;

  const parameters: QsbParameterScore[] = [];

  if (activeClients === undefined) {
    parameters.push({
      parameter: pActive,
      status: "not-computable",
      note: "Not declared at onboarding. The parameter stays unscored — the engine does not guess a client count.",
    });
  } else {
    const crosses = activeClients >= QSB_ACTIVE_CLIENT_BAND;
    parameters.push({
      parameter: pActive,
      status: crosses ? "crosses" : "does-not-cross",
      note: `${inr(activeClients)} active clients declared (${DECLARED_LABEL}). ${
        crosses ? "At or above" : "Below"
      } the ${inr(QSB_ACTIVE_CLIENT_BAND)}-client top-cohort band this sandbox uses as its proxy for the exchanges' relative ranking; the exchanges' own scoring supersedes this banding.`,
    });
  }

  if (clientAssetsCr === undefined) {
    parameters.push({
      parameter: pAssets,
      status: "not-computable",
      note: "Not declared at onboarding. The client-asset and segregation statement would settle it; the parameter stays unscored until then.",
    });
  } else {
    const crosses = clientAssetsCr >= QSB_CLIENT_ASSETS_BAND_CR;
    parameters.push({
      parameter: pAssets,
      status: crosses ? "crosses" : "does-not-cross",
      note: `Rs ${inr(clientAssetsCr)} crore of client assets declared (${DECLARED_LABEL}). ${
        crosses ? "At or above" : "Below"
      } the Rs ${inr(QSB_CLIENT_ASSETS_BAND_CR)} crore top-cohort band this sandbox uses as its proxy; the exchanges' own scoring supersedes this banding.`,
    });
  }

  parameters.push(
    {
      parameter: pVolumes,
      status: "not-computable",
      note: "Not declared and not observable from outside the firm — only exchange-issued data can settle this parameter.",
    },
    {
      parameter: pMargin,
      status: "not-computable",
      note: "Not declared. Visible to the clearing corporation and the member, not to this sandbox.",
    },
    {
      parameter: pProp,
      status: "not-computable",
      note: "Not declared and not separately disclosed at member level.",
    },
    {
      parameter: pCompliance,
      status: "not-computable",
      note: "Assigned by the exchanges from inspection and reporting history; it cannot be reconstructed here and the engine will not proxy it.",
    },
    {
      parameter: pGrievance,
      status: "not-computable",
      note: "Assigned by the exchanges. It cannot be reconstructed from declared inputs and is not proxied.",
    },
  );

  const crossing = parameters.filter((p) => p.status === "crosses");
  const unscored = parameters.filter((p) => p.status === "not-computable").length;
  const qsb = crossing.length > 0;

  return {
    qsb,
    verdict: "computed · unconfirmed",
    parameters,
    basis: qsb
      ? `Designated QSB on ${crossing.length} declared parameter(s): ${crossing
          .map((c) => c.parameter)
          .join("; ")}. ${unscored} of ${parameters.length} parameters were not computable and were left unscored, never estimated. The designation is provisional until reconciled against the QSB list published by the exchanges — under-scoping a systemically significant broker is the more expensive error, so the enhanced obligations load now and de-scope if the list contradicts this.`
      : `Does not cross on any declared parameter. ${unscored} of ${parameters.length} parameters were not computable from the declared inputs and were left unscored, never estimated. The determination is re-run on any change to the declared figures, and the exchanges' published QSB list supersedes it either way.`,
  };
}

/* ── Step 1b · CSCRF grade — derived from declared scale ────────────── */

export function gradeCscrf(
  qsb: boolean,
  input: OnboardInput,
): { grade: CscrfGrade | null; basis: string } {
  const { activeClients, netWorthCr } = input.declared;
  const worthNote =
    netWorthCr !== undefined
      ? ` Declared net worth Rs ${inr(netWorthCr)} crore (${DECLARED_LABEL}) is carried as corroborating scale, not as a banding input.`
      : "";

  if (qsb) {
    return {
      grade: "qualified",
      basis: `Graded Qualified RE because the grade is anchored to the QSB determination: QSB-designated brokers sit in the deepest tier short of an MII, and the MII band is reserved for exchanges, depositories and clearing corporations — capacities this entity does not hold. The grade inherits the QSB caveat — computed · unconfirmed — and re-grades automatically if the QSB reconciliation moves.${worthNote}`,
    };
  }

  if (activeClients === undefined) {
    return {
      grade: null,
      basis: `Not computable — no active-client figure was declared, and the framework's size bands cannot be applied to an undeclared scale. The grade is left unset rather than guessed; declaring the figure computes it.${worthNote}`,
    };
  }

  const grade: CscrfGrade =
    activeClients < 10_000
      ? "self-certification"
      : activeClients < 100_000
        ? "basic"
        : activeClients < 1_000_000
          ? "mid-size"
          : "qualified";

  return {
    grade,
    basis: `Graded ${CSCRF_GRADE_LABEL[grade]} from the declared scale: ${inr(activeClients)} active clients (${DECLARED_LABEL}), banded at under 10,000 self-certification, under 1,00,000 basic, under 10,00,000 mid-size — this sandbox's mirror of the framework's size tiers, not the exchange's categorisation, which supersedes it the moment it is supplied. Computed · unconfirmed.${worthNote}`,
  };
}

/* ── Step 2 · Scope — which Parts bind this profile ─────────────────── */

function bindScope(input: OnboardInput): {
  applicableParts: LiveEntity["applicableParts"];
  excludedParts: LiveEntity["excludedParts"];
} {
  /* Every stock broker binds I, II, III, VII, IX, X. IV binds — CSCRF at
     Part IV item 60 reaches every regulated entity, and declared technology
     segments only deepen it. V binds for body corporates (assumed — the
     certificate of incorporation ask is what confirms it). VI binds (FATCA).
     VIII is event-driven and excluded with a standing trigger watch. */
  const partViii = domainByPart("VIII");
  return {
    applicableParts: ["I", "II", "III", "IV", "V", "VI", "VII", "IX", "X"],
    excludedParts: [
      {
        part: "VIII",
        reason: `Not applicable as a standing obligation. Part VIII (${partViii?.title ?? "Default Related Provisions"}) sets the procedure that runs when a trading or clearing member is declared in default — triggered by an event, not held open continuously. Absent a default declaration it produces nothing for a compliance officer to do, evidence, or be inspected on. The determination is scoped, not deleted: the Part re-arms the moment an exchange default notice reaches the watchtower, and it is reviewable on any change in ${input.legalName}'s membership standing. This says nothing about the firm's financial condition.`,
      },
    ],
  };
}

/* ── Step 3 · Documents — the catalogue, filtered by THIS profile ───── */

type Disposition =
  | { ask: true; triggeredBy: string; name?: string; description?: string }
  | { ask: false; waivedReason: string; description?: string };

function dispose(
  req: DocumentRequirement,
  input: OnboardInput,
  qsb: QsbDetermination,
  grade: CscrfGrade | null,
): Disposition {
  const exchangeList = input.exchanges.join(", ");
  const has = (segment: BusinessSegment): boolean => input.segments.includes(segment);
  const gradeLabel = grade ? CSCRF_GRADE_LABEL[grade] : "not computable";
  const clients = input.declared.activeClients;

  switch (req.id) {
    case "DOC-REQ-001":
      return {
        ask: true,
        triggeredBy: `Stock-broker registration declared at onboarding by ${input.legalName}. No registration number was supplied and none is assumed — the certificate is what puts one on file.`,
      };
    case "DOC-REQ-002":
      return {
        ask: true,
        name: `Exchange membership certificates (${exchangeList})`,
        triggeredBy: `Declared exchange memberships: ${exchangeList}. Each membership is unverified until its certificate arrives, and the set decides which exchange-facing filings bind.`,
      };
    case "DOC-REQ-003":
      return {
        ask: true,
        triggeredBy:
          "Applicant treated as a body corporate incorporated in India — assumed at onboarding; the certificate of incorporation is what confirms it.",
      };
    case "DOC-REQ-004": {
      if (qsb.qsb) {
        const crossing = qsb.parameters
          .filter((p) => p.status === "crosses")
          .map((p) => p.parameter)
          .join("; ");
        return {
          ask: true,
          triggeredBy: `QSB computed as crossing on the declared parameter(s): ${crossing} — computed · unconfirmed until the exchange's intimation arrives.`,
        };
      }
      return {
        ask: false,
        waivedReason:
          "The QSB parameters do not cross on the declared figures, so no designation is computed and no exchange intimation exists to ask for. Re-evaluated on any change to the declared parameters; the exchanges' published QSB list supersedes the computation either way.",
      };
    }
    case "DOC-REQ-008":
      return {
        ask: true,
        triggeredBy:
          clients !== undefined
            ? `Retail client dealing — ${inr(clients)} active clients declared (${DECLARED_LABEL}); the account-opening duties bind from the first client.`
            : "Retail client dealing — no client count was declared; the account-opening duties bind from the first client, so the ask stands.",
      };
    case "DOC-REQ-010":
      if (has("margin-trading-facility")) {
        return { ask: true, triggeredBy: "Segment declared: margin-trading-facility" };
      }
      return {
        ask: false,
        waivedReason:
          "No margin-trading-facility segment was declared at onboarding. A broker that does not offer MTF is never asked for an MTF policy; declaring the segment raises this ask automatically.",
      };
    case "DOC-REQ-012":
      return {
        ask: true,
        triggeredBy:
          "Para 46 as amended on 3 Jul 2026 (CUSPA pledge-based mechanism) binds every trading member handling clients' unpaid securities.",
      };
    case "DOC-REQ-014":
      return {
        ask: true,
        triggeredBy: grade
          ? `CSCRF grade computed as ${gradeLabel} — computed · unconfirmed; the depth of the policy demanded follows the grade.`
          : "CSCRF adoption binds every regulated entity. The grade was not computable from the declared figures, so the depth of the ask is provisional until a scale figure is declared.",
      };
    case "DOC-REQ-016":
      if (grade === "qualified" || grade === "mii") {
        return {
          ask: true,
          triggeredBy: `CSCRF grade: ${gradeLabel} — own, group or third-party SOC required at this tier.`,
        };
      }
      return {
        ask: false,
        waivedReason: `CSCRF grade computed as ${gradeLabel}. Entities below the Qualified RE tier may onboard the exchanges' Market SOC instead of evidencing their own arrangement, so the ask is not raised. Re-graded automatically if the declared scale changes.`,
      };
    case "DOC-REQ-017": {
      const description =
        "Exchange approvals for each algorithm offered or used, with the current inventory of live strategies and their unique identifiers. Asked only where the profile carries the algo-trading segment.";
      if (has("algo-trading")) {
        return { ask: true, triggeredBy: "Segment declared: algo-trading", description };
      }
      return {
        ask: false,
        description,
        waivedReason:
          "No algo-trading segment was declared at onboarding; the approval-and-identifier duty attaches to algorithms the firm does not run. Declaring the segment raises this ask automatically.",
      };
    }
    case "DOC-REQ-018":
      return {
        ask: false,
        description:
          "Quarterly reporting of artificial intelligence and machine learning applications offered to or used for clients, in the prescribed format.",
        waivedReason:
          "No AI or ML application was declared at onboarding — this flow collects no such declaration yet, so the ask is evaluated and not raised. Offering or using an AI/ML system for clients raises it, with the Annexure-26 quarterly cadence attached.",
      };
    case "DOC-REQ-019":
      return {
        ask: true,
        name: "Shareholding record and change-in-control approvals",
        description:
          "Shareholding record as maintained — the exchange-filed pattern for a listed broker, the statutory share register for an unlisted one — together with any prior approval obtained for a change in control.",
        triggeredBy:
          "Body corporate — Part V binds the prior-approval gate for change in control and the periodic status reporting. Listing status is not collected by this flow, so the unlisted form of the record is accepted.",
      };
    case "DOC-REQ-023":
      return {
        ask: true,
        description:
          "Board-approved outsourcing policy with the register of vendors, the activities outsourced to each, and confirmation that no core activity has been outsourced.",
        triggeredBy: req.triggeredBy,
      };
    case "DOC-REQ-027":
      if (input.otherRegistrations.portfolioManager) {
        return {
          ask: true,
          triggeredBy:
            "SEBI Portfolio Manager registration declared at onboarding — the half-yearly PMS activity report binds.",
        };
      }
      return {
        ask: false,
        waivedReason:
          "No SEBI Portfolio Manager registration was declared at onboarding, so the half-yearly PMS activity report is not asked for. Re-evaluated on every profile change — declaring the registration raises this ask automatically.",
      };
    case "DOC-REQ-028":
      return {
        ask: false,
        waivedReason:
          "The entity is onboarded as a stock broker. No AMC or mutual fund registration was declared and none is collected by this flow, so the scheme-level compliance ask is not raised.",
      };
    /* the remaining catalogue asks bind every registered stock broker and
       carry profile-independent triggers already free of any seeded fact:
       005, 006, 007, 009, 011, 013, 015, 020, 021, 022, 024, 025, 026 */
    default:
      return { ask: true, triggeredBy: req.triggeredBy };
  }
}

export function deriveDocumentRequirements(
  input: OnboardInput,
  qsb: QsbDetermination,
  grade: CscrfGrade | null,
): LiveDocumentRequirement[] {
  return documentRequirements.map((req): LiveDocumentRequirement => {
    const outcome = dispose(req, input, qsb, grade);
    if (outcome.ask) {
      return {
        ...req,
        name: outcome.name ?? req.name,
        description: outcome.description ?? req.description,
        triggeredBy: outcome.triggeredBy,
        mandatory: true,
        disposition: "required",
      };
    }
    return {
      ...req,
      description: outcome.description ?? req.description,
      triggeredBy: "Evaluated against the declared profile and not raised — see the waiver reason.",
      mandatory: false,
      disposition: "waived",
      waivedReason: outcome.waivedReason,
    };
  });
}

/* ── Step 4 · Activation — persist and chain ────────────────────────── */

export interface OnboardOutcome {
  liveEntity: LiveEntity;
  auditEvent: AuditEvent;
}

export async function onboardEntity(
  state: SessionState,
  input: OnboardInput,
): Promise<OnboardOutcome> {
  const qsb = scoreQsb(input);
  const cscrf = gradeCscrf(qsb.qsb, input);
  const scope = bindScope(input);
  const docs = deriveDocumentRequirements(input, qsb, cscrf.grade);

  const profile: LiveEntityProfile = {
    id: "ENT-LIVE-001",
    legalName: input.legalName,
    intermediaryTypes: ["stock-broker"],
    exchanges: input.exchanges,
    segments: input.segments,
    otherRegistrations: input.otherRegistrations,
    declared: input.declared,
    declaredNote: DECLARED_LABEL,
    onboardedAt: new Date().toISOString(),
  };

  const liveEntity: LiveEntity = {
    profile,
    qsb,
    cscrfGrade: cscrf.grade,
    cscrfBasis: cscrf.basis,
    applicableParts: scope.applicableParts,
    excludedParts: scope.excludedParts,
    documentRequirements: docs,
  };

  state.liveEntity = liveEntity;

  const asks = docs.filter((d) => d.disposition === "required").length;
  const waived = docs.length - asks;
  const auditEvent = await appendEvent(state, {
    actor: "system:onboarding",
    /* subjectType "corpus" — the entity profile is the input every
       applicability decision downstream reads, and the AuditEvent union in
       lib/schema.ts carries no entity subject */
    subjectType: "corpus",
    subjectId: profile.id,
    action: "entity.onboarded",
    detail: `${input.legalName} onboarded live from a declared profile — exchanges ${input.exchanges.join("/")}; segments ${input.segments.join(", ")}; other registrations: portfolio manager ${input.otherRegistrations.portfolioManager ? "declared" : "none"}, investment adviser ${input.otherRegistrations.investmentAdviser ? "declared" : "none"}. QSB: ${qsb.qsb ? "designated" : "not designated"} (${qsb.verdict}). CSCRF grade: ${cscrf.grade ? CSCRF_GRADE_LABEL[cscrf.grade] : "not computable from the declared figures"}. Parts bound: ${scope.applicableParts.join(", ")}; Part VIII excluded as event-driven with a standing trigger watch. Document asks raised: ${asks}; evaluated and not raised: ${waived}. Every declared figure is ${DECLARED_LABEL}.`,
  });

  return { liveEntity, auditEvent };
}
