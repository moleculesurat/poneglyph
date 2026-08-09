import Link from "next/link";
import { PageHead, StatTile, MarkedCard, Chip, Hairline, KV, Cta } from "@/components/ui";
import { mcpTools, playgroundScript } from "@/data/mcp";
import { obligations } from "@/data/obligations";
import { tenant } from "@/data/tenant";
import { CopyChip } from "./CopyChip";
import { Playground } from "./Playground";
import type { McpTool } from "@/lib/schema";

/* ── static surface facts ─────────────────────────────────────────────── */

const ENDPOINT = "https://mcp.poneglyph.dev/v1";

const DESKTOP_CONFIG = `{
  "mcpServers": {
    "poneglyph": {
      "type": "sse",
      "url": "${ENDPOINT}",
      "headers": {
        "Authorization": "Bearer <PONEGLYPH_TENANT_KEY>"
      }
    }
  }
}`;

const CODE_COMMAND = `claude mcp add --transport sse poneglyph \\
  ${ENDPOINT} \\
  --header "Authorization: Bearer <PONEGLYPH_TENANT_KEY>"`;

/* ── tool card (native <details> keeps this server-rendered) ──────────── */

function ToolCard({ tool }: { tool: McpTool }) {
  return (
    <MarkedCard pad={20}>
      <div className="stack" style={{ gap: 12 }}>
        <div className="row between wrap" style={{ gap: 10 }}>
          <span className="mono-value" style={{ fontWeight: 500, fontSize: 13.5 }}>
            {tool.name}
          </span>
          <Chip tone="info">read-only</Chip>
        </div>

        <p className="small dim60" style={{ lineHeight: 1.55 }}>{tool.description}</p>

        <div>
          <div className="mono-label dim" style={{ fontSize: 9.5, marginBottom: 6 }}>
            inputSchema
          </div>
          <div className="terminal" style={{ maxHeight: 220, overflowY: "auto" }}>
            <pre style={{ margin: 0, fontFamily: "inherit" }}>{tool.inputSchema}</pre>
          </div>
        </div>

        <details>
          <summary className="mono-label dim">example call ▸</summary>
          <div className="stack" style={{ gap: 10, marginTop: 12 }}>
            <div className="terminal">
              <pre style={{ margin: 0, fontFamily: "inherit" }}>
                <span className="t-orange">$</span>
                <span className="t-ok"> {tool.exampleCall}</span>
              </pre>
            </div>
            <div className="terminal" style={{ maxHeight: 260, overflowY: "auto" }}>
              <pre style={{ margin: 0, fontFamily: "inherit" }}>
                <span className="t-dim">{"// result\n"}</span>
                {tool.exampleResult}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </MarkedCard>
  );
}

/* ── page ─────────────────────────────────────────────────────────────── */

export default function McpSurface() {
  return (
    <>
      <PageHead
        eyebrow={`MCP surface · ${tenant.name}`}
        title={
          <>
            MCP <span className="accent grad">Server</span>
          </>
        }
        sub={
          <>
            Seven read-only tools expose the obligation ontology over the Model Context
            Protocol — the same register the tabs above render, spoken as a protocol. Any
            MCP client can ask <b>&ldquo;are we compliant?&rdquo;</b> and walk the answer back
            to a clause. No tool can write.
          </>
        }
      />

      {/* ── surface posture ── */}
      <div className="grid cols-4" style={{ marginBottom: 30 }}>
        <StatTile label="Tools exposed" value={mcpTools.length} hint="schema-typed, examples grounded in real ids" />
        <StatTile label="Register entries queryable" value={obligations.length} hint="Master Circular + CUSPA amendment" />
        <StatTile label="Write operations" value={0} hint="read-only by design — approvals stay human" />
        <StatTile label="Transport" value="SSE" hint="bearer-token auth, tenant-scoped" />
      </div>

      {/* ── endpoint ── */}
      <section style={{ marginBottom: 36 }}>
        <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
          Endpoint
        </span>
        <MarkedCard pad={22}>
          <div className="row between wrap" style={{ gap: 12 }}>
            <div className="row wrap" style={{ gap: 12 }}>
              <Chip tone="live">
                <span className="dot" data-pulse /> serving
              </Chip>
              <span className="mono-value" style={{ fontSize: 13.5, wordBreak: "break-all" }}>
                {ENDPOINT}
              </span>
              <span className="mono-label dim">· SSE</span>
            </div>
            <CopyChip text={ENDPOINT} label="copy endpoint" />
          </div>
          <Hairline />
          <p className="small dim60" style={{ marginTop: 14, maxWidth: "78ch" }}>
            Authenticate with a tenant-scoped bearer token. Every call is logged against the
            hash-chained{" "}
            <Link href="/audit" style={{ textDecoration: "underline" }}>
              audit trail
            </Link>
            , so a protocol query leaves the same evidence as a click in the console. The
            sandbox endpoint is simulated — it does not accept live connections.
          </p>
        </MarkedCard>
      </section>

      {/* ── tools ── */}
      <section style={{ marginBottom: 36 }}>
        <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
          <span className="eyebrow">Seven tools over the ontology</span>
          <span className="mono-label dim">
            every example cites real register ids — OBL-SB-101, TSK-001, EV-015
          </span>
        </div>
        <div className="grid cols-2" style={{ alignItems: "start" }}>
          {mcpTools.map((t) => (
            <ToolCard key={t.name} tool={t} />
          ))}
        </div>
      </section>

      {/* ── connect a client ── */}
      <section style={{ marginBottom: 36 }}>
        <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
          Connect a client
        </span>
        <div className="grid cols-2" style={{ alignItems: "start" }}>
          <MarkedCard pad={20}>
            <div className="stack" style={{ gap: 12 }}>
              <div className="row between wrap" style={{ gap: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14.5 }}>Claude Desktop</span>
                <CopyChip text={DESKTOP_CONFIG} label="copy json" />
              </div>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                claude_desktop_config.json
              </span>
              <div className="terminal">
                <pre style={{ margin: 0, fontFamily: "inherit" }}>{DESKTOP_CONFIG}</pre>
              </div>
            </div>
          </MarkedCard>

          <MarkedCard pad={20}>
            <div className="stack" style={{ gap: 12 }}>
              <div className="row between wrap" style={{ gap: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14.5 }}>Claude Code</span>
                <CopyChip text={CODE_COMMAND} label="copy command" />
              </div>
              <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                one command, project or user scope
              </span>
              <div className="terminal">
                <pre style={{ margin: 0, fontFamily: "inherit" }}>
                  <span className="t-orange">$</span>
                  <span className="t-ok"> {CODE_COMMAND}</span>
                </pre>
              </div>
              <p className="small dim60" style={{ lineHeight: 1.55 }}>
                Replace the placeholder with a tenant key issued from the console. Keys are
                scoped to {tenant.sebiRegNo} and never grant write access.
              </p>
            </div>
          </MarkedCard>
        </div>
      </section>

      {/* ── playground ── */}
      <section style={{ marginBottom: 36 }}>
        <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
          <span className="eyebrow">Playground — the CUSPA question, over the protocol</span>
          <span className="mono-label dim">recorded 2026-07-12 · deterministic replay</span>
        </div>
        <MarkedCard pad={24}>
          <Playground script={playgroundScript} />
        </MarkedCard>
        <p className="small dim60" style={{ marginTop: 12, maxWidth: "78ch" }}>
          The assistant calls <span className="mono-value">check_compliance_status</span>,
          receives the register&rsquo;s posture as structured JSON, and answers with clause
          citations. Follow any id it names into the{" "}
          <Link href="/register" style={{ textDecoration: "underline" }}>
            register
          </Link>{" "}
          or{" "}
          <Link href="/remediation" style={{ textDecoration: "underline" }}>
            remediation
          </Link>{" "}
          tabs — the protocol and the console read the same ontology.
        </p>
      </section>

      {/* ── share with SEBI ── */}
      <section style={{ marginBottom: 36 }}>
        <span className="eyebrow" style={{ marginBottom: 14, display: "inline-flex" }}>
          Share with SEBI
        </span>
        <MarkedCard pad={24}>
          <div className="grid cols-2" style={{ alignItems: "start", gap: 26 }}>
            <div className="stack" style={{ gap: 12 }}>
              <div className="row wrap" style={{ gap: 10 }}>
                <Chip tone="live">inspector scope</Chip>
                <Chip tone="info">read-only</Chip>
              </div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                Hand an inspector the endpoint, not a data-room export
              </div>
              <p className="small dim60" style={{ lineHeight: 1.6 }}>
                An inspector-scoped token grants the same seven tools against the same
                register — no stale PDF bundle, no divergent copy of the truth. Every query
                the inspector runs is appended to the audit chain, so the inspection itself
                becomes part of the evidence. Revoke the token and access ends; the log of
                what was asked remains.
              </p>
              <div className="row wrap" style={{ gap: 12 }}>
                <Cta variant="orange" toastMsg="Sandbox — token issuance is disabled in the demo">
                  Generate inspector token
                </Cta>
                <Link href="/inspector" className="cta" data-variant="ghost">
                  Preview the inspector view <span className="arrow">→</span>
                </Link>
              </div>
            </div>

            <div className="stack" style={{ gap: 12 }}>
              <KV k="token format">
                <span className="mono-value">pgl_insp_&#8230;</span> — bearer, single tenant
              </KV>
              <KV k="scope">7 read-only tools · no approve, no upload, no task edits</KV>
              <KV k="validity">30 days, revocable at any time from the console</KV>
              <KV k="access log">
                every call appended to the{" "}
                <Link href="/audit" style={{ textDecoration: "underline" }}>
                  hash-chained audit trail
                </Link>{" "}
                as actor <span className="mono-value">inspector</span>
              </KV>
              <KV k="ontology">
                open schema — the same structure any SEBI intermediary can publish
              </KV>
            </div>
          </div>
        </MarkedCard>
      </section>

      {/* ── cross-links ── */}
      <Hairline />
      <div className="row wrap" style={{ gap: 22, marginTop: 18 }}>
        <Link href="/register" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          obligation register →
        </Link>
        <Link href="/evidence" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          evidence vault →
        </Link>
        <Link href="/audit" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          audit trail →
        </Link>
        <Link href="/inspector" className="mono-label" style={{ color: "var(--orange-deep)" }}>
          inspector landing →
        </Link>
      </div>
    </>
  );
}
