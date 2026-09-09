import type { AuditEvent } from "@/lib/schema";
import register from "./collected/register.json";

/* The append-only, hash-chained audit trail.
   Pulled from the running worker by `npm run pull`.
   Never hand-edited — the worker recomputes the chain from GENESIS. */

export const auditEvents: AuditEvent[] = register.auditEvents as AuditEvent[];
