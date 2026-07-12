"use client";

import { useState } from "react";
import Link from "next/link";
import { MarkedCard, Chip, StatusChip, KV } from "@/components/ui";
import { masterCircular, cuspaCircular, cuspaAmendment } from "@/data/corpus";
import { obligations } from "@/data/obligations";
import type { DiffBlock, Obligation } from "@/lib/schema";

/* ── lookups, all static ──────────────────────────────────────────────── */

const byId = new Map(obligations.map((o) => [o.id, o]));

const baseUntouched = obligations.filter(
  (o) => o.clause.circularId === "MC-SB-2025" && o.clause.chapter !== "unpaid-securities"
);
const untouchedBefore = baseUntouched.filter(
  (o) => o.clause.chapter === "registration" || o.clause.chapter === "client-dealings"
).length;
const untouchedAfter = baseUntouched.length - untouchedBefore;

const phaseFor = (d?: string) =>
  d === "2026-11-02" ? "phase 1" : d === "2027-01-03" ? "phase 2" : undefined;

/* ── pieces ───────────────────────────────────────────────────────────── */

function UnchangedBand({
  range,
  note,
  edge,
}: {
  range: string;
  note: string;
  edge: "top" | "bottom";
}) {
  return (
    <div
      className="row between wrap"
      style={{
        padding: "10px 22px",
        background: "var(--paper)",
        gap: 8,
        ...(edge === "top"
          ? { borderBottom: "1px solid var(--ink-05)" }
          : { borderTop: "1px solid var(--ink-05)" }),
      }}
    >
      <span className="mono-label diff-unchanged" style={{ fontSize: 9.5 }}>
        ··· {range} — unchanged
      </span>
      <span className="mono-label diff-unchanged" style={{ fontSize: 9.5 }}>
        {note}
      </span>
    </div>
  );
}

function ObligationCardlet({ o }: { o: Obligation }) {
  const phase = phaseFor(o.deadline);
  return (
    <div
      className="row between wrap"
      style={{ alignItems: "flex-start", gap: 18 }}
    >
      <div className="stack" style={{ gap: 6, flex: "1 1 300px", maxWidth: "58ch" }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <span className="mono-value" style={{ fontWeight: 600 }}>
            {o.id}
          </span>
          <StatusChip status={o.status} />
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {o.type}
            {o.frequency ? ` · ${o.frequency}` : ""}
          </span>
        </div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{o.title}</div>
        <div className="small dim60" style={{ lineHeight: 1.55 }}>
          {o.summary}
        </div>
      </div>

      <div className="stack" style={{ gap: 7, flex: "1 1 280px" }}>
        <KV k="Control">
          {o.control.name} · {o.control.owner}
        </KV>
        <KV k="Deadline">
          {o.deadline ? (
            <span className="mono-value">
              {o.deadline}
              {phase ? ` · ${phase}` : ""}
            </span>
          ) : (
            "—"
          )}
        </KV>
        <KV k="Evidence">
          {o.evidenceIds.length ? (
            <Link href="/evidence" className="mono-value" style={{ color: "var(--orange-deep)" }}>
              {o.evidenceIds.join(", ")} →
            </Link>
          ) : (
            <span style={{ color: "var(--orange-deep)" }}>none bound — open gap</span>
          )}
        </KV>
        <KV k="Approval">
          {o.approvedBy
            ? `mapping approved · ${o.approvedBy}`
            : "awaiting compliance-officer review"}
        </KV>
        <div className="row wrap" style={{ gap: 14, marginTop: 2 }}>
          <Link
            href="/register"
            className="mono-label"
            style={{ color: "var(--orange-deep)", fontSize: 9.5 }}
          >
            View in register →
          </Link>
          <Link href="/agents" className="mono-label dim" style={{ fontSize: 9.5 }}>
            RUN-047 trace →
          </Link>
        </div>
      </div>
    </div>
  );
}

function DeltaPanel({ block }: { block: DiffBlock }) {
  return (
    <div
      style={{
        background: "var(--paper)",
        borderTop: "1.5px dashed var(--ink-20)",
        padding: "16px 22px 20px",
      }}
    >
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        {block.kind === "modified" ? "Obligations re-mapped" : "Obligations created"} by this
        block · extraction agent · RUN-047
      </span>
      <div className="stack" style={{ gap: 16, marginTop: 12 }}>
        {block.deltaObligationIds.map((id) => {
          const o = byId.get(id);
          return o ? <ObligationCardlet key={id} o={o} /> : null;
        })}
      </div>
    </div>
  );
}

/* ── the redline ──────────────────────────────────────────────────────── */

export function Redline() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const allOpen = cuspaAmendment.changes.every((c) => open[c.para]);

  const toggle = (para: string) => setOpen((s) => ({ ...s, [para]: !s[para] }));
  const toggleAll = () =>
    setOpen(
      allOpen
        ? {}
        : Object.fromEntries(cuspaAmendment.changes.map((c) => [c.para, true]))
    );

  return (
    <section>
      <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
        <span className="eyebrow">Clause-level redline — para 46, side by side</span>
        <button
          className="mono-label"
          style={{ color: "var(--orange-deep)" }}
          onClick={toggleAll}
          aria-expanded={allOpen}
        >
          {allOpen ? "collapse all obligations" : "expand all obligations"} ▸
        </button>
      </div>

      <MarkedCard pad={0} style={{ overflow: "hidden" }}>
        {/* column headers */}
        <div
          className="grid cols-2"
          style={{
            padding: "13px 22px",
            background: "var(--paper)",
            borderBottom: "1.5px solid var(--ink-10)",
            gap: 16,
          }}
        >
          <span className="mono-label dim">
            Before · {masterCircular.id} — {masterCircular.title} · issued{" "}
            {masterCircular.issuedOn}
          </span>
          <span className="mono-label">
            After · {cuspaCircular.id} — CUSPA amendment · issued {cuspaCircular.issuedOn}
          </span>
        </div>

        <UnchangedBand
          edge="top"
          range="Paras 4.1 – 31.5 · Registration & Client Dealings"
          note={`${untouchedBefore} obligations untouched · evidence intact`}
        />

        {cuspaAmendment.changes.map((block, i) => {
          const isOpen = !!open[block.para];
          return (
            <div
              key={block.para}
              style={i === 0 ? undefined : { borderTop: "1px solid var(--ink-05)" }}
            >
              {/* block header — click to expand delta obligations */}
              <button
                onClick={() => toggle(block.para)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "16px 22px 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span className="row" style={{ gap: 10 }}>
                  <span className="mono-value" style={{ fontWeight: 600 }}>
                    Para {block.para}
                  </span>
                  <Chip tone="info">{block.kind}</Chip>
                </span>
                <span className="row wrap" style={{ gap: 10 }}>
                  {block.deltaObligationIds.map((id) => {
                    const o = byId.get(id);
                    return (
                      <span key={id} className="row" style={{ gap: 8 }}>
                        <span className="mono-label dim">→ {id}</span>
                        {o ? <StatusChip status={o.status} /> : null}
                      </span>
                    );
                  })}
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      color: "var(--ink-40)",
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    ▸
                  </span>
                </span>
              </button>

              {/* old ⇄ new */}
              <div
                className="grid cols-2"
                style={{ padding: "10px 22px 20px", gap: 16, alignItems: "stretch" }}
              >
                <div>
                  <span className="mono-label dim" style={{ fontSize: 9 }}>
                    before · {masterCircular.id}
                  </span>
                  {block.oldText ? (
                    <p className="clause-text diff-del" style={{ marginTop: 6, paddingRight: 8 }}>
                      {block.oldText}
                    </p>
                  ) : (
                    <p
                      className="clause-text diff-unchanged"
                      style={{ marginTop: 6, fontStyle: "italic" }}
                    >
                      No corresponding provision — inserted by the amendment.
                    </p>
                  )}
                </div>
                <div>
                  <span className="mono-label" style={{ fontSize: 9 }}>
                    after · {cuspaCircular.id}
                  </span>
                  {block.newText ? (
                    <div
                      className="diff-add"
                      style={{ marginTop: 6, padding: "12px 16px", borderRadius: "0 4px 4px 0" }}
                    >
                      <p className="clause-text">{block.newText}</p>
                    </div>
                  ) : (
                    <p
                      className="clause-text diff-unchanged"
                      style={{ marginTop: 6, fontStyle: "italic" }}
                    >
                      Provision deleted by the amendment.
                    </p>
                  )}
                </div>
              </div>

              {isOpen ? <DeltaPanel block={block} /> : null}
            </div>
          );
        })}

        <UnchangedBand
          edge="bottom"
          range="Paras 52.1 – 103.2 · Margin through Cyber (CSCRF)"
          note={`${untouchedAfter} obligations untouched · evidence intact`}
        />
      </MarkedCard>
    </section>
  );
}
