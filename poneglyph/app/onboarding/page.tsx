import Link from "next/link";
import type { ReactNode } from "react";
import { Chip, Cta, Hairline, KV, MarkedCard, PageHead, StatTile } from "@/components/ui";
import { DashField } from "@/components/DashField";
import { FlowTimeline } from "./FlowTimeline";
import { QuestionDeck } from "./QuestionDeck";
import { NewOnboarding } from "./NewOnboarding";
import { angelOne, factOf } from "@/data/entity";
import { SEGMENT_LABEL, angelOneOnboarding, blankOnboarding } from "@/data/onboarding";
import { companyDocuments, documentRequirements, documentsFor } from "@/data/documents";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import {
  CHAPTER_LABEL,
  CHAPTER_PART,
  CSCRF,
  CSCRF_GRADE_LABEL,
  QSB,
  SEBI_DOMAINS,
} from "@/lib/domains";
import type {
  ChapterKey,
  DocumentStatus,
  ProvenanceKind,
  SebiPart,
} from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Entity onboarding — how a real firm enters the register.

   REAL, and sourced on the page: Angel One Limited's identity, listing,
   net worth, revenue, profit, client base and NSE market share, from the
   XBRL filings and the published business updates.
   SIMULATED, and labelled as such: the onboarding narrative, the traces,
   the answers, the document register — an illustrative onboarding of a
   public entity using public filings. Nothing here asserts anything about
   the firm's actual compliance posture.

   Everything below is computed from the data files; no count on this page
   is typed by hand.
   ══════════════════════════════════════════════════════════════════════ */

const session = angelOneOnboarding;

const fmtStamp = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} IST`;

/** Rupees → crore, grouped without touching locale APIs (hydration-safe). */
function crore(rupees?: number): string {
  if (rupees == null) return "—";
  const [whole, frac] = (rupees / 1e7).toFixed(2).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
}

/* ── register coverage, per Part ───────────────────────────────────────── */

const OBL_BY_CHAPTER = obligations.reduce(
  (acc, o) => ((acc[o.clause.chapter] = (acc[o.clause.chapter] ?? 0) + 1), acc),
  {} as Record<ChapterKey, number>
);

const ALL_CHAPTERS = Object.keys(CHAPTER_PART) as ChapterKey[];
const CHAPTERS_WITH_OBLIGATIONS = ALL_CHAPTERS.filter((c) => (OBL_BY_CHAPTER[c] ?? 0) > 0);

/* the chapters still carrying nothing, split by whether their Part was
   excluded at onboarding (a determination on the record) or is simply
   still awaiting a corpus pass (a shortfall). After RUN-049 only the
   first kind remains — but the copy derives the split rather than
   asserting it, so a later corpus change cannot make the page lie. */
const EMPTY_CHAPTERS = ALL_CHAPTERS.filter((c) => (OBL_BY_CHAPTER[c] ?? 0) === 0);
const EMPTY_BY_EXCLUSION = EMPTY_CHAPTERS.filter((c) =>
  angelOne.excludedParts.some((p) => p.part === CHAPTER_PART[c])
);
const EMPTY_UNEXTRACTED = EMPTY_CHAPTERS.filter(
  (c) => !EMPTY_BY_EXCLUSION.includes(c)
);

const chapterList = (chapters: ChapterKey[]) =>
  chapters
    .map((c) => `${CHAPTER_LABEL[c]} (Part ${CHAPTER_PART[c]})`)
    .join(", ")
    .replace(/, ([^,]*)$/, chapters.length > 1 ? " and $1" : "$1");

const oblCountFor = (chapters: ChapterKey[]) =>
  chapters.reduce((n, c) => n + (OBL_BY_CHAPTER[c] ?? 0), 0);

const EXCLUDED = new Map(angelOne.excludedParts.map((p) => [p.part, p.reason]));
const isApplicable = (part: SebiPart) => angelOne.applicableParts.includes(part);

/* ── why each Part binds — parsed out of the scope agent's own trace ──── */

function bindingTriggers(): Partial<Record<SebiPart, string>> {
  const obs = session.steps
    .find((s) => s.key === "scope")
    ?.trace?.find((t) => t.action?.startsWith("bind_parts"))?.observation;
  if (!obs) return {};
  const re =
    /\b(I|II|III|IV|V|VI|VII|VIII|IX|X):\s([^]*?)(?=\s\b(?:I|II|III|IV|V|VI|VII|VIII|IX|X):\s|$)/g;
  const out: Partial<Record<SebiPart, string>> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(obs))) out[m[1] as SebiPart] = m[2].trim().replace(/\.$/, "");
  return out;
}
const TRIGGERS = bindingTriggers();

/* ── QSB scoring table — parsed out of the profile's own basis strings ── */

interface QsbRow {
  param: string;
  verdict: string;
  detail: string;
}

function parseBasis(s: string): QsbRow | null {
  const i = s.indexOf(" — ");
  if (i < 0) return null;
  const rest = s.slice(i + 3);
  const j = rest.indexOf(". ");
  if (j < 0) return null;
  return { param: s.slice(0, i), verdict: rest.slice(0, j).trim(), detail: rest.slice(j + 2).trim() };
}

const PARSED = angelOne.qsbBasis.map(parseBasis);
const QSB_ROWS = PARSED.filter(
  (r): r is QsbRow => !!r && (r.verdict === "CROSSES" || r.verdict === "NOT COMPUTABLE")
);
const QSB_DETERMINATION = PARSED.find((r) => r?.verdict.startsWith("COMPUTED")) ?? null;
const QSB_CONSEQUENCE = angelOne.qsbBasis[angelOne.qsbBasis.length - 1];
const activeClientsFact = factOf("nse-active-clients");

/* ── documents ─────────────────────────────────────────────────────────── */

const raisedAsks = documentRequirements.filter((r) => r.mandatory);
const notRaised = documentRequirements.filter((r) => !r.mandatory);
const askStatus = (id: string): DocumentStatus => documentsFor(id)[0]?.status ?? "required";
const DOC_COUNTS = raisedAsks.reduce(
  (acc, r) => ((acc[askStatus(r.id)] = (acc[askStatus(r.id)] ?? 0) + 1), acc),
  {} as Record<DocumentStatus, number>
);
const openAsks = raisedAsks.filter((r) => askStatus(r.id) === "required");
const waivedDocs = companyDocuments.filter((d) => d.status === "waived");

const DOC_TONE: Record<DocumentStatus, "met" | "gap" | "at-risk" | "pending" | "info"> = {
  verified: "met",
  received: "pending",
  expired: "at-risk",
  required: "gap",
  waived: "info",
};

/* ── facts ─────────────────────────────────────────────────────────────── */

const PROV_TONE: Record<ProvenanceKind, "met" | "info" | "pending" | "at-risk"> = {
  filing: "met",
  exchange: "met",
  document: "info",
  declared: "pending",
  derived: "at-risk",
};
const verifiedFacts = angelOne.facts.filter((f) => f.verified).length;

/* ── questions ─────────────────────────────────────────────────────────── */

/** The human who signed the session off — the sandbox compliance team, not
    an Angel One employee. Taken from the tenant record, never typed inline. */
const signer = tenant.team.find((m) => m.role === "Compliance Officer");

/* The free-text catch-all is filed last on purpose; it gets its own card.
   Guarded rather than assumed, so a data change degrades to the deck. */
const lastQuestion = session.questions[session.questions.length - 1];
const catchAll =
  lastQuestion?.kind === "text" && lastQuestion.step === "activate" ? lastQuestion : undefined;
const deckQuestions = catchAll ? session.questions.slice(0, -1) : session.questions;
const STEP_TITLES = Object.fromEntries(session.steps.map((s) => [s.key, s.title]));

/* ── the QSB computation, injected into the designation step ───────────── */

function DesignationExtra(): ReactNode {
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between wrap" style={{ gap: 10 }}>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          QSB scoring — {QSB.parameters.length} parameters · {QSB.circular}
        </span>
        <Chip tone="at-risk">computed · unconfirmed</Chip>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Parameter</th>
              <th style={{ width: "16%" }}>Value</th>
              <th style={{ width: "16%" }}>Crosses?</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {QSB_ROWS.map((r) => {
              const crosses = r.verdict === "CROSSES";
              const isActiveClients = r.param.startsWith("Active clients");
              return (
                <tr key={r.param}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{r.param}</td>
                  <td className="mono-value">
                    {crosses && isActiveClients && activeClientsFact ? (
                      activeClientsFact.value
                    ) : (
                      <span className="dim">not visible in public data</span>
                    )}
                  </td>
                  <td>
                    <Chip tone={crosses ? "at-risk" : "pending"}>
                      {crosses ? "crosses" : "not computable"}
                    </Chip>
                  </td>
                  <td className="small dim60" style={{ lineHeight: 1.55 }}>
                    {r.detail}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {QSB_DETERMINATION ? (
        <div className="panel pad" style={{ padding: "14px 16px" }}>
          <div className="row wrap" style={{ gap: 10, marginBottom: 7 }}>
            <span className="mono-label" style={{ fontSize: 9.5, color: "var(--orange-deep)" }}>
              determination
            </span>
            <span className="mono-value">{QSB_DETERMINATION.verdict}</span>
          </div>
          <p className="small dim60" style={{ lineHeight: 1.62 }}>{QSB_DETERMINATION.detail}</p>
          <Hairline />
          <p className="small dim60" style={{ marginTop: 12, lineHeight: 1.62 }}>
            {QSB_CONSEQUENCE}
          </p>
          <div className="row wrap" style={{ gap: 10, marginTop: 12 }}>
            <span className="small">
              Awaits confirmation against the QSB list published by the exchanges —
            </span>
            <Link href="/documents" className="mono-label" style={{ color: "var(--orange-deep)", fontSize: 9.5 }}>
              DOC-REQ-004 →
            </Link>
          </div>
        </div>
      ) : null}

      <div className="panel pad" style={{ padding: "14px 16px" }}>
        <div className="row wrap" style={{ gap: 10, marginBottom: 7 }}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>CSCRF grade</span>
          <Chip tone="info">{CSCRF_GRADE_LABEL[angelOne.cscrfGrade]}</Chip>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>{CSCRF.circular}</span>
        </div>
        <p className="small dim60" style={{ lineHeight: 1.62 }}>{angelOne.cscrfBasis}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */

export default function Onboarding() {
  return (
    <>
      <PageHead
        eyebrow="Entity onboarding"
        title={
          <>
            Entity <span className="accent grad">Onboarding</span>
          </>
        }
        sub={
          <>
            Angel One Limited, onboarded from its own public filings — the identity, listing and
            financial facts below are <b>real and each carries its source</b>, while every element
            of compliance posture in this sandbox is <b>illustrative</b>{" "}
            and asserts nothing about the firm&apos;s actual compliance.
          </>
        }
        right={
          <Cta
            variant="ghost"
            toastMsg="Sandbox — re-running onboarding is disabled; this session is fixed at ONB-001"
          >
            Re-run this session
          </Cta>
        }
      />

      {/* ── session strip ── */}
      <div className="row between wrap" style={{ gap: 12, marginBottom: 22 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>{session.id}</span>
          <Chip tone="info">{session.mode}</Chip>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {fmtStamp(session.startedAt)} → {session.completedAt ? fmtStamp(session.completedAt) : "open"}
          </span>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            signed · {signer ? `${signer.name}, ${signer.role}` : "compliance officer"}
          </span>
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            corpus axis maintained separately
          </span>
          <Link href="/agents" className="mono-label" style={{ fontSize: 9.5, color: "var(--orange-deep)" }}>
            RUN-041 · RUN-047 →
          </Link>
        </div>
      </div>

      {/* ── what is real, what is not — stated before anything is claimed ── */}
      <MarkedCard pad={20} style={{ marginBottom: 30 }}>
        <div className="grid cols-2" style={{ alignItems: "start", gap: 22 }}>
          <div className="stack" style={{ gap: 7 }}>
            <div className="row" style={{ gap: 10 }}>
              <Chip tone="met">real</Chip>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                public and checkable
              </span>
            </div>
            <p className="small dim60" style={{ lineHeight: 1.62 }}>
              Angel One Limited is a real, listed, SEBI-registered stock broker. Identity, ISIN and
              listing, net worth, revenue, profit, client base and NSE market share are taken from
              the XBRL results filed with the exchanges and the published business updates — each
              one names its source below, and anything Poneglyph computed itself is marked derived.
            </p>
          </div>
          <div className="stack" style={{ gap: 7 }}>
            <div className="row" style={{ gap: 10 }}>
              <Chip tone="at-risk">illustrative</Chip>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                simulated compliance posture
              </span>
            </div>
            <p className="small dim60" style={{ lineHeight: 1.62 }}>
              Everything about posture — obligations met or gapped, evidence, remediation, audit
              events, document contents and the onboarding narrative itself — is simulated. None of
              it asserts anything about the firm&apos;s actual compliance; no finding, penalty or
              inspection outcome is depicted. The named compliance team is this sandbox&apos;s own,
              not Angel One employees.
            </p>
          </div>
        </div>
      </MarkedCard>

      {/* ══ 1 · the onboarded entity ══════════════════════════════════ */}
      <section id="entity" style={{ marginBottom: 34 }}>
        <MarkedCard pad={0} style={{ overflow: "hidden", marginBottom: 16 }}>
          <div style={{ position: "relative", padding: 24 }}>
            <DashField
              rows={9}
              seed={23}
              style={{ position: "absolute", right: 0, top: 0, width: "34%", height: "100%", opacity: 0.14 }}
            />
            <div style={{ position: "relative" }}>
              <div className="row between wrap" style={{ gap: 14, marginBottom: 16 }}>
                <div className="stack" style={{ gap: 8 }}>
                  <h2 className="display" style={{ fontSize: "clamp(22px, 2.4vw, 30px)" }}>
                    {angelOne.legalName}
                  </h2>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <Chip tone="met">{angelOne.listed ? "Listed" : "Unlisted"}</Chip>
                    <Chip tone="info">ISIN {angelOne.isin}</Chip>
                    {angelOne.tickers?.map((t) => (
                      <Chip key={t.exchange} tone="info">
                        {t.exchange} {t.symbol}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="stack" style={{ gap: 8, alignItems: "flex-end" }}>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>{angelOne.id}</span>
                  <div className="row wrap" style={{ gap: 8, justifyContent: "flex-end" }}>
                    <Chip tone="at-risk">QSB · computed, unconfirmed</Chip>
                    <Chip tone="info">CSCRF · {CSCRF_GRADE_LABEL[angelOne.cscrfGrade]}</Chip>
                  </div>
                </div>
              </div>

              <Hairline />

              <div className="grid cols-2" style={{ alignItems: "start", marginTop: 18, gap: 22 }}>
                <div className="stack" style={{ gap: 11 }}>
                  <KV k="Incorporated">{angelOne.incorporatedIn}</KV>
                  <KV k="Capacities">
                    {angelOne.intermediaryTypes.join(" · ")}
                  </KV>
                  <KV k="Exchanges">{angelOne.exchanges.join(" · ")}</KV>
                  <KV k="Depositories">{angelOne.depositories.join(" · ")}</KV>
                  <KV k="Segments run">
                    <span className="row wrap" style={{ gap: 6, display: "inline-flex" }}>
                      {angelOne.segments.map((s) => (
                        <Chip key={s} tone="info">
                          {SEGMENT_LABEL[s]}
                        </Chip>
                      ))}
                    </span>
                  </KV>
                  <KV k="Ruled out">
                    {factOf("segments-not-run")?.value ?? "—"}
                    <span className="dim60">
                      {" "}
                      — declared negatives, filed with their reason so the exclusion is auditable.
                    </span>
                  </KV>
                </div>

                <div className="stack" style={{ gap: 10 }}>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                    Registrations — {angelOne.registrations.length} lines, {angelOne.registrations.filter((r) => r.masked).length} masked in the sandbox
                  </span>
                  <div style={{ overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Authority</th>
                          <th>Number</th>
                          <th>State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {angelOne.registrations.map((r) => (
                          <tr key={`${r.authority}-${r.category}`}>
                            <td style={{ fontSize: 13 }}>{r.category}</td>
                            <td className="mono-value">{r.authority}</td>
                            <td className="mono-value">{r.number}</td>
                            <td>
                              <Chip tone={r.masked ? "info" : "pending"}>
                                {r.masked ? "masked" : "declared"}
                              </Chip>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="small dim60" style={{ lineHeight: 1.6 }}>
                    {angelOne.registrations[0].number} is publicly displayed because SEBI requires
                    it, and is held here as <b>declared</b> until the certificate arrives against
                    DOC-REQ-001. The engine has never generated a registration number.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </MarkedCard>

        {/* headline facts — every tile names the filing it came from */}
        <div className="grid cols-4" style={{ marginBottom: 16 }}>
          <StatTile
            label="Net worth · ₹ crore"
            value={crore(factOf("net-worth-fy26")?.rupees)}
            hint="Total equity, standalone FY2025-26 — XBRL results filed with NSE and BSE, reconciled through the Molecule financials engine. Prior year ₹5,597.87 cr."
          />
          <StatTile
            label="Revenue · ₹ crore"
            value={crore(factOf("revenue-fy26")?.rupees)}
            hint="Total revenue, standalone FY2025-26 — same XBRL filing. FY2024-25 net profit ₹1,215.95 cr; the FY2025-26 profit line was not reconciled, so it is absent rather than estimated."
          />
          <StatTile
            label="Client base · crore"
            value="3.86"
            hint="38.59 million, June 2026 business update published to NSE and BSE — up 18.8% year on year"
          />
          <StatTile
            label="NSE active clients · million"
            value="≈ 6.76"
            accent
            hint="DERIVED by Poneglyph, not reported: 14.79% NSE share × 4.57 crore market-wide active base (Mar 2026) — this is the QSB-relevant count and it is an estimate"
          />
        </div>

        <details>
          <summary
            className="mono-label dim"
            style={{ fontSize: 9.5, padding: "10px 0", display: "inline-flex", gap: 8 }}
          >
            ▸ All {angelOne.facts.length} profile facts — {verifiedFacts} verified against public
            sources, {angelOne.facts.length - verifiedFacts} held declared or derived
          </summary>
          <MarkedCard pad={0} style={{ overflow: "hidden", marginTop: 8 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Fact</th>
                    <th>Value</th>
                    <th>Provenance</th>
                    <th>As of</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {angelOne.facts.map((f) => (
                    <tr key={f.key}>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</td>
                      <td className="mono-value" style={{ minWidth: 150 }}>{f.value}</td>
                      <td>
                        <div className="stack" style={{ gap: 6 }}>
                          <Chip tone={PROV_TONE[f.provenance]}>{f.provenance}</Chip>
                          <span className="mono-label dim" style={{ fontSize: 9 }}>
                            {f.verified ? "verified" : "unverified"}
                          </span>
                        </div>
                      </td>
                      <td className="mono-value dim">{f.asOf}</td>
                      <td className="small dim60" style={{ lineHeight: 1.55, minWidth: 320 }}>
                        {f.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MarkedCard>
        </details>
      </section>

      <Hairline />

      {/* ══ 2 · the six steps ═════════════════════════════════════════ */}
      <section style={{ margin: "30px 0 34px" }}>
        <FlowTimeline steps={session.steps} extras={{ designation: <DesignationExtra /> }} />
      </section>

      <Hairline />

      {/* ══ 3 · scope — the payoff ════════════════════════════════════ */}
      <section id="scope" style={{ margin: "30px 0 34px" }}>
        <div className="row between wrap" style={{ gap: 12, marginBottom: 8 }}>
          <span className="eyebrow">
            What binds — the ten Parts of the Master Circular, walked one by one
          </span>
          <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)", fontSize: 10 }}>
            open the register →
          </Link>
        </div>
        <p className="sub" style={{ maxWidth: "80ch", marginBottom: 18 }}>
          {session.result.partsApplicable} of {SEBI_DOMAINS.length} Parts bind this profile and{" "}
          {session.result.partsExcluded} is excluded with its reason on the record.{" "}
          {obligations.length} extracted obligations are joined to the entity across{" "}
          {CHAPTERS_WITH_OBLIGATIONS.length} of {ALL_CHAPTERS.length} register chapters.{" "}
          {EMPTY_BY_EXCLUSION.length > 0 && (
            <>
              {chapterList(EMPTY_BY_EXCLUSION)} {EMPTY_BY_EXCLUSION.length > 1 ? "carry" : "carries"}{" "}
              nothing because {EMPTY_BY_EXCLUSION.length > 1 ? "their Parts were" : "its Part was"}{" "}
              excluded here with the reason on the record — a zero that is a determination, not a
              missing pass.{" "}
            </>
          )}
          {EMPTY_UNEXTRACTED.length > 0 ? (
            <>
              {chapterList(EMPTY_UNEXTRACTED)} {EMPTY_UNEXTRACTED.length > 1 ? "bind" : "binds"} by
              scope but {EMPTY_UNEXTRACTED.length > 1 ? "await" : "awaits"} the next corpus pass, and{" "}
              {EMPTY_UNEXTRACTED.length > 1 ? "are" : "is"} shown as pending extraction rather than
              as zero — an empty bound chapter is a statement about the corpus pass, not a clean
              bill of health.
            </>
          ) : (
            <>
              Every other bound chapter now carries extracted content: the corpus-completion pass
              closed the shortfall the first extraction left behind.
            </>
          )}
        </p>

        <div className="grid cols-2" style={{ alignItems: "start" }}>
          {SEBI_DOMAINS.map((d) => {
            const applicable = isApplicable(d.part);
            const reason = EXCLUDED.get(d.part);
            const count = oblCountFor(d.chapters);
            return (
              <MarkedCard key={d.part} pad={20}>
                <div className="row between wrap" style={{ gap: 12, marginBottom: 10 }}>
                  <div className="row" style={{ gap: 12, alignItems: "baseline" }}>
                    <span
                      className="display"
                      style={{ fontSize: 26, color: "var(--ink-40)", minWidth: 44 }}
                    >
                      {d.part}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.3 }}>
                      {d.title}
                    </span>
                  </div>
                  <Chip tone={applicable ? "met" : "pending"}>
                    {applicable ? "applicable" : "excluded · dormant"}
                  </Chip>
                </div>

                <div className="row wrap" style={{ gap: 10, marginBottom: 10 }}>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>{d.items}</span>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                    {count} obligation{count === 1 ? "" : "s"} mapped
                  </span>
                </div>

                {applicable && TRIGGERS[d.part] ? (
                  <div className="row" style={{ alignItems: "baseline", gap: 12, marginBottom: 12 }}>
                    <span
                      className="mono-label"
                      style={{ fontSize: 9.5, minWidth: 74, flex: "none", color: "var(--orange-deep)" }}
                    >
                      binds on
                    </span>
                    <span className="small" style={{ lineHeight: 1.6 }}>{TRIGGERS[d.part]}</span>
                  </div>
                ) : null}

                <p className="small dim60" style={{ lineHeight: 1.6, marginBottom: 12 }}>
                  {d.blurb}
                </p>

                {reason ? (
                  <div
                    style={{
                      paddingLeft: 14,
                      borderLeft: "2px solid var(--ink-10)",
                      marginBottom: 12,
                    }}
                  >
                    <p className="small" style={{ lineHeight: 1.6, marginBottom: 6 }}>
                      Event-driven, not standing — scoped out, kept dormant, and re-armed the moment
                      an exchange default notice reaches the Watchtower.
                    </p>
                    <details>
                      <summary className="mono-label dim" style={{ fontSize: 9.5 }}>
                        ▸ read the determination in full
                      </summary>
                      <p className="small dim60" style={{ marginTop: 8, lineHeight: 1.62 }}>
                        {reason}
                      </p>
                    </details>
                  </div>
                ) : null}

                <div className="row wrap" style={{ gap: 7 }}>
                  {d.chapters.map((ch) => {
                    const n = OBL_BY_CHAPTER[ch] ?? 0;
                    if (n === 0) {
                      return (
                        <span key={ch} className="chip" data-tone="pending">
                          {CHAPTER_LABEL[ch]} ·{" "}
                          {applicable ? "pending extraction" : "dormant, clauses retained"}
                        </span>
                      );
                    }
                    return (
                      <Link key={ch} href={`/register?chapter=${ch}`}>
                        <span className="chip" data-tone="info">
                          {CHAPTER_LABEL[ch]} · {n}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </MarkedCard>
            );
          })}
        </div>
      </section>

      <Hairline />

      {/* ══ 4 · the questions ═════════════════════════════════════════ */}
      <section id="questions" style={{ margin: "30px 0 34px" }}>
        <div className="row between wrap" style={{ gap: 12, marginBottom: 8 }}>
          <span className="eyebrow">The questions the engine asked</span>
          <span className="mono-label dim" style={{ fontSize: 9.5 }}>
            {deckQuestions.filter((q) => q.prefilled).length} of {deckQuestions.length} arrived
            pre-filled
          </span>
        </div>
        <p className="sub" style={{ maxWidth: "80ch", marginBottom: 18 }}>
          A question the firm has to type an answer to, that the engine could have looked up, is a
          question that wastes the compliance officer&apos;s afternoon. Everything public is
          pre-filled with its source attached; everything unseeable is asked cold and left blank
          until a human answers it. Answers recorded here are the sandbox team&apos;s declarations,
          not statements of fact about how the firm operates.
        </p>
        <QuestionDeck questions={deckQuestions} stepTitles={STEP_TITLES} />

        {/* the catch-all, deliberately last */}
        {catchAll ? (
          <MarkedCard pad={0} style={{ overflow: "hidden", marginTop: 20 }}>
            <div style={{ position: "relative", padding: 24 }}>
              <DashField
                rows={7}
                seed={41}
                style={{ position: "absolute", right: 0, bottom: 0, width: "40%", height: "70%", opacity: 0.13 }}
              />
              <div style={{ position: "relative" }}>
                <div className="row wrap" style={{ gap: 10, marginBottom: 12 }}>
                  <span className="eyebrow">The last question</span>
                  <span className="mono-label dim" style={{ fontSize: 9.5 }}>{catchAll.id}</span>
                  <Chip tone="at-risk">asked cold</Chip>
                </div>
                <h3
                  className="display"
                  style={{ fontSize: "clamp(19px, 2vw, 24px)", maxWidth: "34ch", marginBottom: 14 }}
                >
                  {catchAll.question}
                </h3>
                <p className="small dim60" style={{ maxWidth: "86ch", lineHeight: 1.62, marginBottom: 14 }}>
                  {catchAll.why}
                </p>
                <Hairline />
                <div className="stack" style={{ gap: 9, marginTop: 14 }}>
                  <div className="row" style={{ alignItems: "baseline", gap: 12 }}>
                    <span
                      className="mono-label"
                      style={{ fontSize: 9.5, minWidth: 84, flex: "none", color: "var(--orange-deep)" }}
                    >
                      answered
                    </span>
                    <span className="small" style={{ lineHeight: 1.62, maxWidth: "82ch" }}>
                      {catchAll.answer}
                    </span>
                  </div>
                  <div className="row wrap" style={{ gap: 8, alignItems: "baseline" }}>
                    <span className="mono-label dim" style={{ fontSize: 9.5, minWidth: 84 }}>
                      routed to
                    </span>
                    {catchAll.unlocks?.map((u) => (
                      <Chip key={u} tone="info">
                        {u}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </MarkedCard>
        ) : null}
      </section>

      <Hairline />

      {/* ══ 5 · document handoff ══════════════════════════════════════ */}
      <section style={{ margin: "30px 0 34px" }}>
        <div className="row between wrap" style={{ gap: 12, marginBottom: 8 }}>
          <span className="eyebrow">
            Document handoff — {raisedAsks.length} asks derived from the bound scope
          </span>
          <Link href="/documents" className="mono-label" style={{ color: "var(--orange-deep)", fontSize: 10 }}>
            open the document vault →
          </Link>
        </div>
        <p className="sub" style={{ maxWidth: "80ch", marginBottom: 18 }}>
          Not a checklist — every requirement carries the profile fact that produced it, so the firm
          can always answer the only question that matters: why are you asking me this. A broker on
          the identical licence, without QSB designation, without MTF and without algorithmic order
          flow, receives 22 of these {raisedAsks.length}; the four-document delta is the whole
          thesis. Document records in this sandbox are illustrative — the one set of extracted
          values that is real is the listed-entity filing bundle.
        </p>

        <MarkedCard pad={22}>
          <div className="row wrap" style={{ gap: 10, marginBottom: 16 }}>
            {(["verified", "received", "expired", "required"] as DocumentStatus[]).map((s) => (
              <Link key={s} href="/documents">
                <span className="chip" data-tone={DOC_TONE[s]}>
                  {DOC_COUNTS[s] ?? 0} {s}
                </span>
              </Link>
            ))}
            <Link href="/documents">
              <span className="chip" data-tone="info">
                {waivedDocs.length} waived · evaluated and not raised
              </span>
            </Link>
          </div>

          <Hairline />

          <div className="stack" style={{ gap: 12, marginTop: 16 }}>
            <span className="mono-label dim" style={{ fontSize: 9.5 }}>
              Open asks — {openAsks.length} requirements with no document at all
            </span>
            {openAsks.map((r) => (
              <div key={r.id}>
                <div className="row between wrap" style={{ gap: 10 }}>
                  <div className="row wrap" style={{ gap: 10 }}>
                    <span className="mono-label dim" style={{ fontSize: 9.5 }}>{r.id}</span>
                    <span className="small" style={{ fontWeight: 600 }}>{r.name}</span>
                  </div>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <Chip tone="info">Part {r.part}</Chip>
                    <Chip tone="gap">required</Chip>
                  </div>
                </div>
                <p className="small dim60" style={{ marginTop: 4, lineHeight: 1.55 }}>
                  triggered by — {r.triggeredBy}
                </p>
              </div>
            ))}
            <Hairline dashed />
            <div className="stack" style={{ gap: 8 }}>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                Evaluated and not raised — {notRaised.length}
              </span>
              {notRaised.map((r) => (
                <p key={r.id} className="small dim60" style={{ lineHeight: 1.55 }}>
                  <span className="mono-value">{r.id}</span> {r.name} — {r.triggeredBy}
                </p>
              ))}
            </div>
          </div>

          <div className="row wrap" style={{ gap: 12, marginTop: 18 }}>
            <Link href="/documents" className="cta" data-variant="orange">
              Walk the {raisedAsks.length} asks <span className="arrow">→</span>
            </Link>
            <Link href="/register" className="cta" data-variant="ghost">
              See the register they feed <span className="arrow">→</span>
            </Link>
          </div>
        </MarkedCard>
      </section>

      <Hairline />

      {/* ══ 6 · start a new onboarding ════════════════════════════════ */}
      <section style={{ marginTop: 30 }}>
        <MarkedCard pad={24}>
          <NewOnboarding steps={blankOnboarding.steps} />
          <Hairline />
          <p className="small dim60" style={{ marginTop: 14, lineHeight: 1.6, maxWidth: "92ch" }}>
            Sandbox — resolution is disabled. In production the six steps re-run for any NSE or BSE
            entity: identify, segments, designation, scope, documents, activate. The corpus does not
            change between firms; the profile does, and the register is computed from the profile.
            Sim-clock pinned to {tenant.simToday}.
          </p>
        </MarkedCard>
      </section>
    </>
  );
}
