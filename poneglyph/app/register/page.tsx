import { Suspense } from "react";
import Link from "next/link";
import { PageHead, StatTile, Cta, Hairline } from "@/components/ui";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import { SEBI_DOMAINS } from "@/lib/domains";
import type { ObligationStatus } from "@/lib/schema";
import { RegisterTable } from "./RegisterTable";

/* ── derived, all from static data ─────────────────────────────────────── */

const counts = obligations.reduce(
  (acc, o) => ((acc[o.status] = (acc[o.status] ?? 0) + 1), acc),
  {} as Record<ObligationStatus, number>
);

const countFor = (id: string) => obligations.filter((o) => o.clause.circularId === id).length;

const gaps = obligations.filter((o) => o.status === "gap");

const CROSS_LINKS = [
  { href: "/evidence", label: "Evidence vault" },
  { href: "/remediation", label: "Remediation queue" },
  { href: "/amendments", label: "Amendments" },
  { href: "/agents", label: "Agent runs" },
] as const;

export default function RegisterPage() {
  return (
    <>
      <PageHead
        eyebrow={`Obligation register · ${tenant.name}`}
        title={
          <>
            Obligation <span className="accent grad">Register</span>
          </>
        }
        sub={
          <>
            {obligations.length} approved duties across {SEBI_DOMAINS.length} rulebooks. Each row
            is grounded to a clause, mapped to a control, and bound to evidence.{" "}
            <b>Expand a row for the full walk-back; open the clause to read it in the corpus.</b>
          </>
        }
        right={<Cta variant="ghost">Export filtered view</Cta>}
      />

      {/* ── posture strip ── */}
      <div className="grid cols-4" style={{ marginBottom: 26 }}>
        <StatTile
          label="On register"
          value={obligations.length}
          hint={`${countFor("MC-PM-2025")} PMS · ${countFor("MC-AIF-2026")} AIF`}
        />
        <StatTile
          label="Met with evidence"
          value={counts.met ?? 0}
          hint={`${Math.round(((counts.met ?? 0) / obligations.length) * 100)}% of register`}
        />
        <StatTile
          label="Open gaps"
          value={counts.gap ?? 0}
          accent
          hint={`${gaps.filter((o) => o.clause.circularId === "MC-PM-2025").length} PMS · ${gaps.filter((o) => o.clause.circularId === "MC-AIF-2026").length} AIF`}
        />
        <StatTile
          label="Pending review"
          value={counts["pending-review"] ?? 0}
          hint={`agent-proposed · ${counts["at-risk"] ?? 0} more at risk`}
        />
      </div>

      {/* ── filters + table + clause drawer (client) ──
          Suspense: RegisterTable reads useSearchParams, which bails the
          static prerender out to CSR up to this boundary. */}
      <Suspense
        fallback={<span className="mono-label dim">loading the register…</span>}
      >
        <RegisterTable />
      </Suspense>

      {/* ── cross-links ── */}
      <div style={{ marginTop: 34 }}>
        <Hairline />
        <div className="row between wrap" style={{ marginTop: 22, gap: 16 }}>
          <span className="eyebrow">Traceability — related records</span>
          <div className="row wrap" style={{ gap: 22 }}>
            {CROSS_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="mono-label">
                {l.label} <span style={{ color: "var(--orange)" }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
