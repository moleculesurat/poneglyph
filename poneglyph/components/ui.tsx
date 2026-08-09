"use client";

/* ══════════════════════════════════════════════════════════════════════
   Shared UI kit — compose these; avoid inventing new visual language.
   Styling comes from globals.css classes; these are thin wrappers.
   ══════════════════════════════════════════════════════════════════════ */

import type { CSSProperties, ReactNode } from "react";
import { useSandboxToast } from "@/components/toast";
import type { ObligationStatus, TaskStatus } from "@/lib/schema";

/* Marked card — bordered card with orange plus-mark corners (site motif) */
export function MarkedCard({
  children,
  pad = 22,
  style,
  className = "",
}: {
  children: ReactNode;
  pad?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div className={`marked-card ${className}`} style={{ padding: pad, ...style }}>
      <span className="pm" data-c="tl" />
      <span className="pm" data-c="tr" />
      <span className="pm" data-c="bl" />
      <span className="pm" data-c="br" />
      {children}
    </div>
  );
}

/* Eyebrow — orange-dash section label */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

/* Page header: eyebrow + serif display title (+ optional right slot) */
export function PageHead({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="page-head">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="row">
        <h1 className="display page-title">{title}</h1>
        {right}
      </div>
      {sub ? <p className="sub" style={{ maxWidth: "72ch" }}>{sub}</p> : null}
    </header>
  );
}

/* Status chip — the only place color carries meaning (orange = attention) */
const STATUS_LABEL: Record<ObligationStatus, string> = {
  met: "Met",
  gap: "Gap",
  "at-risk": "At risk",
  "pending-review": "Pending review",
  rejected: "Rejected",
};
export function StatusChip({ status }: { status: ObligationStatus }) {
  const tone = status === "pending-review" ? "pending" : status;
  return (
    <span className="chip" data-tone={tone}>
      {status === "gap" ? <span className="dot" data-pulse /> : null}
      {STATUS_LABEL[status]}
    </span>
  );
}

const TASK_TONE: Record<TaskStatus, string> = {
  open: "at-risk",
  "in-progress": "info",
  done: "met",
  overdue: "gap",
};
export function TaskChip({ status }: { status: TaskStatus }) {
  return (
    <span className="chip" data-tone={TASK_TONE[status]}>
      {status.replace("-", " ")}
    </span>
  );
}

export function Chip({
  tone = "info",
  children,
}: {
  tone?: "met" | "gap" | "at-risk" | "pending" | "info" | "live";
  children: ReactNode;
}) {
  return (
    <span className="chip" data-tone={tone}>
      {children}
    </span>
  );
}

/* Stat tile — big serif number over mono label */
export function StatTile({
  label,
  value,
  accent = false,
  hint,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <MarkedCard pad={20}>
      <div className="stack" style={{ gap: 8 }}>
        <span className={`stat-number${accent ? " grad" : ""}`}>{value}</span>
        <span className="mono-label dim">{label}</span>
        {hint ? <span className="small dim60">{hint}</span> : null}
      </div>
    </MarkedCard>
  );
}

/* CTA — signature chip; sandbox-disabled by default (fires toast) */
export function Cta({
  children,
  variant,
  onClick,
  toastMsg,
}: {
  children: ReactNode;
  variant?: "orange" | "ghost";
  onClick?: () => void;
  toastMsg?: string;
}) {
  const toast = useSandboxToast();
  return (
    <button
      className="cta"
      data-variant={variant}
      onClick={onClick ?? (() => toast(toastMsg))}
    >
      {children} <span className="arrow">→</span>
    </button>
  );
}

/* Hairline divider */
export function Hairline({ dashed }: { dashed?: boolean }) {
  return <hr className="hairline" data-dashed={dashed ? "" : undefined} />;
}

/* Mono key→value line, used in expandable detail panes */
export function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="row" style={{ alignItems: "baseline", gap: 14 }}>
      <span className="mono-label dim" style={{ minWidth: 132, flex: "none" }}>
        {k}
      </span>
      <span className="small" style={{ lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}
