import type { OutputFormat, PipelineStep } from './constants';

export interface Explanation {
  tag?: string;
  label?: string;
  text?: string;
}

export interface Generation {
  format: OutputFormat;
  output_text: string;
  output_meta?: { subject?: string };
  explanations?: Explanation[];
}

export interface SessionResult {
  status: 'pending' | 'processing' | 'complete' | 'failed';
  pipeline_step?: PipelineStep | 'failed';
  clarity_score?: number;
  error_message?: string;
  generation?: Generation;
}

export interface VoiceTraits {
  directness?: number;
  conciseness?: number;
  warmth?: number;
  formality?: number;
}

export interface VoiceProfile {
  summary?: string;
  sessions_count?: number;
  traits?: VoiceTraits;
  pattern_counts?: Record<string, number>;
  weak_patterns?: string[];
  format_usage?: Record<string, number>;
  clarity_history?: number[];
  avg_clarity_score?: number;
  longitudinal_insights?: string[];
  last_weekly_insight_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  voice_profile: VoiceProfile;
  created_at?: string;
}
