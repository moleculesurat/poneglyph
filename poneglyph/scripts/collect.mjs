// collect — parse the two SEBI master circulars (pdftotext -layout dumps) into
// paragraph JSON. Plain Node, no deps. Deterministic: same input -> byte-identical output.
//
// ponytail: footnote handling is precision-first, not exhaustive, because verbatim text is
// rule 1 of the roadmap. We strip footnote digits GLUED to a lowercase word
// ("requirements29"), to a closing bracket/quote (")28", "”28"), landing at a paragraph's
// start ("65All"), and glued to a sentence-ending full stop — a dot preceded by a letter and
// followed by a new sentence ("requirement.45 The" -> "requirement. The"). We deliberately do
// NOT touch: spaced footnotes ("month 67 and") — a stray "67" is cosmetic and never costs a
// real number like "7 working days"; digits after an UPPERCASE letter ("5A66"), which would
// corrupt identifiers like "DOF1"/"POD1"; and — the reason for the full-stop guard — decimals
// and cross-references, so "0.50%", "₹50,00,000", "para 2.4.1 of" and "para 3.1.1 (a)" stay
// exact. Titles get one extra pass: a trailing standalone number is dropped, since a heading
// never ends in one. A lone 1-3 digit line is treated as a footnote-block start; body tables
// (none pre-annexure here) could fool that.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(DIR, "../.."); // repo root; sources live at given/sources/
const OUT = resolve(DIR, "../data/collected");

const PAGE = /Page \d+ of \d+/; // "Page 48 of 207", "Page 72 of 153  Back to Index"
const PARA = /^\s*(\d+(?:\.\d+)+)\.\s/; // "5.1.2. ", "21.1.1. " — depth >= 2
const BARE = /^\s*\d{1,3}\s*$/; // lone footnote number -> start of a footnote block

const DOCS = [
  {
    id: "MC-PM-2025",
    number: "SEBI/HO/IMD/IMD-POD-1/P/CIR/2025/104",
    title: "Master Circular for Portfolio Managers",
    issuedOn: "2025-07-16",
    source:
      "https://www.sebi.gov.in/legal/master-circulars/jul-2025/master-circular-for-portfolio-managers_95347.html",
    sourceFile: "given/sources/pms-master-circular-2025-07-16.txt",
    keyPrefix: "pm",
    // body headings: "1. REGISTRATION AND POST-REGISTRATION ACTIVITY" (single number, all caps)
    heading: /^\s*(\d{1,2})\.\s+([A-Z][A-Z0-9 ,/&()'’.-]*[A-Z])\s*$/,
    stop: /^\s*ANNEXURES\s*$/,
    chapters: 7,
  },
  {
    id: "MC-AIF-2026",
    number: "HO/19/34/11(6)2025-AFD-POD1/I/12928/2026",
    title: "Master Circular for Alternative Investment Funds",
    issuedOn: "2026-06-03",
    source: "https://www.sebi.gov.in/legal/master-circulars",
    sourceFile: "given/sources/aif-master-circular-2026-06-03.txt",
    keyPrefix: "aif",
    // body headings: "Chapter 1 - Requirements and clarifications ..." (may wrap, may end in a footnote digit)
    heading: /^\s*Chapter\s+(\d+)\s*-\s*(\S.*?)\s*$/,
    stop: /^\s*Annexure\s*1\b/,
    chapters: 25,
  },
];

// Reject table-of-contents rows (dot leaders / ellipsis) so heading detection only
// fires in the body. This is how we "start at the second occurrence" of chapter 1.
const isToc = (line) => /\.{4,}/.test(line) || /…/.test(line);

function matchHeading(doc, line) {
  if (isToc(line)) return null;
  const m = line.match(doc.heading);
  return m ? { n: Number(m[1]), title: m[2] } : null;
}

function stripFootnotes(s) {
  return s
    .replace(/^\d+(?=[A-Za-z])/, "") // superscript landed at the start: "65All" -> "All"
    .replace(/([a-z])\d{1,3}\b/g, "$1") // after a lowercase word: "requirements29"
    .replace(/([)\]”"'’])\d{1,3}\b/g, "$1") // after a closing bracket or quote: "(CIV”28)" -> "(CIV”)"
    // after a sentence-ending full stop (dot preceded by a letter) AND followed by a new
    // sentence — whitespace + a capital or an opening quote/bracket, or end of text:
    // "requirement.45 The" -> "requirement. The". The letter-before-dot guard leaves numeric
    // separators alone, so "para 3.1.1 (a)", "para 2.4.1 of" and "0.50%" are untouched.
    .replace(/([A-Za-z]\.)\d{1,3}(?=\s+["'“‘(\[A-Z]|\s*$)/g, "$1");
}

const cleanText = (s) => stripFootnotes(s.replace(/\s+/g, " ").trim()).trim();
const cleanTitle = (s) => cleanText(s).replace(/\s*\d{1,3}$/, "").trim(); // headings never end in a number (spaced or glued footnote)

function parse(doc) {
  const raw = readFileSync(resolve(ROOT, doc.sourceFile));
  const sha = createHash("sha256").update(raw).digest("hex");
  const lines = raw.toString("utf8").split(/\r?\n/);

  const chapters = [];
  let cur = null; // current chapter
  let para = null; // { para, buf: [] }
  let expected = 1;
  let skipFootnote = false;

  const flush = () => {
    if (para && cur) {
      const text = cleanText(para.buf.join(" "));
      if (text) cur.paras.push({ para: para.para, text });
    }
    para = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (cur && doc.stop.test(line)) break; // annexures — stop (only once inside the body)
    if (skipFootnote) {
      if (PAGE.test(line)) skipFootnote = false; // footnote block ends at the page marker
      continue;
    }
    if (PAGE.test(line)) continue; // drop page markers, keep the paragraph going

    const h = matchHeading(doc, line);
    if (h && h.n === expected) {
      flush();
      let title = h.title;
      let j = i + 1; // pull in a wrapped heading (AIF chapters 11, 14, 15, ...)
      // A wrapped-title line is part of the centred heading block, so it is deeply
      // indented; un-numbered chapter lead-in prose (chapters 6, 9) sits at the left
      // margin and must not be swallowed into the title.
      while (j < lines.length && /^\s{6,}\S/.test(lines[j])) {
        const nx = lines[j];
        if (PAGE.test(nx) || PARA.test(nx) || BARE.test(nx) || matchHeading(doc, nx) || doc.stop.test(nx)) break;
        title += " " + nx.trim();
        j++;
      }
      i = j - 1;
      cur = { key: `${doc.keyPrefix}-${h.n}`, title: cleanTitle(title), paras: [] };
      chapters.push(cur);
      expected++;
      continue;
    }
    if (!cur) continue; // still in the front matter / ToC

    if (BARE.test(line)) {
      skipFootnote = true; // a lone number opens a footnote block; skip to the page marker
      continue;
    }
    const pm = line.match(PARA);
    if (pm) {
      flush();
      para = { para: pm[1], buf: [line.slice(pm[0].length)] };
    } else if (para && line.trim()) {
      para.buf.push(line.trim()); // wrapped continuation of the current paragraph
    }
  }
  flush();

  return { doc, sha, chapters };
}

function build(doc) {
  const { sha, chapters } = parse(doc);
  const out = {
    id: doc.id,
    number: doc.number,
    title: doc.title,
    issuedOn: doc.issuedOn,
    kind: "master-circular",
    source: doc.source,
    sourceFile: doc.sourceFile,
    sourceSha256: sha,
    chapters,
  };

  const paraText = (n) => {
    for (const c of chapters) for (const p of c.paras) if (p.para === n) return p.text;
    return "";
  };
  const has = (n, sub) => {
    if (!paraText(n).includes(sub)) {
      throw new Error(`${doc.id}: para ${n} missing "${sub}" — got: ${paraText(n) || "(not found)"}`);
    }
  };

  if (chapters.length !== doc.chapters) {
    throw new Error(`${doc.id}: expected ${doc.chapters} chapters, got ${chapters.length}`);
  }
  if (doc.id === "MC-PM-2025") {
    if (!chapters.some((c) => c.key === "pm-5")) throw new Error("MC-PM-2025: chapter 5 missing");
    has("5.1.2", "within 7 working days of the end of each month");
    has("6.1.3.3", "0.50% per annum"); // decimal must survive
    has("6.1.3.6", "₹50,00,000"); // grouped-thousands amount must survive
    has("2.5.1.1", "₹50 Lakh"); // glued footnote after "Lakh" gone, amount kept
    has("1.5.1.5.5", "paragraphs 1.5.1.2 to 1.5.1.4"); // cross-references must survive
  }
  if (doc.id === "MC-AIF-2026") {
    has("21.1.2", "within 15 calendar days from the end of each such quarter");
    has("17.2.2", "prior to the date of first investment");
    has("12.1.1", "para 2.4.1 of this Master circular"); // cross-reference must survive
    has("3.1.1", "para 3.1.1 (a) and (b)"); // cross-reference before an opening bracket must survive
  }

  // No paragraph may carry the damage the old stripper caused (2.., ..4, 50,,).
  const total = chapters.reduce((n, c) => n + c.paras.length, 0);
  const expectParas = doc.id === "MC-PM-2025" ? 287 : 509;
  if (total !== expectParas) throw new Error(`${doc.id}: expected ${expectParas} paragraphs, got ${total}`);
  for (const c of chapters)
    for (const p of c.paras)
      if (/\d\.\.|\.\.\d|,,/.test(p.text))
        throw new Error(`${doc.id}: para ${p.para} still shows footnote-strip damage: ${p.text}`);

  // Spaced footnote numbers (a 1-3 digit token between two words) are left as-is by design;
  // count them for information only.
  let spaced = 0;
  for (const c of chapters)
    for (const p of c.paras) if (/[A-Za-z] \d{1,3} [A-Za-z]/.test(p.text)) spaced++;
  console.log(`${doc.id}: ${spaced} paragraphs contain a spaced number token (footnote or real, left untouched)`);

  mkdirSync(OUT, { recursive: true });
  const file = resolve(OUT, `${doc.id.toLowerCase()}.json`);
  writeFileSync(file, JSON.stringify(out, null, 2) + "\n");

  console.log(`\n${doc.id}  ${chapters.length} chapters`);
  for (const c of chapters) console.log(`  ${c.key.padEnd(8)} ${String(c.paras.length).padStart(3)} paras  ${c.title}`);
}

for (const doc of DOCS) build(doc);
