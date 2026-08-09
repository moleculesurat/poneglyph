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
   renders whatever the engine actually did, including when that is nothing. */

const REAL_HERE = [
  {
    k: "Pipeline execution",
    v: "Submitting a clause starts a real run in the Worker. The trace you watch is written step by step as each agent finishes; it is not a replay of a stored script.",
  },
  {
    k: "The model call",
    v: "One call to a hosted language model per run, serialised, timed out at four minutes, attempted at most twice. When it fails, the run is marked failed and says why. No result is ever substituted.",
  },
  {
    k: "The verifier",
    v: "Five deterministic checks in plain code — no model, no probability. citations-resolve searches the clause you submitted for the model's excerpt and records the character offsets it finds. A hallucinated citation cannot pass it.",
  },
  {
    k: "The hash chain",
    v: "SHA-256 computed with Web Crypto over a canonical event string. Verification recomputes every digest from content, which is why the tamper control breaks it for real.",
  },
  {
    k: "The gate",
    v: "Approve or reject writes to persisted state in your own sandbox: the obligation moves collections, the run closes, and a new audit event is appended with a computed hash.",
  },
];

const SIMULATED_ELSEWHERE = [
  {
    k: "The seeded register",
    v: `The ${obligations.length} obligations, ${evidence.length} evidence artifacts, ${tasks.length} remediation tasks, ${documentRequirements.length} document requirements and ${runs.length} historical runs on the other screens are authored fixtures. They are illustrative compliance posture, not observations about any firm.`,
  },
  {
    k: "The seeded trail",
    v: `The ${auditEvents.length} audit events that pre-date your session were authored as content. They are re-hashed for real when your sandbox is seeded, so the chain arithmetic is genuine — but the events themselves describe a simulated history.`,
  },
  {
    k: "The watchtower",
    v: "The scraper catches are fixtures. Nothing on this page polls sebi.gov.in.",
  },
];

export default function LivePage() {
  return (
    <>
      <PageHead
        eyebrow="Live engine · executes on request"
        title={
          <>
            Live <span className="accent grad">Pipeline</span>
          </>
        }
        sub={
          <>
            Every other screen in this sandbox is seeded — authored data, rendered. On this one the
            pipeline <b>actually executes</b>, the hashes are <b>actually computed</b> with SHA-256,
            and the approval <b>actually changes state</b>. Submit a clause and watch the engine
            work, including the parts where it is slow or wrong.
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
            <span className="mono-label dim">your sandbox</span>
            <p className="small dim60" style={{ margin: 0, lineHeight: 1.7 }}>
              A cookie mints you a private sandbox seeded from the same fixtures as the rest of the
              site. Runs you start, obligations you approve and events you append are yours alone —
              nobody else&apos;s view changes, and you can reseed it at any time from the chain panel
              at the bottom of this page.
            </p>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="mono-label dim">the tenant</span>
            <p className="small dim60" style={{ margin: 0, lineHeight: 1.7 }}>
              {tenant.name} is a real, listed, SEBI-registered stock broker, and its identity is the
              only real thing here. Everything this page produces about compliance posture is
              illustrative: obligations drafted from a clause you paste are a demonstration of the
              engine, not a statement about the firm.
            </p>
          </div>
        </div>
      </MarkedCard>

      <LiveConsole />

      {/* ── 06 · the honest footer ──────────────────────────────────── */}
      <section style={{ margin: "52px 0 40px" }}>
        <Hairline />
        <div className="stack" style={{ gap: 18, marginTop: 26 }}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="mono-label dim">06 · what is real, and what is not</span>
            <h2 className="display" style={{ fontSize: 24 }}>
              The contrast <span className="accent grad">is the argument</span>
            </h2>
          </div>

          <div className="grid cols-2" style={{ gap: 18 }}>
            <MarkedCard pad={22}>
              <div className="stack" style={{ gap: 14 }}>
                <div className="row wrap between" style={{ gap: 10 }}>
                  <span className="mono-label dim">real on this page</span>
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
                  Walk the seeded surfaces at <Link href="/agents">Agent Console</Link>,{" "}
                  <Link href="/register">Obligation Register</Link> and{" "}
                  <Link href="/audit">Audit Trail</Link>. They show the shape of the product at
                  scale; this page shows that the shape is reachable.
                </span>
              </div>
            </MarkedCard>
          </div>

          <p className="small dim60" style={{ margin: 0, lineHeight: 1.7, maxWidth: "82ch" }}>
            Nothing on this page asserts that {tenant.name} is or is not compliant with anything. No
            finding, inspection outcome or penalty is depicted anywhere in this sandbox, and the only
            registration number it will print is the one the firm publishes itself — held as declared
            until a certificate is read.
          </p>
        </div>
      </section>
    </>
  );
}
