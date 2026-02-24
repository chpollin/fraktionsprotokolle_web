# ParlaBio – Datenanalyse Personen.xml

Technische Analyse der XML-Quelldaten für die Build-Pipeline (AP1). Stand: Februar 2026.

## Gesamtbestand

| Personentyp | Anzahl | Zeilen (von–bis) | XML-Struktur |
|---|---|---|---|
| MdB | 4.091 | 72–186.968 | Volle Struktur mit 4-Level-Affiliationen |
| Other | 7.100 | 186.969–363.034 | Vereinfacht, keine Legislative-Affiliationen |
| Mitarbeiter-KGParl | 59 | 363.036–364.552 | `<occupation>` statt `<affiliation>` |
| **Gesamt** | **11.250** | | |

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

### Fraktionsnamen (Freitext, nicht normiert)

Die Fraktionsnamen in `<affiliation type="Fraktionszugehoerigkeit">` sind lange Volltexte:

| Freitext in XML | Normalisiertes Kürzel |
|---|---|
| Fraktion der Christlich Demokratischen Union/Christlich - Sozialen Union | CDU/CSU |
| Fraktion der Sozialdemokratischen Partei Deutschlands | SPD |
| Fraktion der Freien Demokratischen Partei | FDP |
| CSU-Landesgruppe | CSU-LG |
| Fraktion Die Grünen | Grüne |
| Gruppe der PDS | PDS |

→ Mapping-Tabelle muss in der Build-Pipeline hardcoded werden.

## Datumsformate und Edge Cases

| Format | Vorkommen | Beispiel |
|---|---|---|
| Vollständig (JJJJ-MM-TT) | 15.228 | `when="1930-10-20"` |
| Nur Jahr (JJJJ) | 1.010 | `when="1906"` |
| Jahr-Monat (JJJJ-MM) | 19 | `when="1906-05"` |
| Leer (`<date/>`) | ~4.000 | Fehlende Lebensdaten |
| Ungültige Daten | mind. 3 | `when="2917-11-20"`, `when="2042-12-30"`, `when="2107-06-01"` |
| Platzhalter | ~59 | `from="0001"` bei Mitarbeiter-KGParl |

→ Die Build-Pipeline muss alle Formate verarbeiten und ungültige Daten loggen (nicht stillschweigend ignorieren).

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
| GND | ~3.657 | ~7.593 | URL-Format: `https://d-nb.info/gnd/...` |
| Wikipedia | ~6.889 | ~4.366 | URL-Format: `https://de.wikipedia.org/wiki/...` |
| NDB | 0 | 11.244 | Nie befüllt – ignorieren |
| VIAF | ~205 | ~11.045 | Selten; 1x Inkonsistenz: `Viaf` statt `VIAF` |

## Leere Platzhalter (zu überspringen)

Folgende Elemente sind strukturelle Platzhalter und fast immer leer:
- `<affiliation type="Exekutive"/>` – 4.089 leere Elemente bei MdB
- `<affiliation type="Sonstiges"/>` – 4.076 leere Elemente bei MdB
- `<idno type="NDB"/>` – 11.244 immer leer
- `<country/>` – 18.915 leer

→ Die Build-Pipeline sollte diese überspringen und nicht in das JSON aufnehmen.

## Empfehlung für JSON-Struktur

### Suchindex (search-index.json)

Kompaktes Array mit Filterfeldern pro Person:

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

Vollständiger Datensatz inkl. Freitext, Normdaten-URLs, Fraktionschronologie:

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

## Verwandte Dokumente

- [persons.md](persons.md) – Allgemeine Dokumentation der Personen.xml
- [parlabio.md](parlabio.md) – ParlaBio-Projektdokumentation
- [parlabio-architecture.md](parlabio-architecture.md) – Architekturentscheidungen
