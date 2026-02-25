# ParlaBio – Status-Checkliste

Stand: 25. Februar 2026

## Wer

Technischer Co-Entwickler (Claude Opus 4.6), arbeitet mit Chrisi (DH-Entwickler) an der ParlaBio-Weboberfläche. Auftraggeber: KGParl, Berlin.

## Was ist ParlaBio

Webbasierte Personendatenbank über das Personenregister der Edition "Fraktionen im Deutschen Bundestag 1949–2005". Statische SPA (Vanilla JS, Pico CSS, MiniSearch), gespeist aus einer Python/lxml-Pipeline (11.225 Personen aus TEI-XML → JSON). Deployment: GitHub Pages, kein Build-Step im Frontend.

## Arbeitspakete

- [x] **AP1** – Build-Pipeline (TEI-XML → JSON): fehlerfrei, 4,8 s, 11.225 Personen
- [x] **AP2** – Prototyp & Redesign: Dashboard, Teal-Grün, Suchfeld im Header
- [ ] **AP3** – Weboberfläche fertigstellen (in Arbeit)
- [ ] **AP4** – Deployment auf KGParl-Server
- [ ] **AP5** – Qualitätssicherung & Abnahme

## Phase 1: Bugfixes (25.02.2026)

- [x] Lagebild erstellt (Repo-Struktur, Pipeline-Lauf, Frontend-Audit)
- [x] [PLAN.md](PLAN.md) geschrieben und committed
- [x] Bug 1: Type-Key-Mismatch – Stat-Cards zeigten 0 für 7.139 Personen
- [x] Bug 2: `.map()` auf Strings – 324 Detailseiten crashten
- [x] Bug 3: Toggle-Crash – "Weitere anzeigen" crashte beim Schließen
- [x] Bug 4: `[object Object]` bei alt_names (255 Personen)
- [x] Bug 5: MdB-Stammdaten 404 → ID als Text
- [x] Bug 6: `occupation_kgparl` nie sichtbar (59 KGParl-Personen)
- [x] Smoke-Test `test_build_output.py` geschrieben (13 Tests, alle grün)
- [x] Bugfixes + Smoke-Test committed (`8a3462694`)
- [ ] Manuelle Verifikation aller 6 Fixes im Browser

## Phase 2: AP3-Features (nach Bugfix)

- [ ] Favicon hinzufügen
- [ ] Page-out-of-range-Guard (stale Bookmarks)
- [ ] Error-Handling Detailseite verbessern (Render-Crash ≠ "Person nicht gefunden")
- [ ] Verwaistes CSS `.search-form-results` aufräumen
- [ ] `aria-expanded` auf "Weitere Fraktionen"-Toggle
- [ ] Weitere UX-Verbesserungen nach Review

## Phase 3: AP4 – Deployment

- [ ] Offene KGParl-Fragen klären (siehe unten)
- [ ] Statische Dateien auf KGParl-Server (NGINX/Apache)
- [ ] HTTPS einrichten

## Phase 4: AP5 – QS & Abnahme

- [ ] Qualitätssicherung durch KGParl
- [ ] Abnahme

## Git-Status

- Branch: `main`, clean
- 6 Commits ahead of `origin/main` (noch nicht gepusht)

## Offene KGParl-Fragen (betreffen AP4+)

1. Subdomain, Unterseite oder eigenständige Domain?
2. Ersatz oder Ergänzung zum bestehenden Personenregister?
3. Wann ist der Datei-Split (Personen.xml) geplant?
4. Gibt es die Mapping-Tabelle (XML-Tags → UI) bereits?
5. Welche BEACON-Quellen sollen eingebunden werden?
6. Soll die KGParl-MA-Kategorie (59 Personen) sichtbar sein?
7. Gibt es Vorgaben zum Hosting-Pfad?
