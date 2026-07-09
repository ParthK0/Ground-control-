# SEED_DATA.md — Northgate Stadium (fictional demo venue)

Decided once, here, so no AI session has to invent it mid-build.

## Zones
| zoneId | name | capacity | accessibleRoute |
|---|---|---|---|
| z1 | North Concourse | 4000 | true |
| z2 | South Concourse | 4000 | true |
| z3 | East Gate Plaza | 2500 | false |
| z4 | West Gate Plaza | 2500 | true |
| z5 | Metro Transit Bridge | 6000 | true |
| z6 | Fan Zone / Retail Row | 3000 | false |

## Gates
| gateId | name | linkedZone | notes |
|---|---|---|---|
| g1 | Gate A (North) | z1 | primary accessible entry |
| g2 | Gate B (South) | z2 | secondary accessible entry |
| g3 | Gate C (East) | z3 | steps only, no ramp |
| g4 | Gate D (West) | z4 | accessible entry + drop-off point |

## Density thresholds
- Warning: 70% of zone capacity
- Trigger a Gemini recommendation: 85% of zone capacity
- Debounce window: 2 minutes per zone (per ARCHITECTURE.md)

## Transport comparison (illustrative/mock — not a live API, label as such in the UI)
| Mode | Est. time to venue | Est. CO₂ per person (round trip) |
|---|---|---|
| Metro/transit | 35 min | 1.2 kg |
| Rideshare (shared) | 20 min | 4.5 kg |
| Rideshare (private) | 18 min | 8.0 kg |
| Walking/biking (if applicable) | 25–40 min | ~0 kg |

## Languages
English (`en`), Spanish (`es`), French (`fr`) — matches the three 2026 host-country
languages (US, Mexico, Canada). Portuguese (`pt`) as a stretch 4th.

## Incident taxonomy (used to validate Gemini's classification output)
Category: `medical | security | crowd_control | lost_person | facility | weather | other`
Severity: `low | medium | high | critical`
