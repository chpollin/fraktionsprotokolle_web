#!/usr/bin/env python3
"""Smoke tests against the actual build output.

Validates the data contract between the build pipeline and the frontend:
- search-index.json has all 3 person types with expected keys
- Detail JSONs have required fields per type
- BEACON line count matches GND count in the index

Run:  python parlabio/tests/test_build_output.py          (from repo root)
  or: python -m pytest parlabio/tests/test_build_output.py (with pytest)
"""

import json
import random
import sys
import unittest
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_DOCS_DATA = _REPO_ROOT / "docs" / "data"

# Skip all tests if build output doesn't exist
_HAS_DATA = (_DOCS_DATA / "search-index.json").exists()


def _load_index():
    with open(_DOCS_DATA / "search-index.json", encoding="utf-8") as f:
        return json.load(f)


def _load_detail(person_id):
    path = _DOCS_DATA / "person" / f"{person_id}.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@unittest.skipUnless(_HAS_DATA, "Build output not found in docs/data/")
class TestSearchIndex(unittest.TestCase):
    """Tests against search-index.json."""

    @classmethod
    def setUpClass(cls):
        cls.index = _load_index()
        cls.by_type = {}
        for p in cls.index:
            t = p.get("type", "MISSING")
            cls.by_type.setdefault(t, []).append(p)

    def test_index_not_empty(self):
        self.assertGreater(len(self.index), 0)

    def test_all_three_types_present(self):
        """search-index.json must contain MdB, Other, and Mitarbeiter-KGParl."""
        expected = {"MdB", "Other", "Mitarbeiter-KGParl"}
        actual = set(self.by_type.keys())
        self.assertTrue(
            expected.issubset(actual),
            f"Missing types: {expected - actual}. Found: {actual}",
        )

    def test_type_counts_plausible(self):
        """Each type should have a minimum number of entries."""
        self.assertGreater(len(self.by_type.get("MdB", [])), 3000)
        self.assertGreater(len(self.by_type.get("Other", [])), 5000)
        self.assertGreater(len(self.by_type.get("Mitarbeiter-KGParl", [])), 10)

    def test_required_fields_present(self):
        """Every index entry must have id, name, type."""
        required = {"id", "name", "type"}
        for p in self.index:
            missing = required - set(p.keys())
            self.assertFalse(
                missing,
                f"Entry {p.get('id', '?')} missing fields: {missing}",
            )

    def test_no_unknown_types(self):
        """Only the 3 known types should appear."""
        allowed = {"MdB", "Other", "Mitarbeiter-KGParl"}
        unknown = set(self.by_type.keys()) - allowed
        self.assertFalse(unknown, f"Unknown types in index: {unknown}")


@unittest.skipUnless(_HAS_DATA, "Build output not found in docs/data/")
class TestDetailJsons(unittest.TestCase):
    """Spot-check detail JSONs per type."""

    REQUIRED_FIELDS = {"@context", "@type", "name", "fraktionsprotokolle:personType"}
    SAMPLE_SIZE = 5

    @classmethod
    def setUpClass(cls):
        cls.index = _load_index()
        cls.by_type = {}
        for p in cls.index:
            cls.by_type.setdefault(p.get("type"), []).append(p)

    def _sample_ids(self, person_type):
        pool = self.by_type.get(person_type, [])
        k = min(self.SAMPLE_SIZE, len(pool))
        return [p["id"] for p in random.sample(pool, k)]

    def _check_detail(self, person_id):
        detail = _load_detail(person_id)
        missing = self.REQUIRED_FIELDS - set(detail.keys())
        self.assertFalse(
            missing,
            f"Detail {person_id} missing: {missing}",
        )
        # Must have at least one identifier
        ids = detail.get("fraktionsprotokolle:ids") or {}
        same_as = detail.get("sameAs") or []
        has_id = any(ids.values()) or len(same_as) > 0 or detail.get("@id")
        self.assertTrue(
            has_id,
            f"Detail {person_id} has no identifiers (ids, sameAs, or @id)",
        )

    def test_mdb_details(self):
        for pid in self._sample_ids("MdB"):
            with self.subTest(person=pid):
                self._check_detail(pid)

    def test_other_details(self):
        for pid in self._sample_ids("Other"):
            with self.subTest(person=pid):
                self._check_detail(pid)

    def test_kgparl_details(self):
        for pid in self._sample_ids("Mitarbeiter-KGParl"):
            with self.subTest(person=pid):
                self._check_detail(pid)

    def test_exekutive_is_string_or_list(self):
        """exekutive field (if present) must be a string or list, not other."""
        # Check the one known person with exekutive
        for p in self.index:
            detail_path = _DOCS_DATA / "person" / f"{p['id']}.json"
            if not detail_path.exists():
                continue
            detail = json.loads(detail_path.read_text(encoding="utf-8"))
            val = detail.get("fraktionsprotokolle:exekutive")
            if val is not None:
                self.assertIsInstance(
                    val, (str, list),
                    f"{p['id']}: exekutive is {type(val).__name__}, expected str or list",
                )

    def test_sonstiges_is_string_or_list(self):
        """sonstiges field (if present) must be a string or list."""
        # Spot-check 50 random persons
        sample = random.sample(self.index, min(50, len(self.index)))
        for p in sample:
            detail_path = _DOCS_DATA / "person" / f"{p['id']}.json"
            if not detail_path.exists():
                continue
            detail = json.loads(detail_path.read_text(encoding="utf-8"))
            val = detail.get("fraktionsprotokolle:sonstiges")
            if val is not None:
                self.assertIsInstance(
                    val, (str, list),
                    f"{p['id']}: sonstiges is {type(val).__name__}, expected str or list",
                )

    def test_alt_names_structure(self):
        """alt_names entries must be strings or objects with a 'reg' field."""
        sample = random.sample(self.index, min(50, len(self.index)))
        for p in sample:
            detail_path = _DOCS_DATA / "person" / f"{p['id']}.json"
            if not detail_path.exists():
                continue
            detail = json.loads(detail_path.read_text(encoding="utf-8"))
            alt = detail.get("fraktionsprotokolle:alt_names", [])
            for entry in alt:
                if isinstance(entry, dict):
                    self.assertIn(
                        "reg", entry,
                        f"{p['id']}: alt_names object missing 'reg' field",
                    )
                else:
                    self.assertIsInstance(entry, str)

    def test_occupation_kgparl_structure(self):
        """occupation_kgparl must be a dict or list of dicts with 'role'."""
        for p in self.by_type.get("Mitarbeiter-KGParl", []):
            detail_path = _DOCS_DATA / "person" / f"{p['id']}.json"
            if not detail_path.exists():
                continue
            detail = json.loads(detail_path.read_text(encoding="utf-8"))
            occ = detail.get("fraktionsprotokolle:occupation_kgparl")
            if occ is None:
                continue
            items = occ if isinstance(occ, list) else [occ]
            for item in items:
                self.assertIsInstance(item, dict, f"{p['id']}: occupation_kgparl entry is not a dict")
                self.assertIn("role", item, f"{p['id']}: occupation_kgparl missing 'role'")


@unittest.skipUnless(_HAS_DATA, "Build output not found in docs/data/")
class TestBeacon(unittest.TestCase):
    """Tests against beacon.txt."""

    def test_beacon_line_count_matches_gnd_count(self):
        """BEACON data lines must equal the number of GND entries in the index."""
        index = _load_index()
        gnd_count = sum(1 for p in index if p.get("gnd"))

        beacon_path = _DOCS_DATA / "beacon.txt"
        self.assertTrue(beacon_path.exists(), "beacon.txt not found")

        with open(beacon_path, encoding="utf-8") as f:
            data_lines = [
                line for line in f
                if line.strip() and not line.startswith("#")
            ]

        self.assertEqual(
            len(data_lines),
            gnd_count,
            f"BEACON has {len(data_lines)} entries, index has {gnd_count} GND entries",
        )


@unittest.skipUnless((_REPO_ROOT / "docs" / "index.html").exists(), "docs/ not found")
class TestFrontendAssets(unittest.TestCase):
    """Static checks on frontend files (AP3 Phase 2)."""

    def test_favicon_exists(self):
        """Favicon SVG must exist."""
        self.assertTrue(
            (_REPO_ROOT / "docs" / "img" / "favicon.svg").exists(),
            "docs/img/favicon.svg not found",
        )

    def test_favicon_referenced_in_html(self):
        """index.html must reference the favicon."""
        html = (_REPO_ROOT / "docs" / "index.html").read_text(encoding="utf-8")
        self.assertIn('rel="icon"', html, "No favicon link in index.html")
        self.assertIn("favicon.svg", html, "Favicon link does not point to favicon.svg")

    def test_page_guard_in_app(self):
        """app.js must use replaceState for page-out-of-range correction."""
        js = (_REPO_ROOT / "docs" / "js" / "app.js").read_text(encoding="utf-8")
        self.assertIn("replaceState", js)

    def test_error_handling_in_app(self):
        """app.js must have separate error messages for fetch vs render errors."""
        js = (_REPO_ROOT / "docs" / "js" / "app.js").read_text(encoding="utf-8")
        self.assertIn("Netzwerkfehler", js)
        self.assertIn("Fehler bei der Darstellung", js)

    def test_career_timeline_in_detail(self):
        """render-detail.js must contain career timeline markup."""
        js = (_REPO_ROOT / "docs" / "js" / "render-detail.js").read_text(encoding="utf-8")
        self.assertIn("career-timeline", js)

    def test_citation_in_detail(self):
        """render-detail.js must contain citation section with BibTeX."""
        js = (_REPO_ROOT / "docs" / "js" / "render-detail.js").read_text(encoding="utf-8")
        self.assertIn("citation-section", js)
        self.assertIn("BibTeX", js)

    def test_sort_select_in_render(self):
        """render.js must contain sort dropdown."""
        js = (_REPO_ROOT / "docs" / "js" / "render.js").read_text(encoding="utf-8")
        self.assertIn("sort-select", js)


if __name__ == "__main__":
    unittest.main()
