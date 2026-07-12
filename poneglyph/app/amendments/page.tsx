import Link from "next/link";
import { PageHead, StatTile, MarkedCard, Chip, Cta, Hairline } from "@/components/ui";
import { masterCircular, cuspaCircular, cuspaAmendment } from "@/data/corpus";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import { Redline } from "./Redline";

/* ── derived, all from static data (sim-today pinned) ─────────────────── */

const deltaIds = [...new Set(cuspaAmendment.changes.flatMap((c) => c.deltaObligationIds))];
const delta = obligations.filter((o) => deltaIds.includes(o.id));
const remapped = delta.length;
const untouched = obligations.length - remapped;
const baseCount = obligations.filter((o) => o.createdByRun === "RUN-041").length;

const gaps = delta.filter((o) => o.status === "gap").length;
const pending = delta.filter((o) => o.status === "pending-review").length;
const atRisk = delta.filter((o) => o.status === "at-risk").length;

const modifiedBlocks = cuspaAmendment.changes.filter((c) => c.kind === "modified").length;
const addedBlocks = cuspaAmendment.changes.filter((c) => c.kind === "added").length;

const phase1 = delta.filter((o) => o.deadline === "2026-11-02").length;
const phase2 = delta.filter((o) => o.deadline === "2027-01-03").length;
const daysToPhase1 = Math.round(
  (Date.parse("2026-11-02") - Date.parse(tenant.simToday)) / 86400000
);

/* phased-effectivity window: late Jun 2026 → late Jan 2027 */
const T0 = Date.parse("2026-06-26");
const T1 = Date.parse("2027-01-26");
const pos = (iso: string) => `${(((Date.parse(iso) - T0) / (T1 - T0)) * 100).toFixed(1)}%`;

const MILESTONES: {
  at: string;
  label: string;
  n: string;
  done?: boolean;
  align?: "left" | "right";
}[] = [
  {
    at: cuspaAmendment.issuedOn,
    label: "Amendment issued",
    n: "CIRC-CUSPA-2026",
    done: true,
    align: "left",
  },
  {
    at: "2026-08-02",
    label: "Exchange operational guidelines due",
    n: "30 days from issuance",
  },
  {
    at: "2026-11-02",
    label: "Phase 1 in force — paras 46.1–46.11",
    n: `${phase1} obligations · ${daysToPhase1} days out`,
  },
  {
    at: "2027-01-03",
    label: "Phase 2 in force — paras 46.12–46.14",
    n: `${phase2} obligations`,
    align: "right",
  },
];

function Connector({ label }: { label: string }) {
  return (
    <div
      className="stack"
      style={{ alignItems: "center", justifyContent: "center", gap: 5, flex: "0 0 96px" }}
    >
      <span className="mono-label dim" style={{ fontSize: 9 }}>
        {label}
      </span>
      <div className="row" style={{ gap: 2, width: "100%" }}>
        <div style={{ flex: 1, height: 2, background: "var(--ink-20)" }} />
        <span aria-hidden style={{ color: "var(--ink-40)", lineHeight: 1 }}>
          →
        </span>
      </div>
    </div>
  );
}

export default function Amendments() {
  return (
    <>
      <PageHead
        eyebrow={`Amendment diff · ${cuspaAmendment.id}`}
        title={
          <>
            Amendment <span className="accent grad">Redline</span>
          </>
        }
        sub={
          <>
            On 2026-07-03 SEBI replaced the CUSA transfer regime for clients&rsquo; unpaid
            securities with a pledge-based CUSPA mechanism. Below is the agent-computed
            clause-level redline — every changed provision, the obligations it created or
            re-mapped, and the phased deadlines it set.{" "}
            <b>
              {remapped} obligations re-mapped · {untouched} untouched.
            </b>
          </>
        }
        right={<Cta variant="ghost">Export redline</Cta>}
      />

      {/* ── corpus lineage strip ── */}
      <section style={{ marginBottom: 30 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <span className="eyebrow">Corpus lineage — unpaid securities</span>
          <span className="mono-label dim">3 instruments · sim-today {tenant.simToday}</span>
        </div>
        <MarkedCard pad={26}>
          <div style={{ display: "flex", alignItems: "stretch", gap: 18, flexWrap: "wrap" }}>
            <div className="stack" style={{ gap: 8, flex: "1 1 200px", opacity: 0.55 }}>
              <div className="row">
                <Chip tone="info">superseded</Chip>
              </div>
              <span className="mono-value" style={{ fontWeight: 600 }}>
                {masterCircular.supersedes}
              </span>
              <span className="small" style={{ fontWeight: 600 }}>
                Master Circular for Stock Brokers (prior edition)
              </span>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                retired {masterCircular.issuedOn} · consolidated into {masterCircular.id}
              </span>
            </div>

            <Connector label="superseded by" />

            <div className="stack" style={{ gap: 8, flex: "1 1 220px" }}>
              <div className="row">
                <Chip tone="live">in force</Chip>
              </div>
              <span className="mono-value" style={{ fontWeight: 600 }}>
                {masterCircular.id}
              </span>
              <span className="small" style={{ fontWeight: 600 }}>
                {masterCircular.title}
              </span>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                issued {masterCircular.issuedOn} · {baseCount} base obligations · ingested by
                RUN-041
              </span>
            </div>

            <Connector label="amended by" />

            <div className="stack" style={{ gap: 8, flex: "1 1 240px" }}>
              <div className="row">
                <Chip tone="gap">
                  <span className="dot" data-pulse /> active amendment
                </Chip>
              </div>
              <span className="mono-value" style={{ fontWeight: 600 }}>
                {cuspaCircular.id}
              </span>
              <span className="small" style={{ fontWeight: 600 }}>
                Handling of Clients&rsquo; Unpaid Securities — pledge-based CUSPA
              </span>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                issued {cuspaCircular.issuedOn} · {cuspaAmendment.changes.length} diff blocks ·
                para 46 only
              </span>
              <div className="row" style={{ gap: 14 }}>
                <Link
                  href="/watchtower"
                  className="mono-label"
                  style={{ color: "var(--orange-deep)", fontSize: 9.5 }}
                >
                  caught by Watchtower →
                </Link>
                <Link href="/agents" className="mono-label dim" style={{ fontSize: 9.5 }}>
                  processed in RUN-047 →
                </Link>
              </div>
            </div>
          </div>
        </MarkedCard>
      </section>

      {/* ── impact strip ── */}
      <div className="grid cols-4" style={{ marginBottom: 34 }}>
        <StatTile
          label="Diff blocks in para 46"
          value={cuspaAmendment.changes.length}
          hint={`${modifiedBlocks} modified · ${addedBlocks} added`}
        />
        <StatTile
          label="Obligations re-mapped"
          value={remapped}
          accent
          hint={`${gaps} gaps · ${pending} pending review · ${atRisk} at risk`}
        />
        <StatTile
          label="Obligations untouched"
          value={untouched}
          hint="evidence bindings intact — no re-work"
        />
        <StatTile
          label="Days to phase 1"
          value={daysToPhase1}
          hint="2026-11-02 · paras 46.1–46.11"
        />
      </div>

      {/* ── agent summary + provenance ── */}
      <div className="panel pad" style={{ marginBottom: 26 }}>
        <p className="clause-text" style={{ maxWidth: "88ch" }}>
          {cuspaAmendment.summary}
        </p>
        <div className="row between wrap" style={{ marginTop: 14, gap: 10 }}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {cuspaAmendment.id} · diff computed by agent:diff in RUN-047 · verifier checks 5/5 ✓
          </span>
          <Link
            href="/register"
            className="mono-label"
            style={{ color: "var(--orange-deep)", fontSize: 9.5 }}
          >
            {pending} mappings awaiting compliance-officer approval →
          </Link>
        </div>
      </div>

      {/* ── the redline itself (client) ── */}
      <Redline />

      {/* ── phased-deadline banner ── */}
      <section style={{ marginTop: 34 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <span className="eyebrow">Phased effectivity — CUSPA regime</span>
          <span className="mono-label dim">per para 46.14 · OBL-SB-109 tracks this</span>
        </div>
        <MarkedCard pad={26}>
          <div style={{ position: "relative", height: 118, margin: "6px 8px 0" }}>
            {/* baseline */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 64,
                height: 2,
                background: "var(--ink-10)",
              }}
            />
            {/* today */}
            <div style={{ position: "absolute", left: pos(tenant.simToday), top: 46, bottom: 12 }}>
              <div style={{ width: 2, height: 38, background: "var(--ink)" }} />
              <span
                className="mono-label"
                style={{ fontSize: 9.5, position: "absolute", top: 42, left: 0, whiteSpace: "nowrap" }}
              >
                today
              </span>
            </div>
            {MILESTONES.map((m, i) => (
              <div key={m.at} style={{ position: "absolute", left: pos(m.at), top: 0, bottom: 0 }}>
                <div
                  style={{
                    position: "absolute",
                    top: i % 2 ? 38 : 8,
                    transform:
                      m.align === "left"
                        ? "none"
                        : m.align === "right"
                          ? "translateX(-100%)"
                          : "translateX(-50%)",
                    textAlign: m.align ?? "center",
                    width: 210,
                  }}
                >
                  <div className="small" style={{ fontWeight: 600, fontSize: 12 }}>
                    {m.label}
                  </div>
                  <div className="mono-label dim" style={{ fontSize: 9.5 }}>
                    {m.at} · {m.n}
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: 59,
                    left: -6,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    ...(m.done
                      ? { background: "var(--ink)" }
                      : { background: "var(--white)", border: "3px solid var(--orange)" }),
                  }}
                />
              </div>
            ))}
          </div>

          <Hairline />

          <div className="row between wrap" style={{ marginTop: 18, gap: 18 }}>
            <div className="small dim60" style={{ maxWidth: "58ch", lineHeight: 1.6 }}>
              <b style={{ color: "var(--ink)" }}>{remapped} obligations re-mapped</b> — {gaps}{" "}
              gaps · {pending} pending review · {atRisk} at risk — and{" "}
              <b style={{ color: "var(--ink)" }}>{untouched} untouched</b>, their evidence
              bindings intact. Seven remediation tasks were opened from this run.
            </div>
            <div className="row wrap" style={{ gap: 10 }}>
              <Link href="/register" className="cta" data-variant="orange">
                Review the delta <span className="arrow">→</span>
              </Link>
              <Link href="/remediation" className="cta" data-variant="ghost">
                7 tasks queued <span className="arrow">→</span>
              </Link>
              <Link href="/agents" className="cta" data-variant="ghost">
                Replay RUN-047 <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </MarkedCard>
      </section>
    </>
  );
}
