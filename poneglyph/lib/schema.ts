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
  | "depository-participant"
  | "portfolio-manager"
  | "aif-manager";

export type ObligationType = "one-time" | "ongoing" | "periodic" | "event-driven";

export type ObligationStatus = "met" | "gap" | "at-risk" | "pending-review" | "rejected";

export type EvidenceKind = "document" | "data-check" | "live-scan";

export type TaskStatus = "open" | "in-progress" | "done" | "overdue";

/** A register chapter, keyed by the chapter key from the collected corpus
    (e.g. "pm-5", "aif-21"). Derived from the JSON, never hand-typed. */
export type ChapterKey = string;

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
  source: string; // sebi.gov.in URL
  supersedes?: string; // circular id
  sourceFile?: string; // path to the collected source dump
  sourceSha256?: string; // sha256 of that source file
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
  connector: string; // "manual-upload" | "depository-api" | "poneglyph-scan" …
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

/* ══════════════════════════════════════════════════════════════════════
   ONBOARDING — how a real firm enters the register.

   The engine cannot know a firm's obligations until it knows the firm.
   Onboarding produces an EntityProfile; the profile drives applicability
   (which Parts bind this firm), which drives the document requirements,
   which drive what the engine can actually verify. Nothing is assumed:
   every fact carries provenance, and every requested document says which
   clause made us ask for it.
   ══════════════════════════════════════════════════════════════════════ */

/** A Part is now a circular id (e.g. "MC-PM-2025"). Titles live in `lib/domains.ts`. */
export type SebiPart = string;

/** CSCRF grades a regulated entity by size; the grade sets cyber depth. */
export type CscrfGrade = "self-certification" | "basic" | "mid-size" | "qualified" | "mii";

/** A business line the firm runs; PMS MC ch. 1 defines discretionary /
    non-discretionary / advisory, AIF Regulations define Category II. */
export type BusinessSegment =
  | "pms-discretionary"
  | "pms-non-discretionary"
  | "pms-advisory"
  | "aif-category-ii";

/** Where a fact came from. `filing` and `exchange` are externally verifiable;
    `declared` is the firm's own word until a document backs it. */
export type ProvenanceKind = "filing" | "exchange" | "document" | "declared" | "derived";

export interface EntityFact {
  key: string;
  label: string;
  /** display value, already formatted */
  value: string;
  /** raw rupee amount where the fact is monetary */
  rupees?: number;
  provenance: ProvenanceKind;
  /** the exact source — a filing, a registry, an uploaded document id */
  source: string;
  asOf: string;
  /** true only where the fact is drawn from a public, checkable source */
  verified: boolean;
}

export interface RegistrationLine {
  category: string; // "Stock Broker", "Depository Participant", "Research Analyst"
  authority: string; // "SEBI", "NSE", "BSE", "CDSL"
  number: string; // masked in the sandbox — never a fabricated live number
  masked: boolean;
}

export interface EntityProfile {
  id: string;
  legalName: string;
  shortName: string;
  incorporatedIn: string;
  intermediaryTypes: IntermediaryType[];
  segments: BusinessSegment[];
  registrations: RegistrationLine[];
  /** every profile fact, with provenance */
  facts: EntityFact[];
  /** designation outcomes computed from the facts above */
  cscrfGrade: CscrfGrade;
  cscrfBasis: string;
  /** Parts of the Master Circular this profile makes binding */
  applicableParts: SebiPart[];
  /** Parts explicitly ruled out, with the reason — the "no" matters as much */
  excludedParts: { part: SebiPart; reason: string }[];
}

/* ── Document management ───────────────────────────────────────────── */

export type DocumentStatus =
  | "required" // asked for, not yet supplied
  | "received" // supplied, not yet parsed/verified
  | "verified" // parsed and accepted
  | "expired" // supplied but past its refresh cadence
  | "waived"; // not applicable to this firm, with a reason

export type DocumentCategory =
  | "constitutional" // incorporation, MoA/AoA, shareholding
  | "registration" // SEBI/exchange/depository certificates
  | "policy" // board-approved policies and SOPs
  | "financial" // audited accounts, net worth certificates
  | "audit" // system audit, internal audit, VAPT reports
  | "operational" // reconciliations, registers, client records
  | "governance"; // board minutes, committee constitutions

/** A document the engine asks for, and the clause that made it ask. */
export interface DocumentRequirement {
  id: string; // "DOC-REQ-014"
  name: string;
  description: string;
  category: DocumentCategory;
  part: SebiPart;
  chapter: ChapterKey;
  /** what in the entity profile triggered this ask — the "why are you asking me this" answer */
  triggeredBy: string;
  /** the clause behind the ask */
  clauseRef?: { circularId: string; para: string; excerpt: string };
  mandatory: boolean;
  /** obligations this document lets the engine verify once supplied */
  unlocks: string[];
  acceptedFormats: string[];
  /** how often it must be refreshed, where the circular says so */
  refreshCadence?: string;
}

export interface ExtractedField {
  field: string;
  value: string;
  confidence: number; // 0–1
  /** page/section the value was read from */
  locator?: string;
}

export interface CompanyDocument {
  id: string; // "DOC-021"
  /** the requirement this answers; absent ⇒ volunteered by the firm */
  requirementId?: string;
  name: string;
  category: DocumentCategory;
  status: DocumentStatus;
  fileName?: string;
  pages?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  /** validity window, where the document expires */
  validFrom?: string;
  validUntil?: string;
  hash?: string;
  /** what the engine read out of it — this is how the tool "learns" the firm */
  extracted: ExtractedField[];
  /** obligations this document now supports */
  supportsObligations: string[];
  /** reason, when status is `waived` */
  waivedReason?: string;
  notes?: string;
}

