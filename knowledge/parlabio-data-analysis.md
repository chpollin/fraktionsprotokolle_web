# ParlaBio – Datenanalyse Personen.xml

Technische Analyse der XML-Quelldaten für die Build-Pipeline (AP1). Stand: Februar 2026.

**Status**: AP1-Build-Pipeline implementiert und validiert. Alle Zahlen in diesem Dokument sind verifizierte Werte aus dem tatsächlichen Build.

## Gesamtbestand

| Personentyp | Anzahl (XML) | Davon Platzhalter | Verarbeitet | XML-Struktur |
|---|---|---|---|---|
| MdB | 4.090 | 4 | 4.086 | Volle Struktur mit 4-Level-Affiliationen |
| Other | 7.085 | 5 | 7.080 | Vereinfacht, keine Legislative-Affiliationen |
| Mitarbeiter-KGParl | 59 | 0 | 59 | `<occupation>` statt `<affiliation>` |
| **Gesamt** | **11.234** | **9** | **11.225** | |

### Platzhalter-Personen (übersprungen)

9 strukturelle Platzhalter-Einträge werden vom Build übersprungen:
`MdB_divers`, `MdB_Genderunbekannt`, `MdB_maennlich`, `MdB_weiblich`, `NN_weiblich`, `NN_maennlich`, `NN_divers`, `NN_Genderunbekannt`, `xy_ersetzen`

## Datenfelder pro Personentyp

| Feld | MdB | Other | Mitarbeiter |
|---|---|---|---|
| `persName/reg` | Ja | Ja | Ja |
| `persName/forename` | Ja | Ja | Ja |
| `persName/surname` | Ja | Ja | Ja |
| `persName/addName[@type="praefix"]` | Ja | Nein | Ja |
| `persName/roleName` | Ja | Nein | Ja |
| `persName/addName[@type="Ort"]` | Ja | Ja | Ja |
| `sex` | Ja | Ja | Ja |
| `birth/date`, `birth/placeName` | Ja | Ja | Ja (oft leer) |
| `death/date`, `death/placeName` | Ja | Ja | Ja (oft leer) |
| `affiliation[@type="Erwerbsarbeit"]` | Ja (Freitext) | Ja (Freitext) | Nein |
| `affiliation[@role="Legislative_MDB"]` | Ja (4-Level) | Nein | Nein |
| `affiliation[@type="Exekutive"]` | Ja (4.089x leer) | Nein | Nein |
| `affiliation[@type="Sonstiges"]` | Ja (4.076x leer) | Nein | Nein |
| `occupation` | Nein | Nein | Ja |
| `idno[@type="MDB_Stammdaten"]` | Ja (~4.088) | Nein | Nein |
| `idno[@type="GND"]` | Ja | Ja | Ja (oft leer) |
| `idno[@type="Wikipedia"]` | Ja | Ja | Ja (oft leer) |
| `idno[@type="NDB"]` | Ja (immer leer) | Ja (immer leer) | Ja (immer leer) |
| `idno[@type="VIAF"]` | Selten (205 gesamt) | Selten | Nein |

## Affiliations-Hierarchie (nur MdB)

4-stufige Verschachtelung:

```xml
<affiliation role="Legislative_MDB" type="Wahlperioden">
  <affiliation type="Wahlperiode" period="#wp05">
    <affiliation type="Fraktionszugehoerigkeiten" from="1965-10-19" to="1969-10-19">
      <affiliation type="Fraktionszugehoerigkeit" from="1965-10-19">
        Fraktion der Christlich Demokratischen Union/Christlich - Sozialen Union
      </affiliation>
    </affiliation>
  </affiliation>
  <!-- Weitere Wahlperioden... -->
</affiliation>
```

**Aufwandstreiber**: Ein MdB kann 5–10 solcher Blöcke haben (Wiederwahl, Fraktionswechsel). Die Flattening-Logik muss alle Ebenen traversieren und die Daten in eine flache Struktur überführen.

### Fraktionsnamen

Die Fraktionsnamen in `<affiliation type="Fraktionszugehoerigkeit">` sind lange Volltexte. Insgesamt 122 einzigartige Werte, davon **37 tatsächliche Fraktionen** und ~85 Ausschuss-/Ministeriums-/Gremiumsnamen (letztere kommen ausschließlich aus wp19-Daten und werden vom Build gefiltert).

**Implementiertes Mapping** (`parlabio/build/factions.py`): 36 Einträge, darunter:

| Freitext in XML | Kürzel |
|---|---|
| Fraktion der Christlich Demokratischen Union/Christlich - Sozialen Union | CDU/CSU |
| Fraktion der Sozialdemokratischen Partei Deutschlands | SPD |
| Fraktion der Freien Demokratischen Partei | FDP |
| Fraktion Bündnis 90/Die Grünen | B90/Grüne |
| Fraktion DIE LINKE. | LINKE |
| Alternative für Deutschland | AfD |
| Fraktionslos | Fraktionslos |
| Fraktion der SPD (Gast) | SPD (Gast) |
| Gruppe der Partei des Demokratischen Sozialismus | Grp. PDS |
| ... (36 Einträge insgesamt, inkl. historische Parteien und Gast-Status) |

→ Mapping-Tabelle ist in `parlabio/build/factions.py` hardcoded. Validierungsergebnis: **0 unknown_faction** im Build.

## Datumsformate und Edge Cases

| Format | Vorkommen | Beispiel |
|---|---|---|
| Vollständig (JJJJ-MM-TT) | 15.228 | `when="1930-10-20"` |
| Nur Jahr (JJJJ) | 1.010 | `when="1906"` |
| Jahr-Monat (JJJJ-MM) | 19 | `when="1906-05"` |
| Leer (`<date/>`) | ~4.000 | Fehlende Lebensdaten |
| Ungültige Daten | mind. 3 | `when="2917-11-20"`, `when="2042-12-30"`, `when="2107-06-01"` |
| Platzhalter | ~59 | `from="0001"` bei Mitarbeiter-KGParl |

→ Die Build-Pipeline verarbeitet alle Formate und loggt ungültige Daten im Quality Report (17 date_issue, 98 placeholder_date).

## Ortsnamen

- Nur Textfelder (`<placeName>`), keine Koordinaten
- 8.351 leere `<placeName/>`-Elemente (Geburts-/Sterbeort unbekannt)
- 18.915 leere `<country/>`-Elemente
- Historische Ortsnamen: „Parabutsch, Batschka (heute: Ratkovo, Bačka, Serbien)"
- Deskriptive Formen: „Dorum/Landkrs. Cuxhaven"

## Maidennamen

324 Einträge enthalten Geburtsnamen im Anzeigenamen-Feld:

```xml
<reg>Annemarie Ackermann, geb. Eisenmann</reg>
```

**Auswirkung auf ParlaBio**:
- Volltextsuche muss Geburtsnamen finden (z.B. Suche nach „Eisenmann" → findet Ackermann)
- Anzeige: Geburtsname ist im `<reg>`-Feld enthalten und wird automatisch angezeigt

## Normdaten-Abdeckung

| `<idno>` Typ | Befüllt | Leer | Bemerkung |
|---|---|---|---|
| MDB_Stammdaten | ~4.088 | 0 | Nur bei MdB |
| GND | 7.408 (BEACON) | Rest | URL-Format: `https://d-nb.info/gnd/...`; 8 nicht-Standard-URLs (Wikipedia im GND-Feld etc.) |
| Wikipedia | ~6.889 | ~4.366 | URL-Format: `https://de.wikipedia.org/wiki/...` |
| NDB | 0 | 11.244 | Nie befüllt – ignorieren |
| VIAF | ~205 | ~11.045 | Selten; 2x Case-Inkonsistenz: `Viaf` statt `VIAF` |

**GND-Sonderfälle**: 8 Einträge haben nicht-Standard-GND-URLs:
- 3 haben Wikipedia-URLs im GND-Feld (BraunJosef, LutherMartin, Ben-HorinEliashiv)
- 5 haben `https://d-nb.info/`-URLs ohne `/gnd/`-Pfad (EdenhoferWalter, HauschildtErwin, LenckFranz, MiddelmannWerner, LunkeErwin)

Diese werden im Suchindex als `null` geführt und im Quality Report dokumentiert.

## Leere Platzhalter

Folgende Elemente sind strukturelle Platzhalter und fast immer leer:
- `<affiliation type="Exekutive"/>` – 4.089 leere Elemente bei MdB
- `<affiliation type="Sonstiges"/>` – 4.076 leere Elemente bei MdB
- `<idno type="NDB"/>` – 11.244 immer leer
- `<country/>` – 18.915 leer

→ Die Build-Pipeline überspringt leere Elemente. Exekutive und Sonstiges werden nur in Detail-JSONs aufgenommen, wenn befüllt.

## Implementierte JSON-Struktur

### Suchindex (search-index.json)

Kompaktes Array mit Filterfeldern pro Person (2,9 MB für 11.225 Einträge):

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
  "periods": [5, 6, 7],
  "gnd": "107432587",
  "has_wikipedia": true
}
```

Anm.: Karriere-Freitext (`Erwerbsarbeit`) ist **nicht** im Suchindex enthalten (zu lang, bläht Index auf). Er wird nur in den Detail-JSONs mitgeführt.

### Detail-JSON (person/AbeleinManfred_1965-10-19.json)

Vollständiger Datensatz inkl. Freitext, Normdaten-URLs, Fraktionschronologie. Optional: `exekutive`, `sonstiges`, `occupation_kgparl`, `alt_names` (nur wenn befüllt):

```json
{
  "id": "AbeleinManfred_1965-10-19",
  "type": "MdB",
  "name": {
    "reg": "Manfred Abelein",
    "forename": "Manfred",
    "surname": "Abelein",
    "prefix": "",
    "role_name": "",
    "place": ""
  },
  "sex": "m",
  "birth": {
    "date": "1930-10-20",
    "place": "Stuttgart",
    "country": ""
  },
  "death": {
    "date": "2008-01-17",
    "place": "Ellwangen",
    "country": ""
  },
  "occupation": "Rechtsanwalt, Wirtschaftsprüfer, Universitätsprofessor...",
  "affiliations": [
    {
      "period": 5,
      "faction": "CDU/CSU",
      "faction_full": "Fraktion der Christlich Demokratischen Union/Christlich - Sozialen Union",
      "from": "1965-10-19",
      "to": "1969-10-19"
    },
    {
      "period": 6,
      "faction": "CDU/CSU",
      "faction_full": "...",
      "from": "1969-10-20",
      "to": "1972-09-22"
    }
  ],
  "ids": {
    "mdb_stammdaten": "11000001",
    "gnd": "https://d-nb.info/gnd/107432587",
    "wikipedia": "https://de.wikipedia.org/wiki/Manfred_Abelein",
    "viaf": null
  }
}
```

## Build-Statistiken (verifiziert)

| Kennzahl | Wert |
|---|---|
| Verarbeitete Personen | 11.225 (11.234 minus 9 Platzhalter) |
| Laufzeit | ~4–6 Sekunden |
| Suchindex | 2.867.354 Bytes (2,9 MB kompakt) |
| Detail-JSONs | 11.225 Dateien, ~10 MB gesamt |
| BEACON-Einträge | 7.408 |
| Qualitätsprobleme | 134 (0 parse_error, 0 unknown_faction) |
| MdB-Affiliationen | 12.054 gesamt, Ø 3,0 pro MdB, max. 13 |
| Fraktionswechsler | 263 MdB mit >1 Fraktion |
| Geschlecht | m: 9.734, f: 1.491 |

## Verwandte Dokumente

- [persons.md](persons.md) – Allgemeine Dokumentation der Personen.xml
- [parlabio.md](parlabio.md) – ParlaBio-Projektdokumentation
- [parlabio-architecture.md](parlabio-architecture.md) – Architekturentscheidungen
- `parlabio/docs/pipeline.md` – Programmfluss-Dokumentation
