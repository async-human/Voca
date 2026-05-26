"""Prompts for transcript-only structured fact extraction (see api/app/skills/vokal-rich-output/)."""

import functools

from app.skills import (
    SKILL_VOKAL_RICH_OUTPUT,
    load_skill_instructions,
    load_skill_resource,
)

_TRANSCRIPT_SLOT = "<<<VOKAL_TRANSCRIPT>>>"


@functools.lru_cache(maxsize=1)
def _structured_facts_prompt_template() -> str:
    """Build prompt template on first numerical extraction (L2 + optional L3)."""
    spec = load_skill_instructions(SKILL_VOKAL_RICH_OUTPUT)
    examples = load_skill_resource(
        SKILL_VOKAL_RICH_OUTPUT, "references/schema-examples.md"
    )
    examples_block = ""
    if examples:
        examples_block = f"\n\n## Reference examples\n{examples}\n"
    return f"""You extract structured facts from a voice transcript for Vokal.

Follow this skill specification:
{spec}{examples_block}
Return ONLY valid JSON matching the extraction schema in the skill (sections with grouped metrics).
Rules:
- Every metric MUST include source_quote copied from the transcript.
- If a number is not in the transcript, do not include it.
- Group revenue and profit in separate sections.
- Round to 2 decimal places max.

Transcript:
\"\"\"
{_TRANSCRIPT_SLOT}
\"\"\""""


def format_structured_facts_prompt(transcript: str) -> str:
    return _structured_facts_prompt_template().replace(_TRANSCRIPT_SLOT, transcript)


_FACTS_SLOT = "<<<VOKAL_STRUCTURED_FACTS>>>"
_OUTPUT_SLOT = "<<<VOKAL_OUTPUT_TEXT>>>"


@functools.lru_cache(maxsize=1)
def _build_blocks_prompt_template() -> str:
    spec = load_skill_instructions(SKILL_VOKAL_RICH_OUTPUT)
    return f"""Build output_meta.blocks from the structured facts below and the polished narrative.

Follow the UI block schema in this skill:
{spec}

Use block type metric_section for each section that has metrics.
Do not add metrics not present in structured_facts.
Narrative blocks (heading, paragraph) may summarize but must not introduce new numbers.

Return JSON:
{{
  "blocks": []
}}

Structured facts (source of truth for all numbers):
{_FACTS_SLOT}

Polished narrative (for prose only):
\"\"\"
{_OUTPUT_SLOT}
\"\"\"
"""


def format_build_blocks_prompt(*, structured_facts_json: str, output_text: str) -> str:
    return (
        _build_blocks_prompt_template()
        .replace(_FACTS_SLOT, structured_facts_json)
        .replace(_OUTPUT_SLOT, output_text)
    )
