#!/usr/bin/env python3
"""Tests for the ParlaBio build pipeline.

Run: python -m parlabio.tests.test_build   (from repo root)
  or: python parlabio/tests/test_build.py  (from repo root)
"""

import sys
from pathlib import Path

# Ensure the parlabio/ directory is on sys.path so `from build.xxx` imports work
_PARLABIO_DIR = Path(__file__).resolve().parent.parent
if str(_PARLABIO_DIR) not in sys.path:
    sys.path.insert(0, str(_PARLABIO_DIR))

# Repo root (parent of parlabio/)
_REPO_ROOT = _PARLABIO_DIR.parent


def test_date_parsing():
    """Unit tests for dates.py."""
    from build.dates import extract_year, parse_date_when, validate_date

    # extract_year
    assert extract_year("1930-10-20") == 1930
    assert extract_year("1930") == 1930
    assert extract_year("1930-05") == 1930
    assert extract_year(None) is None
    assert extract_year("") is None
    assert extract_year("-0322") is None, "BC dates should return None"
    assert extract_year("0001") is None, "Placeholder year should return None"
    assert extract_year("2917-11-20") is None, "Future dates should return None"
    assert extract_year("2025") == 2025, "Recent years should be valid"

    # parse_date_when
    assert parse_date_when("1930-10-20") == "1930-10-20"
    assert parse_date_when("1930 ") == "1930", "Should strip whitespace"
    assert parse_date_when("") is None
    assert parse_date_when(None) is None

    # validate_date
    issues = validate_date("2917-11-20", "test_person")
    assert len(issues) == 1
    assert "future" in issues[0].lower()

    issues = validate_date("1930-10-20", "test_person")
    assert len(issues) == 0

    issues = validate_date("0001", "test_person")
    assert len(issues) == 1
    assert "placeholder" in issues[0].lower()


def test_faction_normalization():
    """Unit tests for factions.py."""
    from build.factions import normalize_faction, is_faction

    assert normalize_faction(
        "Fraktion der Sozialdemokratischen Partei Deutschlands"
    ) == "SPD"
    assert normalize_faction(
        "Fraktion der Christlich Demokratischen Union/Christlich - Sozialen Union"
    ) == "CDU/CSU"
    assert normalize_faction("Fraktionslos") == "Fraktionslos"
    assert normalize_faction("Fraktion der SPD (Gast)") == "SPD (Gast)"
    assert normalize_faction("Ausschuss für Arbeit und Soziales") is None

    assert is_faction("Fraktion der Sozialdemokratischen Partei Deutschlands")
    assert not is_faction("Ausschuss für Arbeit und Soziales")
    assert not is_faction("Bundesministerium der Finanzen")


def test_quality_report():
    """Unit tests for quality.py."""
    from build.quality import QualityReport

    report = QualityReport()
    assert report.issue_count == 0

    report.add("test_cat", "person1", "msg1")
    report.add("test_cat", "person2", "msg2")
    report.add("other_cat", "person3", "msg3")

    assert report.issue_count == 3
    d = report.to_dict()
    assert d["total_issues"] == 3
    assert d["categories"]["test_cat"]["count"] == 2
    assert d["categories"]["other_cat"]["count"] == 1


def test_full_parse():
    """Integration test: parse the full Personen.xml."""
    from lxml import etree
    from build.parser import parse_persons
    from build.quality import QualityReport

    xml_path = _REPO_ROOT / "xml_quellen" / "Normdaten" / "Personen.xml"
    if not xml_path.exists():
        print(f"  SKIP: {xml_path} not found")
        return

    tree = etree.parse(str(xml_path))
    report = QualityReport()
    persons = parse_persons(tree, report)

    # We expect ~11,250 minus placeholder persons
    assert len(persons) >= 11200, f"Expected >= 11200 persons, got {len(persons)}"
    assert len(persons) <= 11300, f"Expected <= 11300 persons, got {len(persons)}"

    # Check all three types present
    types = {p["type"] for p in persons}
    assert "MdB" in types, "MdB type missing"
    assert "Other" in types, "Other type missing"
    assert "Mitarbeiter-KGParl" in types, "Mitarbeiter-KGParl type missing"

    # Check a known MdB person: Manfred Abelein
    persons_by_id = {p["id"]: p for p in persons}
    abelein = persons_by_id.get("AbeleinManfred_1965-10-19")
    assert abelein is not None, "Abelein not found"
    assert abelein["name"]["surname"] == "Abelein"
    assert abelein["name"]["forename"] == "Manfred"
    assert abelein["sex"] == "m"
    assert abelein["birth"]["date"] == "1930-10-20"
    assert abelein["birth"]["place"] == "Stuttgart"
    assert abelein["ids"]["mdb_stammdaten"] == "11000001"
    assert len(abelein["affiliations"]) == 7, (
        f"Abelein should have 7 Wahlperioden, got {len(abelein['affiliations'])}"
    )

    # Check type counts
    mdb_count = sum(1 for p in persons if p["type"] == "MdB")
    other_count = sum(1 for p in persons if p["type"] == "Other")
    mitarbeiter_count = sum(1 for p in persons if p["type"] == "Mitarbeiter-KGParl")
    print(f"    Types: MdB={mdb_count}, Other={other_count}, Mitarbeiter={mitarbeiter_count}")

    # No parse errors should have occurred
    report_dict = report.to_dict()
    parse_errors = report_dict["categories"].get("parse_error", {}).get("count", 0)
    assert parse_errors == 0, f"Expected 0 parse errors, got {parse_errors}"

    print(f"    Quality issues: {report.issue_count}")


def test_edge_cases():
    """Spot checks on known edge cases."""
    from lxml import etree
    from build.parser import parse_persons
    from build.transform import build_search_entry, build_detail_entry
    from build.quality import QualityReport

    xml_path = _REPO_ROOT / "xml_quellen" / "Normdaten" / "Personen.xml"
    if not xml_path.exists():
        print(f"  SKIP: {xml_path} not found")
        return

    tree = etree.parse(str(xml_path))
    report = QualityReport()
    persons = parse_persons(tree, report)
    persons_by_id = {p["id"]: p for p in persons}

    # Maiden name in reg
    ackermann = persons_by_id.get("AckermannAnnemarie_1953-10-06")
    if ackermann:
        assert "geb." in ackermann["name"]["reg"], "Maiden name should be in reg field"
        search = build_search_entry(ackermann, report)
        assert "Ackermann" in search["name"]

    # VIAF inconsistency (Leburton has type="Viaf")
    leburton = persons_by_id.get("LeburtonEdmond")
    if leburton:
        assert leburton["ids"]["viaf"] is not None, "Leburton should have VIAF"

    # Noble title
    adelmann = persons_by_id.get("AdelmannRaban_1957-10-15")
    if adelmann:
        assert adelmann["name"]["role_name"] == "Graf", (
            f"Expected role_name 'Graf', got '{adelmann['name']['role_name']}'"
        )

    # Place addition
    # Find any person with a non-empty place in name
    persons_with_place = [p for p in persons if p["name"]["place"]]
    assert len(persons_with_place) > 0, "Should find persons with place additions"

    # Mitarbeiter-KGParl with structured occupation
    mitarbeiter = [p for p in persons if p["type"] == "Mitarbeiter-KGParl"]
    assert len(mitarbeiter) > 0
    has_occupation = [p for p in mitarbeiter if p["occupation_structured"]]
    assert len(has_occupation) > 0, "Some Mitarbeiter should have structured occupation"

    # Placeholder persons should not be in the list
    assert "MdB_Genderunbekannt" not in persons_by_id
    assert "xy_ersetzen" not in persons_by_id

    # Search entry transformation
    if ackermann:
        search = build_search_entry(ackermann, report)
        assert search["type"] == "MdB"
        assert len(search["factions"]) > 0
        assert len(search["periods"]) > 0

    # Detail entry transformation (JSON-LD)
    abelein = persons_by_id.get("AbeleinManfred_1965-10-19")
    if abelein:
        detail = build_detail_entry(abelein, report)
        # Schema.org fields
        assert detail["@context"]["@vocab"] == "https://schema.org/"
        assert detail["@context"]["fraktionsprotokolle"] == "https://fraktionsprotokolle.de/ns/"
        assert detail["@type"] == "Person"
        assert detail["@id"] == "https://fraktionsprotokolle.de/parlabio/#/person/AbeleinManfred_1965-10-19"
        assert detail["familyName"] == "Abelein"
        assert detail["givenName"] == "Manfred"
        assert detail["birthDate"] == "1930-10-20"
        assert detail["gender"] == "https://schema.org/Male"
        assert detail["birthPlace"]["@type"] == "Place"
        assert "memberOf" in detail
        assert len(detail["memberOf"]) > 0
        assert "sameAs" in detail
        # Project-specific fields
        affs = detail["fraktionsprotokolle:affiliations"]
        assert affs[0]["faction"] == "CDU/CSU"
        assert affs[0]["faction_full"].startswith("Fraktion der")
        assert detail["fraktionsprotokolle:ids"]["gnd"] is not None


def test_beacon():
    """Test BEACON generation."""
    from build.beacon import generate_beacon_lines

    test_persons = [
        {"id": "TestPerson1", "ids": {"gnd": "https://d-nb.info/gnd/123456"}},
        {"id": "TestPerson2", "ids": {"gnd": None}},
        {"id": "TestPerson3", "ids": {"gnd": "https://d-nb.info/gnd/789012"}},
    ]

    lines = generate_beacon_lines(test_persons)
    # Should have header + 2 data lines (person2 has no GND)
    data_lines = [l for l in lines if not l.startswith("#") and l.strip()]
    assert len(data_lines) == 2
    assert "123456||TestPerson1" in data_lines[0]
    assert "789012||TestPerson3" in data_lines[1]


if __name__ == "__main__":
    tests = [
        test_date_parsing,
        test_faction_normalization,
        test_quality_report,
        test_beacon,
        test_full_parse,
        test_edge_cases,
    ]

    failures = 0
    for test in tests:
        try:
            test()
            print(f"  PASS: {test.__name__}")
        except AssertionError as e:
            print(f"  FAIL: {test.__name__}: {e}")
            failures += 1
        except Exception as e:
            print(f"  ERROR: {test.__name__}: {type(e).__name__}: {e}")
            failures += 1

    print(f"\n{'All tests passed!' if failures == 0 else f'{failures} test(s) failed.'}")
    sys.exit(1 if failures else 0)
