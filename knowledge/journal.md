# Journal – Änderungsprotokoll der Edition

Strukturierte Übersicht über die Entwicklung der Edition. Detaillierte Fassung: `Updates.md`.

## 2026

### Februar 2026
- **Personenliste**: Update (Ergänzungen und Korrekturen)
- **ParlaBio AP1**: Build-Pipeline implementiert (TEI-XML → JSON)
  - Python/lxml-Pipeline: `Personen.xml` → 11.225 Personen-JSONs + Suchindex + BEACON
  - Suchindex: 2,9 MB kompakt, Detail-JSONs: 10,2 MB (11.225 Dateien)
  - Quality Report: 134 Datenqualitätsprobleme identifiziert und dokumentiert
  - Validierungsskript (`validate_output.py`): 0 Fehler, vollständige Konsistenzprüfung
  - BEACON-Datei: 7.408 GND-verknüpfte Einträge
- **ParlaBio AP2**: Prototyp und Redesign
  - Vanilla JS SPA mit Hash-Routing, 3 Views, Pico CSS v2 classless
  - Redesign: Overview-Dashboard als Startseite (Shneiderman-Mantra: "Overview first")
  - Farbschema: Orange (#dd6f00) → Teal-Grün (#048263) aus dem Editionsprogramm-Logo
  - Dark Mode deaktiviert (nur helles Theme)
  - Suchfeld aus der Startseite in den Header verschoben (auf allen Views erreichbar)
  - Dashboard: Stat-Cards (Personentypen), Balkencharts (Fraktionen, Geschlecht), Minibars (WP, Jahrzehnte)

### Januar 2026
- **SPD 8. WP** (1976–1980): Veröffentlichung von 144 edierten Sitzungsprotokollen
  - Parallel als Buchausgabe mit wissenschaftlicher Einleitung erschienen
  - Protokolltyp: überwiegend Tonbandtranskriptionen (WN)

## 2025

### November 2025
- 19.11.: **Personenliste**: Tippfehler behoben, Updates bei `<affiliations>`
- 10.11.: **Personenliste**: Umfangreiches Update – weitere Nicht-MdB-Personen, Korrekturen

### September 2025
- **FDP 6.–9. WP** (1969–1983): Veröffentlichung von 443 edierten Sitzungsprotokollen
  - Parallel als Buchausgabe mit wissenschaftlicher Einleitung erschienen
  - Anm.: In Updates.md als „2025-09-0" datiert (Tippfehler im Tagesdatum)

## 2024

### Dezember 2024
- **Personenliste**: Nicht-MdB-Personen hinzugefügt, umfangreiche Korrekturen

### November 2024
- **Editionshinweise**: Neue Datei `Datenmodell_Editionshinweise.md` erstellt

### Oktober 2024
- **CDU/CSU 7. WP**: Korrektur falscher Dokumenten-ID

### September 2024
- **Grüne 10. WP**: Kommentierung korrigiert (Protokoll 03.05.1983)

### Juli 2024
- **CDU/CSU 6.+7. WP**: Korrektur falscher Responsability-Attribute bei `<incident>`
- **SPD 6. WP**: Fehlerkorrektur bei Retrodigitalisierung (fehlende Teile eingefügt)
- **Alle**: Entfernung interner Bearbeitungsvermerke im teiHeader

### Mai 2024
- **Alle**: Layoutverbesserungen, überflüssige Leerzeichen, fehlerhafte Personen-IDs, OCR-Fehler
- **Personenliste**: Ergänzungen und Korrekturen (Stand Mai 2024)

### März 2024
- **SPD 7. WP**: Korrektur gelöschter Absatz (Rede Günter Grass)

## 2023

### November 2023
- Personenliste: Ergänzungen/Korrekturen
- Korrigierte Schemadatei für Einleitungen

### Oktober 2023
- **SPD 2.+3. WP**: XML-Korrekturen, weitere Auszeichnung

### September 2023
- Neues RNG-Schema für digitalisierte Einleitungen

### August 2023
- Personen-Authority-File: Neue Personen, Fehlerkorrekturen
- Organisationen-File: Korrekturen, Ergänzungen

### Mai 2023
- Personenliste: Ergänzungen/Korrekturen
- XML-Korrekturen an CDU/CSU, SPD, FDP

### März–April 2023
- Personen-ID-Ergänzungen: SPD 4.+7. WP, Grüne 10.+11. WP
- Personen-Authority-File: GND-Nummern, neue Personen

### Januar 2023
- XML-Ergänzungen (Incidents, Sitzungsverlauf) bei SPD und CDU/CSU
- Personenliste, Organisationen: Updates

## 2022

### Dezember 2022
- Normalisierung von XML:IDs (Umlaute, Sonderzeichen)
- Personen-ID-Korrekturen

### November 2022
- SPD: Falsche Namenszuordnungen korrigiert
- SPD 4. WP: Sitzungsverläufe verbessert

### Juni–Oktober 2022
- Laufende Updates des Personen-Authority-File
- CDU/CSU: Verbesserung der Sitzungsverlaufsstruktur
- Grüne 10.+11. WP: Personennamenidentifizierung

### Mai 2022
- CSU-Landesgruppe: Vervollständigung
- **Grüne 10. WP**: Neu hinzugefügt

### April 2022
- Beacon-Datei: Automatische tägliche Generierung eingeführt

### Februar–März 2022
- **Grüne 11. WP**: Hinzugefügt (Vorabversion, ohne Namensauszeichnung)
- CDU/CSU: Korrektur falscher Sitzungsdaten
- CSU-LG: Korrekturen, weitere Annotationen
- Schema: Erweiterung der Bibliographie-Typen

## Meilensteine der Veröffentlichung (chronologisch)

Anm.: Die Protokollzahlen der Erstveröffentlichung 2022 sind Schätzungen; spätere WPs kamen sukzessive hinzu.

| Datum | Fraktion | Wahlperioden | Protokolle |
|---|---|---|---|
| 2022 (Erstveröffentlichung) | CDU/CSU | 1.–7. WP | 1.849 |
| 2022 | SPD | 1.–7. WP | ~1.026 |
| 2022 | FDP | 1.–5. WP | ~758 |
| 2022 | CSU-LG | 1.–9. WP | 769 |
| 2022-02 | Grüne | 11. WP | 318 |
| 2022-05 | Grüne | 10. WP | 232 |
| 2025-09 | FDP | 6.–9. WP | 443 |
| 2026-01 | SPD | 8. WP | 144 |

## Geplant

- CDU/CSU 8. WP (1976–1980): In Bearbeitung
- SPD 8. WP: Veröffentlicht (Jan 2026)
- PDS 1990–1998: In Erfassung und Bearbeitung
