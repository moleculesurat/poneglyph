"use client";

/* ══════════════════════════════════════════════════════════════════════
   Register table — all 33 obligations, filterable by chapter / status /
   type; each row expands into the full walk-back: summary → clause
   excerpt → control → evidence → run → hash. Broker persona gets the
   human-gate approve/reject pair on pending-review rows.

   Filters live in the URL (?chapter=&status=&type=&id=) so dashboard
   heat-map cells, legend chips and pending-review chips deep-link into a
   pre-filtered view; ?id= also expands that row and scrolls to it.
   ══════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Cta, KV, MarkedCard, StatusChip } from "@/components/ui";
import { usePersona } from "@/components/persona";
import { circulars } from "@/data/corpus";
import { obligations } from "@/data/obligations";
import type {
  ChapterKey,
  Obligation,
  ObligationStatus,
  ObligationType,
} from "@/lib/schema";
import { ClauseDrawer, HighlightedClause } from "./ClauseDrawer";

/* ── static lookups ───────────────────────────────────────────────────── */

const CHAPTER_LABEL: Record<ChapterKey, string> = {
  registration: "Registration",
  "client-dealings": "Client dealings",
  "unpaid-securities": "Unpaid securities",
  margin: "Margin",
  supervision: "Supervision",
  grievance: "Grievance",
  "books-records": "Books & records",
  advertisement: "Advertisement",
  cyber: "Cyber (CSCRF)",
};

const STATUS_LABEL: Record<ObligationStatus, string> = {
  met: "Met",
  "at-risk": "At risk",
  gap: "Gap",
  "pending-review": "Pending review",
};

const STATUSES: ObligationStatus[] = ["met", "at-risk", "gap", "pending-review"];
const TYPES: ObligationType[] = ["one-time", "ongoing", "periodic", "event-driven"];

const CHAPTERS = [...new Set(obligations.map((o) => o.clause.chapter))];

const STATUS_COUNTS = obligations.reduce(
  (acc, o) => ((acc[o.status] = (acc[o.status] ?? 0) + 1), acc),
  {} as Record<ObligationStatus, number>
);

const isChapter = (v: string | null): v is ChapterKey => v != null && v in CHAPTER_LABEL;
const isStatus = (v: string | null): v is ObligationStatus =>
  v != null && (STATUSES as string[]).includes(v);
const isType = (v: string | null): v is ObligationType =>
  v != null && (TYPES as string[]).includes(v);
const isObligationId = (v: string | null): v is string =>
  v != null && obligations.some((o) => o.id === v);

function findChapter(o: Obligation) {
  const circ = circulars.find((c) => c.id === o.clause.circularId);
  return circ?.chapters.find((ch) => ch.key === o.clause.chapter);
}

function paraText(o: Obligation) {
  return findChapter(o)?.paras.find((p) => p.para === o.clause.para)?.text;
}

/* ── filter chip ──────────────────────────────────────────────────────── */

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
      aria-pressed={active}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
      <span className="mono-label dim" style={{ minWidth: 78, flex: "none" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

/* ── main component ───────────────────────────────────────────────────── */

export function RegisterTable() {
  const { persona } = usePersona();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [chapter, setChapter] = useState<ChapterKey | "all">(() => {
    const v = searchParams.get("chapter");
    return isChapter(v) ? v : "all";
  });
  const [status, setStatus] = useState<ObligationStatus | "all">(() => {
    const v = searchParams.get("status");
    return isStatus(v) ? v : "all";
  });
  const [type, setType] = useState<ObligationType | "all">(() => {
    const v = searchParams.get("type");
    return isType(v) ? v : "all";
  });
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    const v = searchParams.get("id");
    return isObligationId(v) ? v : null;
  });
  const [clauseFor, setClauseFor] = useState<Obligation | null>(null);

  /* deep-link landing: scroll the ?id= row into view once, post-hydration */
  useEffect(() => {
    const target = searchParams.get("id");
    if (!isObligationId(target)) return;
    const raf = requestAnimationFrame(() => {
      document
        .getElementById(`obl-${target}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
    // mount-only: this is the landing scroll, not a follow-the-expand scroll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keep the URL in step with the filters, so any view is shareable */
  useEffect(() => {
    const params = new URLSearchParams();
    if (chapter !== "all") params.set("chapter", chapter);
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    if (expandedId) params.set("id", expandedId);
    const qs = params.toString();
    if (qs !== searchParams.toString()) {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [chapter, status, type, expandedId, pathname, router, searchParams]);

  const rows = useMemo(
    () =>
      obligations.filter(
        (o) =>
          (chapter === "all" || o.clause.chapter === chapter) &&
          (status === "all" || o.status === status) &&
          (type === "all" || o.type === type)
      ),
    [chapter, status, type]
  );

  const filtersActive = chapter !== "all" || status !== "all" || type !== "all";
  const reset = () => {
    setChapter("all");
    setStatus("all");
    setType("all");
  };

  return (
    <>
      {/* ── filters ── */}
      <MarkedCard pad={18} style={{ marginBottom: 18 }}>
        <div className="stack" style={{ gap: 12 }}>
          <FilterRow label="chapter">
            <FilterChip active={chapter === "all"} onClick={() => setChapter("all")}>
              All
            </FilterChip>
            {CHAPTERS.map((ch) => (
              <FilterChip
                key={ch}
                active={chapter === ch}
                onClick={() => setChapter(chapter === ch ? "all" : ch)}
              >
                {CHAPTER_LABEL[ch]}
              </FilterChip>
            ))}
          </FilterRow>
          <FilterRow label="status">
            <FilterChip active={status === "all"} onClick={() => setStatus("all")}>
              All
            </FilterChip>
            {STATUSES.map((s) => (
              <FilterChip
                key={s}
                active={status === s}
                onClick={() => setStatus(status === s ? "all" : s)}
              >
                {STATUS_LABEL[s]} · {STATUS_COUNTS[s] ?? 0}
              </FilterChip>
            ))}
          </FilterRow>
          <FilterRow label="type">
            <FilterChip active={type === "all"} onClick={() => setType("all")}>
              All
            </FilterChip>
            {TYPES.map((t) => (
              <FilterChip
                key={t}
                active={type === t}
                onClick={() => setType(type === t ? "all" : t)}
              >
                {t}
              </FilterChip>
            ))}
          </FilterRow>
        </div>
      </MarkedCard>

      {/* ── result count ── */}
      <div className="row between" style={{ marginBottom: 10 }}>
        <span className="mono-label dim">
          showing {rows.length} of {obligations.length} obligations
        </span>
        {filtersActive ? (
          <button
            type="button"
            className="mono-label"
            onClick={reset}
            style={{ color: "var(--orange-deep)", cursor: "pointer" }}
          >
            reset filters ✕
          </button>
        ) : (
          <span className="mono-label dim">click a row for the walk-back</span>
        )}
      </div>

      {/* ── table ── */}
      <MarkedCard pad={0} style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Obligation</th>
                <th>Chapter</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "34px 24px", textAlign: "center" }}>
                    <span className="small dim60">
                      No obligations match the current filters.
                    </span>{" "}
                    <button
                      type="button"
                      className="mono-label"
                      onClick={reset}
                      style={{ color: "var(--orange-deep)", cursor: "pointer" }}
                    >
                      reset ✕
                    </button>
                  </td>
                </tr>
              ) : (
                rows.map((o) => {
                  const open = expandedId === o.id;
                  return (
                    <RegisterRow
                      key={o.id}
                      o={o}
                      open={open}
                      persona={persona}
                      onToggle={() => setExpandedId(open ? null : o.id)}
                      onViewClause={() => setClauseFor(o)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </MarkedCard>

      <ClauseDrawer obligation={clauseFor} onClose={() => setClauseFor(null)} />
    </>
  );
}

/* ── row + expandable detail ──────────────────────────────────────────── */

function RegisterRow({
  o,
  open,
  persona,
  onToggle,
  onViewClause,
}: {
  o: Obligation;
  open: boolean;
  persona: "broker" | "inspector";
  onToggle: () => void;
  onViewClause: () => void;
}) {
  const text = paraText(o);
  const chapterTitle = findChapter(o)?.title ?? CHAPTER_LABEL[o.clause.chapter];
  const attention = o.status !== "met";

  return (
    <>
      <tr
        id={`obl-${o.id}`}
        className="clickable"
        onClick={onToggle}
        aria-expanded={open}
        style={open ? { background: "var(--paper)" } : undefined}
      >
        <td style={{ whiteSpace: "nowrap" }}>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              marginRight: 8,
              color: "var(--ink-40)",
              transition: "transform 0.15s ease",
              transform: open ? "rotate(90deg)" : "none",
            }}
          >
            ▸
          </span>
          <span className="mono-value">{o.id}</span>
        </td>
        <td>
          <div style={{ fontWeight: 500, maxWidth: "42ch" }}>{o.title}</div>
          <div className="mono-label dim" style={{ fontSize: 9.5, marginTop: 3 }}>
            {o.clause.circularId} · para {o.clause.para}
          </div>
        </td>
        <td>
          <span className="small dim60">{CHAPTER_LABEL[o.clause.chapter]}</span>
        </td>
        <td>
          <span className="mono-label">{o.type}</span>
          {o.frequency ? (
            <div className="mono-label dim" style={{ fontSize: 9.5, marginTop: 3 }}>
              {o.frequency}
            </div>
          ) : null}
        </td>
        <td>
          <span className="small">{o.control.owner}</span>
        </td>
        <td>
          <span
            className="mono-value"
            style={attention && o.deadline ? { color: "var(--orange-deep)" } : undefined}
          >
            {o.deadline ?? "—"}
          </span>
        </td>
        <td>
          <StatusChip status={o.status} />
        </td>
      </tr>

      {open ? (
        <tr>
          <td
            colSpan={7}
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--paper)", padding: "22px 26px 26px", cursor: "default" }}
          >
            <div className="stack" style={{ gap: 18 }}>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: "82ch" }}>{o.summary}</p>

              {/* grounding clause */}
              <div className="panel pad" style={{ padding: "18px 22px" }}>
                <div className="row between wrap" style={{ gap: 10 }}>
                  <span className="mono-label dim">
                    {o.clause.circularId} · {chapterTitle} · para {o.clause.para}
                  </span>
                  <button
                    type="button"
                    className="mono-label"
                    onClick={onViewClause}
                    style={{ color: "var(--orange-deep)", cursor: "pointer" }}
                  >
                    read in context →
                  </button>
                </div>
                <blockquote className="clause-text" style={{ marginTop: 12, maxWidth: "82ch" }}>
                  {text ? (
                    <HighlightedClause
                      text={text}
                      excerpt={o.clause.excerpt}
                      charStart={o.clause.charStart}
                      charEnd={o.clause.charEnd}
                    />
                  ) : (
                    <span className="clause-hl">{o.clause.excerpt}</span>
                  )}
                </blockquote>
              </div>

              {/* walk-back detail */}
              <div className="grid cols-2" style={{ gap: 14, alignItems: "start" }}>
                <div className="stack" style={{ gap: 10 }}>
                  <KV k="Control">
                    <span className="mono-value">{o.control.id}</span> — {o.control.name}
                    <span className="dim60" style={{ display: "block", marginTop: 3 }}>
                      {o.control.description}
                    </span>
                  </KV>
                  <KV k="Control owner">{o.control.owner}</KV>
                  <KV k="Evidence spec">
                    {o.evidenceSpec.map((s, i) => (
                      <span key={i} style={{ display: "block" }}>
                        <span className="mono-value dim60">{s.kind}</span> — {s.description}
                      </span>
                    ))}
                  </KV>
                </div>
                <div className="stack" style={{ gap: 10 }}>
                  <KV k="Bound evidence">
                    {o.evidenceIds.length > 0 ? (
                      <span className="row wrap" style={{ gap: 10 }}>
                        {o.evidenceIds.map((ev) => (
                          <Link
                            key={ev}
                            href="/evidence"
                            className="mono-value"
                            style={{ color: "var(--orange-deep)" }}
                          >
                            {ev} →
                          </Link>
                        ))}
                      </span>
                    ) : (
                      <Link href="/remediation" style={{ color: "var(--orange-deep)" }}>
                        none bound — open gap, see remediation queue →
                      </Link>
                    )}
                  </KV>
                  <KV k="Created by run">
                    <Link
                      href="/agents"
                      className="mono-value"
                      style={{ color: "var(--orange-deep)" }}
                    >
                      {o.createdByRun} →
                    </Link>
                  </KV>
                  <KV k="Human gate">
                    {o.approvedBy ? (
                      <>
                        approved · {o.approvedBy}
                      </>
                    ) : (
                      <span className="dim60">awaiting compliance-officer approval</span>
                    )}
                  </KV>
                  <KV k="Register hash">
                    <span className="hash">{o.hash}</span>
                  </KV>
                </div>
              </div>

              {/* human gate — broker only */}
              {o.status === "pending-review" ? (
                persona === "broker" ? (
                  <div className="row wrap" style={{ gap: 12 }}>
                    <Cta
                      variant="orange"
                      toastMsg="Sandbox — human-gate approvals are disabled in the demo"
                    >
                      Approve mapping
                    </Cta>
                    <Cta
                      variant="ghost"
                      toastMsg="Sandbox — human-gate rejections are disabled in the demo"
                    >
                      Reject to agent
                    </Cta>
                    <span className="small dim60">
                      {`The decision is appended to the audit chain with the officer's identity.`}
                    </span>
                  </div>
                ) : (
                  <span className="mono-label dim">
                    pending human gate — approval reserved for the intermediary
                  </span>
                )
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
