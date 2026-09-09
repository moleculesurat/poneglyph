import { Suspense } from "react";
import Link from "next/link";
import { PageHead, StatTile, MarkedCard, Chip, Hairline, KV } from "@/components/ui";
import { DashField } from "@/components/DashField";
import { documentRequirements } from "@/data/documents";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import { molecule } from "@/data/entity";
import { partLabel } from "@/lib/domains";
import {
  AddDocumentCta,
  AskReason,
  DocStatusChip,
  DocumentExplorer,
  ObligationLinks,
  UploadAskCta,
  VolunteerCta,
} from "./DocumentExplorer";
import {
  BLOCKED_TOTAL,
  EXTRACTED_TOTAL,
  FLAGGED_EXTRACTIONS,
  OPEN_ASKS,
  PARSED_DOCS,
  REVIEW_THRESHOLD,
  STATUS_COUNTS,
  STATUS_HINT,
  VOLUNTEERED,
  WAIVED_REQS,
  docFor,
} from "./shared";

/* ── derived, all from static data (sim-today pinned) ─────────────────── */

const raisedCount = documentRequirements.filter((r) => r.mandatory).length;
const notRaisedCount = documentRequirements.length - raisedCount;

const blockedStatuses = BLOCKED_TOTAL.map((id) => obligations.find((o) => o.id === id)).filter(
  (o): o is NonNullable<typeof o> => Boolean(o)
);
const blockedNotMet = blockedStatuses.filter((o) => o.status !== "met").length;

export default function DocumentsPage() {
  return (
    <>
      <PageHead
        eyebrow={`Document vault · ${tenant.name}`}
        title={
          <>
            Document <span className="accent grad">Vault</span>
          </>
        }
        sub={
          <>
            The Evidence Vault holds proof that a control <i>ran</i>. This vault holds the source
            material the engine learns the firm <i>from</i> — {documentRequirements.length}{" "}
            requirements, each naming the profile fact that produced the ask and the clause behind
            it, each parsed into the extractions that populate the entity profile and unlock
            obligations. <b>Orange marks a requirement with nothing supplied against it.</b>
          </>
        }
        right={<AddDocumentCta />}
      />

      {/* ── the ledger of asks ── */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(172px, 1fr))",
          marginBottom: 26,
        }}
      >
        <StatTile
          label="Verified"
          value={STATUS_COUNTS.verified ?? 0}
          hint={STATUS_HINT.verified}
        />
        <StatTile label="Received" value={STATUS_COUNTS.received ?? 0} hint={STATUS_HINT.received} />
        <StatTile
          label="Required"
          value={STATUS_COUNTS.required ?? 0}
          accent
          hint={STATUS_HINT.required}
        />
        <StatTile label="Expired" value={STATUS_COUNTS.expired ?? 0} hint={STATUS_HINT.expired} />
        <StatTile label="Waived" value={STATUS_COUNTS.waived ?? 0} hint={STATUS_HINT.waived} />
      </div>

      {/* ── the distinction, stated as a pair ── */}
      <MarkedCard pad={0} style={{ marginBottom: 30, overflow: "hidden" }}>
        <div style={{ position: "relative", padding: 22 }}>
          <DashField
            rows={7}
            seed={23}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: "34%",
              height: "100%",
              opacity: 0.14,
            }}
          />
          <div className="grid cols-2" style={{ position: "relative", alignItems: "start" }}>
            <div className="stack" style={{ gap: 6 }}>
              <span className="mono-label dim">Evidence vault — proof a control ran</span>
              <p className="small" style={{ lineHeight: 1.6, maxWidth: "46ch" }}>
                An artifact that shows a control <b>ran</b>: bound to an obligation,
                content-hashed, re-verified on a schedule. It records whether the control was
                performed.
              </p>
              <Link
                href="/evidence"
                className="mono-label"
                style={{ fontSize: 10, color: "var(--orange-deep)", marginTop: 2 }}
              >
                open the evidence vault →
              </Link>
            </div>
            <div className="stack" style={{ gap: 6 }}>
              <span className="mono-label dim">
                Document vault — source material for the entity profile
              </span>
              <p className="small" style={{ lineHeight: 1.6, maxWidth: "46ch" }}>
                The source material the engine <b>learns the firm from</b>: asked for during
                onboarding, parsed into {EXTRACTED_TOTAL} fields across {PARSED_DOCS.length}{" "}
                documents, feeding the entity profile that decides which obligations exist at all.
                It records what the firm is.
              </p>
              <Link
                href="/onboarding"
                className="mono-label"
                style={{ fontSize: 10, color: "var(--orange-deep)", marginTop: 2 }}
              >
                entity onboarding — how the asks were derived →
              </Link>
            </div>
          </div>
        </div>
      </MarkedCard>

      {/* ── the six open asks ── */}
      <section style={{ marginBottom: 34 }}>
        <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
          <span className="eyebrow">
            Open asks — {OPEN_ASKS.length} documents the engine is waiting on
          </span>
          <span className="mono-label dim">sim-today {tenant.simToday}</span>
        </div>

        <MarkedCard pad={18} style={{ marginBottom: 18 }}>
          <div className="row between wrap" style={{ gap: 14 }}>
            <div className="row wrap" style={{ gap: 14, alignItems: "flex-start", minWidth: 0 }}>
              <Chip tone="gap">
                <span className="dot" data-pulse /> Open ask
              </Chip>
              <div className="stack" style={{ gap: 6, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                  {OPEN_ASKS.length} of {raisedCount} raised requirements have nothing supplied
                  against them
                </div>
                <div className="small dim60" style={{ maxWidth: "88ch" }}>
                  {BLOCKED_TOTAL.length} obligations sit downstream of them; {blockedNotMet} are not
                  currently met. The rest are carried as met on evidence bound in the Evidence Vault
                  — the missing document would corroborate those controls, not create them. Either
                  way the engine holds the ask open rather than inferring a control from an adjacent
                  document: what it cannot verify, it reports as unverified, never as compliant.
                </div>
              </div>
            </div>
            <Link href="/register" className="cta" data-variant="orange">
              View the blocked obligations <span className="arrow">→</span>
            </Link>
          </div>
        </MarkedCard>

        <div className="grid cols-2" style={{ alignItems: "start" }}>
          {OPEN_ASKS.map((r) => (
            <article
              key={r.id}
              className="panel"
              style={{ padding: "18px 20px", borderLeft: "3px solid var(--orange)" }}
            >
              <div className="row between wrap" style={{ gap: 10 }}>
                <div className="row wrap" style={{ gap: 8 }}>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                    {r.id}
                  </span>
                  <Chip tone="info">{partLabel(r.part)}</Chip>
                </div>
                <DocStatusChip status="required" />
              </div>

              <div style={{ fontWeight: 600, fontSize: 14.5, marginTop: 12 }}>{r.name}</div>

              <AskReason reason={r.triggeredBy} tight />

              <div className="stack" style={{ gap: 10, marginTop: 14 }}>
                <KV k="Unlocks">
                  <ObligationLinks ids={r.unlocks} />
                </KV>
                <KV k="Accepted">
                  <span className="mono-value">{r.acceptedFormats.join(" · ")}</span>
                </KV>
                {r.refreshCadence ? <KV k="Cadence">{r.refreshCadence}</KV> : null}
              </div>

              <div style={{ marginTop: 14 }}>
                <UploadAskCta reqId={r.id} />
              </div>

              <div style={{ marginTop: 12 }}>
                <Link
                  href={`/documents?status=required&req=${r.id}`}
                  className="mono-label"
                  style={{ fontSize: 9.5, color: "var(--orange-deep)" }}
                >
                  open in the matrix →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── what the engine chose not to ask for ── */}
      <section style={{ marginBottom: 34 }}>
        <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
          Evaluated and not raised — {notRaisedCount} filed non-asks
        </span>
        <MarkedCard pad={22}>
          <p className="small" style={{ lineHeight: 1.6, maxWidth: "92ch" }}>
            The registration scan walks every SEBI intermediary category and records the ones that
            produced no ask. An unrecorded non-ask is indistinguishable from an oversight, so each
            one is filed with the profile fact that made it unnecessary and is re-evaluated on every
            profile change. An inspector can audit the non-asks on the same basis as the asks.
          </p>

          <div className="grid cols-2" style={{ marginTop: 18, alignItems: "start" }}>
            {WAIVED_REQS.map((r) => {
              const d = docFor(r.id);
              return (
                <div key={r.id} className="panel" style={{ padding: "16px 18px" }}>
                  <div className="row between wrap" style={{ gap: 10 }}>
                    <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                      {r.id}
                    </span>
                    <DocStatusChip status="waived" />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 10 }}>{r.name}</div>
                  <p className="small dim60" style={{ marginTop: 8, lineHeight: 1.6 }}>
                    {d?.waivedReason}
                  </p>
                  <div style={{ marginTop: 12 }}>
                    <Link
                      href={`/documents?status=waived&req=${r.id}`}
                      className="mono-label"
                      style={{ fontSize: 9.5, color: "var(--orange-deep)" }}
                    >
                      open in the matrix →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </MarkedCard>
      </section>

      {/* ── the full matrix ── */}
      <section>
        <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
          <span className="eyebrow">
            Requirement matrix — {documentRequirements.length} asks in circular order
          </span>
          <span className="mono-label dim">
            {raisedCount} raised · {notRaisedCount} evaluated and not raised
          </span>
        </div>

        <Suspense fallback={<span className="mono-label dim">loading the requirement matrix…</span>}>
          <DocumentExplorer />
        </Suspense>
      </section>

      {/* ── parsing posture ── */}
      <section style={{ marginTop: 34 }}>
        <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
          Parsing posture
        </span>
        <div className="grid cols-3" style={{ alignItems: "start" }}>
          <div className="panel pad">
            <span className="stat-number">{EXTRACTED_TOTAL}</span>
            <div className="mono-label dim" style={{ marginTop: 8 }}>
              fields extracted
            </div>
            <p className="small dim60" style={{ marginTop: 6, lineHeight: 1.55 }}>
              Read out of {PARSED_DOCS.length} supplied documents, each with a page or section
              locator so the reading can be checked against the source.
            </p>
          </div>
          <div className="panel pad">
            <span className="stat-number grad">{FLAGGED_EXTRACTIONS.length}</span>
            <div className="mono-label dim" style={{ marginTop: 8 }}>
              below {REVIEW_THRESHOLD} — human review
            </div>
            <p className="small dim60" style={{ marginTop: 6, lineHeight: 1.55 }}>
              Readings below the threshold are shown as extracted and flagged for review. The
              engine will not claim a control it could not read cleanly.
            </p>
            <div className="stack" style={{ gap: 6, marginTop: 10 }}>
              {FLAGGED_EXTRACTIONS.map((f) => (
                <span key={`${f.docId}-${f.field.field}`} className="small">
                  <span className="mono-value dim60">{f.docId}</span> · {f.field.field}{" "}
                  <span className="mono-value" style={{ color: "var(--orange-deep)" }}>
                    {f.field.confidence.toFixed(2)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── volunteer a document ── */}
      <section style={{ marginTop: 34 }}>
        <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
          Volunteered documents
        </span>
        <MarkedCard pad={22}>
          <div className="row between wrap" style={{ gap: 18, alignItems: "flex-start" }}>
            <div className="stack" style={{ gap: 10, minWidth: 0, maxWidth: "72ch" }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                Submission of a document outside the requirement matrix
              </div>
              <p className="small" style={{ lineHeight: 1.6 }}>
                The engine asks for what its rules say it should ask for, and that set will be
                incomplete: a board minute that changes a control, an exchange letter that resets a
                deadline, a policy no clause named — the firm knows things the matrix does not. A
                volunteered document runs the same path as a requested one: fields extracted with
                confidence and locator, the entity profile updated only where the reading holds, and
                any obligation the document implies raised as a{" "}
                <b>proposal into the human gate</b> rather than written straight into the register.
                No document reaches the register without passing that gate.
              </p>
              <p className="small dim60" style={{ lineHeight: 1.6 }}>
                {VOLUNTEERED.length === 0
                  ? "Nothing volunteered yet — every document in this vault arrived against an ask."
                  : `${VOLUNTEERED.length} volunteered so far.`}
              </p>
            </div>
            <VolunteerCta />
          </div>
        </MarkedCard>
      </section>

      {/* ── provenance discipline ── */}
      <section style={{ marginTop: 26 }}>
        <div className="panel pad">
          <span className="mono-label dim">Provenance — real and simulated content on this page</span>
          <p className="small dim60" style={{ marginTop: 8, lineHeight: 1.6, maxWidth: "96ch" }}>
            {molecule.legalName} is a SEBI-registered portfolio manager; every fact on this page
            carries its provenance.
          </p>
        </div>
      </section>

      {/* ── cross-links ── */}
      <div style={{ marginTop: 38 }}>
        <Hairline />
        <div className="row wrap" style={{ gap: 26, marginTop: 18 }}>
          <Link href="/onboarding" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            entity onboarding — origin of these asks →
          </Link>
          <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            obligation register →
          </Link>
          <Link href="/evidence" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            evidence vault — proof the controls ran →
          </Link>
          <Link href="/audit" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            audit chain — every parse, hash-chained →
          </Link>
        </div>
      </div>
    </>
  );
}
