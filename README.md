# poneglyph — Molecule fork

Compliance register for Molecule Ventures LLP (SEBI Portfolio Manager INP000007216; Category II AIF
in preparation), forked from walrus-securitas/poneglyph. Branch `molecule`.

Read in this order:
- `ROADMAP.md` — the validated plan: pipeline stages [0] PROFILE … [8] SHOW and the AIF launch checklist.
- `HANDOFF.md` — current state, in-progress task, next tasks, lessons. Updated every session.
- `poneglyph/README.md` — the app (Next static export + Cloudflare Worker behind `/api/*`).

Sources of truth: `given/sources/*.txt` are pdftotext dumps of the SEBI circulars; `npm run collect`
parses them into `poneglyph/data/collected/*.json`; the approved register is pulled from the running
worker by `npm run pull` into `poneglyph/data/collected/register.json`. Nothing regulatory is hand-typed.

Rules: every duty quotes the exact source sentence; nothing enters the register without a named human
sign-off at the gate; unproven means gap, never "done".
