/* ══════════════════════════════════════════════════════════════════════
   Poneglyph — SEBI Obligation Ontology (open schema)
   One structure for any SEBI obligation: where it came from (clause),
   who it binds (applicability), what fulfils it (control + evidence),
   and how we know (hash-chained audit events + replayable agent runs).
   The sandbox's simulated data files implement exactly these types.
   ══════════════════════════════════════════════════════════════════════ */

export type IntermediaryType =
  | "stock-broker"
  | "investment-adviser"
  | "amc"
  | "rta"
  | "depository-participant";

export type ObligationType = "one-time" | "ongoing" | "periodic" | "event-driven";

export type ObligationStatus = "met" | "gap" | "at-risk" | "pending-review";

export type EvidenceKind = "document" | "data-check" | "live-scan";

export type TaskStatus = "open" | "in-progress" | "done" | "overdue";

export type ChapterKey =
  | "registration"
  | "client-dealings"
  | "unpaid-securities"
  | "margin"
  | "supervision"
  | "grievance"
  | "books-records"
  | "advertisement"
  | "cyber";

/* ── Regulatory corpus ─────────────────────────────────────────────── */

export interface Para {
  para: string; // e.g. "46.3"
  text: string;
}

export interface Chapter {
  key: ChapterKey;
  title: string;
  paras: Para[];
}

export interface Circular {
  id: string; // e.g. "MC-SB-2025"
  number: string; // official circular number
  title: string;
  issuedOn: string; // ISO date
  kind: "master-circular" | "amendment" | "regulation";
  source: string; // sebi.gov.in URL (simulated)
  supersedes?: string; // circular id
  chapters: Chapter[];
}

export interface DiffBlock {
  para: string;
  kind: "added" | "modified" | "deleted" | "unchanged";
  oldText?: string;
  newText?: string;
  deltaObligationIds: string[]; // obligations created/updated by this block
}

export interface Amendment {
  id: string; // e.g. "AMD-2026-CUSPA"
  circularId: string; // the amending circular
  amends: string; // the amended circular id
  issuedOn: string;
  summary: string;
  changes: DiffBlock[];
}

/* ── Obligations ───────────────────────────────────────────────────── */

export interface ClauseRef {
  circularId: string;
  chapter: ChapterKey;
  para: string;
  /** verbatim clause excerpt the obligation is grounded to */
  excerpt: string;
  charStart: number;
  charEnd: number;
}

export interface Control {
  id: string; // e.g. "CTL-014"
  name: string;
  description: string;
  owner: string; // team member name
}

export interface EvidenceSpec {
  kind: EvidenceKind;
  description: string; // what artifact satisfies this obligation
}

export interface Obligation {
  id: string; // e.g. "OBL-SB-001"
  title: string;
  summary: string;
  clause: ClauseRef;
  type: ObligationType;
  frequency?: string; // for periodic, e.g. "half-yearly"
  appliesTo: IntermediaryType[];
  control: Control;
  evidenceSpec: EvidenceSpec[];
  evidenceIds: string[]; // bound EvidenceArtifact ids ([] ⇒ gap)
  status: ObligationStatus;
  deadline?: string; // ISO date, where the circular sets one
  createdByRun: string; // PipelineRun id
  approvedBy?: string; // human gate; absent ⇒ pending-review
  hash: string; // content hash of this register entry
}

/* ── Evidence ──────────────────────────────────────────────────────── */

export interface EvidenceHistoryEvent {
  at: string;
  event: string; // "captured" | "re-verified" | "superseded" …
  hash: string;
}

export interface EvidenceArtifact {
  id: string; // e.g. "EV-007"
  kind: EvidenceKind;
  title: string;
  description: string;
  connector: string; // "manual-upload" | "depository-api" | "walrus-scan" …
  obligationIds: string[];
  capturedAt: string;
  hash: string;
  history: EvidenceHistoryEvent[];
  /** kind-specific detail rendered in the vault */
  detail: {
    docPages?: number;
    docExcerpt?: string;
    checkQuery?: string;
    checkResult?: string;
    scanTool?: string;
    scanFindings?: string;
  };
}

/* ── Remediation ───────────────────────────────────────────────────── */

export interface RemediationTask {
  id: string; // e.g. "TSK-003"
  obligationId: string;
  title: string;
  description: string;
  owner: string;
  status: TaskStatus;
  priority: "high" | "medium" | "low";
  due: string; // ISO date — from the circular's real deadline
  createdByRun: string;
}

/* ── Watchtower (scraper) ──────────────────────────────────────────── */

export interface ApplicabilityVerdict {
  verdict: "applies" | "not-applicable" | "partial";
  reasoning: string; // cited, clause-level reasoning
  citedText?: string;
  confidence: number; // 0–1
}

export interface ScraperCatch {
  id: string; // e.g. "CATCH-004"
  title: string;
  circularNumber: string;
  url: string;
  source: string; // "sebi.gov.in / circulars"
  docType: "circular" | "master-circular" | "regulation" | "press-release";
  fetchedAt: string;
  applicability: ApplicabilityVerdict;
  triggeredRunId?: string;
}

/* ── Agent pipeline (glass box) ────────────────────────────────────── */

export type AgentName =
  | "watcher"
  | "applicability"
  | "extraction"
  | "diff"
  | "verifier"
  | "human-gate";

export interface TraceStep {
  agent: AgentName;
  at: string;
  /** ReAct-style fields; verifier/human steps may use action+observation only */
  thought?: string;
  action?: string;
  observation?: string;
}

export interface VerifierCheck {
  name: string; // "citations resolve" | "deadlines parse" | …
  pass: boolean;
  note: string;
}

export interface PipelineRun {
  id: string; // e.g. "RUN-047"
  trigger: string; // "watchtower catch CATCH-004" | "manual re-verify" …
  startedAt: string;
  durationSec: number;
  status: "completed" | "awaiting-approval" | "failed";
  steps: TraceStep[];
  verifierChecks: VerifierCheck[];
  outputs: {
    obligationsCreated: string[];
    obligationsUpdated: string[];
    tasksCreated: string[];
  };
}

/* ── Audit trail (hash chain) ──────────────────────────────────────── */

export interface AuditEvent {
  id: string; // e.g. "AE-0031"
  at: string;
  actor: string; // "agent:extraction" | "human:Priya Nair" | "system"
  action: string; // "obligation.created" | "evidence.bound" | …
  subjectType: "obligation" | "evidence" | "task" | "run" | "corpus";
  subjectId: string;
  detail: string;
  hash: string;
  prevHash: string;
}

/* ── Tenant ────────────────────────────────────────────────────────── */

export interface TeamMember {
  name: string;
  role: string;
  initials: string;
}

export interface Tenant {
  name: string;
  sebiRegNo: string;
  type: IntermediaryType;
  exchanges: string[];
  qsb: boolean;
  activeClients: number;
  city: string;
  team: TeamMember[];
  /** the sandbox's pinned "today" — keeps '9 days ago' true forever */
  simToday: string;
}

/* ── MCP surface ───────────────────────────────────────────────────── */

export interface McpTool {
  name: string;
  description: string;
  inputSchema: string; // pretty-printed JSON schema
  exampleCall: string;
  exampleResult: string;
}
