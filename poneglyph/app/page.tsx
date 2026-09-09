import Image from "next/image";
import Link from "next/link";
import { MarkedCard, Chip, Eyebrow, Hairline } from "@/components/ui";
import { DashField } from "@/components/DashField";
import { EntryGateStart } from "@/app/EntryGateStart";
import { angelOne, factOf } from "@/data/entity";
import { obligations } from "@/data/obligations";
import { blankOnboarding } from "@/data/onboarding";
import { tenant } from "@/data/tenant";
import { SEBI_DOMAINS } from "@/lib/domains";

/* ══════════════════════════════════════════════════════════════════════
   Entry gate — the cover of the product. Full-bleed: AppShell drops its
   sidebar and breadcrumb header for this one route, so everything here
   lays itself out. Two entry paths and nothing else competing.
   ══════════════════════════════════════════════════════════════════════ */

const netWorth = factOf("net-worth-fy26");
const clientBase = factOf("client-base-total");

/* Four lines of proof that the demo tenant is a real filed entity, not a
   mock. Every figure is read from data/entity.ts with its provenance —
   none of it is typed here. */
const PROOF: { k: string; v: string; note: string }[] = [
  ...(netWorth
    ? [{ k: netWorth.label, v: netWorth.value, note: `${netWorth.provenance} · as of ${netWorth.asOf}` }]
    : []),
  ...(clientBase
    ? [{ k: clientBase.label, v: clientBase.value, note: `${clientBase.provenance} · as of ${clientBase.asOf}` }]
    : []),
  {
    k: "Designation",
    v: angelOne.qsb ? "Qualified Stock Broker" : "Not designated",
    note: "computed · unconfirmed",
  },
  {
    k: "Register scope",
    v: `${obligations.length} obligations · ${SEBI_DOMAINS.length} rulebooks`,
    note: `${angelOne.excludedParts.length} Part scoped out, with its reason on the record`,
  },
];

export default function EntryGate() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* texture, kept to the right margin so it never washes the reading
          column — the incised-rule motif, not a background */}
      <DashField
        rows={12}
        seed={23}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "38%",
          height: 340,
          opacity: 0.14,
          maskImage: "linear-gradient(255deg, #000 20%, transparent 88%)",
          WebkitMaskImage: "linear-gradient(255deg, #000 20%, transparent 88%)",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: "var(--shell-max)",
          margin: "0 auto",
          padding: "clamp(38px, 6vw, 84px) clamp(20px, 5vw, 56px) clamp(56px, 6vw, 90px)",
        }}
      >
        {/* ── mark, wordmark, tagline ─────────────────────────────────── */}
        <div className="row" style={{ gap: 16, marginBottom: 30 }}>
          {/* unoptimized: see AppShell — the optimizer rejects SVG by default */}
          <Image src="/poneglyph-mark.svg" alt="Poneglyph" width={58} height={58} priority unoptimized />
          <span className="stack" style={{ gap: 6 }}>
            <span
              className="mono-label"
              style={{ fontSize: "clamp(20px, 2.6vw, 28px)", letterSpacing: "0.22em", lineHeight: 1 }}
            >
              Poneglyph
            </span>
            <span
              className="mono-label dim"
              style={{ fontSize: 9.5, letterSpacing: "0.24em", textTransform: "lowercase" }}
            >
              agentic compliance
            </span>
          </span>
        </div>

        <span className="mono-label dim60" style={{ fontSize: 10.5, letterSpacing: "0.16em" }}>
          Regulatory obligation management · sandbox environment
        </span>

        {/* ── what the system is ──────────────────────────────────────── */}
        <h1
          className="display"
          style={{ fontSize: "clamp(30px, 4.6vw, 56px)", maxWidth: "19ch", margin: "22px 0 24px" }}
        >
          Agentic compliance engine for{" "}
          <span className="accent grad">SEBI-registered intermediaries</span>
        </h1>

        <p className="sub" style={{ maxWidth: "70ch", fontSize: 15.5 }}>
          Poneglyph reads a SEBI master circular the way a compliance officer has to — clause by
          clause, against one specific firm — and turns it into a living, auditable obligation
          register for that market intermediary. Agents do the reading, the mapping and the
          re-mapping when SEBI amends; a named human signs before anything goes live, and every
          step leaves a hash-chained trail an inspector can walk without asking the firm for
          anything.
        </p>

        <p className="small dim60" style={{ maxWidth: "70ch", marginTop: 20, lineHeight: 1.65 }}>
          Built for the SEBI Securities Market TechSprint at Global Fintech Fest 2026 —{" "}
          <b style={{ color: "var(--ink)", fontWeight: 600 }}>
            Problem Statement 2, Agentic Compliance
          </b>
          . This is the frontend sandbox: the whole engine is walkable, and nothing in it is
          actionable.
        </p>

        <Hairline />

        {/* ── mode selector ───────────────────────────────────────────── */}
        <div style={{ margin: "34px 0 20px" }}>
          <Eyebrow>Entry paths</Eyebrow>
        </div>

        <div className="grid cols-2" style={{ alignItems: "start", gap: 22 }}>
          {/* ── primary: the firm already onboarded ── */}
          <MarkedCard pad={30}>
            <div className="stack" style={{ gap: 18 }}>
              <div className="row between wrap" style={{ gap: 10 }}>
                <Chip tone="live">
                  <span className="dot" data-pulse /> Recommended path
                </Chip>
                <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                  {angelOne.id} · session ONB-001
                </span>
              </div>

              <h2 className="display" style={{ fontSize: "clamp(23px, 2.6vw, 31px)" }}>
                Onboarded entity —{" "}
                <span className="accent grad">{angelOne.legalName}</span>
              </h2>

              <p className="small dim60" style={{ lineHeight: 1.6 }}>
                A real, listed, SEBI-registered stock broker, already onboarded from its own public
                filings. Nothing below was written for the demo — the engine resolved the entity,
                read the filed results and stamped every figure with the document it came from
                before a single obligation was mapped.
              </p>

              <div className="stack" style={{ gap: 0 }}>
                {PROOF.map((p, i) => (
                  <div
                    key={p.k}
                    className="row between"
                    style={{
                      alignItems: "flex-start",
                      gap: 14,
                      padding: "11px 0",
                      borderTop: i === 0 ? "none" : "1px solid var(--ink-05)",
                    }}
                  >
                    <span className="mono-label dim" style={{ fontSize: 9.5, flex: "0 0 auto" }}>
                      {p.k}
                    </span>
                    <span
                      className="stack"
                      style={{ gap: 3, alignItems: "flex-end", flex: "1 1 auto", minWidth: 0 }}
                    >
                      <span className="small tnum" style={{ fontWeight: 600, textAlign: "right" }}>
                        {p.v}
                      </span>
                      <span
                        className="mono-label dim"
                        style={{ fontSize: 8.5, textAlign: "right", lineHeight: 1.5 }}
                      >
                        {p.note}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <span className="small dim60">
                Each figure carries its source on the entity profile — filing, exchange record,
                declared input or engine arithmetic, labelled as such.
              </span>

              <div className="row wrap" style={{ gap: 14 }}>
                <Link href="/onboarding" className="cta">
                  Open the entity profile <span className="arrow">→</span>
                </Link>
              </div>
            </div>
          </MarkedCard>

          {/* ── secondary: run it against a different firm ── */}
          <MarkedCard pad={30}>
            <div className="stack" style={{ gap: 18 }}>
              <div className="row between wrap" style={{ gap: 10 }}>
                <Chip tone="pending">Blank template</Chip>
                <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                  {blankOnboarding.id} · mode {blankOnboarding.mode}
                </span>
              </div>

              <h2 className="display" style={{ fontSize: "clamp(23px, 2.6vw, 31px)" }}>
                New entity <span className="accent grad">onboarding</span>
              </h2>

              <p className="small dim60" style={{ lineHeight: 1.6 }}>
                The same {blankOnboarding.steps.length} steps run for any NSE- or BSE-listed
                intermediary. The engine resolves the legal person, reads what public disclosure
                supports, and asks only about what it cannot see.
              </p>

              <div className="row wrap" style={{ gap: 7 }}>
                {blankOnboarding.steps.map((s, i) => (
                  <span key={s.key} className="chip" data-tone="info" style={{ fontSize: 9.5 }}>
                    {String(i + 1).padStart(2, "0")} {s.key}
                  </span>
                ))}
              </div>

              <p className="small dim60" style={{ lineHeight: 1.6 }}>
                Every ask is <b style={{ color: "var(--ink)", fontWeight: 600 }}>derived from the
                entity profile</b>, never read off a checklist. A firm that declares different
                segments gets a different scope, a different document list and a different register
                from the same corpus. Applicability is computed from the profile rather than read
                off the licence, so two brokers holding the same registration do not carry the same
                obligations.
              </p>

              <EntryGateStart />

              <Link href="/onboarding" className="mono-label" style={{ color: "var(--orange-deep)", fontSize: 10 }}>
                or open the blank {blankOnboarding.steps.length}-step template →
              </Link>
            </div>
          </MarkedCard>
        </div>

        {/* ── tertiary ────────────────────────────────────────────────── */}
        <div className="row" style={{ marginTop: 26 }}>
          <Link href="/dashboard" className="mono-label dim" style={{ fontSize: 10 }}>
            skip to the dashboard →
          </Link>
        </div>

        <Hairline />

        {/* ── the honesty line ────────────────────────────────────────── */}
        <p className="small dim60" style={{ maxWidth: "94ch", marginTop: 22, lineHeight: 1.65 }}>
          {angelOne.legalName}&rsquo;s identity, listing and financial figures are real, public and
          sourced; the broker registration {tenant.sebiRegNo} is held as{" "}
          <b style={{ color: "var(--ink)", fontWeight: 600 }}>declared</b>, not verified, until its
          certificate is read. All compliance posture in this sandbox — obligations met or gapped,
          evidence, remediation, audit events, every trace — is{" "}
          <b style={{ color: "var(--ink)", fontWeight: 600 }}>illustrative</b>
          {" "}and asserts nothing whatsoever about the firm&rsquo;s actual compliance.
        </p>
      </div>
    </div>
  );
}
