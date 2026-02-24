# ParlaBio – Build-Pipeline

Transformiert die TEI-XML-Personendaten der Fraktionsprotokolle-Edition in JSON-Artefakte für die ParlaBio-Webanwendung.

## Schnellstart

```bash
pip install lxml
python parlabio/build.py
python parlabio/tests/test_build.py
python parlabio/validate_output.py
```

## Verzeichnisstruktur

```
parlabio/
├── build.py              # Einstiegspunkt
├── validate_output.py    # Validierungsskript
├── requirements.txt      # Abhängigkeiten (lxml)
├── build/                # Python-Module
│   ├── constants.py      # Namespaces, Platzhalter-IDs
│   ├── parser.py         # XML → Dict (Kern)
│   ├── transform.py      # Dict → JSON
│   ├── factions.py       # Fraktionsnamen-Mapping
│   ├── dates.py          # Datumsvalidierung
│   ├── quality.py        # Datenqualitätsreport
│   ├── beacon.py         # BEACON-Datei (GND)
│   └── writer.py         # Dateiausgabe
├── tests/
│   └── test_build.py     # Unit- und Integrationstests
├── data/                 # Generierter Output (gitignored)
│   ├── search-index.json
│   ├── quality-report.json
│   ├── beacon.txt
│   └── person/           # 11.225 Detail-JSONs
└── docs/
    ├── pipeline.md       # Programmfluss-Dokumentation
    └── testing.md        # Test- und Validierungsdokumentation
```

## Eingabe

`xml_quellen/Normdaten/Personen.xml` — TEI-XML mit ~11.234 Personen (9 Platzhalter werden übersprungen).

## Ausgabe

| Datei | Inhalt | Größe |
|-------|--------|-------|
| `search-index.json` | Kompakter Suchindex (11.225 Einträge) | ~2,9 MB |
| `person/*.json` | Vollständige Detail-JSONs | ~10 MB (11.225 Dateien) |
| `quality-report.json` | Datenqualitätsprobleme | ~134 Issues |
| `beacon.txt` | GND-BEACON für Linked Data | 7.408 Einträge |

## Dokumentation

- [Pipeline-Dokumentation](docs/pipeline.md) — Programmfluss, Module, Ausgabeformate
- [Test-Dokumentation](docs/testing.md) — Tests ausführen, Validierung, Quality Report
