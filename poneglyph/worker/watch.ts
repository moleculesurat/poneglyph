/* ══════════════════════════════════════════════════════════════════════
   The watchtower — a REAL poll of SEBI's public RSS feed.

   https://www.sebi.gov.in/sebirss.xml is plain RSS 2.0 with <ttl>60</ttl>.
   The link path encodes the document category (/legal/circulars/,
   /enforcement/orders/, /enforcement/recovery-proceedings/ …), so docType
   is read off the URL rather than inferred.

   Three disciplines hold everything here together:
     · HONEST FAILURE — if the fetch fails from the edge, the recorded
       state carries the real status/error verbatim. No canned catch, no
       simulated success, ever.
     · DETERMINISTIC TRIAGE — no model. New items are scored against
       this tenant by keywords and link path, the matched terms are
       recorded, and the verdict copy says plainly that this is a heuristic
       triage; full applicability runs when a clause enters the pipeline.
       Most days the feed is enforcement items and the right answer is
       not-applicable — the engine files the No, with real data.
     · GLOBAL STATE — the feed is objective, so catches live under global
       KV keys (watch:*), not inside any session sandbox.

   Workers have no DOMParser; the parser below is a small hand-rolled
   string walk over <item> blocks. No new packages.
   ══════════════════════════════════════════════════════════════════════ */

import { sha256Hex } from "./hash";
import type {
  Env,
  WatchCatch,
  WatchDocType,
  WatchFeedState,
  WatchPollResult,
  WatchTriage,
} from "./types";

export const FEED_URL = "https://www.sebi.gov.in/sebirss.xml";
const SOURCE = "sebi.gov.in/sebirss.xml";

const FETCH_TIMEOUT_MS = 15_000;
/** the feed declares <ttl>60</ttl>; a 5-minute floor keeps manual pollers
    from hammering the origin while still letting a judge force a refresh */
const MIN_POLL_GAP_MS = 5 * 60 * 1000;
const MAX_CATCHES = 100;
const MAX_SEEN = 500;

const STATE_KEY = "watch:state";
const SEEN_KEY = "watch:seen";
const CATCHES_KEY = "watch:catches";

/* a real browser UA — the origin serves the feed to browsers, so we ask as one */
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/* ── KV state ───────────────────────────────────────────────────────── */

const EMPTY_STATE: WatchFeedState = {
  lastPolledAt: null,
  lastBuildDate: null,
  fetchOk: false,
  lastError: null,
};

async function readState(env: Env): Promise<WatchFeedState> {
  const raw = await env.PONEGLYPH_STATE.get(STATE_KEY);
  if (!raw) return { ...EMPTY_STATE };
  try {
    return { ...EMPTY_STATE, ...(JSON.parse(raw) as WatchFeedState) };
  } catch {
    return { ...EMPTY_STATE };
  }
}

async function readSeen(env: Env): Promise<string[]> {
  const raw = await env.PONEGLYPH_STATE.get(SEEN_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export async function readCatches(env: Env): Promise<WatchCatch[]> {
  const raw = await env.PONEGLYPH_STATE.get(CATCHES_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WatchCatch[]) : [];
  } catch {
    return [];
  }
}

/* ── RSS parsing — hand-rolled, no DOMParser in workerd ─────────────── */

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** first <tag>…</tag> in the block, CDATA unwrapped, entities decoded */
function tagContent(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return null;
  let value = match[1].trim();
  const cdata = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) value = cdata[1].trim();
  return decodeEntities(value).trim();
}

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
}

export function parseRss(xml: string): { items: FeedItem[]; lastBuildDate: string | null } {
  const items: FeedItem[] = [];
  const itemRe = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title = tagContent(block, "title");
    const link = tagContent(block, "link");
    if (!title || !link) continue; // an item we cannot cite is not a catch
    items.push({ title, link, pubDate: tagContent(block, "pubDate") });
  }
  /* lastBuildDate belongs to the channel; take the first occurrence, which
     precedes any item block in a well-formed feed */
  const channelHead = xml.slice(0, xml.search(/<item[\s>]/) === -1 ? xml.length : xml.search(/<item[\s>]/));
  return { items, lastBuildDate: tagContent(channelHead, "lastBuildDate") };
}

/* ── docType from the link path — SEBI encodes the category there ───── */

export function classifyDocType(url: string): WatchDocType {
  const path = url.toLowerCase();
  if (path.includes("/master-circulars/")) return "master-circular";
  if (path.includes("/circulars/")) return "circular";
  if (path.includes("/regulations/")) return "regulation";
  if (path.includes("/recovery-proceedings/") || path.includes("/recovery/")) return "recovery";
  if (path.includes("/enforcement/") && path.includes("/orders/")) return "enforcement-order";
  if (path.includes("/orders/")) return "enforcement-order";
  if (path.includes("press-release") || path.includes("/press-releases/")) return "press-release";
  return "other";
}

/* ── Deterministic triage against this tenant ───────────── */

const HEURISTIC_NOTE =
  "This is a heuristic triage over the feed title and link path only; full applicability is determined when a clause of the document is put through the extraction pipeline.";

/** terms that address the capacity the tenant holds */
const TENANT_TERMS = [
  "portfolio manager",
  "portfolio managers",
  "portfolio management",
  "alternative investment fund",
  "alternative investment funds",
  "aif",
  "aifs",
];

/** domain terms that touch the tenant's rulebooks without naming the capacity */
const DOMAIN_TERMS = [
  "master circular",
  "cscrf",
  "cyber security",
  "cybersecurity",
  "cyber",
  "intermediaries",
  "intermediary",
  "valuation",
  "private placement memorandum",
  "ppm",
  "custodian",
  "nism",
];

/** capacities this tenant does not hold */
const FOREIGN_TERMS = [
  "mutual fund",
  "mutual funds",
  "asset management company",
  "amc",
  "investment adviser",
  "investment advisers",
  "reit",
  "invit",
  "merchant banker",
  "merchant bankers",
  "credit rating agency",
  "debenture trustee",
  "foreign portfolio investor",
  "foreign portfolio investors",
  "fpi",
  "stock broker",
  "stock brokers",
  "trading member",
  "trading members",
  "broker",
  "brokers",
];

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchTerms(title: string, terms: string[]): string[] {
  const hits: string[] = [];
  for (const term of terms) {
    if (new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(title)) hits.push(term);
  }
  return hits;
}

export function triageItem(title: string, docType: WatchDocType): WatchTriage {
  const tenantHits = matchTerms(title, TENANT_TERMS);
  const domainHits = matchTerms(title, DOMAIN_TERMS);
  const foreignHits = matchTerms(title, FOREIGN_TERMS);

  /* enforcement and recovery items bind the parties they name, not the
     tenant — the correct triage most days is the filed No */
  if (docType === "enforcement-order" || docType === "recovery") {
    if (tenantHits.length > 0) {
      return {
        verdict: "monitor",
        matched: tenantHits,
        reasoning: `${docType === "recovery" ? "Recovery proceeding" : "Enforcement order"} whose title touches a capacity this tenant holds (${tenantHits.join(", ")}). It binds the parties it names and creates no new obligation for this tenant, but enforcement against the capacity the tenant holds is a supervisory signal worth holding. ${HEURISTIC_NOTE}`,
      };
    }
    return {
      verdict: "not-applicable",
      matched: [],
      reasoning: `${docType === "recovery" ? "Recovery proceeding" : "Enforcement order"} against the specific parties it names. It changes no rule that binds this tenant, so the engine files the No rather than inventing relevance. ${HEURISTIC_NOTE}`,
    };
  }

  if (tenantHits.length > 0) {
    const matched = [...new Set([...tenantHits, ...domainHits])];
    return {
      verdict: "applies",
      matched,
      reasoning: `The title addresses the capacity this tenant holds (${tenantHits.join(", ")})${domainHits.length > 0 ? ` and touches ${domainHits.join(", ")}` : ""}, published as ${docType}. ${HEURISTIC_NOTE}`,
    };
  }

  if (foreignHits.length > 0 && domainHits.length === 0) {
    return {
      verdict: "not-applicable",
      matched: foreignHits,
      reasoning: `The title addresses ${foreignHits.join(", ")} — capacities this tenant does not hold. The rulebook for an intermediary the tenant is not does not enter the register. ${HEURISTIC_NOTE}`,
    };
  }

  if (domainHits.length > 0) {
    if (docType === "master-circular") {
      return {
        verdict: "applies",
        matched: domainHits,
        reasoning: `A master circular touching ${domainHits.join(", ")} — consolidated instruments of this kind routinely reach the capacities this tenant holds even where the title omits the addressee. ${HEURISTIC_NOTE}`,
      };
    }
    return {
      verdict: "monitor",
      matched: domainHits,
      reasoning: `The title touches ${domainHits.join(", ")} without naming an addressee, published as ${docType}. Held for monitoring rather than dismissed — the addressee line lives in the document body, which this triage does not read. ${HEURISTIC_NOTE}`,
    };
  }

  return {
    verdict: "monitor",
    matched: [],
    reasoning: `No scored term matched the title, published as ${docType}. The addressee cannot be read from the title alone, so the item is held for monitoring rather than dismissed. ${HEURISTIC_NOTE}`,
  };
}

/* ── GET /api/watch ─────────────────────────────────────────────────── */

export interface WatchView extends WatchFeedState {
  catches: WatchCatch[];
}

export async function getWatch(env: Env): Promise<WatchView> {
  const [state, catches] = await Promise.all([readState(env), readCatches(env)]);
  return { ...state, catches };
}

/* ── POST /api/watch/poll and the hourly cron ───────────────────────── */

export async function pollWatch(env: Env, force: boolean): Promise<WatchPollResult> {
  const state = await readState(env);

  if (!force && state.lastPolledAt) {
    const sinceMs = Date.now() - Date.parse(state.lastPolledAt);
    if (Number.isFinite(sinceMs) && sinceMs >= 0 && sinceMs < MIN_POLL_GAP_MS) {
      const catches = await readCatches(env);
      return {
        fetchOk: state.fetchOk,
        httpStatus: null,
        newCount: 0,
        totalItems: catches.length,
        skipped: true,
        ...(state.lastError ? { lastError: state.lastError } : {}),
      };
    }
  }

  const polledAt = new Date().toISOString();
  let httpStatus: number | null = null;
  let xml = "";

  try {
    const response = await fetch(FEED_URL, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/rss+xml, application/xml, text/xml, */*;q=0.8",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    httpStatus = response.status;
    if (!response.ok) {
      throw new Error(`upstream returned HTTP ${response.status} ${response.statusText}`.trim());
    }
    xml = await response.text();
  } catch (e) {
    /* HONEST FAILURE — the real error, recorded and returned verbatim */
    const err = e as Error;
    const lastError =
      err.name === "TimeoutError" || err.name === "AbortError"
        ? `sebi.gov.in did not respond within ${FETCH_TIMEOUT_MS / 1000}s`
        : err.message || "fetch failed";
    await env.PONEGLYPH_STATE.put(
      STATE_KEY,
      JSON.stringify({ ...state, lastPolledAt: polledAt, fetchOk: false, lastError }),
    );
    const catches = await readCatches(env);
    return { fetchOk: false, httpStatus, newCount: 0, totalItems: catches.length, lastError };
  }

  const { items, lastBuildDate } = parseRss(xml);
  if (items.length === 0) {
    /* a 200 with no parseable items is a failure of the parse contract,
       not a success — say so */
    const lastError = `feed returned HTTP ${httpStatus} but no <item> blocks parsed (${xml.length} bytes)`;
    await env.PONEGLYPH_STATE.put(
      STATE_KEY,
      JSON.stringify({ lastPolledAt: polledAt, lastBuildDate, fetchOk: false, lastError }),
    );
    const catches = await readCatches(env);
    return { fetchOk: false, httpStatus, newCount: 0, totalItems: 0, lastError };
  }

  const seen = await readSeen(env);
  const seenSet = new Set(seen);
  const fresh = items.filter((item) => !seenSet.has(item.link));

  const newCatches: WatchCatch[] = [];
  for (const item of fresh) {
    const docType = classifyDocType(item.link);
    const publishedMs = item.pubDate ? Date.parse(item.pubDate) : NaN;
    newCatches.push({
      id: `WT-${(await sha256Hex(item.link)).slice(0, 10)}`,
      title: item.title,
      url: item.link,
      source: SOURCE,
      docType,
      publishedAt: Number.isNaN(publishedMs)
        ? (item.pubDate ?? "")
        : new Date(publishedMs).toISOString(),
      fetchedAt: polledAt,
      triage: triageItem(item.title, docType),
    });
  }

  const existing = await readCatches(env);
  /* the feed is newest-first; keep that order — new items in front, cap 100 */
  const catches = [...newCatches, ...existing].slice(0, MAX_CATCHES);
  const nextSeen = [...fresh.map((i) => i.link), ...seen].slice(0, MAX_SEEN);

  /* three different keys, one write each — inside KV's one-write-per-key-
     per-second budget without needing the run-writer's pacing */
  await env.PONEGLYPH_STATE.put(
    STATE_KEY,
    JSON.stringify({ lastPolledAt: polledAt, lastBuildDate, fetchOk: true, lastError: null }),
  );
  if (newCatches.length > 0) {
    await env.PONEGLYPH_STATE.put(SEEN_KEY, JSON.stringify(nextSeen));
    await env.PONEGLYPH_STATE.put(CATCHES_KEY, JSON.stringify(catches));
  }

  return { fetchOk: true, httpStatus, newCount: newCatches.length, totalItems: items.length };
}
