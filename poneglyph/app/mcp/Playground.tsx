"use client";

/* MCP playground — animated replay of the scripted conversation from
   data/mcp. Turns appear on a timer (deterministic cadence, no randomness);
   replay and show-all re-drive the same recorded script. Hydration-safe:
   first paint renders zero turns, timers start in useEffect. */

import { useEffect, useRef, useState } from "react";
import { useSandboxToast } from "@/components/toast";

type Turn = { role: "user" | "assistant" | "tool"; name?: string; text: string };

export function Playground({ script }: { script: Turn[] }) {
  const [shown, setShown] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const toast = useSandboxToast();

  /* honour reduced motion: print the whole conversation at once */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(script.length);
    }
  }, [script.length]);

  /* turn-by-turn reveal; tool results land faster than composed prose */
  useEffect(() => {
    if (shown >= script.length) return;
    const next = script[shown];
    const delay = shown === 0 ? 500 : next.role === "tool" ? 650 : 1000;
    const id = setTimeout(() => setShown((v) => v + 1), delay);
    return () => clearTimeout(id);
  }, [shown, script]);

  /* keep the newest turn in view */
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  const done = shown >= script.length;

  return (
    <div className="stack" style={{ gap: 14 }}>
      {/* controls */}
      <div className="row between wrap" style={{ gap: 10 }}>
        <span className="mono-label dim">
          scripted replay · {script.length} turns · no live model
        </span>
        <div className="row" style={{ gap: 8 }}>
          <span className="mono-label dim tnum">
            {Math.min(shown, script.length)}/{script.length}
          </span>
          <button
            className="chip"
            data-tone="info"
            onClick={() => setShown(script.length)}
            aria-label="Show the full conversation immediately"
          >
            show all
          </button>
          <button
            className="chip"
            data-tone="live"
            onClick={() => setShown(0)}
            aria-label="Replay the scripted conversation"
          >
            replay ▸
          </button>
        </div>
      </div>

      {/* transcript */}
      <div
        ref={boxRef}
        aria-live="polite"
        className="stack"
        style={{ gap: 16, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}
      >
        {script.slice(0, shown).map((t, i) => {
          if (t.role === "user") {
            return (
              <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "72%" }}>
                  <div className="mono-label dim" style={{ fontSize: 9.5, textAlign: "right", marginBottom: 5 }}>
                    compliance officer
                  </div>
                  <div
                    style={{
                      background: "var(--ink)",
                      color: "var(--white)",
                      padding: "12px 16px",
                      borderRadius: "6px 6px 6px 22px",
                      fontSize: 13.5,
                      lineHeight: 1.55,
                    }}
                  >
                    {t.text}
                  </div>
                </div>
              </div>
            );
          }
          if (t.role === "tool") {
            return (
              <div key={i} style={{ maxWidth: "92%" }}>
                <div className="mono-label dim" style={{ fontSize: 9.5, marginBottom: 5 }}>
                  ▸ tool result · {t.name ?? "tool"}
                </div>
                <div className="terminal" style={{ maxHeight: 240, overflowY: "auto" }}>
                  <pre style={{ margin: 0, fontFamily: "inherit" }}>{t.text}</pre>
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={{ maxWidth: "88%" }}>
              <div className="mono-label dim" style={{ fontSize: 9.5, marginBottom: 5 }}>
                assistant · via mcp
              </div>
              <div
                className="panel"
                style={{
                  padding: "14px 18px",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {t.text}
              </div>
            </div>
          );
        })}
        {!done ? (
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {shown === 0 ? "starting replay" : "…"}
          </span>
        ) : null}
      </div>

      {/* disabled composer — the sandbox replays, it does not answer */}
      <div className="row" style={{ gap: 10 }}>
        <input
          readOnly
          placeholder="Ask about any obligation — disabled in the sandbox; the replay above is scripted"
          onFocus={(e) => e.currentTarget.blur()}
          onClick={() => toast("Sandbox — the playground replays a recorded script")}
          aria-label="Playground input, disabled in the sandbox"
          style={{
            flex: 1,
            border: "1.5px solid var(--ink-20)",
            borderRadius: "6px 6px 22px 6px",
            padding: "11px 16px",
            font: "inherit",
            fontSize: 13,
            color: "var(--ink-40)",
            background: "var(--paper)",
            cursor: "not-allowed",
          }}
        />
        <button
          className="cta"
          onClick={() => toast("Sandbox — the playground replays a recorded script")}
        >
          Send <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}
