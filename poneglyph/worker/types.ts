/* ══════════════════════════════════════════════════════════════════════
   Worker runtime types and the session state shape.

   The runtime interfaces below are hand-declared rather than pulled from
   @cloudflare/workers-types — the build contract forbids new npm packages,
   and these are the only four runtime surfaces the Worker touches. They
   are structurally exact against what workerd hands us.
   ══════════════════════════════════════════════════════════════════════ */

import type { AuditEvent, Obligation, TraceStep, VerifierCheck } from "../lib/schema";

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
}
