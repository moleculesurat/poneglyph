"use client";

/* ══════════════════════════════════════════════════════════════════════
   QuestionDeck — the elicitation record for the onboarding session.

   Each card shows four things in a fixed order: the question, the basis
   for asking it (always visible), what the engine had already worked out
   from public sources and where that came from, and what the confirmed
   answer switched on.

   The filter splits the deck by origin: most questions arrived pre-filled
   from public disclosure, and the human confirms rather than retypes. The
   ones the engine could not pre-fill are left deliberately blank.
   ══════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { Chip, Hairline } from "@/components/ui";
import type { OnboardingQuestion } from "@/lib/schema";

type Filter = "all" | "prefilled" | "cold";

const KIND_LABEL: Record<OnboardingQuestion["kind"], string> = {
  single: "single choice",
  multi: "multi select",
  text: "free text",
  number: "number",
};

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="chip"
      data-tone={active ? "live" : "info"}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

function Row({ label, tone, children }: { label: string; tone?: "orange"; children: React.ReactNode }) {
  return (
    <div className="row" style={{ alignItems: "baseline", gap: 12 }}>
      <span
        className="mono-label"
        style={{
          fontSize: 9.5,
          minWidth: 84,
          flex: "none",
          color: tone === "orange" ? "var(--orange-deep)" : "var(--ink-40)",
        }}
      >
        {label}
      </span>
      <span className="small" style={{ lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

export function QuestionDeck({
  questions,
  stepTitles,
}: {
  questions: OnboardingQuestion[];
  stepTitles: Record<string, string>;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const prefilled = questions.filter((q) => q.prefilled);
  const cold = questions.filter((q) => !q.prefilled);
  const shown =
    filter === "prefilled" ? prefilled : filter === "cold" ? cold : questions;

  return (
    <>
      <div className="row between wrap" style={{ gap: 12, marginBottom: 16 }}>
        <div className="row wrap" style={{ gap: 8 }}>
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            all {questions.length}
          </FilterChip>
          <FilterChip active={filter === "prefilled"} onClick={() => setFilter("prefilled")}>
            pre-filled {prefilled.length}
          </FilterChip>
          <FilterChip active={filter === "cold"} onClick={() => setFilter("cold")}>
            asked cold {cold.length}
          </FilterChip>
        </div>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          source shown for every pre-filled answer
        </span>
      </div>

      <div className="stack" style={{ gap: 14 }}>
        {shown.map((q) => (
          <div key={q.id} className="panel pad" style={{ padding: "18px 20px" }}>
            <div className="row between wrap" style={{ gap: 10, marginBottom: 10 }}>
              <div className="row wrap" style={{ gap: 9 }}>
                <span className="mono-label dim" style={{ fontSize: 9.5 }}>{q.id}</span>
                <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                  {stepTitles[q.step] ?? q.step}
                </span>
                <span className="mono-label dim" style={{ fontSize: 9.5 }}>{KIND_LABEL[q.kind]}</span>
              </div>
              <Chip tone={q.prefilled ? "met" : "at-risk"}>
                {q.prefilled ? "pre-filled" : "asked cold"}
              </Chip>
            </div>

            <p style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.45, maxWidth: "78ch" }}>
              {q.question}
            </p>

            <div
              style={{
                margin: "12px 0 14px",
                paddingLeft: 14,
                borderLeft: "2px solid var(--ink-10)",
                maxWidth: "84ch",
              }}
            >
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>basis for question</span>
              <p className="small dim60" style={{ marginTop: 5, lineHeight: 1.62 }}>{q.why}</p>
            </div>

            <div className="stack" style={{ gap: 8 }}>
              {q.prefilled ? (
                <>
                  <Row label="pre-filled">
                    <span className="mono-value">{q.prefilled}</span>
                  </Row>
                  <Row label="source">
                    <span className="dim60">{q.prefilledSource}</span>
                  </Row>
                </>
              ) : (
                <Row label="pre-filled">
                  <span className="dim60">
                    Nothing public supports an answer — left blank on purpose rather than guessed.
                  </span>
                </Row>
              )}
              {q.answer ? (
                <Row label="confirmed" tone="orange">
                  {q.answer}
                </Row>
              ) : null}
            </div>

            {q.options?.length ? (
              <div className="row wrap" style={{ gap: 7, marginTop: 12 }}>
                {q.options.map((o) => (
                  <span
                    key={o.value}
                    className="mono-label dim"
                    style={{
                      fontSize: 9,
                      padding: "3px 8px",
                      borderRadius: 4,
                      border: "1px solid var(--ink-10)",
                      textTransform: "none",
                      letterSpacing: "0.04em",
                    }}
                    title={o.implies ? `implies — ${o.implies}` : undefined}
                  >
                    {o.label}
                    {o.implies ? " ▸" : ""}
                  </span>
                ))}
              </div>
            ) : null}

            {q.unlocks?.length ? (
              <>
                <Hairline />
                <div className="row wrap" style={{ gap: 8, marginTop: 12, alignItems: "baseline" }}>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>unlocked</span>
                  {q.unlocks.map((u) => (
                    <Chip key={u} tone="info">
                      {u}
                    </Chip>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
