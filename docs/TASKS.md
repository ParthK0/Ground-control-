# TASKS.md — GroundControl

Assumption: solo build, ~10–14 day window. If the real deadline is tighter, cut M5/M6
first — they're additive on top of the "done" definition in SPEC.md, not core to it.

- [x] **M0 — Docs + mockups**: SPEC/STACK/ARCHITECTURE locked, Stitch mockups for `/fan`
      and `/ops`
- [x] **M1 — Skeleton + deploy**: repo scaffold, Firestore schema seeded with Northgate
      Stadium zones, empty frontend + backend deployed to a live URL (deploy early, per
      the standard). Responsive breakpoints (desktop + mobile) for both `/fan` and
      `/ops` built into the scaffold from the start, not retrofitted at M7
- [/] **M2 — Fan assistant v1**: `/chat` endpoint + chat UI, answers wayfinding +
      accessibility questions from static zone data, 3 languages
- [ ] **M3 — Ops dashboard v1**: density map (Recharts + venue layout), manual density
      entry form, live Firestore listener
- [ ] **M4 — Recommendation engine**: threshold check + Gemini recommendation + debounce
      cache + multilingual alert draft + approve-and-publish flow
- [ ] **M5 — Incident triage**: `/incident` endpoint, server-side severity validation,
      draft response/comms UI
- [ ] **M6 — Briefing generator + transport comparison**: `/briefing`,
      `/transport-compare`
- [ ] **M7 — Polish + submission**: Antigravity glassmorphic pass on both views,
      checked at both desktop and mobile widths for both `/fan` and `/ops`, README
      (check against the duplicate-content disqualification from last time before
      submitting), demo video, final Cursor review pass

One task "in progress" at a time. When prompting an AI tool, reference the doc section —
e.g. *"Build `/density` per ARCHITECTURE.md's data flow step 2, with the validation rule
from SPEC.md's non-functional requirements."*
