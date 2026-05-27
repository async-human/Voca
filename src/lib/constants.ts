export const PIPELINE_STEPS = [
  'transcribing',
  'cleaning',
  'understanding',
  'generating',
  'critiquing',
  'explaining',
  'complete',
] as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export const STEP_LABELS: Record<PipelineStep, string> = {
  transcribing: 'Transcribe',
  cleaning: 'Clean',
  understanding: 'Intent',
  generating: 'Write',
  critiquing: 'Refine',
  explaining: 'Explain',
  complete: 'Done',
};

export type OutputFormat =
  | 'email'
  | 'slack'
  | 'report'
  | 'linkedin'
  | 'journal'
  | 'sales'
  | 'post_call_followup'
  | 'crm_note'
  | 'voicemail_script'
  | 'pipeline_update';

export type FormatMeta = {
  id: OutputFormat;
  name: string;
  desc: string;
  label: string;
};

export const FORMAT_META: Record<OutputFormat, FormatMeta> = {
  email: { id: 'email', name: 'Email', desc: 'Professional', label: 'Professional email' },
  slack: { id: 'slack', name: 'Slack', desc: 'Team message', label: 'Slack message' },
  report: { id: 'report', name: 'Report', desc: 'Executive', label: 'Executive report' },
  linkedin: { id: 'linkedin', name: 'LinkedIn', desc: 'Social post', label: 'LinkedIn post' },
  journal: { id: 'journal', name: 'Journal', desc: 'Reflection', label: 'Journal entry' },
  sales: { id: 'sales', name: 'Sales', desc: 'Follow-up', label: 'Sales workflow' },
  post_call_followup: { id: 'post_call_followup', name: 'Follow-up', desc: 'Sales email', label: 'Post-call follow-up' },
  crm_note: { id: 'crm_note', name: 'CRM Note', desc: 'Sales log', label: 'CRM note' },
  voicemail_script: { id: 'voicemail_script', name: 'Voicemail', desc: 'Call script', label: 'Voicemail script' },
  pipeline_update: { id: 'pipeline_update', name: 'Pipeline', desc: 'Sales update', label: 'Pipeline update' },
};

export const FORMATS: FormatMeta[] = [
  { id: 'email', name: 'Email', desc: 'Professional', label: 'Professional email' },
  { id: 'slack', name: 'Slack', desc: 'Team message', label: 'Slack message' },
  { id: 'report', name: 'Report', desc: 'Executive', label: 'Executive report' },
  { id: 'linkedin', name: 'LinkedIn', desc: 'Social post', label: 'LinkedIn post' },
  { id: 'journal', name: 'Journal', desc: 'Reflection', label: 'Journal entry' },
  { id: 'sales', name: 'Sales', desc: 'Follow-up', label: 'Sales workflow' },
];

export function formatMeta(id: OutputFormat) {
  return FORMAT_META[id] ?? FORMAT_META.email;
}
