"use client";

import { useState } from "react";
import Link from "next/link";
import { Chip, KV, MarkedCard, StatusChip, TaskChip } from "@/components/ui";
import { tasks } from "@/data/tasks";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import type { Obligation, RemediationTask, TaskStatus } from "@/lib/schema";

/* ── derived, all from static data (sim-today pinned) ─────────────────── */

const DAY = 86_400_000;
const T0 = Date.parse(tenant.simToday);

const oblById = new Map<string, Obligation>(obligations.map((o) => [o.id, o]));
const initialsByName = new Map(tenant.team.map((m) => [m.name, m.initials]));

const byDue = [...tasks].sort((a, b) => a.due.localeCompare(b.due));

const daysOut = (due: string) => Math.round((Date.parse(due) - T0) / DAY);
const isOverdue = (t: RemediationTask) =>
  t.status === "overdue" || t.due < tenant.simToday;

/* clause chain target: CUSPA clauses live in the redline, the rest in the register */
const clauseHref = (o: Obligation) =>
  o.clause.circularId === "CIRC-CUSPA-2026" ? "/amendments" : "/register";

const COLUMN_ORDER: { status: TaskStatus; label: string }[] = [
  { status: "overdue", label: "Overdue" },
  { status: "open", label: "Open" },
  { status: "in-progress", label: "In progress" },
  { status: "done", label: "Done" },
];

/* ── atoms ────────────────────────────────────────────────────────────── */

function OwnerBadge({ name }: { name: string }) {
  return (
    <span className="row" style={{ gap: 8 }} title={name}>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          flex: "none",
          background: "var(--neutral)",
          border: "1.5px solid var(--ink-20)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--mono)",
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: "var(--ink)",
        }}
      >
        {initialsByName.get(name) ?? name.slice(0, 2).toUpperCase()}
      </span>
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        {name}
      </span>
    </span>
  );
}

function DueLabel({ t }: { t: RemediationTask }) {
  const d = daysOut(t.due);
  const overdue = isOverdue(t);
  return (
    <span
      className="mono-label tnum"
      style={
        overdue
          ? { color: "var(--orange-deep)", fontWeight: 600 }
          : { color: "var(--ink-40)" }
      }
    >
      due {t.due} · {overdue ? `${Math.abs(d)}d overdue` : `in ${d}d`}
    </span>
  );
}

function PriorityChip({ p }: { p: RemediationTask["priority"] }) {
  return <Chip tone={p === "high" ? "met" : "info"}>{p} priority</Chip>;
}

/* the walk-back: task ← obligation ← clause */
function Chain({ t, o }: { t: RemediationTask; o?: Obligation }) {
  if (!o) return <span className="mono-label dim">{t.id}</span>;
  return (
    <div className="row wrap" style={{ gap: 8 }}>
      <span className="mono-label">{t.id}</span>
      <span className="mono-label dim">←</span>
      <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)" }}>
        {o.id}
      </Link>
      <span className="mono-label dim">←</span>
      <Link href={clauseHref(o)} className="mono-label" style={{ color: "var(--orange-deep)" }}>
        clause {o.clause.para}
      </Link>
    </div>
  );
}

function TaskDetails({ t, o }: { t: RemediationTask; o?: Obligation }) {
  return (
    <details>
      <summary className="mono-label dim" style={{ cursor: "pointer" }}>
        what this closes ▸
      </summary>
      <div className="stack" style={{ gap: 10, marginTop: 12 }}>
        <p className="small dim60" style={{ lineHeight: 1.6, maxWidth: "68ch" }}>
          {t.description}
        </p>
        {o ? (
          <>
            <KV k="obligation">
              <Link href="/register" style={{ textDecoration: "underline" }}>
                {o.id}
              </Link>{" "}
              — {o.title} <StatusChip status={o.status} />
            </KV>
            <KV k="clause">
              <Link href={clauseHref(o)} style={{ textDecoration: "underline" }}>
                para {o.clause.para}
              </Link>{" "}
              · {o.clause.circularId}
            </KV>
            <KV k="evidence spec">
              {o.evidenceSpec.map((s) => s.description).join(" · ")}
            </KV>
          </>
        ) : null}
        <KV k="raised by">
          <Link href="/agents" style={{ textDecoration: "underline" }}>
            {t.createdByRun}
          </Link>
          {t.createdByRun === "RUN-047" ? " — the CUSPA amendment pipeline, 9 days ago" : ""}
        </KV>
      </div>
    </details>
  );
}

/* ── cards ────────────────────────────────────────────────────────────── */

function ListCard({ t }: { t: RemediationTask }) {
  const o = oblById.get(t.obligationId);
  return (
    <MarkedCard pad={20}>
      <div className="stack" style={{ gap: 10 }}>
        <div className="row between wrap" style={{ gap: 10 }}>
          <div className="row wrap" style={{ gap: 10 }}>
            <TaskChip status={t.status} />
            <PriorityChip p={t.priority} />
          </div>
          <div className="row wrap" style={{ gap: 14 }}>
            <OwnerBadge name={t.owner} />
            <DueLabel t={t} />
          </div>
        </div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{t.title}</div>
        <Chain t={t} o={o} />
        <TaskDetails t={t} o={o} />
      </div>
    </MarkedCard>
  );
}

function BoardCard({ t }: { t: RemediationTask }) {
  const o = oblById.get(t.obligationId);
  return (
    <div className="panel" style={{ padding: "16px 18px" }}>
      <div className="stack" style={{ gap: 9 }}>
        <div className="row between wrap" style={{ gap: 8 }}>
          <PriorityChip p={t.priority} />
          <OwnerBadge name={t.owner} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.4 }}>{t.title}</div>
        <Chain t={t} o={o} />
        <DueLabel t={t} />
        <TaskDetails t={t} o={o} />
      </div>
    </div>
  );
}

/* ── board ────────────────────────────────────────────────────────────── */

export function TaskBoard() {
  const [view, setView] = useState<"list" | "kanban">("list");

  const columns = COLUMN_ORDER.filter(
    (c) =>
      c.status === "open" ||
      c.status === "in-progress" ||
      c.status === "done" ||
      byDue.some((t) => t.status === c.status)
  );

  return (
    <section style={{ marginBottom: 36 }}>
      <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
        <span className="eyebrow">The queue — {tasks.length} tasks, none floating free</span>
        <div className="row" style={{ gap: 8 }}>
          {(["list", "kanban"] as const).map((v) => (
            <button
              key={v}
              className="chip"
              data-tone={view === v ? "live" : "info"}
              onClick={() => setView(v)}
              style={{ cursor: "pointer", fontFamily: "var(--mono)" }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <div className="stack" style={{ gap: 20 }}>
          {byDue.map((t) => (
            <ListCard key={t.id} t={t} />
          ))}
        </div>
      ) : (
        <div className="grid cols-3" style={{ alignItems: "start" }}>
          {columns.map((col) => {
            const rows = byDue.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="stack" style={{ gap: 12 }}>
                <div className="row between">
                  <span className="mono-label dim">{col.label}</span>
                  <span className="mono-label dim tnum">{rows.length}</span>
                </div>
                {rows.length > 0 ? (
                  rows.map((t) => <BoardCard key={t.id} t={t} />)
                ) : (
                  <div
                    style={{
                      border: "2px dashed var(--ink-20)",
                      borderRadius: "var(--radius-card)",
                      padding: "18px 16px",
                    }}
                  >
                    <span className="small dim60">
                      Nothing closed yet — the CUSPA queue opened 2026-07-03. First closure
                      expected with the depository filing due 2026-08-15.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
