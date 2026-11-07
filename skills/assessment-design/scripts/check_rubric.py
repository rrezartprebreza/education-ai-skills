#!/usr/bin/env python3
"""Check rubric arithmetic and identifiers, not fairness or grading validity."""
import argparse
import json
from pathlib import Path


def validate(rubric):
    if not isinstance(rubric, dict) or type(rubric.get("total_points")) is not int or rubric["total_points"] <= 0:
        raise ValueError("Total points must be a positive integer")
    criteria = rubric.get("criteria")
    if not isinstance(criteria, list) or not criteria:
        raise ValueError("Criteria are required")
    ids, total = set(), 0
    for criterion in criteria:
        if not isinstance(criterion, dict):
            raise ValueError("Criterion must be an object")
        name = criterion.get("id")
        if not isinstance(name, str) or not name.strip() or name in ids:
            raise ValueError("Criterion IDs must be unique nonempty strings")
        ids.add(name)
        if not isinstance(criterion.get("description"), str) or not criterion["description"].strip():
            raise ValueError("Each criterion needs a description")
        maximum = criterion.get("max_points")
        if type(maximum) is not int or maximum <= 0:
            raise ValueError("Criterion points must be positive integers")
        levels = criterion.get("levels")
        if not isinstance(levels, list) or not levels:
            raise ValueError("Performance levels are required")
        scores = set()
        for level in levels:
            if not isinstance(level, dict) or type(level.get("points")) is not int:
                raise ValueError("Level points must be integers")
            score = level["points"]
            if score < 0 or score > maximum or score in scores:
                raise ValueError("Level points must be unique and within the criterion maximum")
            if not isinstance(level.get("descriptor"), str) or not level["descriptor"].strip():
                raise ValueError("Levels need descriptors")
            scores.add(score)
        if 0 not in scores or maximum not in scores:
            raise ValueError("Include zero and full-credit levels")
        total += maximum
    if total != rubric["total_points"]:
        raise ValueError("Criterion weights do not match the stated total")
    return {"points": total, "criterion_count": len(ids), "instructor_review": "required"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("rubric", type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(validate(json.loads(args.rubric.read_text()))))
    except (OSError, ValueError) as error:
        parser.exit(2, f"Invalid rubric: {error}\n")


if __name__ == "__main__":
    main()
