'use client';

import { useState, useEffect } from 'react';
import CollectionRail from './CollectionRail';
import type { PremiumCollectionItem } from '@/lib/ott-collections';

export default function LocalHistoryRails() {
  const [watchlist, setWatchlist] = useState<PremiumCollectionItem[]>([]);
  const [history, setHistory] = useState<PremiumCollectionItem[]>([]);
  const [recommendations, setRecommendations] = useState<PremiumCollectionItem[]>([]);

  const loadRecommendations = async (historyList: any[]) => {
    if (historyList.length === 0) { setRecommendations([]); return; }

    const genreCounts: Record<string, number> = {};
    historyList.forEach((item) => {
      if (item.genres && Array.isArray(item.genres)) {
        item.genres.forEach((g: string) => {
          genreCounts[g.trim().toLowerCase()] = (genreCounts[g.trim().toLowerCase()] || 0) + 1;
        });
      }
    });

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 3);

    if (topGenres.length === 0) { setRecommendations([]); return; }

    try {
      const res = await fetch(`/api/recommendations?genres=${encodeURIComponent(topGenres.join(','))}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.recommendations) {
          const historyIds = new Set(historyList.map((h) => `${h.type}-${h.id}`));
          setRecommendations(data.recommendations.filter((rec: any) => !historyIds.has(`${rec.type}-${rec.id}`)));
        }
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  };

  const loadLocalData = () => {
    try {
      const storedWatchlist = JSON.parse(localStorage.getItem('alonetv_watchlist') || '[]');
      const storedHistory = JSON.parse(localStorage.getItem('alonetv_continue_watching') || '[]');
      setWatchlist(storedWatchlist);
      setHistory(storedHistory);
      loadRecommendations(storedHistory);
    } catch (e) {
      console.error('Failed to load local history rails:', e);
    }
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('alonetv_continue_watching');
      setHistory([]);
      setRecommendations([]);
      window.dispatchEvent(new Event('alonetv_continue_watching_changed'));
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };

  useEffect(() => {
    loadLocalData();
    window.addEventListener('alonetv_watchlist_changed', loadLocalData);
    window.addEventListener('alonetv_language_changed', loadLocalData);
    window.addEventListener('alonetv_continue_watching_changed', loadLocalData);
    return () => {
      window.removeEventListener('alonetv_watchlist_changed', loadLocalData);
      window.removeEventListener('alonetv_language_changed', loadLocalData);
      window.removeEventListener('alonetv_continue_watching_changed', loadLocalData);
    };
  }, []);

  if (watchlist.length === 0 && history.length === 0 && recommendations.length === 0) return null;

  return (
    <>
      {history.length > 0 && (
        <CollectionRail
          isHistory
          extraHeaderAction={
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          }
          section={{
            id: 'local-continue-watching',
            title: 'Continue Watching',
            subtitle: 'Resume playback of your active movies and series',
            href: '#',
            type: 'mixed',
            items: history,
          }}
        />
      )}
      {watchlist.length > 0 && (
        <CollectionRail
          section={{
            id: 'local-watchlist',
            title: 'My Watchlist',
            subtitle: 'Your personal collection of bookmarked titles',
            href: '#',
            type: 'mixed',
            items: watchlist,
          }}
        />
      )}
      {recommendations.length > 0 && (
        <CollectionRail
          section={{
            id: 'personalized-recommendations',
            title: 'Recommended For You',
            subtitle: 'Based on your watch history',
            href: '#',
            type: 'mixed',
            items: recommendations,
          }}
        />
      )}
    </>
  );
}
