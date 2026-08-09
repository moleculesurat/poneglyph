import Link from "next/link";
import { PageHead, StatTile, MarkedCard, Chip, StatusChip, Hairline, Cta } from "@/components/ui";
import { DashField } from "@/components/DashField";
import { DeadlineRunway } from "@/app/DeadlineRunway";
import { obligations } from "@/data/obligations";
import { catches } from "@/data/watchtower";
import { runs } from "@/data/runs";
import { factOf } from "@/data/entity";
import { tenant } from "@/data/tenant";
import { CHAPTER_LABEL, SEBI_DOMAINS, partOf } from "@/lib/domains";
import type { ChapterKey, ObligationStatus } from "@/lib/schema";

/* ── derived, all from static data (sim-today pinned) ─────────────────── */

const counts = obligations.reduce(
  (acc, o) => ((acc[o.status] = (acc[o.status] ?? 0) + 1), acc),
  {} as Record<ObligationStatus, number>
);

/* the Jul 3 CUSPA amendment's footprint on the register — derived, so the
   alert card can never drift from the data behind it */
const remapped = obligations.filter((o) => o.clause.circularId !== "MC-SB-2025").length;
const untouched = obligations.length - remapped;

/* labels come from the single source of truth; the dashboard only adds a
   CUSPA date-stamp to the one chapter the Jul 3 amendment rewrote */
const CHAPTER_TITLES: Record<ChapterKey, string> = {
  ...CHAPTER_LABEL,
  "unpaid-securities": "Unpaid Securities (CUSPA — amended Jul 3)",
};

/* the register, rolled up the way the Master Circular is organised:
   Part I–X → chapter → obligation. Parts carrying nothing are dropped
   here (the register page shows them dashed instead). */
const PART_GROUPS = SEBI_DOMAINS.map((d) => ({
  part: d.part,
  title: d.title,
  chapters: d.chapters.filter((ch) => obligations.some((o) => o.clause.chapter === ch)),
  rows: obligations.filter((o) => partOf(o.clause.chapter) === d.part),
})).filter((g) => g.rows.length > 0);

/* verified public facts about the tenant — each one carries provenance in
   data/entity.ts; absent facts render as absent rather than as filler */
const TENANT_FACTS = [
  factOf("listing"),
  factOf("net-worth-fy26"),
  factOf("client-base-total"),
].filter((f) => f !== undefined);

const STATUS_CELL: Record<ObligationStatus, React.CSSProperties> = {
  met: { background: "var(--ink-10)" },
  "at-risk": { background: "var(--orange-soft)", boxShadow: "inset 0 0 0 1.5px var(--orange)" },
  gap: { background: "var(--orange)" },
  "pending-review": { background: "transparent", boxShadow: "inset 0 0 0 1.5px var(--ink-20)", borderStyle: "dashed" },
  /* a live-pipeline draft the officer turned down — it never enters this heat-map,
     but the union must stay exhaustive */
  rejected: { background: "transparent", boxShadow: "inset 0 0 0 1.5px var(--ink-10)" },
};

export default function Overview() {
  const latestRun = runs[runs.length - 1];

  return (
    <>
      <PageHead
        eyebrow={`${tenant.name} · ${tenant.sebiRegNo} (declared)`}
        title={
          <>
            Compliance <span className="accent grad">Dashboard</span>
          </>
        }
        sub={
          <>
            Register posture, upcoming deadlines and the latest regulatory events for one
            SEBI-registered stock broker. <b>Orange means something needs you.</b>
          </>
        }
        right={<Cta variant="ghost">Export register</Cta>}
      />

      {/* ── amendment alert ── */}
      <Link href="/amendments">
        <MarkedCard pad={18} style={{ marginBottom: 26 }}>
          <div className="row between wrap">
            <div className="row" style={{ gap: 14 }}>
              <Chip tone="gap">
                <span className="dot" data-pulse /> Amendment
              </Chip>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                  SEBI amended Para 46 — unpaid securities now run on a pledge-based CUSPA regime
                </div>
                <div className="small dim60">
                  Circular HO/38/11/(9)2026-MIRSD-POD/I/15382/2026 · issued 2026-07-03 · caught by
                  Watchtower 9 days ago · {remapped} obligations re-mapped, {untouched} untouched
                </div>
              </div>
            </div>
            <span className="mono-label" style={{ color: "var(--orange-deep)" }}>
              View the diff →
            </span>
          </div>
        </MarkedCard>
      </Link>

      {/* ── tenant line — real entity, simulated posture ── */}
      <div className="panel" style={{ padding: "13px 18px", marginBottom: 26 }}>
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="stack" style={{ gap: 6, minWidth: 0 }}>
            <div className="row wrap" style={{ gap: 10 }}>
              <span className="small" style={{ fontWeight: 600 }}>
                {tenant.name}
              </span>
              <span className="chip" data-tone="info">
                verified · public filings
              </span>
              {TENANT_FACTS.map((f) => (
                <span key={f.key} className="mono-label dim" style={{ fontSize: 9.5 }}>
                  {f.label} {f.value}
                </span>
              ))}
            </div>
            <span className="small dim60" style={{ maxWidth: "88ch" }}>
              An illustrative onboarding of a real listed intermediary. Identity, listing and
              financials are read from public filings and each fact carries its source; the
              compliance posture on this dashboard — obligations met or gapped, evidence,
              remediation — is <b>simulated for the sandbox</b> and asserts nothing about the
              firm&rsquo;s actual compliance.
            </span>
          </div>
          <Link href="/onboarding" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            entity profile →
          </Link>
        </div>
      </div>

      {/* ── posture ── */}
      <div className="grid cols-4" style={{ marginBottom: 30 }}>
        <StatTile label="Obligations tracked" value={obligations.length} hint="Master Circular + CUSPA amendment" />
        <StatTile label="Met with evidence" value={counts.met ?? 0} hint={`${Math.round(((counts.met ?? 0) / obligations.length) * 100)}% of register`} />
        <StatTile label="Open gaps" value={counts.gap ?? 0} accent hint="all from the Jul 3 amendment" />
        <StatTile
          label="Needs attention"
          value={(counts["at-risk"] ?? 0) + (counts["pending-review"] ?? 0)}
          hint={`${counts["at-risk"] ?? 0} at risk · ${counts["pending-review"] ?? 0} pending review`}
        />
      </div>

      {/* ── deadline runway ── */}
      <section style={{ marginBottom: 34 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <span className="eyebrow">Deadline runway — every open due date, drag to scroll</span>
          <span className="mono-label dim">sim-today {tenant.simToday}</span>
        </div>
        <MarkedCard pad={14}>
          <DeadlineRunway />
        </MarkedCard>
      </section>

      <div className="grid cols-2" style={{ alignItems: "start", marginBottom: 34 }}>
        {/* ── heat-map, rolled up by Part of the Master Circular ── */}
        <section>
          <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
            Register by SEBI Part
          </span>
          <MarkedCard pad={22}>
            <div className="stack" style={{ gap: 18 }}>
              {PART_GROUPS.map((g) => (
                <div key={g.part} className="stack" style={{ gap: 9 }}>
                  <div className="row between" style={{ gap: 10 }}>
                    <Link href={`/register?part=${g.part}`} className="mono-label">
                      Part {g.part} · {g.title}
                    </Link>
                    <span className="mono-label dim" style={{ fontSize: 9.5, flex: "none" }}>
                      {g.rows.filter((o) => o.status === "met").length}/{g.rows.length} met
                    </span>
                  </div>
                  <div
                    className="stack"
                    style={{ gap: 11, paddingLeft: 13, borderLeft: "1.5px solid var(--ink-10)" }}
                  >
                    {g.chapters.map((ch) => {
                      const rows = obligations.filter((o) => o.clause.chapter === ch);
                      return (
                        <div key={ch}>
                          <div className="row between" style={{ marginBottom: 6, gap: 10 }}>
                            <Link
                              href={`/register?part=${g.part}&chapter=${ch}`}
                              className="small"
                              style={{ fontWeight: 500 }}
                            >
                              {CHAPTER_TITLES[ch]}
                            </Link>
                            <span
                              className="mono-label dim"
                              style={{ fontSize: 9.5, flex: "none" }}
                            >
                              {rows.filter((o) => o.status === "met").length}/{rows.length} met
                            </span>
                          </div>
                          <div className="row wrap" style={{ gap: 5 }}>
                            {rows.map((o) => (
                              <Link
                                key={o.id}
                                href={`/register?part=${g.part}&chapter=${ch}&id=${o.id}`}
                                title={`${o.id} — ${o.title} (${o.status})`}
                                style={{
                                  width: 22, height: 14, borderRadius: 3, display: "block",
                                  ...STATUS_CELL[o.status],
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Hairline />
              <div className="row wrap" style={{ gap: 14 }}>
                {(["met", "at-risk", "gap", "pending-review"] as const).map((s) => (
                  <Link key={s} href={`/register?status=${s}`} className="row" style={{ gap: 6 }}>
                    <span style={{ width: 14, height: 10, borderRadius: 2, ...STATUS_CELL[s] }} />
                    <span className="mono-label dim" style={{ fontSize: 9.5 }}>{s}</span>
                  </Link>
                ))}
              </div>
              <span className="small dim60">
                {PART_GROUPS.length} of the circular&rsquo;s {SEBI_DOMAINS.length} Parts carry
                obligations on this register. The other {SEBI_DOMAINS.length - PART_GROUPS.length}{" "}
                are scoped, not forgotten —{" "}
                <Link href="/register" style={{ color: "var(--orange-deep)" }}>
                  see the full Part filter →
                </Link>
              </span>
            </div>
          </MarkedCard>
        </section>

        {/* ── watchtower feed ── */}
        <section>
          <div className="row between" style={{ marginBottom: 14 }}>
            <span className="eyebrow">Latest from the Watchtower</span>
            <Link href="/watchtower" className="mono-label" style={{ color: "var(--orange-deep)" }}>
              live log →
            </Link>
          </div>
          <div className="stack">
            {catches.slice(0, 4).map((c) => (
              <Link key={c.id} href="/watchtower">
                <div className="panel pad" style={{ padding: "14px 18px" }}>
                  <div className="row between wrap" style={{ gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="small" style={{ fontWeight: 600 }}>{c.title}</div>
                      <div className="mono-label dim" style={{ fontSize: 9.5, marginTop: 3 }}>
                        {c.circularNumber} · fetched {c.fetchedAt.slice(0, 10)}
                      </div>
                    </div>
                    <Chip
                      tone={
                        c.applicability.verdict === "applies"
                          ? "at-risk"
                          : c.applicability.verdict === "partial"
                            ? "pending"
                            : "info"
                      }
                    >
                      {c.applicability.verdict}
                    </Chip>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ── latest agent run ── */}
      <section>
        <div className="row between" style={{ marginBottom: 14 }}>
          <span className="eyebrow">Agent pipeline</span>
          <Link href="/agents" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            all runs →
          </Link>
        </div>
        <MarkedCard pad={0} style={{ overflow: "hidden" }}>
          <div style={{ position: "relative", padding: 22 }}>
            <DashField
              rows={8}
              seed={11}
              style={{ position: "absolute", right: 0, top: 0, width: "42%", height: "100%", opacity: 0.16 }}
            />
            <div className="row between wrap" style={{ position: "relative" }}>
              <div className="stack" style={{ gap: 4 }}>
                <span className="mono-label dim">{latestRun.id} · {latestRun.trigger}</span>
                <span style={{ fontWeight: 600 }}>
                  {latestRun.status === "awaiting-approval"
                    ? "Awaiting compliance-officer approval"
                    : latestRun.status === "completed"
                      ? "Completed — register up to date"
                      : "Failed"}
                </span>
                <span className="small dim60">
                  {latestRun.steps.length} trace steps · {latestRun.verifierChecks.filter((v) => v.pass).length}/
                  {latestRun.verifierChecks.length} verifier checks passed · {latestRun.durationSec}s
                </span>
              </div>
              <div className="row wrap" style={{ gap: 8 }}>
                {obligations
                  .filter((o) => o.status === "pending-review")
                  .map((o) => (
                    <Link key={o.id} href={`/register?id=${o.id}`}>
                      <StatusChip status={o.status} />
                    </Link>
                  ))}
                <Link href="/agents" className="cta" data-variant="orange">
                  Replay the trace <span className="arrow">→</span>
                </Link>
              </div>
            </div>
          </div>
        </MarkedCard>
      </section>
    </>
  );
}
