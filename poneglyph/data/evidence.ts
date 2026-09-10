import type { EvidenceArtifact } from "@/lib/schema";
import register from "./collected/register.json";

/* The evidence vault.
   Pulled from the running worker by `npm run pull`.
   Never hand-edited — bind through the app, then pull. */

export const evidence: EvidenceArtifact[] =
  (register as { evidence?: EvidenceArtifact[] }).evidence ?? [];
