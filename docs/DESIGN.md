# DESIGN.md — GroundControl Visual Identity & Design System

This document outlines the Tactical Pitch design tokens and layout rules for the GroundControl frontend. All UI elements must strictly adhere to the values defined here.

## 1. Color Palette

All colors are chosen to maintain a high-contrast ratio (WCAG 2.1 AA compliant, minimum 4.5:1 ratio for body text).

### Base & Surfaces
- **Base Background**: Deep Midnight Navy  
  `#030712` (darkest base for app background)
- **Primary Surface**: Midnight Navy Card  
  `#0B0F19` (main component background, solid surface)
- **Secondary Surface**: Elevated Navy Card  
  `#1F2937` (hover states, nested panels, inputs)
- **Border / Divider**: Dark Navy Stroke  
  `#374151` (subtle boundaries, form borders)

### Primary Brand Accents
- **Pitch Green** (Primary Actions, Success, OK state):  
  `#00E676` (vibrant green, high visibility)
- **Cyber Teal** (Secondary Accents, Info):  
  `#00F2FE` (bright teal, helper details)

### Status Indicators (Density & Alerts)
- **Normal State** (Density < 70%): `#00E676` (Pitch Green)
- **Warning State** (Density 70%–85%): `#F59E0B` (Vibrant Amber/Yellow)
- **Critical State** (Density > 85%): `#EF4444` (Vibrant Red)

### Typography Colors
- **Text Primary**: `#FFFFFF` (high contrast headers and primary text)
- **Text Secondary**: `#9CA3AF` (secondary labels, supporting descriptions)
- **Text Muted**: `#6B7280` (disclaimers, timestamps, static footers)

---

## 2. Typography

We use standard, highly legible sans-serif typefaces to support rapid scanning in high-stress stadium environments.

- **Primary Font Family**: `Inter`, system-ui, sans-serif
- **Heading Styles**:
  - `h1`: 32px / 2.0rem (bold, tracking tight)
  - `h2`: 20px / 1.25rem (semi-bold)
  - `h3`: 16px / 1.0rem (semi-bold)
- **Body Styles**:
  - `body-normal`: 14px / 0.875rem (regular, leading 1.5)
  - `body-small`: 12px / 0.75rem (regular, supporting notes)
  - `timestamp / meta`: 11px / 0.6875rem (muted text)

---

## 3. Layout & Spacing Rules

Spacing is defined on an 8px grid to ensure visual rhythm and alignment.

### Spacing Grid
- `space-xs`: 4px
- `space-sm`: 8px
- `space-md`: 16px
- `space-lg`: 24px
- `space-xl`: 32px

### Layout Breakpoints
- **Mobile Width**: `< 768px` (stacked single-column panels, full-width components)
- **Desktop Width**: `≥ 768px` (multi-column dashboard, side-by-side layout panels)

### Route Layout Patterns
- **Fan Route (`/fan`)**:
  - *Mobile*: Vertical scrolling layout. Header dropdown switcher → Venue Map SVG container → Transport Comparison Table → Chat Message List & persistent Chat Input at the bottom.
  - *Desktop*: Side-by-side split screen. Left side contains the Venue Map SVG and Transport Comparison card. Right side contains the persistent Chat Box with scrollable messages and chat input.
- **Ops Route (`/ops`)**:
  - *Mobile*: Tabbed view navigation bar at the top to toggle between active panels (📊 Zones, 💡 GenAI, ⚠️ Incidents, 📋 Briefings) to maximize screen readability.
  - *Desktop*: Multi-column command layout. Left-hand side displays the 6 Zone Density cards grid. Right-hand side displays three stacked panels: GenAI Recommendations, Incident Triage, and Shift Briefings.
