import Link from "next/link";
import { PageHead, StatTile, MarkedCard, Chip, StatusChip, Hairline, Cta } from "@/components/ui";
import { runs } from "@/data/runs";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import { TraceReplay } from "./TraceReplay";
import { RunsTable } from "./RunsTable";

/* ── derived, all from static data ────────────────────────────────────── */

const heroRun = runs.find((r) => r.id === "RUN-047") ?? runs[runs.length - 1];
const heldObligations = obligations.filter((o) => o.status === "pending-review");

const totalSteps = runs.reduce((n, r) => n + r.steps.length, 0);
const totalChecks = runs.reduce((n, r) => n + r.verifierChecks.length, 0);
const passedChecks = runs.reduce((n, r) => n + r.verifierChecks.filter((c) => c.pass).length, 0);
const verifiedRuns = runs.filter((r) => r.verifierChecks.length > 0).length;

const PIPELINE_ORDER = ["watcher", "applicability", "diff", "extraction", "verifier", "human gate"] as const;

/* the named officer the gate waits on — read from the tenant record, never typed */
const complianceOfficer =
  tenant.team.find((m) => m.role === "Compliance Officer")?.name ?? "the compliance officer";

const PRINCIPLES = [
  {
    n: "01",
    title: "Deterministic pipeline",
    body:
      "The stage order is fixed in code rather than decided per run. Watcher to human gate, same order every run — replay any trace on this page and it walks the identical path.",
  },
  {
    n: "02",
    title: "Ephemeral LLM workers",
    body:
      "Agents are spun up per document and destroyed with the run. No agent retains state between runs, so no hidden context accumulates and no behaviour drifts.",
  },
  {
    n: "03",
    title: "Permanent schema",
    body:
      "Every output must land as a typed entry in the obligation ontology — clause ref, control, evidence spec, hash — or it does not land at all.",
  },
  {
    n: "04",
    title: "Human gate",
    body:
      "The pipeline produces drafts and records no approvals of its own. Any mapping carrying material judgement is held at pending-review until a compliance officer approves it.",
  },
];

export default function AgentsPage() {
  if (!heroRun) {
    return (
      <>
        <PageHead
          eyebrow="Agent pipeline"
          title={
            <>
              The <span className="accent grad">Glass Box</span>
            </>
          }
          sub="No pipeline run yet. Every run — watcher, applicability, extraction, verifier, human gate — is recorded and replayable here once the pipeline drafts obligations from the corpus."
        />
        <div className="panel pad">
          <span className="small dim60">No runs on record. The register fills only through the pipeline and the human gate.</span>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHead
        eyebrow={`Pipeline execution log · ${tenant.name}`}
        title={
          <>
            Agent Run <span className="accent grad">Console</span>
          </>
        }
        sub={
          <>
            {runs.length} pipeline runs recorded since first ingest, every one replayable to the
            step — thought, action, observation. <b>Every register entry is verified before it is
            written, and every material entry carries a named approver.</b> The trace is produced
            by the pipeline as it runs, not compiled into a report afterwards.
          </>
        }
        right={<Cta variant="ghost">Export run log</Cta>}
      />

      {/* ── posture strip ── */}
      <div className="grid cols-4" style={{ marginBottom: 34 }}>
        <StatTile label="Pipeline runs" value={runs.length} hint="since corpus ingest, Jun 2025" />
        <StatTile label="Trace steps recorded" value={totalSteps} hint="each one replayable below" />
        <StatTile
          label="Verifier checks passed"
          value={`${passedChecks}/${totalChecks}`}
          hint={`5 deterministic checks × ${verifiedRuns} verified runs — zero corrections`}
        />
        <StatTile
          label="Held at human gate"
          value={heldObligations.length}
          accent
          hint="mappings from RUN-047 awaiting a signature"
        />
      </div>

      {/* ── RUN-047 — the hero run ── */}
      <section style={{ marginBottom: 36 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <span className="eyebrow">Most recent run — {heroRun.id}, CUSPA amendment re-map</span>
          <Link href="/watchtower" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            view the catch →
          </Link>
        </div>
        <MarkedCard pad={26}>
          <div className="row between wrap" style={{ gap: 14, marginBottom: 20 }}>
            <div className="stack" style={{ gap: 6 }}>
              <div className="row wrap" style={{ gap: 10 }}>
                <Chip tone="live">
                  <span className="dot" data-pulse /> latest run
                </Chip>
                <span className="mono-label dim">
                  {heroRun.id} · triggered by CATCH-005 · started 2026-07-03 11:42 IST
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15.5 }}>
                CUSPA amendment re-map — {heroRun.durationSec} seconds end-to-end, then held at the
                human gate
              </div>
              <span className="small dim60">
                {heroRun.outputs.obligationsCreated.length} obligations extracted ·{" "}
                {heroRun.outputs.tasksCreated.length} remediation tasks drafted ·{" "}
                {heroRun.verifierChecks.filter((c) => c.pass).length}/{heroRun.verifierChecks.length}{" "}
                verifier checks passed · {heldObligations.length} mappings held for signature
              </span>
            </div>
            <Chip tone="pending">awaiting approval</Chip>
          </div>

          <Hairline />
          <div style={{ padding: "20px 2px 0" }}>
            <TraceReplay run={heroRun} />
          </div>

          {/* human-gate hold — what is held, and who it is held for */}
          <div
            className="panel"
            style={{ marginTop: 22, padding: "16px 20px", background: "var(--paper)" }}
          >
            <div className="row between wrap" style={{ gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div className="small" style={{ fontWeight: 600 }}>
                  Held at the human gate
                </div>
                <div className="small dim60" style={{ marginTop: 2 }}>
                  {heldObligations.length} mappings embed material judgement — a board-policy
                  parameter, a prohibition, a discretionary SOP — and are held at pending-review
                  for {complianceOfficer}, Compliance Officer.
                </div>
              </div>
              <div className="row wrap" style={{ gap: 10 }}>
                {heldObligations.map((o) => (
                  <Link key={o.id} href="/register" className="row" style={{ gap: 8 }}>
                    <span className="mono-value">{o.id}</span>
                    <StatusChip status={o.status} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </MarkedCard>
      </section>

      {/* ── architecture placard ── */}
      <section style={{ marginBottom: 36 }}>
        <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
          Pipeline architecture
        </span>
        <MarkedCard pad={26}>
          <div className="row wrap" style={{ gap: 10, marginBottom: 8 }}>
            {PIPELINE_ORDER.map((stage, i) => (
              <span key={stage} className="row" style={{ gap: 10 }}>
                <Chip tone={stage === "human gate" ? "pending" : stage === "verifier" ? "met" : "info"}>
                  {stage}
                </Chip>
                {i < PIPELINE_ORDER.length - 1 ? (
                  <span className="mono-label dim" aria-hidden>
                    →
                  </span>
                ) : null}
              </span>
            ))}
          </div>
          <div className="mono-label dim" style={{ fontSize: 9.5, marginBottom: 20 }}>
            same stage order on every run · each step replayable
          </div>
          <Hairline />
          <div className="grid cols-4" style={{ marginTop: 20 }}>
            {PRINCIPLES.map((p) => (
              <div key={p.n} className="stack" style={{ gap: 8 }}>
                <span className="mono-label" style={{ color: "var(--orange-deep)" }}>
                  {p.n}
                </span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</span>
                <span className="small dim60" style={{ lineHeight: 1.55 }}>
                  {p.body}
                </span>
              </div>
            ))}
          </div>
        </MarkedCard>
      </section>

      {/* ── all runs ── */}
      <section style={{ marginBottom: 34 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <span className="eyebrow">Run history — newest first</span>
          <span className="mono-label dim">click a run to replay its trace</span>
        </div>
        <MarkedCard pad={10}>
          <RunsTable />
        </MarkedCard>
      </section>

      {/* ── cross-links ── */}
      <Hairline />
      <div className="row between wrap" style={{ gap: 12, marginTop: 18 }}>
        <span className="small dim60">
          Every register entry names the run that created it, and every run names the clause it
          read.
        </span>
        <div className="row wrap" style={{ gap: 18 }}>
          <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            obligation register →
          </Link>
          <Link href="/audit" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            hash-chained audit trail →
          </Link>
          <Link href="/watchtower" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            watchtower log →
          </Link>
        </div>
      </div>
    </>
  );
}
