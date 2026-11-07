import copy
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from common import frontmatter, read_json
from build_bundles import bundle_files, check_bundles
from validate import validate, validate_catalog


def helper(skill, name):
    path = ROOT / "skills" / skill / "scripts" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class RepositoryTest(unittest.TestCase):
    def test_repository(self):
        validate()

    def test_duplicate_metadata_rejected(self):
        with self.assertRaises(ValueError):
            frontmatter("---\nname: first\nname: second\n---\n")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "duplicate.json"
            path.write_text('{"name":"first","name":"second"}')
            with self.assertRaises(ValueError):
                read_json(path)

    def test_catalog_rejects_duplicate_ids_invalid_audiences_and_paths(self):
        original = read_json(ROOT / "catalog.json")
        for mutate in (
            lambda c: c["skills"].append(copy.deepcopy(c["skills"][0])),
            lambda c: c["skills"][0].update(audience="everyone"),
            lambda c: c["skills"][0].update(id="../private"),
            lambda c: c["skills"][0].update(summary=""),
        ):
            catalog = copy.deepcopy(original)
            mutate(catalog)
            with self.assertRaises(ValueError):
                validate_catalog(catalog)

    def test_bundle_membership_and_license(self):
        files = bundle_files()
        for audience in ("professor", "student"):
            prefix = Path("plugins") / f"education-{audience}-skills"
            self.assertIn(prefix / "LICENSE", files)
            ids = {p.parts[3] for p in files if p.parts[:3] == (*prefix.parts, "skills")}
            expected = {s["id"] for s in read_json(ROOT / "catalog.json")["skills"]
                        if s["audience"] in (audience, "shared")}
            self.assertEqual(expected, ids)
            self.assertEqual(6, len(ids))

    def test_generated_copy_drift_is_detected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for folder in ("skills", "plugins"):
                shutil.copytree(ROOT / folder, root / folder, ignore=shutil.ignore_patterns("__pycache__"))
            for file in ("catalog.json", "LICENSE"):
                shutil.copyfile(ROOT / file, root / file)
            target = root / "plugins/education-student-skills/skills/socratic-tutor/SKILL.md"
            target.write_text("changed")
            with self.assertRaises(ValueError):
                check_bundles(root)


class AgendaTest(unittest.TestCase):
    def setUp(self):
        self.helper = helper("lecture-planning", "check_plan")
        self.plan = read_json(ROOT / "skills/lecture-planning/examples/good-plan.json")

    def test_valid_timing_requires_pedagogy_review(self):
        self.assertEqual({"minutes": 50, "objective_count": 2, "pedagogy_review": "required"}, self.helper.validate(self.plan))

    def test_overflow_and_underflow(self):
        for minutes in (1, 100):
            self.plan["activities"][0]["minutes"] = minutes
            with self.assertRaises(ValueError):
                self.helper.validate(self.plan)

    def test_invalid_minutes(self):
        for value in (0, -1, True, 2.5, "5"):
            self.plan["activities"][0]["minutes"] = value
            with self.assertRaises(ValueError):
                self.helper.validate(self.plan)

    def test_unknown_or_uncovered_objective(self):
        self.plan["activities"][0]["objectives"] = ["unknown"]
        with self.assertRaises(ValueError):
            self.helper.validate(self.plan)
        self.plan["activities"][0]["objectives"] = []
        self.plan["objectives"].append("uncovered")
        with self.assertRaises(ValueError):
            self.helper.validate(self.plan)

    def test_bad_structure(self):
        for value in (None, [], {}, {"duration_minutes": True}):
            with self.assertRaises(ValueError):
                self.helper.validate(value)


class RubricTest(unittest.TestCase):
    def setUp(self):
        self.helper = helper("assessment-design", "check_rubric")
        self.rubric = read_json(ROOT / "skills/assessment-design/examples/good-rubric.json")

    def test_valid_weights_still_require_instructor(self):
        result = self.helper.validate(self.rubric)
        self.assertEqual(20, result["points"])
        self.assertEqual("required", result["instructor_review"])

    def test_bad_total(self):
        self.rubric["total_points"] = 21
        with self.assertRaises(ValueError):
            self.helper.validate(self.rubric)

    def test_duplicate_criterion(self):
        self.rubric["criteria"][1]["id"] = self.rubric["criteria"][0]["id"]
        with self.assertRaises(ValueError):
            self.helper.validate(self.rubric)

    def test_invalid_levels(self):
        for value in (-1, 9, True, "4"):
            self.rubric["criteria"][0]["levels"][0]["points"] = value
            with self.assertRaises(ValueError):
                self.helper.validate(self.rubric)

    def test_missing_zero_or_full_credit(self):
        self.rubric["criteria"][0]["levels"].pop()
        with self.assertRaises(ValueError):
            self.helper.validate(self.rubric)

    def test_empty_descriptor_and_duplicate_score(self):
        self.rubric["criteria"][0]["levels"][0]["descriptor"] = ""
        with self.assertRaises(ValueError):
            self.helper.validate(self.rubric)
        self.rubric["criteria"][0]["levels"][0]["descriptor"] = "No evidence"
        self.rubric["criteria"][0]["levels"][0]["points"] = 4
        with self.assertRaises(ValueError):
            self.helper.validate(self.rubric)

    def test_cli_success_and_bad_json(self):
        fixture = ROOT / "skills/assessment-design/examples/good-rubric.json"
        result = subprocess.run([sys.executable, self.helper.__file__, str(fixture)], text=True, capture_output=True, timeout=5)
        self.assertEqual(0, result.returncode)
        self.assertEqual("required", json.loads(result.stdout)["instructor_review"])
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bad.json"
            path.write_text("{")
            result = subprocess.run([sys.executable, self.helper.__file__, str(path)], text=True, capture_output=True, timeout=5)
            self.assertEqual(2, result.returncode)


if __name__ == "__main__":
    unittest.main()
