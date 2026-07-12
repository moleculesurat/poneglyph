import Link from "next/link";
import { PageHead, StatTile, Cta, Hairline } from "@/components/ui";
import { tasks } from "@/data/tasks";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import { TaskBoard } from "./TaskBoard";

/* ── derived, all from static data (sim-today pinned) ─────────────────── */

const openN = tasks.filter((t) => t.status === "open").length;
const inFlightN = tasks.filter((t) => t.status === "in-progress").length;
const highN = tasks.filter((t) => t.priority === "high").length;
const overdueN = tasks.filter(
  (t) => t.status === "overdue" || t.due < tenant.simToday
).length;
const fromCuspaRun = tasks.filter((t) => t.createdByRun === "RUN-047").length;
const earliestDue = tasks.map((t) => t.due).sort()[0];
const unevidencedN = obligations.filter((o) => o.evidenceIds.length === 0).length;

export default function Remediation() {
  return (
    <>
      <PageHead
        eyebrow={`Remediation · ${tenant.name}`}
        title={
          <>
            Remediation <span className="accent grad">Task Queue</span>
          </>
        }
        sub={
          <>
            Nine tasks in flight — seven raised by RUN-047 within minutes of the CUSPA amendment
            landing, two older register findings still closing. Each one is chained task ←
            obligation ← clause, so nothing in the queue exists without a paragraph of the
            circular demanding it. <b>Orange means a date has slipped.</b>
          </>
        }
        right={<Cta variant="ghost">Export queue</Cta>}
      />

      {/* ── posture ── */}
      <div className="grid cols-4" style={{ marginBottom: 30 }}>
        <StatTile
          label="Tasks in queue"
          value={tasks.length}
          hint={`${openN} open · ${inFlightN} in progress`}
        />
        <StatTile
          label="Raised by RUN-047"
          value={fromCuspaRun}
          hint="the Jul 3 CUSPA amendment, auto-opened"
        />
        <StatTile
          label="High priority"
          value={highN}
          hint={`earliest due ${earliestDue}`}
        />
        <StatTile
          label="Overdue"
          value={overdueN}
          accent={overdueN > 0}
          hint={
            overdueN > 0
              ? "past due — clear these first"
              : "nothing past due as of sim-today"
          }
        />
      </div>

      {/* ── the queue (list / kanban) ── */}
      <TaskBoard />

      {/* ── evidence gap callout ── */}
      <div className="panel pad" style={{ marginBottom: 36 }}>
        <div className="row between wrap" style={{ gap: 12 }}>
          <span className="small dim60" style={{ maxWidth: "68ch" }}>
            {unevidencedN} obligations currently hold no bound evidence — this queue is the
            closing motion. As each task completes, the artifact it produces is bound in the
            evidence vault and the register entry moves off gap.
          </span>
          <Link href="/evidence" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            evidence vault →
          </Link>
        </div>
      </div>

      {/* ── cross-links ── */}
      <Hairline />
      <div className="row wrap" style={{ gap: 22, marginTop: 18 }}>
        <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          obligation register →
        </Link>
        <Link href="/agents" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          pipeline runs →
        </Link>
        <Link href="/amendments" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          CUSPA redline →
        </Link>
      </div>
    </>
  );
}
