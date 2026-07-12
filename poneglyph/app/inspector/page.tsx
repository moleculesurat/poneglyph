import Link from "next/link";
import { PageHead, StatTile, MarkedCard, Chip, KV, Hairline } from "@/components/ui";
import { DashField } from "@/components/DashField";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import type { ObligationStatus } from "@/lib/schema";
import { InspectorMode } from "./InspectorMode";

/* ── derived, all from static data (sim-today pinned) ─────────────────── */

const counts = obligations.reduce(
  (acc, o) => ((acc[o.status] = (acc[o.status] ?? 0) + 1), acc),
  {} as Record<ObligationStatus, number>
);

const total = obligations.length;
const baseCount = obligations.filter((o) => o.clause.circularId === "MC-SB-2025").length;
const deltaCount = total - baseCount;
const approvedCount = obligations.filter((o) => o.approvedBy).length;
const evidencedCount = obligations.filter((o) => o.evidenceIds.length > 0).length;

const complianceOfficer =
  tenant.team.find((m) => m.role === "Compliance Officer")?.name ?? "—";

/* ── the walk-back: what the inspector can verify at each stop ─────────── */

const WALK_BACK = [
  {
    step: "01",
    href: "/register",
    name: "Obligation register",
    title: "Read every obligation against the clause it came from",
    body:
      "Each of the " +
      total +
      " register entries carries a verbatim clause excerpt with character offsets into the circular text. Open any row, open the cited paragraph, and confirm the obligation says what the regulation says — no paraphrase stands between them.",
    foot: `${total} entries · clause-grounded · ${baseCount} base + ${deltaCount} CUSPA delta`,
  },
  {
    step: "02",
    href: "/evidence",
    name: "Evidence vault",
    title: "Check what actually satisfies each obligation",
    body:
      "Twenty artifacts — documents, data-checks and live scans — each stamped with its connector of origin, capture time and content hash, and bound to the obligations it evidences. Where evidence is absent, the register shows a gap rather than a claim.",
    foot: "20 artifacts · hashed · connector provenance on every item",
  },
  {
    step: "03",
    href: "/audit",
    name: "Audit trail",
    title: "Replay the record's entire history, hash by hash",
    body:
      "Forty hash-chained events from first ingest (Jun 2025) to sim-today: every obligation created, evidence bound, mapping approved and amendment applied, with agent or human attribution. Run the chain verification yourself — a single altered event breaks the chain.",
    foot: "40 events · GENESIS-anchored · agent + human actors attributed",
  },
  {
    step: "04",
    href: "/mcp",
    name: "MCP interface",
    title: "Ask the register the same questions programmatically",
    body:
      "A read-only, inspector-scoped MCP endpoint exposes seven query tools over the identical record this session renders — obligations, mappings, evidence, amendments, gaps. Your own tooling gets byte-for-byte the answers you see here.",
    foot: "7 tools · read-only scope · same record, machine-readable",
  },
] as const;

export default function InspectorPage() {
  return (
    <>
      <InspectorMode />

      <PageHead
        eyebrow={`Inspection session · ${tenant.name}`}
        title={
          <>
            Inspection <span className="accent grad">Session</span>
          </>
        }
        sub={
          <>
            You are reading the live obligation register of one SEBI-registered stock broker in a
            read-only inspection session. The clause citations, evidence hashes and audit chain are
            the record — <b>the prose is only navigation.</b> Nothing on this side of the session
            can approve, edit or upload.
          </>
        }
        right={
          <Chip tone="live">
            <span className="dot" data-pulse /> Read-only session
          </Chip>
        }
      />

      {/* ── tenant identity ── */}
      <MarkedCard pad={24} style={{ marginBottom: 30 }}>
        <div className="row between wrap" style={{ marginBottom: 16, gap: 10 }}>
          <span className="eyebrow">Entity under inspection</span>
          <span className="mono-label dim">sim-today {tenant.simToday}</span>
        </div>
        <div className="grid cols-2" style={{ gap: "10px 40px" }}>
          <KV k="Intermediary">
            {tenant.name} — SEBI-registered {tenant.type.replace("-", " ")}
          </KV>
          <KV k="SEBI reg no">
            <span className="mono-value">{tenant.sebiRegNo}</span>
          </KV>
          <KV k="Exchanges">{tenant.exchanges.join(" · ")}</KV>
          <KV k="QSB status">{tenant.qsb ? "Qualified stock broker" : "Not designated QSB"}</KV>
          <KV k="Active clients">{tenant.activeClients.toLocaleString("en-IN")}</KV>
          <KV k="Registered office">{tenant.city}</KV>
          <KV k="Compliance officer">{complianceOfficer}</KV>
          <KV k="Session scope">
            Read-only — broker-side controls (approvals, task edits, evidence upload) are not
            rendered in this session
          </KV>
        </div>
      </MarkedCard>

      {/* ── posture, computed from the register ── */}
      <section style={{ marginBottom: 34 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <span className="eyebrow">Declared posture — computed, not asserted</span>
          <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            full register →
          </Link>
        </div>
        <div className="grid cols-4">
          <StatTile
            label="Obligations in scope"
            value={total}
            hint={`${baseCount} from Master Circular · ${deltaCount} from Jul 3 CUSPA amendment`}
          />
          <StatTile
            label="Met with bound evidence"
            value={counts.met ?? 0}
            hint={`${Math.round(((counts.met ?? 0) / total) * 100)}% of register · ${evidencedCount} entries carry evidence`}
          />
          <StatTile
            label="Open gaps — declared"
            value={counts.gap ?? 0}
            accent
            hint="all from the Jul 3 amendment · shown, not smoothed over"
          />
          <StatTile
            label="Human-approved mappings"
            value={approvedCount}
            hint={`${counts["pending-review"] ?? 0} pending compliance-officer review · ${counts["at-risk"] ?? 0} at risk`}
          />
        </div>
      </section>

      {/* ── the walk-back ── */}
      <section style={{ marginBottom: 38 }}>
        <div className="row between" style={{ marginBottom: 6 }}>
          <span className="eyebrow">Start the walk-back</span>
        </div>
        <p className="sub small" style={{ maxWidth: "72ch", marginBottom: 16 }}>
          The inspection route runs claim → clause → evidence → history. Take the four stops in
          order, or jump to whichever question you came with.
        </p>
        <div className="grid cols-2" style={{ alignItems: "stretch" }}>
          {WALK_BACK.map((w) => (
            <Link key={w.href} href={w.href} style={{ display: "block", height: "100%" }}>
              <MarkedCard pad={22} style={{ height: "100%" }}>
                <div className="stack" style={{ gap: 10, height: "100%" }}>
                  <div className="row between">
                    <span className="mono-label dim">
                      {w.step} · {w.name}
                    </span>
                    <span className="mono-label" style={{ color: "var(--orange-deep)" }}>
                      open →
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.015em" }}>
                    {w.title}
                  </div>
                  <p className="small dim60" style={{ lineHeight: 1.55, flex: 1 }}>
                    {w.body}
                  </p>
                  <Hairline />
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                    {w.foot}
                  </span>
                </div>
              </MarkedCard>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ecosystem teaser ── */}
      <section>
        <MarkedCard pad={0} style={{ overflow: "hidden" }}>
          <div style={{ position: "relative", padding: "30px 28px" }}>
            <DashField
              rows={10}
              seed={23}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "46%",
                height: "100%",
                opacity: 0.14,
              }}
            />
            <div className="stack" style={{ position: "relative", gap: 14, maxWidth: "68ch" }}>
              <span className="eyebrow">Beyond this tenant — the ecosystem view</span>
              <div className="display" style={{ fontSize: "clamp(24px, 2.6vw, 32px)" }}>
                12 intermediaries. <span className="accent grad">One open ontology.</span>
              </div>
              <p className="sub" style={{ fontSize: 14 }}>
                This session covers one broker. In full deployment, every participating
                intermediary — brokers, investment advisers, AMCs, RTAs, depository participants —
                publishes its register to the same open obligation schema.{" "}
                <b>
                  The same question, asked of twelve firms, returns twelve comparable answers — and
                  zero divergent interpretations of the same circular.
                </b>{" "}
                An inspection stops being a reconciliation of twelve private spreadsheets and
                becomes a single query across the cohort.
              </p>
              <div className="row wrap" style={{ gap: 8 }}>
                <Chip tone="info">stock-broker × 4</Chip>
                <Chip tone="info">investment-adviser × 3</Chip>
                <Chip tone="info">amc × 2</Chip>
                <Chip tone="info">rta × 2</Chip>
                <Chip tone="info">depository-participant × 1</Chip>
              </div>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                Sandbox note — cross-entity view simulated; this session renders one tenant
              </span>
            </div>
          </div>
        </MarkedCard>
      </section>
    </>
  );
}
