'use client';

import { motion } from 'framer-motion';
import { AppShell } from '@/components/studio/AppShell';
import { VoiceInsightsPanel } from '@/components/studio/VoiceInsightsPanel';
import { useVoiceProfile } from '@/hooks/useVoiceProfile';

function VoiceContent({ accessToken }: { accessToken: string }) {
  const { profile, loading } = useVoiceProfile(accessToken);

  return (
    <div className="relative z-10 mx-auto max-w-[680px] px-4 pb-24 pt-[104px] md:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-[clamp(28px,5vw,36px)] font-bold tracking-tight text-ink">
          Your voice
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">
          Traits, patterns, and clarity trends Vokal picks up as you record — so polish stays in your style.
        </p>
      </motion.div>

      <VoiceInsightsPanel
        voiceProfile={profile?.voice_profile ?? {}}
        loading={loading}
        variant="page"
      />
    </div>
  );
}

export default function VoicePage() {
  return <AppShell>{(token) => <VoiceContent accessToken={token} />}</AppShell>;
}
