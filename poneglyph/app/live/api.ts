/* ══════════════════════════════════════════════════════════════════════
   The /live client's view of the engine API.

   These types mirror worker/index.ts response shapes exactly. Nothing here
   invents a field the Worker does not send, and nothing here fabricates a
   result when a call fails — every failure surfaces as a thrown Error whose
   message is the Worker's own words.
   ══════════════════════════════════════════════════════════════════════ */

import type { AuditEvent, Obligation, TraceStep, VerifierCheck } from "@/lib/schema";

export type LiveRunStatus = "running" | "awaiting-approval" | "completed" | "failed";

export interface RunInput {
  clauseText: string;
  para: string;
  chapter: string;
  circularId: string;
}

/** GET /api/runs/:id */
export interface LiveRunView {
  id: string;
  status: LiveRunStatus;
  trigger: string;
  input: RunInput;
  steps: TraceStep[];
  verifierChecks: VerifierCheck[];
  proposed: Obligation[];
  error?: string;
  startedAt: string;
  finishedAt?: string;
  durationSec: number;
}

/** POST /api/runs — 202 */
export interface StartRunResponse {
  runId: string;
  status: "running";
}

/** GET /api/health */
export interface HealthResponse {
  ok: boolean;
  hasModelKey: boolean;
  hasGateToken: boolean;
  model: string | null;
  seededCounts: Record<string, number>;
}

/** GET /api/audit */
export interface AuditResponse {
  events: AuditEvent[];
  count: number;
  seededCount: number;
  liveCount: number;
  tip: string;
}

export interface ChainBreak {
  index: number;
  id: string;
  reason: string;
}

/** POST /api/audit/verify */
export interface VerifyResponse {
  intact: boolean;
  count: number;
  breaks: ChainBreak[];
  tip: string;
  method: string;
}

/** POST /api/obligations/:id/decision */
export interface DecisionResponse {
  obligation: Obligation;
  auditEvent?: AuditEvent;
  chainTip: string;
}

/** sessionStorage key holding the shared-register write gate token */
export const GATE_TOKEN_KEY = "gate-token";

const NO_API =
  "The engine API did not answer with JSON. /live is the one route that needs the Worker in front of the static export — a plain file-server preview of ./out serves the pages but no /api.";

function messageOf(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "error" in body) {
    const value = (body as { error: unknown }).error;
    if (typeof value === "string" && value.length > 0) return value;
  }
  return fallback;
}

/** One call to the engine. Write routes are gated by a shared token, sent in
    the x-gate-token header from sessionStorage when the operator has set one. */
export async function apiCall<T>(
  path: string,
  init: { method?: string; body?: Record<string, unknown> } = {},
): Promise<T> {
  const method = init.method ?? "GET";

  const headers: Record<string, string> = {};
  if (init.body) headers["content-type"] = "application/json";
  try {
    const token = sessionStorage.getItem(GATE_TOKEN_KEY);
    if (token !== null) headers["x-gate-token"] = token;
  } catch {
    /* sessionStorage unavailable — send the call without a gate token */
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      cache: "no-store",
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch (e) {
    throw new Error(`${method} ${path} could not be reached: ${(e as Error).message || "network error"}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    throw new Error(`${NO_API} (${method} ${path} returned HTTP ${response.status})`);
  }

  const body = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error(messageOf(body, `${method} ${path} returned HTTP ${response.status}`));
  }
  return body as T;
}

/* ── Formatting helpers shared by the /live components ──────────────── */

export function clockOf(iso: string): string {
  return iso.length >= 19 ? `${iso.slice(11, 19)}` : iso;
}

export function stampOf(iso: string): string {
  return iso.length >= 16 ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : iso;
}

export function secondsLabel(total: number): string {
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
