/* Bulk-decide drafts at the human gate.
   usage: node scripts/decide.mjs approve|reject OBL-003,OBL-004,… [--reason "<text>"] [--base URL]
   reject on an approved id withdraws it (--reason is recorded on the audit event).
   env GATE_TOKEN required; OFFICER optional (default "Compliance Officer"). */
const fail = (msg) => (console.error(msg), process.exit(1));

const [decision, list, ...rest] = process.argv.slice(2);
if (decision !== "approve" && decision !== "reject") fail('usage: decide.mjs approve|reject <id,id,…> [--reason "<text>"] [--base URL]');
if (!list) fail("no obligation ids given");
const base = rest.includes("--base") ? rest[rest.indexOf("--base") + 1] : "http://localhost:8787";
const reason = rest.includes("--reason") ? rest[rest.indexOf("--reason") + 1] : undefined;
const token = process.env.GATE_TOKEN;
if (!token) fail("GATE_TOKEN unset — export the worker's gate token and retry");
const officer = process.env.OFFICER ?? "Compliance Officer";

const ids = list.split(",").filter(Boolean);
let ok = 0;
for (const id of ids) {
  try {
    const res = await fetch(`${base}/api/obligations/${id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-gate-token": token },
      body: JSON.stringify({ decision, officer, ...(reason ? { reason } : {}) }),
    });
    const text = await res.text();
    let data = {}; try { data = JSON.parse(text); } catch {}
    if (res.ok) ok++;
    console.log(`${id}  ${decision}  ${res.status}${res.ok ? "" : "  " + (data.error ?? text)}`);
  } catch (e) {
    console.log(`${id}  ${decision}  network-error  ${e.message || "fetch failed"}`);
  }
}
console.log(`${ok}/${ids.length} decided`);
