'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StatusBadge from '@/components/admin/StatCard';

interface Provider {
  id: string;
  name: string;
  type: 'iframe' | 'hls' | 'mp4';
  baseUrl: string;
  enabled: boolean;
  reliability: 'high' | 'medium' | 'low';
  languages: string[];
  priority: number;
  testUrl?: string;
}

const DEFAULT_PROVIDERS: Provider[] = [
  { id: 'vidlink', name: 'VidLink', type: 'iframe', baseUrl: 'https://vidlink.pro', enabled: true, reliability: 'high', languages: ['en', 'hi', 'es', 'ja', 'ko', 'zh'], priority: 1, testUrl: 'https://vidlink.pro' },
  { id: 'vidsrc-me', name: 'VidSrc.me', type: 'iframe', baseUrl: 'https://vidsrc.me', enabled: true, reliability: 'high', languages: ['en', 'hi', 'es', 'ja'], priority: 2, testUrl: 'https://vidsrc.me' },
  { id: 'multiembed', name: 'MultiEmbed', type: 'iframe', baseUrl: 'https://multiembed.mov', enabled: true, reliability: 'high', languages: ['en', 'hi', 'es'], priority: 3, testUrl: 'https://multiembed.mov' },
  { id: 'smashystream', name: 'SmashyStream', type: 'iframe', baseUrl: 'https://embed.smashystream.com', enabled: true, reliability: 'high', languages: ['en', 'hi'], priority: 4, testUrl: 'https://embed.smashystream.com' },
  { id: 'vidking', name: 'VidKing', type: 'iframe', baseUrl: 'https://www.vidking.net', enabled: true, reliability: 'high', languages: ['en', 'hi', 'es'], priority: 5, testUrl: 'https://www.vidking.net' },
  { id: '2embed-cc', name: '2Embed.cc', type: 'iframe', baseUrl: 'https://www.2embed.cc', enabled: true, reliability: 'medium', languages: ['en', 'hi'], priority: 6, testUrl: 'https://www.2embed.cc' },
];

const STORAGE_KEY = 'alonetv_provider_config';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'failed' | 'pending'>>({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setProviders(JSON.parse(stored)); } catch { setProviders(DEFAULT_PROVIDERS); }
    } else {
      setProviders(DEFAULT_PROVIDERS);
    }
  }, []);

  const saveProviders = (updated: Provider[]) => {
    setProviders(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleProvider = (id: string) => {
    saveProviders(providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const updatePriority = (id: string, delta: number) => {
    saveProviders(providers.map(p => p.id === id ? { ...p, priority: Math.max(1, p.priority + delta) } : p));
  };

  const updateBaseUrl = (id: string, url: string) => {
    saveProviders(providers.map(p => p.id === id ? { ...p, baseUrl: url } : p));
  };

  const testProvider = async (provider: Provider) => {
    setTestingId(provider.id);
    setTestResults(prev => ({ ...prev, [provider.id]: 'pending' }));
    try {
      const url = provider.testUrl || provider.baseUrl;
      const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      setTestResults(prev => ({ ...prev, [provider.id]: 'success' }));
    } catch {
      setTestResults(prev => ({ ...prev, [provider.id]: 'failed' }));
    }
    setTestingId(null);
  };

  const resetDefaults = () => {
    saveProviders(DEFAULT_PROVIDERS);
  };

  const sorted = [...providers].sort((a, b) => a.priority - b.priority);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Providers</h1>
            <p className="text-sm text-text-muted mt-1">Manage video source providers, toggle availability, and test connectivity</p>
          </div>
          <button onClick={resetDefaults}
            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted hover:text-white transition-all"
          >Reset Defaults</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] uppercase font-mono tracking-widest text-text-muted">Total Providers</p>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{providers.length}</p>
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] uppercase font-mono tracking-widest text-text-muted">Enabled</p>
          <p className="text-2xl font-bold text-green-400 mt-1 font-mono">{providers.filter(p => p.enabled).length}</p>
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] uppercase font-mono tracking-widest text-text-muted">Disabled</p>
          <p className="text-2xl font-bold text-red-400 mt-1 font-mono">{providers.filter(p => !p.enabled).length}</p>
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] uppercase font-mono tracking-widest text-text-muted">HLS Providers</p>
          <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">{providers.filter(p => p.type === 'hls').length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((provider) => (
          <div key={provider.id} className="bg-bg-card border border-border rounded-2xl p-5 hover:border-purple-500/15 transition-all">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                  provider.enabled ? 'bg-purple-500/15 text-purple-400' : 'bg-zinc-500/10 text-zinc-500'
                }`}>
                  {provider.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{provider.name}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono border ${
                      provider.type === 'hls' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      provider.type === 'mp4' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>{provider.type}</span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                      provider.reliability === 'high' ? 'bg-green-500/10 text-green-400' :
                      provider.reliability === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>{provider.reliability}</span>
                  </div>
                  <p className="text-[10px] font-mono text-text-muted truncate mt-1">{provider.baseUrl}</p>
                  {provider.languages.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {provider.languages.map(lang => (
                        <span key={lang} className="text-[8px] px-1 py-0.5 rounded bg-white/5 text-text-muted font-mono">{lang.toUpperCase()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <button onClick={() => updatePriority(provider.id, -1)} className="w-7 h-7 rounded-lg bg-bg-secondary border border-border hover:bg-white/10 flex items-center justify-center text-text-muted text-xs">−</button>
                  <span className="w-6 text-center text-[10px] font-mono text-text-muted font-bold">{provider.priority}</span>
                  <button onClick={() => updatePriority(provider.id, 1)} className="w-7 h-7 rounded-lg bg-bg-secondary border border-border hover:bg-white/10 flex items-center justify-center text-text-muted text-xs">+</button>
                </div>
                <button
                  onClick={() => testProvider(provider)}
                  disabled={testingId === provider.id}
                  className="px-3 py-1.5 bg-bg-secondary border border-border hover:bg-white/10 rounded-lg text-[10px] font-mono text-text-muted hover:text-white transition-all disabled:opacity-50"
                >
                  {testResults[provider.id] === 'pending' ? '...' : testResults[provider.id] === 'success' ? '✓' : testResults[provider.id] === 'failed' ? '✗' : 'Test'}
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={provider.enabled} onChange={() => toggleProvider(provider.id)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-zinc-700 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
