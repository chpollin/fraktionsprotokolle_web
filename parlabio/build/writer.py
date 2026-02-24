"""Write output files for the ParlaBio build pipeline."""

import json
from pathlib import Path

from build.quality import QualityReport


def ensure_dirs(output_dir: Path, person_dir: Path):
    """Create output directories once before writing any files."""
    output_dir.mkdir(parents=True, exist_ok=True)
    person_dir.mkdir(parents=True, exist_ok=True)


def write_search_index(output_dir: Path, entries: list[dict], pretty: bool = False):
    """Write search-index.json."""
    path = output_dir / "search-index.json"
    with open(path, "w", encoding="utf-8") as f:
        if pretty:
            json.dump(entries, f, ensure_ascii=False, indent=2)
        else:
            json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))
    size = path.stat().st_size
    print(f"  Written {path} ({size:,} bytes, {len(entries)} entries)")


def write_detail_json(person_dir: Path, person_id: str, detail: dict):
    """Write a single person detail JSON file."""
    path = person_dir / f"{person_id}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(detail, f, ensure_ascii=False, indent=2)


def write_quality_report(output_dir: Path, report: QualityReport):
    """Write quality-report.json."""
    path = output_dir / "quality-report.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(report.to_dict(), f, ensure_ascii=False, indent=2)
    print(f"  Written {path} ({report.issue_count} issues)")


def write_beacon(output_dir: Path, lines: list[str]):
    """Write beacon.txt."""
    path = output_dir / "beacon.txt"
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
        f.write("\n")
    data_count = sum(1 for line in lines if not line.startswith("#") and line.strip())
    print(f"  Written {path} ({data_count} entries)")
