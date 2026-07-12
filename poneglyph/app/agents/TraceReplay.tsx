"use client";

/* ══════════════════════════════════════════════════════════════════════
   TraceReplay — the glass box, replayable.
   Renders a PipelineRun's TraceSteps as a vertical timeline with agent
   badges and ReAct-style mono fields (thought / action / observation).
   Server-renders fully played-out; "Replay" rewinds to step 0 and plays
   the run back on a timer, "Step" advances one frame at a time.
   Hydration-safe: initial state is deterministic (all steps revealed).
   ══════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Chip, Hairline, KV } from "@/components/ui";
import type { AgentName, PipelineRun, TraceStep } from "@/lib/schema";

const fmt = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;

const AGENT_LABEL: Record<AgentName, string> = {
  watcher: "watcher",
  applicability: "applicability",
  diff: "diff",
  extraction: "extraction",
  verifier: "verifier",
  "human-gate": "human gate",
};

const AGENT_TONE: Record<AgentName, "info" | "met" | "pending"> = {
  watcher: "info",
  applicability: "info",
  diff: "info",
  extraction: "info",
  verifier: "met",
  "human-gate": "pending",
};

/* compact mono control button (chip-as-button; no new visual language) */
function TraceBtn({
  children,
  onClick,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="mono-label"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 10,
        letterSpacing: "0.08em",
        padding: "5px 11px",
        borderRadius: 4,
        border: `1.5px solid ${active ? "var(--ink)" : "var(--ink-20)"}`,
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--white)" : "var(--ink-60)",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "default" : "pointer",
        transition: "border-color 0.12s ease",
      }}
    >
      {children}
    </button>
  );
}

function StepField({ label, text }: { label: string; text: string }) {
  const isAction = label === "action";
  return (
    <div className="row" style={{ alignItems: "baseline", gap: 12 }}>
      <span
        className="mono-label dim"
        style={{ fontSize: 9.5, minWidth: 88, flex: "none" }}
      >
        {label}
      </span>
      <span
        className="mono-value"
        style={{
          lineHeight: 1.7,
          color: isAction ? "var(--ink)" : "var(--ink-60)",
          background: isAction ? "var(--ink-05)" : "transparent",
          borderRadius: isAction ? 4 : 0,
          padding: isAction ? "1px 7px" : 0,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function StepCard({ step, index, holdsGate }: { step: TraceStep; index: number; holdsGate: boolean }) {
  return (
    <li style={{ position: "relative", padding: "0 0 22px 38px" }}>
      {/* timeline node */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 3,
          width: 15,
          height: 15,
          borderRadius: "50%",
          background: "var(--white)",
          border: `3px solid ${holdsGate ? "var(--orange)" : "var(--ink-20)"}`,
        }}
      />
      <div className="row wrap" style={{ gap: 10, marginBottom: 9 }}>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <Chip tone={AGENT_TONE[step.agent]}>{AGENT_LABEL[step.agent]}</Chip>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          {fmt(step.at)} IST
        </span>
        {holdsGate ? (
          <span className="mono-label" style={{ fontSize: 9.5, color: "var(--orange-deep)" }}>
            run holds here
          </span>
        ) : null}
      </div>
      <div className="stack" style={{ gap: 7 }}>
        {step.thought ? <StepField label="thought" text={step.thought} /> : null}
        {step.action ? <StepField label="action" text={step.action} /> : null}
        {step.observation ? <StepField label="observation" text={step.observation} /> : null}
      </div>
    </li>
  );
}

function IdLinks({ ids, href }: { ids: string[]; href: string }) {
  return (
    <span className="row wrap" style={{ gap: 10, display: "inline-flex" }}>
      {ids.map((id) => (
        <Link key={id} href={href} className="mono-value" style={{ borderBottom: "1px solid var(--ink-20)" }}>
          {id}
        </Link>
      ))}
    </span>
  );
}

export function TraceReplay({ run }: { run: PipelineRun }) {
  const total = run.steps.length;
  const [revealed, setRevealed] = useState(total); // full trace on first paint
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (revealed >= total) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setRevealed((n) => Math.min(n + 1, total)), 850);
    return () => clearTimeout(t);
  }, [playing, revealed, total]);

  const done = revealed >= total;
  const gateHolds = run.status === "awaiting-approval";
  const checksPassed = run.verifierChecks.filter((c) => c.pass).length;
  const { obligationsCreated, obligationsUpdated, tasksCreated } = run.outputs;

  return (
    <div className="stack" style={{ gap: 18 }}>
      {/* ── transport controls ── */}
      <div className="row between wrap" style={{ gap: 10 }}>
        <div className="row wrap" style={{ gap: 8 }}>
          <TraceBtn
            active={playing}
            onClick={() => {
              setRevealed(0);
              setPlaying(true);
            }}
          >
            ▸ replay
          </TraceBtn>
          <TraceBtn
            disabled={done}
            onClick={() => {
              setPlaying(false);
              setRevealed((n) => Math.min(n + 1, total));
            }}
          >
            step
          </TraceBtn>
          <TraceBtn
            disabled={done}
            onClick={() => {
              setPlaying(false);
              setRevealed(total);
            }}
          >
            show all
          </TraceBtn>
        </div>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          {playing ? "replaying · " : ""}step {revealed}/{total} · {run.durationSec}s wall clock
        </span>
      </div>

      {/* ── timeline ── */}
      <ol style={{ listStyle: "none", position: "relative", margin: 0, padding: 0 }}>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 6.5,
            top: 6,
            bottom: 10,
            width: 2,
            background: "var(--ink-10)",
          }}
        />
        {run.steps.slice(0, revealed).map((s, i) => (
          <StepCard
            key={`${s.agent}-${s.at}`}
            step={s}
            index={i}
            holdsGate={gateHolds && s.agent === "human-gate" && i === total - 1}
          />
        ))}
        {!done ? (
          <li style={{ position: "relative", padding: "0 0 4px 38px" }}>
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: 2,
                top: 2,
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "var(--orange)",
                animation: "pulse 1.1s steps(1) infinite",
              }}
            />
            <span className="mono-label dim" style={{ fontSize: 9.5 }}>
              {playing ? "replaying trace…" : `${total - revealed} steps remaining — press step or replay`}
            </span>
          </li>
        ) : null}
      </ol>

      {/* ── verifier checks + outputs (visible once the trace is played out) ── */}
      {done ? (
        <>
          <Hairline dashed />
          <div className="stack" style={{ gap: 10 }}>
            <div className="row between wrap">
              <span className="mono-label dim">deterministic verifier</span>
              <span className="mono-label" style={{ fontSize: 9.5, color: "var(--ink-60)" }}>
                {run.verifierChecks.length > 0
                  ? `${checksPassed}/${run.verifierChecks.length} checks passed`
                  : "watcher-only run — no register writes, no verifier pass required"}
              </span>
            </div>
            {run.verifierChecks.map((c) => (
              <div key={c.name} className="row" style={{ alignItems: "baseline", gap: 12 }}>
                <span
                  className="mono-value"
                  style={{
                    flex: "none",
                    width: 16,
                    textAlign: "center",
                    color: c.pass ? "var(--ink)" : "var(--orange-deep)",
                    fontWeight: 600,
                  }}
                >
                  {c.pass ? "✓" : "✕"}
                </span>
                <span className="mono-label" style={{ minWidth: 168, flex: "none" }}>
                  {c.name}
                </span>
                <span className="small dim60" style={{ lineHeight: 1.55 }}>
                  {c.note}
                </span>
              </div>
            ))}
          </div>

          {(obligationsCreated.length > 0 || obligationsUpdated.length > 0 || tasksCreated.length > 0) && (
            <>
              <Hairline dashed />
              <div className="stack" style={{ gap: 8 }}>
                <span className="mono-label dim">run outputs</span>
                {obligationsCreated.length > 0 ? (
                  <KV k={`created · ${obligationsCreated.length}`}>
                    <IdLinks ids={obligationsCreated} href="/register" />
                  </KV>
                ) : null}
                {obligationsUpdated.length > 0 ? (
                  <KV k={`updated · ${obligationsUpdated.length}`}>
                    <IdLinks ids={obligationsUpdated} href="/register" />
                  </KV>
                ) : null}
                {tasksCreated.length > 0 ? (
                  <KV k={`tasks · ${tasksCreated.length}`}>
                    <IdLinks ids={tasksCreated} href="/remediation" />
                  </KV>
                ) : null}
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
