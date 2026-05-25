-- Voice profile schema documentation (stored in profiles.voice_profile JSONB)
-- No DDL changes required — application writes this shape after migration 002.
--
-- {
--   "summary": "string",
--   "sessions_count": 0,
--   "traits": { "directness": 0.0, "conciseness": 0.0, "warmth": 0.0, "formality": 0.0 },
--   "pattern_counts": { "lead_burial": 3, "hedging": 5 },
--   "weak_patterns": ["lead_burial"],
--   "format_usage": { "email": 10, "slack": 4 },
--   "clarity_history": [82, 85, 88],
--   "avg_clarity_score": 85.0,
--   "longitudinal_insights": ["Recurring pattern (5x): hedging"],
--   "last_weekly_insight_at": "2026-05-25T00:00:00Z",
--   "updated_at": "2026-05-25T00:00:00Z"
-- }

SELECT 1;
