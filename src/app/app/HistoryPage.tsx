'use client';

import { motion } from 'framer-motion';
import { AppShell } from '@/components/studio/AppShell';
import { SessionHistoryPanel } from '@/components/studio/SessionHistoryPanel';
import { useSessionHistory } from '@/hooks/useSessionHistory';

function HistoryContent({ accessToken }: { accessToken: string }) {
  const { sessions, loading, error, refresh } = useSessionHistory(accessToken);

  return (
    <div className="relative z-10 mx-auto max-w-[680px] px-4 pb-24 pt-[104px] md:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-[clamp(28px,5vw,36px)] font-bold tracking-tight text-ink">
          History
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">
          Past polished outputs you can copy, revisit, or reformat without recording again.
        </p>
      </motion.div>

      <SessionHistoryPanel
        sessions={sessions}
        loading={loading}
        error={error}
        accessToken={accessToken}
        onRefresh={refresh}
      />
    </div>
  );
}

export default function HistoryPage() {
  return <AppShell>{(token) => <HistoryContent accessToken={token} />}</AppShell>;
}
