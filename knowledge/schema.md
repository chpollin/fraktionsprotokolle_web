# TEI-Schema der Fraktionsprotokolle

## Übersicht

Das Schema basiert auf einer TEI-P5-Customization (ODD-Datei) und wird in zwei Validierungsdateien kompiliert:

- `xml_schema/fraktionsprotokolle.rng` – Relax-NG-Schema (strukturelle Validierung)
- `xml_schema/fraktionsprotokolle.sch` – Schematron (inhaltliche Constraints)
- `xml_schema/fraktionsprotokolle.odd` – ODD-Quelldatei (TEI-Customization)
- `xml_schema/fraktionsprotokolle_einleitungen.rng` – Separates Schema für Einleitungen

Schema generiert aus TEI P5 Version 4.9.0 (24. Januar 2025).

## Verwendete TEI-Module

| Modul | Ausgeschlossene Elemente |
|---|---|
| `header` | abstract, appInfo, classCode, keywords |
| `core` | biblScope, foreign, graphic, lg, term |
| `tei` | (vollständig) |
| `textstructure` | back, titlePage, titlePart, docTitle, docAuthor, byline, epigraph, floatingText |
| `namesdates` | persName, placeName |
| `msdescription` | msDesc, msIdentifier, layoutDesc, handDesc, accMat, history, provenance, origin, bindingDesc, sealDesc |
| `figures` | figDesc, graphic |
| `linking` | link, linkGrp, ptr, term, join, joinGrp |
| `spoken` | annotationBlock, broadcast, equipment, kinesic, recording, recordingStmt, scriptStmt, shift, u, vocal, writing |

## Wichtige Element-Constraints (Value Lists)

### `<TEI>` (Wurzelelement)
- `@rendition` (required): `fraktionsprotokolle`
- `@xml:id` (required): Eindeutiger Dokumentidentifikator

### `<div>` – Textabschnitte
`@type` (required, closed list):
- **front** (redaktionelle Zuordnung, nicht im Schema erzwungen): `SVPListe`, `Anwesenheitsliste`, `Kopfdaten`
- **body** (redaktionelle Zuordnung): `SVP`, `SVPsub`, `Anhang`

### `<bibl>` – Bibliographische Angaben
`@type` (required, closed list):
| Wert | Beschreibung |
|---|---|
| `single-item` | Monographie, Aufsatz, Sammelband |
| `series-item` | Zeitschriften, Nachschlagewerke |
| `item-in-archive` | Archivalien |
| `btp` | BT Plenarprotokolle |
| `btd` | BT Drucksachen |
| `bgbl` | Bundesgesetzblatt |
| `brp` | Bundesratsprotokolle |
| `brd` | Drucksachen des Bundesrats |
| `dip` | DIP-Parlamentsmaterialien |
| `kbp` | Kabinettsprotokolle |
| `VOBl` | Verordnungs-/Gesetzesblätter |
| `Parl-Prot` | Plenarprotokolle (z.B. Landesparlamente) |
| `online` | Online-Quellen |

### `<name>` – Namensauszeichnung
- `@type` (required): `Person`, `Ort`, `Organisation`, `Institution`
- `@role` (optional): `Sitzungsleitung`, `Sprecher`, `Erwaehnung`, `Mitarbeiter-KGParl`
- `@ref` (optional, semi-open list – die in der ODD gelisteten Werte sind Vorschläge für den Oxygen-Editor, die Liste ist erweiterbar): Verweis auf Personen-/Organisations-ID (z.B. `#HindenburgBarbara`)
- `@cert` (optional): `low` (bei unsicherer Zuordnung)

### `<note>` – Anmerkungen
`@type` (required, closed list):
| Wert | Verwendung |
|---|---|
| `critical` | Textkritische Anmerkung |
| `comment` | Inhaltliche Anmerkung |
| `source` | Anmerkung in der Vorlage |
| `Kommentar-Edition` | Header: Editionskommentar |
| `Erstveroeffentlichung` | Header: Erstveröffentlichung |
| `Verbundene-Protokolle` | Header: Verbundene Protokolle |

### `<ref>` – Querverweise
- `@type` (required): `internal` | `external`
- `@target` (required): Ziel-ID oder URL

### `<list>` – Aufzählungen
`@type` (required): `undefined`, `SVP`, `SVPsub`, `Anwesenheitsliste`, `Anwesenheitsliste_gegliedert`

### `<hi>` – Hervorhebungen
`@rendition` (required): `#smcap` (Kapitälchen), `#sup`, `#sub`, `#u` (unterstrichen), `#g` (gesperrt), `#c` (zentriert)

### `<seg>` – Segmente
`@type` (required): `note` (Anmerkungsbezug), `necrology` (Nekrolog)

### `<table>` – Tabellen
`@rendition` (required): `#hidden` (dezente Linien), `#boxed` (deutliche Linien)

### `<change>` – Revisionsstatus
`@status` (required):
| Wert | Phase |
|---|---|
| `textloop-1_raw` | Konvertierte Word-Rohdaten |
| `textloop-2_basic` | KGParl-schemakonforme Basisdatei |
| `draft` | Basisfassung |
| `textkritik` | Textkritisch bearbeitet |
| `kommentierung` | Kommentiert |
| `final` | Editorische Bearbeitung abgeschlossen |
| `public` | Für Web freigeschaltet |

### `<object>` – Quellenbeschreibung
`@type` (required): `Papier`, `Audio`, `tbd`

### `<said>` – Direkte/Indirekte Rede
`@direct` (required): `true` | `false`

### `<affiliation>` (Personen.xml)
`@type` (required): `Wahlperioden`, `Wahlperiode`, `Fraktionszugehoerigkeiten`, `Fraktionszugehoerigkeit`, `Legislative`, `Legislative_MDB`, `Erwerbsarbeit`, `Exekutive`, `Sonstiges`

### `<org>` (Organisationen.xml)
`@role` (required): `news`, `pol`, `com`, `soc`

### `<sex>` (Personen.xml)
`@value` (required): `m`, `f`, `d`, `x`

### `<p>` – Absätze
`@rendition` (optional): `#right` (rechtsbündig), `#center` (zentriert)

### `<idno>` – Identifikatoren
`@type` (recommended, closed list): `url`, `isbn`, `DNB`, `ZOTERO`, `sitzung`, `wp`, `Fraktion-Landesgruppe`, `sitzungsabfolge`

### `<date>` – Datumsangaben
`@type` (optional, closed list): `firstpart`, `secondpart`, `thirdpart` (für mehrtägige Sitzungen)

### `<title>` – Titel
- `@level` (optional): `a` (analytic level), `s` (series level)
- `@xml:lang` (optional): `de` (Deutsch), `en` (Englisch)

### `<head>` – Überschriften
`@type` (optional): `number`

### `<settlement>` – Ortsangaben
`@type` (required): `town` (Stadt/Ort)

### `<availability>` – Verfügbarkeit
`@status` (required): `restricted` (Alle Rechte vorbehalten)

### `<orgName>` – Organisationsnamen
`@xml:id` (required): Eindeutiger Identifikator

### `<pause>` – Sprechpausen
`@dur` (required): ISO-8601-Zeitdauer, z.B. `PT00H10M00S` (10 Minuten)

## Attributklassen

### Komplett gelöschte Klassen (mode="delete")

`att.anchoring`, `att.calendarSystem` (Anm.: in ODD als `att.calendarSytem` mit Tippfehler), `att.cmc`, `att.datable.custom`, `att.datable.iso`, `att.datcat`, `att.declaring`, `att.dimensions`, `att.duration.iso`, `att.editLike`, `att.global.source`, `att.msExcerpt`, `att.ranging`, `att.sortable`, `att.scope`, `att.written`

### Teilweise modifizierte Klassen (mode="change")

| Klasse | Gelöschte Attribute |
|---|---|
| `att.canonical` | `@key` |
| `att.datable` | `@period` |
| `att.declarable` | `@default`, `@ident` |
| `att.global` | `@xml:base`, `@xml:space` |
| `att.global.linking` | `@prev`, `@sameAs`, `@synch`, `@copyOf`, `@select`, `@exclude` |
| `att.global.rendition` | `@rend`, `@style` |
| `att.naming` | `@nymRef` |
| `att.personal` | `@full`, `@sort` |
| `att.pointing` | `@targetLang`, `@evaluate` |
| `att.styleDef` | `@source` |
| `att.typed` | `@subtype` |
