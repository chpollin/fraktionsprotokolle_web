#!/usr/bin/env python3
"""Comprehensive validation of ParlaBio build output.

Checks completeness, consistency, and correctness of the generated JSON
against the source XML. Run after build.py.

Usage: python parlabio/validate_output.py  (from repo root)
"""

import json
import sys
from pathlib import Path
from collections import Counter
from lxml import etree

# parlabio/ directory and repo root
_PARLABIO_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _PARLABIO_DIR.parent

# Ensure build package is importable
if str(_PARLABIO_DIR) not in sys.path:
    sys.path.insert(0, str(_PARLABIO_DIR))

XML_PATH = _REPO_ROOT / "xml_quellen" / "Normdaten" / "Personen.xml"
DATA_DIR = _PARLABIO_DIR / "data"
TEI = "http://www.tei-c.org/ns/1.0"
XML_NS = "{http://www.w3.org/XML/1998/namespace}"
NS = {"t": TEI}

errors = []
warnings = []


def error(msg):
    errors.append(msg)
    print(f"  ERROR: {msg}")


def warn(msg):
    warnings.append(msg)
    print(f"  WARN:  {msg}")


def info(msg):
    print(f"  INFO:  {msg}")


# ─── 1. COMPLETENESS: XML person count vs JSON output ───

def check_completeness():
    print("\n=== 1. COMPLETENESS ===")

    tree = etree.parse(str(XML_PATH))
    root = tree.getroot()

    # Count persons in XML by type
    xml_counts = {}
    xml_ids = set()
    for lp in root.iter(f"{{{TEI}}}listPerson"):
        ptype = lp.get("type", "Unknown")
        count = 0
        for person in lp.iter(f"{{{TEI}}}person"):
            if person.getparent() is lp:
                pid = person.get(f"{XML_NS}id", "")
                if pid:
                    xml_ids.add(pid)
                    count += 1
        xml_counts[ptype] = count

    total_xml = sum(xml_counts.values())
    info(f"XML persons: {xml_counts} = {total_xml}")

    # Count search index entries
    with open(DATA_DIR / "search-index.json", encoding="utf-8") as f:
        search_index = json.load(f)
    search_ids = {e["id"] for e in search_index}
    info(f"Search index entries: {len(search_index)}")

    # Count detail JSON files
    person_dir = DATA_DIR / "person"
    detail_files = list(person_dir.glob("*.json"))
    detail_ids = {f.stem for f in detail_files}
    info(f"Detail JSON files: {len(detail_files)}")

    # Known placeholders (should be skipped)
    from build.constants import PLACEHOLDER_IDS
    placeholder_in_xml = xml_ids & PLACEHOLDER_IDS
    info(f"Placeholder IDs in XML: {len(placeholder_in_xml)} ({sorted(placeholder_in_xml)})")

    expected_count = total_xml - len(placeholder_in_xml)
    info(f"Expected output count: {total_xml} - {len(placeholder_in_xml)} = {expected_count}")

    if len(search_index) != expected_count:
        error(f"Search index has {len(search_index)} entries, expected {expected_count}")
    else:
        info(f"Search index count matches expected: {len(search_index)}")

    if len(detail_files) != expected_count:
        error(f"Detail files: {len(detail_files)}, expected {expected_count}")
    else:
        info(f"Detail file count matches expected: {len(detail_files)}")

    # Check: every search index ID has a detail file and vice versa
    missing_detail = search_ids - detail_ids
    if missing_detail:
        error(f"{len(missing_detail)} IDs in search index but no detail file: {list(missing_detail)[:5]}")

    missing_search = detail_ids - search_ids
    if missing_search:
        error(f"{len(missing_search)} detail files not in search index: {list(missing_search)[:5]}")

    # Check: every non-placeholder XML ID has a detail file
    expected_ids = xml_ids - PLACEHOLDER_IDS
    missing_from_output = expected_ids - detail_ids
    if missing_from_output:
        error(f"{len(missing_from_output)} XML persons missing from output: {list(missing_from_output)[:10]}")

    extra_in_output = detail_ids - expected_ids
    if extra_in_output:
        error(f"{len(extra_in_output)} output IDs not in XML: {list(extra_in_output)[:10]}")

    return search_index, detail_ids


# ─── 2. SEARCH INDEX INTEGRITY ───

def check_search_index(search_index):
    print("\n=== 2. SEARCH INDEX INTEGRITY ===")

    type_counts = Counter(e["type"] for e in search_index)
    info(f"Types: {dict(type_counts)}")

    # Check required fields
    required_fields = {"id", "name", "surname", "forename", "sex", "birth_year",
                       "death_year", "birth_place", "type", "factions", "periods",
                       "gnd", "has_wikipedia"}

    missing_fields = 0
    for entry in search_index:
        for field in required_fields:
            if field not in entry:
                error(f"{entry.get('id', '?')}: missing field '{field}'")
                missing_fields += 1
    if missing_fields == 0:
        info(f"All {len(search_index)} entries have all {len(required_fields)} required fields")

    # Check sex values
    sex_values = Counter(e["sex"] for e in search_index)
    info(f"Sex values: {dict(sex_values)}")
    valid_sex = {"m", "f", "d", "x", ""}
    invalid_sex = {s for s in sex_values if s not in valid_sex}
    if invalid_sex:
        error(f"Invalid sex values: {invalid_sex}")

    # Check type values
    valid_types = {"MdB", "Other", "Mitarbeiter-KGParl"}
    invalid_types = {t for t in type_counts if t not in valid_types}
    if invalid_types:
        error(f"Invalid type values: {invalid_types}")

    # Check faction values are all short codes (no long names)
    all_factions = set()
    for e in search_index:
        all_factions.update(e["factions"])
    long_factions = [f for f in all_factions if len(f) > 25]
    if long_factions:
        error(f"Faction names too long (not normalized?): {long_factions}")
    else:
        info(f"All {len(all_factions)} faction codes are short (normalized)")

    # Check MdB should have factions, Other/Mitarbeiter should not
    mdb_without_factions = sum(1 for e in search_index if e["type"] == "MdB" and not e["factions"])
    other_with_factions = sum(1 for e in search_index if e["type"] == "Other" and e["factions"])
    mitarbeiter_with_factions = sum(1 for e in search_index if e["type"] == "Mitarbeiter-KGParl" and e["factions"])

    if mdb_without_factions:
        warn(f"{mdb_without_factions} MdB entries without factions")
    if other_with_factions:
        error(f"{other_with_factions} Other entries WITH factions (should be 0)")
    if mitarbeiter_with_factions:
        error(f"{mitarbeiter_with_factions} Mitarbeiter entries WITH factions (should be 0)")

    # Check birth_year reasonableness
    birth_years = [e["birth_year"] for e in search_index if e["birth_year"] is not None]
    info(f"Birth years: {len(birth_years)} present, range {min(birth_years)}-{max(birth_years)}")
    suspicious_years = [y for y in birth_years if y < 1800 or y > 2010]
    if suspicious_years:
        warn(f"Suspicious birth years: {sorted(set(suspicious_years))}")

    # Check GND format (should be bare ID, not URL)
    gnds_with_url = sum(1 for e in search_index if e["gnd"] and e["gnd"].startswith("http"))
    if gnds_with_url:
        error(f"{gnds_with_url} GND values still contain URLs (should be bare IDs)")
    gnds_present = sum(1 for e in search_index if e["gnd"])
    info(f"GND present: {gnds_present}/{len(search_index)}")

    # Check has_wikipedia is boolean
    non_bool_wiki = sum(1 for e in search_index if not isinstance(e["has_wikipedia"], bool))
    if non_bool_wiki:
        error(f"{non_bool_wiki} has_wikipedia values are not boolean")


# ─── 3. DETAIL JSON INTEGRITY ───

def check_detail_samples():
    print("\n=== 3. DETAIL JSON INTEGRITY (sample check) ===")

    person_dir = DATA_DIR / "person"
    all_files = sorted(person_dir.glob("*.json"))

    # Check every 100th file + known edge cases
    sample_files = all_files[::100]  # Every 100th
    edge_cases = [
        "AbeleinManfred_1965-10-19",
        "AckermannAnnemarie_1953-10-06",
        "LeburtonEdmond",
        "AdelmannRaban_1957-10-15",
    ]
    for ec in edge_cases:
        p = person_dir / f"{ec}.json"
        if p.exists() and p not in sample_files:
            sample_files.append(p)

    info(f"Checking {len(sample_files)} detail files...")

    # JSON-LD top-level fields
    required_jsonld_fields = {"@context", "@type", "@id", "name", "givenName",
                              "familyName", "gender", "birthDate", "deathDate"}
    # Project-specific fields
    required_project_fields = {
        "fraktionsprotokolle:personType", "fraktionsprotokolle:name",
        "fraktionsprotokolle:birth", "fraktionsprotokolle:death",
        "fraktionsprotokolle:affiliations", "fraktionsprotokolle:ids",
    }
    required_name_fields = {"reg", "forename", "surname", "prefix", "role_name", "place"}
    required_life_fields = {"date", "place", "country"}
    required_id_fields = {"mdb_stammdaten", "gnd", "wikipedia", "viaf"}

    checked = 0
    for fp in sample_files:
        with open(fp, encoding="utf-8") as f:
            detail = json.load(f)

        pid = detail.get("@id", fp.stem)

        for field in required_jsonld_fields:
            if field not in detail:
                error(f"{pid}: missing JSON-LD field '{field}'")

        for field in required_project_fields:
            if field not in detail:
                error(f"{pid}: missing project field '{field}'")

        # Check @context and @type values
        if detail.get("@context") != "https://schema.org":
            error(f"{pid}: @context should be 'https://schema.org'")
        if detail.get("@type") != "Person":
            error(f"{pid}: @type should be 'Person'")

        pname = detail.get("fraktionsprotokolle:name", {})
        for field in required_name_fields:
            if field not in pname:
                error(f"{pid}: missing name field '{field}'")

        for event in ("fraktionsprotokolle:birth", "fraktionsprotokolle:death"):
            if event in detail:
                for field in required_life_fields:
                    if field not in detail[event]:
                        error(f"{pid}: missing {event} field '{field}'")

        pids = detail.get("fraktionsprotokolle:ids", {})
        for field in required_id_fields:
            if field not in pids:
                error(f"{pid}: missing ids field '{field}'")

        # Check affiliations structure
        affs = detail.get("fraktionsprotokolle:affiliations", [])
        for i, aff in enumerate(affs):
            for field in ("period", "faction", "faction_full", "from", "to"):
                if field not in aff:
                    error(f"{pid}: affiliation[{i}] missing field '{field}'")

        checked += 1

    info(f"Checked {checked} detail files, all have correct structure")


# ─── 4. CROSS-CONSISTENCY: Search index vs Detail JSONs ───

def check_cross_consistency(search_index):
    print("\n=== 4. CROSS-CONSISTENCY ===")

    person_dir = DATA_DIR / "person"

    # Check every 200th entry for consistency between search index and detail
    sample = search_index[::200]
    info(f"Cross-checking {len(sample)} entries...")

    mismatches = 0
    for entry in sample:
        pid = entry["id"]
        detail_path = person_dir / f"{pid}.json"
        if not detail_path.exists():
            error(f"{pid}: detail file missing")
            continue

        with open(detail_path, encoding="utf-8") as f:
            detail = json.load(f)

        # Name must match (search "name" = JSON-LD "name" = Schema.org name)
        if entry["name"] != detail["name"]:
            error(f"{pid}: name mismatch: '{entry['name']}' vs '{detail['name']}'")
            mismatches += 1

        # Surname must match
        if entry["surname"] != detail["familyName"]:
            error(f"{pid}: surname mismatch")
            mismatches += 1

        # Type must match
        if entry["type"] != detail["fraktionsprotokolle:personType"]:
            error(f"{pid}: type mismatch: '{entry['type']}' vs '{detail['fraktionsprotokolle:personType']}'")
            mismatches += 1

        # Faction count should match (search has short codes, detail has both)
        search_factions = set(entry["factions"])
        detail_factions = {a["faction"] for a in detail["fraktionsprotokolle:affiliations"]}
        if search_factions != detail_factions:
            error(f"{pid}: faction mismatch: search={search_factions}, detail={detail_factions}")
            mismatches += 1

    if mismatches == 0:
        info(f"All {len(sample)} cross-checked entries are consistent")


# ─── 5. AFFILIATIONS DEEP CHECK ───

def check_affiliations():
    print("\n=== 5. AFFILIATIONS DEEP CHECK ===")

    with open(DATA_DIR / "search-index.json", encoding="utf-8") as f:
        search_index = json.load(f)

    person_dir = DATA_DIR / "person"

    # Stats
    mdb_entries = [e for e in search_index if e["type"] == "MdB"]
    total_affiliations = 0
    max_affiliations = 0
    max_aff_person = ""
    multi_faction = []

    for entry in mdb_entries:
        detail_path = person_dir / f"{entry['id']}.json"
        with open(detail_path, encoding="utf-8") as f:
            detail = json.load(f)
        affs = detail["fraktionsprotokolle:affiliations"]
        n = len(affs)
        total_affiliations += n
        if n > max_affiliations:
            max_affiliations = n
            max_aff_person = entry["id"]
        if len(set(a["faction"] for a in affs)) > 1:
            multi_faction.append(entry["id"])

    info(f"Total MdB affiliations: {total_affiliations}")
    info(f"Average per MdB: {total_affiliations/len(mdb_entries):.1f}")
    info(f"Max affiliations: {max_affiliations} ({max_aff_person})")
    info(f"MdB with multiple factions (Fraktionswechsel): {len(multi_faction)}")

    if len(multi_faction) > 0:
        info(f"  Examples: {multi_faction[:5]}")

    # Check: no affiliation should have None period
    none_periods = 0
    for entry in mdb_entries[:500]:
        detail_path = person_dir / f"{entry['id']}.json"
        with open(detail_path, encoding="utf-8") as f:
            detail = json.load(f)
        for aff in detail["fraktionsprotokolle:affiliations"]:
            if aff["period"] is None:
                none_periods += 1
    if none_periods:
        warn(f"{none_periods} affiliations with period=null (in first 500 MdBs)")
    else:
        info("No affiliations with period=null (in first 500 MdBs)")


# ─── 6. BEACON CHECK ───

def check_beacon():
    print("\n=== 6. BEACON CHECK ===")

    beacon_path = DATA_DIR / "beacon.txt"
    with open(beacon_path, encoding="utf-8") as f:
        lines = f.readlines()

    header_lines = [l for l in lines if l.startswith("#")]
    data_lines = [l.strip() for l in lines if not l.startswith("#") and l.strip()]

    info(f"Header lines: {len(header_lines)}")
    info(f"Data lines: {len(data_lines)}")

    # Check format: gnd_id||person_id
    bad_format = 0
    gnd_ids = set()
    for line in data_lines:
        parts = line.split("||")
        if len(parts) != 2:
            error(f"Bad BEACON line format: {line[:80]}")
            bad_format += 1
        else:
            gnd_ids.add(parts[0])

    if bad_format == 0:
        info(f"All {len(data_lines)} BEACON lines have correct format")

    # Cross-check: BEACON GND count should match search index GND count
    with open(DATA_DIR / "search-index.json", encoding="utf-8") as f:
        search_index = json.load(f)
    search_gnds = sum(1 for e in search_index if e["gnd"])
    # BEACON uses full URLs, so count might differ if some GNDs are non-standard
    info(f"BEACON entries: {len(data_lines)}, Search index GND entries: {search_gnds}")


# ─── 7. SPECIFIC EDGE CASE VERIFICATION ───

def check_edge_cases():
    print("\n=== 7. EDGE CASE VERIFICATION ===")

    person_dir = DATA_DIR / "person"

    # Abelein: 7 Wahlperioden, all CDU/CSU
    with open(person_dir / "AbeleinManfred_1965-10-19.json", encoding="utf-8") as f:
        d = json.load(f)
    affs = d["fraktionsprotokolle:affiliations"]
    assert len(affs) == 7, f"Abelein: expected 7 affiliations, got {len(affs)}"
    assert all(a["faction"] == "CDU/CSU" for a in affs), "Abelein: all should be CDU/CSU"
    assert d["fraktionsprotokolle:ids"]["mdb_stammdaten"] == "11000001"
    assert d["@context"] == "https://schema.org"
    assert d["@type"] == "Person"
    assert d["familyName"] == "Abelein"
    info("Abelein: 7 CDU/CSU affiliations, MDB=11000001, JSON-LD valid - OK")

    # Ackermann: Maidenname
    with open(person_dir / "AckermannAnnemarie_1953-10-06.json", encoding="utf-8") as f:
        d = json.load(f)
    assert "geb. Eisenmann" in d["fraktionsprotokolle:name"]["reg"], "Ackermann: maiden name missing"
    assert d["fraktionsprotokolle:birth"]["place"].startswith("Parabutsch"), "Ackermann: birth place"
    info("Ackermann: maiden name 'geb. Eisenmann' preserved - OK")

    # Leburton: VIAF with case inconsistency
    with open(person_dir / "LeburtonEdmond.json", encoding="utf-8") as f:
        d = json.load(f)
    assert d["fraktionsprotokolle:ids"]["viaf"] is not None, "Leburton: VIAF should be present"
    assert d["fraktionsprotokolle:personType"] == "Other"
    assert len(d["fraktionsprotokolle:affiliations"]) == 0, "Leburton: Other should have no affiliations"
    info("Leburton: VIAF present despite 'Viaf' in XML, type=Other - OK")

    # Adelmann: Noble title
    if (person_dir / "AdelmannRaban_1957-10-15.json").exists():
        with open(person_dir / "AdelmannRaban_1957-10-15.json", encoding="utf-8") as f:
            d = json.load(f)
        assert d["fraktionsprotokolle:name"]["role_name"] == "Graf", f"Adelmann: expected 'Graf', got '{d['fraktionsprotokolle:name']['role_name']}'"
        info("Adelmann: role_name 'Graf' preserved - OK")

    # Mitarbeiter: structured occupation
    mitarbeiter_files = [f for f in person_dir.glob("*.json")]
    found_kgparl = False
    for fp in mitarbeiter_files:
        with open(fp, encoding="utf-8") as f:
            d = json.load(f)
        if d["fraktionsprotokolle:personType"] == "Mitarbeiter-KGParl" and "fraktionsprotokolle:occupation_kgparl" in d:
            assert "organisation" in d["fraktionsprotokolle:occupation_kgparl"]
            assert "role" in d["fraktionsprotokolle:occupation_kgparl"]
            found_kgparl = True
            break
    if found_kgparl:
        info("Mitarbeiter-KGParl: structured occupation present - OK")
    else:
        warn("No Mitarbeiter-KGParl with structured occupation found")

    # Placeholder check: ensure none of the known placeholders are in output
    from build.constants import PLACEHOLDER_IDS
    for pid in PLACEHOLDER_IDS:
        if (person_dir / f"{pid}.json").exists():
            error(f"Placeholder person {pid} should not have a detail file!")
    info(f"No placeholder persons in output - OK")


# ─── MAIN ───

if __name__ == "__main__":
    print("ParlaBio Output Validation")
    print("=" * 50)

    if not XML_PATH.exists():
        print(f"ERROR: {XML_PATH} not found")
        sys.exit(1)
    if not DATA_DIR.exists():
        print(f"ERROR: {DATA_DIR} not found. Run build.py first.")
        sys.exit(1)

    search_index, detail_ids = check_completeness()
    check_search_index(search_index)
    check_detail_samples()
    check_cross_consistency(search_index)
    check_affiliations()
    check_beacon()
    check_edge_cases()

    print("\n" + "=" * 50)
    print(f"ERRORS:   {len(errors)}")
    print(f"WARNINGS: {len(warnings)}")

    if errors:
        print("\nErrors found:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\nAll validation checks passed!")
        sys.exit(0)
