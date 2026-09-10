/* Bind evidence to an approved duty through the worker.
   usage: node scripts/attach.mjs <OBL-id> --title "…" [--kind document]
          [--description "…"] [--file path] [--valid-until YYYY-MM-DD] [--base URL]
   env GATE_TOKEN required; OFFICER optional (default "Compliance Officer").
   With --file the file's sha256 and basename are sent; the file is NOT uploaded. */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const fail = (msg) => (console.error(msg), process.exit(1));
const [oblId, ...rest] = process.argv.slice(2);
if (!oblId || oblId.startsWith("--")) fail('usage: attach.mjs <OBL-id> --title "…" [--kind …] [--file path] [--base URL]');

const flag = (name, def) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : def);
const token = process.env.GATE_TOKEN;
if (!token) fail("GATE_TOKEN unset — export the worker's gate token and retry");
const officer = process.env.OFFICER ?? "Compliance Officer";
const base = flag("--base", "http://localhost:8787");

const title = flag("--title");
if (!title) fail("--title is required");

const body = { kind: flag("--kind", "document"), title, description: flag("--description", ""), officer };
const file = flag("--file");
if (file) {
  body.fileName = basename(file);
  body.sha256 = createHash("sha256").update(await readFile(file)).digest("hex");
}
const validUntil = flag("--valid-until");
if (validUntil) body.validUntil = validUntil;

const res = await fetch(`${base}/api/obligations/${oblId}/evidence`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-gate-token": token },
  body: JSON.stringify(body),
});
const text = await res.text();
let data = {};
try { data = JSON.parse(text); } catch {}
if (!res.ok) fail(`${oblId}  ${res.status}  ${data.error ?? text}`);
console.log(`${data.evidence.id}  bound to ${oblId}  status ${data.obligation.status}  chain ${data.chainTip}`);
