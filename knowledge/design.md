# ParlaBio – Design-Prinzipien

Stand: Februar 2026. Forschungsbasierte Gestaltungsprinzipien fuer das ParlaBio-Frontend. Ergaenzt [parlabio-architecture.md](parlabio-architecture.md) (technische Entscheidungen) um die wissenschaftliche Begruendung der Interface-Gestaltung.

## Forschungsrahmen

ParlaBio ist eine prosopographische Datenbank im Kontext einer digitalen wissenschaftlichen Edition. Die Gestaltung orientiert sich an fuenf Forschungsstroemungen:

| Prinzip | Quelle | Kernaussage |
|---|---|---|
| Generous Interfaces | Whitelaw 2015 | Digitale Sammlungen sollen nicht mit einer leeren Suchmaske beginnen, sondern die Sammlung als Ganzes zeigen – Visualisierungen, Einstiegspunkte, Muster |
| Visual Information Seeking Mantra | Shneiderman 1996 | "Overview first, zoom and filter, then details on demand" |
| Synoptische Biografie-Visualisierung | Windhager/Mayr 2017 | Biografische Daten brauchen mehrere Perspektiven: chronologisch, kategorial, geographisch, relational |
| Evaluationsrahmen fuer DSE-Interfaces | Bleier et al. 2025 | Digitale Editionen muessen Discoverability, Usability, Sustainability, Transparency, Interoperability und Accessibility erfuellen |
| RIDE-Kriterien | Sahle 2014 | Zitierfaehigkeit, Normdaten-Verknuepfung, Transparenz der Methodik, Langzeitverfuegbarkeit |

### Referenzprojekte

| Projekt | Relevanz fuer ParlaBio |
|---|---|
| BiographySampo (Hyvoenen et al. 2019) | Engste Parallele: ~13.000 Biografien, Facettensuche, Timeline, Linked Data. Zeigt Wert von Perspektiven-Wechsel (Tabelle/Timeline/Karte) |
| APIS (Schloegl et al. 2018) | Prosopographie im deutschsprachigen Raum. Entitaeten-Modell Person↔Institution↔Ort. Vorbild fuer Normdaten-Verknuepfung |

## Angewandte Prinzipien

### 1. Overview First (Shneiderman / Whitelaw)

**Umgesetzt im Overview-Dashboard:** Stat-Cards, Balkencharts, Minibars zeigen die Sammlung als Ganzes. Jedes Element ist klickbar und fuehrt zur gefilterten Ergebnisliste.

**Was das fuer ParlaBio bedeutet:** Die 11.225 Personen sind nicht hinter einer Suchmaske versteckt. Der Nutzer sieht sofort: Wie viele MdBs? Welche Fraktionen dominieren? Wie verteilen sich die Geburtsjahrzehnte? Das erzeugt "Information Scent" (Pirolli/Card 1999) – der Nutzer erkennt, was die Datenbank enthaelt, bevor er sucht.

### 2. Facettierte Exploration (Hearst 2006)

**Umgesetzt in der Filter-Sidebar:** Typ, Fraktion, Wahlperiode, Geschlecht, Geburtsjahrzehnt. Aktive Filter als Removable Badges. Facetten-Counts zeigen die Ergebnismenge pro Wert.

**Design-Entscheidung:** Facetten sind primaer, Volltextsuche ist sekundaer (im Header). Begruendung: In einer prosopographischen Datenbank suchen Forscher haeufiger nach Kategorien ("Alle SPD-Frauen der 5. WP") als nach einzelnen Namen.

### 3. Chronologische Perspektive (Windhager/Mayr)

**Umgesetzt in der Career-Timeline auf der Detailseite:** Gantt-artige Darstellung der Fraktionszugehoerigkeiten mit farbigen Balken pro Fraktion, positioniert auf einer Zeitachse.

**Was wir haben:** `fraktionsprotokolle:affiliations` mit Start-/Enddaten pro Wahlperiode und Fraktion. Max. 13 Affiliationen pro Person, 263 Fraktionswechsler. Diese Daten eignen sich ideal fuer eine Timeline-Visualisierung.

**Was wir nicht haben (und bewusst weglassen):**
- Geographische Perspektive: `birth_place` ist Freitext ohne Koordinaten. Geocoding waere fehleranfaellig und eine externe Abhaengigkeit.
- Relationale Perspektive: Keine Person-Person-Relationen in den Daten. Nur Person→Fraktion.

### 4. Linked Data und Normdaten (Sahle / Bleier)

**Umgesetzt:**
- JSON-LD mit Schema.org-Kontext fuer jede Person
- BEACON-Datei (7.408 GND-IDs) fuer maschinelle Vernetzung
- Externe Referenzen: GND, Wikipedia, MdB-Stammdaten, VIAF
- `sameAs`-Property fuer Linked-Data-Kompatibilitaet

**Forschungsbasis:** Sahle (2014) fordert Normdaten-Verknuepfung als Qualitaetsmerkmal digitaler Editionen. Bleier et al. (2025) bewerten Interoperability als eigenstaendiges Kriterium. ParlaBio erfuellt beide Anforderungen durch das JSON-LD/Schema.org-Datenmodell und die BEACON-Integration.

### 5. Zitierfaehigkeit (Sahle / FAIR)

**Umgesetzt:**
- Stabile Permalinks basierend auf `xml:id`: `#/person/AbeleinManfred_1965-10-19`
- Zitationsexport in Klartext und BibTeX auf jeder Detailseite
- Copy-to-Clipboard fuer beide Formate

**Begruendung:** Wissenschaftliche Nachnutzbarkeit erfordert, dass jede Person eindeutig referenzierbar und formal zitierbar ist. FAIR-Prinzip F1 (Findability) verlangt persistente Identifikatoren.

### 6. Namenszentriertes Design

**Entscheidung:** Das Interface ist namenszentriert, nicht fraktionszentriert.

**Begruendung:** 63% der Personen (7.080 von 11.225) sind Typ "Other" ohne Fraktionszugehoerigkeit. Ein fraktionszentriertes Design wuerde die Mehrheit der Datensaetze marginalisieren. Die Suche priorisiert den Nachnamen (Boost-Faktor 3 in MiniSearch).

## Barrierefreiheit

### Anforderungen

ParlaBio ist ein oeffentlich gefoerdertes Forschungsinfrastrukturprojekt (Foerderung durch den Deutschen Bundestag). Die Barrierefreiheitsstaerkungsgesetz (BFSG, seit 28. Juni 2025) und die BITV 2.0 verlangen WCAG 2.1 Level AA als Minimalstandard fuer oeffentlich zugaengliche Webangebote.

### Umsetzungsziele

| Bereich | Anforderung | Status |
|---|---|---|
| Semantisches HTML | Landmarks (`header`, `nav`, `main`, `footer`), korrekte Heading-Hierarchie | Grundstruktur vorhanden |
| Tastaturnavigation | Alle interaktiven Elemente muessen fokussierbar und bedienbar sein | Teilweise (native HTML-Elemente) |
| Screenreader | `aria-label` auf Formularelementen, `aria-live` fuer dynamische Inhalte, Skip-Link | Lueckenhaft |
| Kontraste | Mindestens 4.5:1 fuer Text, 3:1 fuer grosse Schrift (WCAG AA) | Erfuellt (Primary #048263 auf Weiss = 5.3:1) |
| Focus-Management | Nach Route-Wechsel muss der Fokus auf den neuen Inhalt gesetzt werden | Fehlt |
| Touch-Targets | Mindestens 44x44px fuer interaktive Elemente (WCAG 2.5.5) | Teilweise zu klein |
| Formulare | Alle Eingabefelder mit sichtbarem oder programmatischem Label | Lueckenhaft (Sort-Select ohne Label) |

### Fraktionsfarben und Farbenblindheit

Die 20+ Fraktionsfarben nutzen automatische Kontrastberechnung (Schwarz oder Weiss auf Farbhintergrund, basierend auf Luminanz-Schwellenwert 0.5). Zusaetzlich tragen alle Fraktions-Badges ein Text-Label – Farbe ist nie der einzige Informationstraeger.

## Typografie

| Element | Font | Groesse | Begründung |
|---|---|---|---|
| Ueberschriften | Oswald (Google Fonts) | h1: 2.5rem, h2: 1.1rem, h3: 1.0rem | Konsistent mit fraktionsprotokolle.de |
| Fliesstext | System-Font (Pico CSS Default) | 16px / 1rem | Lesbarkeit, kein externer Font noetig |
| Stat-Card-Zahlen | Oswald 600 | 2rem | Visuelle Dominanz fuer Kennzahlen |

## Print-Design

Die Detailseite ist druckoptimiert (`@media print`):
- Header, Footer, Navigation, Filter werden ausgeblendet
- Fraktions-Badges werden auf Schwarz/Weiss mit Rand umgestellt
- Links zeigen ihre URL in Klammern: `Person (https://d-nb.info/gnd/...)`

## Was bewusst nicht umgesetzt wird

| Feature | Begruendung |
|---|---|
| Dark Mode | Die Edition fraktionsprotokolle.de hat kein Dark Theme. Konsistenz geht vor |
| Karten-Visualisierung | Geburtsorte sind Freitext ohne Koordinaten. Geocoding waere fehleranfaellig |
| Netzwerk-Graphen | Keine Person-Person-Relationen in den Daten. Nur Person→Fraktion |
| Vergleichsansicht | Kein dokumentierter Forschungs-Use-Case |
| LOD-Nachladen (v1) | CORS-Abhaengigkeiten, Latenz, fragile externe APIs. Bleibt als Optional 2 fuer spaeter |

## Verwandte Dokumente

- [parlabio-architecture.md](parlabio-architecture.md) – Technische Architekturentscheidungen
- [parlabio.md](parlabio.md) – Projektdokumentation und Arbeitspakete
- [parlabio-data-analysis.md](parlabio-data-analysis.md) – Datenmodell und Qualitaetsanalyse

## Literatur

- Bleier, R. et al. (2025). Digital Scholarly Editions as Interfaces. *Variants*, 16.
- Hearst, M. A. (2006). Design Recommendations for Hierarchical Faceted Search Interfaces. *ACM SIGIR Workshop on Faceted Search*.
- Hyvoenen, E. et al. (2019). BiographySampo – Publishing and Enriching Biographies on the Semantic Web. *Extended Semantic Web Conference (ESWC)*.
- Pirolli, P. & Card, S. (1999). Information Foraging. *Psychological Review*, 106(4).
- Sahle, P. (2014). Kriterienkatalog fuer die Besprechung digitaler Editionen. *RIDE – A Review Journal for Digital Editions and Resources*.
- Schloegl, M. et al. (2018). APIS – Austrian Prosopographical Information System. *Digital Humanities Austria*.
- Shneiderman, B. (1996). The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations. *IEEE Symposium on Visual Languages*.
- Whitelaw, M. (2015). Generous Interfaces for Digital Cultural Collections. *Digital Humanities Quarterly*, 9(1).
- Windhager, F. & Mayr, E. (2017). Synoptic Visualization of Biographical Data. *InfoVis Workshop on Visualization for the Digital Humanities*.
