/* ══════════════════════════════════════════════════════════════════════
   Appending to the trail, and the tamper control that proves it is real.

   `appendEvent` is the ONLY way an event joins the chain. It reads the
   current tip, computes the real hash over the canonical string, and
   pushes. There is no path that writes a hash by hand.
   ══════════════════════════════════════════════════════════════════════ */

import type { AuditEvent } from "../lib/schema";
import { chainTip, eventHash } from "./hash";
import { nextEventId } from "./session";
import type { SessionState } from "./types";

export interface AuditDraft {
  actor: string;
  action: string;
  subjectType: AuditEvent["subjectType"];
  subjectId: string;
  detail: string;
  /** override only for replaying a fixed sim timestamp; defaults to now */
  at?: string;
}

export async function appendEvent(
  state: SessionState,
  draft: AuditDraft,
): Promise<AuditEvent> {
  const prevHash = chainTip(state.chain);
  const body = {
    id: nextEventId(state),
    at: draft.at ?? new Date().toISOString(),
    actor: draft.actor,
    action: draft.action,
    subjectType: draft.subjectType,
    subjectId: draft.subjectId,
    detail: draft.detail,
  };
  const event: AuditEvent = { ...body, hash: await eventHash(body, prevHash), prevHash };
  state.chain.push(event);
  return event;
}

/* ── The tamper control ─────────────────────────────────────────────────
   A demo control, and an honest one: it edits an event's `detail` in place
   and leaves the stored hash untouched, exactly as a database-level edit
   would. Nothing else is changed and no flag is consulted by the verifier —
   /api/audit/verify has no idea this happened. It catches the edit purely by
   recomputing SHA-256 over the content and finding a different digest.
   Reversible with POST /api/session/reset. */

const TAMPER_MARKER = " Settlement completed within the prescribed window.";

export interface TamperResult {
  tampered: { index: number; id: string; field: string };
  hint: string;
}

export function tamperEvent(state: SessionState, requestedIndex?: number): TamperResult | null {
  if (state.chain.length === 0) return null;

  const index =
    typeof requestedIndex === "number" && Number.isInteger(requestedIndex)
      ? Math.min(Math.max(requestedIndex, 0), state.chain.length - 1)
      : Math.floor(state.chain.length / 2);

  const target = state.chain[index];
  /* append rather than replace, so the altered text still reads plausibly —
     a doctored record that looks obviously doctored proves nothing */
  const altered = target.detail.endsWith(TAMPER_MARKER)
    ? target.detail.replace(TAMPER_MARKER, "")
    : target.detail + TAMPER_MARKER;

  state.chain[index] = { ...target, detail: altered };
  state.tampered = { index, id: target.id, field: "detail" };

  return {
    tampered: state.tampered,
    hint: `Event ${target.id} at chain index ${index} had its detail text edited directly in storage. Its stored hash was left alone, as it would be by anyone editing the record behind the engine's back. Run the chain verification to see SHA-256 recompute a different digest for that event: the edit is caught by arithmetic on the content, not by any flag this control set.`,
  };
}
