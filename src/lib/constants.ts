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

export type OutputFormat = 'email' | 'slack' | 'report' | 'linkedin' | 'journal';

export const FORMATS: {
  id: OutputFormat;
  name: string;
  desc: string;
  label: string;
}[] = [
  { id: 'email', name: 'Email', desc: 'Professional', label: 'Professional email' },
  { id: 'slack', name: 'Slack', desc: 'Team message', label: 'Slack message' },
  { id: 'report', name: 'Report', desc: 'Executive', label: 'Executive report' },
  { id: 'linkedin', name: 'LinkedIn', desc: 'Social post', label: 'LinkedIn post' },
  { id: 'journal', name: 'Journal', desc: 'Reflection', label: 'Journal entry' },
];

export function formatMeta(id: OutputFormat) {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0];
}
