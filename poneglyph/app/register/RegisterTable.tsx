"use client";

/* ══════════════════════════════════════════════════════════════════════
   Register table — every obligation on the register, filterable by
   SEBI Part / chapter / status / type. Each row expands into the full
   walk-back: Part → chapter → clause → control → evidence → run → hash,
   so an inspector can see which Part of the Master Circular an
   obligation descends from without leaving the table.

   Part is the top of the hierarchy: the Master Circular for Stock
   Brokers (SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2024/53) is organised into
   Parts I–X, chapters roll up into Parts, clauses sit inside chapters.
   The rollup and the labels come from `lib/domains.ts` — never redeclared
   here.

   Filters live in the URL (?part=&chapter=&status=&type=&id=) so
   dashboard heat-map cells, legend chips and pending-review chips
   deep-link into a pre-filtered view; ?id= also expands that row and
   scrolls to it. Invalid values degrade to `all`; an incoherent
   part+chapter pair drops the chapter and keeps the Part.
   ══════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KV, MarkedCard, StatusChip } from "@/components/ui";
import { apiCall, type StateResponse } from "@/app/live/api";
import { circulars } from "@/data/corpus";
import { obligations } from "@/data/obligations";
import { CHAPTER_LABEL, SEBI_DOMAINS, domainByPart, partLabel, partOf } from "@/lib/domains";
import { effectiveStatus } from "@/lib/schedule";
import type {
  ChapterKey,
  EvidenceArtifact,
  Obligation,
  ObligationStatus,
  ObligationType,
  SebiPart,
} from "@/lib/schema";
import { AttachEvidence } from "./AttachEvidence";
import { ClauseDrawer, HighlightedClause } from "./ClauseDrawer";

/* ── static lookups ───────────────────────────────────────────────────── */

const STATUS_LABEL: Record<ObligationStatus, string> = {
  met: "Met",
  "at-risk": "At risk",
  gap: "Gap",
  "pending-review": "Pending review",
  rejected: "Rejected",
};

const STATUSES: ObligationStatus[] = ["met", "at-risk", "gap", "pending-review"];
const TYPES: ObligationType[] = ["one-time", "ongoing", "periodic", "event-driven"];

/** canonical circular order — Part I first, chapters in the order the
    Master Circular's Table of Contents carries them */
const CHAPTER_ORDER: ChapterKey[] = SEBI_DOMAINS.flatMap((d) => d.chapters);

const CHAPTERS = CHAPTER_ORDER.filter((ch) =>
  obligations.some((o) => o.clause.chapter === ch)
);

/** every Part of the circular, with how much of the register descends
    from it — a Part carrying nothing is shown, not hidden: the gap in
    coverage is itself a finding */
const PART_ROWS = SEBI_DOMAINS.map((d) => ({
  part: d.part,
  title: d.title,
  count: obligations.filter((o) => partOf(o.clause.chapter) === d.part).length,
}));

const PARTS_MAPPED = PART_ROWS.filter((p) => p.count > 0).length;
const EMPTY_PARTS = PART_ROWS.filter((p) => p.count === 0).map((p) => p.part);

/** the empty rulebooks named rather than counted, so the legend reads as a
    statement about which rulebooks carry nothing and never as a bare number. */
const EMPTY_PARTS_LABEL =
  EMPTY_PARTS.length === 0
    ? ""
    : EMPTY_PARTS.length === 1
      ? partLabel(EMPTY_PARTS[0])
      : `${EMPTY_PARTS.slice(0, -1).map(partLabel).join(", ")} and ${partLabel(EMPTY_PARTS[EMPTY_PARTS.length - 1])}`;

const STATUS_COUNTS = obligations.reduce(
  (acc, o) => ((acc[o.status] = (acc[o.status] ?? 0) + 1), acc),
  {} as Record<ObligationStatus, number>
);

const isPart = (v: string | null): v is SebiPart =>
  v != null && SEBI_DOMAINS.some((d) => d.part === v);
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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [part, setPart] = useState<SebiPart | "all">(() => {
    const v = searchParams.get("part");
    return isPart(v) ? v : "all";
  });
  const [chapter, setChapter] = useState<ChapterKey | "all">(() => {
    const v = searchParams.get("chapter");
    if (!isChapter(v)) return "all";
    const p = searchParams.get("part");
    /* an incoherent pair (?part=IV&chapter=margin) keeps the Part and
       drops the chapter rather than showing an empty table */
    if (isPart(p) && partOf(v) !== p) return "all";
    return v;
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

  /* Live overlay from the worker: the register the app renders is static (the
     hydration must match), but once mounted we pull real state so a periodic
     duty proven for a past period re-opens as a gap, and freshly-bound evidence
     shows without a rebuild. On failure we keep the static register. */
  const [live, setLive] = useState<{
    byId: Map<string, Obligation>;
    evidence: EvidenceArtifact[];
    today: string;
  } | null>(null);
  const [liveError, setLiveError] = useState(false);

  const refresh = useCallback(() => {
    apiCall<StateResponse>("/api/state")
      .then((s) => {
        setLive({
          byId: new Map(s.obligations.map((o) => [o.id, o])),
          evidence: s.evidence,
          today: new Date().toISOString().slice(0, 10),
        });
        setLiveError(false);
      })
      .catch(() => {
        setLive(null);
        setLiveError(true);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* displayed status: the live-recomputed status once mounted, the static
     register's own status before that (so SSR and hydration agree) */
  const displayedStatus = useCallback(
    (o: Obligation): ObligationStatus => {
      if (!live) return o.status;
      const row = live.byId.get(o.id) ?? o;
      return effectiveStatus(row, live.evidence, live.today);
    },
    [live],
  );

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
    if (part !== "all") params.set("part", part);
    if (chapter !== "all") params.set("chapter", chapter);
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    if (expandedId) params.set("id", expandedId);
    const qs = params.toString();
    if (qs !== searchParams.toString()) {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [part, chapter, status, type, expandedId, pathname, router, searchParams]);

  /* selecting a Part narrows the chapter row to that Part's chapters, and
     clears a chapter that no longer belongs to the selection */
  const selectPart = (next: SebiPart | "all") => {
    setPart(next);
    if (next !== "all" && chapter !== "all" && partOf(chapter) !== next) setChapter("all");
  };
  /* selecting a chapter pins its Part, so the hierarchy on screen always
     reads Part → chapter and the shared URL carries both */
  const selectChapter = (next: ChapterKey | "all") => {
    setChapter(next);
    if (next !== "all") setPart(partOf(next));
  };

  const visibleChapters = useMemo(
    () => (part === "all" ? CHAPTERS : CHAPTERS.filter((ch) => partOf(ch) === part)),
    [part]
  );

  const rows = useMemo(
    () =>
      obligations.filter(
        (o) =>
          (part === "all" || partOf(o.clause.chapter) === part) &&
          (chapter === "all" || o.clause.chapter === chapter) &&
          (status === "all" || displayedStatus(o) === status) &&
          (type === "all" || o.type === type)
      ),
    [part, chapter, status, type, displayedStatus]
  );

  const filtersActive =
    part !== "all" || chapter !== "all" || status !== "all" || type !== "all";
  const reset = () => {
    setPart("all");
    setChapter("all");
    setStatus("all");
    setType("all");
  };

  const selectedDomain = part === "all" ? undefined : domainByPart(part);

  return (
    <>
      {/* ── filters ── */}
      <MarkedCard pad={18} style={{ marginBottom: 18 }}>
        <div className="stack" style={{ gap: 12 }}>
          <FilterRow label="rulebook">
            <FilterChip active={part === "all"} onClick={() => selectPart("all")}>
              All
            </FilterChip>
            {PART_ROWS.map((p) =>
              p.count > 0 ? (
                <FilterChip
                  key={p.part}
                  active={part === p.part}
                  onClick={() => selectPart(part === p.part ? "all" : p.part)}
                >
                  {partLabel(p.part)} · {p.count}
                </FilterChip>
              ) : (
                <span
                  key={p.part}
                  className="chip"
                  data-tone="pending"
                  title={`${p.title} — no obligation extracted from this rulebook in the current corpus`}
                  style={{ opacity: 0.5 }}
                >
                  {partLabel(p.part)} · 0
                </span>
              )
            )}
          </FilterRow>
          <div className="row" style={{ gap: 8, alignItems: "baseline" }}>
            <span className="mono-label dim" style={{ minWidth: 78, flex: "none" }} />
            <span className="small dim60" style={{ maxWidth: "82ch" }}>
              {selectedDomain ? (
                <>
                  <b>{partLabel(selectedDomain.part)}</b> · {selectedDomain.items} —{" "}
                  {selectedDomain.blurb}
                </>
              ) : (
                <>
                  {SEBI_DOMAINS.map((d) => d.title).join(" and ")}. {obligations.length}{" "}
                  obligations map across {PARTS_MAPPED} of the {PART_ROWS.length} rulebooks.
                  {EMPTY_PARTS_LABEL ? (
                    <>
                      {" "}
                      {EMPTY_PARTS_LABEL} carries no obligation yet.
                    </>
                  ) : null}
                </>
              )}
            </span>
          </div>
          <FilterRow label="chapter">
            <FilterChip active={chapter === "all"} onClick={() => setChapter("all")}>
              {part === "all" ? "All" : `All of ${partLabel(part)}`}
            </FilterChip>
            {visibleChapters.map((ch) => (
              <FilterChip
                key={ch}
                active={chapter === ch}
                onClick={() => selectChapter(chapter === ch ? "all" : ch)}
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

      {liveError ? (
        <div className="mono-label dim" style={{ marginBottom: 8, fontSize: 9.5 }}>
          live state unavailable — showing the last pulled register
        </div>
      ) : null}

      {/* ── table ── */}
      <MarkedCard pad={0} style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Obligation</th>
                <th>Chapter / Part</th>
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
                      o={live?.byId.get(o.id) ?? o}
                      status={displayedStatus(o)}
                      open={open}
                      onToggle={() => setExpandedId(open ? null : o.id)}
                      onViewClause={() => setClauseFor(o)}
                      onFilterPart={selectPart}
                      onFilterChapter={selectChapter}
                      onBound={refresh}
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
  status,
  open,
  onToggle,
  onViewClause,
  onFilterPart,
  onFilterChapter,
  onBound,
}: {
  o: Obligation;
  status: ObligationStatus;
  open: boolean;
  onToggle: () => void;
  onViewClause: () => void;
  onFilterPart: (part: SebiPart) => void;
  onFilterChapter: (chapter: ChapterKey) => void;
  onBound: () => void;
}) {
  const text = paraText(o);
  const chapterTitle = findChapter(o)?.title ?? CHAPTER_LABEL[o.clause.chapter];
  const part = partOf(o.clause.chapter);
  const domain = domainByPart(part);
  const attention = status !== "met";

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
          <div className="mono-label dim" style={{ fontSize: 9.5, marginTop: 3 }}>
            {partLabel(part)}
          </div>
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
          <StatusChip status={status} />
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

              {/* Part → chapter → clause: where this obligation descends from */}
              <div className="stack" style={{ gap: 8 }}>
                <span className="mono-label dim">Descends from</span>
                <div className="row wrap" style={{ gap: 8 }}>
                  <button
                    type="button"
                    className="chip"
                    data-tone="info"
                    onClick={() => onFilterPart(part)}
                    title={`Filter the register to ${partLabel(part)}`}
                    style={{ cursor: "pointer" }}
                  >
                    {partLabel(part)}
                  </button>
                  <span className="dim" aria-hidden>
                    →
                  </span>
                  <button
                    type="button"
                    className="chip"
                    data-tone="info"
                    onClick={() => onFilterChapter(o.clause.chapter)}
                    title={`Filter the register to ${CHAPTER_LABEL[o.clause.chapter]}`}
                    style={{ cursor: "pointer" }}
                  >
                    {CHAPTER_LABEL[o.clause.chapter]}
                  </button>
                  <span className="dim" aria-hidden>
                    →
                  </span>
                  <span className="chip" data-tone="info">
                    para {o.clause.para}
                  </span>
                </div>
                {domain ? (
                  <span className="small dim60" style={{ maxWidth: "82ch" }}>
                    <b>{partLabel(part)}</b> · {domain.items} — {domain.blurb}
                  </span>
                ) : null}
              </div>

              {/* grounding clause */}
              <div className="panel pad" style={{ padding: "18px 22px" }}>
                <div className="row between wrap" style={{ gap: 10 }}>
                  <span className="mono-label dim">
                    {o.clause.circularId} · {partLabel(part)} · {chapterTitle} · para {o.clause.para}
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

              {/* an approved duty can be proven from its own row */}
              {o.approvedBy ? (
                <div className="panel pad" style={{ padding: "18px 22px" }}>
                  <AttachEvidence obligationId={o.id} onBound={onBound} />
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
