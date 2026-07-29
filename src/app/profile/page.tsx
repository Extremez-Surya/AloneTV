'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}

function getPosterUrl(item: any) {
  if (item.posterUrl) return item.posterUrl
  if (item.backdropUrl) return item.backdropUrl
  if (item.poster_path) return `https://image.tmdb.org/t/p/w200${item.poster_path}`
  if (item.backdrop_path) return `https://image.tmdb.org/t/p/w200${item.backdrop_path}`
  return null
}

function getTitle(item: any) {
  return item.title || item.name || item.original_title || 'Untitled'
}

function getMediaType(item: any) {
  return item.media_type || item.type || 'movie'
}

function getItemHref(item: any) {
  if (item.href) return item.href
  const t = getMediaType(item)
  const id = item.tmdbId || item.id
  return `/detail/${t}/${id}`
}

interface WatchlistItem {
  id: number
  tmdbId?: number
  title?: string
  name?: string
  original_title?: string
  poster_path?: string
  backdrop_path?: string
  media_type?: string
  type?: string
  addedAt?: string
}

interface ContinueWatchingItem extends WatchlistItem {
  progress?: number
  duration?: number
  updatedAt?: string
}

interface Playlist {
  id: string
  name: string
  items: WatchlistItem[]
  createdAt?: string
}

interface UserData {
  email: string
  name: string
  is_premium: boolean
  is_admin: boolean
}

function MotionNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0
        const step = Math.max(1, Math.floor(value / 30))
        const interval = setInterval(() => {
          start += step
          if (start >= value) {
            setDisplay(value)
            clearInterval(interval)
          } else {
            setDisplay(start)
          }
        }, 40)
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])
  return <span ref={ref}>{display.toLocaleString()}</span>
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData>({ email: '', name: 'Watcher', is_premium: false, is_admin: false });
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);

  const loadData = async () => {
    try {
      const synced = await syncUserProfile();
      if (synced) {
        setUser({
          email: synced.email || '',
          name: synced.username || 'Watcher',
          is_premium: Boolean(synced.is_premium) || Boolean(synced.is_admin),
          is_admin: Boolean(synced.is_admin),
        });
      } else {
        const storedUser = JSON.parse(localStorage.getItem('alonetv_user') || '{}');
        if (storedUser.email) {
          setUser({
            email: storedUser.email || '',
            name: storedUser.name || storedUser.username || 'Watcher',
            is_premium: Boolean(storedUser.is_premium) || Boolean(storedUser.is_admin),
            is_admin: Boolean(storedUser.is_admin),
          });
        }
      }
      setWatchlist(JSON.parse(localStorage.getItem('alonetv_watchlist') || '[]'));
      setContinueWatching(JSON.parse(localStorage.getItem('alonetv_continue_watching') || '[]'));
      setPlaylists(JSON.parse(localStorage.getItem('alonetv_playlists') || '[]'));
      setAvatarUrl(localStorage.getItem('alonetv_avatar'));
    } catch (e) {
      console.error('Failed to load profile data:', e);
    } finally {
      setIsLoading(false);
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
    } catch {}
    localStorage.removeItem('alonetv_user');
    window.dispatchEvent(new Event('alonetv_user_changed'));
    window.location.href = '/';
  };

  const removeFromContinueWatching = (id: number | string) => {
    const updated = continueWatching.filter(i => String(i.id) !== String(id) && String(i.tmdbId) !== String(id));
    localStorage.setItem('alonetv_continue_watching', JSON.stringify(updated));
    setContinueWatching(updated);
    window.dispatchEvent(new Event('alonetv_continue_watching_changed'));
  };

  const removeFromWatchlist = (id: number | string) => {
    const updated = watchlist.filter(i => String(i.id) !== String(id) && String(i.tmdbId) !== String(id));
    localStorage.setItem('alonetv_watchlist', JSON.stringify(updated));
    setWatchlist(updated);
    window.dispatchEvent(new Event('alonetv_watchlist_changed'));
  };

  const clearAllHistory = () => {
    localStorage.removeItem('alonetv_continue_watching');
    setContinueWatching([]);
    window.dispatchEvent(new Event('alonetv_continue_watching_changed'));
  };

  const clearAllWatchlist = () => {
    localStorage.removeItem('alonetv_watchlist');
    setWatchlist([]);
    window.dispatchEvent(new Event('alonetv_watchlist_changed'));
  };

  const createPlaylist = () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    const storedPlaylists = JSON.parse(localStorage.getItem('alonetv_playlists') || '[]');
    storedPlaylists.push({ id: crypto.randomUUID(), name, items: [], createdAt: new Date().toISOString() });
    localStorage.setItem('alonetv_playlists', JSON.stringify(storedPlaylists));
    setPlaylists(storedPlaylists);
    setNewPlaylistName('');
    setShowNewPlaylistInput(false);
    window.dispatchEvent(new Event('alonetv_playlists_changed'));
  };

  const deletePlaylist = (id: string) => {
    const updated = playlists.filter(p => p.id !== id);
    localStorage.setItem('alonetv_playlists', JSON.stringify(updated));
    setPlaylists(updated);
    if (selectedPlaylistId === id) setSelectedPlaylistId(null);
    window.dispatchEvent(new Event('alonetv_playlists_changed'));
  };

  const removeFromPlaylist = (playlistId: string, itemId: number) => {
    const storedPlaylists = JSON.parse(localStorage.getItem('alonetv_playlists') || '[]');
    const pl = storedPlaylists.find((p: Playlist) => p.id === playlistId);
    if (pl) {
      pl.items = pl.items.filter((i: WatchlistItem) => i.id !== itemId && i.tmdbId !== itemId);
      localStorage.setItem('alonetv_playlists', JSON.stringify(storedPlaylists));
      setPlaylists(storedPlaylists);
      window.dispatchEvent(new Event('alonetv_playlists_changed'));
    }
  };

  const selectAvatar = (url: string) => {
    localStorage.setItem('alonetv_avatar', url);
    setAvatarUrl(url);
    setIsAvatarModalOpen(false);
  };

  const resetAvatar = () => {
    localStorage.removeItem('alonetv_avatar');
    setAvatarUrl(null);
    setIsAvatarModalOpen(false);
  };

  const totalItems = watchlist.length + continueWatching.length + playlists.reduce((a, p) => a + p.items.length, 0);
  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* ===== PROFILE HERO ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-10"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
            {/* Avatar with glow */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-blue-500 p-[3px] shadow-xl shadow-purple-500/20">
                <button
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="w-full h-full rounded-full bg-black overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white text-xl font-bold tracking-wider">
                      {getInitials(user.name)}
                    </div>
                  )}
                </button>
              </div>
              <button
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-500 border-2 border-black flex items-center justify-center transition-colors shadow-lg"
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>

            {/* Name + badges */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{user.name}</h1>
                {user.is_premium && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-[10px] font-semibold text-amber-400 font-mono tracking-wider uppercase">
                    Premium
                  </span>
                )}
                {user.is_admin && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-semibold text-purple-400 font-mono tracking-wider uppercase">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500 font-mono">{user.email || 'No email'}</p>
            </div>

            {/* Settings trigger */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] text-zinc-400 hover:text-white text-xs font-mono transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </motion.div>

        {/* ===== STATS GRID ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
        >
          {[
            { label: 'Watchlist', value: watchlist.length, icon: 'bookmark' },
            { label: 'Continue', value: continueWatching.length, icon: 'play' },
            { label: 'Decks', value: playlists.length, icon: 'layers' },
            { label: 'Items', value: totalItems, icon: 'stack' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/[0.06] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{stat.label}</span>
                <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {stat.icon === 'bookmark' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />}
                  {stat.icon === 'play' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />}
                  {stat.icon === 'layers' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
                  {stat.icon === 'stack' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
                </svg>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                <MotionNumber value={stat.value} />
              </span>
            </div>
          ))}
        </motion.div>

        {/* ===== CONTENT SHELVES ===== */}
        <div className="space-y-8">
          {/* Continue Watching */}
          {continueWatching.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Continue Watching
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-600">{continueWatching.length} titles</span>
                  <button
                    onClick={clearAllHistory}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    Clear History
                  </button>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
                {continueWatching.map((item) => {
                  const poster = getPosterUrl(item)
                  const progress = item.progress && item.duration ? (item.progress / item.duration) * 100 : 0
                  return (
                    <div key={item.id || item.tmdbId} className="flex-shrink-0 w-[160px] sm:w-[180px] group">
                      <Link href={getItemHref(item)} className="block relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.06]">
                        {poster ? (
                          <img src={poster} alt={getTitle(item)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                          </div>
                        )}
                        {progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                            <div className="h-full bg-purple-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                      <div className="mt-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-300 truncate">{getTitle(item)}</p>
                          <p className="text-[9px] text-zinc-600 font-mono uppercase">{getMediaType(item)}</p>
                        </div>
                        <button
                          onClick={() => removeFromContinueWatching(item.id || item.tmdbId!)}
                          className="shrink-0 p-1 rounded hover:bg-white/5 text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.section>
          )}

          {/* Playlist Decks */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Cine-Decks
              </h2>
              <button
                onClick={() => setShowNewPlaylistInput(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-mono transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Deck
              </button>
            </div>

            {showNewPlaylistInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 flex gap-2"
              >
                <input
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                  placeholder="Deck name..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                  autoFocus
                />
                <button onClick={createPlaylist} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors">
                  Create
                </button>
                <button onClick={() => { setShowNewPlaylistInput(false); setNewPlaylistName('') }} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 text-xs transition-colors">
                  Cancel
                </button>
              </motion.div>
            )}

            {playlists.length === 0 ? (
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] border-dashed p-8 text-center">
                <svg className="w-8 h-8 mx-auto mb-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-sm text-zinc-600 font-mono">No Cine-Decks yet. Create one to start organizing.</p>
              </div>
            ) : selectedPlaylistId ? (
              /* Selected playlist detail view */
              <div>
                <button
                  onClick={() => setSelectedPlaylistId(null)}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-4 transition-colors font-mono"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Decks
                </button>
                {selectedPlaylist && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold text-white">{selectedPlaylist.name}</h3>
                        <p className="text-[10px] text-zinc-600 font-mono">{selectedPlaylist.items.length} items</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const data = btoa(JSON.stringify(selectedPlaylist.items.map(i => i.tmdbId || i.id)));
                            navigator.clipboard.writeText(`${window.location.origin}/playlist?data=${data}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 text-[10px] font-mono transition-colors"
                        >
                          Share
                        </button>
                        <button
                          onClick={() => deletePlaylist(selectedPlaylist.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {selectedPlaylist.items.length === 0 ? (
                      <p className="text-sm text-zinc-600 font-mono py-8 text-center">This deck is empty.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {selectedPlaylist.items.map((item) => {
                          const poster = getPosterUrl(item)
                          return (
                            <div key={item.id || item.tmdbId} className="group">
                              <Link href={getItemHref(item)} className="block relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 border border-white/[0.06]">
                                {poster ? (
                                  <img src={poster} alt={getTitle(item)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                    </svg>
                                  </div>
                                )}
                              </Link>
                              <div className="mt-1.5 flex items-start justify-between gap-1">
                                <p className="text-[10px] text-zinc-400 truncate flex-1">{getTitle(item)}</p>
                                <button
                                  onClick={() => removeFromPlaylist(selectedPlaylist.id, item.id || item.tmdbId!)}
                                  className="shrink-0 p-0.5 rounded text-zinc-600 hover:text-red-400"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Playlist cards grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {playlists.map((pl) => (
                  <motion.button
                    key={pl.id}
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    whileHover={{ scale: 1.02 }}
                    className="text-left relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:border-white/[0.12] transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-600 hover:text-red-400 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="text-sm font-medium text-white truncate">{pl.name}</h3>
                    <p className="text-[10px] text-zinc-600 font-mono mt-0.5">{pl.items.length} items</p>
                    {pl.items.length > 0 && (
                      <div className="flex -space-x-2 mt-3">
                        {pl.items.slice(0, 3).map((item, i) => {
                          const poster = getPosterUrl(item)
                          return (
                            <div key={i} className="w-7 h-10 rounded border border-zinc-800 overflow-hidden bg-zinc-900">
                              {poster && <img src={poster} alt="" className="w-full h-full object-cover" />}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.section>

          {/* Watchlist */}
          {watchlist.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Watchlist
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-600">{watchlist.length} titles</span>
                  <button
                    onClick={clearAllWatchlist}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    Clear Watchlist
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {watchlist.map((item) => {
                  const poster = getPosterUrl(item)
                  return (
                    <div key={item.id || item.tmdbId} className="group">
                      <Link href={getItemHref(item)} className="block relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 border border-white/[0.06]">
                        {poster ? (
                          <img src={poster} alt={getTitle(item)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                      <div className="mt-1.5 flex items-start justify-between gap-1">
                        <p className="text-[10px] text-zinc-400 truncate flex-1">{getTitle(item)}</p>
                        <button
                          onClick={() => removeFromWatchlist(item.id || item.tmdbId!)}
                          className="shrink-0 p-0.5 rounded text-zinc-600 hover:text-red-400"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.section>
          )}

          {/* Empty state */}
          {watchlist.length === 0 && continueWatching.length === 0 && playlists.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-zinc-400 mb-1">Your library is empty</h3>
              <p className="text-sm text-zinc-600 font-mono max-w-sm mx-auto">Start exploring movies and shows. Add them to your watchlist to see them here.</p>
              <Link
                href="/movies"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Discover Content
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* ===== AVATAR MODAL ===== */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsAvatarModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900/95 border border-white/[0.08] rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-sm font-semibold text-white mb-1">Choose Avatar</h3>
              <p className="text-[10px] text-zinc-500 font-mono mb-5">Pick a cinematic identity</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => selectAvatar(av.url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                      avatarUrl === av.url ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <span className="text-[8px] text-white font-mono">{av.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={resetAvatar} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 text-xs transition-colors">
                  Reset to Initials
                </button>
                <button onClick={() => setIsAvatarModalOpen(false)} className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors">
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SETTINGS DRAWER ===== */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-zinc-950/95 backdrop-blur-xl border-l border-white/[0.06] shadow-2xl"
            >
              <div className="flex flex-col h-full p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-sm font-semibold text-white">Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto">
                  {/* Profile card */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                              {getInitials(user.name)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {user.is_premium ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-mono">Premium Active</span>
                      ) : (
                        <button
                          onClick={() => { setShowSettings(false); setIsUpgradeModalOpen(true) }}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-medium transition-colors"
                        >
                          Upgrade to Premium
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Account actions */}
                  <div className="space-y-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 text-zinc-400 hover:text-red-400 text-xs transition-colors text-left"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>

                  {/* Premium info */}
                  {!user.is_premium && (
                    <div className="rounded-xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/10 p-4">
                      <h4 className="text-xs font-semibold text-white mb-2">Go Premium</h4>
                      <ul className="space-y-1.5 mb-3">
                        {['Ad-free streaming', '4K & HDR quality', 'Watch parties', 'Unlimited downloads'].map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-[10px] text-zinc-400">
                            <svg className="w-3 h-3 text-purple-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Danger zone */}
                  {user.is_admin && (
                    <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
                      <h4 className="text-xs font-semibold text-red-400 mb-2">Admin</h4>
                      <Link href="/admin" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono transition-colors">
                        Admin Panel
                      </Link>
                    </div>
                  )}
                </div>

                <p className="text-[9px] text-zinc-700 font-mono text-center pt-4 border-t border-white/[0.04] mt-4">
                  VinayTV v1.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
    </div>
  );
}
