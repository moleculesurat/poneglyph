"use client";

/* ══════════════════════════════════════════════════════════════════════
   RunsTable — every pipeline run since first ingest, newest first.
   Click a row to open its replayable trace inline (TraceReplay).
   ══════════════════════════════════════════════════════════════════════ */

import { Fragment, useState } from "react";
import { Chip } from "@/components/ui";
import { runs } from "@/data/runs";
import type { PipelineRun } from "@/lib/schema";
import { TraceReplay } from "./TraceReplay";

const fmt = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;

const STATUS_TONE: Record<PipelineRun["status"], "met" | "pending" | "gap"> = {
  completed: "met",
  "awaiting-approval": "pending",
  failed: "gap",
};
const STATUS_LABEL: Record<PipelineRun["status"], string> = {
  completed: "completed",
  "awaiting-approval": "awaiting approval",
  failed: "failed",
};

function outputsSummary(r: PipelineRun): string {
  const parts: string[] = [];
  if (r.outputs.obligationsCreated.length > 0) parts.push(`+${r.outputs.obligationsCreated.length} obl`);
  if (r.outputs.obligationsUpdated.length > 0) parts.push(`Δ${r.outputs.obligationsUpdated.length} obl`);
  if (r.outputs.tasksCreated.length > 0) parts.push(`+${r.outputs.tasksCreated.length} tsk`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

const newestFirst = [...runs].reverse();

export function RunsTable() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 30 }} aria-label="expand" />
            <th>Run</th>
            <th>Trigger</th>
            <th>Started</th>
            <th>Duration</th>
            <th>Steps</th>
            <th>Verifier</th>
            <th>Outputs</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {newestFirst.map((r) => {
            const open = openId === r.id;
            const passed = r.verifierChecks.filter((c) => c.pass).length;
            return (
              <Fragment key={r.id}>
                <tr
                  className="clickable"
                  onClick={() => setOpenId(open ? null : r.id)}
                  aria-expanded={open}
                  style={open ? { background: "var(--paper)" } : undefined}
                >
                  <td className="mono-value dim" aria-hidden>
                    {open ? "▾" : "▸"}
                  </td>
                  <td className="mono-value" style={{ whiteSpace: "nowrap", fontWeight: 500 }}>
                    {r.id}
                  </td>
                  <td className="small dim60" style={{ maxWidth: 380, lineHeight: 1.5 }}>
                    {r.trigger}
                  </td>
                  <td className="mono-value dim" style={{ whiteSpace: "nowrap" }}>
                    {fmt(r.startedAt)}
                  </td>
                  <td className="mono-value dim tnum">{r.durationSec}s</td>
                  <td className="mono-value dim tnum">{r.steps.length}</td>
                  <td className="mono-value dim tnum">
                    {r.verifierChecks.length > 0 ? `${passed}/${r.verifierChecks.length}` : "—"}
                  </td>
                  <td className="mono-value dim" style={{ whiteSpace: "nowrap" }}>
                    {outputsSummary(r)}
                  </td>
                  <td>
                    <Chip tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Chip>
                  </td>
                </tr>
                {open ? (
                  <tr>
                    <td colSpan={9} style={{ background: "var(--paper)", padding: "22px 26px 28px" }}>
                      <TraceReplay run={r} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
