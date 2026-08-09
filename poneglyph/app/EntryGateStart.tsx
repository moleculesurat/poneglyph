"use client";

/* Entry-gate onboarding starter. The only stateful thing on the cover:
   a legal name to resolve. In the sandbox it resolves to a toast — the
   flow itself is walkable at /onboarding. */

import { useState } from "react";
import { useSandboxToast } from "@/components/toast";

export function EntryGateStart() {
  const [name, setName] = useState("");
  const toast = useSandboxToast();

  const submit = () => {
    const typed = name.trim();
    toast(
      typed
        ? `Sandbox — resolution of "${typed}" is disabled`
        : "Sandbox — entity resolution is disabled in the demo"
    );
  };

  return (
    <form
      className="row wrap"
      style={{ gap: 10 }}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="mono-label dim" htmlFor="entity-name" style={{ display: "none" }}>
        Legal name of the intermediary
      </label>
      <input
        id="entity-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Legal name or registration number"
        autoComplete="off"
        spellCheck={false}
        style={{
          flex: "1 1 220px",
          minWidth: 0,
          font: "inherit",
          fontFamily: "var(--mono)",
          fontSize: 12.5,
          letterSpacing: "0.02em",
          color: "var(--ink)",
          background: "var(--white)",
          border: "1.5px solid var(--ink-20)",
          borderRadius: 6,
          padding: "12px 14px",
        }}
      />
      <button type="submit" className="cta" data-variant="ghost" style={{ flex: "none" }}>
        Resolve entity <span className="arrow">→</span>
      </button>
    </form>
  );
}
