/* ══════════════════════════════════════════════════════════════════════
   HTTP plumbing — JSON responses, same-origin CORS, the write gate.

   CORS is deliberately not permissive. The Worker serves the API and the
   static site from the same origin, so the only Origin ever echoed is the
   request's own. There is no wildcard and no allowlist of third parties.
   ══════════════════════════════════════════════════════════════════════ */

import type { Env } from "./types";

/** The register is shared, so writes are gated by a shared secret. A request
    may start a run or record a decision only if it carries the token. */
export function gateAllowed(request: Request, env: Env): boolean {
  return (
    typeof env.GATE_TOKEN === "string" &&
    env.GATE_TOKEN.length > 0 &&
    request.headers.get("x-gate-token") === env.GATE_TOKEN
  );
}

/** Echo Origin only when it is this very origin. Anything else gets no
    CORS headers at all, which is the correct answer for a same-origin API. */
export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin");
  if (!origin) return {};
  const self = new URL(request.url).origin;
  if (origin !== self) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-gate-token",
    vary: "Origin",
  };
}

export function json(
  request: Request,
  body: unknown,
  init: { status?: number } = {},
): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    /* live state — never let the edge or the browser hold a stale register */
    "cache-control": "no-store",
    ...corsHeaders(request),
  });
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers });
}

export function error(
  request: Request,
  status: number,
  message: string,
  extra: Record<string, unknown> = {},
): Response {
  return json(request, { error: message, ...extra }, { status });
}

export function preflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

/** Parse a JSON body without throwing on malformed input. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await request.json();
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
