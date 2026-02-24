# ParlaBio – Architekturentscheidungen

Stand: Februar 2026. Dokumentation der getroffenen und offenen Architekturentscheidungen.

## Build-Pipeline (AP1)

### Technologie

- **Sprache**: Python
- **XML-Parsing**: lxml
- **Ausgabe**: JSON-Dateien (Suchindex + Detail-JSONs)
- **Eingabe**: `xml_quellen/Normdaten/Personen*.xml` (Glob-Pattern, um künftigen Datei-Split zu unterstützen)

### Pipeline-Schritte

1. **Ingest**: XML-Datei(en) einlesen, lxml-Parsing, Strukturvalidierung
2. **Validate**: Datenqualitäts-Checks (ungültige Daten loggen, Bericht erzeugen)
3. **Transform**: Erzeugung von Suchindex-JSON und Detail-JSONs pro Person
   - Fraktionsnamen normalisieren (Freitext → Kürzel via Mapping-Tabelle)
   - 4-Level-Affiliationen flattening
   - Leere Platzhalter überspringen
   - Drei Personentypen mit unterschiedlicher Parsing-Logik
4. **Deploy**: JSON-Dateien in das Web-Verzeichnis kopieren

### Rebuild-Wege

| Weg | Beschreibung |
|---|---|
| Lokal | `python build.py` → Ergebnis per Git pushen |
| Server | SSH oder Cronjob |
| GitHub Actions | Automatisiert bei Push (optional) |

## SPA-Frontend (AP2)

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

Empfohlen: **FlexSearch** oder **MiniSearch** (finale Entscheidung nach Prototyp in AP4).

| Bibliothek | Bundle | Geschwindigkeit | Boolean | Fuzzy |
|---|---|---|---|---|
| FlexSearch | ~15 KB | <50ms bei 20k | Ja | Nein |
| MiniSearch | ~20 KB | <50ms bei 20k | Ja | Ja |
| Lunr.js | ~30 KB | <50ms bei 20k | Ja | Nein |
| Fuse.js | ~25 KB | 100-200ms | Nein | Ja |

### Suchindex-Design

- Kernindex (Name, Lebensdaten, Fraktion, Wahlperioden, Geschlecht, Geburtsort, Typ): **unter 5 MB** bei 20.000 Personen
- Karriere-Freitext **nicht** im Suchindex (nur in Detail-JSONs)
- Facettenfilter: eigene JS-Logik auf dem JSON-Array (nicht von der Suchbibliothek abhängig)

## BEACON-Integration (Optional 1)

### Ist-Zustand

Die BEACON-Datei wird aktuell **dynamisch von eXist-db** generiert:
`https://fraktionsprotokolle.de/beacon_kgparl_gnd.txt`

### ParlaBio-Ansatz

Generierung zur **Buildzeit** aus Personen.xml:
- Alle Personen mit befüllter GND-ID → BEACON-Format
- Konfigurierbare Whitelist externer BEACON-Quellen
- Vorberechnung der Linkauflösung (welche externen Portale haben Einträge für diese GND?)
- UI: Gruppierte Linkliste mit Extern-Kennzeichnung

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

## Deployment (AP3)

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
