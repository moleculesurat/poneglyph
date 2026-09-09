import Link from "next/link";
import { Chip, Hairline, MarkedCard, PageHead } from "@/components/ui";
import { tenant } from "@/data/tenant";
import { obligations } from "@/data/obligations";
import { evidence } from "@/data/evidence";
import { tasks } from "@/data/tasks";
import { documentRequirements } from "@/data/documents";
import { runs } from "@/data/runs";
import { auditEvents } from "@/data/audit";
import { LiveConsole } from "./LiveConsole";

/* Every other route in this sandbox renders authored TypeScript. This one
   renders what the engine did on the request, including when that is nothing. */

const REAL_HERE = [
  {
    k: "Pipeline execution",
    v: "A submitted clause starts a run in the Worker. The trace is written step by step as each agent finishes; it is not a replay of a stored script.",
  },
  {
    k: "Model call",
    v: "One call to a hosted language model per run, serialised, timed out at four minutes, attempted at most twice. A failed call marks the run failed and records the reason. No result is substituted.",
  },
  {
    k: "Deterministic verifier",
    v: "Five checks in plain code — no model, no probability. citations-resolve searches the submitted clause for the model's excerpt and records the character offsets it finds. A citation that does not occur verbatim cannot pass it.",
  },
  {
    k: "Hash chain",
    v: "SHA-256 computed with Web Crypto over a canonical event string. Verification recomputes every digest from the event's own content, so the tamper test — which edits stored content and leaves the stored hash alone — is detected by arithmetic rather than by a flag.",
  },
  {
    k: "Authorisation gate",
    v: "Approve or reject writes to persisted state in the visitor's own sandbox: the obligation moves collections, the run closes, and a new audit event is appended with a computed hash.",
  },
];

const SIMULATED_ELSEWHERE = [
  {
    k: "Seeded register",
    v: `The ${obligations.length} obligations, ${evidence.length} evidence artifacts, ${tasks.length} remediation tasks, ${documentRequirements.length} document requirements and ${runs.length} historical runs on the other routes are authored fixtures. They are illustrative compliance posture, not observations about any firm.`,
  },
  {
    k: "Seeded audit trail",
    v: `The ${auditEvents.length} audit events that pre-date the session were authored as content. They are re-hashed on seeding, so the chain arithmetic is genuine — the events themselves describe a simulated history.`,
  },
  {
    k: "Watchtower catches",
    v: "The scraper catches are fixtures. Nothing on this route polls sebi.gov.in.",
  },
];

export default function LivePage() {
  return (
    <>
      <PageHead
        eyebrow="Live engine · request-triggered execution"
        title={
          <>
            Live <span className="accent grad">Pipeline</span>
          </>
        }
        sub={
          <>
            Every other route in this sandbox renders seeded data. On this route the pipeline
            executes, the hashes are computed with SHA-256, and an approval writes state. A submitted
            clause is processed by the engine as received; latency and failures are reported as they
            occur rather than smoothed.
          </>
        }
        right={
          <div className="row wrap" style={{ gap: 10 }}>
            <Chip tone="live">live</Chip>
            <span className="mono-label dim" style={{ fontSize: 9.5 }}>
              sandbox per visitor
            </span>
          </div>
        }
      />

      <MarkedCard pad={22} style={{ marginBottom: 34 }}>
        <div className="grid cols-2" style={{ gap: 22 }}>
          <div className="stack" style={{ gap: 8 }}>
            <span className="mono-label dim">session sandbox</span>
            <p className="small dim60" style={{ margin: 0, lineHeight: 1.7 }}>
              A cookie mints a private sandbox seeded from the same fixtures as the rest of the site.
              Runs started, obligations approved and events appended in this session are scoped to it
              — no other visitor&apos;s view changes — and it can be reseeded at any time from the
              chain integrity section at the bottom of this route.
            </p>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="mono-label dim">tenant disclosure</span>
            <p className="small dim60" style={{ margin: 0, lineHeight: 1.7 }}>
              {tenant.name} is a SEBI-registered portfolio manager; every fact carries its
              provenance. All compliance posture produced on this route is illustrative. An
              obligation drafted from a pasted clause demonstrates the engine and is not a statement
              about the firm.
            </p>
          </div>
        </div>
      </MarkedCard>

      <LiveConsole />

      {/* ── 06 · scope statement ────────────────────────────────────── */}
      <section style={{ margin: "52px 0 40px" }}>
        <Hairline />
        <div className="stack" style={{ gap: 18, marginTop: 26 }}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="mono-label dim">06 · real execution and seeded data</span>
            <h2 className="display" style={{ fontSize: 24 }}>
              Execution <span className="accent grad">scope</span>
            </h2>
          </div>

          <div className="grid cols-2" style={{ gap: 18 }}>
            <MarkedCard pad={22}>
              <div className="stack" style={{ gap: 14 }}>
                <div className="row wrap between" style={{ gap: 10 }}>
                  <span className="mono-label dim">real on this route</span>
                  <Chip tone="met">executes</Chip>
                </div>
                {REAL_HERE.map((row) => (
                  <div key={row.k} className="stack" style={{ gap: 5 }}>
                    <span className="mono-value" style={{ color: "var(--ink)" }}>
                      {row.k}
                    </span>
                    <span className="small dim60" style={{ lineHeight: 1.65 }}>
                      {row.v}
                    </span>
                  </div>
                ))}
              </div>
            </MarkedCard>

            <MarkedCard pad={22}>
              <div className="stack" style={{ gap: 14 }}>
                <div className="row wrap between" style={{ gap: 10 }}>
                  <span className="mono-label dim">simulated elsewhere</span>
                  <Chip tone="info">seeded</Chip>
                </div>
                {SIMULATED_ELSEWHERE.map((row) => (
                  <div key={row.k} className="stack" style={{ gap: 5 }}>
                    <span className="mono-value" style={{ color: "var(--ink)" }}>
                      {row.k}
                    </span>
                    <span className="small dim60" style={{ lineHeight: 1.65 }}>
                      {row.v}
                    </span>
                  </div>
                ))}
                <Hairline dashed />
                <span className="small dim60" style={{ lineHeight: 1.65 }}>
                  The seeded surfaces are <Link href="/agents">Agent Console</Link>,{" "}
                  <Link href="/register">Obligation Register</Link> and{" "}
                  <Link href="/audit">Audit Trail</Link>. Those routes render the product at full
                  corpus scale; this route runs the same pipeline on a submitted clause.
                </span>
              </div>
            </MarkedCard>
          </div>

          <p className="small dim60" style={{ margin: 0, lineHeight: 1.7, maxWidth: "82ch" }}>
            Nothing on this route asserts that {tenant.name} is or is not compliant with anything. No
            finding, inspection outcome or penalty is depicted anywhere in this sandbox, and the only
            registration number it will print is the one the firm publishes itself — held as declared
            until a certificate is read.
          </p>
        </div>
      </section>
    </>
  );
}
