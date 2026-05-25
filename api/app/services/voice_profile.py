"""Voice profile loading, deep trait tracking, and prompt formatting."""

from __future__ import annotations

from datetime import datetime, timezone

from supabase import Client

TRAIT_KEYS = ("directness", "conciseness", "warmth", "formality")
PATTERN_ALERT_THRESHOLD = 3
CLARITY_HISTORY_LEN = 20


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_voice_profile(supabase: Client, user_id: str) -> dict:
    result = supabase.table("profiles").select("voice_profile").eq("id", user_id).maybe_single().execute()
    data = result.data or {}
    return data.get("voice_profile") or {}


def _running_avg(current: float | None, new_value: float, count: int) -> float:
    if current is None or count <= 1:
        return round(new_value, 3)
    return round(((current * (count - 1)) + new_value) / count, 3)


def _update_trait_averages(traits: dict, new_scores: dict, sessions_count: int) -> dict:
    updated = dict(traits or {})
    for key in TRAIT_KEYS:
        raw = new_scores.get(key)
        if raw is None:
            continue
        try:
            value = max(0.0, min(1.0, float(raw)))
        except (TypeError, ValueError):
            continue
        updated[key] = _running_avg(updated.get(key), value, sessions_count)
    return updated


def _update_pattern_counts(counts: dict, flagged: list) -> dict:
    merged = dict(counts or {})
    for pattern in flagged or []:
        if not pattern or not isinstance(pattern, str):
            continue
        key = pattern.strip().lower().replace(" ", "_")
        merged[key] = int(merged.get(key) or 0) + 1
    return merged


def _detect_longitudinal_insights(pattern_counts: dict, clarity_scores: list[float]) -> list[str]:
    insights: list[str] = []

    for pattern, count in sorted(pattern_counts.items(), key=lambda x: -x[1]):
        if count >= PATTERN_ALERT_THRESHOLD:
            label = pattern.replace("_", " ")
            insights.append(f"Recurring pattern ({count}x): {label}")

    if len(clarity_scores) >= 6:
        recent = clarity_scores[-3:]
        prior = clarity_scores[-6:-3]
        recent_avg = sum(recent) / len(recent)
        prior_avg = sum(prior) / len(prior)
        delta = recent_avg - prior_avg
        if delta >= 5:
            insights.append(f"Clarity improving — up {delta:.0f} pts over recent sessions.")
        elif delta <= -5:
            insights.append(f"Clarity dipped recently — down {abs(delta):.0f} pts. Lead with the ask.")

    return insights[:5]


def format_voice_profile_for_prompt(profile: dict) -> str:
    if not profile:
        return "No prior sessions — infer style from transcript."

    parts: list[str] = []

    summary = profile.get("summary")
    if summary:
        parts.append(f"Style summary: {summary}")

    traits = profile.get("traits") or {}
    if traits:
        trait_line = ", ".join(f"{k} {traits[k]:.2f}" for k in TRAIT_KEYS if k in traits)
        if trait_line:
            parts.append(f"Trait scores (0-1): {trait_line}")

    avg_clarity = profile.get("avg_clarity_score")
    if avg_clarity is not None:
        parts.append(f"Average clarity score: {avg_clarity}")

    insights = profile.get("longitudinal_insights") or []
    if insights:
        parts.append("Longitudinal patterns: " + "; ".join(insights[:3]))

    top_patterns = profile.get("pattern_counts") or {}
    if top_patterns:
        top = sorted(top_patterns.items(), key=lambda x: -x[1])[:3]
        parts.append("Common weak spots: " + ", ".join(f"{k} ({v}x)" for k, v in top))

    format_usage = profile.get("format_usage") or {}
    if format_usage:
        fav = max(format_usage.items(), key=lambda x: x[1])[0]
        parts.append(f"Most used format: {fav}")

    sessions = profile.get("sessions_count")
    if sessions:
        parts.append(f"Sessions completed: {sessions}")

    return "\n".join(parts) if parts else "No prior sessions — infer style from transcript."


def update_voice_profile(
    supabase: Client,
    user_id: str,
    *,
    explanation: dict,
    output_format: str,
    clarity_score: float | None = None,
) -> dict:
    voice_signals = explanation.get("voice_signals") or ""
    if not voice_signals and clarity_score is None:
        return load_voice_profile(supabase, user_id)

    current = load_voice_profile(supabase, user_id)
    sessions_count = int(current.get("sessions_count") or 0) + 1

    pattern_counts = _update_pattern_counts(
        current.get("pattern_counts"),
        explanation.get("patterns_flagged") or [],
    )

    clarity_history = list(current.get("clarity_history") or [])
    if clarity_score is not None:
        try:
            clarity_history.append(float(clarity_score))
        except (TypeError, ValueError):
            pass
    clarity_history = clarity_history[-CLARITY_HISTORY_LEN:]
    avg_clarity = round(sum(clarity_history) / len(clarity_history), 1) if clarity_history else None

    format_usage = dict(current.get("format_usage") or {})
    format_usage[output_format] = int(format_usage.get(output_format) or 0) + 1

    traits = _update_trait_averages(
        current.get("traits"),
        explanation.get("trait_scores") or {},
        sessions_count,
    )

    longitudinal_insights = _detect_longitudinal_insights(pattern_counts, clarity_history)

    # Keep legacy weak_patterns list for backward compatibility
    weak_patterns = list(current.get("weak_patterns") or [])
    for p in explanation.get("patterns_flagged") or []:
        if p and p not in weak_patterns:
            weak_patterns.append(p)
    weak_patterns = weak_patterns[-20:]

    updated = {
        **current,
        "summary": voice_signals or current.get("summary"),
        "sessions_count": sessions_count,
        "traits": traits,
        "pattern_counts": pattern_counts,
        "weak_patterns": weak_patterns,
        "format_usage": format_usage,
        "clarity_history": clarity_history,
        "avg_clarity_score": avg_clarity,
        "longitudinal_insights": longitudinal_insights,
        "updated_at": _now_iso(),
    }

    supabase.table("profiles").update({
        "voice_profile": updated,
        "updated_at": _now_iso(),
    }).eq("id", user_id).execute()

    return updated
