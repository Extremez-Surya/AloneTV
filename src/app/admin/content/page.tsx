'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import StatusBadge from '@/components/admin/StatusBadge';

interface TMDBResult {
  id: number; media_type?: string; title?: string; name?: string;
  poster_path?: string; backdrop_path?: string; overview?: string;
  vote_average?: number; release_date?: string; first_air_date?: string;
  genre_ids?: number[];
}

interface FeaturedItem {
  id: string; tmdb_id: number; title: string; type: string;
  poster_url: string; added_at: string;
}

const FEATURED_KEY = 'alonetv_featured_content';

export default function AdminContentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchType, setSearchType] = useState<'multi' | 'movie' | 'tv'>('multi');
  const [featured, setFeatured] = useState<FeaturedItem[]>(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem(FEATURED_KEY) || '[]'); } catch {}
    }
    return [];
  });

  const doSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ q: searchQuery });
      if (searchType !== 'multi') params.set('type', searchType);
      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch {}
    setSearching(false);
  }, [searchQuery, searchType]);

  const addFeatured = (item: TMDBResult) => {
    const newItem: FeaturedItem = {
      id: `feat-${Date.now()}`,
      tmdb_id: item.id,
      title: item.title || item.name || 'Unknown',
      type: item.media_type || 'movie',
      poster_url: item.poster_path
        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
        : '',
      added_at: new Date().toISOString(),
    };
    const updated = [newItem, ...featured];
    setFeatured(updated);
    localStorage.setItem(FEATURED_KEY, JSON.stringify(updated));
  };

  const removeFeatured = (id: string) => {
    const updated = featured.filter(f => f.id !== id);
    setFeatured(updated);
    localStorage.setItem(FEATURED_KEY, JSON.stringify(updated));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Content Manager</h1>
        <p className="text-sm text-text-muted mt-1">Browse TMDB catalog, manage featured content, and preview media</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono mb-4">Search TMDB Catalog</h3>
          <div className="flex gap-2 mb-4">
            <div className="flex gap-1">
              {(['multi', 'movie', 'tv'] as const).map(t => (
                <button key={t} onClick={() => setSearchType(t)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider border transition-all ${
                    searchType === t ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-transparent border-transparent text-text-muted hover:text-white'
                  }`}
                >{t}</button>
              ))}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text" placeholder="Search movies, TV shows..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                className="flex-1 px-3.5 py-1.5 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple placeholder-text-muted"
              />
              <button onClick={doSearch} disabled={searching}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all disabled:opacity-50"
              >{searching ? '...' : 'Search'}</button>
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-center text-text-muted text-xs font-mono py-8">
                {searching ? 'Searching...' : 'Search for movies or TV shows above'}
              </p>
            ) : (
              searchResults.slice(0, 20).map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-bg-secondary/40 border border-border/50 rounded-xl p-3 hover:border-purple-500/20 transition-all group">
                  <div className="w-10 h-14 rounded-lg bg-bg-secondary overflow-hidden shrink-0 border border-border/30">
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px] font-mono">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.title || item.name}</p>
                    <p className="text-[9px] font-mono text-text-muted truncate mt-0.5">
                      {(item.release_date || item.first_air_date || '').slice(0, 4) || 'N/A'}
                      {item.vote_average ? ` • ${item.vote_average.toFixed(1)} ★` : ''}
                    </p>
                    {item.overview && <p className="text-[9px] text-text-muted/60 line-clamp-1 mt-0.5">{item.overview}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted font-mono uppercase">{item.media_type || searchType}</span>
                    <button onClick={() => addFeatured(item)}
                      className="px-2 py-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg text-[8px] font-bold font-mono uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all"
                    >Feature</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono mb-4">Featured Content</h3>
          <p className="text-[10px] text-text-muted font-mono mb-4">Curated content highlighted on the homepage</p>
          {featured.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">📦</p>
              <p className="text-xs text-text-muted font-mono">No featured content yet</p>
              <p className="text-[9px] text-text-muted/60 mt-1">Search and add items from the catalog</p>
            </div>
          ) : (
            <div className="space-y-2">
              {featured.map((item) => (
                <div key={item.id} className="flex items-center gap-2 bg-bg-secondary/40 border border-border/50 rounded-xl p-2.5 group">
                  <div className="w-8 h-11 rounded-lg bg-bg-secondary overflow-hidden shrink-0 border border-border/30">
                    {item.poster_url ? (
                      <img src={item.poster_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted text-[8px] font-mono">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StatusBadge status={item.type === 'movie' ? 'active' : 'inactive'} />
                      <span className="text-[8px] font-mono text-text-muted">{new Date(item.added_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFeatured(item.id)}
                    className="px-1.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-all"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={() => { setFeatured([]); localStorage.removeItem(FEATURED_KEY); }}
                className="w-full mt-3 py-2 bg-red-950/10 border border-red-500/20 hover:bg-red-950/20 text-red-400 rounded-xl text-[9px] font-bold font-mono uppercase tracking-wider transition-all"
              >Clear All</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono mb-4">Content Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Featured Items', value: featured.length, color: 'text-purple-400' },
            { label: 'TMDB Movies', value: '1M+', color: 'text-blue-400' },
            { label: 'TMDB TV Shows', value: '500K+', color: 'text-teal-400' },
            { label: 'TMDB API Status', value: 'Operational', color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-bg-secondary/40 border border-border/50 rounded-xl p-4 text-center">
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-mono text-text-muted mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
