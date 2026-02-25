# ParlaBio – Implementierungsplan

Stand: 25. Februar 2026

## Lagebild

| AP | Titel | Status |
|---|---|---|
| AP1 | Build-Pipeline (TEI-XML → JSON) | Abgeschlossen |
| AP2 | Prototyp & Redesign | Abgeschlossen |
| **AP3** | **Weboberfläche (SPA-Frontend)** | **In Arbeit** |
| AP4 | Deployment & Dokumentation | Offen |
| AP5 | Qualitätssicherung & Abnahme | Offen |

**Build-Pipeline**: Fehlerfrei, 4,8 s, 11.225 Personen, 134 bekannte Quality-Issues.
**Git**: Branch `main`, clean, 4 Commits nicht gepusht.
**KGParl-Fragen**: 7 offene Fragen (Domain, Hosting, etc.) – betreffen erst AP4, blockieren AP3 nicht.

---

## Phase 1: 6 Frontend-Bugs fixen

Frontend-Audit vom 25.02.2026 – alle Bugs verifiziert gegen Code + Daten.

### Bug 1 – Type-Key-Mismatch (KRITISCH)

**Problem**: Daten enthalten `"Other"` (7.080) und `"Mitarbeiter-KGParl"` (59), UI erwartet `"Sonstige"` und `"KGParl"`. Stat-Cards zeigen 0, Klick liefert 0 Ergebnisse. 7.139 Personen über Dashboard nicht erreichbar.

**Dateien**: `docs/js/render-overview.js` (Z. 41–43, 90, 95), `docs/js/utils.js` (Z. 163–167), `docs/js/search.js` (Z. 44)

**Fix**:
- `render-overview.js`: Keys auf `'Other'` / `'Mitarbeiter-KGParl'` ändern, Stat-Card-Hrefs anpassen
- `utils.js` `typeLabel()`: Mapping auf echte Daten-Keys (`'Other'` → "Sonstige", `'Mitarbeiter-KGParl'` → "KGParl-Mitarbeiter")
- `search.js`: Kommentar korrigieren

### Bug 2 – `.map()` auf Strings (CRASH, 325 Detailseiten)

**Problem**: `exekutive` (1 Person) und `sonstiges` (324 Personen) sind Strings im JSON, Code ruft `.map()` auf → TypeError → "Person nicht gefunden".

**Datei**: `docs/js/render-detail.js` (Z. 81–89, 127–136)

**Fix**: `Array.isArray()`-Guard – Strings als `<p>`, Arrays als `<ul>`.

### Bug 3 – Toggle-Crash beim Schließen

**Problem**: `toggleBtn.textContent.match(/\d+/)` → `null` → `null[0]` → TypeError beim zweiten Klick auf "Weitere Fraktionen".

**Dateien**: `docs/js/app.js` (Z. 136–138), `docs/js/render-overview.js` (Z. 72)

**Fix**: Count im `data-count`-Attribut des Buttons speichern statt aus textContent parsen.

### Bug 4 – `[object Object]` bei alt_names (255 Personen)

**Problem**: `alt_names` ist Array von Objekten `{reg, forename, surname, ...}`, `.join('; ')` liefert `[object Object]`.

**Datei**: `docs/js/render-detail.js` (Z. 42)

**Fix**: `altNames.map(n => typeof n === 'string' ? n : n.reg).join('; ')`

### Bug 5 – MdB-Stammdaten-Links 404 (4.084 Personen)

**Problem**: URL `bundestag.de/abgeordnete/biografien/{id}` liefert 404. Kein stabiles ID-basiertes URL-Schema auf bundestag.de.

**Datei**: `docs/js/render-detail.js` (Z. 101–102)

**Fix**: Stammdaten-ID als Text anzeigen (kein Link). Entscheidung: ID ist weiterhin nützlich als Identifikator.

### Bug 6 – occupation_kgparl nie sichtbar (59 Personen)

**Problem**: `occupation_kgparl` ist Objekt `{organisation, role, from, to}`, Code prüft `.length` → `undefined`, `.map()` nie erreicht. Feld `role` statt `occupation` in den Daten.

**Datei**: `docs/js/render-detail.js` (Z. 44–54)

**Fix**: Objekt in Array normalisieren, Feld `role` statt `occupation` lesen.

### Zusammenfassung Phase 1

| Datei | Bugs |
|---|---|
| `docs/js/render-detail.js` | 2, 4, 5, 6 |
| `docs/js/render-overview.js` | 1, 3 |
| `docs/js/utils.js` | 1 |
| `docs/js/app.js` | 3 |
| `docs/js/search.js` | 1 (Kommentar) |

5 Dateien, 6 Bugs, keine neuen Dateien, keine Architektur-Änderungen.

### Verifikation Phase 1

1. `python parlabio/build.py --output docs/data` – Pipeline unverändert, muss fehlerfrei laufen
2. Lokaler Server: `cd docs && python -m http.server 8080`
3. Manuell prüfen:
   - Stat-Cards: 4.086 / 7.080 / 59 (nicht 0)
   - Klick auf "Sonstige"-Card → 7.080 Ergebnisse
   - Detailseite `AhrensKarl_1969-10-20` → Exekutive-Sektion sichtbar
   - Person mit `sonstiges` → Sonstiges-Sektion sichtbar
   - Fraktionen-Toggle: auf/zu/auf/zu ohne Crash
   - `BartzObermeierJulia_2013-10-22` → lesbarer Alternativname
   - MdB-Referenz → Stammdaten-ID als Text
   - `BakendorfJerome` → "Berufliche Laufbahn" sichtbar

---

## Phase 2: AP3-Features (nach Bugfix)

Aus dem Frontend-Audit abzuleitende Aufgaben – noch zu spezifizieren:

- [ ] Favicon hinzufügen
- [ ] Page-out-of-range-Guard (stale Bookmarks)
- [ ] Verwaistes CSS `.search-form-results` aufräumen
- [ ] Error-Handling Detailseite verbessern (Render-Crash ≠ "Person nicht gefunden")
- [ ] `aria-expanded` auf "Weitere Fraktionen"-Toggle
- [ ] Weitere UX-Verbesserungen nach Review

---

## Phase 3: AP4 – Deployment (abhängig von KGParl-Antworten)

- Statische Dateien auf KGParl-Server (NGINX/Apache)
- HTTPS
- Kein Container nötig
- Offene Fragen: Domain/Pfad, Hosting-Vorgaben

## Phase 4: AP5 – QS & Abnahme

- Qualitätssicherung durch KGParl
- Abnahme
