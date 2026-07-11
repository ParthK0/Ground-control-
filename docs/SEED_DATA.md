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

## Weather signal
- condition: rain
- changeInMinutes: 40

## Food Stalls
| stallId | name | linkedZone | cuisine | queueMinutes |
|---|---|---|---|---|
| f1 | Northside Burgers | z1 | Burgers & Fries | 5 |
| f2 | Taco Corner | z2 | Mexican Street Tacos | 12 |
| f3 | Eastside Pizza | z3 | Fresh Pizza Slices | 8 |
| f4 | Vegan Goals | z4 | Plant-based Wraps | 3 |
| f5 | Metro Pretzel | z5 | Pretzels & Churros | 15 |
| f6 | World Cup Cantina | z6 | Global Bites & Drinks | 20 |

## Washrooms
| washroomId | name | linkedZone | accessible | notes |
|---|---|---|---|---|
| w1 | North Restrooms | z1 | true | Male/Female/Gender-Neutral, step-free access |
| w2 | South Restrooms | z2 | true | Male/Female, step-free access |
| w3 | East Plaza Restrooms | z3 | false | Male/Female, steps-only (no wheelchair ramp) |
| w4 | West Plaza Restrooms | z4 | true | Family/Gender-Neutral, step-free access |
| w5 | Fan Zone Restrooms | z6 | false | Porta-potties, steps-only |

## Parking Areas
| parkingId | name | linkedGate/Zone | totalSpaces | occupancyRate | notes |
|---|---|---|---|---|---|
| p1 | Lot A (North Parking) | g1 / z1 | 1500 | 92% | Closest to North Concourse |
| p2 | Lot B (South Parking) | g2 / z2 | 2000 | 45% | Recommended parking, step-free |
| p3 | Lot D (West VIP Lot) | g4 / z4 | 500 | 98% | Permit only, accessible drop-off |


