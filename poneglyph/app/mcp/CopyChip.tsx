"use client";

/* Copy-to-clipboard chip — writes the given text and confirms via the
   sandbox toast. Clipboard write is best-effort (some contexts block it);
   the toast fires either way so the interaction always acknowledges. */

import { useSandboxToast } from "@/components/toast";

export function CopyChip({ text, label = "copy" }: { text: string; label?: string }) {
  const toast = useSandboxToast();
  return (
    <button
      className="chip"
      data-tone="info"
      aria-label={`Copy ${label} to clipboard`}
      onClick={() => {
        try {
          void navigator.clipboard?.writeText(text);
        } catch {
          /* clipboard unavailable — toast still confirms the intent */
        }
        toast("Copied to clipboard");
      }}
    >
      {label} →
    </button>
  );
}
