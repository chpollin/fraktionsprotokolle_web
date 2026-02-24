"""Transform parsed person dicts into output JSON structures."""

from build.constants import GND_PREFIX
from build.factions import normalize_faction
from build.dates import extract_year
from build.quality import QualityReport


def build_search_entry(person: dict, report: QualityReport) -> dict:
    """Build a compact search index entry (no career free text)."""
    pid = person["id"]

    # Faction short codes (deduplicated, order preserved)
    factions_seen = []
    factions_set = set()
    for aff in person["affiliations"]:
        code = normalize_faction(aff["faction_full"])
        if code and code not in factions_set:
            factions_seen.append(code)
            factions_set.add(code)
        elif code is None:
            report.add("unknown_faction", pid, f"Unmapped faction: {aff['faction_full']}")

    # Period numbers (deduplicated, sorted)
    periods = sorted({
        aff["period"] for aff in person["affiliations"]
        if aff["period"] is not None
    })

    # GND: strip URL prefix to bare ID (only standard format)
    gnd_raw = person["ids"].get("gnd")
    gnd_bare = None
    if gnd_raw and gnd_raw.startswith(GND_PREFIX):
        gnd_bare = gnd_raw[len(GND_PREFIX):]
    elif gnd_raw:
        # Non-standard GND URL (Wikipedia URL in GND field, or DNB without /gnd/ path)
        # Don't put raw URLs into the search index
        report.add("gnd_not_extracted", pid,
                    f"GND value not in standard format, omitted from search index: {gnd_raw}")

    return {
        "id": pid,
        "name": person["name"]["reg"],
        "surname": person["name"]["surname"],
        "forename": person["name"]["forename"],
        "sex": person["sex"],
        "birth_year": extract_year(person["birth"]["date"]),
        "death_year": extract_year(person["death"]["date"]),
        "birth_place": person["birth"]["place"],
        "type": person["type"],
        "factions": factions_seen,
        "periods": periods,
        "gnd": gnd_bare,
        "has_wikipedia": bool(person["ids"].get("wikipedia")),
    }


def build_detail_entry(person: dict, report: QualityReport) -> dict:
    """Build a full detail JSON for a single person."""
    # Affiliations with normalized faction codes
    affiliations = []
    for aff in person["affiliations"]:
        code = normalize_faction(aff["faction_full"])
        affiliations.append({
            "period": aff["period"],
            "faction": code or aff["faction_full"],
            "faction_full": aff["faction_full"],
            "from": aff["from"],
            "to": aff["to"],
        })

    detail = {
        "id": person["id"],
        "type": person["type"],
        "name": {
            "reg": person["name"]["reg"],
            "forename": person["name"]["forename"],
            "surname": person["name"]["surname"],
            "prefix": person["name"]["prefix"],
            "role_name": person["name"]["role_name"],
            "place": person["name"]["place"],
        },
        "sex": person["sex"],
        "birth": person["birth"],
        "death": person["death"],
        "occupation": person["occupation"],
        "affiliations": affiliations,
        "ids": {
            "mdb_stammdaten": person["ids"].get("mdb_stammdaten"),
            "gnd": person["ids"].get("gnd"),
            "wikipedia": person["ids"].get("wikipedia"),
            "viaf": person["ids"].get("viaf"),
        },
    }

    # Include non-empty optional fields
    if person["exekutive"]:
        detail["exekutive"] = person["exekutive"]
    if person["sonstiges"]:
        detail["sonstiges"] = person["sonstiges"]
    if person["occupation_structured"]:
        detail["occupation_kgparl"] = person["occupation_structured"]
    if person["alt_names"]:
        detail["alt_names"] = person["alt_names"]

    return detail
