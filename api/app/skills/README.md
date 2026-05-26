# Vokal product skills

These skills are **part of the Vokal product** — they define how the API pipeline extracts facts and builds rich output (charts, KPI sections, callouts).

They are loaded at runtime by `app.skills.load_skill()` and injected into LLM prompts (see `app/prompts/structured_facts.py`).

## Layout

```
api/app/skills/
  README.md
  vokal-rich-output/
    SKILL.md    # Transcript-only metrics, grouped metric_section blocks
```

## Adding a skill

1. Create a folder under `api/app/skills/<skill-name>/`.
2. Add `SKILL.md` with the specification.
3. Load it from Python: `from app.skills import load_skill` then `load_skill("<skill-name>")`.

Do not store product skills under `.cursor/` — that directory is for editor-only configuration.
