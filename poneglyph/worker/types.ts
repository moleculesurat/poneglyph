/* ══════════════════════════════════════════════════════════════════════
   Worker runtime types and the session state shape.

   The runtime interfaces below are hand-declared rather than pulled from
   @cloudflare/workers-types — the build contract forbids new npm packages,
   and these are the only four runtime surfaces the Worker touches. They
   are structurally exact against what workerd hands us.
   ══════════════════════════════════════════════════════════════════════ */

import type {
  AuditEvent,
  BusinessSegment,
  CscrfGrade,
  DocumentRequirement,
  IntermediaryType,
  Obligation,
  SebiPart,
  TraceStep,
  VerifierCheck,
} from "../lib/schema";

/* ── Cloudflare runtime ─────────────────────────────────────────────── */

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/** the static-assets binding — hands a request to the exported ./out site */
export interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

export interface KVListResult {
  keys: { name: string }[];
  list_complete: boolean;
  cursor?: string;
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; expiration?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<KVListResult>;
}

export interface Env {
  ASSETS: Fetcher;
  PONEGLYPH_STATE: KVNamespace;
  /* secrets — set with `wrangler secret put`, mirrored in .dev.vars locally.
     Optional at the type level so a missing key is a handled 503, never a throw. */
  KIMI_API_KEY?: string;
  KIMI_BASE_URL?: string;
  KIMI_MODEL?: string;
}

/** what the cron trigger hands to scheduled() — structurally exact */
export interface ScheduledController {
  scheduledTime: number;
  cron: string;
  noRetry(): void;
}

/* ── Watchtower ─────────────────────────────────────────────────────────
   Global state, NOT per-session: the SEBI RSS feed is objective, and two
   judges polling it should see the same catches. Keys: watch:state,
   watch:seen, watch:catches. */

export type WatchDocType =
  | "circular"
  | "master-circular"
  | "regulation"
  | "enforcement-order"
  | "recovery"
  | "press-release"
  | "other";

export type WatchVerdict = "applies" | "not-applicable" | "monitor";

export interface WatchTriage {
  verdict: WatchVerdict;
  /** always says this is heuristic — full applicability runs in the pipeline */
  reasoning: string;
  /** the title terms that carried the verdict, recorded rather than implied */
  matched: string[];
}

export interface WatchCatch {
  id: string;
  title: string;
  url: string;
  source: string;
  docType: WatchDocType;
  publishedAt: string;
  fetchedAt: string;
  triage: WatchTriage;
}

export interface WatchFeedState {
  lastPolledAt: string | null;
  lastBuildDate: string | null;
  fetchOk: boolean;
  /** the REAL error from the last poll, verbatim — never a canned success */
  lastError: string | null;
}

export interface WatchPollResult {
  fetchOk: boolean;
  httpStatus: number | null;
  newCount: number;
  totalItems: number;
  skipped?: boolean;
  lastError?: string;
}

/* ── Live entity (onboarded in-session) ─────────────────────────────────
   The same determination the seeded Angel One record shows, computed live
   and deterministically for a firm the caller declares. Every declared
   figure carries the declared-unverified label; nothing is guessed. */

export interface LiveEntityProfile {
  id: string;
  legalName: string;
  intermediaryTypes: IntermediaryType[];
  exchanges: string[];
  segments: BusinessSegment[];
  otherRegistrations: { portfolioManager: boolean; investmentAdviser: boolean };
  declared: { activeClients?: number; netWorthCr?: number; clientAssetsCr?: number };
  /** provenance label stamped on every declared figure */
  declaredNote: string;
  onboardedAt: string;
}

export type QsbParameterStatus = "crosses" | "does-not-cross" | "not-computable";

export interface QsbParameterScore {
  parameter: string;
  status: QsbParameterStatus;
  note: string;
}

export interface QsbDetermination {
  qsb: boolean;
  /** always "computed · unconfirmed" — never asserted as a designation */
  verdict: string;
  parameters: QsbParameterScore[];
  basis: string;
}

/** A catalogue requirement resolved against THIS profile. `required` means
    the ask was raised; `waived` means it was evaluated and not raised, with
    the reason filed — the non-ask is recorded like the ask. */
export interface LiveDocumentRequirement extends DocumentRequirement {
  disposition: "required" | "waived";
  waivedReason?: string;
}

export interface LiveEntity {
  profile: LiveEntityProfile;
  qsb: QsbDetermination;
  /** null when the declared figures cannot band the entity — never guessed */
  cscrfGrade: CscrfGrade | null;
  cscrfBasis: string;
  applicableParts: SebiPart[];
  excludedParts: { part: SebiPart; reason: string }[];
  documentRequirements: LiveDocumentRequirement[];
}

/* ── Live run ───────────────────────────────────────────────────────── */

/** `PipelineRun` in the ontology has no "running" state because seeded runs
    are all finished. A live run does, so it carries its own status union. */
export type LiveRunStatus = "running" | "awaiting-approval" | "completed" | "failed";

export interface RunInput {
  clauseText: string;
  para: string;
  chapter: string;
  circularId: string;
}

export interface LiveRun {
  id: string;
  trigger: string;
  input: RunInput;
  status: LiveRunStatus;
  startedAt: string;
  finishedAt?: string;
  durationSec: number;
  steps: TraceStep[];
  verifierChecks: VerifierCheck[];
  /** drafted obligations, always status `pending-review`, never approved here */
  proposed: Obligation[];
  /** honest failure text — a timed-out or refusing model says so and stops */
  error?: string;
}

/* ── Human gate ─────────────────────────────────────────────────────── */

export type DecisionKind = "approve" | "reject";

export interface DecisionRecord {
  obligationId: string;
  decision: DecisionKind;
  officer: string;
  decidedAt: string;
  auditEventId: string;
}

/* ── Session ────────────────────────────────────────────────────────── */

/** One judge, one sandbox. Everything mutable lives here, under `sess:<sid>`.
    `pending` and `register` are separate collections ON PURPOSE — see
    worker/gate.ts for why that is the whole product claim. */
export interface SessionState {
  sessionId: string;
  createdAt: string;
  /** the full hash chain: seeded events re-hashed for real, then live appends */
  chain: AuditEvent[];
  /** how many of `chain` came from the seed — anything beyond is this session's */
  seededChainLength: number;
  /** drafted, awaiting the compliance officer — NOT in the register */
  pending: Obligation[];
  /** approved by a named human; the only way an obligation gets here */
  register: Obligation[];
  /** rejected at the gate; kept for the trail, never in the register */
  rejected: Obligation[];
  decisions: DecisionRecord[];
  runIds: string[];
  /** id allocation, so live records never collide with the seeded ones */
  nextRunSeq: number;
  nextObligationSeq: number;
  nextEventSeq: number;
  /** set by /api/audit/tamper so the UI can explain what verify just caught */
  tampered?: { index: number; id: string; field: string };
  /** set by POST /api/onboard; absent on seeded-only sessions. Reset clears
      it by reseeding — a fresh session simply never has one. */
  liveEntity?: LiveEntity;
}
