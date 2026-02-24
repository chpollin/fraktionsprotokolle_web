"""Shared constants for the ParlaBio build pipeline."""

TEI_NS = "http://www.tei-c.org/ns/1.0"
XML_NS = "{http://www.w3.org/XML/1998/namespace}"
NS = {"t": TEI_NS}

# Placeholder person IDs to skip entirely
PLACEHOLDER_IDS = frozenset({
    "MdB_divers",
    "MdB_Genderunbekannt",
    "MdB_maennlich",
    "MdB_weiblich",
    "NN_weiblich",
    "NN_maennlich",
    "NN_divers",
    "NN_Genderunbekannt",
    "xy_ersetzen",
})

# GND URL prefix (used by transform.py and beacon.py)
GND_PREFIX = "https://d-nb.info/gnd/"

# Normalize idno @type values (case-insensitive key → canonical key)
IDNO_TYPE_NORMALIZE = {
    "mdb_stammdaten": "mdb_stammdaten",
    "gnd": "gnd",
    "wikipedia": "wikipedia",
    "viaf": "viaf",
    "ndb": "ndb",
}
