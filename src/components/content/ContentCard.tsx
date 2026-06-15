'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getTMDBImageUrl } from '@/lib/api/tmdb';
import type { PremiumCollectionItem } from '@/lib/ott-collections';
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb';

type CardItem = TMDBMovie | TMDBTVShow | PremiumCollectionItem;

interface ContentCardProps {
  item: CardItem;
  type?: 'movie' | 'tv' | 'anime';
  index?: number;
  showRemoveFromHistory?: boolean;
  ranking?: number;
}

function isPremiumItem(item: CardItem): item is PremiumCollectionItem {
  return 'posterUrl' in item && 'href' in item;
}

function getTitle(item: CardItem) {
  if (isPremiumItem(item)) {
    return item.title;
  }
  return 'title' in item ? item.title : item.name;
}

function getYear(item: CardItem) {
  if (isPremiumItem(item)) {
    return item.year;
  }
  return 'release_date' in item
    ? item.release_date?.split('-')[0]
    : item.first_air_date?.split('-')[0];
}

function getPosterUrl(item: CardItem, type: 'movie' | 'tv' | 'anime', isLandscape = false) {
  if (isPremiumItem(item)) {
    if (isLandscape && 'backdropUrl' in item && item.backdropUrl) {
      return item.backdropUrl;
    }
    return item.posterUrl;
  }
  const posterPath = item.poster_path;
  return getTMDBImageUrl(posterPath, 'w342');
}

function getHref(item: CardItem, type: 'movie' | 'tv' | 'anime') {
  if (isPremiumItem(item)) {
    return item.href;
  }
  return `/watch/${type}/${item.id}`;
}

function getRating(item: CardItem) {
  if (isPremiumItem(item)) {
    return item.rating;
  }
  return 'vote_average' in item ? item.vote_average : 0;
}

function getQuality(item: CardItem) {
  if (isPremiumItem(item)) {
    return item.quality;
  }
  return getRating(item) >= 7.6 ? '4K' : 'HD';
}

function getGenres(item: CardItem) {
  if (isPremiumItem(item)) {
    return item.genres;
  }
  const source = 'genre_ids' in item ? item.genre_ids : [];
  return source.length > 0 ? [`Featured`] : ['Featured'];
}

function getLanguageCode(item: CardItem, type: 'movie' | 'tv' | 'anime'): string {
  if (type === 'anime') return 'ja';
  
  const code = ('original_language' in item ? item.original_language : null) || 'en';
  return code.toLowerCase();
}

const LANG_MAP: Record<string, string> = {
  en: 'ENG',
  hi: 'HIN',
  ta: 'TAM',
  te: 'TEL',
  kn: 'KAN',
  ml: 'MAL',
  ja: 'JPN',
  ko: 'KOR',
  es: 'ESP',
  fr: 'FRA',
  de: 'DEU',
  zh: 'ZHO',
  it: 'ITA',
  ru: 'RUS',
};

export default function ContentCard({ item, type = 'movie', index = 0, showRemoveFromHistory = false, ranking }: ContentCardProps) {
  const title = getTitle(item);
  const year = getYear(item);
  const rating = getRating(item);
  const quality = getQuality(item);
  const posterUrl = getPosterUrl(item, type, showRemoveFromHistory);
  const href = getHref(item, type);
  const genres = getGenres(item);
  const originalLangCode = getLanguageCode(item, type);
  const originalLangName = LANG_MAP[originalLangCode] || originalLangCode.toUpperCase();

  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);

  // Load watchlist state client-side
  useEffect(() => {
    try {
      const watchlist = JSON.parse(localStorage.getItem('alonetv_watchlist') || '[]');
      setIsInWatchlist(watchlist.some((w: any) => w.id === item.id && w.type === type));
    } catch {
      // ignore
    }
  }, [item.id, type]);

  // Sync playlist entries
  useEffect(() => {
    if (showPlaylistDropdown) {
      try {
        const storedPlaylists = JSON.parse(localStorage.getItem('alonetv_playlists') || '[]');
        setPlaylists(storedPlaylists);
      } catch {
        // ignore
      }
    }
  }, [showPlaylistDropdown]);

  const addToPlaylist = (playlistId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const storedPlaylists = JSON.parse(localStorage.getItem('alonetv_playlists') || '[]');
      const playlist = storedPlaylists.find((p: any) => p.id === playlistId);
      if (playlist) {
        const exists = playlist.items.some((i: any) => i.id === item.id && i.type === type);
        if (!exists) {
          const newItem = {
            id: item.id,
            type,
            title: title || '',
            posterUrl: posterUrl || '',
            year: year || '',
            rating: rating || 0,
            quality: quality || 'HD',
            genres: genres || [],
            href: href || `/watch/${type}/${item.id}`
          };
          playlist.items.push(newItem);
          localStorage.setItem('alonetv_playlists', JSON.stringify(storedPlaylists));
          alert(`Added to playlist "${playlist.name}"!`);
        } else {
          alert('This item is already in that playlist.');
        }
      }
      setShowPlaylistDropdown(false);
    } catch (err) {
      console.error('Failed to add to playlist:', err);
    }
  };

  const createAndAddToPlaylist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const name = prompt('Enter Cine-Deck name:');
    if (!name) return;

    try {
      const storedPlaylists = JSON.parse(localStorage.getItem('alonetv_playlists') || '[]');
      const newPlaylistId = 'playlist-' + Date.now();
      const newItem = {
        id: item.id,
        type,
        title: title || '',
        posterUrl: posterUrl || '',
        year: year || '',
        rating: rating || 0,
        quality: quality || 'HD',
        genres: genres || [],
        href: href || `/watch/${type}/${item.id}`
      };
      const newPlaylist = {
        id: newPlaylistId,
        name,
        items: [newItem]
      };
      storedPlaylists.push(newPlaylist);
      localStorage.setItem('alonetv_playlists', JSON.stringify(storedPlaylists));
      setPlaylists(storedPlaylists);
      alert(`Created playlist "${name}" and added title!`);
      setShowPlaylistDropdown(false);
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const openTrailer = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPremiumItem(item)) return;
    
    setLoadingTrailer(true);
    try {
      const res = await fetch(`/api/trailer?id=${item.id}&type=${type}`);
      const data = await res.json();
      if (data.success && data.trailer?.key) {
        setTrailerKey(data.trailer.key);
        setIsTrailerOpen(true);
      } else {
        alert('Trailer not found for this content.');
      }
    } catch (err) {
      console.error('Failed to load trailer:', err);
    } finally {
      setLoadingTrailer(false);
    }
  };

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const watchlist = JSON.parse(localStorage.getItem('alonetv_watchlist') || '[]');
      let updated = [];
      if (isInWatchlist) {
        updated = watchlist.filter((w: any) => !(w.id === item.id && w.type === type));
      } else {
        const newItem = {
          id: item.id,
          type,
          title: title || '',
          posterUrl: posterUrl || '',
          year: year || '',
          rating: rating || 0,
          quality: quality || 'HD',
          genres: genres || [],
          genreLabel: type === 'anime' ? 'Anime' : type === 'tv' ? 'TV Show' : 'Movie',
          href: href || `/watch/${type}/${item.id}`,
          original_language: originalLangCode
        };
        updated = [...watchlist, newItem];
      }
      localStorage.setItem('alonetv_watchlist', JSON.stringify(updated));
      setIsInWatchlist(!isInWatchlist);
      window.dispatchEvent(new Event('alonetv_watchlist_changed'));
    } catch (err) {
      console.error('Failed to update watchlist:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className={`group shrink-0 relative ${
        ranking !== undefined
          ? 'w-[215px] sm:w-[230px] md:w-[250px] pl-12 sm:pl-14'
          : showRemoveFromHistory
            ? 'w-[240px] sm:w-[280px] md:w-[320px]'
            : 'w-[165px] sm:w-[180px] md:w-[200px]'
      }`}
    >
      {ranking !== undefined && (
        <span className="absolute left-[-5px] bottom-[-8px] text-[160px] font-black leading-none select-none pointer-events-none text-outline z-0 font-sans tracking-tighter">
          {ranking}
        </span>
      )}

      <Link href={href} className="block relative z-10">
        {/* Card Poster Area */}
        <div className={`relative rounded-xl overflow-hidden mb-2.5 bg-bg-secondary border border-border shadow-level-2 transition-shadow group-hover:shadow-level-3 ${
          showRemoveFromHistory ? 'aspect-video' : 'aspect-[2/3]'
        }`}>
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title || 'Poster'}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes={showRemoveFromHistory ? "(max-width: 640px) 240px, (max-width: 768px) 280px, 320px" : "(max-width: 640px) 164px, (max-width: 768px) 180px, 200px"}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col justify-between p-3.5 bg-gradient-to-br from-[#1b1b22] via-[#0d0d11] to-[#050508] border border-white/5">
              <div className="flex justify-between items-center opacity-40">
                <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">{type}</span>
                <span className="text-[9px] font-mono text-text-muted">{year}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center my-auto">
                <svg className="w-8 h-8 text-accent-purple/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <span className="text-[10px] font-semibold text-text-muted px-1.5 line-clamp-2 leading-tight">{title}</span>
              </div>
              <div className="text-center opacity-40">
                <span className="text-[9px] font-mono text-yellow-500 font-semibold">★ {rating ? rating.toFixed(1) : 'N/A'}</span>
              </div>
            </div>
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Badges on Top */}
          {ranking === undefined && (
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
              <div className="flex gap-1">
                <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold font-mono tracking-wider text-white backdrop-blur-md">
                  {quality}
                </span>
                <span className="rounded-md bg-accent-purple/75 px-1.5 py-0.5 text-[9px] font-semibold font-mono tracking-wider text-white backdrop-blur-md">
                  {originalLangName}
                </span>
              </div>
              
              <div className="flex gap-1.5">
                {!showRemoveFromHistory && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPlaylistDropdown(!showPlaylistDropdown);
                      }}
                      className={`rounded-md p-1.5 backdrop-blur-md transition-colors bg-black/60 text-white/80 hover:bg-white hover:text-black ${
                        showPlaylistDropdown ? 'bg-white text-black' : ''
                      }`}
                      aria-label="Add to Cine-Deck"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>

                    {showPlaylistDropdown && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#0a0a0f] border border-white/15 rounded-lg shadow-xl z-50 p-1 flex flex-col gap-0.5 animate-fade-in text-left">
                        <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider px-2 py-1 border-b border-white/5">Cine-Decks</div>
                        {playlists.map((pl) => (
                          <button
                            key={pl.id}
                            onClick={(e) => addToPlaylist(pl.id, e)}
                            className="w-full text-left px-2 py-1.5 hover:bg-white/5 text-[11px] font-semibold text-white truncate rounded-md transition-colors"
                          >
                            {pl.name}
                          </button>
                        ))}
                        <button
                          onClick={createAndAddToPlaylist}
                          className="w-full text-left px-2 py-1.5 hover:bg-accent-purple/10 hover:text-accent-purple text-[11px] font-bold text-accent-purple border-t border-white/5 rounded-md transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          New Cine-Deck
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {showRemoveFromHistory ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const history = JSON.parse(localStorage.getItem('alonetv_continue_watching') || '[]');
                        const updated = history.filter((h: any) => !(h.id === item.id && h.type === type));
                        localStorage.setItem('alonetv_continue_watching', JSON.stringify(updated));
                        window.dispatchEvent(new Event('alonetv_continue_watching_changed'));
                      } catch (err) {
                        console.error('Failed to remove from history:', err);
                      }
                    }}
                    className="rounded-md p-1.5 bg-black/60 text-white/80 hover:bg-red-600 hover:text-white backdrop-blur-md transition-colors"
                    aria-label={`Remove ${title} from history`}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  /* Watchlist Toggle Button */
                  <button
                    type="button"
                    onClick={toggleWatchlist}
                    className={`rounded-md p-1.5 backdrop-blur-md transition-colors ${
                      isInWatchlist 
                        ? 'bg-accent-purple text-white' 
                        : 'bg-black/60 text-white/80 hover:bg-white hover:text-black'
                    }`}
                    aria-label={`Toggle watchlist for ${title}`}
                  >
                    {isInWatchlist ? (
                      <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14m-7-7h14" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Progress Bar (Netflix style for History) */}
          {showRemoveFromHistory && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
              <div 
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${(Number(item.id) % 55) + 30}%` }}
              />
            </div>
          )}

          {/* Play & Trailer Overlay Buttons */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            {/* Play Button */}
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-black shadow-level-4 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <svg className="h-5 w-5 fill-current ml-0.5" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Trailer Button */}
            {!isPremiumItem(item) && (
              <button
                type="button"
                onClick={openTrailer}
                disabled={loadingTrailer}
                className="px-3 py-1.5 rounded-full bg-black/70 border border-white/20 hover:border-white text-[10px] font-semibold tracking-wider uppercase text-white backdrop-blur-md shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300 flex items-center gap-1 hover:bg-white/10"
              >
                <svg className="h-3.5 w-3.5 fill-current text-accent-purple" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                {loadingTrailer ? 'Loading...' : 'Trailer'}
              </button>
            )}
          </div>
        </div>

        {/* Card Info Area */}
        <div className="px-0.5 space-y-1">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="line-clamp-1 text-xs sm:text-sm font-semibold text-text-primary group-hover:text-accent-purple transition-colors text-left">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-text-muted">
            <span className="font-mono">{year}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-yellow-600">
              ★ {rating ? rating.toFixed(1) : 'N/A'}
            </span>
            <span>•</span>
            {showRemoveFromHistory && ('season' in item || 'episode' in item) ? (
              <span className="truncate font-mono uppercase text-accent-teal">
                {('season' in item && item.season) ? `S${item.season} ` : ''}
                {('episode' in item && item.episode) ? `EP${item.episode}` : ''}
              </span>
            ) : (
              <span className="truncate">{genres.slice(0, 1).join('')}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Trailer Modal */}
      {isTrailerOpen && trailerKey && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsTrailerOpen(false);
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md z-0 cursor-pointer"
          />
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {posterUrl && (
              <img
                src={posterUrl}
                alt=""
                className="w-full h-full object-cover blur-[120px] opacity-35 scale-150"
              />
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#07070a] shadow-3xl z-10"
          >
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsTrailerOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all shadow-md"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&modestbranding=1&rel=0`}
              title={`${title} Trailer`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}