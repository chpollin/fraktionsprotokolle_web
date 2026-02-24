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
| Startseite | Suchfeld, Einführungstext |
| Ergebnisliste | Tabelle/Kacheln mit Filtern, Removable Badges, Paginierung |
| Detailseite | Sektionen (Stammdaten, Politische Vita, Referenzen), Fraktions-Timeline, Edition-Links |

### CSS-Framework

Tailwind CSS (Lastenheft-Vorschlag, wird übernommen).

## Clientseitige Suche

### Bibliothek-Entscheidung

Empfohlen: **FlexSearch** oder **MiniSearch** (finale Entscheidung nach Prototyp in AP2).

| Bibliothek | Bundle | Geschwindigkeit | Boolean | Fuzzy |
|---|---|---|---|---|
| FlexSearch | ~15 KB | <50ms bei 20k | Ja | Nein |
| MiniSearch | ~20 KB | <50ms bei 20k | Ja | Ja |
| Lunr.js | ~30 KB | <50ms bei 20k | Ja | Nein |
| Fuse.js | ~25 KB | 100-200ms | Nein | Ja |

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

### Verzeichnisstruktur (Entwurf)

```
/parlabio/
├── index.html          (SPA-Shell)
├── app.js              (Rendering + Suche)
├── style.css           (Tailwind-Build)
├── data/
│   ├── search-index.json
│   └── person/
│       ├── AbeleinManfred_1965-10-19.json
│       └── ...
├── locales/
│   ├── de.json
│   └── en.json
└── beacon.txt          (optional)
```

## Verwandte Dokumente

- [parlabio.md](parlabio.md) – Projektdokumentation
- [parlabio-data-analysis.md](parlabio-data-analysis.md) – Technische Datenanalyse
- [persons.md](persons.md) – Personen.xml-Dokumentation
- `parlabio/docs/pipeline.md` – Programmfluss-Dokumentation
- `parlabio/docs/testing.md` – Test- und Validierungsdokumentation
