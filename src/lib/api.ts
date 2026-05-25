import type { SessionResult, SessionSummary, UserProfile } from './types';

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
  fd.append('audio', new File([audio], 'recording.webm', { type: 'audio/webm' }));
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

export async function getProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${API}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data, 'Failed to load profile'));
  return data;
}
