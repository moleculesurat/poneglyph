import type { McpTool } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   MCP surface — the register as a queryable protocol endpoint.
   Seven read-only tools over the obligation ontology; every example is
   grounded in real register ids. The playground script replays a scripted
   compliance Q&A over the CUSPA amendment (deterministic, no live model).
   ══════════════════════════════════════════════════════════════════════ */

export const mcpTools: McpTool[] = [
  {
    name: "get_obligations",
    description:
      "List obligations from the register, optionally filtered by chapter, status, type or source circular. Returns register entries with clause references, owners and deadlines.",
    inputSchema: `{
  "type": "object",
  "properties": {
    "chapter": {
      "type": "string",
      "enum": ["registration", "client-dealings", "unpaid-securities",
               "margin", "supervision", "grievance", "books-records",
               "advertisement", "cyber"]
    },
    "status": {
      "type": "string",
      "enum": ["met", "gap", "at-risk", "pending-review"]
    },
    "circularId": { "type": "string" },
    "limit": { "type": "integer", "default": 50 }
  },
  "required": []
}`,
    exampleCall: `get_obligations({ "chapter": "unpaid-securities", "status": "gap" })`,
    exampleResult: `{
  "count": 6,
  "obligations": [
    { "id": "OBL-SB-101", "title": "Open dedicated CUSPA pledgee account",
      "clause": "CIRC-CUSPA-2026 §46.1", "deadline": "2026-11-02" },
    { "id": "OBL-SB-102", "title": "Auto-pledge unpaid securities to CUSPA",
      "clause": "CIRC-CUSPA-2026 §46.2", "deadline": "2026-11-02" },
    { "id": "OBL-SB-103", "title": "Email/SMS intimation on pledge creation",
      "clause": "CIRC-CUSPA-2026 §46.3", "deadline": "2026-11-02" },
    { "id": "OBL-SB-105", "title": "Day-6 auto-release of un-invoked pledges",
      "clause": "CIRC-CUSPA-2026 §46.5", "deadline": "2026-11-02" },
    { "id": "OBL-SB-107", "title": "Daily reconciliation of pledgeable value",
      "clause": "CIRC-CUSPA-2026 §46.11", "deadline": "2026-11-02" },
    { "id": "OBL-SB-110", "title": "Update client agreements & T&C for pledge regime",
      "clause": "CIRC-CUSPA-2026 §46.12", "deadline": "2027-01-03" }
  ]
}`,
  },
  {
    name: "get_obligation",
    description:
      "Fetch one register entry in full: clause reference with verbatim excerpt and character offsets, control, evidence spec, bound evidence, status, approval and content hash.",
    inputSchema: `{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Register id, e.g. OBL-SB-101",
      "pattern": "^OBL-[A-Z]{2}-[0-9]{3}$"
    }
  },
  "required": ["id"]
}`,
    exampleCall: `get_obligation({ "id": "OBL-SB-105" })`,
    exampleResult: `{
  "id": "OBL-SB-105",
  "title": "Day-6 auto-release of un-invoked pledges",
  "clause": {
    "circularId": "CIRC-CUSPA-2026", "para": "46.5",
    "excerpt": "where the pledge is not invoked, it shall be auto-released on the sixth trading day and the securities shall be free in the client's demat account",
    "charStart": 152, "charEnd": 298
  },
  "type": "ongoing", "status": "gap", "deadline": "2026-11-02",
  "control": { "id": "CTL-105", "name": "Invoke/auto-release scheduler", "owner": "Dev Khanna" },
  "evidenceSpec": [{ "kind": "data-check", "description": "Pledge lifecycle log: invocations and day-6 releases" }],
  "evidenceIds": [],
  "createdByRun": "RUN-047", "approvedBy": "Priya Nair",
  "hash": "ee72c48d15a3"
}`,
  },
  {
    name: "check_compliance_status",
    description:
      "Compute the compliance posture against a circular or chapter: counts by status, the obligations behind each count, and the nearest regulatory deadlines. This is the tool an inspector or an assistant calls first.",
    inputSchema: `{
  "type": "object",
  "properties": {
    "circularId": {
      "type": "string",
      "description": "e.g. CIRC-CUSPA-2026 or MC-SB-2025"
    },
    "chapter": { "type": "string" },
    "asOf": { "type": "string", "format": "date" }
  },
  "required": ["circularId"]
}`,
    exampleCall: `check_compliance_status({ "circularId": "CIRC-CUSPA-2026", "asOf": "2026-07-12" })`,
    exampleResult: `{
  "circularId": "CIRC-CUSPA-2026",
  "asOf": "2026-07-12",
  "obligations": 10,
  "byStatus": { "met": 0, "gap": 6, "pending-review": 3, "at-risk": 1 },
  "gaps": ["OBL-SB-101", "OBL-SB-102", "OBL-SB-103",
           "OBL-SB-105", "OBL-SB-107", "OBL-SB-110"],
  "pendingReview": ["OBL-SB-104", "OBL-SB-106", "OBL-SB-108"],
  "atRisk": ["OBL-SB-109"],
  "nearestDeadlines": [
    { "date": "2026-11-02", "phase": "paras 46.1–46.11", "obligations": 8 },
    { "date": "2027-01-03", "phase": "paras 46.12–46.14", "obligations": 2 }
  ],
  "openTasks": ["TSK-001", "TSK-002", "TSK-003", "TSK-004",
                "TSK-005", "TSK-006", "TSK-007"]
}`,
  },
  {
    name: "explain_mapping",
    description:
      "Walk one obligation back to its source: the verbatim clause text with character offsets, the extraction run that created it, the verifier checks it passed, and who approved the mapping.",
    inputSchema: `{
  "type": "object",
  "properties": {
    "obligationId": { "type": "string" }
  },
  "required": ["obligationId"]
}`,
    exampleCall: `explain_mapping({ "obligationId": "OBL-SB-101" })`,
    exampleResult: `{
  "obligationId": "OBL-SB-101",
  "clauseText": "Every trading member shall open a separate demat account designated as the 'Client Unpaid Securities Pledgee Account' (CUSPA), tagged as such with the depository, exclusively for taking a pledge of unpaid securities of clients.",
  "grounding": { "circularId": "CIRC-CUSPA-2026", "para": "46.1", "charStart": 27, "charEnd": 167 },
  "extractedBy": "RUN-047",
  "verifierChecks": ["citations-resolve", "deadlines-parse",
                     "applicability-match", "schema-valid", "hash-chain-append"],
  "approvedBy": "Priya Nair",
  "auditTrail": ["AE-0032", "AE-0038"]
}`,
  },
  {
    name: "get_evidence",
    description:
      "Fetch evidence artifacts by id or by obligation: kind, connector, capture time, content hash, history and the obligations each artifact is bound to.",
    inputSchema: `{
  "type": "object",
  "properties": {
    "id": { "type": "string", "description": "e.g. EV-015" },
    "obligationId": { "type": "string" }
  },
  "anyOf": [
    { "required": ["id"] },
    { "required": ["obligationId"] }
  ]
}`,
    exampleCall: `get_evidence({ "obligationId": "OBL-SB-021" })`,
    exampleResult: `{
  "artifacts": [
    {
      "id": "EV-015", "kind": "live-scan", "connector": "poneglyph-scan",
      "title": "VAPT report + re-test verification",
      "boundTo": ["OBL-SB-021"],
      "hash": "sha256:…",
      "history": [
        { "event": "captured" },
        { "event": "re-verified", "note": "2 medium findings still open" }
      ],
      "note": "Obligation at-risk — closure re-validation due 2026-08-20 (TSK-009)."
    }
  ]
}`,
  },
  {
    name: "get_amendments",
    description:
      "List amendments to the corpus with their diff blocks: paragraph, change kind, old/new text and the delta obligations each block created or updated.",
    inputSchema: `{
  "type": "object",
  "properties": {
    "circularId": {
      "type": "string",
      "description": "The amended circular, e.g. MC-SB-2025"
    },
    "since": { "type": "string", "format": "date" }
  },
  "required": []
}`,
    exampleCall: `get_amendments({ "circularId": "MC-SB-2025", "since": "2026-01-01" })`,
    exampleResult: `{
  "amendments": [
    {
      "id": "AMD-2026-CUSPA",
      "circularId": "CIRC-CUSPA-2026",
      "number": "HO/38/11/(9)2026-MIRSD-POD/I/15382/2026",
      "issuedOn": "2026-07-03",
      "changes": 10,
      "kinds": { "modified": 3, "added": 7 },
      "deltaObligations": ["OBL-SB-101", "OBL-SB-102", "OBL-SB-103",
                           "OBL-SB-104", "OBL-SB-105", "OBL-SB-106",
                           "OBL-SB-107", "OBL-SB-108", "OBL-SB-109", "OBL-SB-110"],
      "effectivity": { "phase1": "paras 46.1–46.11, +3 months from exchange guidelines",
                       "phase2": "paras 46.12–46.14, 2027-01-03" }
    }
  ]
}`,
  },
  {
    name: "list_gaps",
    description:
      "List every obligation with no bound evidence or a gap/at-risk status, with the remediation task, owner and due date covering each one. The shortest answer to \"what is outstanding?\".",
    inputSchema: `{
  "type": "object",
  "properties": {
    "includeAtRisk": { "type": "boolean", "default": true },
    "owner": { "type": "string" }
  },
  "required": []
}`,
    exampleCall: `list_gaps({ "includeAtRisk": true })`,
    exampleResult: `{
  "gaps": [
    { "obligation": "OBL-SB-101", "task": "TSK-001", "owner": "Rohan Iyer", "due": "2026-08-15" },
    { "obligation": "OBL-SB-102", "task": "TSK-002", "owner": "Dev Khanna", "due": "2026-10-01" },
    { "obligation": "OBL-SB-103", "task": "TSK-003", "owner": "Dev Khanna", "due": "2026-09-15" },
    { "obligation": "OBL-SB-105", "task": "TSK-002", "owner": "Dev Khanna", "due": "2026-10-01" },
    { "obligation": "OBL-SB-107", "task": "TSK-005", "owner": "Dev Khanna", "due": "2026-10-15" },
    { "obligation": "OBL-SB-110", "task": "TSK-007", "owner": "Rohan Iyer", "due": "2026-10-30" }
  ],
  "atRisk": [
    { "obligation": "OBL-SB-009", "task": "TSK-008", "owner": "Rohan Iyer", "due": "2026-09-30" },
    { "obligation": "OBL-SB-021", "task": "TSK-009", "owner": "Dev Khanna", "due": "2026-08-20" },
    { "obligation": "OBL-SB-109", "task": "TSK-006", "owner": "Priya Nair", "due": "2026-12-01" }
  ]
}`,
  },
];

/* ── Playground script — scripted replay, no live model ──────────────── */

export const playgroundScript: {
  role: "user" | "assistant" | "tool";
  name?: string;
  text: string;
}[] = [
  {
    role: "user",
    text: "Are we compliant with the new CUSPA circular?",
  },
  {
    role: "assistant",
    text: "Checking the register against CIRC-CUSPA-2026 (issued 2026-07-03) as of the current date. Calling check_compliance_status.",
  },
  {
    role: "tool",
    name: "check_compliance_status",
    text: `{
  "circularId": "CIRC-CUSPA-2026",
  "asOf": "2026-07-12",
  "obligations": 10,
  "byStatus": { "met": 0, "gap": 6, "pending-review": 3, "at-risk": 1 },
  "gaps": ["OBL-SB-101", "OBL-SB-102", "OBL-SB-103",
           "OBL-SB-105", "OBL-SB-107", "OBL-SB-110"],
  "pendingReview": ["OBL-SB-104", "OBL-SB-106", "OBL-SB-108"],
  "atRisk": ["OBL-SB-109"],
  "nearestDeadlines": [
    { "date": "2026-11-02", "phase": "paras 46.1–46.11", "obligations": 8 },
    { "date": "2027-01-03", "phase": "paras 46.12–46.14", "obligations": 2 }
  ],
  "openTasks": ["TSK-001", "TSK-002", "TSK-003", "TSK-004",
                "TSK-005", "TSK-006", "TSK-007"]
}`,
  },
  {
    role: "assistant",
    text: `Not yet — but nothing is due yet either. The circular re-mapped 10 obligations, and none of the phase-1 deadlines (2026-11-02) have passed.

Six obligations are open gaps, each with a remediation task in flight:
· OBL-SB-101 — open the dedicated CUSPA pledgee account. Para 46.1 requires "a separate demat account designated as the 'Client Unpaid Securities Pledgee Account' (CUSPA), tagged as such with the depository" — TSK-001, due 2026-08-15.
· OBL-SB-102 — auto-pledge unpaid securities on pay-out (§46.2) — TSK-002.
· OBL-SB-103 — email/SMS intimation on pledge creation (§46.3) — TSK-003.
· OBL-SB-105 — day-6 auto-release. Para 46.5: "where the pledge is not invoked, it shall be auto-released on the sixth trading day and the securities shall be free in the client's demat account" — built inside TSK-002.
· OBL-SB-107 — daily reconciliation of pledgeable value vs unpaid obligations (§46.11) — TSK-005.
· OBL-SB-110 — client agreements and T&C updated for the pledge regime (§46.12) — TSK-007.

Three entries are pending the compliance officer's review of the agent-proposed mapping: OBL-SB-104 (board policy with the 5-trading-day cap), OBL-SB-106 (no transfer of unpaid securities to banks/NBFCs) and OBL-SB-108 (extension requests by 6 p.m. on day 5). One is at-risk: OBL-SB-109, tracking phased effectivity — exchange operational guidelines are due around 2026-08-02 and will pin the final phase-1 date.

Net position: 0 of 10 met today, 8 obligations due at phase 1 (2026-11-02), 2 at phase 2 (2027-01-03), with all 7 remediation tasks scheduled to land ahead of those dates. Every claim above walks back to a clause — ask explain_mapping for any id.`,
  },
];
