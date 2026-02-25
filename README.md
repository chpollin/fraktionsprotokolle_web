[<img src="https://github.com/Fraktionsprotokolle-de/fraktionsprotokolle_web/blob/main/logos/logo_editionsprogramm_1990-2005_Oswald_quer_ohneURL_mitLinie_rgb_210x52px_final.svg" />](https:///www.fraktionsprotokolle.de)

# »Editionsprogramm: Fraktionen im Deutschen Bundestag 1949–2005«

*Digitale Edition – herausgegeben von der [Kommission für Geschichte des Parlamentarismus und der politischen Parteien, e.V. (KGParl)](https://kgparl.de/) in Berlin. – Gefördert durch den Deutschen Bundestag.*

*Stand: 10. Januar 2022*

------

Die KGParl hat es sich zum Ziel gesetzt, die Sitzungsprotokolle bzw. die verschriftlichten Tondokumente der wichtigsten Fraktionen im Deutschen Bundestag sukzessive editorisch zu erschließen und zu veröffentlichen. Die Kommission stellt damit der historischen und anderweitig parlamentsbezogenen Forschung sowie der interessierten Öffentlichkeit eine gut handhabbare und verlässliche Quellengrundlage zur Verfügung. Näheres zum Projekt unter https://kgparl.de/forschung/fraktionen-im-bundestag/.

In diesem öffentlichen Repositorium werden alle TEI-XML-Dateien der edierten Sitzungsprotokolle veröffentlicht, die der digitalen Edition unter https://www.fraktionsprotokolle.de zugrunde liegen und vom Editionsteam soweit bearbeitet wurden, dass sie veröffentlicht werden konnten. 

Die Edition versteht sich als *work in progress* – dies gilt sowohl für die semantische Erschließung und Anreicherung der Protokolle wie auch für den Gesamtumfang der Edition.

## Struktur und Umfang der Daten

Alle veröffentlichten Quellen finden sich als XML-Dateien im Verzeichnis `xml_quellen`. Dort sind sie nach Fraktion/Landesgruppe und Wahlperiode in Unterordnern gesammelt. Personen- wie Organisationenregister befinden sich im entsprechenden Unterordner `Normdaten`. Die weitere Sortierung der Sitzungsprotokolle erfolgt über die Dateinamen. Beispiel: 

`fdp-05_1965-09-28-t1540_EP.xml`

- `fdp-05` —  Fraktion/Gruppe und Wahlperiode
- `1965-09-28` — Datum (`JJJJ-MM-TT`) der (Fraktions-, Fraktionsvorstands- oder sonstigen) Sitzung (bzw. Datum des ersten Sitzungstags bei mehrtägigen Sitzungen), hier: 28. September 1965
- `t1540` — Uhrzeit des Beginns der Sitzung
- `EP` — Protokolltyp, hier: Verlaufs- bzw. Ergebnisprotokoll (weitere Typen: `WN` = Wortprotokoll nachträglich transkribiert, `WZ` = Wortprotokoll zeitgenössisch erstellt, `AN` = andere bzw. bislang nicht näher spezifizierte Protokolltypen)

Das XML-Schema und die Schematron-Datei finden sich im gleichnamigen Verzeichnis `xml_schema`. 

Aktuell umfasst die veröffentlichte Edition die Protokolle von

- CDU/CSU-Fraktion 1.–7. Wahlperiode (1949–1976)
- SPD-Fraktion 1.–8. Wahlperiode (1949–1980)
- FDP-Fraktion 1.–9. Wahlperiode (1949–1983)
- CSU-Landesgruppe 1.–9. Wahlperiode (1949–1983)
- Grüne-Fraktion 10. und 11. Wahlperiode (1983–1990)

Ein regelmäßiges Update, auch ohne dies ausdrücklich als Release zu kennzeichnen, erhält die als XML-Datei vorliegende Personendatenbank. Sie ist Grundlage des Namensregisters der Edition. Sie wird kontinuierlich um Personennamen ergänzt, die bisherigen Einträge um Normdaten wie GND und Kurzbiogramme angereichert sowie etwaige Fehler behoben. 

## ParlaBio – Personendatenbank

ParlaBio ist eine webbasierte Personendatenbank, die das TEI-XML-Personenregister der Edition als durchsuchbare, filterbare Webanwendung zugänglich macht.

**Einstieg**: Die Startseite zeigt ein Overview-Dashboard mit Datenverteilungen (Personentypen, Fraktionen, Wahlperioden, Geburtsjahrzehnte, Geschlecht). Jedes Element ist klickbar und führt zur gefilterten Ergebnisliste.

### Technik

- **Build-Pipeline**: `python parlabio/build.py` transformiert `Personen.xml` in JSON-Artefakte (Suchindex, 11.225 Detail-JSONs, BEACON-Datei)
- **Frontend**: Statische SPA in `docs/` (Vanilla JS, Pico CSS, MiniSearch – alle self-hosted, 0 externe Requests) – direkt via GitHub Pages deploybar, kein Build-Step nötig
- **Suche**: MiniSearch v7 mit Fuzzy-Search und Umlaut-Normalisierung (Muller → Müller)
- **DSGVO**: Alle Abhängigkeiten (Fonts, CSS, JS) lokal – keine Datenübermittlung an Dritte

### Verzeichnisstruktur

```
parlabio/                        ← Build-Pipeline (Python/lxml)
├── build.py                     ← Einstiegspunkt
├── build/                       ← Module (parser, transform, factions, ...)
├── tests/test_build.py          ← Unit- und Integrationstests
└── docs/                        ← Pipeline-Dokumentation

docs/                            ← Frontend (GitHub Pages Root)
├── index.html                   ← SPA-Shell
├── css/                         ← Pico CSS (self-hosted) + parlabio.css (Teal-Grün #048263)
├── fonts/                       ← Oswald Variable Font (self-hosted, DSGVO)
├── js/                          ← config, utils, search, render, app + minisearch.min.js (self-hosted)
└── data/                        ← Generiert von build.py (Suchindex + Detail-JSONs)
```

### Lokal starten

```bash
pip install lxml
python parlabio/build.py --output docs/data
cd docs && python -m http.server 8080
```

Weitere Dokumentation: `parlabio/README.md`, `knowledge/parlabio.md`

## Beacon

Eine Beacon-Datei (XML:ID und GND-Nummer) findet sich unter [https://fraktionsprotokolle.de/beacon_kgparl.txt](https://www.fraktionsprotokolle.de/beacon_kgparl_gnd.txt)

## Veröffentlichungszyklus

Updates für dieses Repositorium werden veröffentlicht, sobald neue oder geänderte Dateien auf fraktionsprotokolle.de zu finden sind. Die Veröffentlichungen umfassen Korrekturen an bereits veröffentlichten und edierten Protokollen, digitalisierte und in XML konvertierte Printveröffentlichung und neue Publikationen. Sobald die Retrodigitalisierung und semantische Erschließung der bislang auf PDF basierenden alten Edition abgeschlossen ist, werden die Sitzungsprotokolle für neue Wahlperioden und Fraktionen bzw. Gruppen voraussichtlich im Drei-Jahres-Rhythmus veröffentlicht.

Neue (substantielle) Veröffentlichungen werden entsprechend als Release in Github gekennzeichnet.

## Partizipation und Feedback

Wir freuen uns über jede Anregung zu diesem Repositorium und darüber wie wir es verbessern können. Wir freuen uns auch über jeden Hinweis oder jeden Kommentar zu den edierten Quellen. Sie können uns per E-Mail info@fraktionsprotokolle.de oder gerne über das [Issue-System von Github](https://github.com/Fraktionsprotokolle-de/fraktionsprotokolle_web/issues) erreichen.

## Lizenz

Copyright © 2022 KGParl e.V. – Alle Rechte vorbehalten! Möchten Sie dieses Textkorpus verwenden oder weiter verarbeiten, bitten wir Sie, mit uns Kontakt aufzunehmen.


## Kontakt

**Dr. Sven Jüngerkes**\
Kommission für Geschichte des Parlamentarismus und der politischen Parteien (KGParl)\
Schiffbauerdamm 40\
10117 Berlin\
juengerkes@kgparl.de\
Telefon 030/206 33 94-32 - Fax 030/206 33 94-50\
http://www.kgparl.de – https://fraktionsprotokolle.de

------

[<img src="https://github.com/Fraktionsprotokolle-de/fraktionsprotokolle_web/blob/main/logos/member-of-editiones-color.png" style="zoom:50%;" />](https://e-editiones.org/)
