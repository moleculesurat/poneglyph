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
  {
    id: "REG-PM-2020",
    number: "SEBI/LAD-NRO/GN/2020/03",
    title: "Securities and Exchange Board of India (Portfolio Managers) Regulations, 2020",
    issuedOn: "2025-09-03", // consolidation date in the header
    kind: "regulation",
    source:
      "https://www.sebi.gov.in/legal/regulations/sep-2025/securities-and-exchange-board-of-india-portfolio-managers-regulations-2020-last-amended-on-september-03-2025-_96560.html",
    sourceFile: "given/sources/pm-regulations-2020-2025-09-03.txt",
    keyPrefix: "pmr",
    chapters: 10, // 7 regulation chapters + Schedules II–IV
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
    .replace(/([A-Za-z]\.)\d{1,3}(?=\s+["'“‘(\[A-Z]|\s*$)/g, "$1")
    // amendment marker glued to an opening bracket ("within 25[twenty-one]"): drop the
    // digits, keep the space and the square brackets (SEBI's own amendment marks). The
    // leading-whitespace guard means a bracket at a paragraph start (circular "9[…]") is
    // untouched, so the two master-circular outputs stay byte-identical.
    .replace(/(\s)\d{1,3}(?=\[)/g, "$1");
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

// ── regulation-shaped source ──────────────────────────────────────────────
// SEBI regulations: centred "CHAPTER <roman>" markers, numbered regulations at
// column 0, the sub-regulation ("(1)", "(2)") as the paragraph unit. Clauses,
// provisos and explanations fold into their sub-regulation; a regulation with no
// sub-regulation is one paragraph. Footnotes sit at page bottoms and are skipped
// to the page marker, as parse() does; SEBI's [..] amendment marks are kept.
// ponytail: clause-level split when a duty hides inside a long clause list.
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
const CH_MARK = /^\s+CHAPTER ([IVX]+)\s*$/; // "CHAPTER VI-A" (footnote-bracketed) never matches
const CH_TITLE = /^\s*[A-Z][A-Z0-9 ,/&()'’.-]*[A-Z]\s*$/; // all-caps line; footnote/page lines carry lowercase and are skipped
const REG = /^(\d{1,3}[A-Z]?)\.\s+/; // "3. ", "22A. ", "24. " — years (4 digits) never match
const SUBREG = /^\((\d{1,2})\)\s+["'“‘(\[A-Z]/; // "(1) An", "(1) (a)" — a lowercase start ("(2) of …") is a wrapped cross-ref
const SUBNUM = /^\((\d{1,2})\)\s+(.*)$/;
const REG_BARE = /^\s*\d{1,3}\s*$/; // lone superscript marker for the bracketed insertion that follows — drop the line
// ── schedules ──
// After the regulations, SCHEDULE I holds forms (not collected); skip to SCHEDULE II
// and collect II–IV as chapters (pmr-s2..pmr-s4), stopping at SCHEDULE VI (declarations)
// or the "Footnote:" amendment history, whichever comes first.
const SCHED_I = /^\s+SCHEDULE I\s*$/; // forms — start skipping here
const SCHED_COLLECT = /^\s+SCHEDULE (II|III|IV)\s*$/; // the three we collect
const SCHED_END = /^\s+SCHEDULE VI\s*$/; // declarations — stop
const FOOTNOTE_HDR = /^\s*Footnote:/; // amendment history — stop
const SITEM = /^\s*(\d{1,2})\.\s+(.*)$/; // a numbered schedule item, at any indent; remainder captured
const REG_REF = /^\s*\[Regulation (\d+)\]/; // the bracketed regulation reference in a schedule header
const FOOT =
  /^\s*(\d{1,3}\s+)?(Inserted|Substituted|Omitted|The words|Clause \([a-z]+\) omitted|Renumbered) (by|for)\b|^\s*\d{4},? w\.e\.f|\bw\.e\.f\b/;

function paraObj(chapters, n) {
  for (const c of chapters) for (const p of c.paras) if (p.para === n) return p;
  return null;
}

function regParse(doc) {
  const raw = readFileSync(resolve(ROOT, doc.sourceFile));
  const sha = createHash("sha256").update(raw).digest("hex");
  // pdftotext glues a form-feed to the first line of each page ("\f(2) The books…");
  // strip it so a column-0 regulation/sub-regulation line at a page top still anchors.
  const lines = raw.toString("utf8").replace(/\f/g, "").split(/\r?\n/);

  const chapters = [];
  let cur = null; // current chapter
  let para = null; // { para, buf, heading }
  let curReg = null; // current regulation number
  let curHeading; // heading for the current regulation's paragraphs
  let pendingHeading; // heading seen, waiting for its regulation line
  let skipFootnote = false;
  let mode = "reg"; // "reg" → chapters I–VII, "forms" → skipping Schedule I, "sched" → collecting II–IV
  let schedNum = null; // current schedule number, for S<n>.<item> ids

  const flush = () => {
    if (para && cur) {
      const text = cleanText(para.buf.join(" "));
      if (text) {
        const p = { para: para.para, text };
        if (para.heading) p.heading = para.heading;
        cur.paras.push(p);
      }
    }
    para = null;
  };
  const nextNonBlank = (i) => {
    for (let j = i + 1; j < lines.length; j++) if (lines[j].trim()) return lines[j];
    return "";
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // once in the schedules, stop at SCHEDULE VI (declarations) or the amendment history
    if (mode !== "reg" && (SCHED_END.test(line) || FOOTNOTE_HDR.test(line))) {
      flush();
      break;
    }
    if (skipFootnote) {
      if (PAGE.test(line)) skipFootnote = false; // footnote block ends at the page marker
      continue;
    }
    if (PAGE.test(line)) continue; // drop page markers, keep the paragraph going

    if (mode === "reg" && SCHED_I.test(line)) {
      flush();
      mode = "forms"; // Schedule I is forms — skip until Schedule II
      continue;
    }
    const scm = line.match(SCHED_COLLECT);
    if (scm && mode !== "reg") {
      flush();
      schedNum = ROMAN[scm[1]];
      // header: a bracketed "[Regulation N]" ref and the ALL-CAPS title line(s) between the
      // marker and the first numbered item, in either order (IV puts the title before the ref).
      let ref = "";
      const caps = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const t = lines[j];
        if (!t.trim() || PAGE.test(t)) continue;
        const rr = t.match(REG_REF);
        if (rr) {
          ref = rr[1];
          continue;
        }
        if (SITEM.test(t)) break; // first item — header ends
        if (CH_TITLE.test(t)) caps.push(t.trim()); // an ALL-CAPS title line (mixed-case lines are skipped)
      }
      cur = { key: `${doc.keyPrefix}-s${schedNum}`, title: `Schedule ${scm[1]} (Regulation ${ref}): ${caps.join(" ")}`, paras: [] };
      chapters.push(cur);
      mode = "sched";
      para = null;
      i = j - 1; // resume at the first item line
      continue;
    }
    if (mode === "forms") continue; // skipping Schedule I's forms

    if (mode === "sched") {
      if (REG_BARE.test(line)) continue; // lone superscript marker — drop
      if (FOOT.test(line)) {
        skipFootnote = true; // footnote block — skip to the page marker (Schedule II item 4)
        continue;
      }
      const im = line.match(SITEM);
      if (im) {
        // every numbered line starts a new item, whatever follows it — the "(1)"/"(a)"
        // sub-markers on Schedule III items 11–13 open separate duties, not sub-clauses.
        flush();
        para = { para: `S${schedNum}.${im[1]}`, buf: [im[2]] };
        continue;
      }
      if (para && line.trim()) para.buf.push(line.trim()); // sub-item / wrapped continuation
      continue;
    }

    const cm = line.match(CH_MARK);
    if (cm && ROMAN[cm[1]]) {
      flush();
      let j = i + 1; // title = next all-caps line (skips chapter V's footnote block + page marker)
      while (j < lines.length && !CH_TITLE.test(lines[j])) j++;
      cur = { key: `${doc.keyPrefix}-${ROMAN[cm[1]]}`, title: lines[j].trim(), paras: [] };
      chapters.push(cur);
      curReg = null;
      curHeading = undefined;
      pendingHeading = undefined;
      i = j;
      continue;
    }
    if (!cur) continue; // front matter / cover

    if (REG_BARE.test(line)) continue; // lone superscript marker — drop the line, keep the text that follows
    if (FOOT.test(line)) {
      skipFootnote = true; // footnote block — skip to the page marker
      continue;
    }

    const rm = line.match(REG);
    if (rm) {
      flush();
      curReg = rm[1];
      curHeading = pendingHeading;
      pendingHeading = undefined;
      const rest = line.slice(rm[0].length); // "4. (1) An…" and "24. (1) (a) The…" carry the first sub-regulation inline
      if (SUBREG.test(rest)) {
        const m = rest.match(SUBNUM);
        para = { para: `${curReg}(${m[1]})`, buf: [m[2]], heading: curHeading };
      } else {
        para = { para: curReg, buf: [rest], heading: curHeading };
      }
      continue;
    }
    if (curReg && SUBREG.test(line)) {
      flush();
      const m = line.match(SUBNUM);
      para = { para: `${curReg}(${m[1]})`, buf: [m[2]], heading: curHeading };
      continue;
    }
    // regulation heading: a column-0 line ending in "." whose next non-blank line is a regulation line
    if (/^\S/.test(line) && /\.\s*$/.test(line) && REG.test(nextNonBlank(i))) {
      flush();
      pendingHeading = line.trim();
      continue;
    }
    if (para && line.trim()) para.buf.push(line.trim()); // wrapped continuation
  }
  flush();
  return { doc, sha, chapters };
}

function regChecks(doc, chapters, has) {
  const TITLES = [
    "PRELIMINARY",
    "REGISTRATION OF PORTFOLIO MANAGERS",
    "ELIGIBLE FUND MANAGERS",
    "GENERAL OBLIGATIONS AND RESPONSIBILITIES",
    "INSPECTION AND DISCIPLINARY PROCEEDINGS",
    "PROCEDURE FOR ACTION IN CASE OF DEFAULT",
    "MISCELLANEOUS",
    "Schedule II (Regulation 15): FEES",
    "Schedule III (Regulation 21): CODE OF CONDUCT- PORTFOLIO MANAGER",
    "Schedule IV (Regulation 22): CONTENTS OF AGREEMENT BETWEEN THE PORTFOLIO MANAGER AND HIS CLIENTS",
  ];
  chapters.forEach((c, i) => {
    if (c.title !== TITLES[i]) throw new Error(`${doc.id}: chapter ${i + 1} title "${c.title}" != "${TITLES[i]}"`);
  });

  const ids = [];
  const regNums = new Set();
  const subByReg = new Map();
  for (const c of chapters)
    for (const p of c.paras) {
      ids.push(p.para);
      if (/Inserted by|Substituted (by|for)|w\.e\.f/.test(p.text))
        throw new Error(`${doc.id}: footnote leaked into ${p.para}: ${p.text.slice(0, 90)}`);
      if (/^S\d/.test(p.para)) {
        // schedule item — validate shape, but keep it out of the regulation-number invariants
        if (!/^S\d\.\d{1,2}$/.test(p.para)) throw new Error(`${doc.id}: malformed schedule id ${p.para}`);
        continue;
      }
      const m = p.para.match(/^(\d{1,3}[A-Z]?)(?:\((\d{1,2})\))?$/);
      if (!m) throw new Error(`${doc.id}: malformed paragraph id ${p.para}`);
      regNums.add(m[1]);
      if (m[2]) {
        const arr = subByReg.get(m[1]) ?? [];
        arr.push(Number(m[2]));
        subByReg.set(m[1], arr);
      }
    }
  const dup = ids.find((x, i) => ids.indexOf(x) !== i);
  if (dup) throw new Error(`${doc.id}: duplicate paragraph id ${dup}`);

  const expected = new Set([...Array(43)].map((_, i) => String(i + 1)).concat(["22A", "34A", "42A"]));
  for (const n of expected) if (!regNums.has(n)) throw new Error(`${doc.id}: missing regulation ${n}`);
  for (const n of regNums) if (!expected.has(n)) throw new Error(`${doc.id}: unexpected regulation ${n}`);
  for (const [reg, subs] of subByReg)
    for (let i = 1; i < subs.length; i++)
      if (subs[i] <= subs[i - 1]) throw new Error(`${doc.id}: reg ${reg} sub-regs not increasing: ${subs.join(",")}`);

  // schedules
  const countOf = (k) => (chapters.find((c) => c.key === k) || { paras: [] }).paras.length;
  if (chapters.some((c) => c.key === "pmr-s1" || c.key === "pmr-s6"))
    throw new Error(`${doc.id}: unexpected schedule chapter (pmr-s1 or pmr-s6 — forms/declarations must not be collected)`);
  for (const [k, n] of [["pmr-s2", 5], ["pmr-s3", 13], ["pmr-s4", 18]])
    if (countOf(k) !== n) throw new Error(`${doc.id}: ${k} expected ${n} items, got ${countOf(k)}`);
  const total = chapters.reduce((n, c) => n + c.paras.length, 0);
  if (total !== 144) throw new Error(`${doc.id}: expected 144 paragraphs, got ${total}`);
  for (const c of chapters)
    for (const p of c.paras)
      if (/Declaration by an existing portfolio manager|were published in the Gazette/.test(p.text))
        throw new Error(`${doc.id}: collected past Schedule IV into ${p.para}: ${p.text.slice(0, 60)}`);

  has("S2.3", "five lakh rupees every three years");
  has("S2.4", "[The fee referred to in paragraph (2) shall be paid by the portfolio manager within");
  has("S2.4", "SEBI Payment Gateway");
  has("S2.5", "fees specified in paragraphs (1) and (3) above");
  has("S3.1", "observe high standards of integrity and fairness");
  has("S3.10", "render the best possible advice to the client");
  if (paraObj(chapters, "S3.10").text.includes("false market"))
    throw new Error(`${doc.id}: S3.10 bled into item 11 (contains "false market")`);
  has("S3.11", "creation of false market in securities");
  has("S3.12", "publicly accessible media");
  has("S3.13", "(b) The portfolio manager shall comply with the code of conduct specified in the SEBI (Prohibition of Insider Trading) Regulations, 2015.");
  has("S4.3", "(ii) providing reports to clients;");
  has("S4.18", "Settlement of grievances/disputes and provision for arbitration");

  has("3", "No person shall act as a portfolio manager unless it has obtained a certificate of registration");
  has("15(1)", "within 15 days of receiving intimation from the Board");
  has("23(2)", "fifty lakh rupees");
  has("28", "net worth certificate issued by a chartered accountant");
  has("34(1)", "appoint a compliance officer");
  has("22(1)", "enter into an agreement in writing");
  has("11", "within [twenty-one calendar days] of the date of the receipt");

  const p24 = paraObj(chapters, "24(1)");
  if (!p24 || !p24.text.startsWith("(a) The money or securities accepted"))
    throw new Error(`${doc.id}: 24(1) text starts "${(p24 && p24.text.slice(0, 45)) || "(not found)"}"`);
  const headOf = (n) => (paraObj(chapters, n) || {}).heading;
  if (headOf("3") !== "Registration as portfolio manager.")
    throw new Error(`${doc.id}: reg 3 heading "${headOf("3")}"`);
  if (headOf("28") !== "Submission of net worth certificate.")
    throw new Error(`${doc.id}: reg 28 heading "${headOf("28")}"`);
}

function build(doc) {
  const { sha, chapters } = (doc.kind === "regulation" ? regParse : parse)(doc);
  const out = {
    id: doc.id,
    number: doc.number,
    title: doc.title,
    issuedOn: doc.issuedOn,
    kind: doc.kind ?? "master-circular",
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

  if (doc.kind === "regulation") {
    regChecks(doc, chapters, has);
    mkdirSync(OUT, { recursive: true });
    writeFileSync(resolve(OUT, `${doc.id.toLowerCase()}.json`), JSON.stringify(out, null, 2) + "\n");
    console.log(`\n${doc.id}  ${chapters.length} chapters`);
    for (const c of chapters)
      console.log(`  ${c.key.padEnd(8)} ${String(c.paras.length).padStart(3)} paras  ${c.title}`);
    console.log(`  total ${chapters.reduce((n, c) => n + c.paras.length, 0)} paragraphs`);
    return;
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
