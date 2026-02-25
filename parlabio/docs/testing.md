# Testen und Validieren

## Voraussetzungen

```bash
pip install lxml
```

## Tests ausführen

Vom Repository-Root:

```bash
# Unit- und Integrationstests (Pipeline-Logik)
python parlabio/tests/test_build.py

# Smoke-Tests (Datenvertrag Pipeline ↔ Frontend)
python -m pytest parlabio/tests/test_build_output.py -v
```

### test_build.py – Unit- und Integrationstests

| Test | Typ | Beschreibung |
|------|-----|-------------|
| `test_date_parsing` | Unit | Datumsextraktion: ISO-Daten, v.-Chr., Platzhalter, Zukunft |
| `test_faction_normalization` | Unit | Fraktionsmapping und Ausschussfilterung |
| `test_quality_report` | Unit | QualityReport-Klasse: Zählung, Serialisierung |
| `test_beacon` | Unit | BEACON-Generierung mit GND-Filterung |
| `test_full_parse` | Integration | Vollständiges Parsen der Personen.xml (~11.225 Personen) |
| `test_edge_cases` | Integration | Maidennamen, VIAF-Inkonsistenz, Adelstitel, Ortszusätze |

### test_build_output.py – Smoke-Tests gegen Build-Ausgabe

Prüft den Datenvertrag zwischen Pipeline-Output und Frontend-Erwartungen. Setzt voraus, dass `docs/data/` existiert (nach `build.py --output docs/data`).

| Test | Beschreibung |
|------|-------------|
| `test_index_not_empty` | Suchindex enthält Einträge |
| `test_all_three_types_present` | Alle 3 Typen (`MdB`, `Other`, `Mitarbeiter-KGParl`) vorhanden |
| `test_type_counts_plausible` | Mindestanzahl pro Typ (MdB >3000, Other >5000, KGParl >10) |
| `test_required_fields_present` | Jeder Index-Eintrag hat `id`, `name`, `type` |
| `test_no_unknown_types` | Keine unbekannten Typen im Index |
| `test_mdb_details` | 5 MdB-Detail-JSONs: Pflichtfelder + Identifier |
| `test_other_details` | 5 Other-Detail-JSONs: Pflichtfelder + Identifier |
| `test_kgparl_details` | 5 KGParl-Detail-JSONs: Pflichtfelder + Identifier |
| `test_exekutive_is_string_or_list` | `exekutive`-Feld ist String oder Array |
| `test_sonstiges_is_string_or_list` | `sonstiges`-Feld ist String oder Array |
| `test_alt_names_structure` | `alt_names`-Einträge sind Strings oder Objekte mit `reg` |
| `test_occupation_kgparl_structure` | `occupation_kgparl` ist Dict oder Liste mit `role` |
| `test_beacon_line_count_matches_gnd_count` | BEACON-Zeilen == GND-Einträge im Index |

**Erwartete Ausgabe:**
```
  PASS: test_date_parsing
  PASS: test_faction_normalization
  PASS: test_quality_report
  PASS: test_beacon
    Types: MdB=4086, Other=7080, Mitarbeiter=59
    Quality issues: 126
  PASS: test_full_parse
  PASS: test_edge_cases

All tests passed!
```

## Build ausführen

```bash
python parlabio/build.py
```

**Erwartete Ausgabe:**
```
Parsing .../Personen.xml...
Parsed 11225 persons from 1 file(s)
  Written 11225 detail files to .../parlabio/data/person
  Written .../search-index.json (2,867,354 bytes, 11225 entries)
  Written .../quality-report.json (134 issues)
  Written .../beacon.txt (7408 entries)

Done. 11225 persons, 134 quality issues. (5.4s)
```

## Validierung ausführen

Nach dem Build:

```bash
python parlabio/validate_output.py
```

### Was wird validiert?

1. **Completeness** — XML-Personenanzahl vs. JSON-Output (abzüglich 9 Platzhalter)
2. **Search Index Integrity** — Pflichtfelder, Wertevalidierung (sex, type, Fraktionscodes, GND-Format)
3. **Detail JSON Integrity** — Stichprobe (~117 Dateien) auf korrekte Struktur
4. **Cross-Consistency** — Suchindex-Daten stimmen mit Detail-JSONs überein
5. **Affiliations Deep Check** — Statistik und Null-Perioden-Prüfung
6. **BEACON Check** — Format und GND-Konsistenz
7. **Edge Case Verification** — Abelein (7 WP), Ackermann (Maidenname), Leburton (VIAF), Adelmann (Graf)

### Erwartetes Ergebnis

```
ERRORS:   0
WARNINGS: 1

All validation checks passed!
```

Der eine Warning betrifft historische Geburtsjahre vor 1800 — das sind korrekte Daten (z.B. Luther, Caesar).

## Quality Report

Der Quality Report (`parlabio/data/quality-report.json`) dokumentiert Datenqualitätsprobleme:

| Kategorie | Anzahl | Beschreibung |
|-----------|--------|-------------|
| `placeholder_date` | ~98 | Platzhalter-Datum `0001` in Mitarbeiter-Occupation |
| `date_issue` | ~17 | Zukunftsdaten, v.-Chr.-Daten, Whitespace |
| `skipped_placeholder` | 9 | Übersprungene Platzhalter-Personen |
| `gnd_not_extracted` | 8 | Nicht-Standard-GND-URLs (Wikipedia-URLs im GND-Feld etc.) |
| `idno_case_inconsistency` | 2 | `Viaf` statt `VIAF` im XML |

**Wichtig:** 0 `parse_error` und 0 `unknown_faction` — das bedeutet, alle Personen wurden erfolgreich geparst und alle Fraktionsnamen sind gemappt.
