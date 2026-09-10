/* Stage 5 — SCHEDULE. Due dates derived only from words in the approved
   register's own excerpt; nothing is guessed. Pure functions, no React. */

import type { Obligation } from "@/lib/schema";

export type Period = "monthly" | "quarterly" | "half-yearly" | "annual";
export interface Schedule {
  period: Period;
  windowDays?: number;
  windowMonths?: number;
  dayType: "calendar" | "working";
  anchor: "period-end" | "event";
  note: string;
}

export const TODAY = new Date().toISOString().slice(0, 10); // build date — pages are static; label it as such

const NUMW: Record<string, number> = { seven: 7, ten: 10, fifteen: 15, thirty: 30, "forty-five": 45, sixty: 60, ninety: 90 };
const NUMTOK = "\\d+|seven|ten|fifteen|thirty|forty-five|sixty|ninety";
const WINDOW = new RegExp(`within[\\s\\[]*?(${NUMTOK})\\b[^.]*?(days?|months?)`);
const PERIOD_END_WORD = /^(month|quarter|year|half|march|september|end)$/;

function periodFrom(text: string): Period | null {
  if (/each month|every month|monthly|in a month|in that month/.test(text)) return "monthly";
  if (/quarter/.test(text)) return "quarterly";
  if (/half[- ]year|september 30 and march 31/.test(text)) return "half-yearly";
  if (/financial year|annual|every year|end of march/.test(text)) return "annual";
  return null;
}

export function parseSchedule(o: Obligation): Schedule | null {
  if (o.type !== "periodic") return null;
  const text = o.clause.excerpt.toLowerCase();

  let period = periodFrom(text);
  const freq = (o.frequency ?? "").toLowerCase() as Period;
  if (!period && (["monthly", "quarterly", "half-yearly", "annual"] as string[]).includes(freq)) period = freq;

  const w = text.match(WINDOW);
  const dayType = w && /working/.test(w[0]) ? "working" : "calendar";
  let windowDays: number | undefined;
  let windowMonths: number | undefined;
  if (w) {
    const n = NUMW[w[1]] ?? parseInt(w[1], 10);
    if (w[2].startsWith("month")) windowMonths = n;
    else windowDays = n;
  }

  const ev = text.match(/from the date of (\w+)/);
  const anchor = ev && !PERIOD_END_WORD.test(ev[1]) ? "event" : "period-end";

  // ponytail: an event schedule (from a non-period-end date) carries no period of its own; the period is cosmetic and unused (nextDue → null)
  if (!period) period = anchor === "event" ? "monthly" : null as unknown as Period;
  if (!period) return null;

  const wt = windowMonths
    ? `${windowMonths} month${windowMonths > 1 ? "s" : ""}`
    : windowDays
      ? `${windowDays} ${dayType === "working" ? "working " : ""}day${windowDays > 1 ? "s" : ""}`
      : "";
  const ENDS: Record<Period, string> = { monthly: "month-end", quarterly: "quarter-end", "half-yearly": "half-year end (30 Sep)", annual: "FY end (31 Mar)" };
  const note =
    anchor === "event" ? `${wt} after each ${ev![1]} (event-anchored)`
    : !wt ? "by period end (no filing window stated)"
    : `${wt} after ${ENDS[period]}`;

  return { period, windowDays, windowMonths, dayType, anchor, note };
}

const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0));
const iso = (d: Date) => d.toISOString().slice(0, 10);

function currentPeriodEnd(today: Date, p: Period): Date {
  const y = today.getUTCFullYear(), m = today.getUTCMonth();
  if (p === "monthly") return lastDay(y, m);
  if (p === "quarterly") return lastDay(y, m - (m % 3) + 2);
  if (p === "half-yearly") return m >= 3 && m <= 8 ? lastDay(y, 8) : m >= 9 ? lastDay(y + 1, 2) : lastDay(y, 2);
  return m >= 3 ? lastDay(y + 1, 2) : lastDay(y, 2); // annual: first 31 Mar on/after today
}

function nextPeriodEnd(end: Date, p: Period): Date {
  const after = new Date(end.getTime() + 86400000);
  return currentPeriodEnd(after, p);
}

const STEP: Record<Period, number> = { monthly: 1, quarterly: 3, "half-yearly": 6, annual: 12 };

/* most recent period end on or before today (today itself if it is a period end);
   nextDue starts here so an open filing window is never skipped */
function lastPeriodEnd(today: Date, p: Period): Date {
  const end = currentPeriodEnd(today, p);
  return iso(end) === iso(today) ? end : lastDay(end.getUTCFullYear(), end.getUTCMonth() - STEP[p]);
}

function addWindow(end: Date, s: Schedule): Date {
  if (s.windowMonths) return lastDay(end.getUTCFullYear(), end.getUTCMonth() + s.windowMonths); // clamp to month end
  if (!s.windowDays) return end;
  if (s.dayType === "calendar") return new Date(end.getTime() + s.windowDays * 86400000);
  const d = new Date(end); // ponytail: holidays not modelled; add the exchange holiday list
  for (let added = 0; added < s.windowDays; ) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd >= 1 && wd <= 5) added++;
  }
  return d;
}

export function nextDue(s: Schedule, today: string): string | null {
  if (s.anchor === "event") return null;
  const t = new Date(today + "T00:00:00Z");
  let end = lastPeriodEnd(t, s.period);
  let due = addWindow(end, s);
  while (today > iso(due)) {
    end = nextPeriodEnd(end, s.period);
    due = addWindow(end, s);
  }
  return iso(due);
}
