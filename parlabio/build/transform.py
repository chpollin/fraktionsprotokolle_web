"""Transform parsed person dicts into output JSON structures."""

from build.constants import GND_PREFIX
from build.factions import normalize_faction
from build.dates import extract_year
from build.quality import QualityReport

# Schema.org JSON-LD context for detail entries.
# Declares the project-specific namespace so that "fraktionsprotokolle:*"
# keys are valid JSON-LD terms (not silently dropped by processors).
JSONLD_CONTEXT = {
    "@vocab": "https://schema.org/",
    "fraktionsprotokolle": "https://fraktionsprotokolle.de/ns/",
}

# Base URL for @id (person pages). Combined with person ID to form a
# resolvable URI, e.g. https://fraktionsprotokolle.de/parlabio/#/person/AdenauerKonrad_1949-09-07
PARLABIO_BASE_URL = "https://fraktionsprotokolle.de/parlabio/#/person/"

# Mapping of sex values to Schema.org GenderType
SEX_TO_SCHEMA = {
    "m": "https://schema.org/Male",
    "f": "https://schema.org/Female",
}


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


def _build_same_as(ids: dict) -> list:
    """Collect external URLs for schema:sameAs."""
    urls = []
    for key in ("gnd", "wikipedia", "viaf"):
        val = ids.get(key)
        if val:
            urls.append(val)
    return urls


def build_detail_entry(person: dict, report: QualityReport) -> dict:
    """Build a full detail JSON-LD for a single person.

    Uses Schema.org vocabulary (schema:Person) with project-specific
    extensions for parliamentary data (factions, periods, etc.).
    """
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

    # Schema.org memberOf: faction affiliations as Organization memberships
    member_of = []
    for aff in affiliations:
        membership = {
            "@type": "OrganizationRole",
            "memberOf": {
                "@type": "Organization",
                "name": aff["faction_full"],
                "alternateName": aff["faction"],
            },
            "startDate": aff["from"],
        }
        if aff["to"]:
            membership["endDate"] = aff["to"]
        member_of.append(membership)

    # sameAs: external authority URLs
    same_as = _build_same_as(person["ids"])

    detail = {
        "@context": JSONLD_CONTEXT,
        "@type": "Person",
        "@id": PARLABIO_BASE_URL + person["id"],
        "name": person["name"]["reg"],
        "givenName": person["name"]["forename"],
        "familyName": person["name"]["surname"],
        # Project-specific fields (namespace declared in @context)
        "fraktionsprotokolle:personType": person["type"],
        "fraktionsprotokolle:name": {
            "reg": person["name"]["reg"],
            "forename": person["name"]["forename"],
            "surname": person["name"]["surname"],
            "prefix": person["name"]["prefix"],
            "role_name": person["name"]["role_name"],
            "place": person["name"]["place"],
        },
        "fraktionsprotokolle:birth": person["birth"],
        "fraktionsprotokolle:death": person["death"],
        "fraktionsprotokolle:affiliations": affiliations,
        "fraktionsprotokolle:ids": {
            k: v for k, v in {
                "mdb_stammdaten": person["ids"].get("mdb_stammdaten"),
                "gnd": person["ids"].get("gnd"),
                "wikipedia": person["ids"].get("wikipedia"),
                "viaf": person["ids"].get("viaf"),
            }.items() if v is not None
        },
    }

    # Schema.org optional fields – only include when data exists (no nulls)
    gender = SEX_TO_SCHEMA.get(person["sex"])
    if gender:
        detail["gender"] = gender
    if person["birth"]["date"]:
        detail["birthDate"] = person["birth"]["date"]
    if person["birth"]["place"]:
        detail["birthPlace"] = {"@type": "Place", "name": person["birth"]["place"]}
    if person["death"]["date"]:
        detail["deathDate"] = person["death"]["date"]
    if person["death"]["place"]:
        detail["deathPlace"] = {"@type": "Place", "name": person["death"]["place"]}
    if person["occupation"]:
        detail["hasOccupation"] = {"@type": "Occupation", "name": person["occupation"]}
    if member_of:
        detail["memberOf"] = member_of
    if same_as:
        detail["sameAs"] = same_as

    # Project-specific optional fields
    if person["exekutive"]:
        detail["fraktionsprotokolle:exekutive"] = person["exekutive"]
    if person["sonstiges"]:
        detail["fraktionsprotokolle:sonstiges"] = person["sonstiges"]
    if person["occupation_structured"]:
        detail["fraktionsprotokolle:occupation_kgparl"] = person["occupation_structured"]
    if person["alt_names"]:
        detail["fraktionsprotokolle:alt_names"] = person["alt_names"]

    return detail
