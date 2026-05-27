import type { OutputFormat } from './constants';

export type DeliveryPlatform = 'gmail' | 'slack' | 'notion' | 'linkedin' | 'zapier';

export const PLATFORM_LABELS: Record<DeliveryPlatform, string> = {
  gmail: 'Gmail',
  slack: 'Slack',
  notion: 'Notion',
  linkedin: 'LinkedIn',
  zapier: 'Zapier',
};

/** Platforms that make sense per output format */
export const FORMAT_PLATFORMS: Record<OutputFormat, DeliveryPlatform[]> = {
  email: ['gmail', 'zapier'],
  slack: ['slack', 'zapier'],
  report: ['gmail', 'notion', 'zapier'],
  linkedin: ['linkedin', 'zapier'],
  journal: ['notion', 'zapier'],
  sales: ['gmail', 'zapier'],
  post_call_followup: ['gmail', 'zapier'],
  crm_note: ['zapier', 'notion'],
  voicemail_script: ['zapier'],
  pipeline_update: ['gmail', 'notion', 'zapier'],
};

export interface PlatformConnection {
  id: string;
  platform: DeliveryPlatform;
  label: string;
  metadata: {
    email?: string;
    workspace_name?: string;
    database_id?: string;
    webhook_url?: string;
  };
  connected_at?: string;
}

export interface DeliveryDestination {
  connection_id: string;
  platform: DeliveryPlatform;
  to?: string;
  subject?: string;
  database_id?: string;
  target_platform?: string;
}

export interface DeliverResult {
  attempt_id: string;
  status: string;
  platform: string;
  external_id?: string;
  message?: string;
}
