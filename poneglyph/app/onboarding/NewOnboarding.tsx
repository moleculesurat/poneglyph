"use client";

/* ══════════════════════════════════════════════════════════════════════
   NewOnboarding — the blank flow, for a firm that is not Angel One.

   The point of the ontology is that the same six steps run for any
   NSE/BSE entity and produce a DIFFERENT register, because the register
   is computed from the profile rather than read off a licence. Two modes:
   opinionated (the engine reads the public filings first and turns up
   knowing) and blank (the firm supplies everything, nothing inferred).

   Sandbox: resolution is disabled — the CTA fires the sandbox toast.
   ══════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { Chip, Cta, Hairline } from "@/components/ui";
import { useSandboxToast } from "@/components/toast";
import type { OnboardingStep } from "@/lib/schema";

type Mode = "opinionated" | "blank";

const MODE_COPY: Record<Mode, { title: string; body: string }> = {
  opinionated: {
    title: "Opinionated — resolve from public filings",
    body:
      "The engine resolves the name to a legal person, pulls the XBRL filings and exchange records, and arrives at the questionnaire already holding an answer for everything public. The human confirms or overrides; nothing public is retyped, and nothing unseen is guessed.",
  },
  blank: {
    title: "Blank — the firm supplies everything",
    body:
      "No inference. Every fact is entered and evidenced by the firm, and the profile carries no `derived` provenance at all. Slower, and correct for an unlisted or newly registered intermediary whose filings are not public.",
  },
};

export function NewOnboarding({ steps }: { steps: OnboardingStep[] }) {
  const toast = useSandboxToast();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("opinionated");

  const target = name.trim();

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row between wrap" style={{ gap: 14 }}>
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">New entity onboarding</span>
          <h2 className="display" style={{ fontSize: "clamp(20px, 2.1vw, 26px)", maxWidth: "26ch" }}>
            Onboarding template —{" "}
            <span className="accent grad">any registered intermediary</span>
          </h2>
        </div>
        <span className="mono-label dim" style={{ fontSize: 9.5, maxWidth: "34ch", textTransform: "none", letterSpacing: "0.04em" }}>
          The corpus is identical for every firm; the register is computed from the entity profile.
        </span>
      </div>

      <div className="grid cols-2" style={{ alignItems: "start", gap: 20 }}>
        <div className="stack" style={{ gap: 12 }}>
          <label className="mono-label dim" htmlFor="onb-entity" style={{ fontSize: 9.5 }}>
            Entity
          </label>
          <input
            id="onb-entity"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Legal name, ISIN or SEBI registration number"
            aria-label="Legal name, ISIN or SEBI registration number"
            style={{
              width: "100%",
              font: "inherit",
              fontSize: 14,
              padding: "12px 14px",
              borderRadius: 4,
              border: "1.5px solid var(--ink-20)",
              background: "var(--white)",
              color: "var(--ink)",
              outline: "none",
            }}
          />

          <div className="row wrap" style={{ gap: 8, marginTop: 2 }}>
            {(["opinionated", "blank"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                className="chip"
                data-tone={mode === m ? "live" : "info"}
                onClick={() => setMode(m)}
                style={{ cursor: "pointer" }}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="panel pad" style={{ padding: "14px 16px" }}>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>{MODE_COPY[mode].title}</span>
            <p className="small dim60" style={{ marginTop: 6, lineHeight: 1.6 }}>
              {MODE_COPY[mode].body}
            </p>
          </div>

          <div className="row wrap" style={{ gap: 12, marginTop: 2 }}>
            <Cta
              variant="orange"
              onClick={() =>
                toast(
                  target
                    ? `Sandbox — resolution disabled. "${target}" would enter the ${mode} flow.`
                    : "Sandbox — enter a legal name, ISIN or registration number first"
                )
              }
            >
              Resolve the entity
            </Cta>
            <span className="mono-label dim" style={{ fontSize: 9.5 }}>
              mode · {mode}
            </span>
          </div>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            What runs next — unchanged for every entity
          </span>
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }} className="stack">
            {steps.map((s, i) => (
              <li key={s.key}>
                <div className="row between wrap" style={{ gap: 10 }}>
                  <div className="row" style={{ gap: 10 }}>
                    <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="small" style={{ fontWeight: 600 }}>{s.title}</span>
                  </div>
                  <Chip tone="pending">{s.status}</Chip>
                </div>
                <p className="small dim60" style={{ marginTop: 4, lineHeight: 1.55, paddingLeft: 30 }}>
                  {s.blurb}
                </p>
                {i < steps.length - 1 ? <Hairline /> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
