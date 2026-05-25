FORMAT_INSTRUCTIONS = {
    "email": """Format: Professional Email
Output a polished email with clear subject line. Structure: greeting, context, main point, call to action, sign-off.
Include output_meta with: subject (string).""",
    "slack": """Format: Slack Message
Output a concise Slack message. Keep it conversational but professional. No email-style greeting needed.
Use short paragraphs or bullet points if helpful.""",
    "report": """Format: Executive Report
Output a structured report with: Executive Summary, Key Points (bullets), Recommendation or Next Steps.
Use clear headings.""",
    "linkedin": """Format: LinkedIn Post
Output a LinkedIn post with a strong opening hook, 2-4 short paragraphs, optional line breaks for readability.
End with a subtle call to engagement if natural.""",
    "journal": """Format: Thinking Journal
Output a reflective journal entry in first person. Preserve the speaker's raw thoughts but organize them clearly.
Surface underlying themes or insights when present.""",
}


def build_generation_prompt(*, format: str, transcript: str, voice_profile: dict) -> str:
    format_guide = FORMAT_INSTRUCTIONS.get(format, FORMAT_INSTRUCTIONS["email"])
    summary = voice_profile.get("summary") if voice_profile else None
    profile_block = f"\nUser voice profile (match this style):\n{summary}\n" if summary else ""

    return f"""You are Vokal, an AI writing partner. The user spoke their thoughts aloud. Your job is NOT to transcribe — it is to produce polished {format} writing that sounds like THEM.

Rules:
- Preserve the user's intent, facts, names, and tone — do not invent information
- Fix structure, clarity, and grammar while keeping their voice
- Explain 2-4 specific changes you made and why
- Change tags must be one of: Structure, Tone, Clarity, Voice, Hook

{format_guide}
{profile_block}

Raw spoken transcript:
\"\"\"
{transcript}
\"\"\"

Respond with valid JSON only:
{{
  "output_text": "the polished content",
  "output_meta": {{}},
  "explanations": [
    {{ "tag": "Structure", "label": "Structure", "text": "why you changed something" }}
  ],
  "voice_signals": "1-2 sentence summary of this user's communication style for future sessions"
}}"""
