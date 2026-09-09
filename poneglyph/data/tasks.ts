import type { RemediationTask } from "@/lib/schema";

/* The remediation queue. Empty until obligations raise tasks. */

export const tasks: RemediationTask[] = [];
