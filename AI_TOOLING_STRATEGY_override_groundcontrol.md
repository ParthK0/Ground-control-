### GroundControl (FIFA World Cup 2026 stadium ops hackathon)
- **Stack**: React/TypeScript/Vite, FastAPI, Firestore, Gemini API, Recharts
- **Primary tool for backend**: Codex — `/density`, `/recommendations`, `/incident`,
  `/briefing` endpoints, Gemini prompt logic, server-side validation, tests
- **Primary tool for frontend**: Antigravity — chat widget, density dashboard,
  glassmorphic polish pass on both `/fan` and `/ops`
- **OpenCode + cheap model**: bulk generation of Northgate Stadium mock zone data,
  simulated density seed data, multilingual string-table scaffolding (review before
  treating as final copy — cheap models drift on translation nuance)
- **Deviations from default routing**: incident-classification and threshold-validation
  logic goes through Codex with an extra-detailed prompt (Q6 fallback) — it's the one
  part of this project where a wrong "recommendation" reaching staff carries real (if
  simulated) safety framing, so it's worth the slower, more careful pass
- **Known constraints**: no live transit API — mock data only, clearly labeled as
  illustrative in the UI; Gemini key stays backend-only, same lesson as the Maps key
- **Deploy standard**: Vercel (frontend) + Render/Railway (backend), live URL by end of
  M1, not saved for the end
