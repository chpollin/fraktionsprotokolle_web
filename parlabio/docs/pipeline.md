# Build-Pipeline: Programmfluss

TEI-XML-Personendaten (`Personen.xml`) werden in JSON-Artefakte transformiert, die das ParlaBio-Frontend konsumiert.

## Übersicht

```
Personen.xml (18,8 MB, 364.555 Zeilen)
       │
       ▼
  ┌──────────┐
  │ parser.py │  XML → Python-Dicts (lxml)
  └────┬─────┘
       │  11.225 Personen-Dicts
       ▼
  ┌──────────────┐
  │ transform.py │  Dict → JSON-Strukturen
  └──┬───────┬───┘
     │       │
     ▼       ▼
  Search   Detail
  Entry    Entry
     │       │
     ▼       ▼
  ┌──────────────┐
  │  writer.py   │  Dateien schreiben
  └──┬──┬──┬──┬──┘
     │  │  │  │
     ▼  ▼  ▼  ▼
  search-index.json     (1 Datei, ~2,9 MB)
  person/*.json         (11.225 Dateien, ~10 MB)
  quality-report.json   (1 Datei)
  beacon.txt            (7.408 GND-Einträge)
```

## Module

### `build.py` (Einstiegspunkt)

Orchestriert die Pipeline:
1. Findet XML-Eingabedateien via Glob-Pattern
2. Parst alle Personen mit `parser.parse_persons()`
3. Transformiert jede Person in Search-Entry + Detail-Entry
4. Schreibt alle Ausgabedateien
5. Gibt Zusammenfassung auf stdout aus

**CLI-Optionen:**
- `--input GLOB` — Eingabe-XML (Default: `xml_quellen/Normdaten/Personen*.xml`)
- `--output DIR` — Ausgabeverzeichnis (Default: `parlabio/data`)
- `--no-beacon` — BEACON-Datei überspringen
- `--pretty` — Suchindex mit Einrückung (größere Datei)

### `build/parser.py` (Kern)

Parst die TEI-XML-Struktur in flache Python-Dicts. Kritischster Teil: die 4-stufige Affiliations-Hierarchie.

**Affiliations-Flattening:**
```
Ebene 1: affiliation[@role="Legislative_MDB"]
  Ebene 2: affiliation[@type="Wahlperiode" @period="#wpNN"]
    Ebene 3: affiliation[@type="Fraktionszugehoerigkeiten" @from @to]
      Ebene 4: affiliation[@type="Fraktionszugehoerigkeit"] → TEXT
```

Jedes Ebene-4-Element wird zu einem Eintrag in der flachen Liste. Nicht-Fraktionen (Ausschüsse, Ministerien aus wp19) werden via `is_faction()` gefiltert.

**Personentypen:**
| Typ | Anzahl | Besonderheiten |
|-----|--------|----------------|
| MdB | 4.086 | Hat Affiliationen, MDB_Stammdaten-ID |
| Other | 7.080 | Keine Affiliationen, oft historische Personen |
| Mitarbeiter-KGParl | 59 | `<occupation>`-Element mit Organisation und Rolle |

### `build/transform.py`

Zwei Transformationsfunktionen:

- **`build_search_entry()`**: Kompakter Eintrag (~430 Bytes) für den Suchindex. Fraktionen dedupliziert, GND als Bare-ID, kein Karriere-Freitext.
- **`build_detail_entry()`**: Vollständiger Eintrag als **JSON-LD** mit Schema.org-Vokabular (`@context`, `@type: "Person"`, `name`, `givenName`, `familyName`, `gender`, `birthDate`, `deathDate`, `birthPlace`, `deathPlace`, `hasOccupation`, `memberOf`, `sameAs`). Projektspezifische Felder mit `fraktionsprotokolle:`-Prefix (Affiliationschronologie, Namensstruktur, Normdaten-URLs). Optional: `fraktionsprotokolle:exekutive`, `fraktionsprotokolle:sonstiges`, `fraktionsprotokolle:occupation_kgparl`, `fraktionsprotokolle:alt_names`.

### `build/factions.py`

36 Mappings von langen XML-Fraktionstexten auf Kurzbezeichnungen. Filtert 85+ Ausschuss-/Ministeriums-/Gremiumsnamen aus wp19-Daten.

### `build/dates.py`

Datumsvalidierung und Jahresextraktion. Behandelt Edge Cases: v.-Chr.-Daten, Platzhalter (`0001`), Zukunftsdaten (`2917`), nur-Jahr-Angaben.

### `build/beacon.py`

Generiert eine BEACON-Datei (GND-basiert) für Linked-Data-Dienste.

### `build/quality.py`

Sammelt Datenqualitätsprobleme während der Verarbeitung. Max. 100 Beispiele pro Kategorie.

### `build/constants.py`

TEI-Namespaces, Platzhalter-IDs (9 Stück), GND-URL-Prefix, idno-Typ-Normalisierung.

### `build/writer.py`

Schreibt alle Ausgabedateien. Suchindex wahlweise kompakt oder pretty-printed.

## Ausgabeformate

### Search-Index-Eintrag
```json
{
  "id": "AbeleinManfred_1965-10-19",
  "name": "Manfred Abelein",
  "surname": "Abelein",
  "forename": "Manfred",
  "sex": "m",
  "birth_year": 1930,
  "death_year": 2008,
  "birth_place": "Stuttgart",
  "type": "MdB",
  "factions": ["CDU/CSU"],
  "periods": [5, 6, 7, 8, 9, 10, 11],
  "gnd": "107432587",
  "has_wikipedia": true
}
```

### Detail-Eintrag (JSON-LD, Auszug)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "AbeleinManfred_1965-10-19",
  "name": "Manfred Abelein",
  "givenName": "Manfred",
  "familyName": "Abelein",
  "gender": "https://schema.org/Male",
  "birthDate": "1930-10-20",
  "birthPlace": { "@type": "Place", "name": "Stuttgart" },
  "memberOf": [{ "@type": "OrganizationRole", "memberOf": { "@type": "Organization", "name": "...", "alternateName": "CDU/CSU" }, "startDate": "1965-10-19", "endDate": "1969-10-19" }],
  "sameAs": ["https://d-nb.info/gnd/107432587", "https://de.wikipedia.org/wiki/Manfred_Abelein"],
  "fraktionsprotokolle:personType": "MdB",
  "fraktionsprotokolle:affiliations": [{ "period": 5, "faction": "CDU/CSU", "faction_full": "...", "from": "1965-10-19", "to": "1969-10-19" }],
  "fraktionsprotokolle:ids": { "gnd": "https://d-nb.info/gnd/107432587", "wikipedia": "...", ... }
}
```

## Fehlerbehandlung

- Fehlende XML-Elemente → leerer String / `None`, kein Fehler
- `try/except` um jede Person → bei Fehler im Quality Report loggen, weiter mit nächster Person
- Quality Report wird immer geschrieben
- Exit Code 0 bei Erfolg (auch mit Qualitätsproblemen), 1 nur bei fatalen Fehlern
