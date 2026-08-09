/* ══════════════════════════════════════════════════════════════════════
   The hash chain — the credibility core.

   Every audit event's hash is the first 12 hex characters of the SHA-256
   digest of one canonical string:

     id | at | actor | action | subjectType | subjectId | detail | prevHash

   Twelve characters matches the display convention already used across
   the sandbox. The genesis event's prevHash is the literal "GENESIS".

   Verification RECOMPUTES every hash from the event's own content and
   compares it against the stored value. Nothing trusts a stored hash.
   That is the difference between a tamper demo that means something and
   one that is theatre: alter a `detail` field and the recomputation
   diverges at that event and at every event after it.
   ══════════════════════════════════════════════════════════════════════ */

import type { AuditEvent } from "../lib/schema";

export const GENESIS = "GENESIS";
const HASH_CHARS = 12;

/** The exact preimage. Order and the "|" separator are part of the contract. */
export function canonicalString(
  e: Pick<AuditEvent, "id" | "at" | "actor" | "action" | "subjectType" | "subjectId" | "detail">,
  prevHash: string,
): string {
  return [e.id, e.at, e.actor, e.action, e.subjectType, e.subjectId, e.detail, prevHash].join("|");
}

const encoder = new TextEncoder();

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  const bytes = new Uint8Array(digest);
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** first 12 hex chars of SHA-256 over the canonical string */
export async function eventHash(
  e: Pick<AuditEvent, "id" | "at" | "actor" | "action" | "subjectType" | "subjectId" | "detail">,
  prevHash: string,
): Promise<string> {
  return (await sha256Hex(canonicalString(e, prevHash))).slice(0, HASH_CHARS);
}

/** Re-link a whole sequence from GENESIS, computing every hash for real.
    Used to seed a session from the authored events in data/audit.ts, whose
    stored hashes were hand-written and do not survive recomputation. */
export async function rechain(
  events: readonly Omit<AuditEvent, "hash" | "prevHash">[],
): Promise<AuditEvent[]> {
  const out: AuditEvent[] = [];
  let prevHash = GENESIS;
  for (const e of events) {
    const hash = await eventHash(e, prevHash);
    out.push({ ...e, hash, prevHash });
    prevHash = hash;
  }
  return out;
}

export interface ChainBreak {
  index: number;
  id: string;
  reason: string;
}

export interface ChainVerdict {
  intact: boolean;
  count: number;
  breaks: ChainBreak[];
  /** the hash the next appended event must carry as its prevHash */
  tip: string;
}

/** Recompute every hash from content; never trust the stored value. */
export async function verifyChain(chain: readonly AuditEvent[]): Promise<ChainVerdict> {
  const breaks: ChainBreak[] = [];
  let expectedPrev = GENESIS;

  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    if (e.prevHash !== expectedPrev) {
      breaks.push({
        index: i,
        id: e.id,
        reason: `link broken — prevHash is ${e.prevHash}, previous event hashes to ${expectedPrev}`,
      });
    }
    const recomputed = await eventHash(e, e.prevHash);
    if (recomputed !== e.hash) {
      breaks.push({
        index: i,
        id: e.id,
        reason: `content altered — stored hash ${e.hash}, content recomputes to ${recomputed}`,
      });
    }
    /* carry the STORED hash forward: a single edited event should surface as
       one content break plus one link break at its successor, not as a cascade
       of noise down the whole tail. */
    expectedPrev = e.hash;
  }

  return {
    intact: breaks.length === 0,
    count: chain.length,
    breaks,
    tip: chain.length === 0 ? GENESIS : chain[chain.length - 1].hash,
  };
}

export function chainTip(chain: readonly AuditEvent[]): string {
  return chain.length === 0 ? GENESIS : chain[chain.length - 1].hash;
}
