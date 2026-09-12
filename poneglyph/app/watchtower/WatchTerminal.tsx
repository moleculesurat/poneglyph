"use client";

/* Watchtower terminal — one line per polled source, read live from the
   worker's /api/watch state. No recorded replay, no invented commands:
   what the last poll actually saw (HTTP status, item count, any error).
   Hydration-safe: first paint shows the connecting line, the fetch runs
   in useEffect. */

import { useEffect, useState } from "react";

interface SourceStatus {
  fetchOk: boolean;
  httpStatus: number | null;
  items: number;
  lastError: string | null;
}
interface WatchState {
  lastPolledAt: string | null;
  fetchOk: boolean;
  lastError: string | null;
  sources?: Record<string, SourceStatus>;
}

export function WatchTerminal({
  nextPoll,
  obligationCount,
}: {
  nextPoll: string;
  obligationCount: number;
}) {
  const [state, setState] = useState<WatchState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/watch")
      .then((r) => {
        if (!r.ok) throw new Error(`/api/watch returned HTTP ${r.status}`);
        return r.json();
      })
      .then((d: WatchState) => live && setState(d))
      .catch((e: Error) => live && setError(e.message || "fetch failed"));
    return () => {
      live = false;
    };
  }, []);

  const sources = state?.sources ? Object.entries(state.sources) : [];

  return (
    <div className="terminal" aria-live="polite" style={{ maxHeight: 360, overflowY: "auto" }}>
      <div>
        <span className="t-dim">poneglyph watchtower — live poll of sebi.gov.in</span>
      </div>

      {error ? (
        <div>
          <span className="t-orange">could not reach /api/watch — {error}</span>
        </div>
      ) : !state ? (
        <div>
          <span className="t-dim">connecting…</span>
        </div>
      ) : (
        <>
          <div>
            <span className="t-dim">last poll {state.lastPolledAt ?? "never — run: npm run watch -- poll"}</span>
          </div>
          {sources.length === 0 ? (
            <div>
              <span className="t-dim">no poll on record yet — run: npm run watch -- poll</span>
            </div>
          ) : (
            sources.map(([id, s]) => (
              <div key={id} style={{ whiteSpace: "pre-wrap" }}>
                <span className={s.fetchOk ? "t-ok" : "t-orange"}>
                  {id.padEnd(18)} HTTP {s.httpStatus ?? "—"}  {s.items} items
                  {s.lastError ? `  ⚠ ${s.lastError}` : ""}
                </span>
              </div>
            ))
          )}
          <div>
            <span className="t-dim">
              register: {obligationCount} obligations tracked · next poll {nextPoll}
            </span>
          </div>
        </>
      )}
      <span className="cursor" />
    </div>
  );
}
