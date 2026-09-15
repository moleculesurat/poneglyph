/* ══════════════════════════════════════════════════════════════════════
   Node runtime for the Cloudflare worker.

   Runs the unchanged worker/index.ts (bundled to dist/worker.mjs) as one Node
   process: it serves /api/* through worker.fetch, hands every other path to
   the static export in out/, polls the watchtower hourly through
   worker.scheduled, and keeps state in a sqlite file. This is what runs in the
   Fargate container; locally it replaces `wrangler dev`.
   ══════════════════════════════════════════════════════════════════════ */

import http from "node:http";
import path from "node:path";
import { Readable } from "node:stream";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { openStore } from "./store.mjs";

/* .dev.vars — KEY=VALUE lines; blanks and # skipped; never override a
   variable already in the environment (an explicit export wins). */
function loadDevVars(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    if (key in process.env) continue;
    let val = t.slice(eq + 1).trim();
    if (val.length >= 2 && (val[0] === '"' || val[0] === "'") && val.at(-1) === val[0]) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadDevVars(".dev.vars");

/* imported after the env load, per the runtime contract */
const { default: worker } = await import("./dist/worker.mjs");

const PORT = Number(process.env.PORT ?? 8787);
const STATE_DIR = process.env.STATE_DIR ?? ".state";
const stateFile = path.join(STATE_DIR, "poneglyph.sqlite");
const OUT_DIR = path.resolve("out");
const FILES_DIR = path.join(STATE_DIR, "files");
const pexecFile = promisify(execFile);

/* FILES — the firm's PDF vault on disk; only the sha and metadata leave it.
   bytes is a Uint8Array. Node-only, handed to the worker as a binding. */
const FILES = {
  async put(sha, bytes, ext) {
    await mkdir(FILES_DIR, { recursive: true });
    const p = path.join(FILES_DIR, `${sha}.${ext}`);
    try {
      await access(p);
      return; // already stored — skip the rewrite
    } catch {}
    await writeFile(p, bytes);
  },
  async has(sha, ext) {
    try {
      await access(path.join(FILES_DIR, `${sha}.${ext}`));
      return true;
    } catch {
      return false;
    }
  },
};

/* PDFTEXT — cached `pdftotext -layout`. Returns the .txt sidecar if present,
   else runs pdftotext (cwd = FILES_DIR so the bare <sha>.pdf resolves) and
   writes the sidecar. A missing binary throws "pdftotext unavailable …". */
async function PDFTEXT(sha) {
  const txtPath = path.join(FILES_DIR, `${sha}.txt`);
  try {
    return await readFile(txtPath, "utf8");
  } catch {}
  let stdout;
  try {
    ({ stdout } = await pexecFile("pdftotext", ["-layout", `${sha}.pdf`, "-"], {
      cwd: FILES_DIR,
      maxBuffer: 64 * 1024 * 1024,
    }));
  } catch (e) {
    if (e?.code === "ENOENT")
      throw new Error(
        "pdftotext unavailable — install poppler (brew install poppler / apt-get install poppler-utils)",
      );
    throw new Error(`pdftotext failed: ${String(e?.stderr || e?.message || e).trim()}`);
  }
  await writeFile(txtPath, stdout, "utf8");
  return stdout;
}

const env = {
  GATE_TOKEN: process.env.GATE_TOKEN,
  OPEN_ROUTER_KEY: process.env.OPEN_ROUTER_KEY,
  MODEL: process.env.MODEL,
  PONEGLYPH_STATE: openStore(stateFile),
  ASSETS: { fetch: serveStatic },
  FILES,
  PDFTEXT,
};

const ctx = {
  waitUntil(p) {
    Promise.resolve(p).catch((e) => console.error("waitUntil", e));
  },
  passThroughOnException() {},
};

/* ── static site — reproduces the asset worker's routing over out/ ────── */

const CONTENT_TYPES = {
  html: "text/html",
  js: "text/javascript",
  css: "text/css",
  json: "application/json",
  txt: "text/plain",
  xml: "application/xml",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
  woff2: "font/woff2",
};

function contentType(name) {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

/** read a file inside out/, refusing anything that resolves outside it */
async function readWithin(rel) {
  const full = path.resolve(OUT_DIR, rel);
  if (full !== OUT_DIR && !full.startsWith(OUT_DIR + path.sep)) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}

async function serveStatic(request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("method not allowed", { status: 405 });
  }
  const url = new URL(request.url);
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    pathname = url.pathname;
  }
  /* / → index.html; a directory path → its index.html; a bare path → the file
     as-is, then <path>/index.html — this reproduces wrangler's
     auto-trailing-slash, so /register and /register/ both return the page */
  const candidates =
    pathname === "/"
      ? ["index.html"]
      : pathname.endsWith("/")
        ? [pathname.slice(1) + "index.html"]
        : [pathname.slice(1), pathname.slice(1) + "/index.html"];
  for (const rel of candidates) {
    const buf = await readWithin(rel);
    if (buf) return new Response(buf, { status: 200, headers: { "content-type": contentType(rel) } });
  }
  const notFound = await readWithin("404.html");
  return new Response(notFound ?? "404 Not Found", {
    status: 404,
    headers: { "content-type": "text/html" },
  });
}

/* ── HTTP: Node req → web Request → worker.fetch → Node res ───────────── */

const server = http.createServer(async (req, res) => {
  try {
    const method = req.method ?? "GET";
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v === undefined) continue;
      headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    }
    const hasBody = method !== "GET" && method !== "HEAD";
    const request = new Request("http://" + (req.headers.host ?? "localhost") + req.url, {
      method,
      headers,
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: "half",
    });
    const response = await worker.fetch(request, env, ctx);
    res.statusCode = response.status;
    for (const [k, v] of response.headers) res.setHeader(k, v);
    if (method === "HEAD") {
      res.end();
      return;
    }
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.error("request", e);
    res.statusCode = 500;
    res.end(e?.message ?? "internal error");
  }
});

/* hourly watchtower poll — same handler the button calls; no poll at boot */
setInterval(() => {
  worker
    .scheduled({ scheduledTime: Date.now(), cron: "0 * * * *", noRetry() {} }, env, ctx)
    .catch((e) => console.error("scheduled", e));
}, 3_600_000);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`poneglyph listening on :${PORT}  state ${stateFile}`);
});
