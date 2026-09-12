/* Offline selftest for the watchtower parsers — workerd cannot reach sebi.gov.in
   or apmiindia.org from local dev, so we assert against saved fixtures instead.
   Run: npm run watch:selftest  (tsx resolves the .ts import). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseListing, parseApmi } from "../worker/watch.ts";

const fx = (name) => readFileSync(fileURLToPath(new URL(`../worker/__fixtures__/${name}`, import.meta.url)), "utf8");
const assert = (cond, msg) => {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
};

/* SEBI press releases — the HomeAction listing table, parsed like the others */
const press = parseListing(fx("press-releases.html"));
const pressWithDate = press.filter((i) => i.pubDate);
assert(press.length >= 20, `press releases: expected >= 20 items, got ${press.length}`);
assert(pressWithDate.length === press.length, `press releases: ${press.length - pressWithDate.length} items missing a date`);

/* APMI circulars — flat list of PDF links */
const apmi = parseApmi(fx("apmi.html"));
const links = apmi.map((i) => i.link);
assert(apmi.length === 131, `apmi: expected 131 links, got ${apmi.length}`);
assert(apmi.every((i) => i.link.toLowerCase().endsWith(".pdf")), "apmi: some links do not end in .pdf");
assert(new Set(links).size === links.length, "apmi: duplicate links found");

console.log(`press-releases: ${press.length} items (all dated)`);
console.log(`apmi: ${apmi.length} circular PDFs (unique)`);
console.log("watch selftest OK");
