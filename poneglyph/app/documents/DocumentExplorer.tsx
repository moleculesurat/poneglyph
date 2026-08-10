"use client";

/* ══════════════════════════════════════════════════════════════════════
   The requirement matrix — 28 asks in circular order (Part I → X), each
   carrying the profile fact that triggered it and the clause behind it.
   Expanding a row opens the supplied document: provenance, validity, and
   the extracted fields with confidence and locator. Anything the parser
   read below 0.75 is shown as read and flagged, never quietly averaged
   away.

   Filters live in the URL (?part=&category=&status=&req=) so onboarding,
   the register and the inspector session can deep-link a filtered view;
   ?req= expands that requirement and scrolls to it.
   ══════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Chip, Cta, Hairline, KV, MarkedCard } from "@/components/ui";
import { usePersona } from "@/components/persona";
import { documentRequirements } from "@/data/documents";
import { partLabel } from "@/lib/domains";
import type {
  CompanyDocument,
  DocumentCategory,
  DocumentRequirement,
  DocumentStatus,
  ExtractedField,
  SebiPart,
} from "@/lib/schema";
import {
  CATEGORIES_PRESENT,
  CATEGORY_COUNTS,
  CATEGORY_LABEL,
  DOC_STATUSES,
  OBL,
  PARTS_PRESENT,
  PART_COUNTS,
  REVIEW_THRESHOLD,
  STATUS_COUNTS,
  STATUS_HINT,
  STATUS_LABEL,
  STATUS_TONE,
  docFor,
  fmtStamp,
  hasLapsed,
  lowCount,
  statusOf,
  validityNote,
} from "./shared";

/* ── URL param validation ─────────────────────────────────────────────── */

const isPart = (v: string | null): v is SebiPart =>
  v != null && (PARTS_PRESENT as string[]).includes(v);
const isCategory = (v: string | null): v is DocumentCategory =>
  v != null && (CATEGORIES_PRESENT as string[]).includes(v);
const isStatus = (v: string | null): v is DocumentStatus =>
  v != null && (DOC_STATUSES as string[]).includes(v);
const isReqId = (v: string | null): v is string =>
  v != null && documentRequirements.some((r) => r.id === v);

/* ── small pieces ─────────────────────────────────────────────────────── */

export function DocStatusChip({ status }: { status: DocumentStatus }) {
  return (
    <span className="chip" data-tone={STATUS_TONE[status]}>
      {status === "required" ? <span className="dot" data-pulse /> : null}
      {STATUS_LABEL[status]}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="chip"
      data-tone={active ? "live" : "info"}
      aria-pressed={active}
      title={title}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
      <span className="mono-label dim" style={{ minWidth: 78, flex: "none" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function Meter({ v, low }: { v: number; low: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 44,
        height: 5,
        borderRadius: 3,
        background: "var(--ink-10)",
        overflow: "hidden",
        flex: "none",
      }}
    >
      <span
        style={{
          display: "block",
          height: "100%",
          width: `${Math.round(v * 100)}%`,
          background: low ? "var(--orange)" : "var(--ink-40)",
        }}
      />
    </span>
  );
}

/** Rendered on every row: the profile fact that produced the ask, so the
    firm can always see the basis for the request. Never collapsed. */
export function AskReason({ reason, tight = false }: { reason: string; tight?: boolean }) {
  return (
    <div
      style={{
        borderLeft: "3px solid var(--ink-20)",
        background: "var(--paper)",
        borderRadius: "0 6px 6px 0",
        padding: tight ? "8px 12px" : "10px 14px",
        marginTop: 12,
      }}
    >
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        basis for request
      </span>
      <p className="small" style={{ marginTop: 4, lineHeight: 1.55 }}>
        {reason}
      </p>
    </div>
  );
}

export function ObligationLinks({ ids }: { ids: string[] }) {
  if (ids.length === 0) {
    return (
      <span className="small dim60">
        No obligation waits on this document — the filing is itself the input that will create one.
      </span>
    );
  }
  return (
    <span className="row wrap" style={{ gap: 10 }}>
      {ids.map((id) => (
        <Link
          key={id}
          href={`/register?id=${id}`}
          className="mono-value"
          title={OBL.get(id)?.title ?? id}
          style={{ color: "var(--orange-deep)", fontSize: 11 }}
        >
          {id} →
        </Link>
      ))}
    </span>
  );
}

/* ── extraction output table ──────────────────────────────────────────── */

function ExtractionRow({ f }: { f: ExtractedField }) {
  const low = f.confidence < REVIEW_THRESHOLD;
  return (
    <tr style={low ? { background: "var(--orange-soft)" } : undefined}>
      <td style={{ whiteSpace: "nowrap" }}>
        <span className="small" style={{ fontWeight: 500 }}>
          {f.field}
        </span>
      </td>
      <td>
        <span className="small" style={{ lineHeight: 1.55 }}>
          {f.value}
        </span>
      </td>
      <td>
        <div className="row" style={{ gap: 8 }}>
          <span
            className="mono-value tnum"
            style={low ? { color: "var(--orange-deep)", fontWeight: 500 } : undefined}
          >
            {f.confidence.toFixed(2)}
          </span>
          <Meter v={f.confidence} low={low} />
        </div>
        {low ? (
          <div style={{ marginTop: 7 }}>
            <Chip tone="at-risk">needs human review</Chip>
          </div>
        ) : null}
      </td>
      <td>
        <span className="small dim60" style={{ lineHeight: 1.5 }}>
          {f.locator ?? "—"}
        </span>
      </td>
    </tr>
  );
}

function Extractions({ d }: { d: CompanyDocument }) {
  const low = lowCount(d);
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row between wrap" style={{ gap: 10 }}>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          extraction output — {d.extracted.length} fields
        </span>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          {low > 0 ? (
            <span style={{ color: "var(--orange-deep)" }}>
              {low} below the {REVIEW_THRESHOLD} review threshold
            </span>
          ) : (
            `all above the ${REVIEW_THRESHOLD} review threshold`
          )}
        </span>
      </div>
      <div className="panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Field</th>
                <th>Value read</th>
                <th>Confidence</th>
                <th>Locator</th>
              </tr>
            </thead>
            <tbody>
              {d.extracted.map((f) => (
                <ExtractionRow key={f.field} f={f} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {low > 0 ? (
        <div className="row wrap" style={{ gap: 14 }}>
          <ReviewCta count={low} />
          <span className="small dim60" style={{ maxWidth: "62ch" }}>
            A low-confidence reading is shown as read, not smoothed. The officer accepts, corrects
            or rejects it; the decision appends to the audit chain and the entity profile only
            moves on acceptance.
          </span>
        </div>
      ) : null}
    </div>
  );
}

/* ── the supplied document ────────────────────────────────────────────── */

function SuppliedDocument({ d }: { d: CompanyDocument }) {
  const validity = validityNote(d);
  const lapsed = hasLapsed(d);

  if (d.status === "waived") {
    return (
      <div className="stack" style={{ gap: 12 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <Chip tone="info">not requested</Chip>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {d.id} · filed by the registration scan
          </span>
        </div>
        <p className="small" style={{ lineHeight: 1.6, maxWidth: "84ch" }}>
          {d.waivedReason}
        </p>
        {d.notes ? (
          <p className="small dim60" style={{ lineHeight: 1.6, maxWidth: "84ch" }}>
            {d.notes}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="grid cols-2" style={{ gap: 14, alignItems: "start" }}>
        <div className="stack" style={{ gap: 10 }}>
          <KV k="Document">
            <span className="mono-value">{d.id}</span> — {d.name}
          </KV>
          <KV k="File">
            <span className="mono-value" style={{ wordBreak: "break-all" }}>
              {d.fileName ?? "—"}
            </span>
            {d.pages ? <span className="dim60"> · {d.pages} pages</span> : null}
          </KV>
          <KV k="Supplied">
            {d.uploadedAt ? fmtStamp(d.uploadedAt) : "—"}
            {d.uploadedBy ? <span className="dim60"> · {d.uploadedBy}</span> : null}
          </KV>
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <KV k="Validity">
            {validity ? (
              <span
                className="mono-value"
                style={lapsed ? { color: "var(--orange-deep)" } : undefined}
              >
                {d.validFrom ? `${d.validFrom} → ` : ""}
                {validity}
              </span>
            ) : (
              <span className="dim60">no expiry — refreshed on change</span>
            )}
          </KV>
          <KV k="Content hash">
            <span className="hash">{d.hash ?? "—"}</span>
          </KV>
          <KV k="Supports">
            <ObligationLinks ids={d.supportsObligations} />
          </KV>
        </div>
      </div>

      <Hairline dashed />
      <Extractions d={d} />

      {d.notes ? (
        <>
          <Hairline dashed />
          <div>
            <span className="mono-label dim" style={{ fontSize: 9.5 }}>
              engine note
            </span>
            <p className="small" style={{ marginTop: 6, lineHeight: 1.6, maxWidth: "84ch" }}>
              {d.notes}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ── the empty state that matters: an ask with nothing against it ─────── */

function OpenAskDetail({ r }: { r: DocumentRequirement }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row wrap" style={{ gap: 12 }}>
        <Chip tone="gap">
          <span className="dot" data-pulse /> nothing supplied
        </Chip>
        <span className="small dim60">
          The engine holds the ask open rather than inferring the control from adjacent evidence.
        </span>
      </div>
      <KV k="Unlocks">
        <ObligationLinks ids={r.unlocks} />
      </KV>
      <KV k="Accepted">
        <span className="mono-value">{r.acceptedFormats.join(" · ")}</span>
      </KV>
      {r.refreshCadence ? <KV k="Cadence">{r.refreshCadence}</KV> : null}
      <UploadAskCta reqId={r.id} />
    </div>
  );
}

/* ── one requirement ──────────────────────────────────────────────────── */

/* Collapsed rows clamp the clause to two lines so 28 requirements stay
   scannable; expanding gives the provision in full. */
const CLAUSE_FULL: CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  maxWidth: "88ch",
  borderLeft: "3px solid var(--ink-10)",
  paddingLeft: 14,
};
const CLAUSE_CLAMP: CSSProperties = {
  ...CLAUSE_FULL,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

function RequirementCard({
  r,
  open,
  onToggle,
}: {
  r: DocumentRequirement;
  open: boolean;
  onToggle: () => void;
}) {
  const d = docFor(r.id);
  const status = statusOf(r);
  const attention = status === "required" || status === "expired";

  return (
    <article
      id={`req-${r.id}`}
      className="panel"
      style={{
        padding: "18px 22px",
        borderLeft: `3px solid ${attention ? "var(--orange)" : "var(--ink-10)"}`,
        background: open ? "var(--paper)" : undefined,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{ display: "block", width: "100%", textAlign: "left" }}
      >
        <div className="row between wrap" style={{ gap: 10 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <span className="mono-label dim" style={{ fontSize: 9.5 }}>
              {r.id}
            </span>
            <Chip tone="info">{partLabel(r.part)}</Chip>
            <Chip tone="info">{CATEGORY_LABEL[r.category]}</Chip>
            {r.mandatory ? (
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                mandatory
              </span>
            ) : (
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                not raised
              </span>
            )}
          </div>
          <div className="row wrap" style={{ gap: 10 }}>
            <DocStatusChip status={status} />
            <span className="mono-label" style={{ fontSize: 9.5, color: "var(--orange-deep)" }}>
              {open ? "close ✕" : "detail →"}
            </span>
          </div>
        </div>

        <div style={{ fontWeight: 600, fontSize: 15, marginTop: 12 }}>{r.name}</div>
        <p className="small dim60" style={{ marginTop: 6, lineHeight: 1.55, maxWidth: "92ch" }}>
          {r.description}
        </p>
      </button>

      <AskReason reason={r.triggeredBy} />

      {r.clauseRef ? (
        <div style={{ marginTop: 14 }}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            traces to {r.clauseRef.circularId} · para {r.clauseRef.para}
          </span>
          <blockquote className="clause-text" style={open ? CLAUSE_FULL : CLAUSE_CLAMP}>
            {r.clauseRef.excerpt}
          </blockquote>
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            no clause cited — this ask was evaluated by the registration scan, not by a provision
          </span>
        </div>
      )}

      <div className="row wrap" style={{ gap: 10, marginTop: 14, alignItems: "baseline" }}>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          unlocks
        </span>
        <ObligationLinks ids={r.unlocks} />
      </div>

      {open ? (
        <div className="stack" style={{ gap: 16, marginTop: 18 }}>
          <Hairline />
          {d ? <SuppliedDocument d={d} /> : <OpenAskDetail r={r} />}
        </div>
      ) : null}
    </article>
  );
}

/* ── the explorer ─────────────────────────────────────────────────────── */

export function DocumentExplorer() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [part, setPart] = useState<SebiPart | "all">(() => {
    const v = searchParams.get("part");
    return isPart(v) ? v : "all";
  });
  const [category, setCategory] = useState<DocumentCategory | "all">(() => {
    const v = searchParams.get("category");
    return isCategory(v) ? v : "all";
  });
  const [status, setStatus] = useState<DocumentStatus | "all">(() => {
    const v = searchParams.get("status");
    return isStatus(v) ? v : "all";
  });
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    const v = searchParams.get("req");
    return isReqId(v) ? v : null;
  });

  /* deep-link landing: scroll the ?req= card into view once, post-hydration */
  useEffect(() => {
    const target = searchParams.get("req");
    if (!isReqId(target)) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(`req-${target}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
    // mount-only: the landing scroll, not a follow-the-expand scroll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keep the URL in step with the filters, so any view is shareable */
  useEffect(() => {
    const params = new URLSearchParams();
    if (part !== "all") params.set("part", part);
    if (category !== "all") params.set("category", category);
    if (status !== "all") params.set("status", status);
    if (expandedId) params.set("req", expandedId);
    const qs = params.toString();
    if (qs !== searchParams.toString()) {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [part, category, status, expandedId, pathname, router, searchParams]);

  const rows = useMemo(
    () =>
      documentRequirements.filter(
        (r) =>
          (part === "all" || r.part === part) &&
          (category === "all" || r.category === category) &&
          (status === "all" || statusOf(r) === status)
      ),
    [part, category, status]
  );

  const filtersActive = part !== "all" || category !== "all" || status !== "all";
  const reset = () => {
    setPart("all");
    setCategory("all");
    setStatus("all");
  };

  return (
    <>
      <MarkedCard pad={18} style={{ marginBottom: 18 }}>
        <div className="stack" style={{ gap: 12 }}>
          <FilterRow label="sebi part">
            <FilterChip active={part === "all"} onClick={() => setPart("all")}>
              All
            </FilterChip>
            {PARTS_PRESENT.map((p) => (
              <FilterChip
                key={p}
                active={part === p}
                title={partLabel(p)}
                onClick={() => setPart(part === p ? "all" : p)}
              >
                Part {p} · {PART_COUNTS[p] ?? 0}
              </FilterChip>
            ))}
          </FilterRow>
          <FilterRow label="category">
            <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
              All
            </FilterChip>
            {CATEGORIES_PRESENT.map((c) => (
              <FilterChip
                key={c}
                active={category === c}
                onClick={() => setCategory(category === c ? "all" : c)}
              >
                {CATEGORY_LABEL[c]} · {CATEGORY_COUNTS[c] ?? 0}
              </FilterChip>
            ))}
          </FilterRow>
          <FilterRow label="status">
            <FilterChip active={status === "all"} onClick={() => setStatus("all")}>
              All
            </FilterChip>
            {DOC_STATUSES.map((s) => (
              <FilterChip
                key={s}
                active={status === s}
                title={STATUS_HINT[s]}
                onClick={() => setStatus(status === s ? "all" : s)}
              >
                {STATUS_LABEL[s]} · {STATUS_COUNTS[s] ?? 0}
              </FilterChip>
            ))}
          </FilterRow>
        </div>
      </MarkedCard>

      <div className="row between wrap" style={{ marginBottom: 12, gap: 10 }}>
        <span className="mono-label dim">
          showing {rows.length} of {documentRequirements.length} requirements
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
          <span className="mono-label dim">expand a row for the parsed document</span>
        )}
      </div>

      <div className="stack" style={{ gap: 14 }}>
        {rows.length === 0 ? (
          <div className="panel pad">
            <div className="stack" style={{ gap: 10, alignItems: "flex-start" }}>
              <Chip tone="info">no match</Chip>
              <p className="small dim60">
                No requirement in the matrix matches this Part + category + status combination.
              </p>
              <button
                type="button"
                className="mono-label"
                onClick={reset}
                style={{ fontSize: 10.5, color: "var(--orange-deep)", cursor: "pointer" }}
              >
                reset filters →
              </button>
            </div>
          </div>
        ) : (
          rows.map((r) => (
            <RequirementCard
              key={r.id}
              r={r}
              open={expandedId === r.id}
              onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
            />
          ))
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Persona-gated actions. Everything here is sandbox-disabled — the
   inspector never sees a control that could change the firm's record.
   ══════════════════════════════════════════════════════════════════════ */

export function AddDocumentCta() {
  const { persona } = usePersona();
  if (persona === "inspector") return null;
  return (
    <Cta variant="ghost" toastMsg="Sandbox — volunteering a document is disabled in the demo">
      Volunteer a document
    </Cta>
  );
}

export function UploadAskCta({ reqId }: { reqId: string }) {
  const { persona } = usePersona();
  if (persona === "inspector") {
    return (
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        supply reserved for the intermediary — {reqId} open at inspection
      </span>
    );
  }
  return (
    <div className="row wrap" style={{ gap: 12 }}>
      <Cta variant="orange" toastMsg={`Sandbox — uploads are disabled in the demo (${reqId})`}>
        Supply this document
      </Cta>
      <Cta variant="ghost" toastMsg={`Sandbox — waivers are disabled in the demo (${reqId})`}>
        Claim a waiver
      </Cta>
    </div>
  );
}

export function ReviewCta({ count }: { count: number }) {
  const { persona } = usePersona();
  if (persona === "inspector") return null;
  return (
    <Cta variant="ghost" toastMsg="Sandbox — extraction review is disabled in the demo">
      Send {count} {count === 1 ? "reading" : "readings"} to review
    </Cta>
  );
}

export function VolunteerCta() {
  const { persona } = usePersona();
  if (persona === "inspector") {
    return (
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        volunteering reserved for the intermediary
      </span>
    );
  }
  return (
    <Cta toastMsg="Sandbox — volunteering a document is disabled in the demo">
      Submit an unrequested document
    </Cta>
  );
}
