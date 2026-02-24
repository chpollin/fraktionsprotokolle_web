"""Quality report collector for the ParlaBio build pipeline."""

from collections import defaultdict


class QualityReport:
    """Collects and categorizes data quality issues during processing."""

    def __init__(self):
        self._issues: dict[str, list[dict]] = defaultdict(list)
        self._counts: dict[str, int] = defaultdict(int)

    def add(self, category: str, person_id: str, message: str):
        """Record a quality issue. Stores up to 100 examples per category."""
        self._counts[category] += 1
        if len(self._issues[category]) < 100:
            self._issues[category].append({
                "person_id": person_id,
                "message": message,
            })

    @property
    def issue_count(self) -> int:
        return sum(self._counts.values())

    def to_dict(self) -> dict:
        """Serialize to a dict for JSON output."""
        summary = {}
        for cat in sorted(self._counts.keys()):
            summary[cat] = {
                "count": self._counts[cat],
                "examples": self._issues[cat],
            }
        return {
            "total_issues": self.issue_count,
            "categories": summary,
        }
