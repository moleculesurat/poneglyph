"use client";

/* ══════════════════════════════════════════════════════════════════════
   Small pieces shared by the live console and the chain panel.
   Same visual language as app/agents/TraceReplay.tsx — agent badge,
   ReAct fields in mono, timeline node — so a live run and a seeded run
   read identically. The only difference is that this one is happening.
   ══════════════════════════════════════════════════════════════════════ */

import type { ReactNode } from "react";
import { Chip } from "@/components/ui";
import type { AgentName, TraceStep } from "@/lib/schema";
import { stampOf } from "./api";

export const AGENT_LABEL: Record<AgentName, string> = {
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

/* compact mono control button — chip-as-button, no new visual language */
export function MonoBtn({
  children,
  onClick,
  active = false,
  disabled = false,
  tone = "ink",
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: "ink" | "orange";
  title?: string;
}) {
  const edge = tone === "orange" ? "var(--orange)" : "var(--ink)";
  return (
    <button
      type="button"
      className="mono-label"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        fontSize: 10,
        letterSpacing: "0.08em",
        padding: "6px 12px",
        borderRadius: 4,
        border: `1.5px solid ${active ? edge : "var(--ink-20)"}`,
        background: active ? edge : "transparent",
        color: active ? "var(--white)" : tone === "orange" ? "var(--orange-deep)" : "var(--ink-60)",
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
      <span className="mono-label dim" style={{ fontSize: 9.5, minWidth: 88, flex: "none" }}>
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

export function StepCard({
  step,
  index,
  holdsGate,
}: {
  step: TraceStep;
  index: number;
  holdsGate: boolean;
}) {
  return (
    <li style={{ position: "relative", padding: "0 0 22px 38px" }}>
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
          {stampOf(step.at)} UTC
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

/* ── Clause with the resolved spans marked ──────────────────────────────
   The highlight is drawn from charStart/charEnd that the verifier MEASURED
   with indexOf. If the offsets were asserted rather than computed, the
   marker would land in the wrong place — which is the point of showing it. */

export interface Span {
  start: number;
  end: number;
  label?: string;
}

export function HighlightedClause({ text, spans }: { text: string; spans: Span[] }) {
  const usable = spans
    .filter((s) => s.start >= 0 && s.end > s.start && s.end <= text.length)
    .sort((a, b) => a.start - b.start);

  const merged: Span[] = [];
  for (const span of usable) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) {
      last.end = Math.max(last.end, span.end);
    } else {
      merged.push({ ...span });
    }
  }

  if (merged.length === 0) {
    return <p className="clause-text">{text}</p>;
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;
  merged.forEach((span, i) => {
    if (span.start > cursor) nodes.push(<span key={`t${i}`}>{text.slice(cursor, span.start)}</span>);
    nodes.push(
      <mark key={`h${i}`} className="clause-hl" style={{ color: "inherit" }}>
        {text.slice(span.start, span.end)}
      </mark>,
    );
    cursor = span.end;
  });
  if (cursor < text.length) nodes.push(<span key="tail">{text.slice(cursor)}</span>);

  return <p className="clause-text">{nodes}</p>;
}

/* ── Notice band — one line, orange only when something needs attention ── */
export function Notice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "attention";
  children: ReactNode;
}) {
  const attention = tone === "attention";
  return (
    <div
      className="small"
      style={{
        borderLeft: `3px solid ${attention ? "var(--orange)" : "var(--ink-20)"}`,
        background: attention ? "var(--orange-soft)" : "var(--ink-05)",
        padding: "10px 14px",
        lineHeight: 1.6,
        color: attention ? "var(--orange-deep)" : "var(--ink-60)",
      }}
    >
      {children}
    </div>
  );
}
