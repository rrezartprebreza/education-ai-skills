#!/usr/bin/env python3
"""Check agenda timing and objective references, not pedagogical quality."""
import argparse
import json
from pathlib import Path


def validate(plan):
    if not isinstance(plan, dict):
        raise ValueError("Plan must be an object")
    duration = plan.get("duration_minutes")
    if type(duration) is not int or duration <= 0:
        raise ValueError("Duration must be a positive integer")
    objectives = plan.get("objectives")
    if not isinstance(objectives, list) or not objectives or any(not isinstance(x, str) or not x.strip() for x in objectives):
        raise ValueError("Objectives must be nonempty strings")
    if len(objectives) != len(set(objectives)):
        raise ValueError("Objective IDs must be unique")
    activities = plan.get("activities")
    if not isinstance(activities, list) or not activities:
        raise ValueError("Activities are required")
    total, covered = 0, set()
    for activity in activities:
        if not isinstance(activity, dict) or not isinstance(activity.get("title"), str) or not activity["title"].strip():
            raise ValueError("Activity needs a title")
        minutes = activity.get("minutes")
        if type(minutes) is not int or minutes <= 0:
            raise ValueError("Activity minutes must be positive integers")
        refs = activity.get("objectives", [])
        if not isinstance(refs, list) or any(not isinstance(x, str) or x not in objectives for x in refs):
            raise ValueError("Activity references an unknown objective")
        total += minutes
        covered.update(refs)
    if total != duration:
        raise ValueError(f"Agenda totals {total} minutes, expected {duration}")
    if covered != set(objectives):
        raise ValueError("Each objective needs an activity")
    return {"minutes": total, "objective_count": len(objectives), "pedagogy_review": "required"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("plan", type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(validate(json.loads(args.plan.read_text()))))
    except (OSError, ValueError) as error:
        parser.exit(2, f"Invalid agenda: {error}\n")


if __name__ == "__main__":
    main()
