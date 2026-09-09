/* ══════════════════════════════════════════════════════════════════════
   Session — one shared register for the one tenant.

   There is a single KV-backed register, keyed `sess:molecule`, seeded from
   data/. Everyone who opens the app sees and mutates the same state.

   Seeding re-hashes the authored audit trail FOR REAL. The 56 events in
   data/audit.ts carry hand-written hex hashes that were never computed;
   at seed time we keep their content and recompute the entire chain from
   GENESIS with Web Crypto. From that moment the chain is arithmetic, not
   assertion — which is precisely what makes /api/audit/verify meaningful.

   Live records use their own id ranges so they can never collide with the
   seed: runs from RUN-050, obligations from OBL-SB-201, events from AE-0057.
   ══════════════════════════════════════════════════════════════════════ */

import type { AuditEvent } from "../lib/schema";
import { auditEvents } from "../data/audit";
import { obligations as seededObligations } from "../data/obligations";
import { evidence as seededEvidence } from "../data/evidence";
import { tasks as seededTasks } from "../data/tasks";
import { runs as seededRuns } from "../data/runs";
import { documentRequirements } from "../data/documents";
import { rechain } from "./hash";
import type { Env, LiveRun, SessionState } from "./types";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const RUN_TTL_SECONDS = 60 * 60 * 24 * 7;

/** The one tenant. Every request resolves to this single shared register. */
export const TENANT_SID = "molecule";

export const LIVE_RUN_SEQ_START = 50; // seeded corpus ends at RUN-049
export const LIVE_OBLIGATION_SEQ_START = 201; // seeded ends at OBL-SB-110
export const LIVE_EVENT_SEQ_START = auditEvents.length + 1; // seeded ends at AE-0056

export const seededCounts = {
  obligations: seededObligations.length,
  evidence: seededEvidence.length,
  auditEvents: auditEvents.length,
  tasks: seededTasks.length,
  runs: seededRuns.length,
  documentRequirements: documentRequirements.length,
} as const;

const sessionKey = (sid: string): string => `sess:${sid}`;
const runKey = (sid: string, runId: string): string => `run:${sid}:${runId}`;

/** Content-only view of a seeded event — its authored hash is discarded here
    on purpose, because we are about to compute the real one. */
function seedContent(e: AuditEvent): Omit<AuditEvent, "hash" | "prevHash"> {
  return {
    id: e.id,
    at: e.at,
    actor: e.actor,
    action: e.action,
    subjectType: e.subjectType,
    subjectId: e.subjectId,
    detail: e.detail,
  };
}

export async function seedSession(sessionId: string): Promise<SessionState> {
  const chain = await rechain(auditEvents.map(seedContent));
  return {
    sessionId,
    createdAt: new Date().toISOString(),
    chain,
    seededChainLength: chain.length,
    pending: [],
    register: [],
    rejected: [],
    decisions: [],
    runIds: [],
    nextRunSeq: LIVE_RUN_SEQ_START,
    nextObligationSeq: LIVE_OBLIGATION_SEQ_START,
    nextEventSeq: LIVE_EVENT_SEQ_START,
  };
}

export async function loadSession(env: Env, sid: string): Promise<SessionState | null> {
  const raw = await env.PONEGLYPH_STATE.get(sessionKey(sid));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export async function saveSession(env: Env, state: SessionState): Promise<void> {
  await env.PONEGLYPH_STATE.put(sessionKey(state.sessionId), JSON.stringify(state), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
}

/** Load the one shared register, seeding it the first time it is asked for. */
export async function resolveSession(env: Env): Promise<SessionState> {
  const existing = await loadSession(env, TENANT_SID);
  if (existing) return existing;
  const state = await seedSession(TENANT_SID);
  await saveSession(env, state);
  return state;
}

/* ── Live runs ──────────────────────────────────────────────────────────
   Runs live under their own keys, not inside the session blob. The pipeline
   writes progress every step; a decision writes the session. Separate keys
   mean a three-minute extraction cannot clobber an approval
   that happened while it was in flight. */

export async function loadRun(env: Env, sid: string, runId: string): Promise<LiveRun | null> {
  const raw = await env.PONEGLYPH_STATE.get(runKey(sid, runId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LiveRun;
  } catch {
    return null;
  }
}

/** KV rate-limits writes to a single key to roughly one per second. The
    pipeline's first two steps are near-instantaneous, so space them rather
    than letting a 429 silently drop a trace step. */
export function makeRunWriter(env: Env, sid: string): (run: LiveRun) => Promise<void> {
  let lastWriteAt = 0;
  return async (run: LiveRun): Promise<void> => {
    const since = Date.now() - lastWriteAt;
    if (since < 1100) await sleep(1100 - since);
    lastWriteAt = Date.now();
    await env.PONEGLYPH_STATE.put(runKey(sid, run.id), JSON.stringify(run), {
      expirationTtl: RUN_TTL_SECONDS,
    });
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function nextRunId(state: SessionState): string {
  const id = `RUN-${String(state.nextRunSeq).padStart(3, "0")}`;
  state.nextRunSeq += 1;
  return id;
}

export function nextObligationId(state: SessionState): string {
  const id = `OBL-SB-${String(state.nextObligationSeq).padStart(3, "0")}`;
  state.nextObligationSeq += 1;
  return id;
}

export function nextEventId(state: SessionState): string {
  const id = `AE-${String(state.nextEventSeq).padStart(4, "0")}`;
  state.nextEventSeq += 1;
  return id;
}
