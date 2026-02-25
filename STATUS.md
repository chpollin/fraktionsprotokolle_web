# ParlaBio – Status-Checkliste

Stand: 25. Februar 2026

## Wer

Technischer Co-Entwickler (Claude Opus 4.6), arbeitet mit Chrisi (DH-Entwickler) an der ParlaBio-Weboberfläche. Auftraggeber: KGParl, Berlin.

## Was ist ParlaBio

Webbasierte Personendatenbank über das Personenregister der Edition "Fraktionen im Deutschen Bundestag 1949–2005". Statische SPA (Vanilla JS, Pico CSS, MiniSearch), gespeist aus einer Python/lxml-Pipeline (11.225 Personen aus TEI-XML → JSON). Deployment: GitHub Pages, kein Build-Step im Frontend.

## Arbeitspakete

- [x] **AP1** – Build-Pipeline (TEI-XML → JSON): fehlerfrei, 4,8 s, 11.225 Personen
- [x] **AP2** – Prototyp & Redesign: Dashboard, Teal-Grün, Suchfeld im Header
- [x] **AP3** – Weboberfläche fertigstellen (4 Phasen: Bugfixes, UX, a11y, UI/DSGVO)
- [ ] **AP4** – Deployment auf KGParl-Server
- [ ] **AP5** – Qualitätssicherung & Abnahme

## Phase 1: Bugfixes (25.02.2026) – ABGESCHLOSSEN

- [x] Lagebild erstellt (Repo-Struktur, Pipeline-Lauf, Frontend-Audit)
- [x] PLAN.md geschrieben und committed
- [x] Bug 1: Type-Key-Mismatch – Stat-Cards zeigten 0 für 7.139 Personen
- [x] Bug 2: `.map()` auf Strings – 324 Detailseiten crashten
- [x] Bug 3: Toggle-Crash – "Weitere anzeigen" crashte beim Schließen
- [x] Bug 4: `[object Object]` bei alt_names (255 Personen)
- [x] Bug 5: MdB-Stammdaten 404 → ID als Text
- [x] Bug 6: `occupation_kgparl` nie sichtbar (59 KGParl-Personen)
- [x] Smoke-Test `test_build_output.py` geschrieben (13 Tests, alle grün)
- [x] Bugfixes + Smoke-Test committed (`8a3462694`)
- [ ] Manuelle Verifikation aller 6 Fixes im Browser

## Phase 2: Wissenschaftliche UX (25.02.2026) – ABGESCHLOSSEN

- [x] Favicon (Teal-FP-SVG) hinzugefügt
- [x] Page-out-of-range-Guard (stale Bookmarks → URL-Korrektur)
- [x] Error-Handling: 3 getrennte Fehlermeldungen (404/Netzwerk/Render-Crash)
- [x] Detailseite umstrukturiert: Profil-Card oben, Stammdaten aufklappbar (Shneiderman)
- [x] Sortieroptionen: Relevanz/Name/Geburtsjahr, URL-persistent
- [x] Karriere-Timeline: Gantt-Visualisierung mit Fraktionsfarben (Tufte)
- [x] Zitations-Export: Klartext + BibTeX mit Kopier-Button (FAIR)
- [x] personType-Subtitle-Bug gefixt (Mitarbeiter-KGParl + Other)
- [x] 7 neue Tests (TestFrontendAssets), gesamt 20/20 grün
- [x] Committed (`f11634c91`, `72eeeaee2`)
- [ ] Manuelle Verifikation aller Features im Browser

## Phase 3: Barrierefreiheit (a11y) – ABGESCHLOSSEN (25.02.2026)

- [x] Skip-Link für Tastaturnavigation
- [x] aria-Labels auf allen Formularelementen (Suchfeld, Sort-Select, Filter)
- [x] Focus-Management bei Route-Wechsel, focus-visible-Outlines
- [x] Screen-Reader-Announce via aria-live-Region
- [x] WCAG-konforme Touch-Targets (min 44px)
- [x] Committed (`c76390575`)

## Phase 4: UI/UX-Verbesserungen + DSGVO Self-Hosting – ABGESCHLOSSEN (25.02.2026)

- [x] Fraktionsfarben im Dashboard-Balkenchart (27 Farben aus FACTION_COLORS)
- [x] Geschlecht-Balken: Teal (männlich) / Mauve (weiblich)
- [x] Geburtsjahrzehnte-Labels: Rotation + Kurzform ('70, '80, ...)
- [x] Mobile Suche ermöglicht (480px-Breakpoint umgeschrieben)
- [x] Ergebnistabelle: Zebra-Striping, größere Badges, Suchterm-Highlighting
- [x] Detailseite: Zurück-Button, subtilere h3-Linien, Stammdaten-Card
- [x] DSGVO: Google Fonts, Pico CSS, MiniSearch lokal self-hosted (0 externe Requests)
- [x] Committed (UI/UX + DSGVO Self-Hosting)

## AP3 – ABGESCHLOSSEN (14 Commits, 4 Phasen)

## Nächste Schritte: AP4 – Deployment

- [ ] Offene KGParl-Fragen klären (siehe unten)
- [ ] Statische Dateien auf KGParl-Server (NGINX/Apache)
- [ ] HTTPS einrichten

## Danach: AP5 – QS & Abnahme

- [ ] Qualitätssicherung durch KGParl
- [ ] Abnahme

## Git-Status

- Branch: `main`, clean
- Mehrere Commits ahead of `origin/main` (noch nicht gepusht)

## Offene KGParl-Fragen (betreffen AP4+)

1. Subdomain, Unterseite oder eigenständige Domain?
2. Ersatz oder Ergänzung zum bestehenden Personenregister?
3. Wann ist der Datei-Split (Personen.xml) geplant?
4. Gibt es die Mapping-Tabelle (XML-Tags → UI) bereits?
5. Welche BEACON-Quellen sollen eingebunden werden?
6. Soll die KGParl-MA-Kategorie (59 Personen) sichtbar sein?
7. Gibt es Vorgaben zum Hosting-Pfad?
