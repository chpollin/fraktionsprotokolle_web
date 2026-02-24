# Editorischer Workflow

## Überblick

Der Weg eines Sitzungsprotokolls von der Archivvorlage zur veröffentlichten XML-Datei.

## Quelltypen

| Quelltyp | Pipeline |
|---|---|
| Retrodigitalisierung (WP 1–5) | Buchvorlage/CD-ROM → Scan + OCR / PDF-Extraktion → textloop (Word → TEI-XML) → KGParl |
| Born-digital (ab WP 8) | Archivvorlage → Direkte XML-Erfassung → KGParl |
| Tonband-Transkription | Audioaufnahme → Digitalisierung → Transkription → TEI-XML |

Differenzierung der Tonband-Transkription nach Fraktion: siehe [editorial-guidelines.md](editorial-guidelines.md#tonband-transkriptionen).

## Bearbeitungsphasen

Statuswerte (`<change @status>`): siehe [schema.md](schema.md#change--revisionsstatus).

### Phase 0: Konversion (nur Altdaten)
textloop-1_raw → textloop-2_basic (automatische Konversion Word → KGParl-schemakonformes TEI-XML)

### Phase I: Textkritische Erfassung (draft → textkritik)
1. **Metadaten** im `<teiHeader>`: titleStmt, sourceDesc, profileDesc, classDecl
2. **Sitzungsverlauf** in `<front>`: Nummerierte Liste, IDs, ggf. Teilnehmerlisten
3. **Texterfassung** in `<body>`: `<div type="SVP">`, Absatzgliederung, Texteingriffe
4. **Semantische Anreicherung**: Personennamen + Rollen, `<gap/>`, `<incident>`, `<pause>`

### Phase II: Kommentierung (textkritik → kommentierung)
1. **Inhaltliche Kommentare** (`<note type="comment">`)
2. **Bibliographische Auszeichnung** (`<bibl>`) mit Parlamentaria und Zotero
3. **Textkritische Anmerkungen** (`<note type="critical">`)

### Phase III: Finalisierung (kommentierung → final → public)
Schema-Validierung, Qualitätsprüfung, Freischaltung

## Werkzeuge

| Tool | Verwendung |
|---|---|
| Oxygen XML Editor | Hauptbearbeitungswerkzeug mit projektspezifischer Benutzeroberfläche |
| Zotero | Bibliographieverwaltung (Gruppenbibliothek) |
| eXist-db | XML-Datenbank für Webpublikation |
| TEI Publisher | Webpräsentation und -rendering |
| GitHub | Versionierung und Veröffentlichung der Quelldaten |

## Qualitätssicherung

- Schema-Validierung (Relax-NG + Schematron) bei jeder Bearbeitung
- Personen-ID-Abgleich mit Personen.xml
- Regelmäßige Korrekturrunden (dokumentiert in Updates.md)
- Editionsfachbeirat zur wissenschaftlichen Begleitung

## Veröffentlichungszyklus

- Laufende Updates: Personenliste, Organisationenliste, Fehlerkorrekturen
- Substantielle Releases: Neue Fraktionen/Wahlperioden (auf GitHub als Release gekennzeichnet)
- Ziel: Drei-Jahres-Rhythmus für neue WPs (nach Abschluss der Retrodigitalisierung)
- Webseite wird spätestens 24h nach GitHub-Veröffentlichung aktualisiert
