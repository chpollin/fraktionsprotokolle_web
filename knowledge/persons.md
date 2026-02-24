# Personendatenbank (Personen.xml)

## Übersicht

- **Datei**: `xml_quellen/Normdaten/Personen.xml`
- **Umfang**: ~364.555 Zeilen, ca. 11.000 Personeneinträge
- **Format**: TEI-XML (`<listPerson>`)
- **Letztes Update**: 13. Februar 2026

Die Personendatenbank ist die Grundlage des Personenregisters auf fraktionsprotokolle.de und der Beacon-Datei. Technische Datenanalyse für die ParlaBio-Build-Pipeline: siehe [parlabio-data-analysis.md](parlabio-data-analysis.md).

## Struktur eines Personeneintrags

```xml
<person xml:id="NachnameVorname_JJJJ-MM-TT">
    <persName n="1">
        <reg>Vollständiger Anzeigename</reg>
        <forename>Vorname</forename>
        <surname>Nachname</surname>
        <addName type="praefix"/>      <!-- z.B. "von", "de" -->
        <roleName/>                     <!-- z.B. akadem. Titel -->
        <addName type="Ort"/>           <!-- Ortszusatz -->
    </persName>
    <sex value="m|f|d|x"/>
    <birth>
        <date when="JJJJ-MM-TT"/>
        <placeName>Geburtsort</placeName>
        <country/>
    </birth>
    <death>
        <date when="JJJJ-MM-TT"/>
        <placeName>Sterbeort</placeName>
        <country/>
    </death>
    <affiliation type="Erwerbsarbeit">Berufsbezeichnung</affiliation>
    <affiliation role="Legislative_MDB" type="Wahlperioden">
        <!-- Verschachtelte Zugehörigkeiten pro Wahlperiode -->
    </affiliation>
    <affiliation type="Exekutive"/>
    <affiliation type="Sonstiges"/>
    <idno type="MDB_Stammdaten">11000001</idno>
    <idno type="GND">https://d-nb.info/gnd/...</idno>
    <idno type="Wikipedia">https://de.wikipedia.org/wiki/...</idno>
    <idno type="NDB"/>
</person>
```

## xml:id-Konvention

Format: `NachnameVorname_JJJJ-MM-TT`

- Das Datum entspricht dem Beginn des Bundestagsmandats (bei MdBs)
- Bei Nicht-MdBs kann ein anderes Datum verwendet werden
- Die ID ist persistent und projektweit eindeutig
- In Protokollen referenziert als `ref="#NachnameVorname_JJJJ-MM-TT"`

## Personentypen

Die Datei enthält drei `<listPerson>`-Bereiche:

| Typ | Ab Zeile | Beschreibung |
|---|---|---|
| `<listPerson type="MdB">` | 72 | Mitglieder des Deutschen Bundestages (alle WPs bis 2017) |
| `<listPerson type="Other">` | 186.969 | Weitere in der Edition genannte Personen (Minister, Beamte, Journalisten etc.) |
| `<listPerson type="Mitarbeiter-KGParl">` | 363.036 | Mitarbeiterinnen und Mitarbeiter der KGParl |

## Normdaten pro Person

| `<idno>` Typ | Beschreibung | Elemente gesamt | Davon befüllt |
|---|---|---|---|
| `MDB_Stammdaten` | Stammdatennummer des Bundestages | ~4.088 | ~4.088 (nur MdB) |
| `GND` | Gemeinsame Normdatei (Deutsche Nationalbibliothek) | ~11.169 | ~3.657 |
| `Wikipedia` | Link zum Wikipedia-Artikel | ~11.255 | ~6.889 |
| `NDB` | Neue Deutsche Biographie | ~11.244 | 0 (nie befüllt) |
| `VIAF` | Virtual International Authority File | ~206 | ~205 (+ 1x als `Viaf` – Inkonsistenz) |

## Affiliations-Hierarchie

```
affiliation[@role="Legislative_MDB" @type="Wahlperioden"]
  └── affiliation[@type="Wahlperiode" @period="#wp05"]
        └── affiliation[@type="Fraktionszugehoerigkeiten" @from @to]
              └── affiliation[@type="Fraktionszugehoerigkeit" @from]
                    Text: "Fraktion der ..."
```

## Strukturelle Unterschiede nach Personentyp

| Merkmal | MdB | Other | Mitarbeiter-KGParl |
|---|---|---|---|
| `<addName type="praefix">` | Ja | Nein | Ja |
| `<roleName>` | Ja | Nein | Ja |
| `<affiliation type="Erwerbsarbeit">` | Ja (Freitext) | Ja (Freitext) | Nein |
| `<affiliation role="Legislative_MDB">` | Ja (4-Level) | Nein | Nein |
| `<affiliation type="Exekutive">` | Ja (meist leer) | Nein | Nein |
| `<affiliation type="Sonstiges">` | Ja (meist leer) | Nein | Nein |
| `<occupation>` | Nein | Nein | Ja (statt affiliation) |
| `<idno type="MDB_Stammdaten">` | Ja | Nein | Nein |

## Bekannte Datenqualitätsprobleme

| Problem | Häufigkeit | Details |
|---|---|---|
| Leere `<date/>`-Elemente | ~4.000 | Fehlende Geburts-/Sterbedaten |
| Nur-Jahr-Daten (`when="1906"`) | 1.010 | Unvollständige Datumsangabe |
| Nur Jahr-Monat (`when="1906-05"`) | 19 | Seltener Sonderfall |
| Ungültige Daten | mind. 3 | z.B. `when="2917-11-20"`, `when="2042-12-30"` |
| Platzhalterdaten `from="0001"` | ~59 | Nur bei Mitarbeiter-KGParl |
| `<idno type="NDB"/>` immer leer | 11.244 | Feld ist nie befüllt |
| VIAF-Inkonsistenz | 1 | `Viaf` statt `VIAF` als Typbezeichnung |
| Leere Platzhalter-Affiliationen | ~4.089 | `<affiliation type="Exekutive"/>` und `<affiliation type="Sonstiges"/>` bei MdBs |
| Historische Ortsnamen | viele | z.B. „Parabutsch, Batschka (heute: Ratkovo, Bačka, Serbien)" |
| Maidennamen im `<reg>`-Feld | 324 | z.B. `<reg>Annemarie Ackermann, geb. Eisenmann</reg>` |

### Geschlechterverteilung

| `<sex value>` | Anzahl |
|---|---|
| `m` (männlich) | 9.749 |
| `f` (weiblich) | 1.494 |
| `x` (andere) | 4 |
| `d` (divers) | 2 |

## Beacon-Datei

Automatisch täglich generiert: `https://fraktionsprotokolle.de/beacon_kgparl_gnd.txt`
Enthält alle Personen-`xml:id`s mit zugehöriger GND-Nummer. Wird von eXist-db erzeugt (nicht im Repository enthalten).

## Organisationen (Organisationen.xml)

- **Datei**: `xml_quellen/Normdaten/Organisationen.xml`
- **Umfang**: ~4.645 Zeilen
- Nicht-hierarchische Liste von Organisationen, Zeitungen, Institutionen

### Struktur eines Organisationseintrags

```xml
<org xml:id="KurzID" role="news|pol|com|soc">
    <orgName full="yes">Vollständiger Name</orgName>
    <orgName full="abb">Abkürzung</orgName>
    <idno type="gnd">...</idno>
    <idno type="wikipedia">...</idno>
    <!-- Selten auch: -->
    <idno type="VIAF">...</idno>
    <idno type="zdb">...</idno>  <!-- Zeitschriftendatenbank -->
</org>
```

### Rollen (`@role`)

| Wert | Beschreibung |
|---|---|
| `news` | Zeitungen, Zeitschriften, Medien |
| `pol` | Politische/gewerkschaftliche Einrichtungen |
| `com` | Unternehmen, wirtschaftliche Organisationen |
| `soc` | Kirchen, zivilgesellschaftliche Einrichtungen |
| `XXX` | Unbekannt/nicht zugeordnet |
