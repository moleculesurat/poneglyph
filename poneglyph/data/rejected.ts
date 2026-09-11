import type { Obligation } from "@/lib/schema";
import register from "./collected/register.json";

/* Rejected and withdrawn drafts.
   Pulled from the running worker by `npm run pull`.
   Loaded back into state.rejected on a fresh store so run-paras' skip logic
   (never re-run a paragraph already decided) survives a re-seed. */

export const rejected: Obligation[] =
  (register as { rejected?: Obligation[] }).rejected ?? [];
