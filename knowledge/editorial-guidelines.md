# Editionsrichtlinien

Zusammenfassung der TEI-Kodierungsrichtlinien der Edition. Vollständige Fassung: `md-seitentexte/Datenmodell_Editionshinweise.md` (Stand: Dezember 2021, überarbeitet Juli 2025).

## Datenherkunft

### Retrodigitalisierte Protokolle (Altdaten, bis ~1969)
1. Buchvorlagen gescannt + OCR, oder Satzdaten aus PDF extrahiert
2. Konversion zu TEI-XML durch Firma textloop
3. Semantische Anreicherung durch KGParl

### Born-digital-Protokolle (ab 8. WP, 1976)
- Direkt aus Archivvorlagen erstellt (Textdigitalisate und XML-Dateien basieren auf den Archivvorlagen)

### Tonband-Transkriptionen
Die Praxis der Tonbandaufzeichnung und -transkription variiert nach Fraktion:
- **CDU/CSU**: Ab September 1966 (5. WP) zeitgenössische wörtliche Niederschriften auf Tonbandgrundlage (Typ WZ)
- **SPD 6. WP**: Beide Formen parallel – Verlaufsprotokoll (EP) und Audiotranskript (WN); ab 1969/70 ergänzende Tonbandaufnahmen (2–4 Stunden Laufzeit)
- **SPD ab 7. WP**: Primär Audiotranskripte durch Editionsteam (WN); andere Formen nur als Fallback
- **SPD ab Mitte 1970er**: Tonbandmitschnitte übernehmen die Protokollfunktion; schriftlich nur noch Sprecherverzeichnisse
- **FDP**: Überwiegend knappe Verlaufsprotokolle (EP), ab 5./6. WP umfangreicher
- **CSU-LG**: Mischform Verlaufs-/Ergebnisprotokoll (EP)
- **Grüne**: Häufig Beschlussprotokolle mit umfangreichen Materialanhängen

## Editorischer Workflow

Bearbeitungsphasen und Statuswerte: siehe [workflow.md](workflow.md). Statuswerte im Schema: siehe [schema.md](schema.md) (`<change @status>`).

## Textbehandlung

### Schriftliche Vorlagen
- Layoutlogik der Originalfassung vereinfacht übertragen
- Orthografie nach zum Entstehungszeitpunkt gültiger Rechtschreibung
- Kleinere Fehler stillschweigend korrigiert
- Größere Eingriffe durch `<note type="critical">` dokumentiert
- Falsche Namen/Daten berichtigt, Auslassungen markiert

### Tonband-Transkripte
- Lesbare Edition angestrebt, kein linguistisches Volltranskript
- Mündlicher Charakter beibehalten (unvollständige Sätze etc.)
- Interpunktion und Absätze redaktionell ergänzt
- Alle Sprecher möglichst namentlich zugeordnet
- `<gap/>` für unverständliche Passagen (Störgeräusche, undeutliche Aussprache)
  - Bei CDU/CSU: Oft mit `<note type="critical">` und Hinweis „Anmerkung im Original"
  - Bei SPD-Transkripten: In der Regel ohne Erläuterung
- `<pause dur="PT00H10M00S"/>` für Sprechpausen (ISO-8601-Dauer, z.B. 10 Minuten)
  - Tritt auf, wenn das Band weiterläuft, aber nicht gesprochen wird
- `<incident>` für nichtverbale Vorfälle (Beifall, Zwischenrufe, Unruhe)
  - `<desc resp="#vorlage">` – in zeitgenössischer Vorlage vermerkt
  - `<desc resp="#BearbeiterID">` – vom Editionsteam festgestellt

## Personennamen

- Jeder Name mit `@role="Sprecher"` oder `@role="Erwaehnung"` gekennzeichnet
- Verknüpfung mit Personen-ID aus Personen.xml via `@ref`
- Funktionsbezeichnungen werden ebenfalls zugeordnet (z.B. "Vizekanzler" → Brandt)
- `@cert="low"` bei unsicherer Identifizierung

## Bibliographische Angaben

- Verknüpfung mit Zotero-Gruppenbibliothek (ID im `@corresp`-Attribut)
- Bei retrodigitalisierten Protokollen oft noch ohne Zotero-Verknüpfung
- Autorennamen in `<hi rendition="#smcap">`

## Verweise (Parlamentaria)

- BT-Plenarprotokolle: `<bibl type="btp"><ref type="external" target="WP/Sitzung">`
- BT-Drucksachen: `<bibl type="btd"><ref type="external" target="WP/Nr">`
- URL-Resolver erzeugt automatisch Links zum DIP des Bundestages
