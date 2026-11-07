#!/usr/bin/env python3
"""Materialize self-contained plugins from canonical skills; --check detects drift."""
import argparse
import json
from pathlib import Path
from common import ROOT, read_json


def encoded(value):
    return (json.dumps(value, indent=2, ensure_ascii=True) + "\n").encode()


def bundle_files(root=ROOT):
    catalog = read_json(root / "catalog.json")
    expected = {}
    for audience in ("professor", "student"):
        name = f"education-{audience}-skills"
        prefix = Path("plugins") / name
        expected[prefix / "LICENSE"] = (root / "LICENSE").read_bytes()
        description = f"Teaching and learning workflows for {audience}s, with source checking and responsible AI use."
        common = {"name": name, "version": catalog["version"], "description": description}
        expected[prefix / "plugin.json"] = encoded({
            "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", **common,
        })
        expected[prefix / ".claude-plugin/plugin.json"] = encoded({
            **common, "author": {"name": "Rrezart Prebreza"},
            "homepage": catalog["repository"], "license": "MIT",
        })
        expected[prefix / ".codex-plugin/plugin.json"] = encoded({
            **common, "skills": "./skills/", "license": "MIT",
            "author": {"name": "Rrezart Prebreza", "url": "https://github.com/rrezartprebreza"},
            "homepage": catalog["repository"], "repository": catalog["repository"],
            "interface": {"displayName": f"Education {audience.title()} Skills",
                          "shortDescription": f"Practical AI workflows for {audience}s.",
                          "developerName": "Rrezart Prebreza", "category": "Productivity",
                          "capabilities": ["Read", "Write"]},
        })
        for skill in catalog["skills"]:
            if skill["audience"] not in (audience, "shared"):
                continue
            folder = root / "skills" / skill["id"]
            for file in sorted(folder.rglob("*")):
                if "__pycache__" in file.parts or file.suffix == ".pyc":
                    continue
                if file.is_symlink():
                    raise ValueError(f"Canonical skills must not contain symlinks: {file}")
                if file.is_file():
                    expected[prefix / "skills" / skill["id"] / file.relative_to(folder)] = file.read_bytes()
    return expected


def check_bundles(root=ROOT):
    expected = bundle_files(root)
    actual = {p.relative_to(root) for p in (root / "plugins").rglob("*")
              if (p.is_file() or p.is_symlink()) and "__pycache__" not in p.parts and p.suffix != ".pyc"}
    errors = [str(p) for p in expected if p not in actual or (root / p).is_symlink()
              or (root / p).read_bytes() != expected[p]]
    errors.extend(str(p) for p in actual - expected.keys())
    if errors:
        raise ValueError("Generated plugin drift: " + ", ".join(sorted(errors)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if not args.check:
        for relative, content in bundle_files().items():
            path = ROOT / relative
            if path.is_symlink() or any(parent.is_symlink() for parent in path.parents if parent != ROOT):
                raise ValueError("Refusing to write through a symlink")
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    check_bundles()
    print("Professor and student plugins match canonical skills.")


if __name__ == "__main__":
    main()
