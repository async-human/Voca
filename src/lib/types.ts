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
