/* ══════════════════════════════════════════════════════════════════════
   Clause presets for the live console.

   The two binding clauses are READ OUT OF the collected corpus (data/corpus.ts)
   rather than retyped here, so the text a judge sends to the engine is the same
   text the rest of the sandbox cites. The control case is a hard-coded sentence.

   ponytail / NOTE: until stage [0] PROFILE sets Molecule as a portfolio manager
   and AIF manager, the applicability agent still judges against the stock-broker
   profile, so it will MISJUDGE these PMS/AIF clauses. That is expected in this
   interim state and resolves when the profile is switched.
   ══════════════════════════════════════════════════════════════════════ */

import { circulars } from "@/data/corpus";
import type { ChapterKey, Circular } from "@/lib/schema";

function paraText(circular: Circular | undefined, chapter: ChapterKey, para: string): string {
  const found = circular?.chapters
    .find((c) => c.key === chapter)
    ?.paras.find((p) => p.para === para);
  return found?.text ?? "";
}

const pm = circulars.find((c) => c.id === "MC-PM-2025");
const aif = circulars.find((c) => c.id === "MC-AIF-2026");

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
    key: "pms-monthly",
    label: "PMS · para 5.1.2",
    circularId: pm?.id ?? "MC-PM-2025",
    circularNumber: pm?.number ?? "",
    para: "5.1.2",
    chapter: "pm-5",
    clauseText: paraText(pm, "pm-5", "5.1.2"),
    expectation:
      "Addressed to portfolio managers, so once the profile is set applicability should return applies and the extraction call should be made. Expect one periodic reporting duty — the monthly report within 7 working days.",
  },
  {
    key: "aif-quarterly",
    label: "AIF · para 21.1.2",
    circularId: aif?.id ?? "MC-AIF-2026",
    circularNumber: aif?.number ?? "",
    para: "21.1.2",
    chapter: "aif-21",
    clauseText: paraText(aif, "aif-21", "21.1.2"),
    expectation:
      "Addressed to AIFs, so once the profile is set applicability should return applies and the extraction call should be made. Expect one periodic reporting duty — the quarterly activity report within 15 calendar days.",
  },
  {
    key: "broker-control",
    label: "Stock-broker clause · not binding",
    circularId: "MC-SB-2024",
    circularNumber: "SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2024/53",
    para: "5.1",
    chapter: "pm-5",
    clauseText:
      "Every stock broker shall submit to the stock exchanges the consolidated periodic report in the format specified, within fifteen days of the end of each quarter.",
    expectation:
      "The control case. The clause binds stock brokers; Molecule holds no such registration. Applicability should answer no, the run should close there, and no model call should be spent. A cheap, cited no is the correct outcome.",
  },
];

export const DEFAULT_PRESET = CLAUSE_PRESETS[0];
