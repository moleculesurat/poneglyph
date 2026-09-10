# Molecule Compliance — the plan (2026-09-10, supersedes everything before it)

One register, one gate, one evidence path. Five sections sit on top of it; the firm's profile decides
which are live. Three rules never change: every duty points to the exact sentence SEBI wrote; nothing
enters the register until a named person at Molecule signs it; what we cannot prove shows as a gap.

```
WHERE WE ARE
  PMS          86 approved duties from the two master circulars (40 PMS / 46 AIF post-registration),
               due dates from the sentences, evidence attach, audit chain. Runs locally only.
  AIF          nothing on registration — AIF Regulations 2012 is not in the corpus.
               Category III paragraphs (AIF MC ch 7, 40 paras) were never drafted; applicability rejects them.
  WATCHTOWER   hourly poll of SEBI's RSS. Works, but the feed is 29/30 enforcement orders and it missed
               this month's AIF circular. Nothing happens after a catch.
  ELSE         deployment on the hackathon Cloudflare account; officer names are placeholders.

THE SECTIONS — the order of the firm's life
  0 PROFILE            who Molecule is. Two facts to add: aif-stage (not-applied → applied → in-principle →
                       registered → first-close) and aif-categories-held. Every section below reads them.
  1 PMS                today's business. Register, calendar, evidence, gaps. Exists. Grows as the PMS
                       corpus is finished; PM Regulations 2020 joins as a source later.
  2 AIF · REGISTRATION what Molecule is doing right now: the path to the certificate, then to first close.
                       One-time duties in order with a progress line — structure, people, application,
                       PPM, service providers, policies, sponsor money, investors, first close. Same
                       pipeline, gate and evidence as PMS; only the view is a checklist, not a table.
                       Sources: AIF Regulations 2012 ch II + AIF MC ch 1 (registration), 2 (PPM),
                       3 (on-boarding), 12 (first close).
  3 AIF · RULES        what follows registration. Tabs CATEGORY II | CATEGORY III over the same register
                       rows, each tagged by the category its sentence addresses (ii / iii / all).
                       Greyed "switches on at registration" until aif-stage says registered. The 46 AIF
                       rows move here; Cat III (ch 7) and the Regulations' post-registration chapters add.
                       A category Molecule does not hold renders as reference, never as a gap.
  4 WATCHTOWER         keeps 1–3 current. Polls SEBI's listing pages, not only RSS. A catch that applies
                       becomes work: fetch → pdftotext → collect → re-run only changed paragraphs →
                       review sheet → gate. Nothing enters the register unread.
  5 INSPECTION         read-only view of 1–3 plus the audit chain, for SEBI. Exists, untested on real data.

BUILD ORDER — and why
  A  profile facts + section nav        unblocked, small. Every later task lands in its section.
  B  watchtower sources + deployment    unblocked. The cron means nothing until deployed. Once live it
                                        catches AIF circulars while C and D are built.
  C  AIF registration (section 2)       waits for the AIF Regulations PDF. Highest business value the day
                                        it lands. Swaps ahead of B if the PDF arrives first.
  D  AIF rules Cat II | III (section 3) waits for the Cat III answer. Reuses the 46 rows; adds ch 7 and
                                        the Regulations chapters; tags replace rejection in applicability.
  E  PMS depth (section 1)              ~445 remaining "shall" paragraphs in ~50-para batches, one review
                                        sheet each. Review-heavy for Pranjal, so batches interleave with
                                        B–D rather than block them. Starts on his yes.
  F  hardening                          real officer names, holiday calendar, evidence-vault pages from
                                        the real register, inspector view on real data.

WATCHTOWER SOURCES (verified 2026-09-10: plain GET, browser UA, no cookies, HTTP 200)
  keep  sebi.gov.in/sebirss.xml — 30 newest items of every kind
  add   circulars, all departments      HomeAction.do?doListing=yes&sid=1&ssid=7&smid=0   (25/page)
        circulars, AIF & FPI dept       …&deptId=75                                        (AIF)
        master circulars                …&ssid=6                                           (new MC versions)
        regulations                     …&ssid=3                       (AIF Regs / PM Regs "last amended")
  PMS   no department or intermediary filter exists for PMS; the all-departments page + the existing
        title terms ("portfolio manager") catch them. Hourly × 25/page is far above SEBI's daily volume.
  note  the ajax paginator answered HTTP 530 from a laptop; page 1 of each source is enough for the cron.
        Parse = anchor href + text + date cell, hand-rolled like the RSS parser. Same seen/catches keys.

SOURCES TO ADD (URLs located; PDFs fetched only on Pranjal's yes)
  AIF Regulations 2012, last amended 14 Jul 2026
    https://www.sebi.gov.in/legal/regulations/jul-2026/securities-and-exchange-board-of-india-alternative-investment-funds-regulations-2012-last-amended-on-july-14-2026-_102975.html
    PDF https://www.sebi.gov.in/sebi_data/attachdocs/jul-2026/1785301664601.pdf
  PM Regulations 2020, last amended 3 Sep 2025 (section 1, later)
    https://www.sebi.gov.in/legal/regulations/sep-2025/securities-and-exchange-board-of-india-portfolio-managers-regulations-2020-last-amended-on-september-03-2025-_96560.html
  PMS related-party circular 2022 — in given/sources, not yet collected.

DATA CHANGES — the whole list
  entity.ts          facts aif-stage, aif-categories-held (declared, with source slots)
  schema.ts          Obligation.aifCategories?: ("i"|"ii"|"iii"|"all")[]
  applicability.ts   Cat III sentence → tag, not reject
  nav.ts             groups PMS · AIF Registration · AIF Rules · Watchtower · Engine · Inspection
  watch.ts           four listing sources beside the RSS

OPEN ON PRANJAL'S SIDE
  1  browser test of attach-evidence on /register, then `npm run pull` + commit register.json
  2  yes/no on the remaining ~445 "shall" paragraphs (E)
  3  AIF Regulations PDF into given/, or a yes to fetch it from sebi.gov.in (C)
  4  real Compliance Officer / Principal Officer names (F)
  5  Category III: held or intended, or reference only? (D)
  6  current AIF stage — profile says "not yet applied"; confirm or give stage + date (A)
```
