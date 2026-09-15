/* Intake by folder — upload every PDF in an inbox tree against its kind, then
   read it. No new dependencies: Node 22 built-ins only (fs, path, fetch,
   FormData, Blob).

   usage:
     node scripts/intake.mjs --inbox <dir> [--base http://localhost:8787] \
       [--officer Operations] [--no-read] [--dry-run] [--init]
   env GATE_TOKEN required (e.g. GATE_TOKEN=$(grep ^GATE_TOKEN= .dev.vars | cut -d= -f2-)).

   Layout: an immediate subfolder whose name starts with a kind id (K followed
   by two digits) marks every PDF directly inside it as that kind; PDFs directly
   in the inbox are volunteered (no kind). Other files are skipped and deeper
   nesting is ignored — both reported. The walk is sorted and sequential because
   the read model rejects concurrent calls.

   --init creates the 43 kind folders from data/catalogue.json (no server) and
   exits. Per PDF the script POSTs /api/documents (file, officer, name, kindId
   when known). Unless --no-read, a kindless (volunteered) file is first POSTed to
   /api/documents/<id>/classify to propose a catalogue kind; if one is found the
   file is then read against that kind's asks, otherwise it stays volunteered.
   Every file that has a kind is POSTed to /api/documents/<id>/read. */

import { readdirSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const fail = (msg) => (console.error(msg), process.exit(1));

const argv = process.argv.slice(2);
const flag = (name, def) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : def);
const has = (name) => argv.includes(name);

const inbox = flag("--inbox");
if (!inbox) {
  fail("usage: intake.mjs --inbox <dir> [--base URL] [--officer NAME] [--no-read] [--dry-run] [--init]");
}
const base = flag("--base", "http://localhost:8787");
const officer = flag("--officer", "Operations");
const noRead = has("--no-read");
const dryRun = has("--dry-run");

/* the catalogue, straight from disk — no server needed for --init or --dry-run */
const catalogue = JSON.parse(readFileSync(new URL("../data/catalogue.json", import.meta.url), "utf8"));
const kindById = (id) => catalogue.find((k) => k.id === id);

/* ── --init: create the kind folders and exit ───────────────────────── */
if (has("--init")) {
  mkdirSync(inbox, { recursive: true });
  let made = 0;
  for (const k of [...catalogue].sort((a, b) => a.id.localeCompare(b.id))) {
    /* a kind name can carry a slash (K03), illegal in a path segment — flatten it */
    const dir = join(inbox, `${k.id} ${k.name.replace(/\//g, "-")}`);
    if (existsSync(dir)) continue;
    mkdirSync(dir);
    made += 1;
  }
  console.log(`--init: ${made} folder(s) created under ${inbox} (${catalogue.length} kinds)`);
  process.exit(0);
}

/* ── walk the inbox ─────────────────────────────────────────────────── */
const isPdf = (name) => name.toLowerCase().endsWith(".pdf");
const byName = (a, b) => a.name.localeCompare(b.name);

const plan = []; // { path, rel, kindId | null }
const skipped = []; // report-only lines

const entries = readdirSync(inbox, { withFileTypes: true }).sort(byName);

/* kind folders first, then loose files — so kinded documents take the low DOC
   ids and a numeric-named loose file cannot jump ahead of a Kxx folder */
for (const ent of entries) {
  if (!ent.isDirectory()) continue;
  const m = ent.name.match(/^K\d\d/);
  if (!m) {
    skipped.push(`${ent.name}/  (not a Kxx kind folder — ignored)`);
    continue;
  }
  const abs = join(inbox, ent.name);
  for (const s of readdirSync(abs, { withFileTypes: true }).sort(byName)) {
    const rel = join(ent.name, s.name);
    if (s.isDirectory()) skipped.push(`${rel}/  (deeper nesting — ignored)`);
    else if (!isPdf(s.name)) skipped.push(`${rel}  (not a PDF — skipped)`);
    else plan.push({ path: join(abs, s.name), rel, kindId: m[0] });
  }
}
for (const ent of entries) {
  if (ent.isDirectory()) continue;
  if (isPdf(ent.name)) plan.push({ path: join(inbox, ent.name), rel: ent.name, kindId: null }); // volunteered
  else skipped.push(`${ent.name}  (not a PDF — skipped)`);
}

const asksFor = (kindId) => {
  if (!kindId) return 0;
  const k = kindById(kindId);
  return k ? k.askIds.length : "?";
};
const volunteered = plan.filter((p) => !p.kindId).length;
const skippedNonPdf = skipped.filter((s) => s.includes("not a PDF")).length;

/* ── --dry-run: print the plan, make no request ─────────────────────── */
if (dryRun) {
  console.log(`plan (dry run) — inbox ${inbox}, base ${base}, officer ${officer}${noRead ? ", no read" : ""}`);
  for (const p of plan) {
    console.log(`${p.rel}  ${p.kindId ?? "-"}  ${asksFor(p.kindId)} asks  would upload${noRead ? "" : " + read"}`);
  }
  for (const s of skipped) console.log(s);
  console.log(
    `summary (dry run): ${plan.length} PDF(s) to upload · ${volunteered} volunteered · ${skipped.length} skipped; no requests made`,
  );
  process.exit(0);
}

/* ── real run: upload (and read) each PDF ───────────────────────────── */
const token = process.env.GATE_TOKEN;
if (!token) fail("GATE_TOKEN unset — export the worker's gate token and retry");

let uploaded = 0;
let already = 0;
let readsOk = 0;
let readsFailed = 0;
let uploadFailed = 0;
let classified = 0;
let unclassified = 0;

const jsonOf = async (res) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

for (const p of plan) {
  const kindCol = p.kindId ?? "-";
  const name = basename(p.path);

  const fd = new FormData();
  fd.append("file", new Blob([readFileSync(p.path)], { type: "application/pdf" }), name);
  fd.append("officer", officer);
  fd.append("name", name);
  if (p.kindId) fd.append("kindId", p.kindId);

  let res;
  try {
    res = await fetch(`${base}/api/documents`, { method: "POST", headers: { "x-gate-token": token }, body: fd });
  } catch (e) {
    uploadFailed += 1;
    console.log(`${p.rel}  -  ${kindCol}  ${asksFor(p.kindId)} asks  upload network-error: ${e.message || "fetch failed"}`);
    continue;
  }
  const data = await jsonOf(res);

  if (res.status === 409) {
    already += 1;
    console.log(`${p.rel}  ${data.documentId ?? "?"}  ${kindCol}  ${asksFor(p.kindId)} asks  already ${data.documentId ?? ""}`.trimEnd());
    continue; // a stored file is not re-read
  }
  if (res.status !== 201) {
    uploadFailed += 1;
    console.log(`${p.rel}  -  ${kindCol}  ${asksFor(p.kindId)} asks  upload ${res.status}: ${data.error ?? ""}`);
    continue;
  }
  uploaded += 1;
  const id = data.document.id;
  let docKind = p.kindId; // may be set by classification below
  let nAsks = (data.document.requirementIds ?? []).length;

  if (noRead) {
    console.log(`${p.rel}  ${id}  ${docKind ?? "-"}  ${nAsks} asks  (no read)`);
    continue;
  }

  /* a volunteered (kindless) file is classified before it is read: the machine
     either names a kind — then read it against that kind's asks — or returns null */
  let prefix = "";
  if (!docKind) {
    let cres;
    try {
      cres = await fetch(`${base}/api/documents/${id}/classify`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-gate-token": token },
        body: JSON.stringify({ officer }),
      });
    } catch (e) {
      unclassified += 1;
      console.log(`${p.rel}  ${id}  -  ${nAsks} asks  classify network-error: ${e.message || "fetch failed"}`);
      continue;
    }
    const cdata = await jsonOf(cres);
    if (!cres.ok) {
      unclassified += 1;
      console.log(`${p.rel}  ${id}  -  ${nAsks} asks  classify ${cres.status}: ${cdata.error ?? ""}`);
      continue;
    }
    const cls = cdata.document?.classification;
    if (!cls || cls.kindId === null) {
      unclassified += 1;
      console.log(`${p.rel}  ${id}  -  ${nAsks} asks  no kind fits — stays volunteered`);
      continue; // nothing to read against
    }
    classified += 1;
    docKind = cls.kindId;
    nAsks = (cdata.document.requirementIds ?? []).length;
    const k = kindById(docKind);
    prefix = `classified ${docKind}${k ? " " + k.name : ""} · `;
  }

  let rres;
  try {
    rres = await fetch(`${base}/api/documents/${id}/read`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-gate-token": token },
      body: JSON.stringify({ officer }),
    });
  } catch (e) {
    readsFailed += 1;
    console.log(`${p.rel}  ${id}  ${docKind}  ${nAsks} asks  ${prefix}read network-error: ${e.message || "fetch failed"}`);
    continue;
  }
  const rdata = await jsonOf(rres);
  if (!rres.ok) {
    readsFailed += 1;
    console.log(`${p.rel}  ${id}  ${docKind}  ${nAsks} asks  ${prefix}read ${rres.status}: ${rdata.error ?? ""}`);
    continue;
  }
  readsOk += 1;
  const verdicts = rdata.document?.proposal?.verdicts ?? [];
  const t = { satisfies: 0, partial: 0, no: 0 };
  for (const v of verdicts) if (v.verdict in t) t[v.verdict] += 1;
  const nFields = (rdata.document?.proposal?.fields ?? []).length;
  console.log(`${p.rel}  ${id}  ${docKind}  ${nAsks} asks  ${prefix}satisfies ${t.satisfies} · partial ${t.partial} · no ${t.no} · ${nFields} fields`);
}

console.log(
  `summary: ${plan.length} PDF(s) seen · ${uploaded} uploaded · ${already} already stored · ` +
    `${readsOk} read ok · ${readsFailed} read failed · ${classified} classified · ${unclassified} unclassified · ` +
    `${volunteered} volunteered · ${skippedNonPdf} skipped non-PDF`,
);
process.exit(uploadFailed > 0 ? 1 : 0);
