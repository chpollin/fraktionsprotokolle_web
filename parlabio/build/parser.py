"""Parse TEI-XML person data into intermediate Python dicts.

This is the core module of the build pipeline. It walks the lxml tree
and produces a list of flat Python dicts, one per person.
"""

from lxml import etree

from build.constants import TEI_NS, XML_NS, NS, PLACEHOLDER_IDS, IDNO_TYPE_NORMALIZE
from build.factions import is_faction
from build.dates import parse_date_when, validate_date
from build.quality import QualityReport


def parse_persons(tree: etree._ElementTree, report: QualityReport) -> list[dict]:
    """Parse all <person> elements from a TEI tree.

    Returns a list of intermediate dicts, one per person.
    Placeholder persons are skipped.
    """
    root = tree.getroot()
    persons = []

    for list_person in root.iter(f"{{{TEI_NS}}}listPerson"):
        person_type = list_person.get("type", "Unknown")

        for person_el in list_person.iter(f"{{{TEI_NS}}}person"):
            # Only direct children, not nested persons
            if person_el.getparent() is not list_person:
                continue

            person_id = person_el.get(f"{XML_NS}id", "")

            if person_id in PLACEHOLDER_IDS:
                report.add("skipped_placeholder", person_id, "Placeholder person skipped")
                continue

            if not person_id:
                report.add("missing_id", "UNKNOWN", "Person element without xml:id")
                continue

            try:
                person = _parse_person(person_el, person_id, person_type, report)
                persons.append(person)
            except Exception as e:
                report.add("parse_error", person_id, f"Exception during parsing: {e}")

    return persons


def _parse_person(el, pid: str, ptype: str, report: QualityReport) -> dict:
    """Parse a single <person> element into a dict."""

    # === NAME ===
    persnames = el.findall(f"{{{TEI_NS}}}persName")
    primary_name_el = None
    alt_name_els = []
    for pn in persnames:
        if pn.get("n") == "1":
            primary_name_el = pn
        else:
            alt_name_els.append(pn)
    if primary_name_el is None and persnames:
        primary_name_el = persnames[0]

    name_data = _parse_name(primary_name_el, pid, report)
    alt_names = [_parse_name(n, pid, report) for n in alt_name_els]

    # === SEX ===
    sex_el = el.find(f"{{{TEI_NS}}}sex")
    sex = sex_el.get("value", "") if sex_el is not None else ""

    # === BIRTH / DEATH ===
    birth = _parse_life_event(el, f"{{{TEI_NS}}}birth", pid, report)
    death = _parse_life_event(el, f"{{{TEI_NS}}}death", pid, report)

    # === OCCUPATION / CAREER ===
    occupation = ""
    exekutive = ""
    sonstiges = ""
    for aff in el.findall(f"{{{TEI_NS}}}affiliation"):
        aff_type = aff.get("type")
        aff_text = aff.text.strip() if aff.text else ""
        if not aff_text:
            continue
        if aff_type == "Erwerbsarbeit" and not occupation:
            occupation = aff_text
        elif aff_type == "Exekutive" and not exekutive:
            exekutive = aff_text
        elif aff_type == "Sonstiges" and not sonstiges:
            sonstiges = aff_text

    # Occupation from <occupation> (Mitarbeiter-KGParl only)
    occupation_structured = None
    occ_el = el.find(f"{{{TEI_NS}}}occupation")
    if occ_el is not None:
        occupation_structured = _parse_occupation(occ_el, pid, report)

    # === AFFILIATIONS (MdB only) ===
    affiliations = []
    for aff in el.findall(f"{{{TEI_NS}}}affiliation"):
        if aff.get("role") == "Legislative_MDB":
            affiliations = _parse_affiliations(aff, pid, report)
            break

    # === IDENTIFIERS ===
    ids = _parse_idnos(el, pid, report)

    return {
        "id": pid,
        "type": ptype,
        "name": name_data,
        "alt_names": alt_names,
        "sex": sex,
        "birth": birth,
        "death": death,
        "occupation": occupation,
        "exekutive": exekutive,
        "sonstiges": sonstiges,
        "occupation_structured": occupation_structured,
        "affiliations": affiliations,
        "ids": ids,
    }


def _parse_name(el, pid: str, report: QualityReport) -> dict:
    """Parse a <persName> element."""
    if el is None:
        report.add("missing_name", pid, "No persName element found")
        return {"reg": "", "forename": "", "surname": "", "prefix": "", "role_name": "", "place": ""}

    def _text(tag):
        child = el.find(f"{{{TEI_NS}}}{tag}")
        return child.text.strip() if child is not None and child.text else ""

    def _text_attr(tag, attr_name, attr_value):
        for child in el.findall(f"{{{TEI_NS}}}{tag}"):
            if child.get(attr_name) == attr_value:
                return child.text.strip() if child.text else ""
        return ""

    return {
        "reg": _text("reg"),
        "forename": _text("forename"),
        "surname": _text("surname"),
        "prefix": _text_attr("addName", "type", "praefix"),
        "role_name": _text("roleName"),
        "place": _text_attr("addName", "type", "Ort"),
    }


def _parse_life_event(person_el, tag: str, pid: str, report: QualityReport) -> dict:
    """Parse <birth> or <death>."""
    el = person_el.find(tag)
    if el is None:
        return {"date": None, "place": "", "country": ""}

    date_el = el.find(f"{{{TEI_NS}}}date")
    date_raw = date_el.get("when", "") if date_el is not None else ""
    date_val = parse_date_when(date_raw) if date_raw else None

    # Validate date
    if date_raw:
        for issue in validate_date(date_raw, pid):
            report.add("date_issue", pid, issue)

    place_el = el.find(f"{{{TEI_NS}}}placeName")
    place = place_el.text.strip() if place_el is not None and place_el.text else ""

    country_el = el.find(f"{{{TEI_NS}}}country")
    country = country_el.text.strip() if country_el is not None and country_el.text else ""

    return {"date": date_val, "place": place, "country": country}


def _parse_affiliations(legislative_el, pid: str, report: QualityReport) -> list[dict]:
    """Parse the 4-level affiliation hierarchy into a flat list.

    Structure:
      affiliation[@role="Legislative_MDB" @type="Wahlperioden"]       (Level 1)
        affiliation[@type="Wahlperiode" @period="#wpNN"]               (Level 2)
          affiliation[@type="Fraktionszugehoerigkeiten" @from @to]     (Level 3)
            affiliation[@type="Fraktionszugehoerigkeit" @from]  TEXT   (Level 4)

    Each Level 4 element becomes one entry in the output list.
    Non-faction entries (committees, ministries) are filtered via is_faction().
    """
    result = []

    for wp_el in legislative_el.findall(f"{{{TEI_NS}}}affiliation"):
        if wp_el.get("type") != "Wahlperiode":
            continue

        period_ref = wp_el.get("period", "")
        period_num = _extract_period_number(period_ref)

        for fz_el in wp_el.findall(f"{{{TEI_NS}}}affiliation"):
            if fz_el.get("type") != "Fraktionszugehoerigkeiten":
                continue

            block_from = fz_el.get("from", "")
            block_to = fz_el.get("to", "")

            for faction_el in fz_el.findall(f"{{{TEI_NS}}}affiliation"):
                if faction_el.get("type") != "Fraktionszugehoerigkeit":
                    continue

                faction_full = faction_el.text.strip() if faction_el.text else ""
                if not faction_full:
                    continue

                # Filter out committee/ministry names (not factions)
                if not is_faction(faction_full):
                    continue

                faction_from = faction_el.get("from", "")

                result.append({
                    "period": period_num,
                    "period_ref": period_ref,
                    "faction_full": faction_full,
                    "from": faction_from or block_from,
                    "to": block_to,
                })

    return result


def _extract_period_number(period_ref: str) -> int | None:
    """Extract integer from '#wp05' -> 5."""
    if period_ref.startswith("#wp"):
        try:
            return int(period_ref[3:])
        except ValueError:
            return None
    return None


def _parse_occupation(occ_el, pid: str, report: QualityReport) -> dict:
    """Parse <occupation> element (Mitarbeiter-KGParl)."""
    from_date = occ_el.get("from", "")
    to_date = occ_el.get("to", "")

    name_el = occ_el.find(f"{{{TEI_NS}}}name")
    org_name = name_el.text.strip() if name_el is not None and name_el.text else ""
    org_ref = name_el.get("ref", "") if name_el is not None else ""
    # The role text is in the tail of the <name> element: "KGParl</name> (Studentische Hilfskraft)"
    role = name_el.tail.strip() if name_el is not None and name_el.tail else ""
    role = role.strip("() ")

    if from_date == "0001":
        report.add("placeholder_date", pid, "occupation from='0001'")
        from_date = None
    if to_date == "0001":
        report.add("placeholder_date", pid, "occupation to='0001'")
        to_date = None

    return {
        "organisation": org_name,
        "org_ref": org_ref,
        "role": role,
        "from": from_date,
        "to": to_date,
    }


def _parse_idnos(person_el, pid: str, report: QualityReport) -> dict:
    """Parse all <idno> elements into a dict."""
    ids = {
        "mdb_stammdaten": None,
        "gnd": None,
        "wikipedia": None,
        "viaf": None,
    }

    for idno in person_el.findall(f"{{{TEI_NS}}}idno"):
        raw_type = idno.get("type", "")
        normalized_type = IDNO_TYPE_NORMALIZE.get(raw_type.lower())

        if normalized_type is None:
            if raw_type.lower() != "ndb":
                report.add("unknown_idno_type", pid, f"Unknown idno type: {raw_type}")
            continue

        if normalized_type == "ndb":
            continue  # Always empty, skip

        value = idno.text.strip() if idno.text else ""
        if not value:
            continue

        # Log case inconsistencies (Viaf vs VIAF)
        canonical_cases = {"MDB_Stammdaten", "GND", "Wikipedia", "VIAF"}
        if raw_type not in canonical_cases and raw_type.lower() in IDNO_TYPE_NORMALIZE:
            report.add("idno_case_inconsistency", pid,
                        f"idno type='{raw_type}' (normalized to '{normalized_type}')")

        ids[normalized_type] = value

    return ids
