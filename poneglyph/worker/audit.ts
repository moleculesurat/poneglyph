/* ══════════════════════════════════════════════════════════════════════
   Appending to the trail.

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
