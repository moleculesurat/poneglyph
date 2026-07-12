"use client";

/* ══════════════════════════════════════════════════════════════════════
   Clause drawer — renders the full chapter of the cited circular from
   data/corpus, with the cited para framed and the grounded excerpt
   highlighted. Opened from any register row's "read in context".
   ══════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { Chip } from "@/components/ui";
import { circulars } from "@/data/corpus";
import type { Obligation } from "@/lib/schema";

/** Render clause text with the grounded excerpt wrapped in .clause-hl.
 *  Prefers an exact substring match; falls back to the recorded char
 *  offsets; degrades to the bare excerpt if neither resolves. */
export function HighlightedClause({
  text,
  excerpt,
  charStart,
  charEnd,
}: {
  text: string;
  excerpt: string;
  charStart: number;
  charEnd: number;
}) {
  let start = text.indexOf(excerpt);
  let end = start + excerpt.length;
  if (start < 0) {
    if (charStart >= 0 && charEnd > charStart && charEnd <= text.length) {
      start = charStart;
      end = charEnd;
    } else {
      return <span className="clause-hl">{excerpt}</span>;
    }
  }
  return (
    <>
      {text.slice(0, start)}
      <span className="clause-hl">{text.slice(start, end)}</span>
      {text.slice(end)}
    </>
  );
}

export function ClauseDrawer({
  obligation,
  onClose,
}: {
  obligation: Obligation | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!obligation) return;
    document.body.style.overflow = "hidden";
    panelRef.current
      ?.querySelector("[data-cited]")
      ?.scrollIntoView({ block: "center" });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [obligation, onClose]);

  if (!obligation) return null;

  const { clause } = obligation;
  const circ = circulars.find((c) => c.id === clause.circularId);
  const chapter = circ?.chapters.find((ch) => ch.key === clause.chapter);
  if (!circ || !chapter) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Clause context — ${clause.circularId} para ${clause.para}`}
    >
      <style>{`
        @keyframes pg-drawer-in { from { transform: translateX(26px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes pg-fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 80,
          background: "var(--ink-40)",
          animation: "pg-fade-in 0.18s ease",
        }}
      />

      <aside
        ref={panelRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(640px, 94vw)",
          zIndex: 81,
          background: "var(--white)",
          borderLeft: "1.5px solid var(--ink-20)",
          boxShadow: "-30px 0 70px -30px var(--ink-40)",
          overflowY: "auto",
          animation: "pg-drawer-in 0.22s ease",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            background: "var(--white)",
            borderBottom: "1.5px solid var(--ink-10)",
            padding: "18px 28px 16px",
          }}
        >
          <div className="row between">
            <span className="eyebrow">Source corpus</span>
            <button
              type="button"
              className="chip"
              data-tone="info"
              onClick={onClose}
              style={{ cursor: "pointer" }}
            >
              ✕ close
            </button>
          </div>
          <div className="display" style={{ fontSize: 21, marginTop: 10, maxWidth: "44ch" }}>
            {circ.title}
          </div>
          <div className="mono-label dim" style={{ marginTop: 8 }}>
            {circ.number} · issued {circ.issuedOn} · {circ.kind}
          </div>
        </header>

        <div style={{ padding: "22px 28px 36px" }}>
          <div className="row between wrap" style={{ marginBottom: 14 }}>
            <span className="mono-label">{chapter.title}</span>
            <Chip tone="at-risk">
              cited · para {clause.para}
            </Chip>
          </div>

          <div className="stack" style={{ gap: 4 }}>
            {chapter.paras.map((p) => {
              const cited = p.para === clause.para;
              return (
                <div
                  key={p.para}
                  data-cited={cited || undefined}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 14,
                    padding: "13px 16px",
                    borderLeft: cited
                      ? "3px solid var(--orange)"
                      : "3px solid transparent",
                    background: cited ? "var(--orange-soft)" : "transparent",
                    borderRadius: cited ? "0 8px 8px 0" : 0,
                  }}
                >
                  <span
                    className="mono-label dim"
                    style={{ minWidth: 48, flex: "none" }}
                  >
                    {p.para}
                  </span>
                  <p className="clause-text" style={{ maxWidth: "68ch" }}>
                    {cited ? (
                      <HighlightedClause
                        text={p.text}
                        excerpt={clause.excerpt}
                        charStart={clause.charStart}
                        charEnd={clause.charEnd}
                      />
                    ) : (
                      p.text
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="small dim60" style={{ marginTop: 22, maxWidth: "72ch" }}>
            {`Grounding — ${obligation.id} (${obligation.title}) is extracted from para ${clause.para} above. The highlighted span is the verbatim excerpt the extraction agent pinned; the register entry hashes to ${obligation.hash}.`}
          </p>
          <p className="mono-label dim" style={{ marginTop: 12 }}>
            Sandbox corpus — realistic paraphrase of public SEBI material
          </p>
        </div>
      </aside>
    </div>
  );
}
