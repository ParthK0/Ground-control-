# SPEC.md — GroundControl
### GenAI stadium operations & fan copilot — FIFA World Cup 2026 hackathon submission

## What it does
GroundControl is a two-sided GenAI copilot for World Cup venues: a multilingual fan-facing
assistant for wayfinding, accessibility, and green transport choices, plus a staff/volunteer
ops dashboard that turns live crowd signals into concrete, ready-to-send actions (reroutes,
alerts, incident responses, shift briefings).

## Who uses it
- **Fan persona** — a first-time attendee at an unfamiliar host-city stadium, travelling with
  someone who needs step-free access, who doesn't speak English as a first language.
- **Staff persona** — a volunteer team lead at a gate who needs a same-minute answer to
  "what do I do right now" during a density spike or an incident, without waiting on a
  control-room callback.

## What "done" means for v1
- [ ] Fan chat assistant answers wayfinding, accessibility, and transport questions for one
      demo venue, in English, Spanish, and French (the three 2026 host-country languages —
      Portuguese as a stretch 4th if time allows)
- [ ] Ops dashboard shows live (simulated) zone-by-zone density on a venue map
- [ ] When density crosses a threshold, GenAI generates a rerouting recommendation + a
      ready-to-send multilingual alert draft, shown to staff for one-tap approval (never
      auto-sent)
- [ ] Staff can log an incident in plain language; GenAI classifies severity/category and
      drafts a response + stakeholder message
- [ ] Staff can generate a role-specific volunteer shift briefing from the day's plan
- [ ] Sustainability comparison for at least 2 transport modes to the venue
- [ ] Live deployed URL, demoable end-to-end without local setup

## Non-functional requirements
- **Auth**: single shared "staff" login for the ops dashboard (demo-grade, not production
  auth); fan assistant is public, no login
- **Validation**: all GenAI-classified incident severities and density thresholds are
  re-checked server-side before being shown as a "recommended action" — never trust a
  client-supplied severity or density number
- **Error/empty states**: chat assistant must degrade gracefully if the Gemini call fails
  (cached fallback answer, not a blank screen); dashboard must show "no data" distinctly
  from "0 density"
- **Public vs. private data**: incident logs and staff briefings are staff-only; the fan
  assistant never surfaces raw incident data, only sanitized public alerts
- **Rate limits**: cache/debounce Gemini calls per zone per time window (e.g. one
  recommendation per zone per 2 minutes) — this is the exact bug class (uncached Gemini
  calls) that hit TerraWatch, don't repeat it
- **Secrets handling**: Gemini API key lives only in backend env vars, never in the Vite
  client bundle — the same rule that would've caught the Maps-key exposure last time
- **Digital accessibility**: the app itself follows basic WCAG 2.1 AA practices —
  sufficient color contrast, alt text/aria-labels on icons and map zones, keyboard-
  navigable chat and dashboard. "Accessibility" as a judged theme covers the app's own
  usability, not only physical stadium routing — don't let this get read as only the
  fan-facing "accessible route" flag
- **Responsive design**: both `/fan` and `/ops` must be fully usable on desktop and
  mobile viewports — neither surface is optimized for only one device class. `/fan`
  skews mobile in realistic stadium use, and `/ops` skews tablet/laptop for staff, but
  both get built responsive from the start: whoever judges this will most likely view
  the live demo on a laptop, so desktop layout quality affects the pitch directly, not
  just realism

## Constraints
- Budget: free-tier only (Gemini free tier, Firestore free tier, Vercel/Render free tier)
- Must have a live deployed URL before the deadline, not just a local demo
- Single demo venue (fictional "Northgate Stadium") — do not attempt to model all 16 host
  venues

## Out of scope for v1
- Real indoor positioning / live GPS wayfinding (fan selects their gate/seat manually — no
  hardware)
- Live transit API integration (mock/static transit + emissions data, clearly labeled as
  illustrative)
- Real ticketing or turnstile integration
- Auto-sending alerts without a human approval tap
- Supporting more than one venue
- Any official FIFA/World Cup marks, logos, team crests, mascot, ball design, or trophy
  imagery, anywhere in the UI, docs, or demo video — this is an unofficial concept
  project, not a licensed one. Say so on the landing page. Use only the fictional
  "Northgate Stadium" branding and, if teams are shown at all, fictional team names

## Theme coverage (for judging alignment)
| Required theme | Feature that covers it |
|---|---|
| Navigation | Fan chat wayfinding (M2) |
| Crowd management | Density dashboard + rerouting recommendation (M3, M4) |
| Accessibility | Accessible-route flag (fan) + WCAG basics (app itself) |
| Transportation | Transport comparison (M6) |
| Sustainability | Emissions estimate in transport comparison (M6) |
| Multilingual assistance | Chat + alert translation (M2, M4) |
| Operational intelligence | Ops dashboard synthesizing density + recommendations (M3, M4) |
| Real-time decision support | Incident triage + approve-and-publish flow (M4, M5) |

If the demo runs short on time, cut from the bottom of TASKS.md, not from this table —
losing a milestone loses one feature; losing a row here loses a whole judged theme.
