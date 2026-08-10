import Link from "next/link";
import { PageHead, StatTile, MarkedCard, Chip, Hairline } from "@/components/ui";
import { evidence } from "@/data/evidence";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import { EvidenceExplorer, UploadCta } from "./EvidenceExplorer";

/* ── derived, all from static data (sim-today pinned) ─────────────────── */

const nDocs = evidence.filter((e) => e.kind === "document").length;
const nChecks = evidence.filter((e) => e.kind === "data-check").length;
const nScans = evidence.filter((e) => e.kind === "live-scan").length;

const evidenced = obligations.filter((o) => o.evidenceIds.length > 0).length;
const unevidenced = obligations.filter((o) => o.evidenceIds.length === 0);
const gapCount = unevidenced.filter((o) => o.status === "gap").length;
const pendingCount = unevidenced.filter((o) => o.status === "pending-review").length;
const riskCount = unevidenced.filter((o) => o.status === "at-risk").length;

export default function EvidencePage() {
  return (
    <>
      <PageHead
        eyebrow={`Evidence vault · ${tenant.name}`}
        title={
          <>
            Evidence <span className="accent grad">Vault</span>
          </>
        }
        sub={
          <>
            Every obligation in the register points at the artifact that proves it — documents
            uploaded once, data-checks re-run against systems of record, live scans probing the
            perimeter. Each artifact is content-hashed, and every re-verification appends to its
            history. <b>Orange marks an artifact bound to an obligation that needs attention.</b>
          </>
        }
        right={<UploadCta />}
      />

      {/* ── vault by kind ── */}
      <div className="grid cols-4" style={{ marginBottom: 26 }}>
        <StatTile label="Documents" value={nDocs} hint="uploaded once via manual-upload" />
        <StatTile
          label="Data checks"
          value={nChecks}
          hint="connector queries against systems of record"
        />
        <StatTile label="Live scans" value={nScans} hint="poneglyph-scan engine · re-run on schedule" />
        <StatTile
          label="Register coverage"
          value={`${evidenced} / ${obligations.length}`}
          hint={`${unevidenced.length} obligations awaiting artifacts`}
        />
      </div>

      {/* ── evidence gap callout ── */}
      <MarkedCard pad={18} style={{ marginBottom: 30 }}>
        <div className="row between wrap" style={{ gap: 14, alignItems: "center" }}>
          <div className="row wrap" style={{ gap: 14, alignItems: "flex-start", minWidth: 0 }}>
            <Chip tone="gap">
              <span className="dot" data-pulse /> Evidence gap
            </Chip>
            <div className="stack" style={{ gap: 6, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                {gapCount} open gaps carry no bound evidence — {unevidenced.length} obligations
                awaiting artifacts in all
              </div>
              <div className="small dim60">
                Every one traces to the Jul 3 CUSPA amendment: {gapCount} gaps, {pendingCount}{" "}
                pending review, {riskCount} at risk. Remediation tasks are queued with owners and
                the circular&apos;s own deadlines.
              </div>
              <div className="row wrap" style={{ gap: 10, marginTop: 2 }}>
                {unevidenced.map((o) => (
                  <Link
                    key={o.id}
                    href="/register"
                    className="mono-value"
                    style={{ fontSize: 11, color: "var(--orange-deep)" }}
                  >
                    {o.id}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link href="/remediation" className="cta" data-variant="orange">
            Open the remediation queue <span className="arrow">→</span>
          </Link>
        </div>
      </MarkedCard>

      {/* ── the vault ── */}
      <section>
        <div className="row between" style={{ marginBottom: 14 }}>
          <span className="eyebrow">Vault inventory — {evidence.length} artifacts</span>
          <span className="mono-label dim">sim-today {tenant.simToday}</span>
        </div>
        <EvidenceExplorer />
      </section>

      {/* ── cross-links ── */}
      <div style={{ marginTop: 38 }}>
        <Hairline />
        <div className="row wrap" style={{ gap: 26, marginTop: 18 }}>
          <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            obligation register →
          </Link>
          <Link href="/audit" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            hash-chained audit trail →
          </Link>
          <Link href="/remediation" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            remediation queue →
          </Link>
        </div>
      </div>
    </>
  );
}
