"use client";

/* ══════════════════════════════════════════════════════════════════════
   Audit chain — vertical hash-chain of events. Each card ends with its
   hash; the next card opens with its prevHash, joined by a rail segment,
   so the linkage reads directly off the page. "Verify chain" walks the
   full chain in the browser, comparing prevHash to the prior hash.
   ══════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Chip, Cta } from "@/components/ui";
import type { AuditEvent } from "@/lib/schema";

const SUBJECT_ROUTE: Record<AuditEvent["subjectType"], string> = {
  obligation: "/register",
  evidence: "/evidence",
  task: "/remediation",
  run: "/agents",
  corpus: "/amendments",
};

const SUBJECT_TYPES: AuditEvent["subjectType"][] = [
  "corpus",
  "obligation",
  "evidence",
  "task",
  "run",
];

const fmt = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} IST`;

type VerifyState = "idle" | "running" | "done";

export function AuditChain({ events }: { events: AuditEvent[] }) {
  const [typeFilter, setTypeFilter] = useState<"all" | AuditEvent["subjectType"]>("all");
  const [idFilter, setIdFilter] = useState<string>("all");
  const [verify, setVerify] = useState<VerifyState>("idle");
  const [progress, setProgress] = useState(-1); // chain index verified so far
  const boxRef = useRef<HTMLDivElement>(null);

  /* sequential verification pass — one link per tick */
  useEffect(() => {
    if (verify !== "running") return;
    if (progress >= events.length - 1) {
      setVerify("done");
      return;
    }
    const t = setTimeout(() => setProgress((p) => p + 1), 100);
    return () => clearTimeout(t);
  }, [verify, progress, events.length]);

  /* keep the verification cursor in view inside the chain scroll box */
  useEffect(() => {
    if (verify !== "running" || progress < 0) return;
    const box = boxRef.current;
    const el = document.getElementById(`ae-${events[progress].id}`);
    if (box && el) {
      box.scrollTo({ top: el.offsetTop - box.clientHeight * 0.55, behavior: "smooth" });
    }
  }, [verify, progress, events]);

  const startVerify = () => {
    setTypeFilter("all");
    setIdFilter("all");
    setProgress(-1);
    setVerify("running");
  };

  const resetVerify = () => {
    setVerify("idle");
    setProgress(-1);
  };

  const pickType = (t: "all" | AuditEvent["subjectType"]) => {
    resetVerify();
    setTypeFilter(t);
    setIdFilter("all");
  };

  /* the real linkage check the animation reveals */
  const linkOk = (i: number) =>
    events[i].prevHash === (i === 0 ? "GENESIS" : events[i - 1].hash);
  const breaks = events.filter((_, i) => !linkOk(i)).length;

  const idOptions = [
    ...new Set(
      events
        .filter((e) => typeFilter === "all" || e.subjectType === typeFilter)
        .map((e) => e.subjectId)
    ),
  ].sort();

  const shown = events
    .map((e, i) => ({ e, i }))
    .filter(
      ({ e }) =>
        (typeFilter === "all" || e.subjectType === typeFilter) &&
        (idFilter === "all" || e.subjectId === idFilter)
    );

  const filtered = shown.length !== events.length;

  return (
    <section style={{ marginBottom: 36 }}>
      {/* ── controls ── */}
      <div className="row between wrap" style={{ marginBottom: 14, gap: 12 }}>
        <span className="eyebrow">The chain — oldest first</span>
        <span className="mono-label dim">
          showing {shown.length} of {events.length} events
        </span>
      </div>

      <div className="row between wrap" style={{ marginBottom: 16, gap: 14 }}>
        <div className="row wrap" style={{ gap: 8 }}>
          <button className="chip" data-tone={typeFilter === "all" ? "live" : "info"} onClick={() => pickType("all")}>
            all
          </button>
          {SUBJECT_TYPES.map((t) => (
            <button
              key={t}
              className="chip"
              data-tone={typeFilter === t ? "live" : "info"}
              onClick={() => pickType(t)}
            >
              {t} · {events.filter((e) => e.subjectType === t).length}
            </button>
          ))}
          <select
            aria-label="Filter by subject id"
            className="mono-value"
            value={idFilter}
            onChange={(ev) => {
              resetVerify();
              setIdFilter(ev.target.value);
            }}
            style={{
              border: "1.5px solid var(--ink-20)",
              borderRadius: 4,
              padding: "4px 8px",
              background: "var(--white)",
              color: "var(--ink-60)",
              fontFamily: "var(--mono)",
            }}
          >
            <option value="all">any subject id</option>
            {idOptions.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        <div className="row wrap" style={{ gap: 12 }}>
          {verify === "running" ? (
            <Chip tone="live">
              <span className="dot" data-pulse /> verifying {progress + 1}/{events.length}
            </Chip>
          ) : null}
          {verify === "done" ? (
            <Chip tone={breaks === 0 ? "met" : "gap"}>
              {breaks === 0
                ? `✓ chain intact — ${events.length} events, 0 breaks`
                : `✕ ${breaks} break${breaks === 1 ? "" : "s"} found`}
            </Chip>
          ) : null}
          <Cta
            variant={verify === "done" ? "ghost" : "orange"}
            onClick={verify === "running" ? undefined : startVerify}
            toastMsg="Verification is already running."
          >
            {verify === "done" ? "Re-verify chain" : "Verify chain"}
          </Cta>
        </div>
      </div>

      {filtered ? (
        <p className="small dim60" style={{ marginBottom: 14, maxWidth: "72ch" }}>
          Filtered view — the chain runs unbroken through the hidden events. Dashed segments mark
          where events are hidden by the filter; clear it (or press Verify) to walk the full chain.
        </p>
      ) : null}

      {/* ── the chain itself ── */}
      <div
        ref={boxRef}
        className="panel"
        style={{ position: "relative", maxHeight: "68vh", overflowY: "auto", padding: "20px 22px" }}
      >
        {/* genesis anchor */}
        {shown.length > 0 && shown[0].i === 0 ? (
          <div>
            <div className="row" style={{ gap: 10 }}>
              <Chip tone="live">GENESIS</Chip>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                anchor — the chain&rsquo;s single origin
              </span>
            </div>
            <div aria-hidden style={{ width: 2, height: 16, marginLeft: 28, background: progress >= 0 ? "var(--ink)" : "var(--ink-20)" }} />
          </div>
        ) : null}

        {shown.length === 0 ? (
          <p className="small dim60">No events match this filter.</p>
        ) : null}

        {shown.map(({ e, i }, idx) => {
          const verified = verify !== "idle" && progress >= i;
          const checking = verify === "running" && progress === i;
          const prev = idx > 0 ? shown[idx - 1] : null;
          const hidden = prev ? i - prev.i - 1 : 0;

          return (
            <div key={e.id} id={`ae-${e.id}`}>
              {/* rail segment from the previous card (or a dashed gap) */}
              {idx > 0 ? (
                hidden > 0 ? (
                  <div
                    style={{
                      marginLeft: 28,
                      borderLeft: "2px dashed var(--ink-20)",
                      padding: "8px 0 8px 14px",
                    }}
                  >
                    <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                      {hidden} event{hidden === 1 ? "" : "s"} hidden by filter — linkage continues
                      through them
                    </span>
                  </div>
                ) : (
                  <div
                    aria-hidden
                    style={{
                      width: 2,
                      height: 16,
                      marginLeft: 28,
                      background: verified ? "var(--ink)" : "var(--ink-20)",
                    }}
                  />
                )
              ) : null}

              <div
                className="panel"
                style={{
                  padding: "13px 16px",
                  borderColor: checking ? "var(--orange)" : verified ? "var(--ink-20)" : undefined,
                  background: checking ? "var(--orange-soft)" : "var(--white)",
                }}
              >
                {/* prev-hash — the inbound link */}
                <div className="row wrap" style={{ gap: 8, marginBottom: 8 }}>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                    prev
                  </span>
                  <span className="hash" style={verified ? { color: "var(--ink)" } : undefined}>
                    {e.prevHash}
                  </span>
                  {verified ? (
                    <span className="mono-label" style={{ fontSize: 9.5, color: linkOk(i) ? "var(--ink)" : "var(--orange-deep)" }}>
                      {linkOk(i) ? "✓ matches" : "✕ break"}
                    </span>
                  ) : null}
                </div>

                <div className="row between wrap" style={{ gap: 8 }}>
                  <div className="row wrap" style={{ gap: 10 }}>
                    <span className="mono-label">{e.id}</span>
                    <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                      {fmt(e.at)}
                    </span>
                  </div>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <Chip tone={e.actor.startsWith("human:") ? "met" : "info"}>{e.actor}</Chip>
                    <span className="mono-value dim60">{e.action}</span>
                  </div>
                </div>

                <p className="small dim60" style={{ margin: "8px 0 10px", maxWidth: "88ch", lineHeight: 1.55 }}>
                  {e.detail}
                </p>

                <div className="row between wrap" style={{ gap: 8 }}>
                  <Link
                    href={SUBJECT_ROUTE[e.subjectType]}
                    className="mono-label"
                    style={{ color: "var(--orange-deep)" }}
                  >
                    {e.subjectType} {e.subjectId} →
                  </Link>
                  <span className="row" style={{ gap: 8 }}>
                    <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                      hash
                    </span>
                    <span className="hash" style={verified ? { color: "var(--ink)", fontWeight: 600 } : undefined}>
                      {e.hash}
                    </span>
                    {verified ? (
                      <span className="mono-label" style={{ fontSize: 9.5, color: "var(--ink)" }}>
                        ✓
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* chain tip */}
        {!filtered && shown.length > 0 ? (
          <div>
            <div aria-hidden style={{ width: 2, height: 16, marginLeft: 28, background: verify === "done" ? "var(--ink)" : "var(--ink-20)" }} />
            <span className="mono-label dim" style={{ fontSize: 9.5 }}>
              chain tip — the next event will carry prevHash {events[events.length - 1].hash}
            </span>
          </div>
        ) : null}
      </div>

      <p className="small dim60" style={{ marginTop: 12, maxWidth: "72ch" }}>
        Verification replays the recorded chain in this browser: for each event, prevHash is
        compared against the hash of the event before it. No write path exists here — the sandbox
        register is read-only.
      </p>
    </section>
  );
}
