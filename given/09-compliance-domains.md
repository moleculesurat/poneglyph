# 09 — SEBI compliance domains (VERIFIED)

Ground truth for Poneglyph's obligation taxonomy. Read from the **actual circular PDFs**, not
from summaries. Anything not verified below is marked as such.

> ⚠️ Research note: a widely-mirrored PDF titled "Master Circular" is the **Debt/NCS** circular
> (`SEBI/HO/DDHS/PoD1/P/CIR/2024/54`, Dept. of Debt and Hybrid Securities) — chapters on public
> issues, green debt, commercial paper. It is **not** the broker circular. An AI summary of it
> also hallucinated a plausible-looking broker index. Both were discarded. The correct document
> is the **MIRSD** one below.

## Primary source

**Master Circular for Stock Brokers**
`SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2024/53` · May 22, 2024 · Market Intermediaries Regulation
and Supervision Department (MIRSD) · signed Aradhana Verma, General Manager.
Superseded the May 17, 2023 master circular; consolidates circulars issued on/before Mar 31, 2024.
An **Aug 9, 2024** refresh exists (`.../2024/110`) consolidating to that date.

Mirror used (SEBI's own page is JS-rendered):
`https://ncdex.com/public/uploads/circulars/Master%20Circular%20for%20Stock%20Brokers_1716829095.pdf`

## The ten Parts — verbatim from the Table of Contents

| Part | Title (verbatim) | Subjects | What it governs |
|------|------------------|----------|-----------------|
| **I** | Registration of Stock Brokers | 1–12 | Antecedent verification, corporate conversion, LLP membership, single registration for brokers & clearing members, commodity-derivatives registration, online registration, transfer of business |
| **II** | Supervision & Oversight | 13–18 | Oversight of members, annual inspection policy, enhanced supervision of brokers/DPs, **Annual System Audit**, **Early Warning Mechanism** against diversion of client securities, **QSB enhanced obligations (item 18)** |
| **III** | Dealings with Client | 19–49 | *Largest Part.* UCC, account opening, nomination, collateral, pro-account terminal, authorised persons, SMS/e-mail alerts, PoA & **DDPI**, **Margin Trading Facility**, margin collection & reporting, **pledge/re-pledge**, **collateral segregation & monitoring**, block mechanism, **handling of client securities**, **Para 46 — pay-in validation from client demat to TM pool**, **running-account settlement**, voluntary freezing |
| **IV** | Technology Related Provisions | 50–65 | **Electronic Contract Note**, internet-based trading, wireless/WAP, **Direct Market Access**, **Smart Order Routing**, **algorithmic trading**, software testing, vendor-failure safeguards, **Cyber Security & Cyber Resilience framework (item 60)**, **AI/ML reporting (item 61)**, SaaS advisory, technical glitches, cybersecurity best practices, **cloud services framework** |
| **V** | Change in Status, Constitution, Control, Affiliation | 66–68 | Periodical reporting, prior approval for change in control, NOC for subsidiaries / GIFT-IFSC ventures |
| **VI** | Foreign Accounts Tax Compliance Act Related Provisions | 69–70 | FATCA registration under the India–US IGA; Multilateral Competent Authority Agreement |
| **VII** | Investor Grievance Redressal | 71–74 | Exclusive complaints e-mail ID, **SCORES**, **ODR mechanism**, **Investor Charter** + complaint disclosure on website |
| **VIII** | Default Related Provisions | 75–76 | SOP when a trading/clearing member defaults; recovery of assets and client funds |
| **IX** | Miscellaneous | 77–92 | Advertisement, registration-number display, **books of accounts**, **outsourcing (82)**, **conflicts of interest (83)**, digital payments, commodity-derivatives framework, **IRRA platform**, **website maintenance**, regulatory sandbox, RFQ platform, **bank guarantees out of client funds**, **upstreaming of client funds (92)** |
| **X** | Reporting Requirements | 93 | Consolidated periodic reporting to exchanges and SEBI (Annexure-28 format) |

Plus **29 Annexures** — including the System Audit ToR for **Type I / II / III brokers**
(Annexure 3–5), cyber **incident reporting format** (Annexure-25), the **AI/ML reporting form**
(Annexure-26), and the **consolidated quarterly reporting form** (Annexure-28).

## The two overlay frameworks

These are not Parts — they are separate circulars that **grade** how heavily the Parts land.

### CSCRF — Cybersecurity & Cyber Resilience Framework
- Issued **Aug 20, 2024**. Supersedes all prior SEBI cyber circulars.
- Adoption: **Jan 1, 2025** for entities already covered by a cyber circular; **Apr 1, 2025** for the rest.
- Referenced from Part IV item 60.
- Obligations are **graded by entity size** — a small broker and a large one owe different depth.
- Covers: governance & board involvement, critical-system identification, data classification,
  **SOC**, continuous monitoring, **VAPT**, system audit, incident reporting via SEBI's portal
  (brokers report to exchanges), and explicitly **post-quantum risk** in risk assessment.

### QSB — Qualified Stock Broker
- Framework via Stock Broker Regulations amendment, Gazette **Jan 17, 2023**, effective **Jul 1, 2023**. Part II item 18.
- SEBI designates high-impact brokers and loads them with **enhanced obligations** — governance
  structure, risk management policy, robust cyber security — because their failure is systemic.
- **Designation parameters** (original five): active clients · total available client assets ·
  trading volumes excl. proprietary · end-of-day margin obligations of all clients.
  **Expanded Mar 2024**: proprietary trading volumes · compliance score · grievance redressal score.
- **Voluntary designation** is allowed (window was on/before Jul 31, 2024).
- A broker dropping off the list keeps the enhanced obligations for **3 more financial years**.

## Why this matters for Poneglyph

The pitch line this unlocks: **two firms holding the same licence owe different things.**
Applicability is a *computation* over the entity profile — segments run, scale, designation —
not a fixed checklist. That computation is what the onboarding flow demonstrates, and it is
what makes the document-request matrix firm-specific.

- **Part III** is the mass of the rulebook and where the CUSPA/Para 46 hero scenario lives.
- **Part IV + CSCRF** is where live security-scan evidence is genuinely the right connector.
- **Part II + QSB** is the "infrastructure tier" — the reason a large broker's obligations
  escalate toward exchange-grade.

## Mapping to the build

`poneglyph/lib/domains.ts` is the machine-readable version of this file — `SEBI_DOMAINS`
(Parts I–X, verbatim titles), `CHAPTER_PART` rollup, `CHAPTER_LABEL`, plus the `CSCRF` and
`QSB` constants. `lib/schema.ts` carries `SebiPart`, `CscrfGrade`, and the 15 `ChapterKey`
values that roll up into the ten Parts.

## Sources

- [Master Circular for Stock Brokers (PDF, MIRSD)](https://ncdex.com/public/uploads/circulars/Master%20Circular%20for%20Stock%20Brokers_1716829095.pdf) — primary, ToC read directly
- [SEBI — Master Circular for Stock Brokers (Aug 2024)](https://www.sebi.gov.in/legal/master-circulars/aug-2024/master-circular-for-stock-brokers_85605.html)
- [SEBI — CSCRF for Regulated Entities](https://www.sebi.gov.in/legal/circulars/aug-2024/cybersecurity-and-cyber-resilience-framework-cscrf-for-sebi-regulated-entities-res-_85964.html)
- [SEBI — Enhanced obligations on QSBs](https://www.sebi.gov.in/legal/circulars/feb-2023/enhanced-obligations-and-responsibilities-on-qualified-stock-brokers-qsbs-_67848.html)
- [SEBI expands QSB framework (Mar 2024)](https://taxguru.in/sebi/measures-instill-trust-securities-market-expanding-framework-qualified-stock-brokers-qsbs-stock-brokers.html)
