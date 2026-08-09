/* ══════════════════════════════════════════════════════════════════════
   HTTP plumbing — JSON responses, same-origin CORS, the session cookie.

   CORS is deliberately not permissive. The Worker serves the API and the
   static site from the same origin, so the only Origin ever echoed is the
   request's own. There is no wildcard and no allowlist of third parties.
   ══════════════════════════════════════════════════════════════════════ */

export const SESSION_COOKIE = "pg_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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
    "access-control-allow-headers": "content-type",
    vary: "Origin",
  };
}

export function json(
  request: Request,
  body: unknown,
  init: { status?: number; setSessionCookie?: string } = {},
): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    /* live state — never let the edge or the browser hold a stale register */
    "cache-control": "no-store",
    ...corsHeaders(request),
  });
  if (init.setSessionCookie) {
    headers.append("set-cookie", sessionCookie(request, init.setSessionCookie));
  }
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers });
}

export function sessionCookie(request: Request, sid: string): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function readSessionCookie(request: Request): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) {
      const value = rest.join("=").trim();
      /* only ever a UUID we minted — reject anything else rather than using
         an attacker-chosen string as a KV key */
      return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
    }
  }
  return null;
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
