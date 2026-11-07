#!/usr/bin/env python3
"""Validate source contracts and generated packaging; not educational effectiveness."""
import re
from pathlib import Path
import yaml
from common import ROOT, UniqueLoader, frontmatter, read_json
from build_bundles import check_bundles


def validate_catalog(catalog):
    skills = catalog.get("skills") if isinstance(catalog, dict) else None
    if not isinstance(skills, list) or not skills:
        raise ValueError("Catalog needs skills")
    ids = set()
    for skill in skills:
        if not isinstance(skill, dict) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", skill.get("id", "")):
            raise ValueError("Invalid skill ID")
        if skill["id"] in ids:
            raise ValueError("Duplicate skill ID")
        ids.add(skill["id"])
        if skill.get("audience") not in ("professor", "student", "shared"):
            raise ValueError("Invalid audience")
        for field in ("title", "summary", "category", "prompt"):
            if not isinstance(skill.get(field), str) or not skill[field].strip():
                raise ValueError(f"Missing catalog field: {field}")
    return ids


def validate(root=ROOT):
    catalog = read_json(root / "catalog.json")
    ids = validate_catalog(catalog)
    folders = {p.name for p in (root / "skills").iterdir() if p.is_dir()}
    if ids != folders:
        raise ValueError("Catalog and canonical skills differ")
    for skill in catalog["skills"]:
        folder = root / "skills" / skill["id"]
        text = (folder / "SKILL.md").read_text()
        data = frontmatter(text)
        if data.get("name") != skill["id"] or "Use when" not in data.get("description", ""):
            raise ValueError("Invalid skill discovery metadata")
        if len(text.splitlines()) > 500 or re.search(r"\b(TODO|FIXME|TBD)\b", text):
            raise ValueError("Unfinished or oversized skill")
        meta = yaml.load((folder / "agents/openai.yaml").read_text(), Loader=UniqueLoader)["interface"]
        if meta["display_name"] != skill["title"] or not 25 <= len(meta["short_description"]) <= 64:
            raise ValueError("Invalid UI metadata")
        if f"${skill['id']}" not in meta["default_prompt"]:
            raise ValueError("Default prompt must select the skill")
        for required in ("examples/good.md", "examples/bad.md"):
            if not (folder / required).is_file():
                raise ValueError("Missing good/bad example")
        if not list((folder / "templates").glob("*.md")):
            raise ValueError("Missing task template")
    markdown = [root / "README.md", *root.glob("skills/**/*.md"), *root.glob("docs/*.md")]
    for path in markdown:
        for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", path.read_text()):
            if target.startswith(("https://", "http://", "#", "mailto:")):
                continue
            destination = (path.parent / target.split("#")[0]).resolve()
            if not destination.is_relative_to(root.resolve()) or not destination.exists():
                raise ValueError(f"Broken or escaping local link: {path}: {target}")
    for manifest in (".claude-plugin/marketplace.json", ".agents/plugins/marketplace.json"):
        entries = read_json(root / manifest)["plugins"]
        if {p["name"] for p in entries} != {"education-professor-skills", "education-student-skills"} or len(entries) != 2:
            raise ValueError("Marketplace must contain both audience bundles exactly once")
        for entry in entries:
            source = entry["source"]
            source = source["path"] if isinstance(source, dict) else source
            if source != f"./plugins/{entry['name']}" or not (root / source).is_dir():
                raise ValueError("Invalid plugin source")
    check_bundles(root)
    cases = read_json(root / "evaluations/cases.json")
    if len({case["id"] for case in cases}) != len(cases) or {c["skill"] for c in cases} != ids:
        raise ValueError("Evaluation coverage/IDs are invalid")
    for case in cases:
        if not case["prompt"] or len(case["criteria"]) < 3:
            raise ValueError("Evaluation needs a prompt and criteria")
    print(f"Validated {len(ids)} canonical skills, two self-contained bundles and {len(cases)} evaluation cases.")


if __name__ == "__main__":
    validate()
