/* Pull the shared register out of a running worker into git.
   usage: node scripts/pull-register.mjs [baseUrl]   (default http://localhost:8787)
   Writes data/collected/register.json — byte-identical on a repeat pull. */
import { writeFile } from "node:fs/promises";

const baseUrl = (process.argv[2] ?? "http://localhost:8787").replace(/\/+$/, "");
const source = `${baseUrl}/api/state`;

const res = await fetch(source);
const text = await res.text();
let state;
try {
  if (!res.ok) throw new Error();
  state = JSON.parse(text);
} catch {
  console.error(text);
  process.exit(1);
}

const obligations = state.obligations
  .filter((o) => typeof o.approvedBy === "string" && o.approvedBy.length > 0)
  .sort((a, b) => a.id.localeCompare(b.id));

const register = {
  source,
  tip: state.chainTip,
  obligations,
  auditEvents: state.auditEvents,
};

await writeFile(
  new URL("../data/collected/register.json", import.meta.url),
  JSON.stringify(register, null, 2) + "\n",
);

console.log(
  `${obligations.length} approved obligations, ${state.auditEvents.length} audit events, tip ${register.tip}`,
);
