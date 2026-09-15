/* ══════════════════════════════════════════════════════════════════════
   Documents in — the firm's file vault.

   A PDF is uploaded through the gate, its bytes are stored by the FILES
   binding and its text is extracted by PDFTEXT — both Node-only, so both
   live in server.mjs and are absent on workerd (the routes 503 there rather
   than throw). Only the sha256, the text stats and the metadata enter the
   register; the file itself stays on the runtime's disk. One hash-chained
   audit event records the receipt, the same trail every mutation uses.
   ══════════════════════════════════════════════════════════════════════ */

import type { CompanyDocument } from "../lib/schema";
import { documentRequirements } from "../data/documents";
import { appendEvent } from "./audit";
import { chainTip, sha256HexBytes } from "./hash";
import { asString, corsHeaders, error, json } from "./http";
import { saveSession } from "./session";
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
  const requirementIds =
    typeof reqIdsRaw === "string"
      ? reqIdsRaw.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
      : [];
  for (const rid of requirementIds) {
    if (!documentRequirements.some((r) => r.id === rid)) {
      return error(request, 400, `unknown requirement id ${rid} — not in the document requirements`);
    }
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
  const pages = (text.match(/\f/g) ?? []).length + 1;
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
    subjectType: "evidence",
    subjectId: id,
    detail: `Document ${id} received: ${file.name} (sha256 ${sha}), ${
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
