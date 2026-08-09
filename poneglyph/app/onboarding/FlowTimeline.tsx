"use client";

/* ══════════════════════════════════════════════════════════════════════
   FlowTimeline — the six onboarding steps as a walkable timeline.

   Each step is collapsed to its outcome; expanding it reveals the same
   ReAct trace the agent console renders for a pipeline run — thought /
   action / observation, per agent, in mono. Onboarding is not a wizard
   that produced a result; it is a run that can be replayed.

   Hydration-safe: initial open-state is deterministic (all collapsed).
   The `extras` slot lets the server page inject rendered content into a
   given step — the designation step uses it for the QSB computation.
   ══════════════════════════════════════════════════════════════════════ */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Chip, Hairline } from "@/components/ui";
import type {
  AgentName,
  OnboardingStep,
  OnboardingStepKey,
  OnboardingStepStatus,
  TraceStep,
} from "@/lib/schema";

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

const STATUS_TONE: Record<OnboardingStepStatus, "met" | "at-risk" | "pending"> = {
  done: "met",
  active: "at-risk",
  pending: "pending",
};

/** Where each step's output lives in the product, once the step is done. */
const STEP_LINK: Partial<Record<OnboardingStepKey, { href: string; label: string }>> = {
  identify: { href: "#entity", label: "entity profile" },
  segments: { href: "#questions", label: "the questions" },
  designation: { href: "/documents", label: "DOC-REQ-004" },
  scope: { href: "#scope", label: "scope table" },
  documents: { href: "/documents", label: "document vault" },
  activate: { href: "/register", label: "obligation register" },
};

function CtrlBtn({
  children,
  onClick,
  active = false,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className="mono-label"
      onClick={onClick}
      style={{
        fontSize: 10,
        letterSpacing: "0.08em",
        padding: "5px 11px",
        borderRadius: 4,
        border: `1.5px solid ${active ? "var(--ink)" : "var(--ink-20)"}`,
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--white)" : "var(--ink-60)",
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
      <span className="mono-label dim" style={{ fontSize: 9.5, minWidth: 80, flex: "none" }}>
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

function TraceCard({ step, index }: { step: TraceStep; index: number }) {
  return (
    <li style={{ position: "relative", padding: "0 0 18px 30px" }}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 4,
          width: 13,
          height: 13,
          borderRadius: "50%",
          background: "var(--white)",
          border: `3px solid ${step.agent === "human-gate" ? "var(--orange)" : "var(--ink-20)"}`,
        }}
      />
      <div className="row wrap" style={{ gap: 10, marginBottom: 8 }}>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <Chip tone={AGENT_TONE[step.agent]}>{AGENT_LABEL[step.agent]}</Chip>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          {fmt(step.at)} IST
        </span>
      </div>
      <div className="stack" style={{ gap: 7 }}>
        {step.thought ? <StepField label="thought" text={step.thought} /> : null}
        {step.action ? <StepField label="action" text={step.action} /> : null}
        {step.observation ? <StepField label="observation" text={step.observation} /> : null}
      </div>
    </li>
  );
}

export function FlowTimeline({
  steps,
  extras,
}: {
  steps: OnboardingStep[];
  extras?: Partial<Record<OnboardingStepKey, ReactNode>>;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const openCount = steps.filter((s) => open[s.key]).length;

  const setAll = (v: boolean) =>
    setOpen(Object.fromEntries(steps.map((s) => [s.key, v])) as Record<string, boolean>);

  return (
    <>
      <div className="row between wrap" style={{ marginBottom: 14, gap: 12 }}>
        <span className="eyebrow">
          Six steps, run once — every one of them replayable
        </span>
        <div className="row" style={{ gap: 8 }}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {openCount}/{steps.length} expanded
          </span>
          <CtrlBtn onClick={() => setAll(true)} active={openCount === steps.length}>
            expand all
          </CtrlBtn>
          <CtrlBtn onClick={() => setAll(false)}>collapse</CtrlBtn>
        </div>
      </div>

      <ol style={{ listStyle: "none", position: "relative", margin: 0, padding: 0 }}>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 15,
            top: 10,
            bottom: 24,
            width: 1.5,
            background: "var(--ink-10)",
          }}
        />
        {steps.map((step, i) => {
          const isOpen = !!open[step.key];
          const link = STEP_LINK[step.key];
          const trace = step.trace ?? [];
          const agents = [...new Set(trace.map((t) => t.agent))];
          return (
            <li key={step.key} style={{ position: "relative", padding: "0 0 14px 52px" }}>
              <span
                className="mono-label"
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 31,
                  height: 31,
                  borderRadius: "50%",
                  background: "var(--white)",
                  border: `1.5px solid ${step.status === "done" ? "var(--ink-20)" : "var(--ink-10)"}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "var(--ink-60)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="panel pad" style={{ padding: "16px 20px" }}>
                <div className="row between wrap" style={{ gap: 12 }}>
                  <div className="row wrap" style={{ gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 14.5 }}>{step.title}</span>
                    <Chip tone={STATUS_TONE[step.status]}>{step.status}</Chip>
                    <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                      {step.key}
                    </span>
                  </div>
                  <div className="row" style={{ gap: 10 }}>
                    {link ? (
                      <Link
                        href={link.href}
                        className="mono-label"
                        style={{ fontSize: 9.5, color: "var(--ink-40)" }}
                      >
                        {link.label} →
                      </Link>
                    ) : null}
                    {trace.length || extras?.[step.key] ? (
                      <CtrlBtn onClick={() => setOpen((o) => ({ ...o, [step.key]: !o[step.key] }))} active={isOpen}>
                        {isOpen ? "hide reasoning" : `reasoning · ${trace.length}`}
                      </CtrlBtn>
                    ) : null}
                  </div>
                </div>

                <p className="small dim60" style={{ marginTop: 9, maxWidth: "82ch", lineHeight: 1.6 }}>
                  {step.blurb}
                </p>

                {step.outcome ? (
                  <div className="row" style={{ alignItems: "baseline", gap: 12, marginTop: 12 }}>
                    <span
                      className="mono-label"
                      style={{ fontSize: 9.5, minWidth: 80, flex: "none", color: "var(--orange-deep)" }}
                    >
                      outcome
                    </span>
                    <span className="small" style={{ lineHeight: 1.6 }}>{step.outcome}</span>
                  </div>
                ) : null}

                {isOpen ? (
                  <div style={{ marginTop: 16 }}>
                    {extras?.[step.key] ? (
                      <div style={{ marginBottom: 18 }}>{extras[step.key]}</div>
                    ) : null}
                    {trace.length ? (
                      <>
                        <Hairline dashed />
                        <div className="row between wrap" style={{ gap: 10, margin: "14px 0 14px" }}>
                          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                            reasoning trace — {trace.length} steps
                          </span>
                          <div className="row wrap" style={{ gap: 6 }}>
                            {agents.map((a) => (
                              <span key={a} className="mono-label dim" style={{ fontSize: 9 }}>
                                {AGENT_LABEL[a]}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                          {trace.map((t, ti) => (
                            <TraceCard key={`${step.key}-${ti}`} step={t} index={ti} />
                          ))}
                        </ol>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
