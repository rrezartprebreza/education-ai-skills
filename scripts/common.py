"""Small shared parsers for repository metadata."""
import json
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]


def unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate key: {key}")
        result[key] = value
    return result


class UniqueLoader(yaml.SafeLoader):
    pass


def mapping(loader, node):
    return unique_pairs((loader.construct_object(k), loader.construct_object(v)) for k, v in node.value)


UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, mapping)


def read_json(path):
    return json.loads(Path(path).read_text(), object_pairs_hook=unique_pairs)


def frontmatter(text):
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        raise ValueError("Missing YAML frontmatter")
    end = lines.index("---", 1)
    data = yaml.load("\n".join(lines[1:end]), Loader=UniqueLoader)
    if not isinstance(data, dict):
        raise ValueError("Frontmatter must be a mapping")
    return data
