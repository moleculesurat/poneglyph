"use client";

/* Watchtower terminal — animated replay of the recorded scraper run.
   Lines are derived from RUN-048's trace and appear on a timer; replay
   and show-all controls re-drive the same recorded data. Hydration-safe:
   first paint renders zero lines, timers start in useEffect. */

import { useEffect, useMemo, useRef, useState } from "react";
import type { PipelineRun } from "@/lib/schema";

type Tone = "dim" | "plain" | "ok" | "orange";
interface TLine {
  t?: string; // HH:MM:SS from the trace
  tone: Tone;
  text: string;
}

function buildLines(run: PipelineRun, nextPoll: string, obligationCount: number): TLine[] {
  const lines: TLine[] = [
    { tone: "dim", text: `poneglyph watchtower — recorded session ${run.id} (sandbox replay, not a live poll)` },
    { tone: "plain", text: "$ poneglyph watch --sources sebi.gov.in --interval 24h --tenant angel-one-limited" },
    {
      t: run.startedAt.slice(11, 19),
      tone: "plain",
      text: `session opened · trigger: ${run.trigger}`,
    },
  ];

  for (const s of run.steps) {
    const t = s.at.slice(11, 19);
    if (s.thought) lines.push({ t, tone: "dim", text: `${s.agent} · thought   ${s.thought}` });
    if (s.action) lines.push({ t, tone: "plain", text: `${s.agent} · action    ${s.action}` });
    if (s.observation) lines.push({ t, tone: "ok", text: `${s.agent} · observe   ${s.observation}` });
  }

  const created = run.outputs.obligationsCreated.length;
  const updated = run.outputs.obligationsUpdated.length;
  lines.push({
    tone: "ok",
    text: `register: ${obligationCount} obligations tracked · ${created} created · ${updated} updated this run`,
  });
  lines.push({
    tone: run.status === "completed" ? "ok" : "orange",
    text: `run ${run.id} ${run.status} · ${run.durationSec}s`,
  });
  lines.push({ tone: "dim", text: `sleeping — next poll ${nextPoll}` });
  return lines;
}

export function WatchTerminal({
  run,
  nextPoll,
  obligationCount,
}: {
  run: PipelineRun;
  nextPoll: string;
  obligationCount: number;
}) {
  const lines = useMemo(
    () => buildLines(run, nextPoll, obligationCount),
    [run, nextPoll, obligationCount]
  );
  const [shown, setShown] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  /* honour reduced motion: print the whole log at once */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(lines.length);
    }
  }, [lines.length]);

  /* line-by-line reveal; cadence varies deterministically per line */
  useEffect(() => {
    if (shown >= lines.length) return;
    const delay = shown === 0 ? 380 : 200 + ((shown * 47) % 3) * 110;
    const id = setTimeout(() => setShown((v) => v + 1), delay);
    return () => clearTimeout(id);
  }, [shown, lines.length]);

  /* keep the newest line in view */
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  const done = shown >= lines.length;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row between wrap" style={{ gap: 10 }}>
        <span className="mono-label dim">
          {run.id} · {run.steps.length} trace steps · recorded {run.startedAt.slice(0, 10)}
        </span>
        <div className="row" style={{ gap: 8 }}>
          <span className="mono-label dim tnum">
            {Math.min(shown, lines.length)}/{lines.length}
          </span>
          <button
            className="chip"
            data-tone="info"
            onClick={() => setShown(lines.length)}
            aria-label="Show the full log immediately"
          >
            show all
          </button>
          <button
            className="chip"
            data-tone="live"
            onClick={() => setShown(0)}
            aria-label="Replay the recorded session"
          >
            replay ▸
          </button>
        </div>
      </div>

      <div
        ref={boxRef}
        className="terminal"
        aria-live="polite"
        style={{ maxHeight: 360, overflowY: "auto" }}
      >
        {lines.slice(0, shown).map((l, i) => (
          <div key={i} style={{ whiteSpace: "pre-wrap" }}>
            {l.t ? <span className="t-dim">[{l.t}] </span> : null}
            {l.text.startsWith("$ ") ? (
              <>
                <span className="t-orange">$</span>
                <span className="t-ok">{l.text.slice(1)}</span>
              </>
            ) : (
              <span
                className={
                  l.tone === "dim"
                    ? "t-dim"
                    : l.tone === "ok"
                      ? "t-ok"
                      : l.tone === "orange"
                        ? "t-orange"
                        : undefined
                }
              >
                {l.text}
              </span>
            )}
          </div>
        ))}
        <span className="cursor" />
        {done ? <span className="t-dim">{"  "}awaiting next poll</span> : null}
      </div>
    </div>
  );
}
