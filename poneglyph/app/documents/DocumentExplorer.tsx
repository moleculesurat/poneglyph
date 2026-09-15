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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Chip, Cta, Hairline, KV, MarkedCard } from "@/components/ui";
import { usePersona } from "@/components/persona";
import { Signer } from "@/components/Signer";
import {
  apiCall,
  decideDocument,
  readDocument,
  uploadDocument,
  type DecideBody,
  type StateResponse,
} from "@/app/live/api";
import { documentRequirements } from "@/data/documents";
import { tenant } from "@/data/tenant";
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
  VOLUNTEERED,
  docFor,
  fmtStamp,
  hasLapsed,
  lowCount,
  statusOf,
  validityNote,
} from "./shared";

/* ── the vault write bus ──────────────────────────────────────────────
   Supply forms and decision buttons live in several client islands, but the
   live document list lives only in DocumentExplorer. Rather than thread a
   refresh callback through every one, a mutation announces itself and the
   explorer re-pulls /api/state. `volunteer` opens the one volunteer form. */
const VAULT_CHANGED = "vault:changed";
const VAULT_VOLUNTEER = "vault:volunteer";

function signalVaultChanged() {
  try {
    window.dispatchEvent(new Event(VAULT_CHANGED));
  } catch {
    /* no window (SSR) — nothing is mounted to hear it anyway */
  }
}

const inputStyle: CSSProperties = {
  border: "1.5px solid var(--ink-10)",
  background: "var(--white)",
  padding: "9px 11px",
  color: "var(--ink)",
};

/** newest first — real uploads carry an ISO uploadedAt; ties break on id */
function byNewest(a: CompanyDocument, b: CompanyDocument): number {
  return (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? "") || b.id.localeCompare(a.id);
}

/** the ask's live status: the newest live document's, with rejected reading as
    a still-open `required` (a turned-down document does not satisfy the ask) */
function askStatusOf(docs: CompanyDocument[] | undefined, fallback: DocumentStatus): DocumentStatus {
  if (!docs || docs.length === 0) return fallback;
  const s = docs[0].status;
  return s === "rejected" ? "required" : s;
}

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

/* ── ask picker: chosen asks as chips, a substring filter over the rest ── */

function AskPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return documentRequirements
      .filter((r) => !value.includes(r.id))
      .filter((r) => r.id.toLowerCase().includes(needle) || r.name.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [q, value]);

  return (
    <div className="stack" style={{ gap: 8 }}>
      {value.length ? (
        <div className="row wrap" style={{ gap: 6 }}>
          {value.map((id) => (
            <button
              key={id}
              type="button"
              className="chip"
              data-tone="live"
              onClick={() => onChange(value.filter((x) => x !== id))}
              style={{ cursor: "pointer" }}
              title={documentRequirements.find((r) => r.id === id)?.name ?? id}
            >
              {id} ✕
            </button>
          ))}
        </div>
      ) : null}
      <input
        style={inputStyle}
        className="mono-value"
        placeholder="add an ask — id or name"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {matches.length ? (
        <div className="stack" style={{ gap: 3 }}>
          {matches.map((r) => (
            <button
              key={r.id}
              type="button"
              className="small"
              onClick={() => {
                onChange([...value, r.id]);
                setQ("");
              }}
              style={{
                textAlign: "left",
                cursor: "pointer",
                padding: "5px 9px",
                border: "1px solid var(--ink-10)",
                background: "var(--paper)",
              }}
            >
              <span className="mono-value" style={{ fontSize: 10.5 }}>
                {r.id}
              </span>{" "}
              · {r.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── supply a document: one PDF, its asks, a signer ───────────────────── */

function SupplyForm({ reqIds, onSupplied }: { reqIds: string[]; onSupplied?: () => void }) {
  const { persona } = usePersona();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [asks, setAsks] = useState<string[]>(reqIds);
  const [signer, setSigner] = useState(tenant.team[0].name);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (persona === "inspector") {
    return (
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        supply reserved for the intermediary
      </span>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErr("choose a PDF to supply");
      return;
    }
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("officer", signer);
      fd.append("name", name.trim() || file.name);
      if (notes.trim()) fd.append("notes", notes.trim());
      fd.append("requirementIds", asks.join(",")); // the Worker splits on commas
      const r = await uploadDocument(fd, token);
      setOk(`${r.document.id} received`);
      signalVaultChanged();
      onSupplied?.();
    } catch (e2) {
      setErr((e2 as Error).message); // the Worker's own words (409 duplicate included)
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" style={{ gap: 10 }} onSubmit={submit}>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          if (f && !name.trim()) setName(f.name);
        }}
      />
      <input
        style={inputStyle}
        className="mono-value"
        placeholder="document name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        style={inputStyle}
        className="small"
        placeholder="notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="stack" style={{ gap: 4 }}>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          asks this answers{asks.length ? "" : " — none, volunteered"}
        </span>
        <AskPicker value={asks} onChange={setAsks} />
      </div>
      <Signer signer={signer} onSigner={setSigner} token={token} onToken={setToken} />
      <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
        <button
          type="submit"
          className="mono-value"
          style={{ ...inputStyle, cursor: "pointer", color: "var(--orange-deep)" }}
          disabled={busy || !file}
        >
          {busy ? "supplying…" : "Supply document"}
        </button>
        {ok ? (
          <span className="mono-value" style={{ color: "var(--orange-deep)" }}>
            {ok}
          </span>
        ) : null}
      </div>
      {err ? (
        <span className="small" style={{ color: "var(--orange-deep)" }}>
          {err}
        </span>
      ) : null}
    </form>
  );
}

/* ── the machine read, shown per ask ──────────────────────────────────── */

function VerdictLines({ doc }: { doc: CompanyDocument }) {
  const p = doc.proposal;
  if (!p) return null;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        machine read · {p.model}
      </span>
      {p.verdicts.length === 0 ? (
        <span className="small dim60">
          No asks to judge — the fields below are what the engine read.
        </span>
      ) : (
        p.verdicts.map((v) => (
          <div key={v.requirementId} className="stack" style={{ gap: 5 }}>
            <div className="row wrap" style={{ gap: 8, alignItems: "baseline" }}>
              <span className="mono-value" style={{ fontSize: 11 }}>
                {v.requirementId}
              </span>
              <Chip tone={v.verdict === "satisfies" ? "met" : v.verdict === "partial" ? "at-risk" : "gap"}>
                {v.verdict}
              </Chip>
              <span className="small" style={{ lineHeight: 1.5 }}>
                {v.reason}
              </span>
            </div>
            {v.quotes.map((q, i) => (
              <span
                key={i}
                className="mono-value dim60"
                style={{ fontSize: 10.5, lineHeight: 1.5, paddingLeft: 12, borderLeft: "2px solid var(--ink-10)" }}
              >
                “{q}”
              </span>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function DecisionMeta({ doc }: { doc: CompanyDocument }) {
  const d = doc.decision;
  if (!d) return null;
  return (
    <div className="stack" style={{ gap: 6 }}>
      <KV k="Decision">
        <span className="mono-value">{d.decision === "verify" ? "verified" : "rejected"}</span> by {d.by} ·{" "}
        {fmtStamp(d.at)}
      </KV>
      {d.reason ? (
        <KV k="Reason">
          <span className="small">{d.reason}</span>
        </KV>
      ) : null}
      {d.evidenceId ? (
        <KV k="Evidence">
          <span className="mono-value">{d.evidenceId}</span>
        </KV>
      ) : null}
    </div>
  );
}

/* received → read, then verify or reject. Every success announces itself so
   the explorer re-pulls; the Worker's own error text shows verbatim. */
function ReceivedActions({ doc }: { doc: CompanyDocument }) {
  const [signer, setSigner] = useState(tenant.team[0].name);
  const [token, setToken] = useState("");
  const [reading, setReading] = useState(false);
  const [verifyReason, setVerifyReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [pickAsks, setPickAsks] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "verify" | "reject">("");
  const [msg, setMsg] = useState<string | null>(null);

  const asks = doc.requirementIds ?? (doc.requirementId ? [doc.requirementId] : []);
  const hasAsks = asks.length > 0;
  const satisfiesEvery =
    !!doc.proposal &&
    hasAsks &&
    asks.every((a) => doc.proposal!.verdicts.some((v) => v.requirementId === a && v.verdict === "satisfies"));
  const canVerify =
    busy === "" && (satisfiesEvery || verifyReason.trim().length > 0) && (hasAsks || pickAsks.length > 0);

  const read = async () => {
    setReading(true);
    setMsg(null);
    try {
      await readDocument(doc.id, signer, token);
      signalVaultChanged();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setReading(false);
    }
  };

  const decide = async (e: React.FormEvent, which: "verify" | "reject") => {
    e.preventDefault();
    setBusy(which);
    setMsg(null);
    try {
      const body: DecideBody =
        which === "reject"
          ? { decision: "reject", officer: signer, reason: rejectReason.trim() }
          : {
              decision: "verify",
              officer: signer,
              ...(verifyReason.trim() ? { reason: verifyReason.trim() } : {}),
              ...(hasAsks ? {} : { requirementIds: pickAsks }),
            };
      await decideDocument(doc.id, body, token);
      signalVaultChanged();
    } catch (e2) {
      setMsg((e2 as Error).message);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      {!doc.proposal ? (
        <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={read}
            disabled={reading}
            className="mono-value"
            style={{ ...inputStyle, cursor: "pointer", color: "var(--orange-deep)" }}
          >
            {reading ? "reading…" : "Read with the model"}
          </button>
          {reading ? (
            <span className="small dim60">reading… the model can take up to four minutes</span>
          ) : null}
        </div>
      ) : null}

      <Signer signer={signer} onSigner={setSigner} token={token} onToken={setToken} />

      <div className="grid cols-2" style={{ gap: 14, alignItems: "start" }}>
        <form className="stack" style={{ gap: 8 }} onSubmit={(e) => decide(e, "verify")}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            verify — binds one evidence artefact to every unlocked duty
          </span>
          {!hasAsks ? (
            <div className="stack" style={{ gap: 4 }}>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                name the asks to verify against
              </span>
              <AskPicker value={pickAsks} onChange={setPickAsks} />
            </div>
          ) : null}
          <textarea
            style={inputStyle}
            className="small"
            rows={2}
            placeholder={satisfiesEvery ? "reason (optional — the read satisfies every ask)" : "reason (required)"}
            value={verifyReason}
            onChange={(e) => setVerifyReason(e.target.value)}
          />
          <button
            type="submit"
            className="mono-value"
            style={{ ...inputStyle, cursor: "pointer", color: "var(--orange-deep)" }}
            disabled={!canVerify}
          >
            {busy === "verify" ? "verifying…" : "Verify"}
          </button>
        </form>

        <form className="stack" style={{ gap: 8 }} onSubmit={(e) => decide(e, "reject")}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            reject — turned down, kept for the trail
          </span>
          <textarea
            style={inputStyle}
            className="small"
            rows={2}
            placeholder="reason (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
          <button
            type="submit"
            className="mono-value"
            style={{ ...inputStyle, cursor: "pointer", color: "var(--orange-deep)" }}
            disabled={busy !== "" || !rejectReason.trim()}
          >
            {busy === "reject" ? "rejecting…" : "Reject"}
          </button>
        </form>
      </div>
      {msg ? (
        <span className="small" style={{ color: "var(--orange-deep)" }}>
          {msg}
        </span>
      ) : null}
    </div>
  );
}

/* one live vault document — the full lifecycle: received (read + decide),
   verified (the binding), rejected (the trail). Seeded/evidence documents keep
   the static SuppliedDocument view; only real uploads land here. */
function DocumentPanel({ doc }: { doc: CompanyDocument }) {
  const { persona } = usePersona();
  const border =
    doc.status === "verified"
      ? "var(--ink-10)"
      : doc.status === "rejected"
        ? "var(--orange)"
        : "var(--ink-20)";
  return (
    <div className="panel" style={{ padding: "16px 18px", borderLeft: `3px solid ${border}` }}>
      <div className="stack" style={{ gap: 12 }}>
        <div className="row between wrap" style={{ gap: 10 }}>
          <div className="row wrap" style={{ gap: 8, alignItems: "baseline" }}>
            <span className="mono-value">{doc.id}</span>
            <DocStatusChip status={doc.status} />
            <span className="small" style={{ fontWeight: 500 }}>
              {doc.name}
            </span>
          </div>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {doc.uploadedBy ? `by ${doc.uploadedBy}` : ""}
            {doc.uploadedAt ? ` · ${fmtStamp(doc.uploadedAt)}` : ""}
          </span>
        </div>

        <div className="grid cols-2" style={{ gap: 12, alignItems: "start" }}>
          <KV k="File">
            <span className="mono-value" style={{ wordBreak: "break-all" }}>
              {doc.fileName ?? "—"}
            </span>
            {doc.pages ? <span className="dim60"> · {doc.pages} pages</span> : null}
          </KV>
          <KV k="Content hash">
            <span className="hash">{doc.hash ? doc.hash.slice(0, 12) : "—"}</span>
          </KV>
        </div>
        {doc.notes ? (
          <p className="small dim60" style={{ lineHeight: 1.6 }}>
            {doc.notes}
          </p>
        ) : null}

        {doc.proposal ? (
          <>
            <Hairline dashed />
            <VerdictLines doc={doc} />
          </>
        ) : null}
        {doc.extracted.length ? <Extractions d={doc} /> : null}

        {doc.decision?.decision === "verify" ? (
          <>
            <Hairline dashed />
            <div className="stack" style={{ gap: 8 }}>
              <DecisionMeta doc={doc} />
              <div className="row wrap" style={{ gap: 10, alignItems: "baseline" }}>
                <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                  duties now met
                </span>
                <ObligationLinks ids={doc.supportsObligations} />
              </div>
            </div>
          </>
        ) : doc.decision?.decision === "reject" ? (
          <>
            <Hairline dashed />
            <DecisionMeta doc={doc} />
          </>
        ) : doc.status === "received" && persona !== "inspector" ? (
          <>
            <Hairline dashed />
            <ReceivedActions doc={doc} />
          </>
        ) : null}
      </div>
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
  status,
  liveDocs,
}: {
  r: DocumentRequirement;
  open: boolean;
  onToggle: () => void;
  status: DocumentStatus;
  liveDocs: CompanyDocument[] | null;
}) {
  const d = docFor(r.id);
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
          {liveDocs && liveDocs.length > 0 ? (
            <div className="stack" style={{ gap: 14 }}>
              {liveDocs.map((ld) => (
                <DocumentPanel key={ld.id} doc={ld} />
              ))}
              {status === "required" || status === "expired" ? (
                <div className="stack" style={{ gap: 8 }}>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                    supply a fresh document
                  </span>
                  <SupplyForm reqIds={[r.id]} />
                </div>
              ) : null}
            </div>
          ) : d ? (
            <SuppliedDocument d={d} />
          ) : (
            <OpenAskDetail r={r} />
          )}
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
  const { persona } = usePersona();

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

  /* live overlay: the matrix first paints from static data (SSR and hydration
     must agree), then we pull the real document store and let it supersede. Any
     write in the vault announces itself on VAULT_CHANGED so we re-pull;
     VAULT_VOLUNTEER opens the one volunteer form. On failure we keep static. */
  const [documents, setDocuments] = useState<CompanyDocument[] | null>(null);
  const [liveError, setLiveError] = useState(false);
  const [showVolunteer, setShowVolunteer] = useState(false);
  const volunteerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    apiCall<StateResponse>("/api/state")
      .then((s) => {
        setDocuments(s.documents);
        setLiveError(false);
      })
      .catch(() => {
        setDocuments(null);
        setLiveError(true);
      });
  }, []);

  useEffect(() => {
    refresh();
    const onChanged = () => refresh();
    const onVolunteer = () => {
      setShowVolunteer(true);
      requestAnimationFrame(() =>
        volunteerRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }),
      );
    };
    window.addEventListener(VAULT_CHANGED, onChanged);
    window.addEventListener(VAULT_VOLUNTEER, onVolunteer);
    return () => {
      window.removeEventListener(VAULT_CHANGED, onChanged);
      window.removeEventListener(VAULT_VOLUNTEER, onVolunteer);
    };
  }, [refresh]);

  const liveDocsByReq = useMemo(() => {
    const m = new Map<string, CompanyDocument[]>();
    for (const doc of documents ?? []) {
      const ids = doc.requirementIds ?? (doc.requirementId ? [doc.requirementId] : []);
      for (const id of ids) {
        const arr = m.get(id);
        if (arr) arr.push(doc);
        else m.set(id, [doc]);
      }
    }
    for (const arr of m.values()) arr.sort(byNewest);
    return m;
  }, [documents]);

  const displayedStatus = useCallback(
    (r: DocumentRequirement): DocumentStatus => askStatusOf(liveDocsByReq.get(r.id), statusOf(r)),
    [liveDocsByReq],
  );

  const liveVolunteered = useMemo(
    () =>
      (documents ?? [])
        .filter((d) => !(d.requirementIds && d.requirementIds.length) && !d.requirementId)
        .sort(byNewest),
    [documents],
  );

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
          (status === "all" || displayedStatus(r) === status)
      ),
    [part, category, status, displayedStatus]
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
          <FilterRow label="rulebook">
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
                {partLabel(p)} · {PART_COUNTS[p] ?? 0}
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

      {liveError ? (
        <div className="mono-label dim" style={{ marginBottom: 8, fontSize: 9.5 }}>
          live state unavailable — showing the last pulled vault
        </div>
      ) : null}

      <div ref={volunteerRef} className="stack" style={{ gap: 12, marginBottom: 18 }}>
        <div className="row between wrap" style={{ gap: 10 }}>
          <span className="eyebrow">
            Volunteered — {liveVolunteered.length + VOLUNTEERED.length} outside the ask matrix
          </span>
          {persona !== "inspector" ? (
            <button
              type="button"
              className="mono-label"
              onClick={() => setShowVolunteer((v) => !v)}
              style={{ color: "var(--orange-deep)", cursor: "pointer" }}
            >
              {showVolunteer ? "close ✕" : "Volunteer a document +"}
            </button>
          ) : null}
        </div>
        {showVolunteer ? (
          <MarkedCard pad={16}>
            <SupplyForm reqIds={[]} />
          </MarkedCard>
        ) : null}
        {liveVolunteered.map((d) => (
          <DocumentPanel key={d.id} doc={d} />
        ))}
        {VOLUNTEERED.map((d) => (
          <SuppliedDocument key={d.id} d={d} />
        ))}
      </div>

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
              status={displayedStatus(r)}
              liveDocs={liveDocsByReq.get(r.id) ?? null}
            />
          ))
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Persona-gated actions. Supply and volunteer open the real form (a write
   goes only through the gated API); the waiver and extraction-review controls
   are still stubs, each labelled as not yet built. The inspector never sees a
   control that could change the firm's record.
   ══════════════════════════════════════════════════════════════════════ */

export function AddDocumentCta() {
  const { persona } = usePersona();
  if (persona === "inspector") return null;
  return (
    <Cta variant="ghost" onClick={() => window.dispatchEvent(new Event(VAULT_VOLUNTEER))}>
      Volunteer a document
    </Cta>
  );
}

export function UploadAskCta({ reqId }: { reqId: string }) {
  const { persona } = usePersona();
  const [open, setOpen] = useState(false);
  if (persona === "inspector") {
    return (
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        supply reserved for the intermediary — {reqId} open at inspection
      </span>
    );
  }
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row wrap" style={{ gap: 12 }}>
        <Cta variant="orange" onClick={() => setOpen((v) => !v)}>
          Supply this document
        </Cta>
        <Cta variant="ghost" toastMsg={`Waiver — not available yet (${reqId})`}>
          Claim a waiver
        </Cta>
      </div>
      {open ? (
        <MarkedCard pad={16}>
          <SupplyForm reqIds={[reqId]} onSupplied={() => setOpen(false)} />
        </MarkedCard>
      ) : null}
    </div>
  );
}

export function ReviewCta({ count }: { count: number }) {
  const { persona } = usePersona();
  if (persona === "inspector") return null;
  return (
    <Cta variant="ghost" toastMsg="Extraction review — not available yet">
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
    <Cta onClick={() => window.dispatchEvent(new Event(VAULT_VOLUNTEER))}>
      Submit an unrequested document
    </Cta>
  );
}
