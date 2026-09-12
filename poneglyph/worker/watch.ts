/* ══════════════════════════════════════════════════════════════════════
   The watchtower — a REAL poll of SEBI's public surfaces.

   Five sources (see SOURCES): the RSS feed (plain RSS 2.0, <ttl>60</ttl>,
   enforcement-heavy) plus the circulars, master-circulars and regulations
   listing tables where binding instruments actually appear. The link path
   encodes the document category (/legal/circulars/, /legal/master-circulars/,
   /legal/regulations/, /enforcement/orders/ …), so docType is read off the
   URL rather than inferred.

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
  WatchSourceStatus,
  WatchTriage,
} from "./types";

/** Every public SEBI surface we watch. The RSS feed is enforcement-heavy;
    the three listing tables are where circulars, master circulars and
    regulations that actually bind an intermediary appear. */
export const SOURCES: { id: string; url: string; kind: "rss" | "listing" }[] = [
  { id: "rss", url: "https://www.sebi.gov.in/sebirss.xml", kind: "rss" },
  { id: "circulars", url: "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=7&smid=0", kind: "listing" },
  { id: "circulars-afd", url: "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=7&smid=0&deptId=75", kind: "listing" },
  { id: "master-circulars", url: "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=6&smid=0", kind: "listing" },
  { id: "regulations", url: "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=3&smid=0", kind: "listing" },
];

const FETCH_TIMEOUT_MS = 15_000;
/** the RSS feed declares <ttl>60</ttl>; a 5-minute floor keeps manual pollers
    from hammering the origin while still letting a judge force a refresh */
const MIN_POLL_GAP_MS = 5 * 60 * 1000;
/** five sources of ~25–42 rows each: the caps must clear one full poll or the
    first run drops most of what it fetched */
const MAX_CATCHES = 300;
const MAX_SEEN = 1000;

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
  sources: {},
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

/* ── Listing parsing — the circular/regulation tables, hand-rolled ──────
   Each data row is <tr>…<td>date</td>…<td><a href=".../legal/…">title</a>…</tr>.
   The circulars/master-circulars anchors carry title="…" class="points"; the
   regulations anchors carry neither and the date cell is a bare year — so the
   link filter is the /legal/ href (not the class), the title falls back to the
   anchor text, and the date is whatever the first cell holds. */
export function parseListing(html: string): FeedItem[] {
  const items: FeedItem[] = [];
  const rowRe = /<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi;
  let row: RegExpExecArray | null;
  while ((row = rowRe.exec(html)) !== null) {
    const block = row[1];
    /* first anchor whose href is a /legal/ document; rows without one are skipped */
    const anchor = block.match(
      /<a\b([^>]*?)href="(https:\/\/www\.sebi\.gov\.in\/legal\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/i,
    );
    if (!anchor) continue;
    const link = anchor[2];
    const attrs = `${anchor[1]} ${anchor[3]}`;
    const titleAttr = attrs.match(/\btitle="([^"]*)"/i);
    const anchorText = decodeEntities(anchor[4].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
    const title =
      titleAttr && titleAttr[1].trim() ? decodeEntities(titleAttr[1]).trim() : anchorText;
    const dateCell = block.match(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/i);
    const pubDate = dateCell
      ? decodeEntities(dateCell[1].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim() || null
      : null;
    if (!title) continue; // an item we cannot cite is not a catch
    items.push({ title, link, pubDate });
  }
  return items;
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

interface SourceResult {
  id: string;
  fetchOk: boolean;
  httpStatus: number | null;
  items: FeedItem[];
  lastBuildDate: string | null;
  lastError: string | null;
}

/** Fetch one source and parse it, applying the honest-failure rule per source:
    a network error, a non-2xx, or a 200 that parses to nothing all record the
    real reason and yield no items. Never throws. */
async function fetchSource(src: (typeof SOURCES)[number]): Promise<SourceResult> {
  let httpStatus: number | null = null;
  try {
    const response = await fetch(src.url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/rss+xml, application/xml, text/xml, text/html, */*;q=0.8",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    httpStatus = response.status;
    if (!response.ok) {
      throw new Error(`upstream returned HTTP ${response.status} ${response.statusText}`.trim());
    }
    const body = await response.text();
    let items: FeedItem[];
    let lastBuildDate: string | null = null;
    if (src.kind === "rss") {
      const parsed = parseRss(body);
      items = parsed.items;
      lastBuildDate = parsed.lastBuildDate;
    } else {
      items = parseListing(body);
    }
    if (items.length === 0) {
      return {
        id: src.id,
        fetchOk: false,
        httpStatus,
        items: [],
        lastBuildDate,
        lastError: `HTTP ${httpStatus} but no items parsed (${body.length} bytes)`,
      };
    }
    return { id: src.id, fetchOk: true, httpStatus, items, lastBuildDate, lastError: null };
  } catch (e) {
    const err = e as Error;
    const lastError =
      err.name === "TimeoutError" || err.name === "AbortError"
        ? `${new URL(src.url).host} did not respond within ${FETCH_TIMEOUT_MS / 1000}s`
        : err.message || "fetch failed";
    return { id: src.id, fetchOk: false, httpStatus, items: [], lastBuildDate: null, lastError };
  }
}

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
        sources: state.sources,
        ...(state.lastError ? { lastError: state.lastError } : {}),
      };
    }
  }

  const polledAt = new Date().toISOString();
  const results = await Promise.all(SOURCES.map(fetchSource));

  const sources: Record<string, WatchSourceStatus> = {};
  for (const r of results) {
    sources[r.id] = { fetchOk: r.fetchOk, httpStatus: r.httpStatus, items: r.items.length, lastError: r.lastError };
  }
  const anyOk = results.some((r) => r.fetchOk);
  const failing = results.filter((r) => !r.fetchOk);
  const lastError = failing.length ? failing.map((r) => `${r.id}: ${r.lastError}`).join("; ") : null;
  const lastBuildDate = results.find((r) => r.id === "rss")?.lastBuildDate ?? state.lastBuildDate ?? null;

  /* HONEST FAILURE — every source failed; record the joined reasons, keep the
     existing catches, and say so */
  if (!anyOk) {
    await env.PONEGLYPH_STATE.put(
      STATE_KEY,
      JSON.stringify({ lastPolledAt: polledAt, lastBuildDate, fetchOk: false, lastError, sources }),
    );
    const catches = await readCatches(env);
    return { fetchOk: false, httpStatus: null, newCount: 0, totalItems: catches.length, lastError: lastError ?? undefined, sources };
  }

  /* merge every source's items, deduping on link across sources (first source
     wins, so a circular seen in both circulars and circulars-afd is one catch) */
  const combined: { item: FeedItem; sourceId: string }[] = [];
  const linkSet = new Set<string>();
  for (const r of results) {
    if (!r.fetchOk) continue;
    for (const item of r.items) {
      if (linkSet.has(item.link)) continue;
      linkSet.add(item.link);
      combined.push({ item, sourceId: r.id });
    }
  }

  const seen = await readSeen(env);
  const seenSet = new Set(seen);
  const fresh = combined.filter(({ item }) => !seenSet.has(item.link));

  const newCatches: WatchCatch[] = [];
  for (const { item, sourceId } of fresh) {
    const docType = classifyDocType(item.link);
    const publishedMs = item.pubDate ? Date.parse(item.pubDate) : NaN;
    newCatches.push({
      id: `WT-${(await sha256Hex(item.link)).slice(0, 10)}`,
      title: item.title,
      url: item.link,
      source: sourceId,
      docType,
      publishedAt: Number.isNaN(publishedMs)
        ? (item.pubDate ?? "")
        : new Date(publishedMs).toISOString(),
      fetchedAt: polledAt,
      triage: triageItem(item.title, docType),
    });
  }

  const existing = await readCatches(env);
  /* listings and the feed are newest-first; keep new items in front, cap MAX_CATCHES */
  const catches = [...newCatches, ...existing].slice(0, MAX_CATCHES);
  const nextSeen = [...fresh.map(({ item }) => item.link), ...seen].slice(0, MAX_SEEN);

  await env.PONEGLYPH_STATE.put(
    STATE_KEY,
    JSON.stringify({ lastPolledAt: polledAt, lastBuildDate, fetchOk: true, lastError, sources }),
  );
  if (newCatches.length > 0) {
    await env.PONEGLYPH_STATE.put(SEEN_KEY, JSON.stringify(nextSeen));
    await env.PONEGLYPH_STATE.put(CATCHES_KEY, JSON.stringify(catches));
  }

  return {
    fetchOk: true,
    httpStatus: null,
    newCount: newCatches.length,
    totalItems: combined.length,
    sources,
    ...(lastError ? { lastError } : {}),
  };
}
