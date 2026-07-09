# ARCHITECTURE.md — GroundControl

## Components
- **Fan PWA** (`/fan`) — chat assistant, venue map, transport comparison
- **Ops Dashboard** (`/ops`, staff-only) — density map, recommendation feed, incident log,
  briefing generator
- **Backend API** (FastAPI) — all Gemini calls, all writes to Firestore, all validation
- **Firestore** — venues, zones, density_readings, incidents, briefings, alerts
- **Gemini API** — called only from the backend, never from the client

## Data flow
1. **Density input**: staff manually enters a zone's density (or a seed script simulates
   it) → `POST /density` → backend validates range → writes to Firestore
   `density_readings`
2. **Threshold check**: backend checks the new reading against the zone's capacity; if
   over threshold AND no recommendation has been generated for that zone in the last 2
   minutes (server-side cache check), it calls Gemini for a rerouting recommendation +
   drafts a multilingual alert → writes both to Firestore
3. **Live view**: the ops dashboard subscribes to `density_readings` and
   `recommendations` via Firestore listeners and renders live
4. **Approval**: staff taps "approve & publish" on a recommendation → backend writes to
   `alerts` (public collection)
5. **Fan-facing alert**: the fan PWA listens to `alerts` (read-only) and shows the
   public-facing message, translated to the fan's selected language
6. **Incident flow**: staff types a free-text incident → `POST /incident` → backend calls
   Gemini to classify (category/severity) → server re-validates the severity against a
   fixed enum (never trusts the raw model output as the stored severity) → writes to
   `incidents` (staff-only) → returns a draft response + draft comms for staff to edit
   and send manually

## API contracts (high level)
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/chat` | POST | none | Fan wayfinding / accessibility / transport Q&A |
| `/density` | POST | staff | Submit a zone density reading |
| `/recommendations` | GET | staff | Fetch active recommendations |
| `/recommendations/{id}/approve` | POST | staff | Publish a recommendation as a public alert |
| `/incident` | POST | staff | Log + classify an incident |
| `/briefing` | POST | staff | Generate a role-specific volunteer briefing |
| `/transport-compare` | GET | none | Compare transport modes + emissions estimate |

## DB schema (Firestore collections)
- `venues/{venueId}` — name, zones[], gates[]
- `zones/{zoneId}` — venueId, name, capacity, accessibleRoute flag
- `density_readings/{id}` — zoneId, value, timestamp, source (manual/simulated)
- `recommendations/{id}` — zoneId, text, status (pending/approved), languages{}
- `incidents/{id}` — text, category, severity, draftResponse, status
- `briefings/{id}` — role, shift, content

## Sync/consistency rules
- Firestore is the single source of truth for density, recommendations, incidents, alerts
- The fan PWA never writes to Firestore directly — read-only via backend-controlled data
  on the `alerts` collection only
- The recommendation debounce cache (2 minutes per zone) lives in the backend, not the
  client, so a page refresh can't trigger a duplicate Gemini call

## Gemini I/O contracts (fixed, not up to the model)
Every Gemini call must return structured output matching one of these shapes. The
backend validates the shape before using it — a malformed or out-of-enum response is
treated as a failure and falls back to the cached/default response, never passed through.

- **Incident classification** — category: one of `medical | security | crowd_control |
  lost_person | facility | weather | other`; severity: one of `low | medium | high |
  critical`; plus `draftResponse` (string) and `draftComms` (string). Any other category
  or severity value is rejected server-side and the incident is flagged for manual
  staff classification instead.
- **Recommendation** — `zoneId`, `recommendationText` (string, staff-facing), `alertText`
  (object keyed by language code: `en`, `es`, `fr`), `severity` reused from the same
  enum above.
- **Chat response** — plain text for the fan, plus a `topic` tag (`wayfinding |
  accessibility | transport | general`) used only for logging/analytics, never for
  access control.
- **Briefing** — `role` (string), `sections` (array of `{heading, body}`) — kept as
  structured sections rather than free text so the UI can render consistent cards
  regardless of what the model generates.

## Security boundaries
- Gemini API key: backend env var only, never shipped in the client bundle
- Staff-only collections (`incidents`, `density_readings`, `recommendations`,
  `briefings`) are not readable by the fan PWA's Firebase Auth role
- Any severity/threshold value returned by Gemini is validated server-side against a
  fixed enum/range before being persisted or displayed as a "recommended action" — GenAI
  output informs the recommendation, it never becomes the source of truth for a
  safety-relevant classification without that check
