# ParlaBio – Statusbericht

Stand: 25. Februar 2026, 18:00 Uhr

## Wer

Technischer Co-Entwickler (Claude Opus 4.6), arbeitet mit Chrisi (DH-Entwickler) an der ParlaBio-Weboberfläche. Auftraggeber: KGParl, Berlin.

## Was ist ParlaBio

Webbasierte Personendatenbank über das Personenregister der Edition "Fraktionen im Deutschen Bundestag 1949–2005". Statische SPA (Vanilla JS, Pico CSS, MiniSearch), gespeist aus einer Python/lxml-Pipeline (11.225 Personen aus TEI-XML → JSON). Deployment: GitHub Pages, kein Build-Step im Frontend.

## Abgeschlossene Arbeitspakete

| AP | Titel | Status |
|---|---|---|
| AP1 | Build-Pipeline (TEI-XML → JSON) | Abgeschlossen – fehlerfrei, 4,8 s, 11.225 Personen |
| AP2 | Prototyp & Redesign | Abgeschlossen – Dashboard, Teal-Grün, Suchfeld im Header |

## Was heute passiert ist

### Lagebild erstellt

- Repository-Struktur dokumentiert
- Build-Pipeline ausgeführt (fehlerfrei, 4,8 s)
- Frontend-Audit durchgeführt: 6 Bugs gefunden und gegen Code + Daten verifiziert
- [PLAN.md](PLAN.md) geschrieben und committed

### 6 Frontend-Bugs gefixt

Alle Bugs waren im Frontend (`docs/js/`) lokalisiert und unabhängig von offenen KGParl-Fragen.

| # | Bug | Fix | Datei(en) |
|---|---|---|---|
| 1 | **Type-Key-Mismatch** – Stat-Cards "Sonstige"/"KGParl-MA" zeigten 0 (7.139 Personen über Dashboard nicht erreichbar) | Keys auf tatsächliche Daten-Werte `"Other"` / `"Mitarbeiter-KGParl"` geändert, `typeLabel()` erweitert | render-overview.js, utils.js, search.js |
| 2 | **Crash** – `.map()` auf Strings (`exekutive`/`sonstiges`) → TypeError auf 324 Detailseiten | `Array.isArray()`-Guard: Strings als `<p>`, Arrays als `<ul>` | render-detail.js |
| 3 | **Crash** – "Weitere anzeigen"-Toggle crashte beim Schließen (Regex auf null) | Count in `data-count`-Attribut gespeichert statt aus textContent geparst | app.js, render-overview.js |
| 4 | **Display** – `alt_names` zeigte `[object Object]` (255 Personen) | `.map(n => n.reg)` vor `.join()` | render-detail.js |
| 5 | **Broken Link** – MdB-Stammdaten-URLs führten zu 404 (4.084 Personen) | ID als Text angezeigt statt totem Link (Bundestag hat kein stabiles ID-URL-Schema) | render-detail.js |
| 6 | **Silent** – `occupation_kgparl` nie sichtbar (59 KGParl-Personen) | Objekt→Array-Normalisierung, `o.role` statt `o.occupation` gelesen | render-detail.js |

### Smoke-Test geschrieben

Neuer Test: `parlabio/tests/test_build_output.py` – **13 Tests, alle grün** (2,9 s).

Prüft den Datenvertrag zwischen Pipeline und Frontend:

- **Search-Index**: Alle 3 Typen vorhanden (`MdB`, `Other`, `Mitarbeiter-KGParl`), Counts plausibel, Pflichtfelder, keine unbekannten Typen
- **Detail-JSONs**: 5 Stichproben pro Typ, Pflichtfelder + Identifier, Datenstruktur-Checks für `exekutive`, `sonstiges`, `alt_names`, `occupation_kgparl`
- **BEACON**: Zeilenanzahl == Anzahl GND-Einträge im Index

## Geänderte Dateien (noch nicht committed)

```
docs/js/render-detail.js    28 Zeilen geändert (Bugs 2, 4, 5, 6)
docs/js/render-overview.js  10 Zeilen geändert (Bugs 1, 3)
docs/js/utils.js             5 Zeilen geändert (Bug 1)
docs/js/app.js               3 Zeilen geändert (Bug 3)
docs/js/search.js            2 Zeilen geändert (Bug 1, Kommentar)
parlabio/tests/test_build_output.py  NEU (13 Tests)
```

## Git-Status

- Branch: `main`, clean (bis auf die obigen Änderungen)
- 5 Commits ahead of `origin/main` (noch nicht gepusht)
- Kein Rebase, keine Force-Pushes

## Was als Nächstes ansteht

### Sofort

- [ ] Bugfixes + Smoke-Test committen
- [ ] Manuelle Verifikation aller 6 Fixes im Browser

### Kurzfristig (AP3 – Weboberfläche fertigstellen)

- [ ] Favicon hinzufügen
- [ ] Page-out-of-range-Guard
- [ ] Error-Handling Detailseite verbessern
- [ ] Verwaistes CSS aufräumen
- [ ] `aria-expanded` auf Toggle-Button
- [ ] Weitere UX-Verbesserungen nach Review

### Mittelfristig

- [ ] AP4 – Deployment auf KGParl-Server (NGINX/Apache, HTTPS)
- [ ] AP5 – Qualitätssicherung und Abnahme durch KGParl

### Offene KGParl-Fragen (betreffen AP4+)

1. Subdomain, Unterseite oder eigenständige Domain?
2. Ersatz oder Ergänzung zum bestehenden Personenregister?
3. Wann ist der Datei-Split (Personen.xml) geplant?
4. Gibt es die Mapping-Tabelle (XML-Tags → UI) bereits?
5. Welche BEACON-Quellen sollen eingebunden werden?
6. Soll die KGParl-MA-Kategorie (59 Personen) sichtbar sein?
7. Gibt es Vorgaben zum Hosting-Pfad?
