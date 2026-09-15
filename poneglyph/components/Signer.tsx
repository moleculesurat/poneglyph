"use client";

/* The signer strip shared by every write control in the vault, and by the
   register's AttachEvidence: who is acting, and the shared gate token the
   Worker checks on every write. The token lives in sessionStorage under the
   same key the console's GateCard uses (GATE_TOKEN_KEY), so it is typed once
   per session and every form picks it up. Controlled: the parent owns the two
   values so it can send them; this strip renders them and persists the token. */

import { useEffect } from "react";
import { tenant } from "@/data/tenant";
import { GATE_TOKEN_KEY } from "@/app/live/api";

const field: React.CSSProperties = {
  border: "1.5px solid var(--ink-10)",
  background: "var(--white)",
  padding: "9px 11px",
  color: "var(--ink)",
};

export function Signer({
  signer,
  onSigner,
  token,
  onToken,
}: {
  signer: string;
  onSigner: (v: string) => void;
  token: string;
  onToken: (v: string) => void;
}) {
  /* hydrate the shared token once, post-mount — SSR renders the empty field, so
     the first client paint matches before this fills it in */
  useEffect(() => {
    try {
      const t = sessionStorage.getItem(GATE_TOKEN_KEY);
      if (t) onToken(t);
    } catch {
      /* sessionStorage unavailable — leave the field empty */
    }
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
      <select
        style={field}
        className="mono-value"
        value={signer}
        onChange={(e) => onSigner(e.target.value)}
        aria-label="signer"
      >
        {tenant.team.map((m) => (
          <option key={m.name} value={m.name}>
            {m.name}
          </option>
        ))}
      </select>
      <input
        type="password"
        style={field}
        className="mono-value"
        placeholder="gate token"
        value={token}
        onChange={(e) => {
          onToken(e.target.value);
          try {
            sessionStorage.setItem(GATE_TOKEN_KEY, e.target.value);
          } catch {
            /* sessionStorage unavailable — the header just won't be persisted */
          }
        }}
      />
    </div>
  );
}
