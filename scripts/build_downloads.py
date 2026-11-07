#!/usr/bin/env python3
"""Build reproducible, versioned ZIP downloads from the canonical plugin contents."""
import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import zipfile

from common import ROOT, read_json
from build_bundles import bundle_files
from validate import validate_catalog


def archive_bytes(files):
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, content in sorted(files.items()):
            path = PurePosixPath(name)
            if path.is_absolute() or ".." in path.parts or "\\" in name:
                raise ValueError("Unsafe archive path")
            info = zipfile.ZipInfo(name, date_time=(2020, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, content)
    return output.getvalue()


def download_files(root=ROOT):
    catalog = read_json(root / "catalog.json")
    validate_catalog(catalog)
    version = catalog.get("version")
    if not isinstance(version, str) or not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError("Downloads require a numeric major.minor.patch version")
    bundles = bundle_files(root)
    guide = (root / "docs/DOWNLOADS.md").read_bytes()
    output, entries = {}, []
    for audience in ("professor", "student"):
        name = f"education-{audience}-skills"
        prefix = Path("plugins") / name
        skills = [skill["id"] for skill in catalog["skills"]
                  if skill["audience"] in (audience, "shared")]
        files = {str(Path(name) / path.relative_to(prefix)).replace("\\", "/"): data
                 for path, data in bundles.items() if path.is_relative_to(prefix)}
        files[f"{name}/START-HERE.md"] = guide
        files[f"{name}/BUNDLE.json"] = (json.dumps({
            "version": version, "audience": audience, "skills": skills,
            "repository": catalog["repository"],
        }, indent=2) + "\n").encode()
        filename = f"{name}-{version}.zip"
        data = archive_bytes(files)
        output[filename] = data
        entries.append({"audience": audience, "filename": filename, "version": version,
                        "skills": skills, "bytes": len(data),
                        "sha256": hashlib.sha256(data).hexdigest()})
    output["manifest.json"] = (json.dumps(entries, indent=2) + "\n").encode()
    output["SHA256SUMS.txt"] = "".join(
        f"{entry['sha256']}  {entry['filename']}\n" for entry in entries).encode()
    return output


def build(output, root=ROOT):
    files = download_files(root)
    if output.is_symlink():
        raise ValueError("Refusing to write through a symlink")
    output = output.parent.resolve() / output.name
    output.mkdir(parents=True, exist_ok=True)
    for name, data in files.items():
        target = output / name
        if target.is_symlink():
            raise ValueError("Refusing to replace a symlink")
        target.write_bytes(data)
    return files


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "website/public/downloads")
    args = parser.parse_args()
    build(args.output.absolute())
    print("Built professor and student ZIPs, manifest and SHA-256 checksums.")
