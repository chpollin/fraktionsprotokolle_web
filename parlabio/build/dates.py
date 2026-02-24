"""Date parsing and validation for the ParlaBio build pipeline."""

import re

_RE_FULL = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_RE_YEAR_MONTH = re.compile(r"^\d{4}-\d{2}$")
_RE_YEAR = re.compile(r"^\d{4}$")


def parse_date_when(raw: str | None) -> str | None:
    """Parse a when="" attribute value. Returns cleaned string or None."""
    if not raw:
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None
    return cleaned


def extract_year(date_str: str | None) -> int | None:
    """Extract year as integer from a date string. Returns None on failure.

    Used for the search index where only the year matters.
    """
    if not date_str:
        return None
    cleaned = date_str.strip()
    if not cleaned:
        return None

    # BC dates not useful for search filtering
    if cleaned.startswith("-"):
        return None

    parts = cleaned.split("-")
    try:
        year = int(parts[0])
    except ValueError:
        return None

    # Placeholder year
    if year <= 1:
        return None

    # Future date (likely data error)
    if year > 2030:
        return None

    return year


def validate_date(date_str: str, person_id: str) -> list[str]:
    """Return a list of quality issue descriptions for a date string."""
    issues = []
    cleaned = date_str.strip()

    if not cleaned:
        return issues

    # Trailing whitespace in source
    if date_str != cleaned:
        issues.append(f"{person_id}: date has trailing whitespace: {date_str!r}")

    # BC dates
    if cleaned.startswith("-"):
        issues.append(f"{person_id}: BC date: {cleaned}")
        return issues

    # Check format and value
    if _RE_FULL.match(cleaned):
        year = int(cleaned.split("-")[0])
        if year > 2030:
            issues.append(f"{person_id}: future date (likely error): {cleaned}")
        if year <= 1:
            issues.append(f"{person_id}: placeholder date: {cleaned}")
    elif _RE_YEAR_MONTH.match(cleaned):
        year = int(cleaned.split("-")[0])
        if year > 2030:
            issues.append(f"{person_id}: future year-month (likely error): {cleaned}")
    elif _RE_YEAR.match(cleaned):
        year = int(cleaned)
        if year > 2030:
            issues.append(f"{person_id}: future year (likely error): {cleaned}")
        if year <= 1:
            issues.append(f"{person_id}: placeholder year: {cleaned}")
    else:
        issues.append(f"{person_id}: unparseable date format: {cleaned}")

    return issues
