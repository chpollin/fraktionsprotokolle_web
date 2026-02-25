# ParlaBio – Architekturentscheidungen

Stand: Februar 2026. Dokumentation der getroffenen und offenen Architekturentscheidungen.

## Build-Pipeline (AP1) – Implementiert

### Technologie

- **Sprache**: Python 3.10+
- **XML-Parsing**: lxml
- **Ausgabe**: JSON-Dateien (Suchindex + Detail-JSONs + BEACON + Quality Report)
- **Eingabe**: `xml_quellen/Normdaten/Personen*.xml` (Glob-Pattern, um künftigen Datei-Split zu unterstützen)
- **Code**: `parlabio/build.py` + 8 Module in `parlabio/build/`

### Pipeline-Schritte

1. **Ingest**: XML-Datei(en) einlesen via Glob, lxml-Parsing
2. **Parse**: `parser.py` — 4-Level-Affiliations-Flattening, Namensfelder, Life Events, idno-Normalisierung. Platzhalter-Personen überspringen. 3 Personentypen mit unterschiedlicher Parsing-Logik.
3. **Transform**: `transform.py` — Erzeugung von kompaktem Suchindex-Eintrag (~430 Bytes) und vollständigem Detail-JSON pro Person. Fraktionsnamen normalisieren (36 Mappings in `factions.py`). GND-URLs auf Bare-IDs strippen.
4. **Write**: `writer.py` — Suchindex (kompakt), Detail-JSONs (indented), Quality Report, BEACON-Datei
5. **Validate** (optional): `validate_output.py` — 7 Prüfkategorien gegen XML-Quelle

### Tatsächliche Ergebnisse

| Kennzahl | Wert |
|---|---|
| Verarbeitete Personen | 11.225 |
| Build-Laufzeit | ~4–6 Sekunden |
| Suchindex-Größe | 2,9 MB (kompakt) |
| Detail-JSONs | 11.225 Dateien, ~10 MB |
| BEACON-Einträge | 7.408 |
| Qualitätsprobleme | 134 (0 parse_error, 0 unknown_faction) |

### Rebuild-Wege

| Weg | Beschreibung |
|---|---|
| Lokal | `python parlabio/build.py` → Ergebnis per Git pushen |
| Server | SSH oder Cronjob |
| GitHub Actions | Automatisiert bei Push (optional) |

## SPA-Frontend (AP3)

### Entscheidung: SPA statt SSG

| Aspekt | SPA (gewählt) | SSG (verworfen) |
|---|---|---|
| Build-Artefakte | JSON + 1 HTML + JS | 20.000 HTML + Suchindex |
| Template-Änderung | Kein Rebuild nötig | Voller Rebuild |
| SEO | Eingeschränkt | Optimal |
| Dateimenge | Gering | Hoch |

**Begründung**: Für ein wissenschaftliches Fachportal mit ~1.000 Zugriffen/Woche ist SEO weniger kritisch als Wartbarkeit. Template-Änderungen sollen ohne Pipeline-Rebuild möglich sein.

### UI-Komponenten

| Seite | Funktion |
|---|---|
| Overview-Dashboard | Stat-Cards (Personentypen), Balkencharts (Fraktionen, Geschlecht), Minibars (WP, Jahrzehnte) – jedes Element klickbar → Filter |
| Ergebnisliste | Tabelle mit Filter-Sidebar, Removable Badges, Paginierung |
| Detailseite | Sektionen (Stammdaten, Politische Vita, Exekutive, Referenzen), Fraktions-Timeline |
| Header (alle Views) | Logo, Suchfeld, Nav-Links (Edition, KGParl) |

### CSS-Framework

**Pico CSS v2 (classless)**, self-hosted (`docs/css/pico.classless.min.css`), + eigene `parlabio.css` für Layout-Overrides (Grid, Badges, Dashboard-Komponenten, Print, @font-face). Kein Build-Step. Dark Mode explizit deaktiviert (`color-scheme: light`), alle `--pico-primary-*` Variablen auf Teal-Grün (`#048263`) überschrieben. **DSGVO-konform**: Null externe Requests (Fonts, CSS, JS lokal).

| Kriterium | Tailwind (Lastenheft) | Pico CSS (gewählt) |
|---|---|---|
| Build-Step | Zwingend (Node.js) | Keiner |
| HTML-Lesbarkeit | Utility-Klassen-Flut | Sauberes semantisches HTML |
| Scholarly Fit | Eher Startup-Ästhetik | Zurückhaltend, dokumentenzentriert |
| Wartung (1-2 Personen) | Framework-Wissen nötig | Standard-CSS reicht |
| Dark Mode | Manuell konfigurieren | Deaktiviert (helles Theme, passend zur Edition) |
| GitHub Pages | Braucht CI/CD für Build | Direkt deploybar |

**Begründung**: Für ein Projekt mit 1-2 Entwicklern und ~1.000 Zugriffen/Woche ist ein build-freier Ansatz pragmatischer. Pico CSS classless styled semantisches HTML direkt – passt zum akademischen Charakter des Projekts.

### Farbschema

Abgeleitet vom Logo des Editionsprogramms:

| Variable | Wert | Verwendung |
|---|---|---|
| Primary | `#048263` | Teal-Grün (Logofarbe), Buttons, Links, Balken |
| Primary Dark | `#036a51` | Hover-Zustand auf Buttons |
| Primary Light/Focus | `rgba(4,130,99,0.2)` | Fokus-Ringe, Hover-Hintergründe |
| Hintergrund | `#f7faf9` | Stat-Cards, Suchfeld-Hintergrund |

**Begründung**: Das bisherige Orange (`#dd6f00`) stammte nicht aus dem Corporate Design. Das Logo nutzt Teal-Grün – das Interface soll zum Editionsprogramm passen. Dark Mode wurde deaktiviert, da die Edition selbst kein Dark Theme hat.

### UI-Paradigma

**Overview first** (Shneiderman-Mantra) statt Suchfeld-zentriertem Einstieg:

| Aspekt | Vorher (AP2 v1) | Nachher (AP2 v2) |
|---|---|---|
| Startseite | Zentriertes Suchfeld (Google-Stil) | Overview-Dashboard mit Datenverteilungen |
| Einstieg | Nutzer muss wissen, was er sucht | Nutzer sieht Gesamtbild und klickt sich rein |
| Suchfeld | Dominant auf Startseite | Im Header, auf allen Views erreichbar, sekundär |

## Clientseitige Suche

### Bibliothek-Entscheidung

**MiniSearch v7**, self-hosted (`docs/js/minisearch.min.js`).

| Bibliothek | Bundle | Geschwindigkeit | Boolean | Fuzzy | Gewählt |
|---|---|---|---|---|---|
| FlexSearch | ~15 KB | <50ms bei 20k | Ja | Nein | |
| **MiniSearch** | ~20 KB | <50ms bei 20k | Ja | **Ja** | **Ja** |
| Lunr.js | ~30 KB | <50ms bei 20k | Ja | Nein | |
| Fuse.js | ~25 KB | 100-200ms | Nein | Ja | |

**Begründung**: Fuzzy Search ist kritisch für deutsche Namen (Muller/Müller, Strauss/Strauß, Maidennamen). `processTerm` normalisiert Umlaute (ä→ae, ö→oe, ü→ue, ß→ss) sowohl bei Indexierung als auch bei Suche.

### Suchindex-Design

- Kernindex (Name, Lebensdaten, Fraktion, Wahlperioden, Geschlecht, Geburtsort, Typ): **2,9 MB** bei 11.225 Personen (hochgerechnet ~5 MB bei 20.000)
- Karriere-Freitext **nicht** im Suchindex (nur in Detail-JSONs)
- Facettenfilter: eigene JS-Logik auf dem JSON-Array (nicht von der Suchbibliothek abhängig)

## BEACON

### BEACON-Generierung (Bestandteil von AP1) – Implementiert

Die BEACON-Datei wird als Teil der Build-Pipeline generiert (`parlabio/build/beacon.py`):
- 7.408 Personen mit standardkonformer GND-ID → BEACON-Format
- 8 nicht-Standard-GND-URLs werden übersprungen (im Quality Report dokumentiert)
- Format: `gnd_id||person_id`

Zusätzlich wird die BEACON-Datei weiterhin **dynamisch von eXist-db** generiert:
`https://fraktionsprotokolle.de/beacon_kgparl_gnd.txt`

### BEACON-Integration (Optional 1) – Offen

Das optionale AP erweitert die reine Generierung um die **Nutzung** der BEACON-Daten im Frontend:
- Konfigurierbare Whitelist externer BEACON-Quellen (DNB, Wikipedia, etc.)
- Vorberechnung der Linkauflösung zur Buildzeit
- UI: Gruppierte Linkliste mit Quellenangabe und Extern-Kennzeichnung

## LOD-Nachladen (Optional 2)

### CORS-Status

| Dienst | CORS | Bemerkung |
|---|---|---|
| Wikidata API | Ja | Via `origin=*` Query-Parameter |
| DNB Entity Facts | Unklar | Keine dokumentierte CORS-Policy; `hub.culturegraph.org/entityfacts` |
| VIAF | Unklar | Nicht getestet |

**Fallback**: Falls CORS nicht verfügbar → minimaler Proxy-Endpunkt auf dem KGParl-Server.

### Konzept

- Button „Externe Daten laden" auf der Detailseite
- Clientseitiger API-Abruf (kein Backend nötig, wenn CORS funktioniert)
- Quellen- und Datumskennzeichnung: „nicht redaktionell geprüft"

## Erweiterbarkeit

Architektonisch vorbereitet, aber nicht im aktuellen Scope:

| Feature | Voraussetzung |
|---|---|
| Protokoll-Verknüpfung | Build-Pipeline müsste 5.539 Protokolle parsen (erheblicher Mehraufwand) |
| Datei-Split Personen.xml | Glob-Pattern in Build-Pipeline bereits vorgesehen |
| Georeferenzierung | Externes Geocoding nötig (keine Koordinaten in den Daten) |
| Bilder | Architektur erlaubt Einbindung gemeinfreier Bilder (z.B. Wikimedia) |

## Deployment (AP4)

### Zielkonfiguration

- Statische Dateien auf NGINX/Apache (neben eXist-db)
- HTTPS-Pflicht
- Kein Container nötig

### Verzeichnisstruktur (Implementiert)

```
docs/                                ← GitHub Pages Root
├── index.html                       ← SPA-Shell (einziger Entry Point)
├── css/
│   ├── parlabio.css                 ← Custom Styles (Grid, Badges, Print, @font-face)
│   └── pico.classless.min.css       ← Pico CSS v2 (self-hosted, DSGVO)
├── fonts/
│   ├── oswald-latin.woff2           ← Oswald Variable Font (self-hosted)
│   └── oswald-latin-ext.woff2       ← Oswald Variable Font (Erweiterung)
├── js/
│   ├── app.js                       ← Routing, State, Init, Events
│   ├── config.js                    ← Zentrale Konstanten (URLs, Page-Size)
│   ├── search.js                    ← MiniSearch-Konfiguration + Facetten
│   ├── render.js                    ← Ergebnisliste + Suchterm-Highlighting
│   ├── render-overview.js           ← Overview-Dashboard + Fraktionsfarben
│   ├── render-detail.js             ← Detailseite + Karriere-Timeline
│   ├── utils.js                     ← Hilfsfunktionen, Farb-Mapping
│   └── minisearch.min.js            ← MiniSearch v7 (self-hosted, DSGVO)
├── img/
│   └── logo_editionsprogramm.svg
└── data/                            ← Generiert von build.py --output docs/data
    ├── search-index.json            ← 2,9 MB
    ├── beacon.txt
    └── person/                      ← 11.225 JSON-LD-Dateien
```

## Verwandte Dokumente

- [parlabio.md](parlabio.md) – Projektdokumentation
- [parlabio-data-analysis.md](parlabio-data-analysis.md) – Technische Datenanalyse
- [persons.md](persons.md) – Personen.xml-Dokumentation
- [design.md](design.md) – Forschungsbasierte Design-Prinzipien
- `parlabio/docs/pipeline.md` – Programmfluss-Dokumentation
- `parlabio/docs/testing.md` – Test- und Validierungsdokumentation
