# Fraktionsprotokolle Web – Datenübersicht

## Projekttyp

Daten-Repository mit Build-Pipeline. Enthält die TEI-XML-Quelldateien der digitalen Edition „Fraktionen im Deutschen Bundestag 1949–2005", herausgegeben von der KGParl (Kommission für Geschichte des Parlamentarismus und der politischen Parteien), sowie die ParlaBio-Build-Pipeline (Python/lxml) zur Transformation der Personendaten in JSON.

Die Webseite [fraktionsprotokolle.de](https://fraktionsprotokolle.de) basiert auf dem [TEI Publisher](https://teipublisher.com/) mit eXist-db.

## Repository-Struktur

| Verzeichnis/Datei | Inhalt |
|---|---|
| `xml_quellen/` | 5.539 TEI-XML-Sitzungsprotokolle + 2 Normdaten-Dateien |
| `xml_schema/` | Relax-NG-Schema (.rng), Schematron (.sch), ODD-Customization |
| `md-seitentexte/` | Markdown-Texte für die Webseite (Projekt, Mitarbeiter, Forschung, Editionshinweise etc.) |
| `xml_einleitungen/` | Digitalisierte wissenschaftliche Einleitungen der Bucheditionen |
| `logos/` | Logos des Editionsprogramms und Editiones-Mitgliedschaft |
| `knowledge/` | Projektdokumentation (Datenmodell, Schema, Personen, Workflow etc.) |
| `parlabio/` | ParlaBio-Build-Pipeline: Python-Code, Tests, Dokumentation, generierte Daten (gitignored) |
| `README.md` | Projekt-README mit Übersicht, Lizenz, Kontakt |
| `Updates.md` | Chronologisches Änderungsprotokoll der Edition |
| `.gitignore` | Schließt `parlabio/data/`, `__pycache__/`, `.venv/` aus |

## Datenbestand nach Fraktionen

| Fraktion | Wahlperioden | Zeitraum | Protokolle |
|---|---|---|---|
| CDU/CSU-Fraktion | 1.–7. WP | 1949–1976 | 1.849 |
| FDP-Fraktion | 1.–9. WP | 1949–1983 | 1.201 |
| SPD-Fraktion | 1.–8. WP | 1949–1980 | 1.170 |
| CSU-Landesgruppe | 1.–9. WP | 1949–1983 | 769 |
| Grüne-Fraktion | 10.–11. WP | 1983–1990 | 550 |
| **Gesamt** | | **1949–1990** | **5.539** |

## Dateinamenkonvention

Beispiel: `fdp-05_1965-09-28-t1540_EP.xml`

- `fdp-05` – Fraktion und Wahlperiode
- `1965-09-28` – Sitzungsdatum (JJJJ-MM-TT)
- `t1540` – Uhrzeit des Sitzungsbeginns
- `EP` – Protokolltyp

### Protokolltypen

| Kürzel | Typ | Beschreibung | Dateien |
|---|---|---|---|
| EP | Ergebnis-/Verlaufsprotokoll | Zeitgenössische Kurz-, Ergebnis- oder Verlaufsprotokolle | 4.585 |
| WZ | Wortprotokoll zeitgenössisch | Stenographisch oder vom Tonband zeitnah transkribiert | 443 |
| WN | Wortprotokoll nachträglich | Vom Editionsteam nachträglich von Audioaufzeichnungen transkribiert | 305 |
| AN | Andere | Nicht eindeutig klassifizierbare Dokumente (Tagebücher, Briefe etc.) | 202 |
| AP | (Sonderfall) | 1 Datei: `spd-08_1977-05-23-t0000_AP.xml` | 1 |

Anmerkungen zur Dateinamenkonvention:
- 1 Datei mit Kleinschreibung des Typs: `cdu-csu-03_1959-01-11-t1500_An.xml`
- 1 Datei ohne Typ-Kürzel: `spd-06_1970-06-02_Geschaeftsordnung.xml`
- 2 Dateien mit abweichender Trennzeichen-Setzung: `fdp-05_1968-01-23-t0945-EP.xml` (Bindestrich statt Unterstrich vor Typ), `fdp-07_1976-03-16_t1500_EP.xml` (Unterstrich statt Bindestrich vor Zeit)

## Normdaten

- **Personen.xml** (364.555 Zeilen): 11.234 Personeneinträge (davon 9 Platzhalter) mit Biogrammen, GND, VIAF, Wikipedia-Links. Grundlage des Personenregisters und der ParlaBio-Build-Pipeline.
- **Organisationen.xml** (4.645 Zeilen): Institutionen- und Organisationenregister mit IDs und Normdaten.

## TEI-XML-Struktur eines Protokolls

```
TEI (xml:id, rendition="fraktionsprotokolle")
├── teiHeader
│   ├── fileDesc (titleStmt, publicationStmt, seriesStmt, notesStmt, sourceDesc)
│   ├── encodingDesc (editorialDecl, projectDesc, classDecl)
│   └── profileDesc (Fraktion, WP, Datum, Dauer, Ort, Sitzungsleitung)
└── text
    ├── front (Sitzungsverlauf/Regest als nummerierte Liste, ggf. Teilnehmerlisten)
    └── body (edierter Quelltext, gegliedert in div-Abschnitte mit SVP-Verweisen)
```

## TEI-Elemente und Schema

Vollständige Element-Constraints und Value Lists: siehe [schema.md](schema.md). Editorische Verwendung: siehe [editorial-guidelines.md](editorial-guidelines.md).

## Archivquellen

| Fraktion | Archiv |
|---|---|
| CDU | Archiv für Christlich-Demokratische Politik (ACDP) |
| SPD | Archiv der sozialen Demokratie (AdsD) |
| FDP | Archiv des Liberalismus (ADL) |
| CSU-LG | Archiv für Christlich-Soziale Politik (ACSP) |
| Grüne | Archiv Grünes Gedächtnis (AGG) |

## Technischer Stack der Webseite

- **Datenbank**: eXist-db (XML-Datenbank)
- **Publikationsframework**: TEI Publisher
- **Schema-Validierung**: Relax-NG + Schematron
- **Bibliographie**: Zotero-Gruppenbibliothek (https://www.zotero.org/groups/4606219/fraktionsprotokolle)
- **Versionierung**: GitHub (dieses Repository)
- **Beacon-Datei**: Täglich von eXist-db generiert; zusätzlich von ParlaBio-Build-Pipeline generierbar

## Teilprojekt ParlaBio

Webbasierte Personendatenbank als erweiterte Präsentationsschicht über die Personen.xml.

- **AP1** (Build-Pipeline): Implementiert. `python parlabio/build.py` transformiert die Personen.xml in 11.225 JSON-Dateien + Suchindex + BEACON.
- **AP2** (Frontend-Prototyp): Implementiert. Vanilla JS SPA (`docs/`) mit Overview-Dashboard, Ergebnisliste und Detailseite. Farbschema Teal-Grün (`#048263`), helles Theme, Suchfeld im Header. Deploybar via GitHub Pages ohne Build-Step.

Siehe [parlabio.md](parlabio.md) für Projektdokumentation, [parlabio-data-analysis.md](parlabio-data-analysis.md) für die technische Datenanalyse und [parlabio-architecture.md](parlabio-architecture.md) für Architekturentscheidungen.

## Lizenz

Copyright KGParl e.V. – Alle Rechte vorbehalten. Nutzung/Weiterverarbeitung erfordert Kontakt mit der KGParl.
