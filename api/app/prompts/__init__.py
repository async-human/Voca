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
  "summary": "one line summary for UI"
}}

Transcript:
\"\"\"
{transcript}
\"\"\""""


FORMAT_GUIDES = {
    "email": "Professional email with subject in output_meta.subject. Greeting, context, CTA, sign-off.",
    "slack": "Concise Slack message. Conversational, short paragraphs or bullets.",
    "report": "Executive report: Executive Summary, Key Points, Recommendation/Next Steps.",
    "linkedin": "LinkedIn post with strong hook, 2-4 short paragraphs, readable line breaks.",
    "journal": "Reflective first-person journal entry. Organize raw thoughts, surface themes.",
}


GENERATE_PROMPT = """You are Vokal. Transform this spoken content into polished {output_format} writing in the user's voice.

Format guide: {format_guide}

Intent:
{intent_json}

Voice profile (match this style):
{voice_profile}

Rules:
- Preserve facts and intent — never invent information
- Apply appropriate structure for the format
- Sound like the speaker, not generic AI

Return JSON:
{{
  "output_text": "polished content",
  "output_meta": {{}}
}}

Clean transcript:
\"\"\"
{clean_transcript}
\"\"\""""


CRITIQUE_PROMPT = """You are a strict editor for Vokal. Review this draft against the user's voice profile and format ({output_format}).

Fix: AI slop, tone drift, generic phrasing, structure issues.
Keep: facts, intent, user's natural voice.

Return JSON:
{{
  "output_text": "revised polished content",
  "output_meta": {{}},
  "issues_fixed": ["brief list"]
}}

Voice profile:
{voice_profile}

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
