CLEAN_PROMPT = """Remove disfluencies (um, uh, false starts, repeated words) from this spoken transcript.
Preserve meaning, names, and facts. Do not summarize or rewrite — only clean.

Return JSON:
{{
  "clean_transcript": "cleaned text"
}}

Transcript:
\"\"\"
{transcript}
\"\"\""""


NUMERICAL_FACTS_PROMPT = """List EVERY factual data point in this transcript. Do not skip any number, fiscal year, percentage, dollar amount, date, or count.

Return JSON:
{{
  "facts": [
    {{
      "category": "revenue|profit|cost|rate|headcount|timeline|other",
      "fiscal_year": "2024 or null",
      "label": "short label e.g. FY24 Revenue",
      "value": "display e.g. $15M",
      "numeric_value": 15,
      "unit": "million|percent|count"
    }}
  ],
  "critical_non_numeric": ["decision, risk, or action without a number"]
}}

Transcript:
\"\"\"
{transcript}
\"\"\""""


INTENT_PROMPT = """You are an expert communication analyst for Vokal.

Extract structured intent from this voice note. Focus on what the speaker wants to ACHIEVE, not just what they said.

Output format requested: {output_format}

Return JSON:
{{
  "core_intent": "one sentence goal",
  "audience": "who receives this and relationship context",
  "tone_needed": "appropriate tone",
  "key_points": ["point 1", "point 2"],
  "what_to_omit": ["venting or irrelevant items to exclude"],
  "summary": "one line summary for UI",
  "must_include_facts": ["every number and fiscal year that must appear in the final output"]
}}

Transcript:
\"\"\"
{transcript}
\"\"\""""


RICH_OUTPUT_RULES = """
Rich output (not plain transcription): output_meta.blocks MUST capture EVERY fact from the transcript — especially all numbers, fiscal years, dates, percentages, and dollar amounts. Nothing critical may be omitted.

Block types (exact strings): heading, paragraph, kpi_grid, bar_chart, callout.
- kpi_grid items: {\"label\": \"FY24 Revenue\", \"value\": \"$15M\", \"hint\": \"2024\"} — label MUST include fiscal year when spoken.
- bar_chart items: {\"label\": \"FY24\", \"value\": 15} — value is a number in millions (max 2 decimals), label is FYxx.
- Use callout for risks, decisions, deadlines without numbers.
- output_text: full plain-text version for copy (same facts, no markdown).

Never invent figures. Round monetary values to 2 decimal places max.
"""

FORMAT_GUIDES = {
    "email": (
        "Professional email with subject in output_meta.subject. Greeting, context, CTA, sign-off. "
        + RICH_OUTPUT_RULES
        + " Use blocks for key metrics or dates when present; otherwise paragraph blocks."
    ),
    "slack": (
        "Concise Slack message. Conversational tone. "
        + RICH_OUTPUT_RULES
        + " Prefer paragraph + optional kpi_grid for numbers."
    ),
    "report": (
        "Executive report: Executive Summary, Key Points, Risks/Recommendations. "
        + RICH_OUTPUT_RULES
        + " REQUIRED when numbers exist: kpi_grid (one card per year+metric pair) AND bar_chart series per metric."
    ),
    "linkedin": (
        "LinkedIn post with strong hook, short paragraphs. "
        + RICH_OUTPUT_RULES
        + " Use kpi_grid for standout stats; paragraph for narrative."
    ),
    "journal": (
        "Reflective journal. Surface themes and patterns. "
        + RICH_OUTPUT_RULES
        + " Use callout for insights; paragraph for reflection."
    ),
}


GENERATE_PROMPT = """You are Vokal. Transform this spoken content into polished {output_format} writing in the user's voice.

Format guide: {format_guide}

Intent:
{intent_json}

Voice profile (match this style):
{voice_profile}

Numerical facts (include ALL in output — do not drop any):
{numerical_facts_json}

Must-include from intent:
{must_include_json}

Rules:
- Preserve EVERY fact from the transcript — never invent or omit numerical data
- Pair fiscal years with metrics in blocks (e.g. FY24 Revenue, not a sentence fragment)
- Apply appropriate structure for the format
- Sound like the speaker, not generic AI

Return JSON:
{{
  "output_text": "polished content (always required, plain text)",
  "output_meta": {{ "subject": "only for email", "blocks": [] }}
}}

Clean transcript:
\"\"\"
{clean_transcript}
\"\"\""""


CRITIQUE_PROMPT = """You are a strict editor for Vokal. Review this draft against the user's voice profile and format ({output_format}).

Fix: AI slop, tone drift, generic phrasing, structure issues.
Keep: facts, intent, user's natural voice.
If draft_meta contains output_meta.blocks, preserve and refine ALL blocks. Every fact in draft must appear in blocks. Pair fiscal years with KPI labels. Round chart values to 2 decimals max.

Return JSON:
{{
  "output_text": "revised polished content",
  "output_meta": {{}},
  "issues_fixed": ["brief list"]
}}

Voice profile:
{voice_profile}

Draft meta (JSON):
{draft_meta}

Draft:
\"\"\"
{draft}
\"\"\""""


EXPLAIN_PROMPT = """Explain 2-4 specific improvements made from raw speech to final output.

Tags must be one of: Structure, Tone, Clarity, Voice, Hook

Return JSON:
{{
  "explanations": [
    {{ "tag": "Structure", "label": "Structure", "text": "why this change" }}
  ],
  "clarity_score": 85,
  "voice_signals": "1-2 sentence summary of this user's communication style",
  "patterns_flagged": ["lead_burial", "hedging"],
  "trait_scores": {{
    "directness": 0.72,
    "conciseness": 0.65,
    "warmth": 0.58,
    "formality": 0.61
  }}
}}

Output format: {output_format}

Raw transcript:
\"\"\"
{raw_transcript}
\"\"\"

Final output:
\"\"\"
{final_output}
\"\"\""""
