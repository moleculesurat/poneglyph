"use client";

/* Deadline runway — horizontally draggable timeline (embla-carousel,
   dragFree). Milestones derive from live data: every remediation-task due
   date plus the CUSPA regime anchors. Wide inner canvas; drag during a
   demo to walk the next 200+ days. */

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { tasks } from "@/data/tasks";
import { tenant } from "@/data/tenant";

interface Milestone {
  at: string;
  label: string;
  note: string;
  href: string;
}

const ANCHORS: Milestone[] = [
  {
    at: "2026-08-02",
    label: "Exchange operational guidelines due",
    note: "30d from circular",
    href: "/amendments",
  },
  {
    at: "2026-11-02",
    label: "CUSPA phase 1 in force",
    note: "paras 46.1–46.11 · 7 obligations",
    href: "/register?chapter=unpaid-securities",
  },
  {
    at: "2027-01-03",
    label: "CUSPA phase 2 in force",
    note: "paras 46.12–46.14 · 2 obligations",
    href: "/register?chapter=unpaid-securities",
  },
];

const MILESTONES: Milestone[] = [
  ...ANCHORS,
  ...tasks
    .filter((t) => t.status !== "done")
    .map((t) => ({
      at: t.due,
      label: t.title,
      note: `${t.id} · ${t.owner}`,
      href: "/remediation",
    })),
].sort((a, b) => a.at.localeCompare(b.at));

/* time scale: sim-today → a fortnight past the last milestone */
const T0 = Date.parse(tenant.simToday);
const T1 = Date.parse(MILESTONES[MILESTONES.length - 1].at) + 14 * 86400000;
const SPAN = T1 - T0;
const CANVAS = 2080; // px — ~2.3 viewports, worth dragging
const x = (iso: string) => ((Date.parse(iso) - T0) / SPAN) * (CANVAS - 120) + 40;

/* month ticks along the baseline */
const MONTHS: { at: string; label: string }[] = [
  { at: "2026-08-01", label: "Aug 2026" },
  { at: "2026-09-01", label: "Sep" },
  { at: "2026-10-01", label: "Oct" },
  { at: "2026-11-01", label: "Nov" },
  { at: "2026-12-01", label: "Dec" },
  { at: "2027-01-01", label: "Jan 2027" },
];

export function DeadlineRunway() {
  const [viewportRef] = useEmblaCarousel({
    dragFree: true,
    containScroll: "trimSnaps",
    watchDrag: true,
  });

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={viewportRef}
        className="runway-viewport"
        style={{ overflow: "hidden", borderRadius: 10 }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              flex: "0 0 auto",
              width: CANVAS,
              position: "relative",
              height: 196,
              padding: "6px 0 0",
            }}
          >
            {/* baseline */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 96, height: 2, background: "var(--ink-10)" }} />

            {/* month ticks */}
            {MONTHS.map((m) => (
              <div key={m.at} style={{ position: "absolute", left: x(m.at), top: 96 }}>
                <div style={{ width: 1.5, height: 8, background: "var(--ink-20)" }} />
                <span
                  className="mono-label dim"
                  style={{ fontSize: 8.5, position: "absolute", top: 10, left: 0, whiteSpace: "nowrap" }}
                >
                  {m.label}
                </span>
              </div>
            ))}

            {/* today */}
            <div style={{ position: "absolute", left: x(tenant.simToday), top: 78 }}>
              <div style={{ width: 2, height: 38, background: "var(--ink)" }} />
              <span
                className="mono-label"
                style={{ fontSize: 9.5, position: "absolute", top: 42, left: -4, whiteSpace: "nowrap" }}
              >
                today
              </span>
            </div>

            {/* milestones, alternating above/below */}
            {MILESTONES.map((m, i) => (
              <Link key={`${m.at}-${m.label}`} href={m.href} draggable={false}>
                <div style={{ position: "absolute", left: x(m.at), top: 0, bottom: 0 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: -1,
                      width: 2,
                      top: i % 2 ? 108 : 58,
                      height: i % 2 ? 16 : 32,
                      background: "var(--ink-10)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: i % 2 ? 128 : 8,
                      transform: "translateX(-50%)",
                      textAlign: "center",
                      width: 168,
                    }}
                  >
                    <div className="small" style={{ fontWeight: 600, fontSize: 11.5, lineHeight: 1.3 }}>
                      {m.label}
                    </div>
                    <div className="mono-label dim" style={{ fontSize: 8.5, marginTop: 2 }}>
                      {m.at} · {m.note}
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: 91,
                      left: -6,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "var(--white)",
                      border: "3px solid var(--orange)",
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* edge fades + drag hint */}
      <div className="runway-fade" data-side="left" />
      <div className="runway-fade" data-side="right" />
      <span
        className="chip"
        data-tone="info"
        style={{ position: "absolute", right: 10, top: 6, background: "var(--white)" }}
      >
        ◂ drag ▸
      </span>
    </div>
  );
}
