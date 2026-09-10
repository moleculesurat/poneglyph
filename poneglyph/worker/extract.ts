/* ══════════════════════════════════════════════════════════════════════
   The extraction agent — the one place a language model is used.

   Measured facts this is built around, not assumptions:
     · one successful call took 41s; another took 2m47s; one hit 300s and
       returned nothing at all
     · a second, concurrent call was rejected in 7s
     · some models are reasoning models — they spend the token budget on
       reasoning before writing content, so too small a max_tokens returns
       EMPTY content; the budget below was raised to 16k for that reason
   So: calls are serialised, generously budgeted, timed out at 240s, and
   attempted at most twice.

   The single rule that outranks everything: on failure we FAIL. A run that
   says "the model timed out" is a good run. A run that quietly invents an
   obligation would make the whole product worthless.
   ══════════════════════════════════════════════════════════════════════ */

import type { EvidenceKind, IntermediaryType, ObligationType } from "../lib/schema";
import type { Env, RunInput } from "./types";
import { sleep } from "./session";

const MAX_TOKENS = 16000;
const CALL_TIMEOUT_MS = 240_000;
const MAX_ATTEMPTS = 2;

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
export const DEFAULT_MODEL = "z-ai/glm-5.3-flash";
export function modelOf(env: Env): string {
  return env.MODEL?.trim() || DEFAULT_MODEL;
}

/* ── Serialisation ──────────────────────────────────────────────────────
   The provider rejects a concurrent second call outright. Within an isolate
   this promise chain makes every extraction wait its turn instead of racing.
   Across isolates we cannot serialise, so the caller also refuses to start a
   second run while one is in flight for the same session, and a rejection is
   retried with backoff. */
let callChain: Promise<unknown> = Promise.resolve();

function serialised<T>(fn: () => Promise<T>): Promise<T> {
  const next = callChain.then(fn, fn);
  callChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

/* ── The contract we ask the model for ──────────────────────────────── */

const CADENCE_VOCABULARY =
  'daily, weekly, fortnightly, monthly, quarterly, half-yearly, annual, continuous, event-driven, "T+1" (or T+2, T+3), "N days", "N trading days", "N working days"';

const SYSTEM_PROMPT = `You are the extraction agent of Poneglyph, an agentic compliance engine for Indian securities-market intermediaries. You are given ONE paragraph of a SEBI circular and you emit the discrete regulatory obligations that paragraph places on the regulated entity.

OUTPUT
Reply with ONE JSON object and nothing else. No prose before or after it. No markdown code fence. No explanation.

{"obligations":[{
  "title": string, at most 90 characters, the duty stated plainly,
  "summary": string, one or two sentences in plain English,
  "excerpt": string, see GROUNDING,
  "type": "one-time" | "ongoing" | "periodic" | "event-driven",
  "frequency": string or null, see VOCABULARY,
  "deadline": string or null, see DEADLINES,
  "appliesTo": array of strings from EXACTLY this list: "stock-broker", "investment-adviser", "amc", "rta", "depository-participant", "portfolio-manager", "aif-manager",
  "control": {"name": string, "description": string, describing the control a firm would operate to satisfy the duty},
  "evidenceSpec": [{"kind": "document" | "data-check" | "live-scan", "description": string, naming the artefact that proves the duty was met}]
}]}

GROUNDING — this is the rule that matters most
"excerpt" MUST be an exact, character-for-character substring of the CLAUSE TEXT the user supplies. Copy the characters out of it. Do not paraphrase, do not correct spelling, do not change capitalisation, do not normalise whitespace, do not add or remove punctuation, do not join two separated fragments. Every excerpt is checked with an exact string search against the clause text. One excerpt that is not found verbatim discards the entire extraction.

VOCABULARY
"frequency" must be null, or exactly one of: ${CADENCE_VOCABULARY}. Nothing else is accepted. If the clause states no cadence, use null.

DEADLINES
"deadline" must be null unless the clause states an absolute calendar date, in which case give it as YYYY-MM-DD. A relative window is a frequency, not a deadline: put "30 days" in "frequency" and null in "deadline". Prose such as "within the timelines specified by the exchange" is NOT a deadline — use null. Never state a date the clause does not contain.

SCOPE
Emit only duties the clause actually states. One stated duty is one obligation. Never pad, never generalise beyond the text, never import a requirement from elsewhere in the regulations. A sentence that says something is NOT required, is exempted, is relaxed, or MAY be done at the entity's option is not an obligation: emit nothing for it. A sentence that only explains procedure for a duty already emitted (which portal tab to click, which format to use) is part of that duty, not a second obligation. At most 6 obligations. If the paragraph states no obligation at all, return {"obligations":[]}.`;

/* ── The model's raw output, validated but not yet trusted ──────────── */

export interface RawEvidenceSpec {
  kind: string;
  description: string;
}

export interface RawObligation {
  title: string;
  summary: string;
  excerpt: string;
  type: string;
  frequency: string | null;
  deadline: string | null;
  appliesTo: string[];
  control: { name: string; description: string };
  evidenceSpec: RawEvidenceSpec[];
}

export interface ExtractionOutcome {
  raw: RawObligation[];
  attempts: number;
  elapsedMs: number;
  /** what a first attempt got wrong, when a corrective second attempt was made */
  correction?: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  reasoningTokens?: number;
}

export class ExtractionError extends Error {
  readonly attempts: number;
  constructor(message: string, attempts: number) {
    super(message);
    this.name = "ExtractionError";
    this.attempts = attempts;
  }
}

/* ── Response envelope ──────────────────────────────────────────────── */

interface ChatChoice {
  message?: { content?: string | null; reasoning_content?: string | null };
  finish_reason?: string;
}

interface ChatResponse {
  model?: string;
  choices?: ChatChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    completion_tokens_details?: { reasoning_tokens?: number };
  };
  error?: { message?: string };
}

function userPrompt(input: RunInput): string {
  return `CIRCULAR: ${input.circularId}
CHAPTER: ${input.chapter}
PARAGRAPH: ${input.para}

CLAUSE TEXT (excerpts must be exact substrings of everything between the delimiters):
"""
${input.clauseText}
"""`;
}

/** Strip a stray code fence, then take the outermost JSON object. */
export function extractJsonObject(content: string): string {
  let text = content.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("model response contained no JSON object");
  }
  return text.slice(start, end + 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStr(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Shape-validate the parsed JSON into RawObligation[]. Anything structurally
    wrong throws with a message specific enough to feed back to the model. */
export function parseObligations(jsonText: string): RawObligation[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`response was not valid JSON: ${(e as Error).message}`);
  }
  if (!isRecord(parsed)) throw new Error("top level of the response was not a JSON object");
  const list = parsed.obligations;
  if (!Array.isArray(list)) throw new Error('response had no "obligations" array');

  return list.map((item, i): RawObligation => {
    if (!isRecord(item)) throw new Error(`obligations[${i}] was not an object`);
    const control = isRecord(item.control) ? item.control : {};
    const evidence = Array.isArray(item.evidenceSpec) ? item.evidenceSpec : [];
    const applies = Array.isArray(item.appliesTo) ? item.appliesTo : [];
    if (asStr(item.excerpt).length === 0) {
      throw new Error(`obligations[${i}] carried no "excerpt", so it cannot be grounded`);
    }
    return {
      title: asStr(item.title),
      summary: asStr(item.summary),
      excerpt: asStr(item.excerpt),
      type: asStr(item.type),
      frequency: typeof item.frequency === "string" ? item.frequency : null,
      deadline: typeof item.deadline === "string" ? item.deadline : null,
      appliesTo: applies.filter((a): a is string => typeof a === "string"),
      control: { name: asStr(control.name), description: asStr(control.description) },
      evidenceSpec: evidence.filter(isRecord).map((s): RawEvidenceSpec => ({
        kind: asStr(s.kind),
        description: asStr(s.description),
      })),
    };
  });
}

/* ── The call ───────────────────────────────────────────────────────── */

interface CallResult {
  raw: RawObligation[];
  model: string;
  usage: ChatResponse["usage"];
}

async function callOnce(
  env: Env,
  input: RunInput,
  correction: string | undefined,
): Promise<CallResult> {
  const model = modelOf(env);
  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt(input) },
  ];
  if (correction) {
    messages.push({
      role: "user",
      content: `Your previous reply was rejected by the deterministic verifier: ${correction}\n\nEmit the corrected JSON object only. Re-read the clause text above and copy excerpts out of it character for character.`,
    });
  }

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPEN_ROUTER_KEY ?? ""}`,
      "http-referer": "https://github.com/moleculesurat/poneglyph",
      "x-title": "poneglyph",
    },
    body: JSON.stringify({ model, max_tokens: MAX_TOKENS, messages }),
    signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
  });

  if (!response.ok) {
    /* the body may echo the request; take only the provider's message and
       never anything that could carry the key back out */
    let detail = "";
    try {
      const body = (await response.json()) as ChatResponse;
      detail = body.error?.message ?? "";
    } catch {
      detail = "";
    }
    throw new Error(
      `provider returned HTTP ${response.status}${detail ? ` — ${detail.slice(0, 300)}` : ""}`,
    );
  }

  const body = (await response.json()) as ChatResponse;
  const choice = body.choices?.[0];
  const content = choice?.message?.content ?? "";

  if (content.trim().length === 0) {
    const reasoned = body.usage?.completion_tokens_details?.reasoning_tokens ?? 0;
    throw new Error(
      `model returned empty content${reasoned > 0 ? ` after spending ${reasoned} reasoning tokens` : ""}${
        choice?.finish_reason ? ` (finish_reason: ${choice.finish_reason})` : ""
      }`,
    );
  }

  return {
    raw: parseObligations(extractJsonObject(content)),
    model: body.model ?? model,
    usage: body.usage,
  };
}

/** Run the extraction. `precheck` lets the pipeline reject a first attempt on
    a grounding or vocabulary violation and spend the second attempt correcting
    it — a real second model call, never a repair we invent ourselves. */
export async function extractObligations(
  env: Env,
  input: RunInput,
  precheck: (raw: RawObligation[]) => string | null,
): Promise<ExtractionOutcome> {
  if (!env.OPEN_ROUTER_KEY) {
    throw new ExtractionError(
      "extraction model is not configured on this deployment — OPEN_ROUTER_KEY must be set. No obligations were drafted.",
      0,
    );
  }

  const startedAt = Date.now();
  let correction: string | undefined;
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await serialised(() => callOnce(env, input, correction));
      const complaint = precheck(result.raw);
      if (complaint && attempt < MAX_ATTEMPTS) {
        correction = complaint;
        lastError = complaint;
        continue;
      }
      return {
        raw: result.raw,
        attempts: attempt,
        elapsedMs: Date.now() - startedAt,
        correction: attempt > 1 ? lastError : undefined,
        model: result.model,
        promptTokens: result.usage?.prompt_tokens,
        completionTokens: result.usage?.completion_tokens,
        reasoningTokens: result.usage?.completion_tokens_details?.reasoning_tokens,
      };
    } catch (e) {
      const err = e as Error;
      lastError =
        err.name === "TimeoutError" || err.name === "AbortError"
          ? `the model did not respond within ${CALL_TIMEOUT_MS / 1000}s`
          : err.message;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(4000 * attempt);
        continue;
      }
    }
  }

  throw new ExtractionError(
    `extraction failed after ${MAX_ATTEMPTS} attempts — ${lastError}. Nothing was drafted and nothing entered the register.`,
    MAX_ATTEMPTS,
  );
}

/* ── Normalisation into the ontology ────────────────────────────────────
   The model writes "stock brokers"; the ontology's IntermediaryType is
   "stock-broker". Canonicalising a label against a fixed table is ordinary
   deterministic work, and it is recorded in the trace so it is visible
   rather than silent. A label that maps to nothing is DROPPED, not guessed —
   which is exactly how a clause aimed only at investment advisers ends up
   failing applicability-match instead of sneaking through. */

const CAPACITY_ALIASES: Record<string, IntermediaryType> = {
  "stock-broker": "stock-broker",
  "stock broker": "stock-broker",
  "stock brokers": "stock-broker",
  broker: "stock-broker",
  brokers: "stock-broker",
  "trading member": "stock-broker",
  "trading members": "stock-broker",
  "depository-participant": "depository-participant",
  "depository participant": "depository-participant",
  "depository participants": "depository-participant",
  "investment-adviser": "investment-adviser",
  "investment adviser": "investment-adviser",
  "investment advisers": "investment-adviser",
  "investment advisor": "investment-adviser",
  "investment advisors": "investment-adviser",
  amc: "amc",
  "asset management company": "amc",
  "asset management companies": "amc",
  "mutual fund": "amc",
  rta: "rta",
  "registrar to an issue": "rta",
  "share transfer agent": "rta",
  "registrar and transfer agent": "rta",
  "portfolio-manager": "portfolio-manager",
  "portfolio manager": "portfolio-manager",
  "portfolio managers": "portfolio-manager",
  "aif-manager": "aif-manager",
  aif: "aif-manager",
  aifs: "aif-manager",
  "alternative investment fund": "aif-manager",
  "alternative investment funds": "aif-manager",
  "manager of the aif": "aif-manager",
  "aif manager": "aif-manager",
  "aif managers": "aif-manager",
};

const OBLIGATION_TYPES: ObligationType[] = ["one-time", "ongoing", "periodic", "event-driven"];
const EVIDENCE_KINDS: EvidenceKind[] = ["document", "data-check", "live-scan"];

export function normaliseAppliesTo(values: string[]): {
  mapped: IntermediaryType[];
  dropped: string[];
} {
  const mapped: IntermediaryType[] = [];
  const dropped: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    const hit = CAPACITY_ALIASES[key];
    if (hit) {
      if (!mapped.includes(hit)) mapped.push(hit);
    } else {
      dropped.push(value);
    }
  }
  return { mapped, dropped };
}

export function normaliseType(value: string): ObligationType | null {
  const key = value.trim().toLowerCase() as ObligationType;
  return OBLIGATION_TYPES.includes(key) ? key : null;
}

export function normaliseEvidenceKind(value: string): EvidenceKind | null {
  const key = value.trim().toLowerCase() as EvidenceKind;
  return EVIDENCE_KINDS.includes(key) ? key : null;
}
