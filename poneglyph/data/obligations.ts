import type { Obligation } from "@/lib/schema";
import register from "./collected/register.json";

/* The approved obligation register.
   Pulled from the running worker by `npm run pull`.
   Never hand-edited — approve through the app, then pull. */

export const allObligations: Obligation[] = register.obligations as Obligation[];

// PMS only for now; empty this array to unpark (ROADMAP module 2)
export const PARKED_PARTS = ["MC-AIF-2026"];

export const obligations = allObligations.filter((o) => !PARKED_PARTS.includes(o.clause.circularId));
export const parkedObligations = allObligations.filter((o) => PARKED_PARTS.includes(o.clause.circularId));
