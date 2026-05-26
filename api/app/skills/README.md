# Vokal product skills

Skills follow the [Agent Skills](https://cursor.com/docs/skills) layout (`SKILL.md` + optional `references/`, `scripts/`, `assets/`). They live under `api/app/skills/` because they are **product runtime** specs, not editor-only config.

## Progressive loading (how the API uses them)

| Level | What | When |
|-------|------|------|
| L1 | `name` + `description` from YAML frontmatter | `get_skill_meta()` — cached after first read |
| Gate | `skill_applies()` | Before any LLM call — skips extraction if transcript has no numeric hints |
| L2 | Markdown body (no frontmatter) | `load_skill_instructions()` — first time a step needs the skill |
| L3 | `references/*.md` | `load_skill_resource()` — only when building the structured-facts prompt |

Skills are **not** read at import time and **not** embedded in every pipeline step.

## Layout

```
api/app/skills/
  README.md
  __init__.py          # get_skill_meta, load_skill_instructions, skill_applies, …
  vokal-rich-output/
    SKILL.md
    references/
      schema-examples.md
```

Editor pointer (optional): `.cursor/skills/vokal-rich-output/SKILL.md` → points here; API does not load `.cursor/`.

## Adding a skill

1. Create `api/app/skills/<skill-name>/SKILL.md` with required frontmatter:

   ```yaml
   ---
   name: my-skill
   description: What it does and when the pipeline should use it.
   ---
   ```

2. Implement `skill_applies("my-skill", …)` if the skill should not run on every session.

3. From pipeline code: `load_skill_instructions("my-skill")` inside the step that needs it (not at module import).

4. Put long examples in `references/` and load with `load_skill_resource()`.

## Current skills

| Skill | Used in |
|-------|---------|
| `vokal-rich-output` | `extract_numerical_facts` → `ensure_output_blocks` |
