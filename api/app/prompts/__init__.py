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

Block types (exact strings): heading, paragraph, metric_section, callout (legacy: kpi_grid, bar_chart).
- metric_section: {\"type\":\"metric_section\",\"title\":\"Revenue\",\"category\":\"revenue\",\"items\":[...],\"chart\":{...}} — one section per category (revenue, profit, etc.). Never mix categories in one section.
- items: {\"label\": \"FY24 Revenue\", \"value\": \"$15M\", \"hint\": \"2024\"} — label MUST include fiscal year when spoken.
- chart items: {\"label\": \"FY24\", \"value\": 15} — only metrics with a fiscal year; max 2 decimals.
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
    "post_call_followup": (
        "Sales post-call follow-up email. Lead with the prospect's specific pain or priority, never a generic opener. "
        "Write in the rep's voice, keep it short, include one relevant proof point if the transcript provides one, "
        "and end with one clear next step using a specific date or time when available. "
        "output_meta.subject is required and must reference the call topic or prospect situation. "
        "output_meta.crm_note is required as a JSON object with: contact, company, role, call_outcome, key_points, "
        "pain_identified, objections_raised, next_action, next_action_date, deal_signals, red_flags. "
        "output_meta.deal_stage_signal is required: interested, lukewarm, not_interested, no_answer, or voicemail. "
        + RICH_OUTPUT_RULES
    ),
    "crm_note": (
        "Structured CRM note for a sales call. Do not write an email. Capture only deal-relevant facts. "
        "Use compact sections: Contact, Call outcome, Key points, Pain identified, Objections, Next action, Deal signals. "
        "output_meta.crm_note is required as a JSON object with: contact, company, role, call_outcome, key_points, "
        "pain_identified, objections_raised, next_action, next_action_date, deal_signals, red_flags. "
        "output_meta.deal_stage_signal is required: interested, lukewarm, not_interested, no_answer, or voicemail. "
        + RICH_OUTPUT_RULES
    ),
    "voicemail_script": (
        "15-second sales voicemail script. Max 45 words. Reference the prospect's role, company, or stated pain when present. "
        "Use one relevant hook and one crisp callback reason. No generic checking-in language. "
        "output_meta.crm_note may summarize the attempt; output_meta.deal_stage_signal should be voicemail. "
    ),
    "pipeline_update": (
        "Manager-ready sales pipeline update. Organize into Hot, Warm, and Cold sections. "
        "For each account, include status, blocker, next action, owner, and date if spoken. "
        "Keep it skimmable in under 90 seconds. output_meta.crm_note may include structured deal updates. "
        + RICH_OUTPUT_RULES
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
  "output_meta": {{
    "subject": "required for email and post_call_followup",
    "blocks": [],
    "crm_note": {{
      "contact": "name or null",
      "company": "company or null",
      "role": "role or null",
      "call_outcome": "interested|lukewarm|not_interested|no_answer|voicemail|null",
      "key_points": ["3 bullets max"],
      "pain_identified": "specific prospect pain or null",
      "objections_raised": ["objection"],
      "next_action": "specific next step with owner or null",
      "next_action_date": "date if spoken or inferable, else null",
      "deal_signals": ["buying intent signal"],
      "red_flags": ["risk or blocker"]
    }},
    "deal_stage_signal": "interested|lukewarm|not_interested|no_answer|voicemail|null"
  }}
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
  "issues_fixed": ["brief list"],
  "clarity_score": 85
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
For sales-related formats, include sales coaching patterns when present:
no_clear_ask, feature_dumping, weak_subject_line, late_cta, no_urgency_signal,
generic_opener, missing_social_proof, vague_next_step, unhandled_objection.

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
    "formality": 0.61,
    "urgency_calibration": 0.55,
    "objection_handling": 0.48,
    "specificity": 0.73,
    "follow_through_clarity": 0.66
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
