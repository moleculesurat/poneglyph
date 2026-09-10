"use client";

/* Attach evidence to an approved duty, from its register row. The file never
   leaves the browser: we hash it here and send only the sha256 + metadata, so
   the firm keeps its own document. The gate token is shared with the console's
   GateCard through sessionStorage; apiCall reads it from there. */

import { useEffect, useState } from "react";
import { apiCall, EvidenceResponse, GATE_TOKEN_KEY } from "@/app/live/api";
import { tenant } from "@/data/tenant";
import type { EvidenceKind } from "@/lib/schema";

const OFFICER = tenant.team[0].name;
const KINDS: EvidenceKind[] = ["document", "data-check", "live-scan"];

const field: React.CSSProperties = {
  border: "1.5px solid var(--ink-10)",
  background: "var(--white)",
  padding: "9px 11px",
  color: "var(--ink)",
};

async function sha256Hex(file: File): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function AttachEvidence({ obligationId, onBound }: { obligationId: string; onBound: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EvidenceKind>("document");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<{ name: string; hex: string } | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      setToken(sessionStorage.getItem(GATE_TOKEN_KEY) ?? "");
    } catch {
      /* sessionStorage unavailable — leave the field empty */
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setOk(null);
    setErr(null);
    try {
      const r = await apiCall<EvidenceResponse>(`/api/obligations/${obligationId}/evidence`, {
        method: "POST",
        body: { kind, title, description, fileName: file?.name, sha256: file?.hex, officer: OFFICER },
      });
      setOk(`${r.evidence.id} bound · chain ${r.chainTip.slice(0, 12)}`);
      onBound();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" style={{ gap: 10 }} onSubmit={submit}>
      <span className="mono-label dim">Attach evidence</span>
      <input style={field} className="mono-value" placeholder="title" value={title}
        onChange={(e) => setTitle(e.target.value)} required />
      <div className="row wrap" style={{ gap: 10 }}>
        <select style={field} className="mono-value" value={kind}
          onChange={(e) => setKind(e.target.value as EvidenceKind)}>
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <input style={{ ...field, flex: 1, minWidth: 160 }} className="mono-value" placeholder="description"
          value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="stack" style={{ gap: 3 }}>
        <input type="file" onChange={async (e) => {
          const f = e.target.files?.[0];
          setFile(f ? { name: f.name, hex: await sha256Hex(f) } : null);
        }} />
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
          {file ? `${file.name} · ${file.hex.slice(0, 12)}…` : "the file is never uploaded — only its sha256 and metadata are sent"}
        </span>
      </div>
      <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
        <input type="password" style={field} className="mono-value" placeholder="gate token" value={token}
          onChange={(e) => {
            setToken(e.target.value);
            try {
              sessionStorage.setItem(GATE_TOKEN_KEY, e.target.value);
            } catch {
              /* sessionStorage unavailable — the header just won't be sent */
            }
          }} />
        <button type="submit" className="mono-value" style={{ ...field, cursor: "pointer", color: "var(--orange-deep)" }}
          disabled={busy || !title.trim()}>
          {busy ? "binding…" : "Bind evidence"}
        </button>
        <span className="mono-label dim" style={{ fontSize: 9.5 }}>signs as {OFFICER}</span>
      </div>
      {ok ? <span className="mono-value" style={{ color: "var(--orange-deep)" }}>{ok}</span> : null}
      {err ? <span className="small" style={{ color: "var(--orange-deep)" }}>{err}</span> : null}
    </form>
  );
}
