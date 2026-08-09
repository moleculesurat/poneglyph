import { Suspense } from "react";
import Link from "next/link";
import { PageHead, StatTile, MarkedCard, Chip, Hairline, KV } from "@/components/ui";
import { DashField } from "@/components/DashField";
import { documentRequirements } from "@/data/documents";
import { angelOneOnboarding } from "@/data/onboarding";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import { angelOne } from "@/data/entity";
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

/* Part VIII raised no ask at all — it is scoped out of this entity's
   register, so no requirement could ever hang off it. The absence is a
   determination, and it is worth naming on this page. */
const excludedPart = angelOne.excludedParts[0];

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
            The Evidence Vault holds proof that a control <i>ran</i>. This holds the source material
            the engine learns the firm <i>from</i> — {documentRequirements.length} requirements,
            each naming the profile fact that made us ask and the clause behind the ask, each parsed
            into the extractions that populate the entity profile and unlock obligations. One vault
            is proof of doing; this one is knowledge of being.{" "}
            <b>Orange means an ask is still open.</b>
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
              <span className="mono-label dim">Evidence vault — proof of doing</span>
              <p className="small" style={{ lineHeight: 1.6, maxWidth: "46ch" }}>
                An artifact that shows a control <b>ran</b>: bound to an obligation,
                content-hashed, re-verified on a schedule. It answers <i>did you do it</i>.
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
              <span className="mono-label dim">Document vault — knowledge of being</span>
              <p className="small" style={{ lineHeight: 1.6, maxWidth: "46ch" }}>
                The source material the engine <b>learns the firm from</b>: asked for during
                onboarding, parsed into {EXTRACTED_TOTAL} fields across {PARSED_DOCS.length}{" "}
                documents, feeding the entity profile that decides which obligations exist at all.
                It answers <i>who are you</i>.
              </p>
              <Link
                href="/onboarding"
                className="mono-label"
                style={{ fontSize: 10, color: "var(--orange-deep)", marginTop: 2 }}
              >
                see how the asks were generated →
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
              See what is blocked <span className="arrow">→</span>
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
          What the engine did not ask for — {notRaisedCount} filed non-asks
        </span>
        <MarkedCard pad={22}>
          <p className="small" style={{ lineHeight: 1.6, maxWidth: "92ch" }}>
            The registration scan walks every SEBI intermediary category and records the ones that
            produced no ask. An unrecorded non-ask is indistinguishable from an oversight, so each
            one is filed with the profile fact that made it unnecessary and is re-evaluated on every
            profile change. An inspector can audit the silence the same way they audit the asks.
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

          <Hairline dashed />

          <div className="row wrap" style={{ gap: 14, marginTop: 16, alignItems: "flex-start" }}>
            <Chip tone="info">Part {excludedPart.part}</Chip>
            <div className="stack" style={{ gap: 4, minWidth: 0 }}>
              <span className="small" style={{ fontWeight: 500 }}>
                {partLabel(excludedPart.part)} produced no requirement at all
              </span>
              <span className="small dim60" style={{ maxWidth: "82ch", lineHeight: 1.6 }}>
                It is scoped out of this entity&apos;s register as event-driven — dormant until an
                exchange default notice reaches the Watchtower — so no document could hang off it.
                The Part is scoped, not deleted.
              </span>
              <Link
                href="/onboarding"
                className="mono-label"
                style={{ fontSize: 9.5, color: "var(--orange-deep)", marginTop: 2 }}
              >
                read the scope determination →
              </Link>
            </div>
          </div>
        </MarkedCard>
      </section>

      {/* ── the full matrix ── */}
      <section>
        <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
          <span className="eyebrow">
            The requirement matrix — {documentRequirements.length} asks in circular order
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
              Shown as read and flagged, never smoothed. The engine will not claim a control it
              could not read cleanly.
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
          <div className="panel pad">
            <span className="stat-number">
              {angelOneOnboarding.result.documentsReceived}
              <span className="dim" style={{ fontSize: "0.5em" }}>
                {" "}
                / {angelOneOnboarding.result.documentsRequested}
              </span>
            </span>
            <div className="mono-label dim" style={{ marginTop: 8 }}>
              answered at onboarding
            </div>
            <p className="small dim60" style={{ marginTop: 6, lineHeight: 1.55 }}>
              Session {angelOneOnboarding.id} closed {angelOneOnboarding.completedAt?.slice(0, 10)}{" "}
              with {angelOneOnboarding.result.obligationsMapped} obligations mapped across{" "}
              {angelOneOnboarding.result.partsApplicable} applicable Parts.
            </p>
          </div>
        </div>
      </section>

      {/* ── volunteer a document ── */}
      <section style={{ marginTop: 34 }}>
        <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
          Volunteer a document
        </span>
        <MarkedCard pad={22}>
          <div className="row between wrap" style={{ gap: 18, alignItems: "flex-start" }}>
            <div className="stack" style={{ gap: 10, minWidth: 0, maxWidth: "72ch" }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                The engine asks for what its rules say it should ask for. It will be incomplete.
              </div>
              <p className="small" style={{ lineHeight: 1.6 }}>
                A board minute that changes a control, an exchange letter that resets a deadline, a
                policy no clause named — the firm knows things the matrix does not. A volunteered
                document runs the same path as a requested one: fields extracted with confidence and
                locator, the entity profile updated only where the reading holds, and any obligation
                the document implies raised as a <b>proposal into the human gate</b> rather than
                written straight into the register. Nothing lands silently.
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
          <span className="mono-label dim">On what is real here</span>
          <p className="small dim60" style={{ marginTop: 8, lineHeight: 1.6, maxWidth: "96ch" }}>
            {tenant.name} is a real, listed, SEBI-registered stock broker, and this is an
            illustrative onboarding of a public entity using public filings. The only extracted
            values that are real are the identity and financial fields on{" "}
            <span className="mono-value">DOC-015</span> — ISIN, listing, net worth, revenue, profit,
            client base and market share, reconciled from XBRL filings and the published June 2026
            business update. Every other document record on this page — file names, page counts,
            audit periods, validity windows, upload trail and operational extractions — is
            simulated, and none of it is an assertion about the firm&apos;s actual documents or
            actual compliance. The named uploaders are the sandbox compliance team.
          </p>
        </div>
      </section>

      {/* ── cross-links ── */}
      <div style={{ marginTop: 38 }}>
        <Hairline />
        <div className="row wrap" style={{ gap: 26, marginTop: 18 }}>
          <Link href="/onboarding" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            see where these asks came from →
          </Link>
          <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            walk forward to the register →
          </Link>
          <Link href="/evidence" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            proof that the controls ran →
          </Link>
          <Link href="/audit" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            every parse, on the hash chain →
          </Link>
        </div>
      </div>
    </>
  );
}
