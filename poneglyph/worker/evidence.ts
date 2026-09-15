/* ══════════════════════════════════════════════════════════════════════
   Stage 6 — PROVE. Bind an artefact to an approved duty.

   The firm keeps its own file; only a sha256 and the artefact's metadata
   enter the shared register. Binding flips the obligation to `met` and
   appends one hash-chained audit event — the same trail every mutation uses.
   ══════════════════════════════════════════════════════════════════════ */

import type { EvidenceArtifact, EvidenceKind, Obligation } from "../lib/schema";
import { appendEvent } from "./audit";
import { sha256Hex } from "./hash";
import { nextEvidenceId } from "./session";
import type { SessionState } from "./types";

export interface EvidenceInput {
  kind: EvidenceKind;
  title: string;
  description: string;
  fileName?: string;
  sha256?: string;
  validUntil?: string;
}

export interface BindResult {
  evidence: EvidenceArtifact;
  obligation: Obligation;
  auditEventId: string;
}

export interface BindManyResult {
  evidence: EvidenceArtifact;
  obligations: Obligation[];
  auditEventId: string;
}

/** Bind ONE artefact to several approved duties at once — the vault's verify
    path, where a single document is the proof for every duty its asks unlock.
    Creates one EvidenceArtifact over all the ids (register order, hash over the
    ids joined by ","), pushes it onto each duty and flips each to met, and
    appends ONE evidence.bound event listing them. A first unknown id fails the
    whole bind. */
export async function bindEvidenceMany(
  state: SessionState,
  obligationIds: string[],
  input: EvidenceInput & { connector?: string },
  officer: string,
): Promise<BindManyResult | { notFound: string }> {
  const byId = new Map(state.register.map((o) => [o.id, o]));
  for (const oid of obligationIds) {
    if (!byId.has(oid)) return { notFound: oid };
  }
  /* register order, deduplicated — the artefact and its audit line read the
     same way everywhere, regardless of the order the caller passed */
  const named = new Set(obligationIds);
  const obligations = state.register.filter((o) => named.has(o.id));
  const ids = obligations.map((o) => o.id);

  const { kind, title, description, fileName, sha256 } = input;
  const connector = input.connector ?? "manual-upload";
  const id = nextEvidenceId(state);
  const capturedAt = new Date().toISOString();
  const hash = (
    await sha256Hex(
      `${id}|${kind}|${title}|${description}|${fileName ?? ""}|${sha256 ?? ""}|${ids.join(",")}|${capturedAt}`,
    )
  ).slice(0, 12);

  const evidence: EvidenceArtifact = {
    id,
    kind,
    title,
    description,
    connector,
    obligationIds: ids,
    capturedAt,
    hash,
    history: [{ at: capturedAt, event: "captured", hash }],
    detail: { docExcerpt: fileName && sha256 ? `${fileName} · sha256 ${sha256}` : undefined },
  };

  state.evidence.push(evidence);
  for (const o of obligations) {
    o.evidenceIds.push(id);
    // ponytail: met on bind; periodic duties re-open as gap after the period end in Task 17 (lib/schedule)
    o.status = "met";
  }

  const event = await appendEvent(state, {
    actor: `human:${officer}`,
    action: "evidence.bound",
    subjectType: "evidence",
    subjectId: id,
    detail: `Evidence ${id} (${kind}) bound to ${ids.join(", ")} by ${officer}: "${title}"${
      fileName ? `, file ${fileName} sha256 ${sha256}` : ""
    }. Status gap → met.`,
  });

  return { evidence, obligations, auditEventId: event.id };
}

/** Single-duty bind — the register row's own attach form. Unchanged in shape
    and audit detail; a thin call over bindEvidenceMany. */
export async function bindEvidence(
  state: SessionState,
  obligationId: string,
  input: EvidenceInput,
  officer: string,
): Promise<BindResult | "not-found"> {
  const result = await bindEvidenceMany(state, [obligationId], input, officer);
  if ("notFound" in result) return "not-found";
  return { evidence: result.evidence, obligation: result.obligations[0], auditEventId: result.auditEventId };
}
