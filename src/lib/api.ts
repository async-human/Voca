import type { SessionResult, SessionSummary, UserProfile } from './types';
import type { DeliverResult, DeliveryDestination, PlatformConnection } from './delivery';
import { audioFileFromBlob } from './audio';
import type { StoredUser } from './auth';

const API = process.env.NEXT_PUBLIC_VOCA_API_URL || 'http://localhost:3001';

export function parseApiError(data: unknown, fallback = 'Request failed'): string {
  if (!data || typeof data !== 'object' || !('detail' in data)) return fallback;
  const detail = (data as { detail: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === 'object' && d && 'msg' in d ? String(d.msg) : String(d))).join(', ');
  }
  return String(detail);
}

export async function processVoice(
  token: string,
  audio: Blob,
  format: string,
  durationMs: number,
): Promise<{ session_id: string }> {
  const fd = new FormData();
  fd.append('audio', audioFileFromBlob(audio));
  fd.append('format', format);
  fd.append('duration_ms', String(durationMs));

  const res = await fetch(`${API}/api/v1/voice/process`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data));
  return data;
}

export async function getSession(token: string, id: string): Promise<SessionResult> {
  const res = await fetch(`${API}/api/v1/sessions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data, 'Failed to load session'));
  return data;
}

export async function regenerateSession(
  token: string,
  id: string,
  format: string,
): Promise<void> {
  const res = await fetch(`${API}/api/v1/sessions/${id}/regenerate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ format }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data));
}

export async function listSessions(
  token: string,
  options?: { limit?: number; status?: SessionResult['status'] },
): Promise<SessionSummary[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.status) params.set('status', options.status);
  const qs = params.toString();
  const res = await fetch(`${API}/api/v1/sessions${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data, 'Failed to load history'));
  return data.sessions ?? [];
}

export async function deliverSession(
  token: string,
  sessionId: string,
  connectionId: string,
  destination: Omit<DeliveryDestination, 'connection_id' | 'platform'>,
  outputText?: string,
): Promise<DeliverResult> {
  const res = await fetch(`${API}/api/v1/sessions/${sessionId}/deliver`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connection_id: connectionId,
      destination,
      output_text: outputText,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data, 'Delivery failed'));
  return data;
}

export async function listConnections(token: string): Promise<PlatformConnection[]> {
  let res: Response;
  try {
    res = await fetch(`${API}/api/v1/connections`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error(
      'Could not reach the API. If you use www.vokal.work, ensure Railway CORS_ORIGINS includes it and the API is redeployed.',
    );
  }
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data, 'Failed to load connections'));
  return data.connections ?? [];
}

export async function connectZapier(token: string, webhookUrl: string, label = 'Zapier'): Promise<PlatformConnection> {
  const res = await fetch(`${API}/api/v1/connections/zapier`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ webhook_url: webhookUrl, label }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data));
  return data;
}

export async function startOAuth(token: string, platform: 'gmail' | 'notion'): Promise<string> {
  const res = await fetch(`${API}/api/v1/connections/oauth/${platform}/start`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data));
  return data.url;
}

export async function disconnectConnection(token: string, connectionId: string): Promise<void> {
  const res = await fetch(`${API}/api/v1/connections/${connectionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(parseApiError(data));
  }
}

export async function updateNotionDatabase(
  token: string,
  connectionId: string,
  databaseId: string,
): Promise<PlatformConnection> {
  const res = await fetch(`${API}/api/v1/connections/${connectionId}/notion`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ database_id: databaseId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data));
  return data;
}

export async function getGoogleAuthStartUrl(next = '/app/'): Promise<string> {
  const res = await fetch(`${API}/api/v1/auth/google/start?next=${encodeURIComponent(next)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data, 'Could not start Google sign-in'));
  return data.url as string;
}

export async function completeGoogleAuth(
  code: string,
  state: string | null,
): Promise<{ access_token: string; user: StoredUser; next: string }> {
  const res = await fetch(`${API}/api/v1/auth/google/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data, 'Google sign-in failed'));
  return data;
}

export async function fetchAuthMe(token: string): Promise<StoredUser> {
  const res = await fetch(`${API}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data));
  return data as StoredUser;
}

export async function getProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${API}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data, 'Failed to load profile'));
  return data;
}
