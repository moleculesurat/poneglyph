import Link from "next/link";
import { PageHead, StatTile, MarkedCard, Chip, Hairline } from "@/components/ui";
import { catches } from "@/data/watchtower";
import { runs } from "@/data/runs";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import { WatchTerminal } from "./WatchTerminal";
import type { ApplicabilityVerdict, ScraperCatch } from "@/lib/schema";

/* ── derived, all from static data ────────────────────────────────────── */

const fmt = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;

/* pure-string next-day (no Date construction during render) */
function nextDay(d: string): string {
  const y = +d.slice(0, 4);
  const m = +d.slice(5, 7);
  const day = +d.slice(8, 10);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const dim = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  if (day < dim) return `${d.slice(0, 8)}${String(day + 1).padStart(2, "0")}`;
  const nm = m === 12 ? 1 : m + 1;
  return `${m === 12 ? y + 1 : y}-${String(nm).padStart(2, "0")}-01`;
}

const VERDICT_TONE: Record<ApplicabilityVerdict["verdict"], "gap" | "at-risk" | "info"> = {
  applies: "gap",
  partial: "at-risk",
  "not-applicable": "info",
};
const VERDICT_LABEL: Record<ApplicabilityVerdict["verdict"], string> = {
  applies: "applies",
  partial: "partial",
  "not-applicable": "not applicable",
};

const pollRun = runs.find((r) => r.id === "RUN-048") ?? runs[runs.length - 1];
const nextPoll = pollRun
  ? `${nextDay(pollRun.startedAt.slice(0, 10))} ${pollRun.startedAt.slice(11, 16)} IST`
  : "—";

const sources = [...new Set(catches.map((c) => c.source))];
const hero = catches.find((c) => c.id === "CATCH-005");
const rest = catches.filter((c) => c.id !== "CATCH-005");

const appliesN = catches.filter((c) => c.applicability.verdict === "applies").length;
const partialN = catches.filter((c) => c.applicability.verdict === "partial").length;
const triggeredN = catches.filter((c) => c.triggeredRunId).length;

/* ── catch card (native <details> keeps this server-rendered) ─────────── */

function VerdictRow({ c }: { c: ScraperCatch }) {
  return (
    <div className="row wrap" style={{ gap: 10 }}>
      <Chip tone={VERDICT_TONE[c.applicability.verdict]}>
        {c.applicability.verdict === "applies" ? <span className="dot" data-pulse /> : null}
        {VERDICT_LABEL[c.applicability.verdict]}
      </Chip>
      <span className="mono-label dim">
        confidence {(c.applicability.confidence * 100).toFixed(0)}%
      </span>
      {c.triggeredRunId ? (
        <Link href="/agents" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          → triggered {c.triggeredRunId}
        </Link>
      ) : null}
    </div>
  );
}

function CatchCard({ c }: { c: ScraperCatch }) {
  return (
    <MarkedCard pad={20}>
      <div className="stack" style={{ gap: 10 }}>
        <div className="row between wrap" style={{ gap: 10 }}>
          <div className="row wrap" style={{ gap: 10 }}>
            <span className="mono-label dim">{c.id}</span>
            <Chip tone="info">{c.docType.replace(/-/g, " ")}</Chip>
          </div>
          <span className="mono-label dim">fetched {fmt(c.fetchedAt)}</span>
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{c.title}</div>
          <div className="mono-label dim" style={{ fontSize: 9.5, marginTop: 4 }}>
            {c.circularNumber} · {c.source}
          </div>
        </div>

        <VerdictRow c={c} />

        <details>
          <summary className="mono-label dim">cited reasoning ▸</summary>
          <div className="stack" style={{ gap: 10, marginTop: 12 }}>
            {c.applicability.citedText ? (
              <blockquote
                className="clause-text"
                style={{ borderLeft: "3px solid var(--ink-20)", paddingLeft: 14 }}
              >
                &ldquo;{c.applicability.citedText}&rdquo;
              </blockquote>
            ) : null}
            <p className="small dim60" style={{ maxWidth: "72ch" }}>
              {c.applicability.reasoning}
            </p>
          </div>
        </details>
      </div>
    </MarkedCard>
  );
}

/* ── page ─────────────────────────────────────────────────────────────── */

export default function Watchtower() {
  if (!pollRun || catches.length === 0) {
    return (
      <>
        <PageHead
          eyebrow={`Watchtower · ${tenant.name}`}
          title={
            <>
              SEBI Circular <span className="accent grad">Scraper</span>
            </>
          }
          sub={
            <>
              The Watchtower polls SEBI&rsquo;s circulars, regulations and press releases and rules
              on applicability with clause-level citations. Nothing has been caught yet — when a
              document that binds this entity appears, it opens a pipeline run and shows here.
            </>
          }
        />
        <div className="panel pad">
          <span className="small dim60">No catches on record. The register fills only through the pipeline and the human gate.</span>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHead
        eyebrow={`Watchtower · ${tenant.name}`}
        title={
          <>
            SEBI Circular <span className="accent grad">Scraper</span>
          </>
        }
        sub={
          <>
            The Watchtower polls SEBI&rsquo;s circulars, regulations and press releases every 24
            hours, rules on applicability with clause-level citations, and hands anything that
            binds this tenant to the agent pipeline.
          </>
        }
      />

      {/* ── posture ── */}
      <div className="grid cols-4" style={{ marginBottom: 30 }}>
        <StatTile label="Documents caught" value={catches.length} hint="sebi.gov.in · since Jun 2025" />
        <StatTile label="Ruled applicable" value={appliesN} accent hint="clause-cited verdicts, all triggered runs" />
        <StatTile label="Partial or monitor" value={partialN} hint="scoped chapters and consultation papers" />
        <StatTile label="Pipeline runs triggered" value={triggeredN} hint="each replayable step-by-step in Agents" />
      </div>

      {/* ── live poll loop ── */}
      <section style={{ marginBottom: 36 }}>
        <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
          <span className="eyebrow">Poll loop — latest session</span>
          <span className="mono-label dim">
            last poll {fmt(pollRun.startedAt)} · next {nextPoll}
          </span>
        </div>
        <MarkedCard pad={20}>
          <div className="stack" style={{ gap: 16 }}>
            <div className="row wrap" style={{ gap: 12 }}>
              <Chip tone="live">
                <span className="dot" data-pulse /> watching
              </Chip>
              {sources.map((s) => (
                <span key={s} className="mono-value dim60">
                  {s}
                </span>
              ))}
            </div>
            <WatchTerminal run={pollRun} nextPoll={nextPoll} obligationCount={obligations.length} />
            <span className="small dim60">
              This is a replay of the recorded {pollRun.id} trace — the sandbox does not poll SEBI
              live. Every session, no-op or not, is hash-chained into the{" "}
              <Link href="/audit" style={{ textDecoration: "underline" }}>
                audit trail
              </Link>
              .
            </span>
          </div>
        </MarkedCard>
      </section>

      {/* ── hero catch ── */}
      {hero ? (
        <section style={{ marginBottom: 36 }}>
          <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
            Featured catch — {hero.id}
          </span>
          <MarkedCard pad={26}>
            <div className="stack" style={{ gap: 14 }}>
              <div className="row between wrap" style={{ gap: 10 }}>
                <div className="row wrap" style={{ gap: 10 }}>
                  <Chip tone="gap">
                    <span className="dot" data-pulse /> applies
                  </Chip>
                  <Chip tone="info">{hero.docType.replace(/-/g, " ")}</Chip>
                  <span className="mono-label dim">
                    {hero.id} · confidence {(hero.applicability.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <span className="mono-label dim">fetched {fmt(hero.fetchedAt)}</span>
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{hero.title}</div>
                <div className="mono-label dim" style={{ fontSize: 9.5, marginTop: 5 }}>
                  {hero.circularNumber} · {hero.source}
                </div>
              </div>

              {hero.applicability.citedText ? (
                <blockquote
                  className="clause-text"
                  style={{ borderLeft: "3px solid var(--orange)", paddingLeft: 16 }}
                >
                  &ldquo;{hero.applicability.citedText}&rdquo;
                </blockquote>
              ) : null}
              <p className="small dim60" style={{ maxWidth: "72ch" }}>
                {hero.applicability.reasoning}
              </p>

              <div className="row wrap" style={{ gap: 12 }}>
                <Link href="/agents" className="cta" data-variant="orange">
                  Replay {hero.triggeredRunId ?? "the latest run"} <span className="arrow">→</span>
                </Link>
              </div>
            </div>
          </MarkedCard>
        </section>
      ) : null}

      {/* ── catch log ── */}
      <section style={{ marginBottom: 36 }}>
        <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
          <span className="eyebrow">Catch log — newest first</span>
          <span className="mono-label dim">
            {rest.length} further documents · CATCH-005 featured above
          </span>
        </div>
        <div className="stack" style={{ gap: 20 }}>
          {rest.map((c) => (
            <CatchCard key={c.id} c={c} />
          ))}
        </div>
      </section>

      {/* ── cross-links ── */}
      <Hairline />
      <div className="row wrap" style={{ gap: 22, marginTop: 18 }}>
        <Link href="/agents" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          pipeline runs →
        </Link>
        <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          obligation register →
        </Link>
      </div>
    </>
  );
}
