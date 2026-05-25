'use client';

import { AppShell } from '@/components/studio/AppShell';
import { StudioCanvas } from '@/components/studio/StudioCanvas';

export default function StudioPage() {
  return <AppShell>{(token) => <StudioCanvas accessToken={token} />}</AppShell>;
}
