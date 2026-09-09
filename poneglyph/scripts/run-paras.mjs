/* Drive the extraction pipeline over collected paragraphs, one at a time.
   usage:  node scripts/run-paras.mjs list [MC-PM-2025|MC-AIF-2026]
           node scripts/run-paras.mjs run <circularId> <para>[,<para>...]|all [--base URL]
   env GATE_TOKEN → x-gate-token header on `run`. Writes nothing to disk. */
import { readFile } from "node:fs/promises";
const SHALL = /\bshall\b/i;
const CADENCE = /\b(within|not later than|before|by)\b[^.]{0,40}\b(days?|weeks?|months?|quarter|year|working|calendar)\b|\b(monthly|quarterly|half[- ]yearly|annual(ly)?|yearly|every)\b/i;
const isCandidate = (t) => SHALL.test(t) && CADENCE.test(t);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (msg) => (console.error(msg), process.exit(1));
async function load(circularId) {
  const url = new URL(`../data/collected/${circularId.toLowerCase()}.json`, import.meta.url);
  try { return JSON.parse(await readFile(url, "utf8")); }
  catch { return fail(`no collected file for ${circularId} (expected data/collected/${circularId.toLowerCase()}.json)`); }
}
function* eachPara(doc) {
  for (const ch of doc.chapters) for (const p of ch.paras) yield [ch, p];
}
async function cmdList(circularId) {
  for (const id of circularId ? [circularId] : ["MC-PM-2025", "MC-AIF-2026"]) {
    const doc = await load(id);
    let n = 0;
    for (const [ch, p] of eachPara(doc)) {
      if (!isCandidate(p.text)) continue;
      n++;
      console.log(`${ch.key}  ${p.para}  ${p.text.slice(0, 80)}`);
    }
    console.log(`${n} candidates in ${id}`);
  }
}

/* POST one run; 409 (a run already in flight) retries up to 60×5s, exit on 401/503/other */
async function startRun(base, token, body) {
  const opts = { method: "POST", headers: { "content-type": "application/json", "x-gate-token": token }, body: JSON.stringify(body) };
  for (let tries = 0; tries < 60; tries++) {
    const res = await fetch(`${base}/api/runs`, opts);
    const text = await res.text();
    let data = {}; try { data = JSON.parse(text); } catch {}
    if (res.status === 202) return data.runId;
    if (res.status === 409) { await sleep(5000); continue; }
    if (res.status === 401) fail("gate token rejected");
    if (res.status === 503) fail(data.error ?? text);
    fail(text);
  }
  fail(`para ${body.para}: still 409 after 60 retries`);
}
async function poll(base, runId) {
  const deadline = Date.now() + 600_000; // 10 min, then caller reports timeout
  while (Date.now() < deadline) {
    const run = await (await fetch(`${base}/api/runs/${runId}`)).json();
    if (run.status !== "running") return run;
    await sleep(3000);
  }
  return null;
}

async function cmdRun(circularId, selector, base) {
  const doc = await load(circularId);
  const index = new Map();
  for (const [ch, p] of eachPara(doc)) index.set(p.para, { ch, p });
  const selected = selector === "all"
    ? [...index.values()].filter(({ p }) => isCandidate(p.text)).map(({ p }) => p.para)
    : selector.split(",");
  for (const para of selected) if (!index.has(para)) fail(`para ${para} not found in ${circularId}`);
  const token = process.env.GATE_TOKEN;
  if (!token) fail("GATE_TOKEN unset — export the worker's gate token and retry");
  let done = 0, awaiting = 0, failed = 0;
  for (const para of selected) {
    const { ch, p } = index.get(para);
    const runId = await startRun(base, token, { clauseText: p.text, para, chapter: ch.key, circularId });
    const run = await poll(base, runId);
    if (!run) { console.log(`${para}  timeout`); continue; }
    const checks = run.verifierChecks ?? [];
    const failing = checks.filter((c) => !c.pass).map((c) => c.name);
    const bracket = failing.length ? ` [${failing.join(", ")}]` : "";
    console.log(`${para}  ${run.status}  checks: ${checks.length - failing.length}/${checks.length}${bracket}  proposed: ${(run.proposed ?? []).length}${run.error ? "  " + run.error : ""}`);
    done++;
    if (run.status === "awaiting-approval") awaiting++;
    else if (run.status === "failed") failed++;
  }
  console.log(`${done}/${selected.length} runs finished; ${awaiting} awaiting approval, ${failed} failed`);
}

const [cmd, ...rest] = process.argv.slice(2);
const base = rest.includes("--base") ? rest[rest.indexOf("--base") + 1] : "http://localhost:8787";
if (cmd === "list") await cmdList(rest[0]);
else if (cmd === "run") {
  if (!rest[0] || !rest[1]) fail("usage: run <circularId> <para[,para...]|all> [--base URL]");
  await cmdRun(rest[0], rest[1], base);
} else fail("usage: run-paras.mjs list [circularId] | run <circularId> <para|all> [--base URL]");
