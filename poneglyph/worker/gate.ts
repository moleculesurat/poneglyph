/* ══════════════════════════════════════════════════════════════════════
   THE HUMAN GATE.

   The product's central claim is that no agent output reaches the
   obligation register without a named human accepting it. That claim is
   enforced here by construction, not by convention:

     · `SessionState` has TWO collections. `pending` holds drafts. `register`
       holds accepted obligations. They are different arrays.
     · `proposeObligation` is the only function the pipeline can call, and
       it can only push to `pending`. It hardcodes status "pending-review"
       and never sets `approvedBy` — there is no parameter for either.
     · `decide` is the only function in the codebase that writes to
       `register`, and it requires an officer name. It is reachable from
       exactly one route: POST /api/obligations/:id/decision.
     · There is no other exported writer for `register` anywhere.

   So the bypass does not exist to be discouraged. The pipeline has no
   reference to the register at all.
   ══════════════════════════════════════════════════════════════════════ */

import type { ChapterKey, Obligation } from "../lib/schema";
import type { DecisionKind, SessionState } from "./types";
import type { DraftObligation } from "./verifier";
import { appendEvent } from "./audit";
import { sha256Hex } from "./hash";
import { nextObligationId } from "./session";

export interface ProposalContext {
  circularId: string;
  chapter: ChapterKey;
  para: string;
  runId: string;
  /** owner suggested for the control; the tenant's compliance officer */
  defaultOwner: string;
}

/** Content hash of a register entry — real SHA-256, same 12-char convention
    as the audit trail, computed over everything that gives the entry meaning. */
async function obligationHash(o: Omit<Obligation, "hash">): Promise<string> {
  const canonical = [
    o.id,
    o.title,
    o.summary,
    o.clause.circularId,
    o.clause.chapter,
    o.clause.para,
    o.clause.excerpt,
    String(o.clause.charStart),
    String(o.clause.charEnd),
    o.type,
    o.frequency ?? "",
    o.appliesTo.join(","),
    o.control.id,
    o.control.name,
    o.deadline ?? "",
    o.createdByRun,
  ].join("|");
  return (await sha256Hex(canonical)).slice(0, 12);
}

/* ── The only path a drafted obligation can take ────────────────────── */

/** Draft an obligation into the PENDING queue. Note the return type has no
    approval affordance and this function has no access to `state.register`. */
export async function proposeObligation(
  state: SessionState,
  draft: DraftObligation,
  ctx: ProposalContext,
): Promise<Obligation> {
  if (draft.charStart === -1 || draft.type === null) {
    /* unreachable through the pipeline: the verifier stops the run before
       this is called. Kept as a hard stop so it stays unreachable. */
    throw new Error("refusing to draft an obligation that did not pass the verifier");
  }

  const id = nextObligationId(state);
  const body: Omit<Obligation, "hash"> = {
    id,
    title: draft.title,
    summary: draft.summary,
    clause: {
      circularId: ctx.circularId,
      chapter: ctx.chapter,
      para: ctx.para,
      excerpt: draft.excerpt,
      charStart: draft.charStart,
      charEnd: draft.charEnd,
    },
    type: draft.type,
    frequency: draft.frequency,
    appliesTo: draft.appliesTo,
    control: {
      id: `CTL-${id.slice(-3)}`,
      name: draft.control.name,
      description: draft.control.description,
      owner: ctx.defaultOwner,
    },
    evidenceSpec: draft.evidenceSpec,
    evidenceIds: [],
    /* not a parameter. A drafted obligation is pending-review, always. */
    status: "pending-review",
    deadline: draft.deadline,
    createdByRun: ctx.runId,
  };

  const obligation: Obligation = { ...body, hash: await obligationHash(body) };
  state.pending.push(obligation);
  return obligation;
}

/* ── The gate itself ────────────────────────────────────────────────── */

export type GateFailure = "not-found" | "already-decided";

export interface GateResult {
  obligation: Obligation;
  auditEventId: string;
}

/** Approve or reject a pending obligation. The ONLY writer of `state.register`.
    Approval demands a named officer and stamps it on the record; rejection
    moves the draft to `rejected` and it never touches the register.

    Reject on an already-approved id WITHDRAWS it: the record leaves the
    register for `rejected` with status "withdrawn", its evidence bindings
    intact, and a hash-chained `obligation.withdrawn` event names the officer
    and reason. Approve on an approved id stays an error. */
export async function decide(
  state: SessionState,
  obligationId: string,
  decision: DecisionKind,
  officer: string,
  reason?: string,
): Promise<GateResult | GateFailure> {
  const index = state.pending.findIndex((o) => o.id === obligationId);

  if (index === -1) {
    const registerIndex = state.register.findIndex((o) => o.id === obligationId);
    if (decision === "reject" && registerIndex !== -1) {
      const [record] = state.register.splice(registerIndex, 1);
      const decidedAt = new Date().toISOString();
      /* keep evidenceIds untouched — the proof of what was done stays bound
         even after the duty is withdrawn from the live register */
      const withdrawn: Obligation = { ...record, status: "withdrawn" };
      state.rejected.push(withdrawn);

      const event = await appendEvent(state, {
        actor: `human:${officer}`,
        action: "obligation.withdrawn",
        subjectType: "obligation",
        subjectId: record.id,
        detail: `Withdrawn by ${officer} at the human gate — "${record.title}", grounded to ${record.clause.circularId} para ${record.clause.para}. Removed from the register${reason ? `. Reason: ${reason}` : " (no reason given)"}. Evidence bindings retained.`,
        at: decidedAt,
      });

      state.decisions.push({ obligationId: record.id, decision, officer, decidedAt, auditEventId: event.id });
      return { obligation: withdrawn, auditEventId: event.id };
    }
    const alreadyDecided = registerIndex !== -1 || state.rejected.some((o) => o.id === obligationId);
    return alreadyDecided ? "already-decided" : "not-found";
  }

  const [draft] = state.pending.splice(index, 1);
  const decidedAt = new Date().toISOString();

  if (decision === "approve") {
    /* Newly approved and nothing bound to it yet. `evidenceIds: []` means
       gap in this ontology, so that is what it is — an approved duty the
       firm has not yet evidenced. Recording it as "met" would be a lie. */
    const approved: Obligation = { ...draft, status: "gap", approvedBy: officer };
    state.register.push(approved);

    const event = await appendEvent(state, {
      actor: `human:${officer}`,
      action: "obligation.approved",
      subjectType: "obligation",
      subjectId: approved.id,
      detail: `Approved by ${officer} at the human gate — "${approved.title}", grounded to ${approved.clause.circularId} para ${approved.clause.para}, chars ${approved.clause.charStart}–${approved.clause.charEnd}. Entered the register with no evidence bound; opens as a gap pending evidence. Drafted by ${approved.createdByRun}.`,
      at: decidedAt,
    });

    state.decisions.push({
      obligationId: approved.id,
      decision,
      officer,
      decidedAt,
      auditEventId: event.id,
    });
    return { obligation: approved, auditEventId: event.id };
  }

  /* rejected — stays out of the register, stays in the trail. The status is
     carried to "rejected" so the record is self-describing: a decided draft
     must never still read as pending-review to anyone reading raw state. */
  const turnedDown: Obligation = { ...draft, status: "rejected" };
  state.rejected.push(turnedDown);

  const event = await appendEvent(state, {
    actor: `human:${officer}`,
    action: "obligation.rejected",
    subjectType: "obligation",
    subjectId: draft.id,
    detail: `Rejected by ${officer} at the human gate — "${draft.title}", drafted by ${draft.createdByRun} from ${draft.clause.circularId} para ${draft.clause.para}. Not entered in the register. The draft and this decision are retained.`,
    at: decidedAt,
  });

  state.decisions.push({
    obligationId: draft.id,
    decision,
    officer,
    decidedAt,
    auditEventId: event.id,
  });
  /* return the record as it was STORED, not the pre-decision draft — a caller
     must never be told "pending-review" about something already turned down. */
  return { obligation: turnedDown, auditEventId: event.id };
}
