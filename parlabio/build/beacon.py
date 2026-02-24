"""BEACON file generation (GND-based)."""

from datetime import datetime, timezone

from build.constants import GND_PREFIX

BEACON_HEADER = """\
#FORMAT: BEACON
#PREFIX: https://d-nb.info/gnd/
#TARGET: https://www.fraktionsprotokolle.de/person.html?id={{ID}}
#FEED: https://www.fraktionsprotokolle.de/beacon_kgparl_gnd.txt
#MESSAGE: Verzeichnis aller IDs mit GND in den Fraktionsprotokollen
#INSTITUTION: KGParl
#TIMESTAMP: {timestamp}
"""


def generate_beacon_lines(persons: list[dict]) -> list[str]:
    """Generate BEACON file content lines (header + data)."""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [BEACON_HEADER.format(timestamp=timestamp)]

    for person in persons:
        gnd = person["ids"].get("gnd")
        if not gnd:
            continue

        if gnd.startswith(GND_PREFIX):
            gnd_id = gnd[len(GND_PREFIX):]
        else:
            continue  # Non-standard GND URL, skip for BEACON

        lines.append(f"{gnd_id}||{person['id']}")

    return lines
