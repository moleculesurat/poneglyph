"use client";

/* ══════════════════════════════════════════════════════════════════════
   Chain integrity — the session's hash chain, verification, and the
   tamper test.

   Nothing on this panel is animated. "verify chain" recomputes SHA-256
   over every event's own content in the Worker and compares it with the
   stored digest. "tamper test" edits one event's detail text in storage
   and leaves its stored hash unchanged, reproducing a database-level
   edit; the verifier is not told that anything happened.
   ══════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import { Chip, Hairline, KV, MarkedCard } from "@/components/ui";
import type { AuditEvent } from "@/lib/schema";
import {
  apiCall,
  stampOf,
  type AuditResponse,
  type ResetResponse,
  type TamperResponse,
  type VerifyResponse,
} from "./api";
import { MonoBtn, Notice } from "./parts";

const WINDOW = 10;

function HashPair({ event, broken }: { event: AuditEvent; broken: boolean }) {
  return (
    <div className="row wrap" style={{ gap: 14 }}>
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        prevHash
      </span>
      <span className="hash" style={{ color: broken ? "var(--orange-deep)" : undefined }}>
        {event.prevHash}
      </span>
      <span aria-hidden className="dim" style={{ fontSize: 11 }}>
        →
      </span>
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        hash
      </span>
      <span
        className="hash"
        style={{
          color: broken ? "var(--orange-deep)" : "var(--ink)",
          fontWeight: broken ? 600 : 400,
        }}
      >
        {event.hash}
      </span>
    </div>
  );
}

function EventRow({
  event,
  index,
  seeded,
  breaks,
  afterFirstBreak,
}: {
  event: AuditEvent;
  index: number;
  seeded: boolean;
  breaks: string[];
  afterFirstBreak: boolean;
}) {
  const broken = breaks.length > 0;
  return (
    <li
      style={{
        position: "relative",
        padding: "14px 0 14px 34px",
        borderTop: "1px solid var(--ink-05)",
        borderLeft: broken
          ? "3px solid var(--orange)"
          : afterFirstBreak
            ? "3px solid var(--ink-20)"
            : "3px solid transparent",
        paddingLeft: 34,
        background: broken ? "var(--orange-soft)" : "transparent",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 12,
          top: 20,
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: broken ? "var(--orange)" : "var(--white)",
          border: `2px solid ${broken ? "var(--orange)" : "var(--ink-20)"}`,
        }}
      />
      <div className="row wrap between" style={{ gap: 10 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {String(index).padStart(3, "0")}
          </span>
          <span className="mono-value">{event.id}</span>
          <Chip tone={seeded ? "info" : "live"}>{seeded ? "seeded" : "this session"}</Chip>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {stampOf(event.at)}
          </span>
        </div>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          {event.actor}
        </span>
      </div>
      <div className="stack" style={{ gap: 7, marginTop: 8 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <span className="mono-value" style={{ color: "var(--ink)" }}>
            {event.action}
          </span>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {event.subjectType} · {event.subjectId}
          </span>
        </div>
        <p className="small dim60" style={{ lineHeight: 1.6, margin: 0 }}>
          {event.detail}
        </p>
        <HashPair event={event} broken={broken} />
        {breaks.map((reason) => (
          <p
            key={reason}
            className="small"
            style={{ margin: 0, color: "var(--orange-deep)", lineHeight: 1.6 }}
          >
            break · {reason}
          </p>
        ))}
      </div>
    </li>
  );
}

export function ChainPanel({
  refreshKey,
  onSessionReset,
}: {
  refreshKey: number;
  onSessionReset: () => void;
}) {
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [verdict, setVerdict] = useState<VerifyResponse | null>(null);
  const [tamper, setTamper] = useState<TamperResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "load" | "verify" | "tamper" | "reset">(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    try {
      setBusy("load");
      const next = await apiCall<AuditResponse>("/api/audit");
      setAudit(next);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function verify() {
    try {
      setBusy("verify");
      setError(null);
      setVerdict(await apiCall<VerifyResponse>("/api/audit/verify", { method: "POST" }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function doTamper() {
    if (!audit) return;
    try {
      setBusy("tamper");
      setError(null);
      /* aim at an event inside the window on screen, so the break is visible
         rather than buried three hundred rows up */
      const index = Math.max(0, audit.count - 4);
      const result = await apiCall<TamperResponse>("/api/audit/tamper", {
        method: "POST",
        body: { index },
      });
      setTamper(result);
      setVerdict(null);
      setShowAll(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    try {
      setBusy("reset");
      setError(null);
      await apiCall<ResetResponse>("/api/session/reset", { method: "POST" });
      setVerdict(null);
      setTamper(null);
      onSessionReset();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const events = audit?.events ?? [];
  const breaksByIndex = new Map<number, string[]>();
  for (const b of verdict?.breaks ?? []) {
    const list = breaksByIndex.get(b.index) ?? [];
    list.push(b.reason);
    breaksByIndex.set(b.index, list);
  }
  const firstBreak = verdict && verdict.breaks.length > 0 ? verdict.breaks[0].index : -1;

  const start = showAll
    ? 0
    : firstBreak >= 0
      ? Math.max(0, Math.min(firstBreak - 2, events.length - WINDOW))
      : Math.max(0, events.length - WINDOW);
  const shown = events.slice(start);

  return (
    <section className="stack" style={{ gap: 18 }}>
      <div className="row between wrap" style={{ gap: 14 }}>
        <div className="stack" style={{ gap: 6 }}>
          <span className="mono-label dim">05 · audit chain</span>
          <h2 className="display" style={{ fontSize: 24 }}>
            Chain <span className="accent grad">integrity</span>
            {audit ? ` — ${audit.count} events, recomputed from content` : ""}
          </h2>
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          <MonoBtn onClick={() => void verify()} disabled={busy !== null || events.length === 0}>
            {busy === "verify" ? "verifying…" : "verify chain"}
          </MonoBtn>
          <MonoBtn
            tone="orange"
            onClick={() => void doTamper()}
            disabled={busy !== null || events.length === 0}
            title="Diagnostic: edits one event's detail text in storage and leaves its stored hash unchanged, reproducing a database-level edit."
          >
            {busy === "tamper" ? "editing record…" : "tamper test"}
          </MonoBtn>
          <MonoBtn onClick={() => void reset()} disabled={busy !== null}>
            {busy === "reset" ? "reseeding…" : "reset session"}
          </MonoBtn>
        </div>
      </div>

      <p className="small dim60" style={{ maxWidth: "78ch", lineHeight: 1.7, margin: 0 }}>
        Every entry&apos;s hash is the first twelve hex characters of SHA-256 over{" "}
        <span className="mono-value">
          id | at | actor | action | subjectType | subjectId | detail | prevHash
        </span>
        . Verification recomputes each digest from the event&apos;s own content and compares it with
        the stored value, so no stored hash is taken on trust. The tamper test is the diagnostic for
        that property: it edits a stored record without touching its stored hash, and verification
        reports the mismatch it produces.
      </p>

      {error ? <Notice tone="attention">{error}</Notice> : null}

      {audit ? (
        <div className="grid cols-4">
          <MarkedCard pad={16}>
            <div className="stack" style={{ gap: 6 }}>
              <span className="stat-number tnum" style={{ fontSize: 30 }}>
                {audit.count}
              </span>
              <span className="mono-label dim">events in chain</span>
            </div>
          </MarkedCard>
          <MarkedCard pad={16}>
            <div className="stack" style={{ gap: 6 }}>
              <span className="stat-number tnum" style={{ fontSize: 30 }}>
                {audit.seededCount}
              </span>
              <span className="mono-label dim">seeded, re-hashed at seed time</span>
            </div>
          </MarkedCard>
          <MarkedCard pad={16}>
            <div className="stack" style={{ gap: 6 }}>
              <span className={`stat-number tnum${audit.liveCount > 0 ? " grad" : ""}`} style={{ fontSize: 30 }}>
                {audit.liveCount}
              </span>
              <span className="mono-label dim">appended this session</span>
            </div>
          </MarkedCard>
          <MarkedCard pad={16}>
            <div className="stack" style={{ gap: 6 }}>
              <span className="hash" style={{ fontSize: 15, color: "var(--ink)" }}>
                {audit.tip}
              </span>
              <span className="mono-label dim">chain tip</span>
            </div>
          </MarkedCard>
        </div>
      ) : null}

      {tamper ? (
        <Notice tone="attention">
          {tamper.hint} No other record was modified, and{" "}
          <span className="mono-value">/api/audit/verify</span> receives no signal that the edit
          occurred — run it now and the mismatch is found by recomputation alone.
        </Notice>
      ) : null}

      {verdict ? (
        <MarkedCard
          pad={20}
          style={
            verdict.intact
              ? undefined
              : { borderColor: "var(--orange)", background: "var(--orange-soft)" }
          }
        >
          <div className="stack" style={{ gap: 10 }}>
            <div className="row wrap between" style={{ gap: 10 }}>
              <span
                className="mono-value"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: verdict.intact ? "var(--ink)" : "var(--orange-deep)",
                }}
              >
                {verdict.intact
                  ? `chain intact — ${verdict.count} events, 0 breaks`
                  : `chain broken — ${verdict.breaks.length} break${verdict.breaks.length === 1 ? "" : "s"} across ${verdict.count} events`}
              </span>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                tip {verdict.tip}
              </span>
            </div>
            {verdict.breaks.map((b) => (
              <KV key={`${b.index}-${b.reason}`} k={`index ${b.index} · ${b.id}`}>
                <span style={{ color: "var(--orange-deep)" }}>{b.reason}</span>
              </KV>
            ))}
            <p className="small dim60" style={{ margin: 0, lineHeight: 1.6 }}>
              {verdict.method}
            </p>
            {!verdict.intact ? (
              <p className="small" style={{ margin: 0, lineHeight: 1.6, color: "var(--orange-deep)" }}>
                The break is located at the event that was edited: its stored hash is no longer the
                SHA-256 of its own content. The link into the next event still lines up, because that
                event chains onto the stored hash — the verifier carries stored hashes forward
                deliberately, so one edit reports as one precise break rather than a cascade down the
                tail. Every entry after index {firstBreak} names a predecessor whose recorded content
                no longer produces the hash it claims. Reset the session to reseed a clean chain.
              </p>
            ) : null}
          </div>
        </MarkedCard>
      ) : null}

      <MarkedCard pad={0}>
        <div
          className="row between wrap"
          style={{ gap: 10, padding: "14px 20px" }}
        >
          <span className="mono-label dim">
            {showAll
              ? `all ${events.length} events`
              : `events ${start}–${Math.max(start, events.length - 1)} of ${events.length}`}
          </span>
          <MonoBtn onClick={() => setShowAll((v) => !v)} disabled={events.length <= WINDOW}>
            {showAll ? "show the tail only" : `show all ${events.length}`}
          </MonoBtn>
        </div>
        <Hairline />
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {shown.map((event, i) => {
            const index = start + i;
            return (
              <EventRow
                key={event.id}
                event={event}
                index={index}
                seeded={audit ? index < audit.seededCount : false}
                breaks={breaksByIndex.get(index) ?? []}
                afterFirstBreak={firstBreak >= 0 && index > firstBreak}
              />
            );
          })}
          {shown.length === 0 ? (
            <li style={{ padding: "18px 20px" }}>
              <span className="small dim">
                {busy === "load" ? "loading the chain…" : "no events loaded"}
              </span>
            </li>
          ) : null}
        </ol>
      </MarkedCard>
    </section>
  );
}
