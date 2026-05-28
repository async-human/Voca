'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { connectZapier, disconnectConnection, startOAuth, updateNotionDatabase } from '@/lib/api';
import { PLATFORM_LABELS, type DeliveryPlatform, type PlatformConnection } from '@/lib/delivery';
import { AppShell } from '@/components/studio/AppShell';
import { PlatformIcon } from '@/components/studio/PlatformIcon';
import { useConnections } from '@/hooks/useConnections';

const OAUTH_PLATFORMS = [
  {
    id: 'gmail' as const,
    title: 'Gmail',
    desc: 'Send emails from your account after you approve the draft.',
    badge: 'Professional',
  },
  {
    id: 'notion' as const,
    title: 'Notion',
    desc: 'Save journal entries and notes as new pages in a database.',
    badge: 'Journal',
  },
];

const COMING_SOON = [
  { id: 'slack' as const, title: 'Slack', desc: 'Post to channels and DMs.' },
  { id: 'linkedin' as const, title: 'LinkedIn', desc: 'Publish posts to your profile.' },
];

function ConnectionsContent({ accessToken }: { accessToken: string }) {
  const searchParams = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const { connections, loading, error } = useConnections(accessToken, refreshKey);
  const [toast, setToast] = useState('');
  const [zapierUrl, setZapierUrl] = useState('');
  const [zapierLabel, setZapierLabel] = useState('WhatsApp via Zapier');
  const [notionDbById, setNotionDbById] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const drafts = searchParams.get('drafts');
    const err = searchParams.get('error');
    if (connected === 'gmail' && drafts === '1') {
      setToast('Gmail connected with draft permission');
    } else if (connected) {
      setToast(`${PLATFORM_LABELS[connected as DeliveryPlatform] || connected} connected`);
    }
    if (err) setToast(decodeURIComponent(err.replace(/\+/g, ' ')));
  }, [searchParams]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const map: Record<string, string> = {};
    connections.forEach((c) => {
      if (c.platform === 'notion' && c.metadata.database_id) {
        map[c.id] = c.metadata.database_id;
      }
    });
    setNotionDbById((prev) => ({ ...map, ...prev }));
  }, [connections]);

  function isConnected(platform: DeliveryPlatform) {
    return connections.some((c) => c.platform === platform);
  }

  const gmailConn = connections.find((c) => c.platform === 'gmail');
  const gmailNeedsDraftScope =
    gmailConn && gmailConn.metadata.has_draft_permission === false;

  async function handleOAuth(platform: 'gmail' | 'notion') {
    setBusy(platform);
    try {
      const url = await startOAuth(accessToken, platform);
      window.location.href = url;
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'OAuth failed');
      setBusy(null);
    }
  }

  async function handleZapier() {
    if (!zapierUrl.trim()) return;
    setBusy('zapier');
    try {
      await connectZapier(accessToken, zapierUrl.trim(), zapierLabel.trim() || 'Zapier');
      setZapierUrl('');
      setRefreshKey((k) => k + 1);
      setToast('Zapier webhook connected');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not connect Zapier');
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect(id: string) {
    setBusy(id);
    try {
      await disconnectConnection(accessToken, id);
      setRefreshKey((k) => k + 1);
      setToast('Disconnected');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not disconnect');
    } finally {
      setBusy(null);
    }
  }

  async function handleNotionDb(connectionId: string) {
    const dbId = notionDbById[connectionId]?.trim();
    if (!dbId) return;
    setBusy(connectionId);
    try {
      await updateNotionDatabase(accessToken, connectionId, dbId);
      setRefreshKey((k) => k + 1);
      setToast('Notion database saved');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not save database');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative z-10 mx-auto max-w-[680px] px-4 pb-24 pt-[104px] md:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-[clamp(28px,5vw,36px)] font-bold tracking-tight text-ink">
          Connections
        </h1>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-muted">
          Link once, send from Studio after every recording. Nothing is delivered until you press Send.
        </p>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 grid gap-2 rounded-[20px] border border-faint-2 bg-white/50 px-5 py-4 sm:grid-cols-3 sm:gap-4"
      >
        {[
          { step: '1', text: 'Connect a platform below' },
          { step: '2', text: 'Record & review in Studio' },
          { step: '3', text: 'Press Send when ready' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[10px] font-bold text-paper">
              {step}
            </span>
            <span className="text-[12px] leading-snug text-ink-3">{text}</span>
          </div>
        ))}
      </motion.div>

      {error && (
        <div className="mb-4 rounded-[14px] border border-accent/15 bg-accent/8 px-4 py-3 text-sm text-accent-2">
          {error}
        </div>
      )}

      {gmailNeedsDraftScope && (
        <div className="mb-4 rounded-[14px] border border-accent/20 bg-accent/8 px-4 py-3.5 text-[13px] leading-relaxed text-accent-2">
          <p className="font-semibold text-accent">Gmail is missing draft permission</p>
          <p className="mt-1.5 text-accent-2">
            In Google Cloud Console → APIs &amp; Services → OAuth consent screen → <strong>Scopes</strong>, add{' '}
            <code className="text-[12px]">gmail.compose</code> (Manage drafts and send emails). Then click{' '}
            <strong>Remove</strong> on your Gmail row below, and <strong>Connect with OAuth</strong> again. On
            Google&apos;s screen you should see draft/manage permission — not only &quot;send email&quot;.
          </p>
        </div>
      )}

      {/* Zapier — fastest path */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-5 overflow-hidden rounded-[22px] border border-faint-2 bg-white/70 shadow-[0_8px_32px_rgba(28,24,20,.04)]"
      >
        <div className="border-b border-faint-2/80 bg-gradient-to-r from-accent/5 to-transparent px-5 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-accent">
              Fastest start
            </span>
            <span className="font-mono text-[9px] text-muted">WhatsApp · Telegram · anything in Zapier</span>
          </div>
        </div>
        <div className="p-5 md:p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-faint-2 bg-paper text-ink">
              <PlatformIcon platform="zapier" size="md" />
            </span>
            <div>
              <p className="font-serif text-lg font-bold text-ink">Zapier webhook</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Paste a Catch Hook URL from Zapier. Route voice output to any app in their ecosystem.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <input
              value={zapierUrl}
              onChange={(e) => setZapierUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="w-full rounded-[14px] border border-faint-2 bg-paper px-4 py-2.5 text-[13px] outline-none transition-colors focus:border-ink/25"
            />
            <div className="flex gap-2">
              <input
                value={zapierLabel}
                onChange={(e) => setZapierLabel(e.target.value)}
                placeholder="Label (e.g. WhatsApp)"
                className="min-w-0 flex-1 rounded-[14px] border border-faint-2 bg-paper px-4 py-2.5 text-[13px] outline-none focus:border-ink/25"
              />
              <button
                type="button"
                disabled={busy === 'zapier' || !zapierUrl.trim()}
                onClick={handleZapier}
                className="shrink-0 cursor-pointer rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-accent disabled:opacity-45"
              >
                {busy === 'zapier' ? 'Adding…' : 'Add webhook'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* OAuth platforms */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {OAUTH_PLATFORMS.map(({ id, title, desc, badge }, i) => {
          const connected = isConnected(id);
          return (
            <motion.button
              key={id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              disabled={busy === id}
              onClick={() => handleOAuth(id)}
              className={cn(
                'cursor-pointer rounded-[20px] border p-5 text-left transition-all duration-200',
                connected
                  ? 'border-teal/25 bg-teal/[0.04] hover:border-teal/40'
                  : 'border-faint-2 bg-white/70 hover:border-ink/15 hover:shadow-[0_8px_28px_rgba(28,24,20,.05)]',
                busy === id && 'opacity-60',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-faint-2 bg-paper text-ink">
                  <PlatformIcon platform={id} size="md" />
                </span>
                {connected ? (
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 font-mono text-[9px] text-teal">
                    Connected
                  </span>
                ) : (
                  <span className="rounded-full bg-faint-2/80 px-2 py-0.5 font-mono text-[9px] text-muted">
                    {badge}
                  </span>
                )}
              </div>
              <p className="mt-3 font-serif text-base font-bold text-ink">{title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{desc}</p>
              <p className="mt-3 text-[12px] font-medium text-accent">
                {connected ? 'Reconnect →' : 'Connect with OAuth →'}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Coming soon */}
      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        {COMING_SOON.map(({ id, title, desc }) => (
          <div
            key={id}
            className="rounded-[16px] border border-dashed border-faint-2 bg-white/30 px-4 py-3.5 opacity-70"
          >
            <div className="flex items-center gap-2">
              <PlatformIcon platform={id} size="sm" />
              <p className="text-[13px] font-semibold text-ink-3">{title}</p>
              <span className="ml-auto font-mono text-[8px] uppercase tracking-wide text-faint">Soon</span>
            </div>
            <p className="mt-1 pl-6 text-[11px] text-muted">{desc}</p>
          </div>
        ))}
      </div>

      {/* Active connections */}
      <div className="rounded-[22px] border border-faint-2 bg-white/70 p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Your connections</p>
          {!loading && connections.length > 0 && (
            <span className="font-mono text-[9px] text-faint">{connections.length} active</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-[16px] bg-faint-2/60" />
            ))}
          </div>
        ) : connections.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-faint-2 px-5 py-8 text-center">
            <p className="font-serif text-base font-bold text-ink">No connections yet</p>
            <p className="mt-2 text-[13px] text-muted">Add Zapier or connect Gmail/Notion above.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {connections.map((conn) => (
              <ConnectionRow
                key={conn.id}
                conn={conn}
                busy={busy === conn.id}
                notionDb={notionDbById[conn.id] ?? ''}
                onNotionDbChange={(v) => setNotionDbById((prev) => ({ ...prev, [conn.id]: v }))}
                onSaveNotionDb={() => handleNotionDb(conn.id)}
                onDisconnect={() => handleDisconnect(conn.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 text-center text-[12px] text-muted">
        Ready to try it?{' '}
        <Link href="/app/" className="font-medium text-ink underline-offset-2 hover:underline">
          Open Studio →
        </Link>
      </p>

      <div
        className={cn(
          'fixed bottom-7 left-1/2 z-[300] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-paper shadow-lg transition-all duration-300',
          toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0',
        )}
      >
        {toast}
      </div>
    </div>
  );
}

function ConnectionRow({
  conn,
  busy,
  notionDb,
  onNotionDbChange,
  onSaveNotionDb,
  onDisconnect,
}: {
  conn: PlatformConnection;
  busy: boolean;
  notionDb: string;
  onNotionDbChange: (v: string) => void;
  onSaveNotionDb: () => void;
  onDisconnect: () => void;
}) {
  const needsNotionDb = conn.platform === 'notion' && !conn.metadata.database_id;

  return (
    <li className="rounded-[16px] border border-faint-2/80 bg-paper/90 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-faint-2 bg-white text-ink">
          <PlatformIcon platform={conn.platform} size="sm" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink">{conn.label}</p>
            <span className="font-mono text-[9px] uppercase tracking-wide text-muted">
              {PLATFORM_LABELS[conn.platform]}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {conn.metadata.email || conn.metadata.workspace_name || 'Connected'}
          </p>
          {conn.platform === 'gmail' && conn.metadata.has_draft_permission === false && (
            <p className="mt-2 text-[11px] leading-relaxed text-accent">
              Drafts blocked — remove this connection, add gmail.compose in Google Cloud, then reconnect.
            </p>
          )}
          {conn.platform === 'gmail' && conn.metadata.has_draft_permission === true && (
            <p className="mt-2 text-[11px] text-teal">Drafts enabled</p>
          )}

          {conn.platform === 'notion' && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={notionDb}
                onChange={(e) => onNotionDbChange(e.target.value)}
                placeholder="Paste Notion database ID"
                className="min-w-0 flex-1 rounded-[10px] border border-faint-2 bg-white px-3 py-2 text-[12px] outline-none focus:border-ink/20"
              />
              <button
                type="button"
                disabled={busy || !notionDb.trim()}
                onClick={onSaveNotionDb}
                className="cursor-pointer shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-[11px] font-semibold text-paper hover:bg-accent disabled:opacity-45"
              >
                {needsNotionDb ? 'Required — Save' : 'Update'}
              </button>
            </div>
          )}
          {conn.platform === 'notion' && (
            <p className="mt-1.5 text-[10px] leading-relaxed text-faint">
              Open your database in Notion → Share → Copy link. The ID is the 32-char string in the URL.
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onDisconnect}
          className="shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[11px] text-muted transition-colors hover:bg-accent/8 hover:text-accent disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </li>
  );
}

function ConnectionsFallback() {
  return (
    <div className="relative z-10 mx-auto max-w-[680px] px-4 pb-24 pt-[104px] md:px-6">
      <div className="mb-6 h-10 w-48 animate-pulse rounded-lg bg-faint-2/70" />
      <div className="mb-5 h-32 animate-pulse rounded-[22px] bg-faint-2/50" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-36 animate-pulse rounded-[20px] bg-faint-2/50" />
        <div className="h-36 animate-pulse rounded-[20px] bg-faint-2/50" />
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <AppShell>
      {(token) => (
        <Suspense fallback={<ConnectionsFallback />}>
          <ConnectionsContent accessToken={token} />
        </Suspense>
      )}
    </AppShell>
  );
}
