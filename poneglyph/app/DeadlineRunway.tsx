"use client";

/* Deadline runway — horizontally draggable timeline (embla-carousel,
   dragFree). Milestones are the computed due dates passed in from the
   dashboard; nothing is anchored by hand. Wide inner canvas; drag during a
   demo to walk the months ahead. */

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";

interface Milestone {
  at: string;
  label: string;
  note: string;
  href: string;
}

const DAY = 86400000;
const CANVAS = 2080; // px — ~2.3 viewports, worth dragging

/* month ticks spanning the timeline */
function monthsBetween(t0: number, t1: number): { at: string; label: string }[] {
  const out: { at: string; label: string }[] = [];
  const d = new Date(t0);
  d.setUTCDate(1);
  while (d.getTime() <= t1) {
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-GB", { month: "short", year: d.getUTCMonth() === 0 ? "numeric" : undefined, timeZone: "UTC" });
    out.push({ at: iso, label });
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

export function DeadlineRunway({ milestones, today }: { milestones: Milestone[]; today: string }) {
  const [viewportRef] = useEmblaCarousel({ dragFree: true, containScroll: "trimSnaps", watchDrag: true });

  const sorted = [...milestones].sort((a, b) => a.at.localeCompare(b.at));
  const T0 = Date.parse(today);
  const T1 = sorted.length ? Date.parse(sorted[sorted.length - 1].at) + 14 * DAY : T0 + 60 * DAY;
  const SPAN = T1 - T0 || 1;
  const x = (iso: string) => ((Date.parse(iso) - T0) / SPAN) * (CANVAS - 120) + 40;
  const MONTHS = monthsBetween(T0, T1);

  return (
    <div style={{ position: "relative" }}>
      <div ref={viewportRef} className="runway-viewport" style={{ overflow: "hidden", borderRadius: 10 }}>
        <div style={{ display: "flex" }}>
          <div style={{ flex: "0 0 auto", width: CANVAS, position: "relative", height: 196, padding: "6px 0 0" }}>
            {/* baseline */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 96, height: 2, background: "var(--ink-10)" }} />

            {/* month ticks */}
            {MONTHS.map((m) => (
              <div key={m.at} style={{ position: "absolute", left: x(m.at), top: 96 }}>
                <div style={{ width: 1.5, height: 8, background: "var(--ink-20)" }} />
                <span className="mono-label dim" style={{ fontSize: 8.5, position: "absolute", top: 10, left: 0, whiteSpace: "nowrap" }}>
                  {m.label}
                </span>
              </div>
            ))}

            {/* today */}
            <div style={{ position: "absolute", left: x(today), top: 78 }}>
              <div style={{ width: 2, height: 38, background: "var(--ink)" }} />
              <span className="mono-label" style={{ fontSize: 9.5, position: "absolute", top: 42, left: -4, whiteSpace: "nowrap" }}>
                today
              </span>
            </div>

            {/* milestones, alternating above/below */}
            {sorted.map((m, i) => (
              <Link key={`${m.at}-${m.label}`} href={m.href} draggable={false}>
                <div style={{ position: "absolute", left: x(m.at), top: 0, bottom: 0 }}>
                  <div style={{ position: "absolute", left: -1, width: 2, top: i % 2 ? 108 : 58, height: i % 2 ? 16 : 32, background: "var(--ink-10)" }} />
                  <div style={{ position: "absolute", top: i % 2 ? 128 : 8, transform: "translateX(-50%)", textAlign: "center", width: 168 }}>
                    <div className="small" style={{ fontWeight: 600, fontSize: 11.5, lineHeight: 1.3 }}>
                      {m.label}
                    </div>
                    <div className="mono-label dim" style={{ fontSize: 8.5, marginTop: 2 }}>
                      {m.at} · {m.note}
                    </div>
                  </div>
                  <div style={{ position: "absolute", top: 91, left: -6, width: 12, height: 12, borderRadius: "50%", background: "var(--white)", border: "3px solid var(--orange)" }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* edge fades + drag hint */}
      <div className="runway-fade" data-side="left" />
      <div className="runway-fade" data-side="right" />
      <span className="chip" data-tone="info" style={{ position: "absolute", right: 10, top: 6, background: "var(--white)" }}>
        ◂ drag ▸
      </span>
    </div>
  );
}
