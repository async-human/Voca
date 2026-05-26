"""Product skills — Agent Skills-compatible layout, lazy-loaded by the pipeline."""

from __future__ import annotations

import functools
import re
from dataclasses import dataclass
from pathlib import Path

_SKILLS_DIR = Path(__file__).resolve().parent

SKILL_VOKAL_RICH_OUTPUT = "vokal-rich-output"

# Heuristic for when to run numerical extraction (L1-style gate before loading full skill).
_NUMERIC_HINT = re.compile(
    r"\d|(?:\$|€|£)\s*\d|%\s*\d|\d\s*%|"
    r"(?:FY|Q[1-4])\s*['\"]?\d{2,4}|"
    r"\b(?:million|billion|thousand|percent|revenue|profit|margin|earnings)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class SkillMeta:
    name: str
    description: str
    path: Path


def _skill_path(name: str) -> Path:
    return _SKILLS_DIR / name / "SKILL.md"


def parse_skill_md(text: str) -> tuple[dict[str, str], str]:
    """Split YAML frontmatter and markdown body (Agent Skills format)."""
    text = text.lstrip("\ufeff")
    if not text.startswith("---"):
        return {}, text.strip()
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text.strip()
    frontmatter: dict[str, str] = {}
    for line in parts[1].strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, _, value = line.partition(":")
        frontmatter[key.strip().lower()] = value.strip().strip('"').strip("'")
    return frontmatter, parts[2].strip()


def list_skills() -> list[str]:
    """Return skill folder names that contain SKILL.md."""
    names: list[str] = []
    for child in _SKILLS_DIR.iterdir():
        if child.is_dir() and (child / "SKILL.md").is_file():
            names.append(child.name)
    return sorted(names)


@functools.lru_cache(maxsize=32)
def get_skill_meta(name: str) -> SkillMeta:
    """L1 discovery: frontmatter only (reads file once per process, cached)."""
    path = _skill_path(name)
    if not path.is_file():
        raise FileNotFoundError(
            f"Product skill not found: {path}. Add api/app/skills/{name}/SKILL.md"
        )
    text = path.read_text(encoding="utf-8")
    meta, _ = parse_skill_md(text)
    return SkillMeta(
        name=meta.get("name") or name,
        description=meta.get("description") or "",
        path=path,
    )


def list_skill_metas() -> list[SkillMeta]:
    return [get_skill_meta(n) for n in list_skills()]


@functools.lru_cache(maxsize=32)
def load_skill_instructions(name: str) -> str:
    """L2 activation: markdown body without frontmatter (on first use per skill)."""
    path = _skill_path(name)
    if not path.is_file():
        raise FileNotFoundError(
            f"Product skill not found: {path}. Add api/app/skills/{name}/SKILL.md"
        )
    _, body = parse_skill_md(path.read_text(encoding="utf-8"))
    return body


def load_skill(name: str) -> str:
    """Full SKILL.md file (frontmatter + body). Prefer load_skill_instructions for prompts."""
    path = _skill_path(name)
    if not path.is_file():
        raise FileNotFoundError(
            f"Product skill not found: {path}. Add api/app/skills/{name}/SKILL.md"
        )
    return path.read_text(encoding="utf-8")


def load_skill_resource(name: str, relative_path: str) -> str | None:
    """L3: references/, scripts/, assets/ — loaded only when explicitly requested."""
    path = _SKILLS_DIR / name / relative_path.replace("\\", "/")
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8")


def skill_applies(
    name: str,
    *,
    transcript: str = "",
    output_format: str | None = None,
) -> bool:
    """Whether the pipeline should invoke this skill (cheap check before L2 load)."""
    if name == SKILL_VOKAL_RICH_OUTPUT:
        if not transcript or not _NUMERIC_HINT.search(transcript):
            return False
        return True
    return True


def clear_skill_cache() -> None:
    """Clear in-process skill caches (useful in tests)."""
    get_skill_meta.cache_clear()
    load_skill_instructions.cache_clear()
