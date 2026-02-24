"""Faction name normalization mapping for the ParlaBio build pipeline.

The XML uses long free-text names for factions. This module maps them to
short codes for the search index and facet filters.

In wp19 data, committee names, ministry names, and other parliamentary body
names appear in the same XML structure as faction memberships. These are NOT
factions and must be filtered out during affiliation parsing.
"""

# Complete mapping: XML full text → short code
# Derived from exhaustive extraction of all unique
# affiliation[@type="Fraktionszugehoerigkeit"] text values in Personen.xml
FACTION_MAP: dict[str, str] = {
    # Major parties (Fraktionen)
    "Fraktion der Christlich Demokratischen Union/Christlich - Sozialen Union": "CDU/CSU",
    "Fraktion der Sozialdemokratischen Partei Deutschlands": "SPD",
    "Fraktion der Freien Demokratischen Partei": "FDP",
    "Fraktion Bündnis 90/Die Grünen": "B90/Grüne",
    "Fraktion DIE LINKE.": "LINKE",
    "Fraktion Die Grünen": "Grüne",
    "Fraktion Die Grünen/Bündnis 90": "Grüne/B90",
    "Alternative für Deutschland": "AfD",
    "Fraktion der Kommunistischen Partei Deutschlands": "KPD",
    "Fraktion der Partei des Demokratischen Sozialismus": "PDS",

    # Smaller/historical parties
    "Fraktion Deutsche Partei": "DP",
    "Fraktion Deutsche Partei Bayern": "DPB",
    "Fraktion Deutsche Partei/Deutsche Partei Bayern": "DP/DPB",
    "Fraktion Deutsche Partei/Freie Volkspartei": "DP/FVP",
    "Fraktion Deutsche Reichspartei": "DRP",
    "Fraktion Deutsche Reichspartei/Nationale Rechte": "DRP/NR",
    "Fraktion Deutsche Zentrums-Partei": "Zentrum",
    "Fraktion Deutscher Gemeinschaftsblock der Heimatvertriebenen und Entrechteten": "DG/BHE",
    "Fraktion Demokratische Arbeitsgemeinschaft": "DA",
    "Fraktion Bayernpartei": "BP",
    "Fraktion Freie Volkspartei": "FVP",
    "Fraktion Föderalistische Union": "FU",
    "Fraktion Gesamtdeutscher Block/Block der Heimatvertriebenen und Entrechteten": "GB/BHE",
    "Fraktion Wirtschaftliche Aufbauvereinigung": "WAV",

    # Guest status (Gast)
    "Fraktion der CDU/CSU (Gast)": "CDU/CSU (Gast)",
    "Fraktion der FDP (Gast)": "FDP (Gast)",
    "Fraktion der SPD (Gast)": "SPD (Gast)",
    "Fraktion DP/DPB (Gast)": "DP/DPB (Gast)",
    "Fraktion DRP (Gast)": "DRP (Gast)",
    "Fraktion WAV (Gast)": "WAV (Gast)",

    # Independent
    "Fraktionslos": "Fraktionslos",

    # Groups (Gruppen, not full Fraktionen)
    "Gruppe Bündnis 90/Die Grünen": "Grp. B90/Grüne",
    "Gruppe der Partei des Demokratischen Sozialismus": "Grp. PDS",
    "Gruppe der Partei des Demokratischen Sozialismus/Linke Liste": "Grp. PDS/LL",
    "Gruppe Deutsche Partei": "Grp. DP",
    "Gruppe Kraft/Oberländer": "Grp. Kraft/Oberl.",
}

# Set of all known faction full names (for filtering out committee names)
KNOWN_FACTIONS: frozenset[str] = frozenset(FACTION_MAP.keys())


def normalize_faction(full_name: str) -> str | None:
    """Return normalized short code for a faction name, or None if unknown."""
    return FACTION_MAP.get(full_name)


def is_faction(text: str) -> bool:
    """Return True if the text is a known faction name (not a committee etc.)."""
    return text in KNOWN_FACTIONS
