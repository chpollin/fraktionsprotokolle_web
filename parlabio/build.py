#!/usr/bin/env python3
"""ParlaBio AP1: TEI-XML person data → JSON build pipeline.

Usage:
    python parlabio/build.py                    # From repo root
    python parlabio/build.py --pretty           # Pretty-print search index
    python parlabio/build.py --no-beacon        # Skip BEACON file generation
    python parlabio/build.py --output /tmp/out  # Custom output directory
"""

import argparse
import glob
import sys
import time
from pathlib import Path

# Ensure build package is importable when running from repo root
_PARLABIO_DIR = Path(__file__).resolve().parent
if str(_PARLABIO_DIR) not in sys.path:
    sys.path.insert(0, str(_PARLABIO_DIR))

from lxml import etree

from build.parser import parse_persons
from build.transform import build_search_entry, build_detail_entry
from build.beacon import generate_beacon_lines
from build.quality import QualityReport
from build.writer import (
    ensure_dirs,
    write_search_index,
    write_detail_json,
    write_quality_report,
    write_beacon,
)


def main() -> int:
    start = time.perf_counter()

    parlabio_dir = Path(__file__).parent
    repo_root = parlabio_dir.parent
    default_input = str(repo_root / "xml_quellen" / "Normdaten" / "Personen*.xml")
    default_output = str(parlabio_dir / "data")

    parser = argparse.ArgumentParser(
        description="ParlaBio AP1: TEI-XML → JSON build pipeline"
    )
    parser.add_argument(
        "--input", default=default_input,
        help=f"Glob pattern for input XML files (default: {default_input})"
    )
    parser.add_argument(
        "--output", default=default_output,
        help=f"Output directory (default: {default_output})"
    )
    parser.add_argument(
        "--no-beacon", action="store_true",
        help="Skip BEACON file generation"
    )
    parser.add_argument(
        "--pretty", action="store_true",
        help="Pretty-print search-index.json (larger file)"
    )
    args = parser.parse_args()

    output_dir = Path(args.output)

    # Find input files
    xml_files = sorted(glob.glob(args.input))
    if not xml_files:
        print(f"ERROR: No input files matching {args.input}", file=sys.stderr)
        return 1

    # Parse
    report = QualityReport()
    all_persons = []

    for xml_path in xml_files:
        print(f"Parsing {xml_path}...")
        tree = etree.parse(xml_path)
        persons = parse_persons(tree, report)
        all_persons.extend(persons)

    print(f"Parsed {len(all_persons)} persons from {len(xml_files)} file(s)")

    # Transform and write
    search_entries = []
    person_dir = output_dir / "person"
    ensure_dirs(output_dir, person_dir)
    detail_count = 0

    for person in all_persons:
        detail = build_detail_entry(person, report)
        search = build_search_entry(person, report)
        write_detail_json(person_dir, person["id"], detail)
        search_entries.append(search)
        detail_count += 1

    print(f"  Written {detail_count} detail files to {person_dir}")
    write_search_index(output_dir, search_entries, pretty=args.pretty)
    write_quality_report(output_dir, report)

    # BEACON
    if not args.no_beacon:
        beacon_lines = generate_beacon_lines(all_persons)
        write_beacon(output_dir, beacon_lines)

    elapsed = time.perf_counter() - start
    print(f"\nDone. {len(search_entries)} persons, {report.issue_count} quality issues. ({elapsed:.1f}s)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
