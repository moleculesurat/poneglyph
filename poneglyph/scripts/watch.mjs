/* Drive and read the watchtower.
   usage:  node scripts/watch.mjs poll [--base URL]
           node scripts/watch.mjs list [applies|monitor|not-applicable] [--base URL]
   `poll` forces a refresh (POST /api/watch/poll?force=1, GATE_TOKEN required) and
   prints the poll summary plus per-source status. `list` reads GET /api/watch and
   prints one catch per line, newest first:  date  verdict  docType  source  title  url */
const fail = (msg) => (console.error(msg), process.exit(1));

const [cmd, ...rest] = process.argv.slice(2);
const base = rest.includes("--base") ? rest[rest.indexOf("--base") + 1] : "http://localhost:8787";

if (cmd === "poll") {
  const token = process.env.GATE_TOKEN;
  if (!token) fail("GATE_TOKEN unset — export the worker's gate token and retry");
  const res = await fetch(`${base}/api/watch/poll?force=1`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-gate-token": token },
    body: "{}",
  });
  const text = await res.text();
  let d = {};
  try { d = JSON.parse(text); } catch {}
  if (!res.ok) fail(`poll ${res.status}  ${d.error ?? text}`);
  console.log(
    `fetchOk ${d.fetchOk}  newCount ${d.newCount}  totalItems ${d.totalItems}` +
      `${d.skipped ? "  (skipped — within poll gap)" : ""}${d.lastError ? `  lastError: ${d.lastError}` : ""}`,
  );
  for (const [id, s] of Object.entries(d.sources ?? {})) {
    console.log(`  ${id.padEnd(18)} HTTP ${s.httpStatus ?? "-"}  ${s.items} items${s.lastError ? `  ${s.lastError}` : ""}`);
  }
} else if (cmd === "list") {
  const filter = rest.find((a) => !a.startsWith("--") && a !== base);
  if (filter && !["applies", "monitor", "not-applicable"].includes(filter)) {
    fail(`unknown filter "${filter}" — use applies | monitor | not-applicable`);
  }
  const res = await fetch(`${base}/api/watch`);
  if (!res.ok) fail(`watch ${res.status}`);
  const d = await res.json();
  let catches = d.catches ?? [];
  if (filter) catches = catches.filter((c) => c.triage?.verdict === filter);
  /* newest first — publishedAt is ISO for datable rows, sorts lexically */
  catches.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  for (const c of catches) {
    const date = (c.publishedAt ?? "").slice(0, 10) || "-";
    console.log(`${date}  ${c.triage?.verdict ?? "-"}  ${c.docType}  ${c.source}  ${c.title}  ${c.url}`);
  }
} else {
  fail("usage: watch.mjs poll | list [applies|monitor|not-applicable] [--base URL]");
}
