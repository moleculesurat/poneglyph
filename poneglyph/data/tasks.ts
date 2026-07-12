import type { RemediationTask } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Remediation queue — simulated. Every task is chained to the obligation
   (and therefore the clause) that demands it, and to the pipeline run
   that raised it. TSK-001…007 were opened by RUN-047 against the CUSPA
   delta; TSK-008/009 are older register findings still in flight.
   Due dates derive from the circulars' real deadlines, front-loaded to
   leave verification headroom before the regulatory date.
   ══════════════════════════════════════════════════════════════════════ */

export const tasks: RemediationTask[] = [
  {
    id: "TSK-001",
    obligationId: "OBL-SB-101",
    title: "Open and tag the CUSPA account with the depository",
    description:
      "File the account-opening request with the depository for a separate demat account designated 'Client Unpaid Securities Pledgee Account', confirm the CUSPA tag is applied, and restrict operational access to the pledge workflow only. Depository confirmation becomes the bound evidence for OBL-SB-101.",
    owner: "Rohan Iyer",
    status: "open",
    priority: "high",
    due: "2026-08-15",
    createdByRun: "RUN-047",
  },
  {
    id: "TSK-002",
    obligationId: "OBL-SB-102",
    title: "Build auto-pledge on pay-out with day-6 auto-release",
    description:
      "Extend the post-pay-out job to create an auto-pledge in favour of the CUSPA for every unpaid position via the depository pledge API — no client instruction required — and wire the day-5 invocation decision with day-6 auto-release fallback per para 46.5. Reconciled pledge-creation log is the evidence spec.",
    owner: "Dev Khanna",
    status: "in-progress",
    priority: "high",
    due: "2026-10-01",
    createdByRun: "RUN-047",
  },
  {
    id: "TSK-003",
    obligationId: "OBL-SB-103",
    title: "Ship pledge-intimation email and SMS templates",
    description:
      "Draft and deploy event-triggered email/SMS templates carrying the three mandated fields — securities pledged, amount outstanding, invoke/release date — fired on pledge creation, with per-intimation delivery logging retained for audit.",
    owner: "Dev Khanna",
    status: "open",
    priority: "medium",
    due: "2026-09-15",
    createdByRun: "RUN-047",
  },
  {
    id: "TSK-004",
    obligationId: "OBL-SB-104",
    title: "Board approval of unpaid-securities policy (5-day cap)",
    description:
      "Finalise the draft policy on handling of clients' unpaid securities with the payment window capped at five trading days from pay-out, table it at the next board meeting for approval, and archive the signed minute. Draft is uploaded as EV-020; the register entry stays pending-review until the compliance officer signs off the mapping.",
    owner: "Priya Nair",
    status: "in-progress",
    priority: "high",
    due: "2026-08-30",
    createdByRun: "RUN-047",
  },
  {
    id: "TSK-005",
    obligationId: "OBL-SB-107",
    title: "Stand up the daily CUSPA reconciliation job",
    description:
      "Build the end-of-day job that reconciles the maximum value of securities eligible for CUSPA pledge against aggregate unpaid client obligations, raises exceptions to operations, and preserves each day's output in the records vault per para 46.11.",
    owner: "Dev Khanna",
    status: "open",
    priority: "medium",
    due: "2026-10-15",
    createdByRun: "RUN-047",
  },
  {
    id: "TSK-006",
    obligationId: "OBL-SB-109",
    title: "Phase-2 readiness review (paras 46.12–46.14)",
    description:
      "Track the exchange operational guidelines (due ~2026-08-02), pin the confirmed phase-1 and phase-2 go-live dates, and run a documented readiness review ahead of the 2027-01-03 phase-2 effectivity covering agreements, T&C and policy dissemination.",
    owner: "Priya Nair",
    status: "open",
    priority: "medium",
    due: "2026-12-01",
    createdByRun: "RUN-047",
  },
  {
    id: "TSK-007",
    obligationId: "OBL-SB-110",
    title: "Roll out T&C addendum to all active clients",
    description:
      "Legal addendum reflecting the pledge-based CUSPA mechanism drafted, reviewed and disseminated to all 12,408 active clients via email and in-app notice, with delivery tracking and a completion report bound as evidence before the 2027-01-03 deadline.",
    owner: "Rohan Iyer",
    status: "open",
    priority: "medium",
    due: "2026-10-30",
    createdByRun: "RUN-047",
  },
  {
    id: "TSK-008",
    obligationId: "OBL-SB-009",
    title: "Nomination re-papering — 214 legacy accounts",
    description:
      "Close the nomination coverage gap (currently 94.1%) by obtaining nomination or opt-out declarations from the 214 remaining legacy accounts. Weekly campaign tracking; coverage report EV-019 refreshes as accounts complete.",
    owner: "Rohan Iyer",
    status: "in-progress",
    priority: "medium",
    due: "2026-09-30",
    createdByRun: "RUN-041",
  },
  {
    id: "TSK-009",
    obligationId: "OBL-SB-021",
    title: "VAPT re-test of 2 open medium findings",
    description:
      "Remediate and re-test the two medium-severity findings left open from the last VAPT cycle, capture closure verification through the Walrus scan engine, and re-bind EV-015 so OBL-SB-021 returns to met before the 2026-08-20 closure re-validation deadline.",
    owner: "Dev Khanna",
    status: "in-progress",
    priority: "high",
    due: "2026-08-20",
    createdByRun: "RUN-044",
  },
];
