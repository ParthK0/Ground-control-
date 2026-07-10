# GroundControl

GenAI stadium operations & fan copilot — an unofficial concept build for a FIFA World Cup 2026 stadium-operations hackathon submission. Not affiliated with or endorsed by FIFA.

---

## Status: Fully Completed (Milestones M0–M7)
All features, endpoints, and visual styles have been built, polished, audited, and verified:
- **Fan Copilot Chat (`/fan`)**: Multilingual (EN, ES, FR) wayfinding, accessibility support, and dynamic transport/carbon comparison with glassmorphic cards.
- **Ops Dashboard (`/ops`)**: Live stadium capacity map, manual simulation controls, Gemini-backed routing recommendations with debounce cooling, incident logging with triage, and volunteer briefings generator.
- **Clean Architecture & Audit**: Zero client-side API keys, strict server-side schema validations, and full `DEMO_MODE` coverage allowing offline execution.

---

## Setup and Running

### 1. Backend Setup (FastAPI)
Navigate to the `backend/` directory:
```bash
cd backend
```

#### Install dependencies:
Using pip:
```bash
pip install -r requirements.txt
```

#### Environment Configuration:
Create or verify the `backend/.env` file with the following variables:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
STAFF_AUTH_SECRET=any_random_string
FRONTEND_ORIGIN=http://localhost:5173
DEMO_MODE=true
```
> [!NOTE]
> If `DEMO_MODE=true`, the backend will use mock data and keywords to simulate Gemini classifications and briefings, bypassing the live Gemini API entirely (perfect for offline development or testing without API keys).

#### Run the server:
Start the FastAPI server via Uvicorn:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

### 2. Frontend Setup (React + Vite + TypeScript)
Navigate to the `frontend/` directory:
```bash
cd ../frontend
```

#### Install dependencies:
```bash
npm install
```

#### Environment Configuration:
Create or verify the `frontend/.env` file:
```ini
VITE_BACKEND_URL=http://localhost:8000
```
Optional (for real-time Firestore synchronization):
```ini
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
```
> [!NOTE]
> If these Firebase Web SDK variables are omitted, the frontend automatically and gracefully falls back to polling API endpoints over HTTP every 5 seconds, ensuring the app remains fully functional without a Firebase project setup.

#### Run the frontend client:
Start the development server:
```bash
npm run dev
```

Open the application at:
- **Fan Companion App**: `http://localhost:5173/fan`
- **Stadium Ops Dashboard**: `http://localhost:5173/ops`

---

## Product Documentation
Every product and architecture decision lives in `/docs`:
- [`SPEC.md`](./docs/SPEC.md) — Product specifications & core requirements
- [`STACK.md`](./docs/STACK.md) — Tech choices & design rationale
- [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Data flows, API schema contract & security boundaries
- [`TASKS.md`](./docs/TASKS.md) — Development milestones checklist
- [`SEED_DATA.md`](./docs/SEED_DATA.md) — Fictional demo venue parameters and transport specs
- [`translations.json`](./frontend/src/translations.json) — Localization resources (EN, ES, FR)
