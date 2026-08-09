/* ══════════════════════════════════════════════════════════════════════
   The pipeline — watcher → applicability → extraction → verifier → gate.

   POST /api/runs returns a run id immediately and the work happens in
   ctx.waitUntil(). Progress is written to KV after each step, so polling
   GET /api/runs/:id shows the trace filling in while the model is still
   thinking. That is not decoration: an extraction call can take three
   minutes, and a glass box that shows nothing for three minutes is a
   black box.

   This module cannot approve anything. It has no import of the register.
   Its terminal state on success is `awaiting-approval`.
   ══════════════════════════════════════════════════════════════════════ */

import type { ChapterKey, Obligation, TraceStep } from "../lib/schema";
import { CHAPTER_PART } from "../lib/domains";
import { tenant } from "../data/tenant";
import { assessApplicability } from "./applicability";
import { appendEvent } from "./audit";
import { ExtractionError, extractObligations } from "./extract";
import { proposeObligation } from "./gate";
import { chainTip, verifyChain } from "./hash";
import { loadSession, makeRunWriter, saveSession } from "./session";
import type { Env, LiveRun, RunInput } from "./types";
import { buildDrafts, precheck, runVerifier } from "./verifier";

export const CHAPTER_KEYS = Object.keys(CHAPTER_PART) as ChapterKey[];

export function isChapterKey(value: string): value is ChapterKey {
  return (CHAPTER_KEYS as string[]).includes(value);
}

const now = (): string => new Date().toISOString();

function step(agent: TraceStep["agent"], fields: Omit<TraceStep, "agent" | "at">): TraceStep {
  return { agent, at: now(), ...fields };
}

function elapsed(run: LiveRun): number {
  return Math.round((Date.now() - new Date(run.startedAt).getTime()) / 1000);
}

export function newRun(id: string, input: RunInput): LiveRun {
  return {
    id,
    trigger: `manual clause submission — ${input.circularId} para ${input.para} (${input.chapter})`,
    input,
    status: "running",
    startedAt: now(),
    durationSec: 0,
    steps: [],
    verifierChecks: [],
    proposed: [],
  };
}

/** Terminate a run and record the outcome on the trail. Session writes are
    read-modify-write against the freshest state, because a decision may have
    landed while the model was thinking. */
async function finish(
  env: Env,
  sid: string,
  run: LiveRun,
  write: (r: LiveRun) => Promise<void>,
  audit: { action: string; detail: string } | null,
): Promise<void> {
  run.finishedAt = now();
  run.durationSec = elapsed(run);
  if (audit) {
    const state = await loadSession(env, sid);
    if (state) {
      await appendEvent(state, {
        actor: "system:pipeline",
        action: audit.action,
        subjectType: "run",
        subjectId: run.id,
        detail: audit.detail,
      });
      await saveSession(env, state);
    }
  }
  await write(run);
}

export async function runPipeline(env: Env, sid: string, run: LiveRun): Promise<void> {
  const write = makeRunWriter(env, sid);
  const input = run.input;

  try {
    /* ── 1. watcher ───────────────────────────────────────────────────── */
    run.steps.push(
      step("watcher", {
        action: `receive_clause(${input.circularId}, para ${input.para}, chapter ${input.chapter})`,
        observation: `${input.clauseText.length} characters accepted and pinned as the grounding text for this run. Every citation drafted downstream is checked against this exact string.`,
      }),
    );
    await write(run);

    /* ── 2. applicability ─────────────────────────────────────────────── */
    const applicability = assessApplicability(input.clauseText);
    run.steps.push(
      step("applicability", {
        thought: applicability.verdict.reasoning,
        action: `match_capacities(entity=${tenant.name}, clause)`,
        observation: `Verdict: ${applicability.verdict.verdict} (confidence ${applicability.verdict.confidence.toFixed(2)}).${
          applicability.matchedCapacities.length > 0
            ? ` Clause phrases matched: ${applicability.matchedCapacities.join(", ")}.`
            : ""
        }${
          applicability.matchedForeignCapacities.length > 0
            ? ` Capacities addressed but not held: ${applicability.matchedForeignCapacities.join(", ")}.`
            : ""
        }`,
      }),
    );

    if (!applicability.proceed) {
      run.status = "completed";
      run.steps.push(
        step("human-gate", {
          action: "no_draft()",
          observation:
            "Clause does not bind this entity, so nothing was drafted and no extraction call was made. Nothing to approve.",
        }),
      );
      await finish(env, sid, run, write, {
        action: "run.completed",
        detail: `${run.id} closed at applicability — ${input.circularId} para ${input.para} does not bind ${tenant.name}. ${applicability.verdict.reasoning} No extraction call was made and no obligation was drafted.`,
      });
      return;
    }
    await write(run);

    /* ── 3. extraction — the only model call ──────────────────────────── */
    run.steps.push(
      step("extraction", {
        thought: `Clause binds the entity. Sending para ${input.para} to the extraction model for obligation drafting, with a hard requirement that every excerpt be a verbatim substring of the clause.`,
        action: `extract_obligations(model=${env.KIMI_MODEL ?? "unconfigured"}, para=${input.para})`,
        observation: "Call in flight. Serialised — the provider rejects concurrent calls.",
      }),
    );
    await write(run);

    const extraction = await extractObligations(env, input, (raw) =>
      precheck(raw, input.clauseText),
    );

    const usage =
      extraction.completionTokens !== undefined
        ? ` ${extraction.completionTokens} completion tokens${
            extraction.reasoningTokens ? ` (${extraction.reasoningTokens} of them reasoning)` : ""
          }.`
        : "";
    run.steps[run.steps.length - 1] = step("extraction", {
      thought: run.steps[run.steps.length - 1].thought,
      action: `extract_obligations(model=${extraction.model}, para=${input.para})`,
      observation: `${extraction.raw.length} obligation(s) drafted in ${(extraction.elapsedMs / 1000).toFixed(1)}s over ${extraction.attempts} attempt(s).${usage}${
        extraction.correction
          ? ` First attempt was sent back for correction: ${extraction.correction}`
          : ""
      }`,
    });
    await write(run);

    /* ── 4. verifier ──────────────────────────────────────────────────── */
    const state = await loadSession(env, sid);
    if (!state) {
      run.status = "failed";
      run.error = "the sandbox for this session expired while the run was in flight";
      await finish(env, sid, run, write, null);
      return;
    }

    const chainVerdict = await verifyChain(state.chain);
    const tip = chainTip(state.chain);
    const drafts = buildDrafts(extraction.raw, input.clauseText);
    const verdict = runVerifier(drafts, {
      clauseText: input.clauseText,
      para: input.para,
      circularId: input.circularId,
      chainTip: tip,
      proposedPrevHash: tip,
      chainIntact: chainVerdict.intact,
      chainBreaks: chainVerdict.breaks.length,
      chainLength: chainVerdict.count,
    });
    run.verifierChecks = verdict.checks;

    const failed = verdict.checks.filter((c) => !c.pass);
    run.steps.push(
      step("verifier", {
        action:
          "run_checks(citations-resolve, deadlines-parse, applicability-match, schema-valid, hash-chain-append)",
        observation: verdict.pass
          ? `All five checks passed. ${drafts.length} draft(s) cleared for the human gate.`
          : `${failed.length} of 5 checks failed — ${failed.map((c) => c.name).join(", ")}. The run stops; nothing enters the register.`,
      }),
    );

    if (!verdict.pass) {
      run.status = "failed";
      run.error = `Verifier rejected the extraction: ${failed.map((c) => `${c.name} — ${c.note}`).join(" ")}`;
      await finish(env, sid, run, write, {
        action: "run.failed",
        detail: `${run.id} was stopped by the verifier on ${input.circularId} para ${input.para}. Failed checks: ${failed.map((c) => c.name).join(", ")}. ${failed.length} of 5. No obligation was drafted into the register.`,
      });
      return;
    }

    /* ── 5. human gate ────────────────────────────────────────────────── */
    const chapter = isChapterKey(input.chapter) ? input.chapter : "registration";
    const proposed: Obligation[] = [];
    for (const draft of drafts) {
      const obligation = await proposeObligation(state, draft, {
        circularId: input.circularId,
        chapter,
        para: input.para,
        runId: run.id,
        defaultOwner: tenant.team[0]?.name ?? "Compliance Officer",
      });
      proposed.push(obligation);
      await appendEvent(state, {
        actor: "agent:extraction",
        action: "obligation.drafted",
        subjectType: "obligation",
        subjectId: obligation.id,
        detail: `Drafted by ${run.id} from ${input.circularId} para ${input.para} — "${obligation.title}", grounded to chars ${obligation.clause.charStart}–${obligation.clause.charEnd} of the clause text. Status pending-review; not in the register and not counted as an obligation until a compliance officer decides.`,
      });
    }

    await appendEvent(state, {
      actor: "system:pipeline",
      action: "run.completed",
      subjectType: "run",
      subjectId: run.id,
      detail: `${run.id} completed extraction and verification over ${input.circularId} para ${input.para} in ${elapsed(run)}s. Five of five verifier checks passed. ${proposed.length} obligation(s) drafted and held at the human gate: ${proposed.map((o) => o.id).join(", ") || "none"}.`,
    });
    await saveSession(env, state);

    run.proposed = proposed;
    run.status = "awaiting-approval";
    run.steps.push(
      step("human-gate", {
        action: `hold_for_approval(${proposed.map((o) => o.id).join(", ") || "nothing"})`,
        observation:
          proposed.length === 0
            ? "The clause stated no obligation. Nothing drafted, nothing to approve."
            : `${proposed.length} obligation(s) held at status pending-review with no approver recorded. They are not in the register. A named compliance officer must approve each one before it counts.`,
      }),
    );
    await finish(env, sid, run, write, null);
  } catch (e) {
    /* Honest failure. Nothing is invented here, ever. */
    const err = e as Error;
    run.status = "failed";
    run.error =
      err instanceof ExtractionError
        ? err.message
        : `${run.id} failed: ${err.message || "unknown error"}. Nothing was drafted and nothing entered the register.`;
    run.steps.push(
      step("extraction", {
        action: "abort()",
        observation: run.error,
      }),
    );
    await finish(env, sid, run, write, {
      action: "run.failed",
      detail: `${run.id} failed on ${input.circularId} para ${input.para}. ${run.error}`,
    });
  }
}
