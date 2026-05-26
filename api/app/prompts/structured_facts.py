"""Prompts for transcript-only structured fact extraction (see api/app/skills/vokal-rich-output/)."""

from app.skills import load_skill

_SKILL = load_skill("vokal-rich-output")

STRUCTURED_FACTS_PROMPT = f"""You extract structured facts from a voice transcript for Vokal.

Follow this skill specification:
{_SKILL}

Return ONLY valid JSON matching the extraction schema in the skill (sections with grouped metrics).
Rules:
- Every metric MUST include source_quote copied from the transcript.
- If a number is not in the transcript, do not include it.
- Group revenue and profit in separate sections.
- Round to 2 decimal places max.

Transcript:
\"\"\"
{{transcript}}
\"\"\""""

BUILD_BLOCKS_FROM_SECTIONS_PROMPT = f"""Build output_meta.blocks from the structured facts below and the polished narrative.

Follow the UI block schema in this skill:
{_SKILL}

Use block type metric_section for each section that has metrics.
Do not add metrics not present in structured_facts.
Narrative blocks (heading, paragraph) may summarize but must not introduce new numbers.

Return JSON:
{{{{
  "blocks": []
}}}}

Structured facts (source of truth for all numbers):
{{structured_facts_json}}

Polished narrative (for prose only):
\"\"\"
{{output_text}}
\"\"\"
"""
