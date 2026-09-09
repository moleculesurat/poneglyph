import type { Circular } from "@/lib/schema";
import pm from "./collected/mc-pm-2025.json";
import aif from "./collected/mc-aif-2026.json";

/* The regulatory corpus, read verbatim from the collected JSON (stage [1]).
   scripts/collect.mjs parses the two SEBI master circulars into paragraph JSON;
   nothing here is hand-typed. Provenance (sourceFile, sourceSha256) rides along. */

export const circulars: Circular[] = [pm as Circular, aif as Circular];
