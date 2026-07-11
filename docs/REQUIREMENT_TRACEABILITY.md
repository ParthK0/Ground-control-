# Requirement Traceability Matrix (RTM)

This document provides a trace map showing how each challenge requirement for the GroundControl Matchday Platform corresponds to source files and automated test evidence.

---

## 1. Fan Experience & Interactive Venue Map
* **Requirement**: High-fidelity custom SVG stadium map featuring interactive zones, keyboard accessibility (WCAG step-free navigation), real-time density levels, and details display.
* **Component Code**:
  * [VenueMap.tsx](file:///e:/ground%20control/frontend/src/components/fan/VenueMap.tsx) — Main SVG rendering, `tabIndex={0}`, keyboard handlers (`onKeyDown` for Space/Enter), and ARIA button patterns.
* **Test Evidence**:
  * [accessibility.test.tsx](file:///e:/ground%20control/frontend/src/tests/accessibility.test.tsx) — Tests that each zone is focusable, has role `button`, responds to `Click`, `Enter`, and `Space`, and validates zero Axe accessibility violations.
  * [OpsDashboard.test.tsx](file:///e:/ground%20control/frontend/src/tests/OpsDashboard.test.tsx) — Verifies density state boundary calculations and zone name lookup invariants.

---

## 2. Multi-lingual AI Copilot (Fan Q&A)
* **Requirement**: Multi-lingual assistant supporting English, Spanish, and French, with fallback capabilities (demo mode), voice toggle integration (Web Speech API), and structured, precise responses.
* **Component Code**:
  * [ChatWindow.tsx](file:///e:/ground%20control/frontend/src/components/fan/ChatWindow.tsx) — Chat message layout, voice input animations, and screen reader-friendly aria-live regions.
  * [FanChat.tsx](file:///e:/ground%20control/frontend/src/pages/FanChat.tsx) — Logic hook for SpeechRecognition, text input parsing, and endpoint interaction.
  * [chat.py](file:///e:/ground%20control/backend/app/routers/chat.py) — FastAPI endpoint with validation, Gemini structured generation config (JSON schema), and keyword demo/fallback responses.
* **Test Evidence**:
  * [FanChat.test.tsx](file:///e:/ground%20control/frontend/src/tests/FanChat.test.tsx) — Verifies text rendering, message submission, mock speech synthesis activation, and language toggling.
  * [test_endpoints.py](file:///e:/ground%20control/backend/tests/test_endpoints.py) — Validates that unsupported languages fallback gracefully (`test_chat_unsupported_language_defaults_gracefully`) and empty messages are rejected (`test_chat_empty_message_rejected`).

---

## 3. Operational Intelligence & Safety Dashboards
* **Requirement**: Operations dashboard for stadium staff to monitor live density alerts, review Gemini-classified incident reports, approve resource recommendations, and access AI-generated briefing sections.
* **Component Code**:
  * [OpsDashboard.tsx](file:///e:/ground%20control/frontend/src/pages/OpsDashboard.tsx) — Main dashboard viewport, incident logger, and recommendation tabs.
  * [incident.py](file:///e:/ground%20control/backend/app/routers/incident.py) — AI incident classifier mapping incoming descriptions to categories (medical, security, etc.) and auto-generating staff draft responses.
  * [briefing.py](file:///e:/ground%20control/backend/app/routers/briefing.py) — Live/Demo briefing document compiler with shift context injection.
* **Test Evidence**:
  * [test_endpoints.py](file:///e:/ground%20control/backend/tests/test_endpoints.py) — Contains integration tests verifying briefing layouts (`test_briefing_demo_mode_returns_sections`), shift context overrides, secure access rejection (`test_briefing_requires_auth`), and classification outputs (`test_incident_security_event_classified`).

---

## 4. Transit & Emissions Intelligence
* **Requirement**: Visual transport comparison card showing journey times, route details, and CO2 emissions comparisons (green travel promotion).
* **Component Code**:
  * [TransportPanel.tsx](file:///e:/ground%20control/frontend/src/components/fan/TransportPanel.tsx) — Custom rendering of transit options, travel modes, and green highlights.
* **Test Evidence**:
  * [accessibility.test.tsx](file:///e:/ground%20control/frontend/src/tests/accessibility.test.tsx) — Verifies that the transport panel passes compliance checks and renders correctly.

---

## 5. Compliance & Security Gates
* **Requirement**: Automated WCAG 2.1 AA checking, strict linter criteria, payload size ceilings (32 KB), and rate-limit controls.
* **Component Code**:
  * [main.py](file:///e:/ground%20control/backend/app/main.py) — Implements `LimitUploadSizeMiddleware` (32 KB limit) and `RateLimitingMiddleware` (8 req/min with test client bypass).
  * [vite.config.ts](file:///e:/ground%20control/frontend/vite.config.ts) — Configures Vitest and enforces strict coverage gates.
* **Test Evidence**:
  * [latest.json](file:///e:/ground%20control/frontend/public/quality/latest.json) — Validated test and coverage artifact loaded by the `/quality` page in real-time.
