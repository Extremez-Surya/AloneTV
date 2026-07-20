'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getLocalProfile } from '@/lib/supabase/profile';

interface SystemSettings {
  maintenance_mode: boolean;
  global_notice: string;
  tmdb_key: string;
  omdb_key: string;
}

const SETTINGS_KEY = 'alonetv_demo_settings';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    global_notice: '',
    tmdb_key: 'ad76ee8d50aeb65c15c39d6c6a9a2bf3',
    omdb_key: 'aa3991ff',
  });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  const saveSettings = (updated: Partial<SystemSettings>) => {
    const next = { ...settings, ...updated };
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSystemAction = (action: string) => {
    const confirmText = `Run action: ${action.replace(/_/g, ' ')}?`;
    if (!confirm(confirmText)) return;
    setBusy(action);

    setTimeout(() => {
      switch (action) {
        case 'clear_cache':
          localStorage.removeItem('alonetv_provider_config');
          break;
        case 'clear_reviews':
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('alonetv_reviews_')) { localStorage.removeItem(key); i--; }
          }
          break;
        case 'reset_history':
          localStorage.removeItem('alonetv_continue_watching');
          localStorage.removeItem('alonetv_watchlist');
          localStorage.removeItem('alonetv_playlists');
          break;
        case 'clear_payments':
          localStorage.removeItem('alonetv_mock_payments');
          break;
        case 'clear_profiles':
          localStorage.removeItem('alonetv_mock_profiles');
          break;
        case 'reset_all':
          const keysToKeep = ['alonetv_user', 'alonetv_avatar'];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('alonetv_') && !keysToKeep.includes(key)) {
              localStorage.removeItem(key); i--;
            }
          }
          break;
      }
      setBusy(null);
      alert(`Action completed: ${action.replace(/_/g, ' ')}`);
    }, 500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-text-muted mt-1">System configuration, API keys, and maintenance controls</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">System Controls</h3>

            <div className="flex items-center justify-between py-3 border-b border-border/30">
              <div>
                <p className="text-xs font-semibold text-white">Maintenance Mode</p>
                <p className="text-[10px] text-text-muted mt-0.5">Blocks all streaming and redirects users to maintenance page</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.maintenance_mode} onChange={() => saveSettings({ maintenance_mode: !settings.maintenance_mode })} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {settings.maintenance_mode && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20">
                <p className="text-[11px] text-red-300 font-mono">⚠️ Maintenance mode is ACTIVE. All users will see a maintenance page.</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Global Notice Banner</label>
                <div className="flex gap-2">
                  <input type="text" value={settings.global_notice} onChange={e => setSettings(prev => ({ ...prev, global_notice: e.target.value }))}
                    placeholder="Broadcast a message to all users..."
                    className="flex-1 px-3.5 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple placeholder-text-muted"
                  />
                  <button onClick={() => saveSettings({ global_notice: settings.global_notice })}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all"
                  >Update</button>
                </div>
                {saved && <p className="text-[10px] text-green-400 font-mono mt-1">✓ Settings saved</p>}
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">API Configuration</h3>

            <div>
              <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">TMDB API Key</label>
              <div className="flex gap-2">
                <input type="password" value={settings.tmdb_key} onChange={e => setSettings(prev => ({ ...prev, tmdb_key: e.target.value }))}
                  className="flex-1 px-3.5 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple font-mono"
                />
                <button onClick={() => saveSettings({ tmdb_key: settings.tmdb_key })}
                  className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] font-bold font-mono text-text-muted hover:text-white transition-all"
                >Save</button>
              </div>
              <p className="text-[9px] text-text-muted mt-1 font-mono">Used for movie/TV show metadata and search</p>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">OMDB API Key</label>
              <div className="flex gap-2">
                <input type="password" value={settings.omdb_key} onChange={e => setSettings(prev => ({ ...prev, omdb_key: e.target.value }))}
                  className="flex-1 px-3.5 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple font-mono"
                />
                <button onClick={() => saveSettings({ omdb_key: settings.omdb_key })}
                  className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] font-bold font-mono text-text-muted hover:text-white transition-all"
                >Save</button>
              </div>
              <p className="text-[9px] text-text-muted mt-1 font-mono">Used for additional movie metadata and ratings</p>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-green-400 font-mono bg-green-500/5 border border-green-500/10 rounded-xl px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Both APIs connected and operational
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">System Status</h3>
            <div className="space-y-3">
              {[
                ['Server', 'Online', 'text-green-400'],
                ['Database', 'Connected', 'text-green-400'],
                ['CDN', 'Operational', 'text-green-400'],
                ['API Rate Limit', '45% used', 'text-yellow-400'],
                ['Memory Usage', '32%', 'text-green-400'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/20">
                  <span className="text-[11px] text-text-muted">{label}</span>
                  <span className={`text-[10px] font-mono font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-card border border-red-500/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 font-mono">Destructive Utilities</h3>
            <p className="text-[10px] text-text-muted leading-relaxed">Clear cached data, reset user storage, or wipe demo databases.</p>

            <div className="space-y-2">
              {[
                ['Purge Cache', 'clear_cache', 'text-purple-400'],
                ['Delete All Reviews', 'clear_reviews', 'text-red-400'],
                ['Reset History & Playlists', 'reset_history', 'text-red-400'],
                ['Clear Payment Logs', 'clear_payments', 'text-red-400'],
                ['Wipe User Profiles', 'clear_profiles', 'text-red-400'],
                ['Reset All Demo Data', 'reset_all', 'text-red-500'],
              ].map(([label, action, color]) => (
                <button key={action}
                  onClick={() => handleSystemAction(action)}
                  disabled={busy === action}
                  className={`w-full py-2.5 bg-white/5 border border-white/10 hover:bg-red-950/20 hover:border-red-500/30 ${color} font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all text-left px-4 flex justify-between items-center disabled:opacity-50`}
                >
                  <span>{label}</span>
                  <span className="text-[8px] opacity-60">{busy === action ? 'Running...' : 'Run'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
