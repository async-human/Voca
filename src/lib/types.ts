import type { OutputFormat, PipelineStep } from './constants';

export interface Explanation {
  tag?: string;
  label?: string;
  text?: string;
}

export type MetricItem = { label: string; value: string; hint?: string };

export type BarChartData = {
  title?: string;
  unit?: string;
  items: { label: string; value: number }[];
};

export type OutputBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet_list'; items: string[] }
  | {
      type: 'metric_section';
      title: string;
      category?: string;
      items: MetricItem[];
      chart?: BarChartData;
    }
  | {
      type: 'kpi_grid';
      items: MetricItem[];
    }
  | {
      type: 'bar_chart';
      title?: string;
      unit?: string;
      items: { label: string; value: number }[];
    }
  | {
      type: 'callout';
      title: string;
      body: string;
      variant?: 'default' | 'insight' | 'risk';
    };

export interface StructuredFactsSection {
  category: string;
  title: string;
  metrics: {
    fiscal_year?: string | null;
    label?: string;
    value_display?: string;
    value?: string;
    numeric_value?: number;
    unit?: string;
    source_quote?: string;
  }[];
}

export interface StructuredFacts {
  sections?: StructuredFactsSection[];
  critical_non_numeric?: string[];
}

export interface Generation {
  format: OutputFormat;
  output_text: string;
  output_meta?: {
    subject?: string;
    blocks?: OutputBlock[];
    structured_facts?: StructuredFacts;
    facts_captured?: number;
    workflow_type?: 'post_call_followup' | 'crm_note' | 'voicemail_script' | 'pipeline_update' | string | null;
    crm_note?: {
      contact?: string | null;
      company?: string | null;
      role?: string | null;
      call_outcome?: string | null;
      key_points?: string[];
      pain_identified?: string | null;
      objections_raised?: string[];
      next_action?: string | null;
      next_action_date?: string | null;
      deal_signals?: string[];
      red_flags?: string[];
    };
    deal_stage_signal?: string | null;
    workflow_state?: Record<string, unknown>;
    approval_bundle?: {
      workflow_type?: string | null;
      domain?: string | null;
      risk_level?: 'low' | 'medium' | 'high';
      approval_required?: boolean;
      approval_reason?: string | null;
      missing_fields?: string[];
      actions?: {
        id: string;
        type: string;
        title: string;
        payload: Record<string, unknown>;
        requires_approval: boolean;
        approval_reason?: string | null;
        status: string;
      }[];
    };
  };
  explanations?: Explanation[];
}

export interface SessionResult {
  id?: string;
  format?: OutputFormat;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  pipeline_step?: PipelineStep | 'failed';
  clarity_score?: number;
  error_message?: string;
  raw_transcript?: string;
  clean_transcript?: string;
  /** Pipeline intent; may include numerical_facts for sessions before output_meta.structured_facts. */
  intent?: {
    numerical_facts?: StructuredFacts;
    context_hints?: {
      contact?: { name?: string; company?: string; email?: string };
      workflow_type?: string;
    };
    [key: string]: unknown;
  };
  created_at?: string;
  updated_at?: string;
  generation?: Generation;
}

export interface SessionSummary {
  id: string;
  format: OutputFormat;
  status: SessionResult['status'];
  duration_ms?: number;
  clarity_score?: number;
  created_at?: string;
  output_preview?: string | null;
  generation_format?: OutputFormat | null;
  output_meta?: { subject?: string };
}

export interface VoiceTraits {
  directness?: number;
  conciseness?: number;
  warmth?: number;
  formality?: number;
  urgency_calibration?: number;
  objection_handling?: number;
  specificity?: number;
  follow_through_clarity?: number;
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
