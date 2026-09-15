import type { DocumentKind } from "@/lib/schema";
import raw from "./catalogue.json";
import { documentRequirements } from "./documents";

/* The document catalogue — 43 kinds covering the 237 PMS asks the register
   raises (task 38). Generated once from REVIEW-CATALOGUE.md; edit the sheet and
   regenerate rather than hand-editing the json.

   catalogue depends on documents, never the reverse — documents.ts must not
   import this file, or the two form a cycle. */

export const catalogue: DocumentKind[] = raw as DocumentKind[];

const KIND_BY_REQ = new Map<string, DocumentKind>();
for (const kind of catalogue)
  for (const askId of kind.askIds) {
    if (KIND_BY_REQ.has(askId)) throw new Error(`catalogue: ask ${askId} is listed in two kinds`);
    KIND_BY_REQ.set(askId, kind);
  }

export function kindOf(reqId: string): DocumentKind | undefined {
  return KIND_BY_REQ.get(reqId);
}

/* Build-time invariant: every register ask maps to exactly one kind. Runs on
   import, so a drift between the catalogue and the register fails the prerender
   rather than shipping a Collect page with orphaned asks. */
const orphanAsks = documentRequirements.filter((r) => !KIND_BY_REQ.has(r.id));
if (orphanAsks.length > 0)
  throw new Error(
    `catalogue: ${orphanAsks.length} register ask(s) have no kind, e.g. ${orphanAsks
      .slice(0, 5)
      .map((r) => r.id)
      .join(", ")}`,
  );
