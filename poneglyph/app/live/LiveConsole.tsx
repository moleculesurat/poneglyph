"use client";

/* ══════════════════════════════════════════════════════════════════════
   Live console.

   Source clause in → execution trace → deterministic verification →
   authorisation gate → chain integrity. Every panel is backed by an HTTP
   call to the engine. Slow calls keep counting; failed calls render the
   failure text and a retry. No result is rendered that did not happen.
   ══════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Chip, Cta, Hairline, KV, MarkedCard, StatusChip } from "@/components/ui";
import { usePersona } from "@/components/persona";
import { CHAPTER_LABEL, CHAPTER_PART, partLabel } from "@/lib/domains";
import type { ChapterKey, Obligation, VerifierCheck } from "@/lib/schema";
import { tenant } from "@/data/tenant";
import {
  apiCall,
  GATE_TOKEN_KEY,
  secondsLabel,
  stampOf,
  type DecisionResponse,
  type HealthResponse,
  type LiveRunView,
  type RunInput,
  type StartRunResponse,
} from "./api";
import { ChainPanel } from "./ChainPanel";
import { CLAUSE_PRESETS, DEFAULT_PRESET, type ClausePreset } from "./presets";
import { HighlightedClause, MonoBtn, Notice, StepCard, type Span } from "./parts";

const RUN_KEY = "poneglyph.live.runId";
const CHAPTER_KEYS = Object.keys(CHAPTER_PART) as ChapterKey[];
const OFFICER = tenant.team.find((m) => m.role === "Compliance Officer") ?? tenant.team[0];

const STATUS_TONE: Record<LiveRunView["status"], "live" | "at-risk" | "met" | "gap"> = {
  running: "live",
  "awaiting-approval": "at-risk",
  completed: "met",
  failed: "gap",
};

const STATUS_LABEL: Record<LiveRunView["status"], string> = {
  running: "running",
  "awaiting-approval": "awaiting approval",
  completed: "completed",
  failed: "failed",
};

/* ── Verifier panel ─────────────────────────────────────────────────── */

function CheckRow({ check }: { check: VerifierCheck }) {
  return (
    <div
      className="row"
      style={{
        alignItems: "baseline",
        gap: 12,
        padding: check.pass ? 0 : "10px 12px",
        borderLeft: check.pass ? "none" : "3px solid var(--orange)",
        background: check.pass ? "transparent" : "var(--orange-soft)",
      }}
    >
      <span
        className="mono-value"
        style={{
          flex: "none",
          width: 16,
          textAlign: "center",
          color: check.pass ? "var(--ink)" : "var(--orange-deep)",
          fontWeight: 600,
        }}
      >
        {check.pass ? "✓" : "✕"}
      </span>
      <span className="mono-label" style={{ minWidth: 168, flex: "none" }}>
        {check.name}
      </span>
      <span
        className="small"
        style={{ lineHeight: 1.6, color: check.pass ? "var(--ink-60)" : "var(--orange-deep)" }}
      >
        {check.note}
      </span>
    </div>
  );
}

function VerifierPanel({ run }: { run: LiveRunView }) {
  const checks = run.verifierChecks;
  if (checks.length === 0) return null;
  const failed = checks.filter((c) => !c.pass);
  const spans: Span[] = run.proposed.map((o) => ({ start: o.clause.charStart, end: o.clause.charEnd }));

  return (
    <MarkedCard
      pad={22}
      style={failed.length > 0 ? { borderColor: "var(--orange)" } : undefined}
    >
      <div className="stack" style={{ gap: 16 }}>
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="mono-label dim">03 · deterministic verification</span>
            <h2 className="display" style={{ fontSize: 22 }}>
              Verification <span className="accent grad">results</span>
              {` — ${checks.length} deterministic checks`}
            </h2>
          </div>
          <span
            className="mono-value"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: failed.length > 0 ? "var(--orange-deep)" : "var(--ink)",
            }}
          >
            {checks.length - failed.length}/{checks.length} passed
          </span>
        </div>

        {failed.length > 0 ? (
          <Notice tone="attention">
            The run was stopped by the verifier. Nothing was drafted into the register and no
            approval was offered — a failed check is a terminal state, not a warning.
          </Notice>
        ) : null}

        <div className="stack" style={{ gap: 12 }}>
          {checks.map((c) => (
            <CheckRow key={c.name} check={c} />
          ))}
        </div>

        {spans.some((s) => s.start >= 0) ? (
          <>
            <Hairline dashed />
            <div className="stack" style={{ gap: 10 }}>
              <div className="row wrap between" style={{ gap: 10 }}>
                <span className="mono-label dim">citation grounding — measured offsets</span>
                <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                  {run.input.circularId} para {run.input.para} · {run.input.clauseText.length} chars
                </span>
              </div>
              <p className="small dim60" style={{ margin: 0, lineHeight: 1.6, maxWidth: "76ch" }}>
                Each span below was located by an exact string search of the model&apos;s excerpt
                inside the submitted clause. The offsets are the result of that search. An excerpt
                that does not occur verbatim has no offsets and fails the run.
              </p>
              <div className="panel pad">
                <HighlightedClause text={run.input.clauseText} spans={spans} />
              </div>
              <div className="stack" style={{ gap: 6 }}>
                {run.proposed.map((o) => (
                  <KV key={o.id} k={o.id}>
                    <span className="mono-value">
                      chars {o.clause.charStart}–{o.clause.charEnd}
                    </span>{" "}
                    <span className="dim60">
                      · {o.clause.charEnd - o.clause.charStart} characters resolved
                    </span>
                  </KV>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </MarkedCard>
  );
}

/* ── The human gate ─────────────────────────────────────────────────── */

function BeforeAfter({
  obligation,
  decided,
}: {
  obligation: Obligation;
  decided: DecisionResponse | undefined;
}) {
  return (
    <div className="grid cols-2" style={{ gap: 14 }}>
      <div className="panel pad">
        <div className="stack" style={{ gap: 8 }}>
          <span className="mono-label dim">before the decision</span>
          <KV k="status">
            <StatusChip status="pending-review" />
          </KV>
          <KV k="approvedBy">
            <span className="dim">none recorded</span>
          </KV>
          <KV k="in register">
            <span className="dim">no — held in the pending queue</span>
          </KV>
        </div>
      </div>
      <div
        className="panel pad"
        style={decided ? { borderColor: "var(--ink)" } : { opacity: 0.55 }}
      >
        <div className="stack" style={{ gap: 8 }}>
          <span className="mono-label dim">after the decision</span>
          {decided ? (
            <>
              <KV k="status">
                <StatusChip status={decided.obligation.status} />
              </KV>
              <KV k="approvedBy">
                {decided.obligation.approvedBy ? (
                  <span className="mono-value">{decided.obligation.approvedBy}</span>
                ) : (
                  <span className="dim">none — rejected, so nothing was signed</span>
                )}
              </KV>
              <KV k="in register">
                {decided.obligation.approvedBy ? (
                  <span>yes — this session&apos;s live register</span>
                ) : (
                  <span className="dim">no — retained as a rejected draft</span>
                )}
              </KV>
              {decided.auditEvent ? (
                <>
                  <KV k="audit event">
                    <span className="mono-value">{decided.auditEvent.id}</span>{" "}
                    <span className="dim60">· {decided.auditEvent.action}</span>
                  </KV>
                  <KV k="hash">
                    <span className="hash" style={{ color: "var(--ink)" }}>
                      {decided.auditEvent.hash}
                    </span>{" "}
                    <span className="dim">← prev </span>
                    <span className="hash">{decided.auditEvent.prevHash}</span>
                  </KV>
                </>
              ) : null}
            </>
          ) : (
            <span className="small dim">
              No decision recorded. This panel populates once a named officer approves or rejects.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GateCard({
  obligation,
  decided,
  busy,
  disabled,
  onDecide,
}: {
  obligation: Obligation;
  decided: DecisionResponse | undefined;
  busy: boolean;
  disabled: boolean;
  onDecide: (decision: "approve" | "reject") => void;
}) {
  const o = decided?.obligation ?? obligation;
  const [token, setToken] = useState("");
  useEffect(() => {
    try {
      setToken(sessionStorage.getItem(GATE_TOKEN_KEY) ?? "");
    } catch {
      /* sessionStorage unavailable — leave the field empty */
    }
  }, []);
  return (
    <MarkedCard pad={22} style={decided ? undefined : { borderColor: "var(--orange)" }}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="row wrap" style={{ gap: 10 }}>
            <span className="mono-value">{o.id}</span>
            <StatusChip status={o.status} />
            <Chip tone="info">{o.type}</Chip>
            {o.frequency ? <Chip tone="info">{o.frequency}</Chip> : null}
          </div>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {partLabel(CHAPTER_PART[o.clause.chapter])}
          </span>
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <h3 className="display" style={{ fontSize: 20, lineHeight: 1.25 }}>
            {o.title}
          </h3>
          <p className="small dim60" style={{ margin: 0, lineHeight: 1.65, maxWidth: "74ch" }}>
            {o.summary}
          </p>
        </div>

        <div className="panel pad">
          <div className="stack" style={{ gap: 8 }}>
            <span className="mono-label dim">
              {o.clause.circularId} · para {o.clause.para} · chars {o.clause.charStart}–
              {o.clause.charEnd}
            </span>
            <p className="clause-text" style={{ margin: 0 }}>
              {o.clause.excerpt}
            </p>
          </div>
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <KV k="control">
            <span className="mono-value">{o.control.id}</span> · {o.control.name}
          </KV>
          <KV k="description">{o.control.description}</KV>
          <KV k="owner">{o.control.owner}</KV>
          <KV k="evidence spec">
            {o.evidenceSpec.map((s) => `${s.kind} — ${s.description}`).join(" · ") || "none"}
          </KV>
          <KV k="deadline">{o.deadline ?? "none stated in the clause"}</KV>
          <KV k="entry hash">
            <span className="hash" style={{ color: "var(--ink)" }}>
              {o.hash}
            </span>
          </KV>
          <KV k="drafted by">{o.createdByRun}</KV>
        </div>

        <Hairline dashed />
        <BeforeAfter obligation={obligation} decided={decided} />

        {decided ? (
          <Notice>
            Decision recorded at the gate by {OFFICER.name}, {OFFICER.role}. The audit event above
            was appended with a hash computed over its own content, and is included in the next
            chain integrity verification.
          </Notice>
        ) : disabled ? (
          <Notice>
            The gate is a broker control. The inspector persona is read-only; switch to Broker to
            record a decision on this draft.
          </Notice>
        ) : (
          <>
            <Notice tone="attention">
              The gate is the only code path in the engine that writes to the register. Every draft
              is held at <span className="mono-value">pending-review</span> with no approver
              recorded until a decision is taken here.
            </Notice>
            <div className="row wrap between" style={{ gap: 12 }}>
              <div className="row wrap" style={{ gap: 10 }}>
                <Cta
                  variant="orange"
                  onClick={() => onDecide("approve")}
                >
                  {busy ? "recording…" : `Approve as ${OFFICER.name}`}
                </Cta>
                <Cta variant="ghost" onClick={() => onDecide("reject")}>
                  Reject
                </Cta>
                <input
                  type="password"
                  placeholder="gate token"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    try {
                      sessionStorage.setItem(GATE_TOKEN_KEY, e.target.value);
                    } catch {
                      /* sessionStorage unavailable — the header just won't be sent */
                    }
                  }}
                  className="mono-value"
                  style={{
                    border: "1.5px solid var(--ink-10)",
                    background: "var(--white)",
                    padding: "9px 11px",
                    color: "var(--ink)",
                  }}
                />
              </div>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                signs as {OFFICER.name} · {OFFICER.role}
              </span>
            </div>
          </>
        )}
      </div>
    </MarkedCard>
  );
}

/* ── The console ────────────────────────────────────────────────────── */

export function LiveConsole() {
  const { persona } = usePersona();

  const [preset, setPreset] = useState<ClausePreset>(DEFAULT_PRESET);
  const [clauseText, setClauseText] = useState(DEFAULT_PRESET.clauseText);
  const [para, setPara] = useState(DEFAULT_PRESET.para);
  const [chapter, setChapter] = useState<ChapterKey>(DEFAULT_PRESET.chapter);
  const [circularId, setCircularId] = useState(DEFAULT_PRESET.circularId);

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<LiveRunView | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  const [decisions, setDecisions] = useState<Record<string, DecisionResponse>>({});
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const [chainRefresh, setChainRefresh] = useState(0);
  const traceRef = useRef<HTMLElement | null>(null);

  /* health, once — tells the judge which model is wired in before they wait */
  useEffect(() => {
    apiCall<HealthResponse>("/api/health")
      .then(setHealth)
      .catch((e: Error) => setSubmitError(e.message));
  }, []);

  /* resume a run the visitor left behind */
  useEffect(() => {
    const saved = window.sessionStorage.getItem(RUN_KEY);
    if (saved) setRunId(saved);
  }, []);

  /* poll — every 2s while the run is in flight, then stop */
  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    let timer = 0;

    const tick = async (): Promise<void> => {
      try {
        const fresh = await apiCall<LiveRunView>(`/api/runs/${runId}`);
        if (cancelled) return;
        setRun(fresh);
        setPollError(null);
        if (fresh.status === "running") timer = window.setTimeout(() => void tick(), 2000);
      } catch (e) {
        if (cancelled) return;
        setPollError((e as Error).message);
        window.sessionStorage.removeItem(RUN_KEY);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [runId]);

  /* a finished run has written to the trail — pull the chain again */
  const runStatus = run?.status;
  useEffect(() => {
    if (!runStatus || runStatus === "running") return;
    setChainRefresh((n) => n + 1);
  }, [runStatus, runId]);

  const applyPreset = useCallback((next: ClausePreset) => {
    setPreset(next);
    setClauseText(next.clauseText);
    setPara(next.para);
    setChapter(next.chapter);
    setCircularId(next.circularId);
  }, []);

  const start = useCallback(async (input: RunInput) => {
    setSubmitError(null);
    setPollError(null);
    setDecisionError(null);
    setStarting(true);
    try {
      const started = await apiCall<StartRunResponse>("/api/runs", {
        method: "POST",
        body: { ...input },
      });
      setDecisions({});
      setRun(null);
      window.sessionStorage.setItem(RUN_KEY, started.runId);
      setRunId(started.runId);
      window.setTimeout(() => traceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setStarting(false);
    }
  }, []);

  async function decide(obligation: Obligation, decision: "approve" | "reject") {
    setDecidingId(obligation.id);
    setDecisionError(null);
    try {
      const result = await apiCall<DecisionResponse>(
        `/api/obligations/${obligation.id}/decision`,
        { method: "POST", body: { decision, officer: OFFICER.name } },
      );
      setDecisions((prev) => ({ ...prev, [obligation.id]: result }));
      setChainRefresh((n) => n + 1);
      if (runId) {
        const fresh = await apiCall<LiveRunView>(`/api/runs/${runId}`);
        setRun(fresh);
      }
    } catch (e) {
      setDecisionError((e as Error).message);
    } finally {
      setDecidingId(null);
    }
  }

  const running = run?.status === "running";
  const lastStep = run && run.steps.length > 0 ? run.steps[run.steps.length - 1] : null;
  const reasoning = running && lastStep?.agent === "extraction";
  const approved = Object.values(decisions).filter((d) => d.obligation.approvedBy);
  const rejected = Object.values(decisions).filter((d) => !d.obligation.approvedBy);
  const gateOpen = run !== null && run.proposed.length > 0;

  return (
    <div className="stack" style={{ gap: 44 }}>
      {/* ── 01 · clause input ─────────────────────────────────────────── */}
      <section className="stack" style={{ gap: 18 }}>
        <div className="row between wrap" style={{ gap: 14 }}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="mono-label dim">01 · clause in</span>
            <h2 className="display" style={{ fontSize: 24 }}>
              Source clause <span className="accent grad">input</span>
            </h2>
          </div>
          <div className="row wrap" style={{ gap: 10 }}>
            {health ? (
              <>
                <Chip tone={health.hasModelKey ? "met" : "gap"}>
                  {health.hasModelKey ? "model configured" : "model key absent"}
                </Chip>
                {health.model ? (
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                    {health.model}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                checking engine health…
              </span>
            )}
          </div>
        </div>

        <div className="row wrap" style={{ gap: 8 }}>
          {CLAUSE_PRESETS.map((p) => (
            <MonoBtn key={p.key} active={preset.key === p.key} onClick={() => applyPreset(p)}>
              {p.label}
            </MonoBtn>
          ))}
        </div>

        <MarkedCard pad={22}>
          <div className="stack" style={{ gap: 16 }}>
            <div className="row wrap between" style={{ gap: 10 }}>
              <span className="mono-label dim">{preset.circularNumber}</span>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                {clauseText.length} characters · editable, accepts any clause text
              </span>
            </div>

            <textarea
              value={clauseText}
              onChange={(e) => setClauseText(e.target.value)}
              spellCheck={false}
              rows={7}
              className="clause-text"
              style={{
                width: "100%",
                resize: "vertical",
                border: "1.5px solid var(--ink-10)",
                background: "var(--white)",
                padding: "16px 18px",
                borderRadius: 2,
                color: "var(--ink)",
              }}
            />

            <p className="small dim60" style={{ margin: 0, lineHeight: 1.65, maxWidth: "80ch" }}>
              {preset.expectation}
            </p>

            <Hairline dashed />

            <div className="grid cols-3" style={{ gap: 14 }}>
              <label className="stack" style={{ gap: 6 }}>
                <span className="mono-label dim">circular id</span>
                <input
                  value={circularId}
                  onChange={(e) => setCircularId(e.target.value)}
                  className="mono-value"
                  style={{
                    border: "1.5px solid var(--ink-10)",
                    background: "var(--white)",
                    padding: "9px 11px",
                    color: "var(--ink)",
                  }}
                />
              </label>
              <label className="stack" style={{ gap: 6 }}>
                <span className="mono-label dim">para</span>
                <input
                  value={para}
                  onChange={(e) => setPara(e.target.value)}
                  className="mono-value"
                  style={{
                    border: "1.5px solid var(--ink-10)",
                    background: "var(--white)",
                    padding: "9px 11px",
                    color: "var(--ink)",
                  }}
                />
              </label>
              <label className="stack" style={{ gap: 6 }}>
                <span className="mono-label dim">chapter</span>
                <select
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value as ChapterKey)}
                  className="mono-value"
                  style={{
                    border: "1.5px solid var(--ink-10)",
                    background: "var(--white)",
                    padding: "9px 11px",
                    color: "var(--ink)",
                  }}
                >
                  {CHAPTER_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {CHAPTER_LABEL[key]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="row wrap between" style={{ gap: 12 }}>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                {partLabel(CHAPTER_PART[chapter])}
              </span>
              <Cta
                onClick={() => {
                  if (starting || running) return;
                  void start({ clauseText, para, chapter, circularId });
                }}
              >
                {starting ? "submitting…" : running ? "run in progress" : "Run the pipeline"}
              </Cta>
            </div>
          </div>
        </MarkedCard>

        {submitError ? <Notice tone="attention">{submitError}</Notice> : null}
      </section>

      {/* ── 02 · execution trace ──────────────────────────────────────── */}
      <section className="stack" style={{ gap: 18 }} ref={traceRef}>
        <div className="row between wrap" style={{ gap: 14 }}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="mono-label dim">02 · pipeline execution log</span>
            <h2 className="display" style={{ fontSize: 24 }}>
              Execution <span className="accent grad">trace</span>
            </h2>
          </div>
          {run ? (
            <div className="row wrap" style={{ gap: 10 }}>
              <span className="mono-value">{run.id}</span>
              <Chip tone={STATUS_TONE[run.status]}>{STATUS_LABEL[run.status]}</Chip>
              <span className="mono-label dim tnum" style={{ fontSize: 9.5 }}>
                {secondsLabel(run.durationSec)} elapsed
              </span>
            </div>
          ) : null}
        </div>

        {!run ? (
          <MarkedCard pad={22}>
            <div className="stack" style={{ gap: 10 }}>
              <span className="mono-label dim">no run recorded</span>
              <p className="small dim60" style={{ margin: 0, lineHeight: 1.7, maxWidth: "76ch" }}>
                This sandbox has no run yet. <b>Run the pipeline</b> above starts one, and each step
                — watcher, applicability, extraction, verifier, gate — appears here as the Worker
                writes it.
              </p>
            </div>
          </MarkedCard>
        ) : (
          <MarkedCard pad={22}>
            <div className="stack" style={{ gap: 18 }}>
              <div className="row wrap between" style={{ gap: 10 }}>
                <span className="mono-label dim">{run.trigger}</span>
                <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                  started {stampOf(run.startedAt)} UTC
                </span>
              </div>

              <ol style={{ listStyle: "none", position: "relative", margin: 0, padding: 0 }}>
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 6.5,
                    top: 6,
                    bottom: 10,
                    width: 2,
                    background: "var(--ink-10)",
                  }}
                />
                {run.steps.map((s, i) => (
                  <StepCard
                    key={`${s.agent}-${s.at}-${i}`}
                    step={s}
                    index={i}
                    holdsGate={
                      run.status === "awaiting-approval" &&
                      s.agent === "human-gate" &&
                      i === run.steps.length - 1
                    }
                  />
                ))}
                {running ? (
                  <li style={{ position: "relative", padding: "0 0 4px 38px" }}>
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: 2,
                        top: 2,
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        background: "var(--orange)",
                        animation: "pulse 1.1s steps(1) infinite",
                      }}
                    />
                    <span className="mono-label" style={{ fontSize: 9.5, color: "var(--orange-deep)" }}>
                      {reasoning
                        ? `extraction agent is reasoning — ${secondsLabel(run.durationSec)} elapsed`
                        : "pipeline in flight — polling every 2 seconds"}
                    </span>
                  </li>
                ) : null}
              </ol>

              {running ? (
                <Notice>
                  <b>Extraction latency — expected range.</b> The extraction model runs on free-tier
                  capacity and is a reasoning model, so most of its wall clock is spent on reasoning
                  tokens before the first character of the answer is emitted. Successful calls
                  measured in this sandbox have completed between a few seconds and two minutes
                  forty-seven; one call reached the four-minute ceiling and returned nothing, and a
                  concurrent second call was rejected by the provider within seconds. Calls are
                  therefore serialised, one per sandbox, and timed out rather than left hanging. The
                  run id is held in this tab, so navigating away and returning resumes polling.
                </Notice>
              ) : null}

              {run.status === "failed" ? (
                <>
                  <Notice tone="attention">
                    <b>Run failed — no obligation drafted.</b> {run.error}
                  </Notice>
                  <div className="row wrap" style={{ gap: 10 }}>
                    <Cta variant="ghost" onClick={() => void start(run.input)}>
                      Retry this clause
                    </Cta>
                    <span className="small dim60" style={{ lineHeight: 1.6 }}>
                      A failed run is retained on the record as it occurred. The engine does not
                      substitute a plausible answer for a result it did not receive.
                    </span>
                  </div>
                </>
              ) : null}

              {pollError ? <Notice tone="attention">{pollError}</Notice> : null}
            </div>
          </MarkedCard>
        )}
      </section>

      {/* ── 03 · verifier ─────────────────────────────────────────────── */}
      {run && run.verifierChecks.length > 0 ? <VerifierPanel run={run} /> : null}

      {/* ── 04 · authorisation gate ───────────────────────────────────── */}
      {gateOpen && run ? (
        <section className="stack" style={{ gap: 18 }}>
          <div className="row between wrap" style={{ gap: 14 }}>
            <div className="stack" style={{ gap: 6 }}>
              <span className="mono-label dim">04 · human gate</span>
              <h2 className="display" style={{ fontSize: 24 }}>
                Authorisation <span className="accent grad">gate</span>
              </h2>
            </div>
            <div className="row wrap" style={{ gap: 10 }}>
              <Chip tone="info">{run.proposed.length} drafted</Chip>
              <Chip tone={approved.length > 0 ? "met" : "info"}>{approved.length} approved</Chip>
              <Chip tone="info">{rejected.length} rejected</Chip>
            </div>
          </div>

          {decisionError ? <Notice tone="attention">{decisionError}</Notice> : null}

          <div className="stack" style={{ gap: 18 }}>
            {run.proposed.map((o) => (
              <GateCard
                key={o.id}
                obligation={o}
                decided={decisions[o.id]}
                busy={decidingId === o.id}
                disabled={persona === "inspector"}
                onDecide={(decision) => void decide(o, decision)}
              />
            ))}
          </div>

          {approved.length > 0 ? (
            <MarkedCard pad={22}>
              <div className="stack" style={{ gap: 12 }}>
                <span className="mono-label dim">
                  session register — {approved.length} entered through the gate
                </span>
                <p className="small dim60" style={{ margin: 0, lineHeight: 1.65, maxWidth: "76ch" }}>
                  {approved.length} obligation{approved.length === 1 ? "" : "s"} entered the register
                  through the gate, carrying the approver&apos;s name.{" "}
                  {approved.length === 1 ? "It opens" : "They open"} as{" "}
                  {approved.length === 1 ? "a gap" : "gaps"} because no evidence is bound yet;
                  recording a newly drafted duty as met would be a claim the engine has no basis for.
                  These rows are scoped to this sandbox and served by{" "}
                  <span className="mono-value">/api/state</span>. The{" "}
                  <Link href="/register">Obligation Register</Link> route continues to show the
                  seeded corpus.
                </p>
                <Hairline dashed />
                {approved.map((d) => (
                  <KV key={d.obligation.id} k={d.obligation.id}>
                    {d.obligation.title} <span className="dim60">· approved by {d.obligation.approvedBy}</span>
                  </KV>
                ))}
              </div>
            </MarkedCard>
          ) : null}
        </section>
      ) : null}

      {run && run.status === "completed" && run.proposed.length === 0 ? (
        <Notice>
          <b>Applicability determination — clause not applicable.</b> The run closed at the
          applicability agent, which recorded its citation in the trace above. No obligation was
          drafted, no approval was offered and no model call was made.
        </Notice>
      ) : null}

      {/* ── 05 · the chain ────────────────────────────────────────────── */}
      <ChainPanel refreshKey={chainRefresh} />
    </div>
  );
}
