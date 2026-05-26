/** Build upload File with extension + MIME that match the recorded blob (required for Whisper). */
export function audioFileFromBlob(blob: Blob): File {
  const rawType = blob.type || 'audio/webm';
  const mime = rawType.split(';')[0].trim().toLowerCase();

  const extByMime: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/x-m4a': 'm4a',
  };

  const ext = extByMime[mime] ?? 'webm';
  return new File([blob], `recording.${ext}`, { type: mime });
}
