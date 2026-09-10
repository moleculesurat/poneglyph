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

export async function bindEvidence(
  state: SessionState,
  obligationId: string,
  input: EvidenceInput,
  officer: string,
): Promise<BindResult | "not-found"> {
  const obligation = state.register.find((o) => o.id === obligationId);
  if (!obligation) return "not-found";

  const { kind, title, description, fileName, sha256 } = input;
  const id = nextEvidenceId(state);
  const capturedAt = new Date().toISOString();
  const hash = (
    await sha256Hex(
      `${id}|${kind}|${title}|${description}|${fileName ?? ""}|${sha256 ?? ""}|${obligationId}|${capturedAt}`,
    )
  ).slice(0, 12);

  const evidence: EvidenceArtifact = {
    id,
    kind,
    title,
    description,
    connector: "manual-upload",
    obligationIds: [obligationId],
    capturedAt,
    hash,
    history: [{ at: capturedAt, event: "captured", hash }],
    detail: { docExcerpt: fileName && sha256 ? `${fileName} · sha256 ${sha256}` : undefined },
  };

  state.evidence.push(evidence);
  obligation.evidenceIds.push(id);
  // ponytail: met on bind; periodic duties re-open as gap after the period end in Task 17 (lib/schedule)
  obligation.status = "met";

  const event = await appendEvent(state, {
    actor: `human:${officer}`,
    action: "evidence.bound",
    subjectType: "evidence",
    subjectId: id,
    detail: `Evidence ${id} (${kind}) bound to ${obligationId} by ${officer}: "${title}"${
      fileName ? `, file ${fileName} sha256 ${sha256}` : ""
    }. Status gap → met.`,
  });

  return { evidence, obligation, auditEventId: event.id };
}
