import type { AuditEvent } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Append-only audit trail — hash-chained. Each event's hash is
   sha256(id|at|actor|action|subjectType|subjectId|detail|prevHash)
   truncated to 12 hex chars; AE-0001 anchors to "GENESIS". One seed event:
   the corpus load. Everything after fills through the pipeline and the gate.
   ══════════════════════════════════════════════════════════════════════ */

export const auditEvents: AuditEvent[] = [
  {
    id: "AE-0001",
    at: "2026-09-09T00:00:00+05:30",
    actor: "system:seed",
    action: "corpus.loaded",
    subjectType: "corpus",
    subjectId: "MC-PM-2025,MC-AIF-2026",
    detail:
      "Register initialised for Molecule Ventures LLP. Corpus loaded: Master Circular for Portfolio Managers (SEBI/HO/IMD/IMD-POD-1/P/CIR/2025/104, 16 Jul 2025) and Master Circular for AIFs (HO/19/34/11(6)2025-AFD-POD1/I/12928/2026, 3 Jun 2026). No obligation has been drafted; the register fills only through the pipeline and the human gate.",
    prevHash: "GENESIS",
    hash: "492a3eac54e5",
  },
];
