"use client";

/* ══════════════════════════════════════════════════════════════════════
   Evidence vault explorer — filterable card grid over the 24 artifacts,
   with per-card expandable kind-specific detail + history timeline.
   All facts come from data/evidence.ts; sim-today is pinned in data.
   ══════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import Link from "next/link";
import { Chip, Cta, Hairline, KV, StatusChip } from "@/components/ui";
import { usePersona } from "@/components/persona";
import { evidence } from "@/data/evidence";
import { obligations } from "@/data/obligations";
import type { EvidenceArtifact, EvidenceKind, ObligationStatus } from "@/lib/schema";

/* ── static lookups (module scope — computed once, hydration-safe) ────── */

const OBL = new Map(obligations.map((o) => [o.id, o]));

const KIND_LABEL: Record<EvidenceKind, string> = {
  document: "Document",
  "data-check": "Data check",
  "live-scan": "Live scan",
};
const KIND_MARK: Record<EvidenceKind, string> = {
  document: "◆",
  "data-check": "▸",
  "live-scan": "",
};
const KINDS: EvidenceKind[] = ["document", "data-check", "live-scan"];

const STATUS_RANK: Record<ObligationStatus, number> = {
  met: 0,
  "pending-review": 1,
  "at-risk": 2,
  gap: 3,
  /* live-pipeline drafts the officer turned down, or approved duties withdrawn; never in the seeded register */
  rejected: 4,
  withdrawn: 5,
};

const CONNECTORS = [...new Set(evidence.map((e) => e.connector))];

/* newest capture first — the vault reads as a freshness feed */
const SORTED = [...evidence].sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));

const fmt = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} IST`;

/* worst status among the obligations an artifact is bound to —
   this is the only thing that may turn a card orange */
function worstStatus(a: EvidenceArtifact): ObligationStatus {
  let worst: ObligationStatus = "met";
  for (const id of a.obligationIds) {
    const s = OBL.get(id)?.status ?? "met";
    if (STATUS_RANK[s] > STATUS_RANK[worst]) worst = s;
  }
  return worst;
}

/* ── small pieces ─────────────────────────────────────────────────────── */

function KindChip({ kind }: { kind: EvidenceKind }) {
  return (
    <span className="chip" data-tone={kind === "live-scan" ? "live" : "info"}>
      {kind === "live-scan" ? (
        <span className="dot" data-pulse />
      ) : (
        <span aria-hidden>{KIND_MARK[kind]}</span>
      )}
      {KIND_LABEL[kind]}
    </span>
  );
}

function Detail({ a }: { a: EvidenceArtifact }) {
  const d = a.detail;
  if (a.kind === "document") {
    return (
      <div className="stack" style={{ gap: 12 }}>
        <KV k="artifact">
          {d.docPages} pages · uploaded via {a.connector}
        </KV>
        <blockquote
          className="clause-text"
          style={{ borderLeft: "3px solid var(--ink-10)", padding: "2px 0 2px 16px", fontSize: 14.5 }}
        >
          {d.docExcerpt}
        </blockquote>
      </div>
    );
  }
  if (a.kind === "data-check") {
    return (
      <div className="stack" style={{ gap: 10 }}>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          check query · {a.connector}
        </span>
        <div className="terminal" style={{ fontSize: 11.5, padding: "12px 16px" }}>
          {d.checkQuery}
        </div>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          latest result
        </span>
        <p className="small" style={{ lineHeight: 1.6 }}>{d.checkResult}</p>
      </div>
    );
  }
  return (
    <div className="stack" style={{ gap: 10 }}>
      <KV k="scan engine">{d.scanTool}</KV>
      <span className="mono-label dim" style={{ fontSize: 9.5 }}>
        findings
      </span>
      <p className="small" style={{ lineHeight: 1.6 }}>{d.scanFindings}</p>
    </div>
  );
}

function History({ a }: { a: EvidenceArtifact }) {
  return (
    <div>
      <span className="mono-label dim" style={{ fontSize: 9.5, display: "block", marginBottom: 10 }}>
        history — {a.history.length} events
      </span>
      <div
        style={{
          borderLeft: "2px solid var(--ink-10)",
          marginLeft: 4,
          paddingLeft: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {a.history.map((h) => (
          <div key={`${h.at}-${h.event}`} style={{ position: "relative" }}>
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: -22,
                top: 4,
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "var(--white)",
                border: "2px solid var(--ink-20)",
              }}
            />
            <div className="small" style={{ fontWeight: 500 }}>{h.event}</div>
            <div className="mono-label dim" style={{ fontSize: 9.5, marginTop: 2 }}>
              {fmt(h.at)} · {h.hash}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoundObligations({ a }: { a: EvidenceArtifact }) {
  return (
    <div>
      <span className="mono-label dim" style={{ fontSize: 9.5, display: "block", marginBottom: 10 }}>
        satisfies
      </span>
      <div className="stack" style={{ gap: 8 }}>
        {a.obligationIds.map((id) => {
          const o = OBL.get(id);
          return (
            <div key={id} className="row wrap" style={{ gap: 10 }}>
              <Link href="/register" className="mono-value" style={{ color: "var(--orange-deep)", fontSize: 11 }}>
                {id}
              </Link>
              <span className="small" style={{ minWidth: 0 }}>{o?.title ?? "—"}</span>
              {o ? <StatusChip status={o.status} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── main explorer ────────────────────────────────────────────────────── */

export function EvidenceExplorer() {
  const [kind, setKind] = useState<EvidenceKind | "all">("all");
  const [connector, setConnector] = useState<string>("all");
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const shown = SORTED.filter(
    (a) => (kind === "all" || a.kind === kind) && (connector === "all" || a.connector === connector)
  );

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const reset = () => {
    setKind("all");
    setConnector("all");
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      {/* ── filters ── */}
      <div className="row between wrap" style={{ gap: 12 }}>
        <div className="row wrap" style={{ gap: 8 }}>
          <button
            className="chip"
            data-tone={kind === "all" ? "live" : "info"}
            onClick={() => setKind("all")}
            aria-pressed={kind === "all"}
          >
            All kinds · {evidence.length}
          </button>
          {KINDS.map((k) => (
            <button
              key={k}
              className="chip"
              data-tone={kind === k ? "live" : "info"}
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
            >
              {KIND_MARK[k] ? <span aria-hidden>{KIND_MARK[k]}</span> : null}
              {KIND_LABEL[k]} · {evidence.filter((e) => e.kind === k).length}
            </button>
          ))}
        </div>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          showing {shown.length} of {evidence.length} artifacts
        </span>
      </div>
      <div className="row wrap" style={{ gap: 16 }}>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          connector
        </span>
        {["all", ...CONNECTORS].map((c) => (
          <button
            key={c}
            className="mono-label"
            onClick={() => setConnector(c)}
            aria-pressed={connector === c}
            style={{
              fontSize: 10.5,
              paddingBottom: 2,
              color: connector === c ? "var(--ink)" : "var(--ink-40)",
              borderBottom: connector === c ? "2px solid var(--orange)" : "2px solid transparent",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── card grid ── */}
      <div className="grid cols-2" style={{ alignItems: "start" }}>
        {shown.map((a) => {
          const isOpen = open.has(a.id);
          const worst = worstStatus(a);
          return (
            <article key={a.id} className="panel" style={{ padding: "18px 20px" }}>
              <button
                onClick={() => toggle(a.id)}
                aria-expanded={isOpen}
                style={{ display: "block", width: "100%", textAlign: "left" }}
              >
                <div className="row between wrap" style={{ gap: 8 }}>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <KindChip kind={a.kind} />
                    {worst !== "met" ? <StatusChip status={worst} /> : null}
                  </div>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>{a.id}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14.5, marginTop: 12 }}>{a.title}</div>
                <p className="small dim60" style={{ marginTop: 6, lineHeight: 1.55 }}>{a.description}</p>
                <div className="row wrap" style={{ gap: 14, marginTop: 12 }}>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>{a.connector}</span>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                    captured {fmt(a.capturedAt)}
                  </span>
                  <span className="hash">{a.hash}</span>
                  <span
                    className="mono-label"
                    style={{ fontSize: 9.5, color: "var(--orange-deep)", marginLeft: "auto" }}
                  >
                    {isOpen ? "close ✕" : "detail →"}
                  </span>
                </div>
              </button>

              <div className="row wrap" style={{ gap: 10, marginTop: 12 }}>
                <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                  bound to
                </span>
                {a.obligationIds.map((id) => (
                  <Link
                    key={id}
                    href="/register"
                    className="mono-value"
                    style={{ color: "var(--orange-deep)", fontSize: 11 }}
                  >
                    {id}
                  </Link>
                ))}
              </div>

              {isOpen ? (
                <div className="stack" style={{ gap: 16, marginTop: 16 }}>
                  <Hairline />
                  <Detail a={a} />
                  <Hairline dashed />
                  <BoundObligations a={a} />
                  <Hairline dashed />
                  <History a={a} />
                </div>
              ) : null}
            </article>
          );
        })}

        {shown.length === 0 ? (
          <div className="panel pad" style={{ gridColumn: "1 / -1" }}>
            <div className="stack" style={{ gap: 10, alignItems: "flex-start" }}>
              <Chip tone="info">no match</Chip>
              <p className="small dim60">
                No artifact in the vault matches this kind + connector combination.
              </p>
              <button
                className="mono-label"
                style={{ fontSize: 10.5, color: "var(--orange-deep)" }}
                onClick={reset}
              >
                reset filters →
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* Broker-only header action — hidden for the inspector persona */
export function UploadCta() {
  const { persona } = usePersona();
  if (persona === "inspector") return null;
  return <Cta variant="ghost">Upload artifact</Cta>;
}
