/* ══════════════════════════════════════════════════════════════════════
   Poneglyph — the Worker.

   The static export in ./out is the product's surface. This script sits in
   front of exactly one path prefix, /api/*, and hands everything else to
   the asset binding untouched. `run_worker_first` in wrangler.jsonc pins
   that split at the edge, so the site's routing, trailing-slash handling
   and 404 page behave byte-identically to the assets-only deployment.

   What lives here is the part of the engine that has to actually run:
     · a real SHA-256 hash chain that can be verified and can be broken
     · a deterministic verifier that reads real text
     · a human gate that mutates persisted state
     · one language-model call, grounded to real character offsets
   ══════════════════════════════════════════════════════════════════════ */

import type { AuditEvent } from "../lib/schema";
import { bindEvidence, type EvidenceInput } from "./evidence";
import { modelOf } from "./extract";
import { decide } from "./gate";
import { chainTip, verifyChain } from "./hash";
import { asString, error, gateAllowed, json, preflight, readJson } from "./http";
import { isChapterKey, newRun, runPipeline } from "./pipeline";
import {
  loadRun,
  makeRunWriter,
  nextRunId,
  resolveSession,
  saveSession,
  seededCounts,
} from "./session";
import type {
  DecisionKind,
  Env,
  ExecutionContext,
  LiveRun,
  ScheduledController,
  SessionState,
} from "./types";
import { getWatch, pollWatch } from "./watch";

const MAX_CLAUSE_CHARS = 12_000;

/* ── Views ──────────────────────────────────────────────────────────── */

function liveEvents(state: SessionState): AuditEvent[] {
  return state.chain.slice(state.seededChainLength);
}

function stateCounts(state: SessionState, runs: LiveRun[]): Record<string, number> {
  return {
    pendingReview: state.pending.length,
    approved: state.register.length,
    rejected: state.rejected.length,
    liveObligations: state.pending.length + state.register.length + state.rejected.length,
    met: state.register.filter((o) => o.status === "met").length,
    evidence: state.evidence.length,
    runs: runs.length,
    runsAwaitingApproval: runs.filter((r) => r.status === "awaiting-approval").length,
    runsFailed: runs.filter((r) => r.status === "failed").length,
    chainLength: state.chain.length,
    seededChainLength: state.seededChainLength,
    liveAuditEvents: state.chain.length - state.seededChainLength,
  };
}

async function loadRuns(env: Env, state: SessionState): Promise<LiveRun[]> {
  const runs: LiveRun[] = [];
  for (const id of state.runIds) {
    const run = await loadRun(env, state.sessionId, id);
    if (run) runs.push(run);
  }
  return runs;
}

/* ── Routes ─────────────────────────────────────────────────────────── */

async function handleApi(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL,
): Promise<Response> {
  const path = url.pathname.replace(/\/+$/, "") || "/api";
  const method = request.method.toUpperCase();

  /* health — deliberately session-free, so a monitor never seeds a sandbox */
  if (path === "/api/health") {
    if (method !== "GET") return error(request, 405, "GET only");
    return json(request, {
      ok: true,
      hasModelKey: Boolean(env.OPEN_ROUTER_KEY),
      hasGateToken: Boolean(env.GATE_TOKEN),
      model: modelOf(env),
      seededCounts,
    });
  }

  /* watchtower — GLOBAL state, deliberately before any session touch: the
     SEBI feed is objective, and polling it must never seed a sandbox */
  if (path === "/api/watch") {
    if (method !== "GET") return error(request, 405, "GET only");
    return json(request, await getWatch(env));
  }
  if (path === "/api/watch/poll") {
    if (method !== "POST") return error(request, 405, "POST only");
    const body = await readJson(request);
    return json(request, await pollWatch(env, body?.force === true));
  }

  const state = await resolveSession(env);

  if (path === "/api/state") {
    if (method !== "GET") return error(request, 405, "GET only");
    const runs = await loadRuns(env, state);
    return json(request, {
      sessionId: state.sessionId,
      /* the LIVE delta only — the 43 seeded rows are already in the bundle */
      obligations: [...state.pending, ...state.register],
      rejected: state.rejected,
      evidence: state.evidence,
      decisions: state.decisions,
      auditEvents: state.chain,
      chainTip: chainTip(state.chain),
      runs,
      counts: stateCounts(state, runs),
    });
  }

  if (path === "/api/audit") {
    if (method !== "GET") return error(request, 405, "GET only");
    return json(request, {
      events: state.chain,
      count: state.chain.length,
      seededCount: state.seededChainLength,
      liveCount: state.chain.length - state.seededChainLength,
      tip: chainTip(state.chain),
    });
  }

  if (path === "/api/audit/verify") {
    if (method !== "POST") return error(request, 405, "POST only");
    const verdict = await verifyChain(state.chain);
    return json(request, {
      intact: verdict.intact,
      count: verdict.count,
      breaks: verdict.breaks,
      tip: verdict.tip,
      method:
        'Each event was re-hashed with SHA-256 over id|at|actor|action|subjectType|subjectId|detail|prevHash and compared with its stored hash. No stored hash was trusted.',
    });
  }

  if (path === "/api/runs") {
    if (method !== "POST") return error(request, 405, "POST only");
    if (!gateAllowed(request, env))
      return error(request, 401, "x-gate-token header missing or wrong; the gate signs nothing unauthenticated");
    return startRun(request, env, ctx, state);
  }

  const runMatch = path.match(/^\/api\/runs\/([A-Za-z0-9-]{1,32})$/);
  if (runMatch) {
    if (method !== "GET") return error(request, 405, "GET only");
    const run = await loadRun(env, state.sessionId, runMatch[1]);
    if (!run) return error(request, 404, `no run ${runMatch[1]} in this sandbox`);

    /* Staleness reconciliation, done at READ time on purpose.
       The pipeline runs inside ctx.waitUntil(), and the edge may evict that
       task before a slow provider answers — in which case nothing is left
       alive to record the failure, and the run would report "running" for
       ever. So we never ask the background task to report its own death:
       if a run has sat in `running` past the budget, the reader settles it.
       Honest failure beats an eternal spinner. */
    const RUN_BUDGET_MS = 300_000;
    const ageMs = Date.now() - new Date(run.startedAt).getTime();
    if (run.status === "running" && ageMs > RUN_BUDGET_MS) {
      run.status = "failed";
      run.error =
        `Extraction exceeded the ${Math.round(RUN_BUDGET_MS / 1000)}s budget. ` +
        `The model is served on free-tier capacity with no concurrency guarantee, ` +
        `so a call can hang past the edge runtime's lifetime for a background task. ` +
        `Nothing was written to the register. Re-run the clause to try again.`;
      run.finishedAt = new Date().toISOString();
      run.durationSec = Math.round(ageMs / 1000);
      run.steps = [
        ...run.steps,
        {
          agent: "verifier",
          at: run.finishedAt,
          action: "settle_stale_run(budget_exceeded)",
          observation:
            "Run abandoned by the extraction step and settled by the reader. " +
            "No obligation was drafted, so none could reach the human gate.",
        },
      ];
      await makeRunWriter(env, state.sessionId)(run);
    }

    return json(request, {
      id: run.id,
      status: run.status,
      trigger: run.trigger,
      input: run.input,
      steps: run.steps,
      verifierChecks: run.verifierChecks,
      proposed: run.proposed,
      error: run.error,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      durationSec:
        run.status === "running"
          ? Math.round((Date.now() - new Date(run.startedAt).getTime()) / 1000)
          : run.durationSec,
    });
  }

  const decisionMatch = path.match(/^\/api\/obligations\/([A-Za-z0-9-]{1,32})\/decision$/);
  if (decisionMatch) {
    if (method !== "POST") return error(request, 405, "POST only");
    if (!gateAllowed(request, env))
      return error(request, 401, "x-gate-token header missing or wrong; the gate signs nothing unauthenticated");
    return handleDecision(request, env, state, decisionMatch[1]);
  }

  const evidenceMatch = path.match(/^\/api\/obligations\/([A-Za-z0-9-]{1,32})\/evidence$/);
  if (evidenceMatch) {
    if (method !== "POST") return error(request, 405, "POST only");
    if (!gateAllowed(request, env))
      return error(request, 401, "x-gate-token header missing or wrong; the gate signs nothing unauthenticated");
    return handleEvidence(request, env, state, evidenceMatch[1]);
  }

  return error(request, 404, `no API route for ${method} ${url.pathname}`);
}

/* ── POST /api/obligations/:id/evidence ─────────────────────────────── */

async function handleEvidence(
  request: Request,
  env: Env,
  state: SessionState,
  obligationId: string,
): Promise<Response> {
  const body = await readJson(request);
  if (!body) return error(request, 400, "expected a JSON object body");

  const kind = asString(body.kind);
  if (kind !== "document" && kind !== "data-check" && kind !== "live-scan") {
    return error(request, 400, 'kind must be one of "document", "data-check" or "live-scan"');
  }

  const title = asString(body.title);
  if (!title || title.length > 120) {
    return error(request, 400, "title is required and must be 1–120 characters");
  }

  const description = typeof body.description === "string" ? body.description : "";
  if (description.length > 600) return error(request, 400, "description must be at most 600 characters");

  const officer = asString(body.officer);
  if (!officer || officer.length > 120) {
    return error(request, 400, "officer is required and must be 1–120 characters — an unsigned bind is not a bind");
  }

  const sha256 = asString(body.sha256);
  if (sha256 !== undefined && !/^[0-9a-f]{64}$/.test(sha256)) {
    return error(request, 400, "sha256, if given, must be 64 lowercase hex characters");
  }

  const validUntil = asString(body.validUntil);
  if (validUntil !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) {
    return error(request, 400, "validUntil, if given, must be an ISO date YYYY-MM-DD");
  }

  const fileName = asString(body.fileName);
  if (fileName !== undefined && fileName.length > 200) {
    return error(request, 400, "fileName must be at most 200 characters");
  }

  const input: EvidenceInput = { kind, title, description, fileName, sha256, validUntil };
  const result = await bindEvidence(state, obligationId, input, officer);
  if (result === "not-found") {
    return error(request, 404, `no obligation ${obligationId} in the register`, {
      hint: "Evidence binds only to an approved duty already on the register.",
    });
  }

  await saveSession(env, state);
  const auditEvent = state.chain.find((e) => e.id === result.auditEventId);
  return json(request, {
    evidence: result.evidence,
    obligation: result.obligation,
    auditEvent,
    chainTip: chainTip(state.chain),
  });
}

/* ── POST /api/runs ─────────────────────────────────────────────────── */

async function startRun(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  state: SessionState,
): Promise<Response> {
  if (!env.OPEN_ROUTER_KEY) {
    return error(
      request,
      503,
      "The extraction model is not configured on this deployment, so no run can be started. Set OPEN_ROUTER_KEY as a Worker secret (MODEL optional, default z-ai/glm-5.3-flash).",
      { hasModelKey: Boolean(env.OPEN_ROUTER_KEY) },
    );
  }

  const body = await readJson(request);
  if (!body) return error(request, 400, "expected a JSON object body");

  const clauseText = asString(body.clauseText);
  const para = asString(body.para);
  const chapter = asString(body.chapter);
  if (!clauseText) return error(request, 400, "clauseText is required and must be non-empty");
  if (clauseText.length > MAX_CLAUSE_CHARS) {
    return error(
      request,
      413,
      `clauseText is ${clauseText.length} characters; this sandbox extracts one paragraph at a time, up to ${MAX_CLAUSE_CHARS}`,
    );
  }
  if (!para) return error(request, 400, "para is required, e.g. \"46.3\"");
  if (!chapter || !isChapterKey(chapter)) {
    return error(request, 400, `chapter must be a ChapterKey from lib/schema.ts; got "${chapter ?? ""}"`);
  }

  /* One extraction at a time per sandbox. The provider rejects concurrent
     calls outright, so a second run would fail for a reason that has nothing
     to do with compliance. Refuse it here with a plain explanation instead. */
  const lastRunId = state.runIds[state.runIds.length - 1];
  if (lastRunId) {
    const last = await loadRun(env, state.sessionId, lastRunId);
    if (last?.status === "running") {
      return error(
        request,
        409,
        `${last.id} is still running in this sandbox. Extraction calls are serialised because the provider rejects concurrent requests; wait for it to finish or reset the session.`,
        { runId: last.id },
      );
    }
  }

  const input = {
    clauseText,
    para,
    chapter,
    circularId: asString(body.circularId) ?? "MC-SB-2025",
  };

  const run = newRun(nextRunId(state), input);
  state.runIds.push(run.id);
  await saveSession(env, state);
  await env.PONEGLYPH_STATE.put(`run:${state.sessionId}:${run.id}`, JSON.stringify(run), {
    expirationTtl: 60 * 60 * 24 * 7,
  });

  /* return now; the pipeline keeps writing after the response is sent */
  ctx.waitUntil(runPipeline(env, state.sessionId, run));

  return json(request, { runId: run.id, status: "running" }, { status: 202 });
}

/** A run sits at `awaiting-approval` until every obligation it drafted has
    been decided one way or the other; only then is it done. Reporting a run
    as complete while a draft is still unreviewed would misstate the gate. */
async function closeRunIfFullyDecided(
  env: Env,
  state: SessionState,
  runId: string,
): Promise<void> {
  const run = await loadRun(env, state.sessionId, runId);
  if (!run || run.status !== "awaiting-approval") return;

  const decided = new Set(state.decisions.map((d) => d.obligationId));
  if (!run.proposed.every((o) => decided.has(o.id))) return;

  run.status = "completed";
  await env.PONEGLYPH_STATE.put(`run:${state.sessionId}:${run.id}`, JSON.stringify(run), {
    expirationTtl: 60 * 60 * 24 * 7,
  });
}

/* ── POST /api/obligations/:id/decision ─────────────────────────────── */

async function handleDecision(
  request: Request,
  env: Env,
  state: SessionState,
  obligationId: string,
): Promise<Response> {
  const body = await readJson(request);
  if (!body) return error(request, 400, "expected a JSON object body");

  const decisionRaw = asString(body.decision);
  if (decisionRaw !== "approve" && decisionRaw !== "reject") {
    return error(request, 400, 'decision must be "approve" or "reject"');
  }
  const decision: DecisionKind = decisionRaw;

  const officer = asString(body.officer);
  if (!officer) {
    return error(
      request,
      400,
      "officer is required — the gate records who accepted the obligation, and an unsigned approval is not an approval",
    );
  }
  if (officer.length > 120) return error(request, 400, "officer name is implausibly long");

  const result = await decide(state, obligationId, decision, officer);

  if (result === "not-found") {
    return error(request, 404, `no obligation ${obligationId} awaiting decision in this sandbox`, {
      hint: "Only obligations drafted by a run in this session pass through the gate. The seeded register is read-only.",
    });
  }
  if (result === "already-decided") {
    return error(
      request,
      409,
      `${obligationId} is not pending-review — it has already been decided in this sandbox`,
    );
  }

  await saveSession(env, state);
  await closeRunIfFullyDecided(env, state, result.obligation.createdByRun);
  const auditEvent = state.chain.find((e) => e.id === result.auditEventId);

  return json(request, {
    obligation: result.obligation,
    auditEvent,
    chainTip: chainTip(state.chain),
  });
}

/* ── Entry ──────────────────────────────────────────────────────────── */

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    /* Anything that is not the API belongs to the static site, untouched.
       This is the first and last word on routing: get it wrong and the whole
       deployment goes dark. */
    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    if (request.method.toUpperCase() === "OPTIONS") return preflight(request);

    try {
      return await handleApi(request, env, ctx, url);
    } catch (e) {
      const err = e as Error;
      return error(request, 500, `unhandled error: ${err.message || "unknown"}`);
    }
  },

  /* hourly cron — the feed declares <ttl>60</ttl>, so hourly is respectful.
     The same poll the button calls; failures are recorded, never invented. */
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    await pollWatch(env, false);
  },
};
