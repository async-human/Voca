---
name: vokal-rich-output
description: Transcript-only metrics and rich metric_section blocks for Vokal. Canonical spec is in the API product skills folder.
disable-model-invocation: true
---

# Vokal rich output (editor pointer)

**Source of truth:** `api/app/skills/vokal-rich-output/SKILL.md`

The Railway API loads that file **on demand** when `extract_numerical_facts` runs (`skill_applies` gate → `load_skill_instructions` → optional `references/schema-examples.md`). Block layout is enforced in `api/app/services/output_blocks.py`.

Edit the product skill for behavior changes; keep this file as a Cursor discovery stub only.
