import type { Obligation } from "@/lib/schema";
import register from "./collected/register.json";

/* The approved obligation register.
   Pulled from the running worker by `npm run pull`.
   Never hand-edited — approve through the app, then pull. */

export const obligations: Obligation[] = register.obligations as Obligation[];
