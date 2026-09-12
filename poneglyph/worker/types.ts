/* ══════════════════════════════════════════════════════════════════════
   Worker runtime types and the session state shape.

   The runtime interfaces below are hand-declared rather than pulled from
   @cloudflare/workers-types — the build contract forbids new npm packages,
   and these are the only four runtime surfaces the Worker touches. They
   are structurally exact against what workerd hands us.
   ══════════════════════════════════════════════════════════════════════ */

import type {
  AuditEvent,
  EvidenceArtifact,
  Obligation,
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
  OPEN_ROUTER_KEY?: string;
  MODEL?: string;          // OpenRouter model id; default anthropic/claude-sonnet-5
  /** the shared-register write gate — required to start a run or record a
      decision. Optional at the type level so an unset gate is a handled 401. */
  GATE_TOKEN?: string;
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

/** per-source outcome of the last poll, recorded verbatim */
export interface WatchSourceStatus {
  fetchOk: boolean;
  httpStatus: number | null;
  items: number;
  lastError: string | null;
}

export interface WatchFeedState {
  lastPolledAt: string | null;
  lastBuildDate: string | null;
  /** true when at least one source succeeded */
  fetchOk: boolean;
  /** the REAL error from the last poll, verbatim — failing sources joined; never a canned success */
  lastError: string | null;
  /** status of each polled source, keyed by source id */
  sources: Record<string, WatchSourceStatus>;
}

export interface WatchPollResult {
  fetchOk: boolean;
  httpStatus: number | null;
  newCount: number;
  totalItems: number;
  skipped?: boolean;
  lastError?: string;
  sources?: Record<string, WatchSourceStatus>;
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

/** One tenant, one shared register. Everything mutable lives here, under
    `sess:molecule`. `pending` and `register` are separate collections ON
    PURPOSE — see worker/gate.ts for why that is the whole product claim. */
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
  /** artefacts bound to approved duties; the file stays with the firm, only its hash is kept */
  evidence: EvidenceArtifact[];
  /** id allocation, so live records never collide with the seeded ones */
  nextRunSeq: number;
  nextObligationSeq: number;
  nextEventSeq: number;
  nextEvidenceSeq: number;
}
