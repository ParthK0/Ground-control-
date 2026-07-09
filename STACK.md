# STACK.md — GroundControl

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite | Existing familiarity (TerraWatch), fast iteration in Antigravity |
| Backend | FastAPI (Python) | Same reasoning, clean Gemini SDK integration |
| Data | Firestore | Real-time listeners for the density dashboard, no hand-rolled websockets |
| Charts | Recharts | Zone density views, time-series |
| GenAI | Gemini API, server-side only | Chat, recommendation drafting, incident classification, briefing generation |
| Auth | Firebase Auth | Staff-only, single shared role for v1 (no per-volunteer accounts yet) |
| Hosting | Vercel (frontend) + Render/Railway (backend) | Free tier, matches the AlphaForge deploy pattern |

## Required environment variables (backend only — never in the Vite client)
- `GEMINI_API_KEY`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (service account,
  server-side Firestore access)
- `STAFF_AUTH_SECRET` (shared staff-login token for v1's single-role auth)

The frontend only ever holds the public Firebase web config (safe to expose) and points
at the backend's own URL — it never holds a Gemini key or a service-account credential.

## Why not X
- **No real transit API (Google Maps/Transit) for v1** — avoids a second exposed-key risk
  surface under deadline pressure; static/mock data is enough to demonstrate the
  sustainability-comparison feature honestly (and it's labeled as illustrative in the UI)
- **No Postgres/pgvector** — v1 doesn't need semantic search/RAG; Firestore's simpler
  realtime model fits the live-dashboard use case better
