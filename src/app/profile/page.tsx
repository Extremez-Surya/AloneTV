'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { syncUserProfile, updatePremiumStatus, updateAdminStatus } from '@/lib/supabase/profile';
import PremiumUpgradeModal from '@/components/video/PremiumUpgradeModal';

const AVATARS = [
  { id: 'anime', name: 'Anime Hero', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=60' },
  { id: 'spiderman', name: 'Web Slinger', url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=150&auto=format&fit=crop&q=60' },
  { id: 'batman', name: 'Dark Knight', url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=150&auto=format&fit=crop&q=60' },
  { id: 'cyberpunk', name: 'Cyberpunk', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=60' },
  { id: 'astronaut', name: 'Interstellar', url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=150&auto=format&fit=crop&q=60' },
  { id: 'vader', name: 'Lord Vader', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=150&auto=format&fit=crop&q=60' }
];

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'history' | 'playlists' | 'settings'>('watchlist');
  const [user, setUser] = useState({ email: 'vinay@example.com', name: 'Vinay Kumar', is_premium: false, is_admin: false });
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const loadData = async () => {
    try {
      // 1. Sync Supabase user details if available
      const synced = await syncUserProfile();
      if (synced) {
        setUser({
          email: synced.email || 'user@example.com',
          name: synced.username || 'Watcher',
          is_premium: Boolean(synced.is_premium) || Boolean(synced.is_admin),
          is_admin: Boolean(synced.is_admin)
        });
      } else {
        const storedUser = JSON.parse(localStorage.getItem('alonetv_user') || 'null');
        if (storedUser) {
          setUser({
            email: storedUser.email || 'demo@example.com',
            name: storedUser.name || storedUser.username || 'Demo Watcher',
            is_premium: Boolean(storedUser.is_premium) || Boolean(storedUser.is_admin),
            is_admin: Boolean(storedUser.is_admin)
          });
        }
      }
      
      const storedWatchlist = JSON.parse(localStorage.getItem('alonetv_watchlist') || '[]');
      setWatchlist(storedWatchlist);
      
      const storedHistory = JSON.parse(localStorage.getItem('alonetv_continue_watching') || '[]');
      setContinueWatching(storedHistory);

      const storedPlaylists = JSON.parse(localStorage.getItem('alonetv_playlists') || '[]');
      setPlaylists(storedPlaylists);

      const storedAvatar = localStorage.getItem('alonetv_avatar');
      setAvatarUrl(storedAvatar);
    } catch (e) {
      console.error('Failed to load profile database state:', e);
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    loadData();

    window.addEventListener('alonetv_continue_watching_changed', loadData);
    window.addEventListener('alonetv_watchlist_changed', loadData);
    window.addEventListener('alonetv_playlists_changed', loadData);

    return () => {
      window.removeEventListener('alonetv_continue_watching_changed', loadData);
      window.removeEventListener('alonetv_watchlist_changed', loadData);
      window.removeEventListener('alonetv_playlists_changed', loadData);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase sign out error:', err);
    }
    localStorage.removeItem('alonetv_user');
    window.dispatchEvent(new Event('alonetv_user_changed'));
    window.location.href = '/';
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('alonetv_continue_watching');
      setContinueWatching([]);
      window.dispatchEvent(new Event('alonetv_continue_watching_changed'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFromHistory = (id: string, type: string) => {
    try {
      const updated = continueWatching.filter((item) => !(item.id === id && item.type === type));
      localStorage.setItem('alonetv_continue_watching', JSON.stringify(updated));
      setContinueWatching(updated);
      window.dispatchEvent(new Event('alonetv_continue_watching_changed'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromWatchlist = (id: string, type: string) => {
    try {
      const updated = watchlist.filter((item) => !(item.id === id && item.type === type));
      localStorage.setItem('alonetv_watchlist', JSON.stringify(updated));
      setWatchlist(updated);
      window.dispatchEvent(new Event('alonetv_watchlist_changed'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const storedPlaylists = JSON.parse(localStorage.getItem('alonetv_playlists') || '[]');
      const newPlaylist = {
        id: 'playlist-' + Date.now(),
        name: newPlaylistName.trim(),
        items: []
      };
      storedPlaylists.push(newPlaylist);
      localStorage.setItem('alonetv_playlists', JSON.stringify(storedPlaylists));
      setPlaylists(storedPlaylists);
      setNewPlaylistName('');
      window.dispatchEvent(new Event('alonetv_playlists_changed'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    try {
      const storedPlaylists = JSON.parse(localStorage.getItem('alonetv_playlists') || '[]');
      const updated = storedPlaylists.filter((p: any) => p.id !== playlistId);
      localStorage.setItem('alonetv_playlists', JSON.stringify(updated));
      setPlaylists(updated);
      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(null);
      }
      window.dispatchEvent(new Event('alonetv_playlists_changed'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromPlaylist = (playlistId: string, itemId: string, itemType: string) => {
    try {
      const storedPlaylists = JSON.parse(localStorage.getItem('alonetv_playlists') || '[]');
      const playlist = storedPlaylists.find((p: any) => p.id === playlistId);
      if (playlist) {
        playlist.items = playlist.items.filter((i: any) => !(i.id === itemId && i.type === itemType));
        localStorage.setItem('alonetv_playlists', JSON.stringify(storedPlaylists));
        setPlaylists(storedPlaylists);
        window.dispatchEvent(new Event('alonetv_playlists_changed'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSharePlaylist = (playlist: any) => {
    try {
      const dataObj = {
        name: playlist.name,
        items: playlist.items.map((i: any) => ({
          id: i.id,
          type: i.type,
          title: i.title,
          posterUrl: i.posterUrl,
          year: i.year,
          rating: i.rating,
          quality: i.quality || 'HD',
          genres: i.genres || []
        }))
      };
      // Encode Unicode correctly in base64
      const base64 = btoa(encodeURIComponent(JSON.stringify(dataObj)));
      const shareUrl = `${window.location.origin}/playlist?import=${base64}`;
      navigator.clipboard.writeText(shareUrl);
      alert(`Shareable playlist URL copied to clipboard!`);
    } catch (err) {
      console.error(err);
    }
  };

  const selectAvatar = (url: string) => {
    try {
      localStorage.setItem('alonetv_avatar', url);
      setAvatarUrl(url);
      window.dispatchEvent(new Event('alonetv_avatar_changed'));
      setIsAvatarModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const removeAvatar = () => {
    try {
      localStorage.removeItem('alonetv_avatar');
      setAvatarUrl(null);
      window.dispatchEvent(new Event('alonetv_avatar_changed'));
      setIsAvatarModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Compute watch statistics
  const genreCounts: Record<string, number> = {};
  let totalGenreRecords = 0;
  continueWatching.forEach((item) => {
    if (item.genres && Array.isArray(item.genres)) {
      item.genres.forEach((g: string) => {
        const cleanG = g.trim();
        genreCounts[cleanG] = (genreCounts[cleanG] || 0) + 1;
        totalGenreRecords++;
      });
    }
  });

  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // top 3

  const COLORS = ['#9333ea', '#0d9488', '#eab308'];
  const slices = sortedGenres.map(([genre, count], index) => {
    const percent = totalGenreRecords > 0 ? (count / totalGenreRecords) * 100 : 33.3;
    return {
      genre,
      percent,
      color: COLORS[index] || '#6b7280'
    };
  });

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'V';

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div className="min-h-screen bg-bg-primary pb-12 pt-[72px] text-left">
      {/* Profile Header */}
      <div className="bg-bg-card border-b border-border py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div 
              onClick={() => setIsAvatarModalOpen(true)}
              className="w-20 h-20 rounded-full overflow-hidden bg-text-primary text-bg-card flex items-center justify-center text-3xl font-semibold shadow-level-2 cursor-pointer group relative border-2 border-border hover:border-accent-purple transition-all shrink-0"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
              ) : (
                initial
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-bold tracking-[-1.28px] text-text-primary">
                  {user.name}
                </h1>
                {user.is_premium ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-yellow-500/25 border border-yellow-400/30 animate-pulse font-mono font-bold">
                    👑 Premium
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-gray-400 border border-white/5 font-mono">
                    Free Plan
                  </span>
                )}
                {user.is_admin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-bold">
                    🛡️ Admin
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-text-muted font-mono">{user.email}</p>
              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent-purple px-2 py-0.5 bg-accent-purple/5 border border-accent-purple/15 rounded-md">
                  {watchlist.length} in watchlist
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent-teal px-2 py-0.5 bg-accent-teal/5 border border-accent-teal/15 rounded-md">
                  {playlists.length} Cine-Decks
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-bg-card">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex gap-6">
            {(['watchlist', 'history', 'playlists', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-xs font-semibold uppercase tracking-wider font-mono transition-colors relative ${
                  activeTab === tab ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab === 'playlists' ? 'Cine-Decks' : tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="profileActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'watchlist' && (
              <div className="space-y-12">
                {/* Continue Watching Section */}
                {continueWatching.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4 gap-4">
                      <h2 className="text-lg font-semibold tracking-[-0.6px] text-text-primary">Continue Watching.</h2>
                      <button
                        onClick={handleClearHistory}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-500 shadow-level-1 hover:bg-red-500/20 transition-all font-mono uppercase tracking-wider"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear All
                      </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {continueWatching.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="flex-shrink-0 w-[200px] group relative">
                          <Link href={item.href || `/watch/${item.type}/${item.id}`}>
                            <div className="relative aspect-video rounded-xl overflow-hidden mb-2.5 bg-bg-secondary border border-border shadow-level-2 group-hover:shadow-level-3">
                              {item.posterUrl ? (
                                <img
                                  src={item.posterUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-bg-secondary" />
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-level-3">
                                  <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <h3 className="text-xs sm:text-sm font-semibold text-text-primary truncate group-hover:text-accent-purple transition-colors text-left">
                              {item.title}
                            </h3>
                            <p className="text-[10px] text-text-muted mt-0.5 font-mono capitalize text-left">
                              {item.genreLabel} {item.season && `• S${item.season} EP${item.episode}`}
                            </p>
                          </Link>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveFromHistory(item.id, item.type);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/60 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-level-2 z-10"
                            aria-label="Remove from history"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* My Watchlist Section */}
                <section>
                  <h2 className="text-lg font-semibold tracking-[-0.6px] text-text-primary mb-4">My Watchlist.</h2>
                  {watchlist.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {watchlist.map((item, index) => (
                        <motion.div
                          key={`${item.type}-${item.id}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: index * 0.03 }}
                          className="group relative"
                        >
                          <Link href={item.href || `/watch/${item.type}/${item.id}`}>
                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2.5 bg-bg-secondary border border-border shadow-level-2 group-hover:shadow-level-3">
                              {item.posterUrl ? (
                                <img
                                  src={item.posterUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-bg-secondary" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="w-full py-2 bg-white text-black text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-level-2">
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                  Play Now
                                </span>
                              </div>
                            </div>
                            <h3 className="text-xs sm:text-sm font-semibold text-text-primary truncate group-hover:text-accent-purple transition-colors text-left">
                              {item.title}
                            </h3>
                            <p className="text-[10px] text-text-muted mt-0.5 font-mono text-left">{item.year} • {item.genreLabel}</p>
                          </Link>

                          <button
                            onClick={() => handleRemoveFromWatchlist(item.id, item.type)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/60 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-level-2"
                            aria-label="Remove from watchlist"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-text-muted border border-dashed border-border rounded-2xl bg-bg-card">
                      <svg className="w-12 h-12 mx-auto mb-3 text-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <p className="text-sm font-medium">Your watchlist is empty</p>
                      <p className="text-xs mt-1">Bookmark movies or series to see them here</p>
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-12">
                <section>
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <h2 className="text-lg font-semibold tracking-[-0.6px] text-text-primary">Watch History.</h2>
                    {continueWatching.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-500 shadow-level-1 hover:bg-red-500/20 transition-all font-mono uppercase tracking-wider"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear All
                      </button>
                    )}
                  </div>

                  {continueWatching.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {continueWatching.map((item, index) => (
                        <motion.div
                          key={`${item.type}-${item.id}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: index * 0.03 }}
                          className="group relative"
                        >
                          <Link href={item.href || `/watch/${item.type}/${item.id}`}>
                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2.5 bg-bg-secondary border border-border shadow-level-2 group-hover:shadow-level-3">
                              {item.posterUrl ? (
                                <img
                                  src={item.posterUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-bg-secondary" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="w-full py-2 bg-white text-black text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-level-2">
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                  Play Now
                                </span>
                              </div>
                            </div>
                            <h3 className="text-xs sm:text-sm font-semibold text-text-primary truncate group-hover:text-accent-purple transition-colors text-left">
                              {item.title}
                            </h3>
                            <p className="text-[10px] text-text-muted mt-0.5 font-mono capitalize text-left">
                              {item.genreLabel} {item.season && `• S${item.season} EP${item.episode}`}
                            </p>
                          </Link>

                          <button
                            onClick={() => handleRemoveFromHistory(item.id, item.type)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/60 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-level-2"
                            aria-label="Remove from history"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-text-muted border border-dashed border-border rounded-2xl bg-bg-card">
                      <svg className="w-12 h-12 mx-auto mb-3 text-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">No watch history records</p>
                      <p className="text-xs mt-1">Watch streams to track your history here</p>
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'playlists' && (
              <div className="space-y-8">
                {/* Playlist creation form */}
                <form onSubmit={handleCreatePlaylist} className="flex gap-2 bg-bg-card border border-border p-4 rounded-xl shadow-level-1">
                  <input
                    type="text"
                    placeholder="Create a new Cine-Deck playlist..."
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="flex-1 px-3.5 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-accent-purple text-white text-xs font-semibold rounded-lg hover:bg-accent-purple/90 transition-colors uppercase font-mono tracking-wider"
                  >
                    Create
                  </button>
                </form>

                {/* Main list */}
                {selectedPlaylistId && selectedPlaylist ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPlaylistId(null)}
                          className="p-1 hover:bg-white/5 rounded-md text-text-muted hover:text-white"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <h2 className="text-lg font-bold text-text-primary">{selectedPlaylist.name}</h2>
                        <span className="font-mono text-xs text-text-muted">({selectedPlaylist.items.length} titles)</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSharePlaylist(selectedPlaylist)}
                          className="px-3 py-1 bg-accent-teal/20 text-accent-teal hover:bg-accent-teal/30 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 font-mono uppercase tracking-wider"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l5.028-2.514m-5.028 3.514l5.028 2.514M17 12a3 3 0 11-6 0 3 3 0 016 0zm-7-5a3 3 0 11-6 0 3 3 0 016 0zm-7 10a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Share
                        </button>
                        <button
                          onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                          className="px-3 py-1 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 font-mono uppercase tracking-wider"
                        >
                          Delete Cine-Deck
                        </button>
                      </div>
                    </div>

                    {selectedPlaylist.items.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {selectedPlaylist.items.map((item: any, idx: number) => (
                          <div key={`${item.type}-${item.id}`} className="group relative">
                            <Link href={item.href || `/watch/${item.type}/${item.id}`}>
                              <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2.5 bg-bg-secondary border border-border shadow-level-2 group-hover:shadow-level-3">
                                {item.posterUrl ? (
                                  <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                  <div className="w-full h-full bg-bg-secondary" />
                                )}
                              </div>
                              <h3 className="text-xs sm:text-sm font-semibold text-text-primary truncate group-hover:text-accent-purple transition-colors text-left">{item.title}</h3>
                              <p className="text-[10px] text-text-muted mt-0.5 font-mono text-left">{item.year} • {item.type === 'tv' ? 'TV' : item.type === 'anime' ? 'Anime' : 'Movie'}</p>
                            </Link>
                            <button
                              onClick={() => handleRemoveFromPlaylist(selectedPlaylist.id, item.id, item.type)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/60 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-level-2"
                              aria-label="Remove from playlist"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-text-muted border border-dashed border-border rounded-2xl bg-bg-card">
                        <p className="text-sm font-medium">This Cine-Deck is empty</p>
                        <p className="text-xs mt-1">Browse movies and click the "+" icon to add them here</p>
                      </div>
                    )}
                  </div>
                ) : playlists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        className="bg-bg-card border border-border p-4 rounded-xl shadow-level-1 hover:border-accent-purple/35 transition-all flex flex-col justify-between h-32"
                      >
                        <div 
                          onClick={() => setSelectedPlaylistId(pl.id)}
                          className="cursor-pointer space-y-1.5 flex-1"
                        >
                          <h3 className="font-semibold text-text-primary hover:text-accent-purple transition-colors text-sm sm:text-base">{pl.name}</h3>
                          <p className="text-xs text-text-muted font-mono">{pl.items.length} titles inside</p>
                        </div>
                        <div className="flex gap-2 justify-end pt-2 border-t border-border/20">
                          <button
                            onClick={() => handleSharePlaylist(pl)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-accent-teal/15 text-text-muted hover:text-accent-teal text-[10px] font-bold rounded font-mono uppercase tracking-wider transition-colors"
                          >
                            Share
                          </button>
                          <button
                            onClick={() => handleDeletePlaylist(pl.id)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-red-900/20 text-text-muted hover:text-red-500 text-[10px] font-bold rounded font-mono uppercase tracking-wider transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-text-muted border border-dashed border-border rounded-2xl bg-bg-card">
                    <svg className="w-12 h-12 mx-auto mb-3 text-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-sm font-medium">You haven't created any playlists yet</p>
                    <p className="text-xs mt-1">Create playlists above or add movies via cards directly</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 text-left">
                {/* Profile details */}
                <div className="max-w-lg bg-bg-card rounded-2xl p-6 border border-border shadow-level-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4 font-mono">Profile Settings</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 font-mono">Display Name</label>
                      <input
                        type="text"
                        defaultValue={user.name}
                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 font-mono">Email address</label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        disabled
                        className="w-full px-3.5 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-muted cursor-not-allowed"
                      />
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="w-full py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md shadow-red-600/10"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Admin Mode Controls (Testing & RLS) */}
                {(user.email === 'theextremez2.0@gmail.com' || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('alonetv_user') || '{}').demo === true)) && (
                  <div className="max-w-lg bg-bg-card border border-border p-6 rounded-2xl shadow-level-2 text-left space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Admin Authorization Panel</h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Toggle your admin privileges to view or restrict dashboard access.
                    </p>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-400">🛡️</span>
                        <span className="text-xs font-semibold text-white font-mono">Admin Status</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = await updateAdminStatus(!user.is_admin);
                          if (updated) {
                            setUser(prev => ({ ...prev, is_admin: Boolean(updated.is_admin) }));
                            window.dispatchEvent(new Event('alonetv_user_changed'));
                          }
                        }}
                        className={`px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          user.is_admin
                            ? 'bg-purple-500/10 border-purple-500/35 text-purple-400 font-bold'
                            : 'bg-white/5 border-white/10 text-gray-500'
                        }`}
                      >
                        {user.is_admin ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>

                    {user.is_admin && (
                      <div className="pt-3.5 border-t border-white/5">
                        <Link
                          href="/admin"
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider block text-center shadow-lg shadow-purple-500/20 transition-colors"
                        >
                          👑 Open Admin Control Center
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Premium Membership details */}
                <div className="max-w-lg bg-gradient-to-br from-[#130d2b] to-[#0a0715] rounded-2xl p-6 border border-purple-500/20 shadow-level-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 font-mono">AloneTV Membership</h3>
                    {user.is_premium ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/35">
                        👑 ACTIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10">
                        INACTIVE
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {user.is_premium ? 'Premium Access Active' : 'Unlock AloneTV Premium'}
                      </h4>
                      <p className="text-xs text-text-muted leading-relaxed mt-1">
                        Unlock high quality streaming, watch party synchronization, custom playlists, zero advertisements, and multi-language dubs.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-2 border-y border-white/5">
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="text-purple-500 font-bold">✓</span>
                        <span>4K & HD Playback</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="text-purple-500 font-bold">✓</span>
                        <span>No Ads</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="text-purple-500 font-bold">✓</span>
                        <span>Watch Parties</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="text-purple-500 font-bold">✓</span>
                        <span>Multi-language Dubs</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      {user.is_premium ? (
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = await updatePremiumStatus(false);
                            if (updated) {
                              setUser(prev => ({ ...prev, is_premium: false }));
                            }
                          }}
                          className="w-full py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-950/45 hover:text-white transition-colors"
                        >
                          Downgrade to Free Plan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => router.push('/payment')}
                          className="w-full py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider bg-gradient-to-r from-amber-500 via-purple-600 to-accent-purple hover:opacity-95 text-white shadow-lg shadow-purple-500/30 transition-all border border-purple-500/40"
                        >
                          Upgrade to Premium
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analytics Sidebar */}
          {(activeTab === 'watchlist' || activeTab === 'history' || activeTab === 'playlists') && (
            <div className="lg:w-[320px] shrink-0">
              <div className="bg-bg-card border border-border p-5 rounded-2xl shadow-level-2 space-y-6 text-left">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4 font-mono">Watch Analytics</h3>
                  
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-24 h-24 rounded-full relative flex items-center justify-center shadow-lg border border-white/10 shrink-0"
                      style={{
                        background: slices.length > 0 
                          ? `conic-gradient(${slices.map((s, i) => `${s.color} 0% ${slices.slice(0, i+1).reduce((acc, curr) => acc + curr.percent, 0)}%`).join(', ') || '#4b5563 0% 100%'})`
                          : '#374151'
                      }}
                    >
                      <div className="w-18 h-18 rounded-full bg-bg-card flex flex-col items-center justify-center border border-white/5">
                        <span className="text-lg font-bold text-text-primary">{continueWatching.length}</span>
                        <span className="text-[9px] uppercase font-mono text-text-muted">Titles</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <p className="text-xs text-text-muted leading-snug">
                        Total watch sessions: <span className="text-text-primary font-semibold font-mono">{continueWatching.length}</span>
                      </p>
                      <p className="text-xs text-text-muted leading-snug">
                        Estimated watch time: <span className="text-accent-teal font-semibold font-mono">{continueWatching.length * 45} mins</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">Top Genres</h4>
                  {sortedGenres.length > 0 ? (
                    <div className="space-y-2">
                      {slices.map((slice) => (
                        <div key={slice.genre} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                            <span className="text-text-primary font-medium">{slice.genre}</span>
                          </div>
                          <span className="text-text-muted font-mono">{slice.percent.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted italic">No genre data available yet. Start watching streams to populate stats.</p>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
                  <span>Watchlist Queue:</span>
                  <span className="font-mono text-accent-purple font-semibold">{watchlist.length} items</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Avatar Selection Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-bg-card border border-border p-6 rounded-2xl shadow-level-4 text-left"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-text-primary">Choose Profile Avatar</h2>
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => selectAvatar(av.url)}
                  className="group relative flex flex-col items-center gap-1.5 focus:outline-none"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-transparent group-hover:border-accent-purple transition-all shadow-md">
                    <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary">{av.name}</span>
                </button>
              ))}
            </div>

            {avatarUrl && (
              <button
                onClick={removeAvatar}
                className="w-full py-2 bg-white/5 border border-white/10 hover:bg-red-900/20 hover:border-red-500/30 text-red-500 text-xs font-semibold rounded-xl transition-colors font-mono"
              >
                Reset to Initials
              </button>
            )}
          </motion.div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}