# ParlaBio – Webbasierte Personendatenbank

Stand: Februar 2026

## Projektziel

Entwicklung einer webbasierten Personendatenbank, die das TEI-XML-Personenregister der Edition fraktionsprotokolle.de als durchsuchbare, filterbare Präsentationsschicht im Web zugänglich macht.

**Auftraggeber**: KGParl (Kommission für Geschichte des Parlamentarismus und der politischen Parteien e.V.)
**Datengrundlage**: `xml_quellen/Normdaten/Personen.xml` (11.234 Einträge, davon 9 Platzhalter → 11.225 verarbeitete Personen; Zielgröße 15.000–20.000)
**Beziehung zur Edition**: Lesender Zugriff auf die XML-Quelldaten. Keine Rückkopplung in die Quelldateien.

## Architektur

Statische Build-Pipeline statt klassischem Backend:

```
Personen.xml ──→ parlabio/build.py (Python/lxml) ──→ JSON-Artefakte ──→ SPA im Browser
                   │                                    │
                   ├── Validierung                      ├── search-index.json (2,9 MB)
                   ├── Transformation                   ├── person/<id>.json (11.225 Dateien)
                   └── Normalisierung                   ├── beacon.txt (7.408 GND-Einträge)
                                                        └── quality-report.json
```

**Kernprinzip**: Die TEI-XML-Dateien im GitHub-Repository bleiben die alleinige autoritative Datenquelle (Single Source of Truth). ParlaBio ist eine reine Präsentations- und Abfrageschicht.

**Abweichung vom Lastenheft**: Das Lastenheft schlägt eine relationale Datenbank (MariaDB/MySQL) und Typesense vor. Der statische Ansatz ersetzt diese durch vorberechnete JSON-Dateien und clientseitige Suche. Begründung: drastisch reduzierte Wartungslast, keine Laufzeitabhängigkeiten, vollständig aus dem Repository rekonstruierbar.

## Entscheidungen

| Entscheidung | Gewählt | Begründung |
|---|---|---|
| Rendering | **SPA** (nicht SSG) | Weniger Dateien, schnellerer Build, Template-Änderungen ohne Rebuild |
| Suchbibliothek | **FlexSearch/MiniSearch** | Schnell (~15-20 KB), Boolean-Operatoren, Entscheidung nach Prototyp |
| Protokoll-Verknüpfung | **Nicht im Scope** | Architektur offen und erweiterbar halten, kein Parsen der 5.539 Protokolle |
| Fraktionsnamen | **Normalisierung in AP1** | Hardcoded Mapping-Tabelle (Freitext → Kürzel) |
| BEACON | **Generierung in Build-Pipeline** | Ersetzt die eXist-db-Funktion |
| Organisationen.xml | **Nicht im Scope** | ParlaBio verarbeitet nur Personen.xml; Organisationsverknüpfungen sind eine mögliche Erweiterung |

## Funktionale Kernkomponenten

### 1. Suche und Filterung
- Globale Volltextsuche auf JSON-Suchindex
- Reaktive Filter-Sidebar: Fraktion, Wahlperiode, Zeitraum, Geschlecht, Geburtsort
- Aktive Filter als Removable Badges
- Boolean-Operatoren (soweit von Suchbibliothek unterstützt)

### 2. Ergebnis- und Detaildarstellung
- **Listenansicht**: Tabellen- oder Kacheldarstellung (Name, Lebensdaten, Status-Badge)
- **Detailseite**: Sektionen (Stammdaten, Politische Vita, Referenzen), chronologische Fraktionsdarstellung, Links zur Haupt-Edition

### 3. Permalinks
- Stabile, sprechende URLs: `domain.de/person/AbeleinManfred_1965-10-19`
- Canonical-URL basierend auf `xml:id`

## Arbeitspakete

### Pflicht

| AP | Titel | Abhängigkeit | Status |
|---|---|---|---|
| AP1 | Build-Pipeline (TEI-XML → JSON) | – | **Abgeschlossen** |
| AP2 | Prototyp und Designabstimmung | AP1 | Offen |
| AP3 | Weboberfläche (SPA-Frontend) | AP2 | Offen |
| AP4 | Deployment und Dokumentation | AP3 | Offen |
| AP5 | Qualitätssicherung und Abnahme | AP4 | Offen |

### AP1 – Ergebnisse

- **Code**: `parlabio/build.py` + 8 Module in `parlabio/build/`
- **Laufzeit**: ~4–6 Sekunden für 11.225 Personen
- **Ausgabe**: Suchindex (2,9 MB), 11.225 Detail-JSONs als JSON-LD (Schema.org), BEACON (7.408 Einträge)
- **Datenqualität**: 134 Issues dokumentiert (0 parse_error, 0 unknown_faction)
- **Tests**: 6 Tests (Unit + Integration), Validierungsskript mit 7 Prüfkategorien
- **Dokumentation**: `parlabio/docs/pipeline.md`, `parlabio/docs/testing.md`, `parlabio/README.md`

### Optional (separat ausgewiesen)

| AP | Titel | Abhängigkeit | Abgrenzung |
|---|---|---|---|
| Optional 1 | BEACON-Integration (UI + externe Quellen) | AP1 | BEACON-Generierung ist Bestandteil von AP1; Optional 1 umfasst die Linkauflösung, externe Quellen-Whitelist und UI-Darstellung |
| Optional 2 | LOD-Nachladen (DNB/Wikidata clientseitig) | AP3 | |

## Offene Fragen an die KGParl

| # | Frage |
|---|---|
| 1 | Soll ParlaBio als Subdomain, Unterseite oder eigenständige Domain laufen? |
| 2 | Wie ist die Beziehung zum bestehenden Personenregister? Ersatz oder Ergänzung? |
| 3 | Wann ist der geplante Datei-Split (Personen.xml aufteilen) vorgesehen? |
| 4 | Gibt es die erwähnte Mapping-Tabelle (XML-Tags → UI-Elemente) bereits? |
| 5 | Welche BEACON-Quellen sollen initial eingebunden werden? |
| 6 | Soll die Mitarbeiter-KGParl-Kategorie (59 Personen) sichtbar sein? |
| 7 | Gibt es Vorgaben zum Hosting-Pfad auf dem Server? |

## Technische Rahmenbedingungen

- **Server**: Intel Xeon E5-1650 v2, 64 GB DDR3 ECC RAM, 2 x 500 GB SSD, NGINX/Apache
- **Zugriffe**: ~1.000/Woche
- **Erwartete Datenmenge**: Suchindex voraussichtlich unter 5 MB (Kernindex ohne Freitext)

## Code-Struktur

Alle ParlaBio-Dateien liegen in `parlabio/`:

```
parlabio/
├── build.py              # Einstiegspunkt
├── validate_output.py    # Validierungsskript
├── requirements.txt      # Abhängigkeiten (lxml)
├── README.md
├── build/                # Python-Module (parser, transform, factions, dates, ...)
├── tests/test_build.py   # Unit- und Integrationstests
├── data/                 # Generierter Output (gitignored)
└── docs/                 # pipeline.md, testing.md
```

## Verwandte Dokumente

- [persons.md](persons.md) – Dokumentation der Personen.xml
- [parlabio-data-analysis.md](parlabio-data-analysis.md) – Technische Datenanalyse für die Build-Pipeline
- [parlabio-architecture.md](parlabio-architecture.md) – Architekturentscheidungen
- [schema.md](schema.md) – TEI-Schema-Referenz
- `parlabio/docs/pipeline.md` – Programmfluss-Dokumentation
- `parlabio/docs/testing.md` – Test- und Validierungsdokumentation
