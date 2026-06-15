'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ContentCard from '@/components/content/ContentCard';

export default function PlaylistPage() {
  return (
    <Suspense fallback={<PlaylistLoading />}>
      <PlaylistContent />
    </Suspense>
  );
}

function PlaylistLoading() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center pt-16">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider font-mono">Loading Playlist...</p>
      </div>
    </div>
  );
}

function PlaylistContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const importStr = searchParams.get('import');
  
  const [playlist, setPlaylist] = useState<{ name: string; items: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!importStr) {
      setError('No import data provided in the link.');
      return;
    }

    try {
      // Decode unicode encoded base64
      const jsonStr = decodeURIComponent(atob(importStr));
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed.name === 'string' && Array.isArray(parsed.items)) {
        setPlaylist(parsed);
      } else {
        setError('Invalid playlist format.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse playlist link. The URL may have been corrupted.');
    }
  }, [importStr]);

  const handleSavePlaylist = () => {
    if (!playlist) return;

    try {
      const storedPlaylists = JSON.parse(localStorage.getItem('alonetv_playlists') || '[]');
      // Check for duplicate name to avoid confusing overlays
      let name = playlist.name;
      let count = 1;
      while (storedPlaylists.some((p: any) => p.name === name)) {
        name = `${playlist.name} (${count++})`;
      }

      const newPlaylist = {
        id: 'playlist-' + Date.now(),
        name,
        items: playlist.items
      };

      storedPlaylists.push(newPlaylist);
      localStorage.setItem('alonetv_playlists', JSON.stringify(storedPlaylists));
      window.dispatchEvent(new Event('alonetv_playlists_changed'));
      
      alert(`Successfully saved Cine-Deck "${name}" to your profile! Redirecting to profile...`);
      router.push('/profile');
    } catch (err) {
      console.error(err);
      alert('Failed to save playlist to your profile.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-12 pt-[72px] text-left">
      {/* Header Banner */}
      <div className="bg-bg-card border-b border-border py-8 mb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-purple">Shared Cine-Deck</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-[-1.28px] text-text-primary">
              {playlist ? playlist.name : 'Import Playlist'}
            </h1>
            {playlist && (
              <p className="text-xs text-text-muted font-mono">{playlist.items.length} titles curated by another movie fan</p>
            )}
          </div>
          
          {playlist && (
            <button
              onClick={handleSavePlaylist}
              className="px-5 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-accent-purple/20 transition-all font-mono uppercase tracking-wider flex items-center gap-1.5 shrink-0 self-start md:self-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Save to My Cine-Decks
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {error ? (
          <div className="py-16 text-center text-text-muted border border-dashed border-border rounded-2xl bg-bg-card max-w-xl mx-auto px-6">
            <svg className="w-12 h-12 mx-auto mb-4 text-red-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-semibold text-text-primary">Failed to Import Playlist</p>
            <p className="text-xs mt-1 leading-relaxed">{error}</p>
            <Link
              href="/"
              className="inline-block mt-6 px-4 py-2 bg-white/5 border border-border hover:bg-white/10 text-white text-xs font-semibold rounded-lg font-mono uppercase tracking-wider transition-colors"
            >
              Back to Home
            </Link>
          </div>
        ) : playlist ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlist.items.map((item, idx) => (
              <ContentCard
                key={`${item.type}-${item.id}-${idx}`}
                item={item}
                type={item.type !== 'anime' ? item.type : 'anime'}
                index={idx}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
