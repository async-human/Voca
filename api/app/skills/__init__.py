from pathlib import Path

_SKILLS_DIR = Path(__file__).resolve().parent


def load_skill(name: str) -> str:
    """Load a product skill markdown file from api/app/skills/<name>/SKILL.md."""
    path = _SKILLS_DIR / name / "SKILL.md"
    if not path.is_file():
        raise FileNotFoundError(
            f"Product skill not found: {path}. "
            f"Add api/app/skills/{name}/SKILL.md"
        )
    return path.read_text(encoding="utf-8")


def list_skills() -> list[str]:
    """Return names of available product skills (subdirectories with SKILL.md)."""
    names: list[str] = []
    for child in _SKILLS_DIR.iterdir():
        if child.is_dir() and (child / "SKILL.md").is_file():
            names.append(child.name)
    return sorted(names)
