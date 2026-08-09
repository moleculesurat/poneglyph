import type { BusinessSegment, OnboardingSession } from "@/lib/schema";

/* ══════════════════════════════════════════════════════════════════════
   Onboarding — how Angel One Limited enters the register.

   WHAT IS REAL, AND SOURCED. Every entity fact this session resolves is a
   real, publicly checkable figure, and each one carries its source:
     · identity + listing — Angel One Limited, ISIN INE732I01021,
       NSE: ANGELONE, BSE: 543235
     · net worth Rs 6,201.98 crore (FY2025-26 standalone, XBRL filing),
       against Rs 5,597.87 crore the prior year
     · revenue Rs 5,054.07 crore (FY2025-26 standalone, XBRL filing)
     · net profit Rs 1,215.95 crore (FY2024-25 standalone, XBRL filing)
     · client base 38.59 million, June 2026 business update, +18.8% YoY;
       FY26 close 37.39 million, +20.5% on 31.02 million in FY25
     · NSE market share 14.79%, against an NSE active base of 4.57 crore
       (Mar 2026) — from which ~6.76 million active clients is DERIVED
     · registration INZ000161534 is publicly displayed and is held here as
       DECLARED, not verified, until its certificate arrives (DOC-REQ-001)

   WHAT IS SIMULATED. The onboarding narrative itself — the traces, the
   answers, the document register, the sign-offs. It is an illustrative
   onboarding of a public entity using public filings. Nothing here is an
   assertion about Angel One's actual compliance posture, and no finding,
   penalty, inspection or violation is depicted, because none is known.
   Answers on the questions below are the SANDBOX compliance team's
   declarations inside the demo, not statements of fact about how Angel
   One operates. Priya Nair, Dev Khanna, Rohan Iyer and Gayatri Jaiswal
   are the sandbox's compliance team; they are not Angel One employees.

   WHY THIS FILE EXISTS. The engine cannot know a firm's obligations until
   it knows the firm. Two brokers holding the identical licence owe
   different things — this session is the record of the engine working out
   which things, and of the human confirming it. The negatives are filed
   with the same care as the asks: a Part ruled out carries its reason, a
   document not requested carries its waiver.

   Timeline. The corpus axis (what the law says) and the entity axis (who
   this firm is) are maintained separately: RUN-041 ingested the Master
   Circular in Jun 2025, RUN-047 re-mapped Para 46 on 2026-07-03, and
   RUN-049 closed the corpus pass over the chapters the base extraction
   had not reached — trading technology, change in control, FATCA,
   outsourcing and reporting — before this session opened. This session is
   the entity axis, run 2026-07-09 → 2026-07-10, two days before
   sim-today, using the latest filings available on that date.

   THE ONE CHAPTER STILL AT ZERO. Fourteen of the fifteen register
   chapters now carry extracted obligations. The fifteenth — default,
   which rolls up to Part VIII — carries none, and that is a
   determination, not a backlog. The default provisions bind only upon a
   default event; this profile declares none, so the chapter is held under
   a standing trigger watch and is deliberately left un-extracted. RUN-049
   skipped it on that ground rather than for want of time. Part VIII reads
   zero because the engine decided it should.
   ══════════════════════════════════════════════════════════════════════ */

/* ── Business segment labels — the thirteen lines a broker can run ──── */

export const SEGMENT_LABEL: Record<BusinessSegment, string> = {
  "equity-cash": "Equity — Cash",
  "equity-derivatives": "Equity — Derivatives",
  "currency-derivatives": "Currency Derivatives",
  "commodity-derivatives": "Commodity Derivatives",
  "debt-segment": "Debt Segment",
  "depository-participant": "Depository Participant",
  "research-analyst": "Research Analyst",
  "investment-adviser": "Investment Adviser",
  "portfolio-manager": "Portfolio Manager",
  "mutual-fund-distribution": "Mutual Fund Distribution",
  "margin-trading-facility": "Margin Trading Facility",
  "algo-trading": "Algorithmic Trading",
  "internet-trading": "Internet & Wireless Trading",
};

/* ══════════════════════════════════════════════════════════════════════
   The opinionated session — already run, signed, and activated.
   ══════════════════════════════════════════════════════════════════════ */

export const angelOneOnboarding: OnboardingSession = {
  id: "ONB-001",
  entityId: "ENT-001",
  startedAt: "2026-07-09T09:41:00+05:30",
  completedAt: "2026-07-10T17:05:00+05:30",
  mode: "opinionated",

  steps: [
    /* ── 1 · identify ────────────────────────────────────────────────── */
    {
      key: "identify",
      title: "Identify the entity",
      blurb:
        "Resolve a name to a legal person, then to its public filings. Nothing is taken on trust: each fact is stamped with where it came from and whether it is externally checkable.",
      status: "done",
      outcome:
        "Angel One Limited resolved to ISIN INE732I01021 — 9 facts verified against filings, 1 held declared pending its certificate.",
      trace: [
        {
          agent: "watcher",
          at: "2026-07-09T09:41:00+05:30",
          thought:
            "A firm name is not an identity. Before any obligation can attach, the name has to resolve to a single registered legal person with a public market identity that a regulator could independently look up.",
          action: 'resolve_entity(name="Angel One Limited", jurisdiction="IN")',
          observation:
            "Single match — Angel One Limited, listed. ISIN INE732I01021; NSE symbol ANGELONE; BSE scrip 543235. Listed status means constitutional and shareholding facts are public, so Part V documents can be sourced rather than requested blind.",
        },
        {
          agent: "extraction",
          at: "2026-07-09T09:43:12+05:30",
          thought:
            "Net worth drives Part I certification, and size drives both the QSB computation and the CSCRF grade. Take it from the standalone XBRL filing, not from a summary page — the filing is the artifact an inspector can pull.",
          action: 'fetch_filings(isin="INE732I01021", basis="standalone", periods=2)',
          observation:
            "FY2025-26 standalone: net worth (total equity) Rs 6,201.98 crore, revenue Rs 5,054.07 crore. FY2024-25 standalone: net worth Rs 5,597.87 crore, net profit Rs 1,215.95 crore. Net worth up 10.8% year on year — the growth is in the filings, not inferred.",
        },
        {
          agent: "extraction",
          at: "2026-07-09T09:45:38+05:30",
          thought:
            "Client scale is a QSB parameter, and the reported total client base is not the same number as the active-client count the framework asks for. Read both, and keep the derivation visible.",
          action: 'fetch_business_update(entity="Angel One Limited", period="Jun-2026")',
          observation:
            "Client base 38.59 million (3.86 crore) as of the June 2026 business update, +18.8% YoY; FY26 close 37.39 million, +20.5% on 31.02 million in FY25. NSE market share 14.79%, down from 15.4%. Against NSE's 4.57 crore active base (Mar 2026) this DERIVES ~6.76 million active clients — flagged as derived, not reported.",
        },
        {
          agent: "verifier",
          at: "2026-07-09T09:48:02+05:30",
          thought:
            "The registration number INZ000161534 is publicly displayed because SEBI requires brokers to display it. Displayed is not the same as evidenced. If the engine marks it verified now, every obligation hanging off it inherits a confidence it has not earned.",
          action: "classify_provenance(facts) — filing | exchange | document | declared | derived",
          observation:
            "9 facts marked verified against filings and exchange data; 1 fact — SEBI registration INZ000161534 — held as DECLARED with a standing ask (DOC-REQ-001) that converts it to verified on upload. No registration number was generated by the engine.",
        },
      ],
    },

    /* ── 2 · segments ────────────────────────────────────────────────── */
    {
      key: "segments",
      title: "Map the business lines",
      blurb:
        "A licence says what the firm may do; the segments say what it actually does. The engine infers what public disclosure supports and refuses to guess the rest — the unknowns become questions.",
      status: "done",
      outcome:
        "6 segments inferred from public sources, 5 more confirmed by the firm, 2 registrations ruled out — 13 questions drafted, 9 of them pre-filled.",
      trace: [
        {
          agent: "extraction",
          at: "2026-07-09T11:02:14+05:30",
          thought:
            "Exchange membership and public product disclosure carry the trading segments. They do not carry how the firm runs internally — that boundary is where inference has to stop.",
          action: "infer_segments(exchange_memberships, product_disclosures, filings)",
          observation:
            "Inferred with support: equity-cash, equity-derivatives, currency-derivatives, commodity-derivatives, debt-segment, internet-trading. All six marked DECLARED pending confirmation — inference is a starting position, not a finding.",
        },
        {
          agent: "applicability",
          at: "2026-07-09T11:06:47+05:30",
          thought:
            "Four things materially change the obligation set and none of them can be read from a filing: whether client funding is offered under MTF, whether algorithmic order flow is run, whether AI or ML sits in any client-facing or order-handling workflow, and whether portfolio-manager or investment-adviser registrations are held. Each of these is a fork, not a detail.",
          action: "list_unknowns(segments) — rank by obligation delta",
          observation:
            "4 high-impact unknowns identified. Each one, answered either way, moves at least one document requirement and one Part boundary. None will be assumed.",
        },
        {
          agent: "extraction",
          at: "2026-07-09T11:11:30+05:30",
          thought:
            "A question the firm has to type an answer to, that the engine could have looked up, is a question that wastes the compliance officer's afternoon. Pre-fill everything public; ask the human to confirm rather than to transcribe.",
          action: "draft_questions(unknowns, prefill_from=public_sources)",
          observation:
            "13 questions drafted across the six steps; 9 arrive pre-filled with their source attached. The remaining 4 are genuine unknowns and are left blank on purpose.",
        },
        {
          agent: "human-gate",
          at: "2026-07-09T15:24:09+05:30",
          action:
            "Questionnaire returned by the onboarding analyst (Gayatri Jaiswal) and counter-signed by the compliance officer (Priya Nair).",
          observation:
            "Six inferred segments confirmed. Five added by declaration: margin-trading-facility, depository-participant, mutual-fund-distribution, research-analyst, algo-trading. Two ruled out by declaration: portfolio-manager, investment-adviser — recorded as an explicit negative, which is what drives the waivers at the documents step.",
        },
      ],
    },

    /* ── 3 · designation ─────────────────────────────────────────────── */
    {
      key: "designation",
      title: "Compute the designations",
      blurb:
        "QSB and CSCRF are not self-selected. The engine scores the entity against the published parameters, states what it could and could not compute, and marks the result as a prediction until the exchange's own list confirms it.",
      status: "done",
      outcome:
        "QSB computed positive on 3 of 7 publicly-scorable parameters; CSCRF grade derived as Qualified RE. Both flagged unconfirmed pending DOC-REQ-004.",
      trace: [
        {
          agent: "applicability",
          at: "2026-07-09T16:02:51+05:30",
          thought:
            "The QSB framework designates on seven parameters: active clients, total available client assets, trading volumes excluding proprietary, end-of-day client margin obligations, and — added in 2024 — proprietary volumes, compliance score and grievance redressal score. Three of those are computable from public data. Four are not, and saying otherwise would be a fabrication.",
          action: "score_qsb_parameters(profile, framework=SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2023/26)",
          observation:
            "Computable: active clients ~6.76 million (derived from 14.79% of NSE's 4.57 crore active base, Mar 2026); trading volume proxy via the same market-share figure; grievance and compliance scores partially observable from public complaint disclosures. Not computable without firm data: total client assets, EOD client margin obligations, proprietary volumes. Scored: 3 of 7 positive, 4 pending firm input.",
        },
        {
          agent: "extraction",
          at: "2026-07-09T16:07:19+05:30",
          thought:
            "One parameter alone can carry the designation if it is extreme enough. An active-client base of this size against a 4.57 crore market-wide active base is not a marginal call.",
          action: "rank_against_peer_set(parameter='active clients', universe='NSE trading members')",
          observation:
            "Top-decile placement on the active-client parameter on its own. QSB designation computed as PROBABLE with high confidence; enhanced obligations under Part II item 18 staged into the scope as provisional.",
        },
        {
          agent: "applicability",
          at: "2026-07-09T16:12:04+05:30",
          thought:
            "CSCRF grades regulated entities by size, and the grade sets how deep the cyber obligations go. A broker at this client count and turnover band, carrying a probable QSB designation, lands in the Qualified RE category rather than mid-size — which pulls in SOC arrangements and the fuller VAPT cadence.",
          action:
            "derive_cscrf_grade(profile, framework=SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113)",
          observation:
            "Grade derived: qualified. Basis recorded as active-client count plus turnover band plus QSB path. Adoption timeline noted (Jan 1 2025 for entities already under a cyber circular; Apr 1 2025 otherwise). Unlocks the CSCRF document trio — policy, VAPT, SOC.",
        },
        {
          agent: "verifier",
          at: "2026-07-09T16:18:33+05:30",
          thought:
            "This is the step where a compliance tool most easily lies. SEBI makes the QSB designation and the exchanges publish the list. What the engine has done is arithmetic on public inputs — that is a prediction of the designation, not the designation.",
          action: "assert(designation.source == 'computed') — block promotion to 'confirmed'",
          observation:
            "Flag raised: designation.unconfirmed. The profile will carry qsb=true with the basis strings attached and the caveat visible everywhere it is rendered. Only the exchange's QSB intimation converts it.",
        },
        {
          agent: "human-gate",
          at: "2026-07-09T16:21:47+05:30",
          action:
            "Raised DOC-REQ-004 (QSB designation intimation from the exchange) as the single artifact that resolves the flag; escalated to the compliance officer rather than filed silently.",
          observation:
            "Acknowledged by Priya Nair. Enhanced QSB obligations tracked as active-provisional in the interim — the firm is not permitted to sit in the gap between computed and confirmed.",
        },
      ],
    },

    /* ── 4 · scope ───────────────────────────────────────────────────── */
    {
      key: "scope",
      title: "Bind the applicable Parts",
      blurb:
        "Walk all ten Parts of the Master Circular against the confirmed profile. What binds, binds with a reason. What does not bind is recorded with its reason too, because an unexplained exclusion is where inspections start.",
      status: "done",
      outcome:
        "9 of 10 Parts bind and all 9 carry extracted obligations — 43 joined to the profile. Part VIII excluded as event-driven, held under a standing trigger watch and deliberately left un-extracted.",
      trace: [
        {
          agent: "applicability",
          at: "2026-07-10T09:14:22+05:30",
          thought:
            "Scope is not a checkbox on the licence. Each Part binds because a specific fact in the profile triggers it, and the trigger has to be nameable or the binding is not defensible.",
          action: "bind_parts(profile, circular=MC-SB-2025)",
          observation:
            "Bound with named triggers — I: stock-broker registration. II: registration plus probable QSB designation. III: retail client dealing at scale, MTF, client securities. IV: internet trading, algo order flow, CSCRF qualified grade, AI/ML use. V: listed body corporate, shareholding pattern public. VI: financial-institution status under the IGA/MCAA. VII: retail investor base, SCORES and ODR. IX: advertisement, books, outsourcing, upstreaming. X: consolidated periodic reporting.",
        },
        {
          agent: "diff",
          at: "2026-07-10T09:19:40+05:30",
          thought:
            "Part VIII covers the default-related SOP. Nothing in this profile triggers it: there is no declared default, and the engine must not manufacture one to make a scope table look complete. But excluding it outright would leave the firm blind if the trigger ever fires.",
          action: "exclude_part('VIII', mode='dormant-with-trigger-watch')",
          observation:
            "Part VIII excluded with reason recorded verbatim on the profile, plus a standing watch: any default-event signal from the exchange feed re-binds it and re-runs the scope step. The exclusion also instructs the corpus axis — the default chapter is not extracted while the Part is dormant, because standing obligations written against a default that has not happened would sit on the register as duties this firm does not owe. Part VIII therefore holds zero obligations by determination. Exclusion is a state, not a deletion, and a zero with a reason on it is not a gap.",
        },
        {
          agent: "diff",
          at: "2026-07-10T09:23:05+05:30",
          thought:
            "The declared negatives from the segments step also carve scope, but they carve it outside this circular. No portfolio-manager and no investment-adviser registration means those obligation families are never instantiated at all — and that decision needs to be as visible as any inclusion.",
          action: "record_negatives(no_pms=true, no_ia=true)",
          observation:
            "Two obligation families left un-instantiated with reasons filed against the profile. These carry forward to the documents step as waivers rather than as absences.",
        },
        {
          agent: "verifier",
          at: "2026-07-10T09:31:18+05:30",
          thought:
            "The entity axis now has to join the corpus axis. The register holds 43 extracted obligations across three passes — RUN-041's base extraction, RUN-047's Para 46 re-map, RUN-049's corpus completion. The question is how much of the bound scope those 43 cover, and the honest answer has to name every Part that reads zero and say why it does.",
          action: "join(scope.parts, register.obligations) — report coverage and shortfall",
          observation:
            "43 obligations joined to the profile: Part I 3, Part II 2, Part III 19 (10 of them the Jul 3 CUSPA re-map), Part IV 6, Part V 2, Part VI 1, Part VII 3, Part IX 5, Part X 2. Every one of the nine bound Parts carries extracted content — 14 of the 15 register chapters. The fifteenth is default, at zero because Part VIII is excluded, and it is the only zero on the table. No shortfall to report: the coverage gap RUN-049 was raised to close is closed.",
        },
      ],
    },

    /* ── 5 · documents ───────────────────────────────────────────────── */
    {
      key: "documents",
      title: "Derive the document asks",
      blurb:
        "Not a checklist. Every requirement is generated from the bound scope and carries the profile fact that produced it, so the firm can always answer the only question that matters: why are you asking me this.",
      status: "done",
      outcome:
        "26 requirements derived, each with its trigger; 2 resolve straight to waived on profile grounds. A same-licence peer without QSB, MTF or algo would see 22.",
      trace: [
        {
          agent: "extraction",
          at: "2026-07-10T11:40:07+05:30",
          thought:
            "A fixed document checklist is how compliance software ends up asking a discount broker for a portfolio-manager agreement. Generate the asks from the scope instead, and make each one carry its trigger as a first-class field.",
          action: "derive_document_requirements(scope, profile) — emit triggeredBy on every requirement",
          observation:
            "26 requirements emitted, DOC-REQ-001 through DOC-REQ-026, across Parts I, II, III, IV, V, VI, VII, IX and X. Every one names the fact that produced it — 'exchanges NSE + BSE', 'MTF segment detected', 'CSCRF grade', 'listed entity', 'computed QSB parameters', 'Jul 3 2026 Para 46 amendment'.",
        },
        {
          agent: "applicability",
          at: "2026-07-10T11:46:52+05:30",
          thought:
            "The profile's negatives have to produce something visible. If the engine simply never generates a portfolio-manager requirement, nobody can later tell whether it reasoned about PMS or forgot it existed. File the waiver with the reason attached.",
          action: "waive_requirements(reason_from=profile.negatives)",
          observation:
            "2 requirements waived, each carrying its reason on the record — no portfolio-manager registration found on the profile, and no investment-adviser registration found. The waiver is the audit artifact: the engine files why it did not ask.",
        },
        {
          agent: "extraction",
          at: "2026-07-10T11:52:30+05:30",
          thought:
            "The point of deriving rather than listing is that the derivation is different per firm. Worth computing the counterfactual so the difference is measurable rather than asserted.",
          action: "counterfactual(profile without qsb, mtf, algo, soc-grade)",
          observation:
            "A broker on the identical stock-broker licence, without QSB designation, without MTF and without algorithmic order flow, receives 22 of these 26. The four-document delta is the whole thesis: same licence, different obligations.",
        },
        {
          agent: "verifier",
          at: "2026-07-10T11:58:14+05:30",
          action:
            "run_checks(every-requirement-has-a-trigger, every-waiver-has-a-reason, no-orphan-clause-refs, no-fabricated-identifiers)",
          observation:
            "4/4 passed. 26/26 requirements carry a triggeredBy; 2/2 waivers carry a profile-grounded reason; no requirement cites a clause outside the bound scope; no registration or certificate number was synthesised by the engine.",
        },
      ],
    },

    /* ── 6 · activate ────────────────────────────────────────────────── */
    {
      key: "activate",
      title: "Activate the register",
      blurb:
        "The engine assembles the profile, scope, obligations and document register into one addressable object — then stops, and hands it to a named human. Nothing goes live unsigned.",
      status: "done",
      outcome:
        "Register live 2026-07-10, signed by Priya Nair. Two facts remain explicitly unconfirmed and are rendered that way everywhere.",
      trace: [
        {
          agent: "extraction",
          at: "2026-07-10T16:31:00+05:30",
          action: "build_register(profile, scope, obligations, documents)",
          observation:
            "Register assembled: 43 obligations across all 9 bound Parts, 24 evidence artifacts bound, 11 remediation tasks live, 26 document requirements of which 20 are closed (14 verified, 4 parsed and awaiting officer sign-off, 2 waived) and 6 remain open. Part VIII contributes nothing, by determination, and is rendered with its exclusion reason rather than as an empty row.",
        },
        {
          agent: "verifier",
          at: "2026-07-10T16:44:26+05:30",
          thought:
            "Before a human is asked to sign, the honesty invariants have to hold — otherwise the signature launders the engine's guesses into facts.",
          action:
            "run_checks(provenance-on-every-fact, declared-not-promoted, designation-flagged-unconfirmed, waivers-reasoned, hash-chain-append)",
          observation:
            "5/5 passed. 10 profile facts carry provenance; INZ000161534 still reads declared; QSB still reads computed-unconfirmed; both waivers reasoned; profile hash appended to the audit chain without a break.",
        },
        {
          agent: "human-gate",
          at: "2026-07-10T16:58:41+05:30",
          action:
            "Profile, scope table and document register presented for sign-off, with the two unconfirmed items surfaced at the top rather than buried in a footnote.",
          observation:
            "Signed by Priya Nair, Compliance Officer, 2026-07-10. Conditions recorded on the signature: QSB stays computed-unconfirmed until DOC-REQ-004 lands; INZ000161534 stays declared until DOC-REQ-001 lands. Six open document asks routed to Rohan Iyer and Dev Khanna with due dates.",
        },
        {
          agent: "verifier",
          at: "2026-07-10T17:05:00+05:30",
          action: "activate(entity=ENT-001) — register goes live for the tenant and for inspector view",
          observation:
            "Live. Watchtower now scores every incoming SEBI instrument against this profile, so applicability decisions are entity-specific from this point forward rather than generic.",
        },
      ],
    },
  ],

  /* ══════════════════════════════════════════════════════════════════
     The questions. Nine of thirteen arrive pre-filled from public
     sources — the opinionated part is that the engine turns up already
     knowing, and asks the human to confirm rather than to type.

     Every `answer` below is a SANDBOX declaration made by the demo's
     compliance team. It is illustrative and is not a statement of fact
     about Angel One's operations or compliance.
     ══════════════════════════════════════════════════════════════════ */
  questions: [
    /* ── identify ─────────────────────────────────────────────────── */
    {
      id: "ONQ-01",
      step: "identify",
      question:
        "Is the entity being onboarded Angel One Limited, the listed parent, or a subsidiary or group company?",
      why:
        "Obligations attach to the registered legal person, not to the brand. A group that onboards the parent when the broking registration sits in a subsidiary will map a register to the wrong balance sheet, the wrong net worth certificate and the wrong shareholding pattern.",
      kind: "single",
      options: [
        {
          value: "parent",
          label: "Angel One Limited — the listed parent",
          implies: "Part V binds; shareholding pattern sourced from public filings",
        },
        {
          value: "subsidiary",
          label: "A subsidiary or group company",
          implies: "Re-run identify against the subsidiary's own CIN and registration",
        },
      ],
      prefilled: "parent",
      prefilledSource:
        "NSE/BSE listing record — ISIN INE732I01021, NSE: ANGELONE, BSE: 543235",
      answer: "parent",
      unlocks: ["Part I", "Part V", "DOC-REQ-003", "DOC-REQ-019"],
    },
    {
      id: "ONQ-02",
      step: "identify",
      question: "Confirm the SEBI stock broker registration number under which this entity trades.",
      why:
        "This number is the key every obligation in Part I and Part II hangs from. It is publicly displayed because SEBI requires brokers to display it — but displayed is not evidenced, so the engine holds it as DECLARED and will not promote it to verified until the registration certificate itself is supplied.",
      kind: "text",
      prefilled: "INZ000161534",
      prefilledSource:
        "Publicly displayed broker registration — held as declared, unverified until DOC-REQ-001 is supplied",
      answer: "INZ000161534",
      unlocks: ["DOC-REQ-001", "DOC-REQ-002", "Part I"],
    },
    {
      id: "ONQ-03",
      step: "identify",
      question: "Which exchange memberships does the entity hold, and in which segments?",
      why:
        "Membership is what makes Part I registration duties and Part II supervision duties concrete: annual inspection is conducted by the exchange, the system audit Terms of Reference vary by member type, and the QSB list is published exchange by exchange.",
      kind: "multi",
      options: [
        { value: "NSE", label: "National Stock Exchange", implies: "NSE inspection + QSB list" },
        { value: "BSE", label: "BSE Limited", implies: "BSE inspection + QSB list" },
        { value: "MCX", label: "Multi Commodity Exchange", implies: "commodity-derivatives obligations" },
        { value: "NCDEX", label: "NCDEX", implies: "agri-commodity obligations" },
        { value: "MSEI", label: "Metropolitan Stock Exchange", implies: "additional membership certificate" },
      ],
      prefilled: "NSE, BSE",
      prefilledSource: "Exchange member listings; NSE market share 14.79% (Mar 2026)",
      answer: "NSE, BSE — cash, F&O, currency and debt segments",
      unlocks: ["DOC-REQ-002", "DOC-REQ-005", "Part II"],
    },

    /* ── segments ─────────────────────────────────────────────────── */
    {
      id: "ONQ-04",
      step: "segments",
      question: "Which business segments does the entity actually run today?",
      why:
        "The licence says what the firm may do; this answer says what it does. Every segment switched on here instantiates an obligation family — and every one left off is a family the engine will not create, which is the difference between a register a compliance officer can use and a generic checklist.",
      kind: "multi",
      options: [
        { value: "equity-cash", label: SEGMENT_LABEL["equity-cash"] },
        { value: "equity-derivatives", label: SEGMENT_LABEL["equity-derivatives"] },
        { value: "currency-derivatives", label: SEGMENT_LABEL["currency-derivatives"] },
        { value: "commodity-derivatives", label: SEGMENT_LABEL["commodity-derivatives"] },
        { value: "debt-segment", label: SEGMENT_LABEL["debt-segment"] },
        { value: "internet-trading", label: SEGMENT_LABEL["internet-trading"], implies: "Part IV items 51–53" },
        { value: "mutual-fund-distribution", label: SEGMENT_LABEL["mutual-fund-distribution"] },
        { value: "research-analyst", label: SEGMENT_LABEL["research-analyst"] },
      ],
      prefilled:
        "equity-cash, equity-derivatives, currency-derivatives, commodity-derivatives, debt-segment, internet-trading",
      prefilledSource:
        "Inferred from exchange membership records and public product disclosure — held as declared pending confirmation",
      answer:
        "All six confirmed, plus mutual-fund-distribution and research-analyst",
      unlocks: ["Part III", "Part IV", "DOC-REQ-008", "DOC-REQ-013"],
    },
    {
      id: "ONQ-05",
      step: "segments",
      question:
        "Does the entity act as a Depository Participant, and if so with which depository?",
      why:
        "DP status changes the client-securities surface entirely — reconciliation of client demat holdings, the Early Warning Mechanism against diversion under Part II item 17, and the DDPI regime under Part III item 36 all read differently for a participant than for a pure trading member.",
      kind: "single",
      options: [
        { value: "yes", label: "Yes — depository participant services offered", implies: "DOC-REQ-007, DOC-REQ-013" },
        { value: "no", label: "No — client demat held with third-party participants" },
      ],
      prefilled: "yes",
      prefilledSource:
        "Inferred from public product disclosure — participant certificate not yet supplied",
      answer:
        "Yes — depository participant services in the retail stack; participant certificate to be supplied alongside DOC-REQ-002",
      unlocks: ["DOC-REQ-007", "DOC-REQ-013", "Part II item 17"],
    },
    {
      id: "ONQ-06",
      step: "segments",
      question: "Does the entity extend Margin Trading Facility to clients?",
      why:
        "MTF is the single largest fork in Part III. It brings a board-approved MTF policy, daily reporting to the exchange, a separate funded-position ledger and its own collateral rules. Onboard a broker without asking, and either the register carries obligations that do not apply or it silently misses a funded book.",
      kind: "single",
      options: [
        { value: "yes", label: "Yes — MTF offered to clients", implies: "DOC-REQ-010 + Part III margin obligations" },
        { value: "no", label: "No — cash and delivery only" },
      ],
      prefilled: "yes",
      prefilledSource:
        "Inferred from the client-funding line disclosed in quarterly results — held as declared pending the MTF policy",
      answer: "Yes — MTF offered across the retail base",
      unlocks: ["DOC-REQ-010", "DOC-REQ-011", "OBL-SB-010", "OBL-SB-011", "OBL-SB-012"],
    },
    {
      id: "ONQ-07",
      step: "segments",
      question:
        "Is algorithmic order flow run or offered — and is it built in-house, licensed from vendors, or exposed to clients through APIs?",
      why:
        "Nothing in a filing reveals this, and the three answers carry different duties: in-house strategies need exchange approval and a maintained strategy inventory, vendor strategies pull in the outsourcing register under Part IX item 82, and client-facing APIs pull in the retail-algo provisions under Part IV.",
      kind: "single",
      options: [
        { value: "none", label: "No algorithmic order flow" },
        { value: "in-house", label: "In-house strategies only", implies: "DOC-REQ-017" },
        { value: "vendor", label: "Vendor-supplied strategies", implies: "DOC-REQ-017 + DOC-REQ-023" },
        { value: "client-api", label: "Client-facing APIs and vendor strategies", implies: "DOC-REQ-017 + retail-algo watch" },
      ],
      answer:
        "client-api — client-facing APIs plus approved vendor strategies; exchange approvals and strategy inventory maintained",
      unlocks: ["DOC-REQ-017", "DOC-REQ-023", "Part IV", "CATCH-006 retail-algo consultation watch"],
    },
    {
      id: "ONQ-08",
      step: "segments",
      question:
        "Are AI or ML systems deployed in any client-facing, advisory or order-handling workflow?",
      why:
        "Part IV item 61 attaches the reporting duty to USE, not to scale — a single ML-driven risk model or client-facing assistant triggers the Annexure-26 return. Use cannot be inferred from any public source, which is exactly why it is asked rather than assumed.",
      kind: "multi",
      options: [
        { value: "none", label: "No AI/ML systems in scope" },
        { value: "risk", label: "Risk and surveillance models", implies: "Annexure-26 reporting" },
        { value: "kyc", label: "KYC / onboarding automation", implies: "Annexure-26 reporting" },
        { value: "client-facing", label: "Client-facing assistants or recommendations", implies: "Annexure-26 + advertisement review" },
        { value: "order-handling", label: "Order-handling or execution models", implies: "Annexure-26 + Part IV algo provisions" },
      ],
      answer: "risk, kyc, client-facing — order-handling models not in production",
      unlocks: ["DOC-REQ-018", "Part IV item 61"],
    },
    {
      id: "ONQ-09",
      step: "segments",
      question:
        "Does the entity hold Portfolio Manager or Investment Adviser registration, in its own name or through a group company?",
      why:
        "This is asked so the engine can record a NEGATIVE. If neither registration exists, two document families are waived — and the waiver, with its reason, is filed against the profile. An inspector can then tell the difference between an obligation the engine reasoned about and ruled out, and one it never knew existed.",
      kind: "single",
      options: [
        { value: "neither", label: "Neither registration held", implies: "waives the PMS and IA document families with reason" },
        { value: "pms", label: "Portfolio Manager registration held" },
        { value: "ia", label: "Investment Adviser registration held" },
        { value: "both", label: "Both held" },
      ],
      prefilled: "neither",
      prefilledSource:
        "No portfolio-manager or investment-adviser registration found against this entity in public registers",
      answer: "neither — confirmed by the compliance officer",
      unlocks: [
        "waives 2 document requirements — portfolio-manager and investment-adviser families, each with the reason filed",
      ],
    },

    /* ── designation ──────────────────────────────────────────────── */
    {
      id: "ONQ-10",
      step: "designation",
      question:
        "Has any exchange intimated Qualified Stock Broker designation to the entity, and for which review cycle?",
      why:
        "The engine has computed QSB as probable from public inputs — an active-client base derived at roughly 6.76 million against NSE's 4.57 crore active base. That computation is a prediction. SEBI makes the designation and the exchanges publish the list, so only the intimation converts computed into confirmed. Until it arrives the enhanced obligations are tracked as active-provisional, because sitting in the gap is not an option.",
      kind: "single",
      options: [
        { value: "yes-current", label: "Yes — designated in the current review cycle", implies: "DOC-REQ-004 satisfied on upload" },
        { value: "yes-prior", label: "Yes — designated in a prior cycle" },
        { value: "no", label: "No intimation received" },
        { value: "unknown", label: "Not known to the compliance function" },
      ],
      prefilled: "yes-current",
      prefilledSource:
        "Computed from QSB parameters — 3 of 7 scorable from public data; DERIVED, not confirmed against the exchange's published list",
      answer: "yes-current — intimation on file, to be uploaded against DOC-REQ-004",
      unlocks: ["DOC-REQ-004", "Part II item 18", "QSB enhanced obligations"],
    },
    {
      id: "ONQ-11",
      step: "designation",
      question:
        "Which CSCRF category has the entity self-assessed into, and is a Security Operations Centre arrangement in place?",
      why:
        "CSCRF grades regulated entities by size and the grade sets the depth of every cyber obligation. The engine derives Qualified RE from client count, turnover band and the QSB path — but the entity's own self-assessment is the operative position it has taken with SEBI, and a divergence between the two is itself a finding worth surfacing early.",
      kind: "single",
      options: [
        { value: "self-certification", label: "Self-certification" },
        { value: "basic", label: "Basic" },
        { value: "mid-size", label: "Mid-size" },
        { value: "qualified", label: "Qualified RE", implies: "DOC-REQ-014, DOC-REQ-015, DOC-REQ-016" },
        { value: "mii", label: "Market Infrastructure Institution" },
      ],
      prefilled: "qualified",
      prefilledSource:
        "Derived from active-client count, turnover band and the QSB path — CSCRF circular SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113",
      answer: "qualified — matches the engine's derivation; SOC arrangement in place with an external provider",
      unlocks: ["DOC-REQ-014", "DOC-REQ-015", "DOC-REQ-016", "OBL-SB-021", "OBL-SB-022", "OBL-SB-023"],
    },

    /* ── scope ────────────────────────────────────────────────────── */
    {
      id: "ONQ-12",
      step: "scope",
      question:
        "The engine bound 9 of 10 Parts and excluded Part VIII as event-driven. Do you accept that scope, or should anything move?",
      why:
        "Scope errors are silent — an unbound Part produces no gap, no task and no alert, so nothing on the dashboard will ever tell you it is missing. That is why the engine shows what it excluded and invites the compliance officer to break the exclusion rather than quietly inheriting it. Accepting this scope also accepts that Part VIII carries no obligations on the register: the default provisions bind on a default event, none is declared, and the chapter is held under a trigger watch instead of being extracted. That zero is the answer, not a missing answer.",
      kind: "single",
      options: [
        { value: "accept", label: "Accept the computed scope", implies: "Part VIII stays dormant with a trigger watch and no default obligations are instantiated" },
        { value: "activate-viii", label: "Part VIII should be active now" },
        { value: "other", label: "Something else should move — see the final question" },
      ],
      prefilled: "accept",
      prefilledSource:
        "Computed scope: Parts I, II, III, IV, V, VI, VII, IX, X bind; Part VIII dormant — no declared default event on the profile",
      answer:
        "accept — with the trigger watch retained so an exchange default signal re-binds Part VIII automatically",
      unlocks: ["Part I", "Part II", "Part III", "Part IV", "Part V", "Part VI", "Part VII", "Part IX", "Part X"],
    },

    /* ── activate — the catch-all, deliberately last ──────────────── */
    {
      id: "ONQ-13",
      step: "activate",
      question:
        "Before the register goes live: is there any obligation, registration, product line, arrangement or document we did not ask for?",
      why:
        "Every ask above was derived from what the engine could see. Anything it could not see is a silent gap, and no amount of clever derivation closes it — only the firm can. Answers typed here are routed back into the extraction agent as a fresh scope input and re-run the documents step; they are not filed as a comment for someone to read later.",
      kind: "text",
      answer:
        "Yes — the annual system audit Terms of Reference changed for the current cycle. Track the new ToR items as separate line entries under DOC-REQ-005 rather than as one bundled report, so each one can carry its own closure evidence.",
      unlocks: ["DOC-REQ-005 re-scoped into per-ToR line items", "re-runs the documents step"],
    },
  ],

  /* Counts reconcile with the other data files:
       partsApplicable 9 + partsExcluded 1 = the ten Parts of the circular
       obligationsMapped 43 = data/obligations.ts
         OBL-SB-001…023  base extraction        RUN-041
         OBL-SB-024…033  corpus completion      RUN-049
         OBL-SB-101…110  Para 46 CUSPA re-map   RUN-047
       per Part: I 3 · II 2 · III 19 · IV 6 · V 2 · VI 1 · VII 3 ·
                 VIII 0 (excluded, event-driven) · IX 5 · X 2
       documentsRequested 26 = DOC-REQ-001…026
       documentsReceived 20 = 14 verified + 4 parsed awaiting sign-off
                              + 2 waived on profile grounds; 6 remain open */
  result: {
    partsApplicable: 9,
    partsExcluded: 1,
    obligationsMapped: 43,
    documentsRequested: 26,
    documentsReceived: 20,
  },
};

/* ══════════════════════════════════════════════════════════════════════
   The blank template — "start a new onboarding" for a different firm.

   Deliberately empty. In blank mode the engine has nothing to pre-fill,
   because it has not been told who the entity is yet: the questions are
   generated after the identify step resolves a name to a legal person.
   The contrast is the point — the opinionated session above is what the
   same six steps look like once the engine has done the reading.
   ══════════════════════════════════════════════════════════════════════ */

export const blankOnboarding: OnboardingSession = {
  id: "ONB-NEW",
  entityId: "ENT-NEW",
  /* sim-clock start; no completedAt — this session has not been run */
  startedAt: "2026-07-12T00:00:00+05:30",
  mode: "blank",

  steps: [
    {
      key: "identify",
      title: "Identify the entity",
      blurb:
        "Give the engine a legal name or a registration number. It resolves the entity, pulls the public filings, and stamps every fact it finds with a source before anything else begins.",
      status: "pending",
    },
    {
      key: "segments",
      title: "Map the business lines",
      blurb:
        "The engine infers the segments that public disclosure supports, and asks about the ones it cannot see. Each segment switched on instantiates an obligation family; each one left off is a family it will not create.",
      status: "pending",
    },
    {
      key: "designation",
      title: "Compute the designations",
      blurb:
        "QSB is scored against its seven parameters and the CSCRF grade is derived from entity size. Whatever cannot be computed from public data is asked for, and a computed designation is never rendered as a confirmed one.",
      status: "pending",
    },
    {
      key: "scope",
      title: "Bind the applicable Parts",
      blurb:
        "All ten Parts of the Master Circular are walked against the confirmed profile. What binds carries its trigger; what does not bind carries its reason, because an unexplained exclusion is where inspections start.",
      status: "pending",
    },
    {
      key: "documents",
      title: "Derive the document asks",
      blurb:
        "Requirements are generated from the bound scope, not read off a checklist. Every ask names the profile fact that produced it, so two firms on the same licence receive different lists.",
      status: "pending",
    },
    {
      key: "activate",
      title: "Activate the register",
      blurb:
        "Profile, scope, obligations and documents are assembled into one addressable object — then handed to a named human. Nothing goes live unsigned.",
      status: "pending",
    },
  ],

  /* Generated once identify resolves the entity — nothing to pre-fill yet. */
  questions: [],

  result: {
    partsApplicable: 0,
    partsExcluded: 0,
    obligationsMapped: 0,
    documentsRequested: 0,
    documentsReceived: 0,
  },
};
