"""
Shared venue constants for GroundControl.

A single authoritative source for zone capacities, names, and classification
enums — imported by density, ops_summary, recommendation, and incident modules.
Eliminates the repeated-definition DRY violation that existed across routers.
"""

# Zone capacity limits (occupant counts) per SEED_DATA.md
ZONE_CAPACITIES: dict[str, int] = {
    "z1": 4000,
    "z2": 4000,
    "z3": 2500,
    "z4": 2500,
    "z5": 6000,
    "z6": 3000,
}

# Human-readable zone labels
ZONE_NAMES: dict[str, str] = {
    "z1": "North Concourse",
    "z2": "South Concourse",
    "z3": "East Gate Plaza",
    "z4": "West Gate Plaza",
    "z5": "Metro Transit Bridge",
    "z6": "Fan Zone / Retail Row",
}

# Allowed classification enums — server-side validation only, never from client
ALLOWED_SEVERITIES: frozenset[str] = frozenset({"low", "medium", "high", "critical"})

ALLOWED_CATEGORIES: frozenset[str] = frozenset({
    "medical",
    "security",
    "crowd_control",
    "lost_person",
    "facility",
    "weather",
    "other",
})

# Density threshold (percentage) that triggers a crowd-management recommendation
DENSITY_THRESHOLD_PCT: float = 85.0

# Food-stall transaction count that triggers a waste/queue recommendation
WASTE_THRESHOLD_SALES: int = 50

# Debounce cooldown for Gemini recommendations (seconds)
RECOMMENDATION_COOLDOWN_SECS: int = 120
