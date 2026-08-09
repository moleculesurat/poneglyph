/* ══════════════════════════════════════════════════════════════════════
   Clause presets for the live console.

   Every clause body below is READ OUT OF data/ — the corpus paragraphs and
   the watchtower catch — rather than retyped here, so the text a judge sends
   to the engine is the same text the rest of the sandbox cites.
   ══════════════════════════════════════════════════════════════════════ */

import { cuspaCircular, masterCircular } from "@/data/corpus";
import { catches } from "@/data/watchtower";
import type { ChapterKey, Circular } from "@/lib/schema";

function paraText(circular: Circular, chapter: ChapterKey, para: string): string {
  const found = circular.chapters.find((c) => c.key === chapter)?.paras.find((p) => p.para === para);
  return found?.text ?? "";
}

const amcCatch = catches.find((c) => c.id === "CATCH-004");

/* The addressee sentence is the one the catch's own applicability reasoning
   quotes — "all Asset Management Companies (AMCs) and Association of Mutual
   Funds in India (AMFI)" — restated as the head of the instrument, because a
   circular states its addressee once and the operative clause never repeats
   it. The operative sentence below it is the catch's cited text, unedited. */
const AMC_ADDRESSEE =
  "This circular is addressed to every asset management company (AMC) and to the Association of Mutual Funds in India (AMFI).";

export interface ClausePreset {
  key: string;
  label: string;
  circularId: string;
  circularNumber: string;
  para: string;
  chapter: ChapterKey;
  clauseText: string;
  /** what this preset exists to show — stated before the run, not after */
  expectation: string;
}

export const CLAUSE_PRESETS: ClausePreset[] = [
  {
    key: "cuspa",
    label: "CUSPA · para 46.3",
    circularId: cuspaCircular.id,
    circularNumber: cuspaCircular.number,
    para: "46.3",
    chapter: "unpaid-securities",
    clauseText: paraText(cuspaCircular, "unpaid-securities", "46.3"),
    expectation:
      "Addressed to trading members, so applicability should return applies and the extraction call should be made. Expect one event-driven intimation duty, grounded to a span of this paragraph.",
  },
  {
    key: "cyber",
    label: "CSCRF · para 103.2",
    circularId: masterCircular.id,
    circularNumber: masterCircular.number,
    para: "103.2",
    chapter: "cyber",
    clauseText: paraText(masterCircular, "cyber", "103.2"),
    expectation:
      "A cyber-resilience paragraph that names no capacity of its own, so applicability inherits the addressee of the parent instrument and says so. Two duties usually fall out of it — log retention and multi-factor authentication.",
  },
  {
    key: "amc",
    label: "AMC total expense ratio · not binding",
    circularId: "CIRC-AMC-TER-2026",
    circularNumber: amcCatch?.circularNumber ?? "SEBI/HO/IMD/IMD-PoD-1/P/CIR/2026/54",
    para: "3.2",
    chapter: "reporting",
    clauseText: `${AMC_ADDRESSEE} ${amcCatch?.applicability.citedText ?? ""}`.trim(),
    expectation:
      "The control case. The clause binds asset management companies; the tenant holds no such registration. Applicability should answer no, the run should close there, and no model call should be spent. A cheap, cited no is the correct outcome.",
  },
];

export const DEFAULT_PRESET = CLAUSE_PRESETS[0];
