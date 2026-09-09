import type { Obligation } from "@/lib/schema";

/* The obligation register. Empty until the pipeline drafts obligations from the
   collected corpus and the human gate approves them — nothing is hand-typed. */

export const obligations: Obligation[] = [];
