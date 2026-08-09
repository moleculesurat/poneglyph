import type { Circular, Amendment } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Simulated regulatory corpus. Clause text is a realistic PARAPHRASE of
   public SEBI material, written for this sandbox — not verbatim circular
   text. Structure (chapters → paras) mirrors the real Master Circular
   for Stock Brokers (Jun 17, 2025) and the Jul 3, 2026 amendment to
   Para 46 (handling of clients' unpaid securities / CUSPA).
   ══════════════════════════════════════════════════════════════════════ */

export const masterCircular: Circular = {
  id: "MC-SB-2025",
  number: "SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2025/91",
  title: "Master Circular for Stock Brokers",
  issuedOn: "2025-06-17",
  kind: "master-circular",
  source: "https://www.sebi.gov.in/legal/master-circulars",
  supersedes: "MC-SB-2024",
  chapters: [
    {
      key: "registration",
      title: "Registration & Governance",
      paras: [
        {
          para: "4.1",
          text: "Every stock broker shall maintain the prescribed net worth at all times and shall submit a net worth certificate, certified by a chartered accountant, to the stock exchange on a half-yearly basis within the timelines specified by the exchange.",
        },
        {
          para: "5.2",
          text: "Every stock broker shall appoint a qualified compliance officer who shall be responsible for monitoring compliance with the Act, rules, regulations, circulars and directions issued by the Board or the stock exchanges, for redressal of investor grievances, and for reporting any material non-compliance to the stock exchange without delay.",
        },
        {
          para: "5.6",
          text: "Every stock broker shall at all times have at least one designated director who is resident in India, having stayed in India for a total period of not less than one hundred and eighty-two days during the financial year.",
        },
      ],
    },
    {
      key: "client-dealings",
      title: "Dealings with Clients — Funds & Securities",
      paras: [
        {
          para: "22.1",
          text: "Client funds shall be segregated from the stock broker's own funds at all times. The stock broker shall not use the funds or securities of one client for another client, nor for its own account, and shall report the segregation of client funds to the stock exchange on a daily basis.",
        },
        {
          para: "23.4",
          text: "All client funds shall be upstreamed by the stock broker to the clearing corporations on an end-of-day basis in the form and manner prescribed, and no client funds shall be retained by the stock broker overnight except to the extent permitted.",
        },
        {
          para: "26.2",
          text: "The actual settlement of funds of the running account shall be done by the stock broker at least once within a gap of thirty or ninety days between two settlements, as per the preference of the client, and a statement of accounts shall be sent to the client on the date of settlement.",
        },
        {
          para: "28.1",
          text: "Stock brokers shall not obtain a power of attorney for the operation of client demat accounts and shall use only the Demat Debit and Pledge Instruction (DDPI) for the limited purposes specified, executed with the explicit consent of the client.",
        },
        {
          para: "30.3",
          text: "No stock broker shall onboard a client without completing the Know Your Client process through a KYC Registration Agency, carrying out risk profiling of the client, and executing the prescribed account-opening documentation.",
        },
        {
          para: "31.5",
          text: "Every stock broker shall provide the facility of nomination to its clients in the prescribed format, or obtain a declaration of opt-out, for every trading and demat account, and shall maintain records of the same.",
        },
      ],
    },
    {
      key: "unpaid-securities",
      title: "Handling of Clients' Securities — Unpaid Securities",
      paras: [
        {
          para: "46.1",
          text: "Securities that have been received in pay-out against which clients have not made full payment shall be transferred by the trading member to a separate demat account titled 'client unpaid securities account' (CUSA).",
        },
        {
          para: "46.2",
          text: "Unpaid securities lying in the client unpaid securities account shall either be transferred to the demat account of the respective client upon fulfilment of the client's funds obligation, or shall be disposed of in the market by the trading member within five trading days after the pay-out.",
        },
        {
          para: "46.3",
          text: "Securities kept in the client unpaid securities account shall not be used for any purpose other than as set out above, and under no circumstances shall such securities be pledged or transferred to any third party, including towards the trading member's own obligations.",
        },
      ],
    },
    {
      key: "margin",
      title: "Margin Obligations & Risk Management",
      paras: [
        {
          para: "52.1",
          text: "Stock brokers shall collect upfront margins from clients in the manner prescribed and shall report instances of short-collection or non-collection of margins to the stock exchange, which shall levy the applicable penalty structure.",
        },
        {
          para: "54.2",
          text: "Every stock broker shall issue to each client a daily margin statement, in the prescribed format, disclosing the collateral deposited, collateral utilised and margin status, by such time as specified by the stock exchange.",
        },
        {
          para: "55.1",
          text: "Margin requirements shall be computed on the basis of intra-day peak positions of the client, and stock brokers shall ensure that the prescribed peak margin obligations are complied with at all times.",
        },
      ],
    },
    {
      key: "supervision",
      title: "Supervision, Internal Audit & Authorised Persons",
      paras: [
        {
          para: "61.1",
          text: "Every stock broker shall carry out a complete internal audit on a half-yearly basis by an independent qualified chartered accountant or company secretary, and the report thereof shall be placed before the board of the stock broker and submitted to the stock exchange.",
        },
        {
          para: "63.2",
          text: "Stock brokers shall carry out an inspection of such number of branches and authorised persons every year as prescribed, to ensure that the branches and authorised persons comply with the applicable requirements, and shall maintain records of the inspections carried out.",
        },
      ],
    },
    {
      key: "grievance",
      title: "Investor Grievance Redressal",
      paras: [
        {
          para: "71.1",
          text: "Every stock broker shall resolve complaints received through the SEBI Complaints Redress System (SCORES) within twenty-one calendar days of receipt, and shall submit an action taken report through SCORES within the said period.",
        },
        {
          para: "72.3",
          text: "Every stock broker shall prominently display the Investor Charter and the data on complaints received and their disposal on its website, and shall bring the Investor Charter to the notice of its clients.",
        },
        {
          para: "73.1",
          text: "Every stock broker shall enrol on the Online Dispute Resolution (ODR) portal and shall facilitate resolution of disputes with its clients through the ODR mechanism in the manner prescribed.",
        },
      ],
    },
    {
      key: "books-records",
      title: "Maintenance of Books of Account & Records",
      paras: [
        {
          para: "81.1",
          text: "Every stock broker shall maintain the books of account, records and documents prescribed under the rules and regulations for a minimum period of five years, and where copies are maintained in electronic form, they shall be authenticated in the manner prescribed.",
        },
        {
          para: "83.2",
          text: "Every stock broker shall issue a contract note to each client for trades executed, in the prescribed format, within twenty-four hours of the execution of the trade; electronic contract notes may be issued subject to the conditions specified.",
        },
      ],
    },
    {
      key: "advertisement",
      title: "Advertisement Code",
      paras: [
        {
          para: "91.1",
          text: "Every advertisement issued by a stock broker shall be in conformity with the advertisement code prescribed and shall be issued only after obtaining prior approval of the stock exchange. No advertisement shall contain any promise or guarantee of assured or risk-free return to investors.",
        },
      ],
    },
    {
      key: "technology",
      title: "Trading Technology — Contract Notes, Access & Algorithmic Trading",
      paras: [
        {
          para: "50.2",
          text: "Every stock broker issuing contract notes in electronic form shall digitally sign each such contract note, deliver it to the electronic mail address recorded for the client, and preserve the notes together with the proof of delivery for the period prescribed; the digital signature certificate used for such signing shall be valid at all times.",
        },
        {
          para: "57.3",
          text: "Orders originating through direct market access or routed by a smart order router shall pass through the risk management system of the stock broker before release to the exchange, and no such order shall bypass the price, quantity and exposure checks prescribed for that facility.",
        },
        {
          para: "62.1",
          text: "No algorithm shall be deployed by a stock broker unless it has been approved by the stock exchange and tagged with the unique identifier allotted to that strategy, and the stock broker shall maintain an inventory of the approved algorithms together with the approvals obtained.",
        },
      ],
    },
    {
      key: "cyber",
      title: "Cyber Security & System Audit (CSCRF)",
      paras: [
        {
          para: "101.1",
          text: "Regulated entities shall conduct a comprehensive vulnerability assessment and penetration testing (VAPT) of their critical systems at the prescribed periodicity, and shall close the findings thereof and carry out a re-validation of the closure within the timelines specified in the Cybersecurity and Cyber Resilience Framework.",
        },
        {
          para: "102.4",
          text: "All cyber incidents and cyber attacks shall be reported to the stock exchange and to SEBI within six hours of noticing or detecting such incidents, followed by submission of the incident analysis report within the period specified.",
        },
        {
          para: "103.2",
          text: "Regulated entities shall maintain logs of all critical systems for a rolling period of not less than one hundred and eighty days, and shall implement multi-factor authentication for all users accessing critical systems, in the manner set out in the framework.",
        },
      ],
    },
    {
      key: "change-control",
      title: "Change in Status, Constitution, Control & Affiliation",
      paras: [
        {
          para: "66.1",
          text: "No change in control of a stock broker shall be given effect to except with the prior approval of the Board, and the application for such approval shall be made in the manner set out before the proposed change is acted upon.",
        },
        {
          para: "67.2",
          text: "Every stock broker shall report to the stock exchange any change in its shareholding, directors or constitution within fifteen days of the end of the quarter in which the change occurs, in the format specified by the exchange.",
        },
      ],
    },
    {
      key: "fatca",
      title: "Foreign Accounts Tax Compliance Act Related Provisions",
      paras: [
        {
          para: "69.1",
          text: "Every registered intermediary shall register with the United States Internal Revenue Service under the Inter-Governmental Agreement between India and the United States of America and under the Multilateral Competent Authority Agreement, and shall carry out the client due diligence and reporting prescribed thereunder in the manner set out by the Central Board of Direct Taxes.",
        },
        {
          para: "70.2",
          text: "Every registered intermediary shall identify reportable accounts among its client accounts on the basis of the indicia prescribed, obtain self-certification from the client where required, and report the particulars of such accounts for each reporting year within the timelines specified.",
        },
      ],
    },
    {
      key: "outsourcing",
      title: "Outsourcing & Conflicts of Interest",
      paras: [
        {
          para: "82.1",
          text: "Every intermediary shall put in place a policy on outsourcing approved by its board and shall maintain a register of the activities outsourced and of the service providers engaged, which shall be placed before the board for review at least once in a financial year.",
        },
        {
          para: "82.3",
          text: "Core business activities and compliance functions of an intermediary shall not be outsourced, and the intermediary shall at all times remain accountable to the Board and to its clients for the activities outsourced, notwithstanding any arrangement with the service provider.",
        },
        {
          para: "84.1",
          text: "Every intermediary shall lay down policies and internal procedures to identify and avoid, or to deal with, conflicts of interest arising in the conduct of its business and in the conduct of its associated persons, and shall disclose to the client any conflict of interest that cannot be avoided.",
        },
      ],
    },
    {
      key: "reporting",
      title: "Reporting Requirements",
      paras: [
        {
          para: "93.1",
          text: "Every stock broker shall submit to the stock exchanges the consolidated periodic report in the format specified at Annexure-28, covering the particulars set out therein, within fifteen days of the end of each quarter.",
        },
        {
          para: "93.4",
          text: "The annual system audit report, together with the management comments on the observations made therein, shall be submitted to the stock exchange within the timelines specified by the exchange and in any case not later than the thirtieth day of September following the close of the financial year.",
        },
        {
          para: "93.6",
          text: "Every report submitted under this Part shall be complete and accurate in all material particulars and shall be certified by the compliance officer, and any revision to a report already submitted shall be filed along with the reasons for the revision.",
        },
      ],
    },
  ],
};

/* The amending circular of Jul 3, 2026 — pledge-based CUSPA regime */

export const cuspaCircular: Circular = {
  id: "CIRC-CUSPA-2026",
  number: "HO/38/11/(9)2026-MIRSD-POD/I/15382/2026",
  title:
    "Handling of Clients' Unpaid Securities by Trading Members — Amendment to Master Circular for Stock Brokers",
  issuedOn: "2026-07-03",
  kind: "amendment",
  source: "https://www.sebi.gov.in/legal/circulars",
  chapters: [
    {
      key: "unpaid-securities",
      title: "Handling of Clients' Unpaid Securities (as amended)",
      paras: [
        {
          para: "46.1",
          text: "Every trading member shall open a separate demat account designated as the 'Client Unpaid Securities Pledgee Account' (CUSPA), tagged as such with the depository, exclusively for taking a pledge of unpaid securities of clients.",
        },
        {
          para: "46.2",
          text: "Securities received in pay-out against which the client has not made full payment shall be transferred to the respective client's demat account, followed by creation of an auto-pledge in favour of the trading member's CUSPA, without requiring any separate instruction or authorisation from the client.",
        },
        {
          para: "46.3",
          text: "Upon creation of the pledge referred to above, the trading member shall intimate the client through email and SMS, specifying the securities pledged, the amount outstanding, and the date by which the pledge shall be invoked or released.",
        },
        {
          para: "46.4",
          text: "The trading member shall frame a policy on handling of clients' unpaid securities, approved by its board, which shall in no case permit a payment window exceeding five trading days from the date of pay-out.",
        },
        {
          para: "46.5",
          text: "Where the client fails to meet the funds obligation within five trading days from the pay-out, the trading member may invoke the pledge to the extent of the unpaid amount; where the pledge is not invoked, it shall be auto-released on the sixth trading day and the securities shall be free in the client's demat account.",
        },
        {
          para: "46.6",
          text: "In exceptional circumstances, the trading member may request an extension of the invocation timeline from the stock exchange, in the manner specified, by six p.m. on the fifth trading day, for a period not exceeding one week at a time; such request may be repeated only where the exceptional circumstances persist.",
        },
        {
          para: "46.9",
          text: "Unpaid securities of clients shall not be transferred or pledged, in any circumstance, to any bank or non-banking financial company, including towards the trading member's own borrowings or funding arrangements.",
        },
        {
          para: "46.11",
          text: "The trading member shall carry out, on each trading day, a reconciliation of the maximum value of securities eligible to be pledged to the CUSPA against the aggregate unpaid obligations of clients, and shall preserve the records of such reconciliation.",
        },
        {
          para: "46.12",
          text: "Trading members shall ensure that their client agreements, terms and conditions, and policies are updated to reflect the pledge-based mechanism for unpaid securities set out in this circular, and shall disseminate the updated terms to all existing clients.",
        },
        {
          para: "46.14",
          text: "Paragraphs 46.1 to 46.11 shall come into force three months from the date of issuance of operational guidelines by the stock exchanges, which shall be issued within thirty days of the date of this circular; paragraphs 46.12 to 46.14 shall come into force six months from the date of this circular.",
        },
      ],
    },
  ],
};

export const cuspaAmendment: Amendment = {
  id: "AMD-2026-CUSPA",
  circularId: "CIRC-CUSPA-2026",
  amends: "MC-SB-2025",
  issuedOn: "2026-07-03",
  summary:
    "Replaces the CUSA account-transfer regime for clients' unpaid securities with a pledge-based CUSPA mechanism: dedicated pledgee account, auto-pledge on pay-out, client intimation, a hard five-trading-day payment window with day-six auto-release, a structured extension process, prohibition on transfer to banks/NBFCs, and daily reconciliation — with phased effectivity.",
  changes: [
    {
      para: "46.1",
      kind: "modified",
      oldText:
        "Securities that have been received in pay-out against which clients have not made full payment shall be transferred by the trading member to a separate demat account titled 'client unpaid securities account' (CUSA).",
      newText:
        "Every trading member shall open a separate demat account designated as the 'Client Unpaid Securities Pledgee Account' (CUSPA), tagged as such with the depository, exclusively for taking a pledge of unpaid securities of clients.",
      deltaObligationIds: ["OBL-SB-101"],
    },
    {
      para: "46.2",
      kind: "modified",
      oldText:
        "Unpaid securities lying in the client unpaid securities account shall either be transferred to the demat account of the respective client upon fulfilment of the client's funds obligation, or shall be disposed of in the market by the trading member within five trading days after the pay-out.",
      newText:
        "Securities received in pay-out against which the client has not made full payment shall be transferred to the respective client's demat account, followed by creation of an auto-pledge in favour of the trading member's CUSPA, without requiring any separate instruction or authorisation from the client.",
      deltaObligationIds: ["OBL-SB-102"],
    },
    {
      para: "46.3",
      kind: "added",
      newText:
        "Upon creation of the pledge referred to above, the trading member shall intimate the client through email and SMS, specifying the securities pledged, the amount outstanding, and the date by which the pledge shall be invoked or released.",
      deltaObligationIds: ["OBL-SB-103"],
    },
    {
      para: "46.4",
      kind: "added",
      newText:
        "The trading member shall frame a policy on handling of clients' unpaid securities, approved by its board, which shall in no case permit a payment window exceeding five trading days from the date of pay-out.",
      deltaObligationIds: ["OBL-SB-104"],
    },
    {
      para: "46.5",
      kind: "added",
      newText:
        "Where the client fails to meet the funds obligation within five trading days from the pay-out, the trading member may invoke the pledge to the extent of the unpaid amount; where the pledge is not invoked, it shall be auto-released on the sixth trading day and the securities shall be free in the client's demat account.",
      deltaObligationIds: ["OBL-SB-105"],
    },
    {
      para: "46.6",
      kind: "added",
      newText:
        "In exceptional circumstances, the trading member may request an extension of the invocation timeline from the stock exchange, in the manner specified, by six p.m. on the fifth trading day, for a period not exceeding one week at a time; such request may be repeated only where the exceptional circumstances persist.",
      deltaObligationIds: ["OBL-SB-108"],
    },
    {
      para: "46.9",
      kind: "modified",
      oldText:
        "Securities kept in the client unpaid securities account shall not be used for any purpose other than as set out above, and under no circumstances shall such securities be pledged or transferred to any third party, including towards the trading member's own obligations.",
      newText:
        "Unpaid securities of clients shall not be transferred or pledged, in any circumstance, to any bank or non-banking financial company, including towards the trading member's own borrowings or funding arrangements.",
      deltaObligationIds: ["OBL-SB-106"],
    },
    {
      para: "46.11",
      kind: "added",
      newText:
        "The trading member shall carry out, on each trading day, a reconciliation of the maximum value of securities eligible to be pledged to the CUSPA against the aggregate unpaid obligations of clients, and shall preserve the records of such reconciliation.",
      deltaObligationIds: ["OBL-SB-107"],
    },
    {
      para: "46.12",
      kind: "added",
      newText:
        "Trading members shall ensure that their client agreements, terms and conditions, and policies are updated to reflect the pledge-based mechanism for unpaid securities set out in this circular, and shall disseminate the updated terms to all existing clients.",
      deltaObligationIds: ["OBL-SB-110"],
    },
    {
      para: "46.14",
      kind: "added",
      newText:
        "Paragraphs 46.1 to 46.11 shall come into force three months from the date of issuance of operational guidelines by the stock exchanges, which shall be issued within thirty days of the date of this circular; paragraphs 46.12 to 46.14 shall come into force six months from the date of this circular.",
      deltaObligationIds: ["OBL-SB-109"],
    },
  ],
};

export const circulars: Circular[] = [masterCircular, cuspaCircular];
