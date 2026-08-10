import Link from "next/link";
import { PageHead, StatTile, MarkedCard, Cta, Hairline, KV } from "@/components/ui";
import { auditEvents } from "@/data/audit";
import { tenant } from "@/data/tenant";
import { AuditChain } from "./AuditChain";

/* ── derived, all from static data ────────────────────────────────────── */

const first = auditEvents[0];
const last = auditEvents[auditEvents.length - 1];

const actors = [...new Set(auditEvents.map((e) => e.actor))];
const agentActors = actors.filter((a) => a.startsWith("agent:")).length;
const humanActors = actors.filter((a) => a.startsWith("human:")).length;
const systemActors = actors.filter((a) => a.startsWith("system:")).length;

/* pure-string month span (no Date construction during render) */
const monthSpan =
  (+last.at.slice(0, 4) - +first.at.slice(0, 4)) * 12 +
  (+last.at.slice(5, 7) - +first.at.slice(5, 7));

/* the chain verifies statically too — same check the client animates */
const breaks = auditEvents.filter(
  (e, i) => e.prevHash !== (i === 0 ? "GENESIS" : auditEvents[i - 1].hash)
).length;

export default function AuditPage() {
  return (
    <>
      <PageHead
        eyebrow={`Audit trail · ${tenant.name}`}
        title={
          <>
            Audit <span className="accent grad">Trail</span>
          </>
        }
        sub={
          <>
            Every action the system takes — ingest, extraction, approval, evidence binding — is
            appended here as an event whose hash folds in the previous event&rsquo;s hash. Nothing
            can be edited or deleted without breaking every link that follows.{" "}
            <b>Any alteration is detectable by recomputing the chain.</b>
          </>
        }
        right={<Cta variant="ghost" toastMsg="Export is disabled in the sandbox.">Export chain</Cta>}
      />

      {/* ── posture ── */}
      <div className="grid cols-4" style={{ marginBottom: 30 }}>
        <StatTile
          label="Events chained"
          value={auditEvents.length}
          hint={`${first.id} → ${last.id} · append-only`}
        />
        <StatTile
          label="Chain breaks"
          value={breaks}
          hint="every prevHash matches the hash before it"
        />
        <StatTile
          label="Actors recorded"
          value={actors.length}
          hint={`${agentActors} agents · ${humanActors} human gate · ${systemActors} system`}
        />
        <StatTile
          label="Months covered"
          value={monthSpan}
          hint={`${first.at.slice(0, 10)} → ${last.at.slice(0, 10)}`}
        />
      </div>

      {/* ── how the chain is built ── */}
      <section style={{ marginBottom: 36 }}>
        <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
          How the chain is built
        </span>
        <MarkedCard pad={22}>
          <div className="stack" style={{ gap: 14 }}>
            <span className="mono-value" style={{ color: "var(--ink-60)" }}>
              hash = sha256(id | at | actor | action | subjectType | subjectId | detail | prevHash)
              → first 12 hex
            </span>
            <Hairline />
            <div className="stack" style={{ gap: 8 }}>
              <KV k="Anchor">
                {first.id} carries <span className="hash">prevHash = GENESIS</span> — the chain has
                exactly one origin and no parallel histories.
              </KV>
              <KV k="Linkage">
                Each event&rsquo;s <span className="hash">prevHash</span> must equal the previous
                event&rsquo;s <span className="hash">hash</span>. Rewriting any historic field
                changes that event&rsquo;s hash and orphans every event after it.
              </KV>
              <KV k="Verification">
                Runs entirely in this browser against the {auditEvents.length} recorded events — no
                server is trusted, the same walk an inspector would perform.
              </KV>
            </div>
          </div>
        </MarkedCard>
      </section>

      {/* ── the chain ── */}
      <AuditChain events={auditEvents} />

      {/* ── cross-links ── */}
      <Hairline />
      <div className="row wrap" style={{ gap: 22, marginTop: 18 }}>
        <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          obligation register →
        </Link>
        <Link href="/evidence" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          evidence vault →
        </Link>
        <Link href="/agents" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          pipeline runs →
        </Link>
      </div>
    </>
  );
}
