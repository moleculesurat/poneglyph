/* ══════════════════════════════════════════════════════════════════════
   Documents in — the firm's file vault.

   A PDF is uploaded through the gate, its bytes are stored by the FILES
   binding and its text is extracted by PDFTEXT — both Node-only, so both
   live in server.mjs and are absent on workerd (the routes 503 there rather
   than throw). Only the sha256, the text stats and the metadata enter the
   register; the file itself stays on the runtime's disk. One hash-chained
   audit event records the receipt, the same trail every mutation uses.
   ══════════════════════════════════════════════════════════════════════ */

import type { CompanyDocument, DocumentRequirement, ExtractedField } from "../lib/schema";
import { documentRequirements, requirementOf } from "../data/documents";
import { catalogue, kindById } from "../data/catalogue";
import { appendEvent } from "./audit";
import { bindEvidenceMany } from "./evidence";
import { chatJson } from "./extract";
import { chainTip, sha256HexBytes } from "./hash";
import { asString, corsHeaders, error, gateAllowed, json, readJson } from "./http";
import { loadRun, saveSession } from "./session";
import type { Env, SessionState } from "./types";

const MAX_BYTES = 25 * 1024 * 1024;

/* ── POST /api/documents (gated, multipart) ─────────────────────────── */

export async function handleDocumentUpload(
  request: Request,
  env: Env,
  state: SessionState,
): Promise<Response> {
  if (!env.FILES || !env.PDFTEXT) {
    return error(request, 503, "file store not available in this runtime");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(request, 400, "expected a multipart/form-data body with a file field");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return error(request, 400, 'file is required (multipart field "file")');
  }
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return error(request, 415, "file must be a PDF — application/pdf or a name ending in .pdf");
  }
  if (file.size > MAX_BYTES) {
    return error(request, 413, `file is ${file.size} bytes; the limit is ${MAX_BYTES} (25 MB)`);
  }

  const officer = asString(form.get("officer"));
  if (!officer || officer.length > 120) {
    return error(
      request,
      400,
      "officer is required and must be 1–120 characters — an unsigned upload is not an upload",
    );
  }

  /* comma-separated asks; empty ⇒ volunteered. Every id must exist. */
  const reqIdsRaw = form.get("requirementIds");
  let requirementIds =
    typeof reqIdsRaw === "string"
      ? reqIdsRaw.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
      : [];
  for (const rid of requirementIds) {
    if (!documentRequirements.some((r) => r.id === rid)) {
      return error(request, 400, `unknown requirement id ${rid} — not in the document requirements`);
    }
  }

  /* optional catalogue kind (task 39): a document dropped into a kind folder
     carries that kind, and when no asks were named the kind's asks become the
     document's asks */
  const kindId = asString(form.get("kindId"));
  const kind = kindId ? kindById(kindId) : undefined;
  if (kindId && !kind) {
    return error(request, 400, `unknown kind id ${kindId} — not in the catalogue`);
  }
  if (kind && requirementIds.length === 0) {
    requirementIds = kind.askIds;
  }

  const name = asString(form.get("name")) ?? file.name;
  const notes = asString(form.get("notes"));

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha = await sha256HexBytes(bytes);

  const dup = state.documents.find((d) => d.hash === sha);
  if (dup) {
    return error(request, 409, `this file is already stored as ${dup.id}`, { documentId: dup.id });
  }

  await env.FILES.put(sha, bytes, "pdf");

  let text: string;
  try {
    text = await env.PDFTEXT(sha);
  } catch (e) {
    /* the file stays stored; only the extraction failed */
    return error(request, 502, (e as Error).message || "pdftotext failed");
  }
  /* pdftotext ends every page — the last one included — with a form feed, so
     the page count is the number of segments once the trailing feed is dropped */
  const pages = text.replace(/\f$/, "").split("\f").length;
  const textChars = text.length;

  const seq = state.nextDocumentSeq;
  state.nextDocumentSeq += 1;
  const id = `DOC-${String(seq).padStart(3, "0")}`;
  const firstReq = requirementIds.length
    ? documentRequirements.find((r) => r.id === requirementIds[0])
    : undefined;

  const document: CompanyDocument = {
    id,
    ...(requirementIds.length ? { requirementId: requirementIds[0] } : {}),
    requirementIds,
    ...(kind ? { kindId: kind.id } : {}),
    name,
    category: firstReq ? firstReq.category : "operational",
    status: "received",
    fileName: file.name,
    pages,
    textChars,
    uploadedAt: new Date().toISOString(),
    uploadedBy: officer,
    hash: sha,
    extracted: [],
    supportsObligations: [],
    ...(notes ? { notes } : {}),
  };
  state.documents.push(document);

  const event = await appendEvent(state, {
    actor: `human:${officer}`,
    action: "document.received",
    subjectType: "document",
    subjectId: id,
    detail: `Document ${id} received: ${file.name}${
      kind ? `, kind ${kind.id} ${kind.name}` : ""
    } (sha256 ${sha}), ${
      requirementIds.length ? `against ${requirementIds.join(", ")}` : "volunteered"
    }, uploaded by ${officer}.`,
  });

  await saveSession(env, state);

  return json(
    request,
    { document, auditEvent: event, chainTip: chainTip(state.chain) },
    { status: 201 },
  );
}

/* ── GET /api/documents/:id/text (gated) ────────────────────────────── */

export async function handleDocumentText(
  request: Request,
  env: Env,
  state: SessionState,
  id: string,
): Promise<Response> {
  if (!env.PDFTEXT) {
    return error(request, 503, "file store not available in this runtime");
  }
  const doc = state.documents.find((d) => d.id === id);
  if (!doc || !doc.hash) {
    return error(request, 404, `no document ${id} in this session`);
  }
  let text: string;
  try {
    text = await env.PDFTEXT(doc.hash);
  } catch (e) {
    return error(request, 502, (e as Error).message || "pdftotext failed");
  }
  return new Response(text, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", ...corsHeaders(request) },
  });
}

/* ── POST /api/documents/:id/read (gated) ───────────────────────────────
   The machine read: one grounded language-model pass over a stored document,
   judging it against the SEBI asks it was supplied for and reading a few
   identifying fields out of it — every value, quote, locator and date source
   copied verbatim, checked by a deterministic verifier that rejects anything
   not found in the text. Nothing is invented; a reply that cannot be grounded
   is refused, not repaired. */

const READ_SYSTEM_PROMPT = `You are the document-reading agent of Poneglyph, an agentic compliance engine for Indian securities-market intermediaries. You are given ONE of the firm's own documents as extracted text, together with the SEBI document asks it may answer. You judge whether the document is the artefact each ask names, and you read a few identifying fields out of it — entirely from the text in front of you.

OUTPUT
Reply with ONE JSON object and nothing else. No prose before or after it. No markdown code fence.

{
  "verdicts": [{
    "requirementId": string, exactly one of the ask ids given below,
    "verdict": "satisfies" | "partial" | "no",
    "reason": string, at most 300 characters,
    "quotes": [string], one to three quotes, each copied verbatim from the document text
  }],
  "fields": [{
    "field": one of "title", "issuer", "documentDate", "referenceNumber", "periodCovered", "signatory",
    "value": string, copied verbatim from the document text,
    "locator": string, copied verbatim from the document text, at most 120 characters, naming where the value sits
  }],
  "validFrom": { "iso": "YYYY-MM-DD", "source": string copied verbatim from the document text },
  "validUntil": { "iso": "YYYY-MM-DD", "source": string copied verbatim from the document text }
}

GROUNDING — the rule that matters most
Every value, every quote, every locator and every date source MUST be an exact, character-for-character substring of the DOCUMENT TEXT the user supplies. Copy the characters out of it. Never paraphrase, correct, translate, summarise, join separated fragments, or invent. Each is checked with an exact string search; one that is not found verbatim discards the entire reply.

VERDICTS
For each ask, return "satisfies" only if the document itself IS the artefact the ask names, "partial" if it covers only part of it, and "no" otherwise. Carry each verdict with one to three verbatim quotes and a reason of at most 300 characters. If no asks are given below, "verdicts" MUST be [].

FIELDS
Extract each of these only if the document actually states it: title, issuer, documentDate, referenceNumber, periodCovered, signatory. Omit any that is absent — never guess one. A field's value and its locator are both verbatim substrings of the document text.

VALIDITY
If the document states a validity window, give validFrom and/or validUntil as ISO dates (YYYY-MM-DD), each with a "source" that is a verbatim substring of the document text. Omit either one the document does not state. Never state a date the document does not contain.

Omit what is absent. No prose outside the JSON.`;

const isRec = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** The verbatim-grounding predicate the read and classify verifiers share:
    collapse whitespace runs on both sides, then require the needle to be a
    substring of the document text. One miss discards the whole reply, so the two
    verifiers must ground identically — hence one helper, not two copies. */
function grounded(text: string): (s: string) => boolean {
  const norm = (s: string) => s.replace(/\s+/g, " ");
  const hay = norm(text);
  return (s) => hay.includes(norm(s));
}

function buildReadPrompt(asks: DocumentRequirement[], text: string): string {
  const askBlock = asks.length
    ? asks
        .map(
          (r) =>
            `- ${r.id}\n  ask: ${r.name}\n  duty: ${r.description}\n  clause (verbatim): ${r.clauseRef?.excerpt ?? ""}`,
        )
        .join("\n\n")
    : '(none — this document was volunteered, not supplied against any ask; return "verdicts": [])';
  return `SEBI DOCUMENT ASKS
${askBlock}

DOCUMENT TEXT (every value, quote, locator and date source must be an exact substring of everything between the delimiters):
"""
${text}
"""`;
}

/** Deterministic grounding check — the discipline the extraction path uses,
    applied to the read proposal. Normalises both sides by collapsing whitespace
    runs to a single space, then requires: every value, quote, locator and source
    to be a substring of the document text; every verdict's requirementId to be
    one of the document's asks; every verdict to be one of the three words; every
    ISO date to match YYYY-MM-DD. Returns a complaint the model can act on, or
    null when the reply is clean. `reqIds` is the document's asks — the two-arg
    signature in the task cannot check requirementId membership without it. */
export function verifyProposal(raw: string, text: string, reqIds: string[]): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return `reply was not valid JSON: ${(e as Error).message}`;
  }
  if (!isRec(parsed)) return "top level of the reply was not a JSON object";

  const isGrounded = grounded(text);

  const verdicts = parsed.verdicts;
  if (!Array.isArray(verdicts)) return 'reply had no "verdicts" array';
  const fields = parsed.fields;
  if (!Array.isArray(fields)) return 'reply had no "fields" array';

  const allowed = new Set(["satisfies", "partial", "no"]);
  for (let i = 0; i < verdicts.length; i++) {
    const v = verdicts[i];
    if (!isRec(v)) return `verdicts[${i}] was not an object`;
    if (!reqIds.includes(str(v.requirementId))) {
      return `verdicts[${i}].requirementId ${JSON.stringify(str(v.requirementId))} is not one of this document's asks (${reqIds.join(", ") || "none"})`;
    }
    if (!allowed.has(str(v.verdict))) {
      return `verdicts[${i}].verdict ${JSON.stringify(str(v.verdict))} is not one of satisfies, partial, no`;
    }
    const quotes = Array.isArray(v.quotes) ? v.quotes : [];
    for (let q = 0; q < quotes.length; q++) {
      const quote = quotes[q];
      if (typeof quote !== "string" || !isGrounded(quote)) {
        return `verdicts[${i}].quotes[${q}] is not a verbatim substring of the document text: ${JSON.stringify(quote)}`;
      }
    }
  }

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (!isRec(f)) return `fields[${i}] was not an object`;
    if (!isGrounded(str(f.value))) {
      return `fields[${i}].value is not a verbatim substring of the document text: ${JSON.stringify(str(f.value))}`;
    }
    const locator = f.locator;
    if (locator !== undefined && locator !== null) {
      if (typeof locator !== "string" || !isGrounded(locator)) {
        return `fields[${i}].locator is not a verbatim substring of the document text: ${JSON.stringify(locator)}`;
      }
    }
  }

  const isoRe = /^\d{4}-\d{2}-\d{2}$/;
  for (const key of ["validFrom", "validUntil"] as const) {
    const d = parsed[key];
    if (d === undefined || d === null) continue;
    if (!isRec(d)) return `${key} must be an object with iso and source`;
    const iso = d.iso;
    const source = d.source;
    if (typeof iso !== "string" || !isoRe.test(iso)) {
      return `${key}.iso must be an ISO date YYYY-MM-DD; got ${JSON.stringify(iso)}`;
    }
    if (typeof source !== "string" || !isGrounded(source)) {
      return `${key}.source is not a verbatim substring of the document text: ${JSON.stringify(source)}`;
    }
  }

  return null;
}

interface ReadProposal {
  verdicts: {
    requirementId: string;
    verdict: "satisfies" | "partial" | "no";
    reason: string;
    quotes: string[];
  }[];
  fields: ExtractedField[];
  validFrom?: { iso: string; source: string };
  validUntil?: { iso: string; source: string };
}

/** Shape an already-verified reply into the stored proposal — confidence 1 on
    every field, since each value survived the verbatim check. Safe to trust:
    verifyProposal has passed on this exact string. */
function parseProposal(raw: string): ReadProposal {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const verdictsIn = Array.isArray(parsed.verdicts) ? parsed.verdicts : [];
  const fieldsIn = Array.isArray(parsed.fields) ? parsed.fields : [];
  const verdicts = verdictsIn.filter(isRec).map((v) => ({
    requirementId: str(v.requirementId),
    verdict: str(v.verdict) as "satisfies" | "partial" | "no",
    reason: str(v.reason),
    quotes: (Array.isArray(v.quotes) ? v.quotes : []).filter((q): q is string => typeof q === "string"),
  }));
  const fields: ExtractedField[] = fieldsIn.filter(isRec).map((f) => ({
    field: str(f.field),
    value: str(f.value),
    confidence: 1,
    ...(typeof f.locator === "string" && f.locator ? { locator: f.locator } : {}),
  }));
  const asDate = (v: unknown) =>
    isRec(v) && typeof v.iso === "string" && typeof v.source === "string"
      ? { iso: v.iso, source: v.source }
      : undefined;
  const validFrom = asDate(parsed.validFrom);
  const validUntil = asDate(parsed.validUntil);
  return { verdicts, fields, ...(validFrom ? { validFrom } : {}), ...(validUntil ? { validUntil } : {}) };
}

/** One model call at a time per session — the provider rejects concurrent
    requests, so a read or a classify is refused while a pipeline run is still in
    flight. Returns the 409 to send, or null when the session is free. */
async function busyRun(request: Request, env: Env, state: SessionState): Promise<Response | null> {
  const lastRunId = state.runIds[state.runIds.length - 1];
  if (!lastRunId) return null;
  const last = await loadRun(env, state.sessionId, lastRunId);
  if (last?.status === "running") {
    return error(
      request,
      409,
      `${last.id} is still running in this session. Extraction calls are serialised because the provider rejects concurrent requests; wait for it to finish or reset the session.`,
      { runId: last.id },
    );
  }
  return null;
}

export async function handleDocumentRead(
  request: Request,
  env: Env,
  state: SessionState,
  id: string,
): Promise<Response> {
  /* unknown id is a 404 BEFORE the gate, a known id without the token a 401 —
     so existence and authentication read as two distinct answers */
  const doc = state.documents.find((d) => d.id === id);
  if (!doc || !doc.hash) {
    return error(request, 404, `no document ${id} in this session`);
  }
  if (!gateAllowed(request, env)) {
    return error(request, 401, "x-gate-token header missing or wrong; the gate signs nothing unauthenticated");
  }
  if (!env.PDFTEXT) {
    return error(request, 503, "file store not available in this runtime");
  }

  const body = await readJson(request);
  if (!body) return error(request, 400, "expected a JSON object body");
  const officer = asString(body.officer);
  if (!officer || officer.length > 120) {
    return error(request, 400, "officer is required and must be 1–120 characters — an unsigned read is not a read");
  }

  const busy = await busyRun(request, env, state);
  if (busy) return busy;

  let text: string;
  try {
    text = await env.PDFTEXT(doc.hash);
  } catch (e) {
    return error(request, 502, (e as Error).message || "pdftotext failed");
  }
  const truncated = text.length > 60000;
  const sent = text.slice(0, 60000);

  const reqIds = doc.requirementIds ?? [];
  const asks = reqIds
    .map((rid) => requirementOf(rid))
    .filter((r): r is DocumentRequirement => Boolean(r));
  const prompt = buildReadPrompt(asks, sent);

  /* attempt, then — on a grounding failure — exactly one correction round, the
     same discipline the extraction path uses. A transport or parse failure from
     the provider is a 502; a reply that cannot be grounded twice is a 422, and
     the document is left untouched. */
  let chosen: { raw: string; model: string; usage?: unknown };
  let complaint: string | null;
  try {
    chosen = await chatJson(env, READ_SYSTEM_PROMPT, prompt);
    complaint = verifyProposal(chosen.raw, sent, reqIds);
    if (complaint) {
      chosen = await chatJson(env, READ_SYSTEM_PROMPT, prompt, complaint);
      complaint = verifyProposal(chosen.raw, sent, reqIds);
    }
  } catch (e) {
    return error(request, 502, (e as Error).message || "the model call failed");
  }
  if (complaint) {
    return error(request, 422, complaint, { attempt: 2 });
  }

  const proposal = parseProposal(chosen.raw);
  doc.proposal = {
    at: new Date().toISOString(),
    model: chosen.model,
    truncated,
    verdicts: proposal.verdicts,
    fields: proposal.fields,
    ...(proposal.validFrom ? { validFrom: proposal.validFrom } : {}),
    ...(proposal.validUntil ? { validUntil: proposal.validUntil } : {}),
  };
  doc.extracted = proposal.fields;

  const verdictStr =
    proposal.verdicts.map((v) => `${v.requirementId} ${v.verdict}`).join(", ") || "no asks";
  const event = await appendEvent(state, {
    actor: `human:${officer}`,
    action: "document.read",
    subjectType: "document",
    subjectId: id,
    detail: `Document ${id} read against its asks by ${officer}: ${verdictStr}; ${proposal.fields.length} field${
      proposal.fields.length === 1 ? "" : "s"
    } extracted${truncated ? ` (text truncated to 60,000 of ${text.length} chars)` : ""}.`,
  });

  await saveSession(env, state);

  return json(request, {
    document: doc,
    auditEvent: event,
    chainTip: chainTip(state.chain),
    usage: chosen.usage,
  });
}

/* ── POST /api/documents/:id/classify (gated) ───────────────────────────
   The machine's kind proposal for a volunteered document: one grounded pass over
   the stored text against the 43-kind catalogue, returning the single kind whose
   description names this document — or null when none does, recorded not guessed.
   Same verbatim-grounding discipline as the read; a reply that cannot be grounded
   twice is a 422 and the document is left untouched. */

const CLASSIFY_SYSTEM_PROMPT = `You are the document-classification agent of Poneglyph, an agentic compliance engine for Indian securities-market intermediaries. You are given ONE of the firm's own documents as extracted text, together with the catalogue of document KINDS a portfolio manager keeps. You decide which single kind THIS document is — entirely from the text in front of you.

OUTPUT
Reply with ONE JSON object and nothing else. No prose before or after it. No markdown code fence.

{
  "kindId": one of the catalogue ids given below, or null,
  "reason": string, at most 300 characters,
  "quotes": [string], one to three quotes, each copied verbatim from the document text
}

GROUNDING — the rule that matters most
Every quote MUST be an exact, character-for-character substring of the DOCUMENT TEXT the user supplies. Copy the characters out of it. Never paraphrase, correct, translate, summarise, join separated fragments, or invent. Each is checked with an exact string search; one that is not found verbatim discards the entire reply.

CHOOSING THE KIND
Return the id of the kind whose description names THIS document. Return null when no kind fits — a document the catalogue does not describe is "no kind fits", recorded, not forced. NEVER pick the closest kind when none actually fits. When you choose a kind, carry one to three verbatim quotes that show why; a null answer may carry none.

No prose outside the JSON.`;

function buildClassifyPrompt(text: string): string {
  const kindBlock = catalogue.map((k) => `- ${k.id}  ${k.name} — ${k.what}`).join("\n");
  return `DOCUMENT KINDS
${kindBlock}

DOCUMENT TEXT (every quote must be an exact substring of everything between the delimiters):
"""
${text}
"""`;
}

/** Deterministic check on the classify reply — the same grounding discipline as
    the read: a JSON object; kindId either null or a real catalogue id; reason a
    string; quotes an array, non-empty when a kind was chosen, each a verbatim
    substring of the document text. Returns a complaint the model can act on, or
    null when the reply is clean. */
export function verifyClassification(raw: string, text: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return `reply was not valid JSON: ${(e as Error).message}`;
  }
  if (!isRec(parsed)) return "top level of the reply was not a JSON object";

  const kindId = parsed.kindId;
  if (kindId !== null && (typeof kindId !== "string" || !kindById(kindId))) {
    return `kindId ${JSON.stringify(kindId)} is not one of the catalogue ids, and is not null`;
  }
  if (typeof parsed.reason !== "string") return 'reply had no string "reason"';

  const quotes = parsed.quotes;
  if (!Array.isArray(quotes)) return 'reply had no "quotes" array';
  if (kindId !== null && quotes.length === 0) {
    return "a chosen kindId must carry at least one verbatim quote";
  }
  const isGrounded = grounded(text);
  for (let q = 0; q < quotes.length; q++) {
    const quote = quotes[q];
    if (typeof quote !== "string" || !isGrounded(quote)) {
      return `quotes[${q}] is not a verbatim substring of the document text: ${JSON.stringify(quote)}`;
    }
  }
  return null;
}

export async function handleDocumentClassify(
  request: Request,
  env: Env,
  state: SessionState,
  id: string,
): Promise<Response> {
  /* unknown id is a 404 BEFORE the gate, a known id without the token a 401 —
     the same ordering as /read */
  const doc = state.documents.find((d) => d.id === id);
  if (!doc || !doc.hash) {
    return error(request, 404, `no document ${id} in this session`);
  }
  if (!gateAllowed(request, env)) {
    return error(request, 401, "x-gate-token header missing or wrong; the gate signs nothing unauthenticated");
  }
  if (!env.PDFTEXT) {
    return error(request, 503, "file store not available in this runtime");
  }

  const body = await readJson(request);
  if (!body) return error(request, 400, "expected a JSON object body");
  const officer = asString(body.officer);
  if (!officer || officer.length > 120) {
    return error(request, 400, "officer is required and must be 1–120 characters — an unsigned read is not a read");
  }

  if (doc.kindId) {
    return error(
      request,
      409,
      `${id} already has kind ${doc.kindId} — a kind is set at intake or by one classification`,
    );
  }
  if (doc.decision) {
    return error(request, 409, `${id} is already decided`);
  }

  const busy = await busyRun(request, env, state);
  if (busy) return busy;

  let text: string;
  try {
    text = await env.PDFTEXT(doc.hash);
  } catch (e) {
    return error(request, 502, (e as Error).message || "pdftotext failed");
  }
  const sent = text.slice(0, 60000);
  const prompt = buildClassifyPrompt(sent);

  /* attempt, then — on a grounding failure — exactly one correction round, the
     same discipline the read uses; a reply that cannot be grounded twice is a
     422 and the document is left untouched. */
  let chosen: { raw: string; model: string; usage?: unknown };
  let complaint: string | null;
  try {
    chosen = await chatJson(env, CLASSIFY_SYSTEM_PROMPT, prompt);
    complaint = verifyClassification(chosen.raw, sent);
    if (complaint) {
      chosen = await chatJson(env, CLASSIFY_SYSTEM_PROMPT, prompt, complaint);
      complaint = verifyClassification(chosen.raw, sent);
    }
  } catch (e) {
    return error(request, 502, (e as Error).message || "the model call failed");
  }
  if (complaint) {
    return error(request, 422, complaint, { attempt: 2 });
  }

  const parsed = JSON.parse(chosen.raw) as Record<string, unknown>;
  const proposedId = typeof parsed.kindId === "string" ? parsed.kindId : null;
  const reason = str(parsed.reason);
  const quotes = (Array.isArray(parsed.quotes) ? parsed.quotes : []).filter(
    (q): q is string => typeof q === "string",
  );
  const kind = proposedId ? kindById(proposedId) : undefined;

  doc.classification = {
    at: new Date().toISOString(),
    model: chosen.model,
    kindId: kind ? kind.id : null,
    reason,
    quotes,
  };
  if (kind) {
    doc.kindId = kind.id;
    doc.requirementIds = kind.askIds;
    doc.requirementId = kind.askIds[0];
    const firstReq = requirementOf(kind.askIds[0]);
    if (firstReq) doc.category = firstReq.category;
  }

  const event = await appendEvent(state, {
    actor: `human:${officer}`,
    action: "document.classified",
    subjectType: "document",
    subjectId: id,
    detail: `Document ${id} classified by machine, confirmed ${officer}: ${
      kind ? `${kind.id} ${kind.name}` : "no kind fits"
    }; ${reason}`,
  });

  await saveSession(env, state);

  return json(request, {
    document: doc,
    auditEvent: event,
    chainTip: chainTip(state.chain),
    usage: chosen.usage,
  });
}

/* ── POST /api/documents/:id/decision (gated) ───────────────────────────
   The officer's call on a document in the vault. verify accepts it and binds
   ONE evidence artefact to every duty its asks unlock — the document becomes
   the proof and each duty flips to met, under one document.verified + one
   evidence.bound audit pair. reject turns it down and keeps the trail, binding
   nothing. A decided document is final; a re-upload is a new document. */

export async function handleDocumentDecision(
  request: Request,
  env: Env,
  state: SessionState,
  id: string,
): Promise<Response> {
  /* unknown id is a 404 before the gate, a known id without the token a 401 */
  const doc = state.documents.find((d) => d.id === id);
  if (!doc) {
    return error(request, 404, `no document ${id} in this session`);
  }
  if (!gateAllowed(request, env)) {
    return error(request, 401, "x-gate-token header missing or wrong; the gate signs nothing unauthenticated");
  }

  const body = await readJson(request);
  if (!body) return error(request, 400, "expected a JSON object body");

  const decision = asString(body.decision);
  if (decision !== "verify" && decision !== "reject") {
    return error(request, 400, 'decision must be "verify" or "reject"');
  }
  const officer = asString(body.officer);
  if (!officer || officer.length > 120) {
    return error(request, 400, "officer is required and must be 1–120 characters — an unsigned decision is not a decision");
  }
  const reason = asString(body.reason);

  if (doc.decision) {
    return error(
      request,
      409,
      `${id} is already ${doc.decision.decision === "verify" ? "verified" : "rejected"} — a decided document is final; a new upload is a new document`,
      { decision: doc.decision.decision },
    );
  }

  /* requirementIds in the body replaces the document's asks — how a volunteered
     document gets its asks at decision time. Each must exist. */
  if (body.requirementIds !== undefined) {
    const raw = body.requirementIds;
    if (!Array.isArray(raw) || raw.some((x) => typeof x !== "string")) {
      return error(request, 400, "requirementIds, if given, must be an array of ask ids");
    }
    for (const rid of raw as string[]) {
      if (!requirementOf(rid)) {
        return error(request, 400, `unknown requirement id ${rid} — not in the document requirements`);
      }
    }
    doc.requirementIds = raw as string[];
    if ((raw as string[]).length > 0) doc.requirementId = (raw as string[])[0];
  }
  const asks = doc.requirementIds ?? [];

  if (decision === "reject") {
    if (!reason) {
      return error(request, 400, "reason is required to reject a document");
    }
    doc.status = "rejected";
    doc.decision = { at: new Date().toISOString(), by: officer, decision: "reject", reason };
    const event = await appendEvent(state, {
      actor: `human:${officer}`,
      action: "document.rejected",
      subjectType: "document",
      subjectId: id,
      detail: `Document ${id} rejected by ${officer}: ${reason}.`,
    });
    await saveSession(env, state);
    return json(request, { document: doc, auditEvents: [event], chainTip: chainTip(state.chain) });
  }

  /* verify */
  if (asks.length === 0) {
    return error(request, 400, "name at least one ask (requirementIds) to verify against");
  }
  const proposal = doc.proposal;
  const satisfiesEvery =
    !!proposal &&
    asks.every((a) => proposal.verdicts.some((v) => v.requirementId === a && v.verdict === "satisfies"));
  if (!reason && !satisfiesEvery) {
    return error(
      request,
      400,
      'reason is required to verify, unless the machine read returned "satisfies" for every ask',
    );
  }

  /* the duties the asks unlock — register order, deduplicated */
  const unlocked = new Set<string>();
  for (const rid of asks) {
    const req = requirementOf(rid);
    if (req) for (const oid of req.unlocks) unlocked.add(oid);
  }
  const supportsObligations = state.register.filter((o) => unlocked.has(o.id)).map((o) => o.id);

  doc.status = "verified";
  const validFrom = asString(body.validFrom) ?? proposal?.validFrom?.iso;
  const validUntil = asString(body.validUntil) ?? proposal?.validUntil?.iso;
  if (validFrom) doc.validFrom = validFrom;
  if (validUntil) doc.validUntil = validUntil;
  doc.supportsObligations = supportsObligations;

  /* document.verified is appended BEFORE evidence.bound and names the evidence
     id, so the id is predicted here — exactly the next EV id bindEvidenceMany
     will allocate (mirrors session.nextEvidenceId; appendEvent never touches the
     evidence sequence, so the prediction holds) */
  const evidenceId = `EV-${String(state.nextEvidenceSeq).padStart(3, "0")}`;
  const verifiedEvent = await appendEvent(state, {
    actor: `human:${officer}`,
    action: "document.verified",
    subjectType: "document",
    subjectId: id,
    detail: `Document ${id} verified by ${officer} against ${asks.join(", ")} (dut${
      supportsObligations.length === 1 ? "y" : "ies"
    } ${supportsObligations.join(", ")}); evidence ${evidenceId} bound.`,
  });

  const bound = await bindEvidenceMany(
    state,
    supportsObligations,
    {
      kind: "document",
      title: doc.name,
      description: reason ?? `machine read: satisfies every ask; verified by ${officer}`,
      fileName: doc.fileName,
      sha256: doc.hash,
      connector: "vault-upload",
    },
    officer,
  );
  if ("notFound" in bound) {
    /* unreachable: supportsObligations was filtered to register members */
    return error(request, 500, `unlocked duty ${bound.notFound} is not on the register`);
  }

  doc.decision = {
    at: verifiedEvent.at,
    by: officer,
    decision: "verify",
    ...(reason ? { reason } : {}),
    evidenceId: bound.evidence.id,
  };

  await saveSession(env, state);
  const boundEvent = state.chain.find((e) => e.id === bound.auditEventId);
  return json(request, {
    document: doc,
    evidence: bound.evidence,
    obligations: bound.obligations.map((o) => ({ id: o.id, status: o.status })),
    auditEvents: [verifiedEvent, boundEvent],
    chainTip: chainTip(state.chain),
  });
}
