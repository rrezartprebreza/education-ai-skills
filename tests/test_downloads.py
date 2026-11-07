import hashlib
import io
import json
import posixpath
from pathlib import Path
import shutil
import re
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from build_bundles import bundle_files
from build_downloads import archive_bytes, build, download_files


class DownloadsTest(unittest.TestCase):
    def test_archives_match_bundles_and_extract_for_both_clients(self):
        downloads = download_files()
        bundles = bundle_files()
        manifest = json.loads(downloads["manifest.json"])
        for audience in ("professor", "student"):
            name = f"education-{audience}-skills"
            filename = next(item["filename"] for item in manifest if item["audience"] == audience)
            with zipfile.ZipFile(io.BytesIO(downloads[filename])) as archive:
                self.assertIsNone(archive.testzip())
                metadata = json.loads(archive.read(f"{name}/BUNDLE.json"))
                self.assertEqual(audience, metadata["audience"])
                self.assertEqual(6, len(metadata["skills"]))
                expected = {str(p.relative_to("plugins")): content for p, content in bundles.items()
                            if p.parts[1] == name}
                self.assertEqual(set(expected) | {f"{name}/BUNDLE.json", f"{name}/START-HERE.md", f"{name}/GETTING-STARTED.md", f"{name}/LOCAL-ASSISTANT.md"}, set(archive.namelist()))
                for path, content in expected.items():
                    self.assertEqual(content, archive.read(path))
                self.assertEqual((ROOT / "docs/DOWNLOADS.md").read_bytes(), archive.read(f"{name}/START-HERE.md"))
                self.assertEqual((ROOT / "docs/GETTING-STARTED.md").read_bytes(), archive.read(f"{name}/GETTING-STARTED.md"))
                self.assertEqual((ROOT / "docs/LOCAL-ASSISTANT.md").read_bytes(), archive.read(f"{name}/LOCAL-ASSISTANT.md"))
                with tempfile.TemporaryDirectory() as directory:
                    root = Path(directory)
                    archive.extractall(root)
                    for client in (".agents", ".claude"):
                        destination = root / "course" / client / "skills"
                        shutil.copytree(root / name / "skills", destination)
                        self.assertEqual(6, len(list(destination.glob("*/SKILL.md"))))

    def test_deterministic_archives_and_checksums(self):
        first = download_files()
        self.assertEqual(first, download_files())
        manifest = json.loads(first["manifest.json"])
        self.assertEqual({"professor", "student"}, {entry["audience"] for entry in manifest})
        for entry in manifest:
            data = first[entry["filename"]]
            self.assertEqual(len(data), entry["bytes"])
            self.assertEqual(hashlib.sha256(data).hexdigest(), entry["sha256"])
            self.assertIn(f"{entry['sha256']}  {entry['filename']}\n".encode(), first["SHA256SUMS.txt"])

    def test_offline_markdown_links_stay_inside_each_bundle(self):
        for filename, content in download_files().items():
            if not filename.endswith(".zip"):
                continue
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                names = set(archive.namelist())
                for name in names:
                    if not name.endswith(".md"):
                        continue
                    for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", archive.read(name).decode()):
                        if target.startswith(("https://", "http://", "#")):
                            continue
                        resolved = posixpath.normpath(posixpath.join(posixpath.dirname(name), target.split("#")[0]))
                        self.assertIn(resolved, names, f"Broken offline link in {name}: {target}")

    def test_write_and_rebuild(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "downloads"
            files = build(output)
            self.assertEqual(files, build(output))
            self.assertEqual(set(files), {file.name for file in output.iterdir()})
            for name, data in files.items():
                self.assertEqual(data, (output / name).read_bytes())

    def test_local_source_archive_is_complete_and_excludes_runtime_data(self):
        files = download_files()
        entry = json.loads(files["local-assistant.json"])
        data = files[entry["filename"]]
        self.assertEqual(hashlib.sha256(data).hexdigest(), entry["sha256"])
        self.assertEqual(len(data), entry["bytes"])
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            names = set(archive.namelist())
            prefix = "education-local-assistant/"
            for file in ("LICENSE", "START-HERE.md", "catalog.json", "local-assistant/package-lock.json", "local-assistant/server.mjs", "local-assistant/src/pages/index.astro", "local-assistant/lib/skills.mjs"):
                self.assertIn(prefix + file, names)
            self.assertEqual(10, sum(name.endswith("/SKILL.md") for name in names))
            self.assertFalse(any(part in name for name in names for part in ("node_modules", "test-results", "/dist/", ".env", ".git/", ".log")))

    def test_unsafe_archive_names_rejected(self):
        for name in ("../private", "/absolute", "bundle/../../escape", "bundle\\escape"):
            with self.assertRaises(ValueError):
                archive_bytes({name: b"content"})

    def test_output_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "actual").mkdir()
            (root / "link").symlink_to(root / "actual", target_is_directory=True)
            with self.assertRaises(ValueError):
                build(root / "link")
            self.assertEqual([], list((root / "actual").iterdir()))


if __name__ == "__main__":
    unittest.main()
