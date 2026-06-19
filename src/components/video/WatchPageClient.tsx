'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTMDBImageUrl } from '@/lib/api/tmdb';
import { getAllVideoSources, type VideoSource } from '@/lib/api/videoSources';
import VideoPlayer from '@/components/video/VideoPlayer';
import SeasonSelector from '@/components/video/SeasonSelector';
import { getLocalProfile, syncUserProfile, updatePremiumStatus } from '@/lib/supabase/profile';
import { createClient } from '@/lib/supabase/client';
import PremiumUpgradeModal from '@/components/video/PremiumUpgradeModal';
import ContentCard from '@/components/content/ContentCard';
import { 
  getPreferredAudioLanguage, 
  type AudioLanguage 
} from '@/lib/audioPreferences';

interface Season {
  season_number: number;
  name: string;
  episode_count?: number;
  poster_path?: string;
}

interface Review {
  id: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  content: string;
  createdAt: string;
}

interface WatchPageClientProps {
  type: string;
  id: string;
  tmdbId: number | string;
  imdbId: string;
  title: string;
  posterPath: string;
  backdropPath: string;
  overview: string;
  voteAverage: number;
  releaseDate: string;
  genres: { id: number; name: string }[];
  cast: any[];
  similar: any[];
  seasons?: Season[];
  isAnime?: boolean;
  originalLanguage?: string;
  belongsToCollection?: {
    id: number;
    name: string;
    poster_path?: string;
    backdrop_path?: string;
  } | null;
}

const LANG_CODE_TO_NAME: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  ja: 'Japanese',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  it: 'Italian',
  ru: 'Russian',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
};

export default function WatchPageClient({
  type,
  id,
  tmdbId,
  imdbId,
  title,
  posterPath,
  backdropPath,
  overview,
  voteAverage,
  releaseDate,
  genres,
  cast,
  similar,
  seasons,
  isAnime,
  originalLanguage = 'en',
  belongsToCollection = null
}: WatchPageClientProps) {
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [sourceError, setSourceError] = useState<string | null>(null);

  // Premium gating states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isCheckingPremium, setIsCheckingPremium] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleOpenUpgradeModal = () => {
    setIsUpgradeModalOpen(true);
  };

  // Sync premium status on mount
  useEffect(() => {
    async function checkPremium() {
      try {
        setIsCheckingPremium(true);
        const local = getLocalProfile();
        if (local) {
          setIsLoggedIn(true);
          setIsPremium(Boolean(local.is_premium) || Boolean(local.is_admin));
        }

        const server = await syncUserProfile();
        if (server) {
          setIsLoggedIn(true);
          setIsPremium(Boolean(server.is_premium) || Boolean(server.is_admin));
        }
      } catch (err) {
        console.error('Failed to resolve premium status:', err);
      } finally {
        setIsCheckingPremium(false);
      }
    }

    checkPremium();
    
    const handleUserChange = () => {
      const profile = getLocalProfile();
      if (profile) {
        setIsLoggedIn(true);
        setIsPremium(Boolean(profile.is_premium) || Boolean(profile.is_admin));
      } else {
        setIsLoggedIn(false);
        setIsPremium(false);
      }
    };
    window.addEventListener('alonetv_user_changed', handleUserChange);
    return () => window.removeEventListener('alonetv_user_changed', handleUserChange);
  }, []);

  // Watch Party States
  const [partyRoom, setPartyRoom] = useState<string | null>(null);
  const [partyChat, setPartyChat] = useState<Array<{ id: string; user: string; text: string; time: string; system?: boolean }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [partyMembers, setPartyMembers] = useState<string[]>(['Sarah', 'Alex', 'David']);

  // Sync Watch Party room parameters from URL query parameters on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const party = params.get('party');
      if (party) {
        setPartyRoom(party);
        setPartyChat([
          { id: 'sys-1', user: 'System', text: `Connected to Party Room: ${party}`, time: 'Just Now', system: true },
          { id: 'sys-2', user: 'System', text: 'Sarah, Alex, and David joined the watch party.', time: 'Just Now', system: true }
        ]);
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync event listener for custom room joins from player Sync Share button
  useEffect(() => {
    const handleJoinPartyEvent = (e: Event) => {
      const room = (e as CustomEvent).detail;
      if (room) {
        setPartyRoom(room);
        setPartyChat([
          { id: 'sys-1', user: 'System', text: `Connected to Party Room: ${room}`, time: 'Just Now', system: true },
          { id: 'sys-2', user: 'System', text: 'Sarah, Alex, and David joined the watch party.', time: 'Just Now', system: true }
        ]);
      }
    };
    window.addEventListener('alonetv_join_party', handleJoinPartyEvent as EventListener);
    return () => window.removeEventListener('alonetv_join_party', handleJoinPartyEvent as EventListener);
  }, []);

  // Periodic Watch Party Chat Simulation (for high-fidelity mockup chats)
  useEffect(() => {
    if (!partyRoom) return;

    const chatSequence = [
      { delay: 6000, user: 'Sarah', text: `This is going to be so good. I've been meaning to check out "${title}"!` },
      { delay: 15000, user: 'Alex', text: 'The cinematography in this scene is absolutely gorgeous 😭' },
      { delay: 30000, user: 'David', text: 'Wait, is the player synced for everyone? It looks super smooth.' },
      { delay: 48000, user: 'Sarah', text: 'Yep, synced up! 🍿' },
      { delay: 68000, user: 'Alex', text: 'Oh my god, did you see that transition? Incredible.' }
    ];

    const timers = chatSequence.map((msg) => {
      return setTimeout(() => {
        setPartyChat((prev) => [
          ...prev,
          {
            id: `sim-${Math.random()}`,
            user: msg.user,
            text: msg.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, msg.delay);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [partyRoom, title]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setPartyChat((prev) => [
      ...prev,
      {
        id: `user-${Math.random()}`,
        user: 'You',
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChatInput('');
  };

  // Auto-scroll watch party chat log to bottom
  useEffect(() => {
    if (partyRoom) {
      const bottom = document.getElementById('party-chat-bottom');
      if (bottom) {
        bottom.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [partyChat, partyRoom]);

  // Translation & Audio states
  const [selectedLanguage, setSelectedLanguage] = useState<AudioLanguage>('English');
  const [localTitle, setLocalTitle] = useState(title);
  const [localOverview, setLocalOverview] = useState(overview);
  const [isTranslating, setIsTranslating] = useState(false);

  // Collection details state
  const [collectionDetail, setCollectionDetail] = useState<any>(null);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);

  // Fetch collection details if belongsToCollection is defined
  useEffect(() => {
    async function fetchCollection() {
      if (!belongsToCollection || !belongsToCollection.id) return;
      try {
        setIsLoadingCollection(true);
        const res = await fetch(`/api/collection?id=${belongsToCollection.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.collectionDetail) {
            setCollectionDetail(data.collectionDetail);
          }
        }
      } catch (err) {
        console.error('Failed to fetch collection details:', err);
      } finally {
        setIsLoadingCollection(false);
      }
    }

    fetchCollection();
  }, [belongsToCollection]);

  // Reviews state & logic
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(10);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`alonetv_reviews_${tmdbId}`);
      if (stored) {
        setReviews(JSON.parse(stored));
      } else {
        // Pre-populate with mock reviews matching the movie rating
        const defaultReviews: Review[] = [
          {
            id: 'rev-1',
            username: 'CinematicVibe',
            avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=60',
            rating: Math.round(voteAverage) || 8,
            content: `Honestly, one of the best releases this year. The cinematography is incredible, and the soundtrack blends so well with the overall tone. Highly recommend checking it out!`,
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
          {
            id: 'rev-2',
            username: 'PixelWatcher',
            avatarUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=60',
            rating: Math.max(1, Math.round(voteAverage) - 1) || 7,
            content: `Solid performance from the cast. The second half felt a bit rushed, but the climax completely makes up for it. Definitive watch if you like this genre.`,
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          }
        ];
        setReviews(defaultReviews);
        localStorage.setItem(`alonetv_reviews_${tmdbId}`, JSON.stringify(defaultReviews));
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  }, [tmdbId, voteAverage]);

  const handlePostReview = () => {
    if (!newReviewText.trim()) {
      alert('Please enter review content.');
      return;
    }

    let userName = 'Vinay Kumar';
    let userAvatar = null;
    try {
      const storedUser = JSON.parse(localStorage.getItem('alonetv_user') || 'null');
      if (storedUser && storedUser.name) userName = storedUser.name;
      userAvatar = localStorage.getItem('alonetv_avatar') || null;
    } catch {}

    const newRev: Review = {
      id: 'rev-' + Date.now(),
      username: userName,
      avatarUrl: userAvatar,
      rating: newReviewRating,
      content: newReviewText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    setNewReviewText('');
    setNewReviewRating(10);
    
    try {
      localStorage.setItem(`alonetv_reviews_${tmdbId}`, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Use TMDB ID for video sources, fallback to IMDb ID if TMDB ID is an unmapped custom source string or if we are watching anime/TVmaze and have an IMDb ID
  const videoId = imdbId && (
    isAnime || 
    (typeof tmdbId === 'string' && (tmdbId.startsWith('tvmaze-') || tmdbId.startsWith('kitsu-') || tmdbId === id))
  )
    ? imdbId
    : String(tmdbId);

  // Sync preferred language on load & window events
  useEffect(() => {
    setSelectedLanguage(getPreferredAudioLanguage());

    const handleLanguageSync = () => {
      setSelectedLanguage(getPreferredAudioLanguage());
    };
    window.addEventListener('alonetv_language_changed', handleLanguageSync);

    return () => {
      window.removeEventListener('alonetv_language_changed', handleLanguageSync);
    };
  }, []);

  // Fetch translation dynamically when selected language changes
  useEffect(() => {
    const translateMetadata = async () => {
      if (selectedLanguage === 'English') {
        setLocalTitle(title);
        setLocalOverview(overview);
        return;
      }

      try {
        setIsTranslating(true);
        // Call translation API
        const res = await fetch(`/api/translate?id=${tmdbId}&type=${type === 'anime' ? 'tv' : type}&lang=${selectedLanguage}`);
        if (res.ok) {
          const data = await res.json();
          if (data.translated) {
            setLocalTitle(data.title || title);
            setLocalOverview(data.overview || overview);
          } else {
            setLocalTitle(title);
            setLocalOverview(overview);
          }
        }
      } catch (err) {
        console.error('Metadata translation failed:', err);
      } finally {
        setIsTranslating(false);
      }
    };

    translateMetadata();
  }, [selectedLanguage, tmdbId, type, title, overview]);

  // Save/Update Continue Watching progress history in localStorage
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('alonetv_continue_watching') || '[]');
      // Remove previous duplicate entry of the same media item
      const cleanHistory = history.filter((h: any) => !(h.id === id && h.type === type));

      const newHistoryItem = {
        id,
        type,
        title,
        posterUrl: posterPath ? (posterPath.startsWith('http') ? posterPath : getTMDBImageUrl(posterPath, 'w342')) : null,
        backdropUrl: backdropPath ? (backdropPath.startsWith('http') ? backdropPath : getTMDBImageUrl(backdropPath, 'w780')) : null,
        year: releaseDate ? releaseDate.split('-')[0] : '2025',
        rating: voteAverage || 0,
        quality: voteAverage && voteAverage >= 7.6 ? '4K' : 'HD',
        genres: genres.map((g) => g.name),
        genreLabel: type === 'anime' ? 'Anime' : type === 'tv' ? 'TV Show' : 'Movie',
        href: `/watch/${type}/${id}`,
        season: type === 'tv' ? currentSeason : undefined,
        episode: type === 'tv' || isAnime ? currentEpisode : undefined,
        watchedAt: new Date().toISOString(),
      };

      // Add to front of history list, limit to top 10 items
      localStorage.setItem('alonetv_continue_watching', JSON.stringify([newHistoryItem, ...cleanHistory].slice(0, 10)));
    } catch (e) {
      console.error('Failed to save continue watching progress:', e);
    }
  }, [id, type, currentSeason, currentEpisode, title, posterPath, backdropPath, releaseDate, voteAverage, genres, isAnime]);

  // Fetch video sources asynchronously
  useEffect(() => {
    async function fetchSources() {
      try {
        setIsLoadingSources(true);
        setSourceError(null);

        if (isCheckingPremium) return;

        // Free preview flow
        if (!isPremium) {
          try {
            const res = await fetch(`/api/trailer?id=${tmdbId}&type=${type === 'anime' ? 'tv' : type}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.trailer?.key) {
                setTrailerKey(data.trailer.key);
                setVideoSources([{
                  name: 'Preview (Official Trailer)',
                  url: `https://www.youtube.com/embed/${data.trailer.key}?autoplay=1&rel=0`,
                  quality: 'HD',
                  type: 'iframe',
                  recommended: true
                }]);
                setIsLoadingSources(false);
                return;
              }
            }
          } catch (err) {
            console.error('Failed to load trailer details:', err);
          }

          // Fallback countdown trailer
          setVideoSources([{
            name: 'Preview (Official Trailer)',
            url: `https://www.youtube.com/embed/Ke1Y3f2nlt0?autoplay=1&rel=0`,
            quality: 'HD',
            type: 'iframe',
            recommended: true
          }]);
          setIsLoadingSources(false);
          return;
        }

        // Premium Flow
        let sources: VideoSource[] = [];

        if (isAnime) {
          sources = await getAllVideoSources('anime', videoId, undefined, currentEpisode);
        } else if (type === 'tv' && seasons && seasons.length > 0) {
          sources = await getAllVideoSources('tv', videoId, currentSeason, currentEpisode);
        } else {
          sources = await getAllVideoSources('movie', videoId);
        }

        setVideoSources(sources);

        if (sources.length === 0) {
          if (isAnime) {
            setSourceError('Anime streaming is currently unavailable. We are working on improving anime support. Please try movies or TV shows instead.');
          } else {
            setSourceError('No video sources available. Please try again later.');
          }
        }
      } catch (error) {
        console.error('Failed to load video sources:', error);
        setSourceError('Failed to load video sources');
      } finally {
        setIsLoadingSources(false);
      }
    }

    fetchSources();
  }, [type, id, videoId, currentSeason, currentEpisode, isAnime, isPremium, isCheckingPremium, tmdbId]);

  const handleSeasonChange = (seasonNum: number) => {
    setCurrentSeason(seasonNum);
    setCurrentEpisode(1);
  };

  const handleEpisodeChange = (seasonNum: number, episodeNum: number) => {
    setCurrentSeason(seasonNum);
    setCurrentEpisode(episodeNum);
  };

  const playNextEpisode = () => {
    const activeSeasonData = seasons?.find((s) => s.season_number === currentSeason);
    const maxEpisodes = isAnime ? 24 : (activeSeasonData?.episode_count || 24);

    if (currentEpisode < maxEpisodes) {
      setCurrentEpisode(currentEpisode + 1);
    } else {
      const nextSeasonNum = currentSeason + 1;
      const nextSeasonExists = seasons?.some((s) => s.season_number === nextSeasonNum);
      if (nextSeasonExists) {
        setCurrentSeason(nextSeasonNum);
        setCurrentEpisode(1);
      }
    }
  };

  const hasNextEpisode = () => {
    const activeSeasonData = seasons?.find((s) => s.season_number === currentSeason);
    const maxEpisodes = isAnime ? 24 : (activeSeasonData?.episode_count || 24);
    if (currentEpisode < maxEpisodes) return true;
    const nextSeasonNum = currentSeason + 1;
    return seasons?.some((s) => s.season_number === nextSeasonNum) || false;
  };

  const backdropUrl = backdropPath ? (backdropPath.startsWith('http') ? backdropPath : getTMDBImageUrl(backdropPath, 'original')) : null;
  const posterUrl = posterPath ? (posterPath.startsWith('http') ? posterPath : getTMDBImageUrl(posterPath, 'w780')) : null;

  const originalLangLabel = LANG_CODE_TO_NAME[originalLanguage.toLowerCase()] || originalLanguage.toUpperCase();

  return (
    <div className="theme-dark min-h-screen bg-bg-primary text-text-primary pt-[72px] relative">
      {/* Ambient Backdrop Blur (Aurora effect) */}
      {backdropUrl && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <img src={backdropUrl} alt="" className="w-full h-full object-cover opacity-20 filter blur-xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/90 to-bg-primary" />
        </div>
      )}

      {/* Main Content Layout */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Left: Video Player & Selections */}
          <div className="flex-1 min-w-0">
            {/* Player Area */}
            <div className="w-full">
              {isLoadingSources && (
                <div className="aspect-video bg-bg-card rounded-2xl flex items-center justify-center border border-border shadow-level-3">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-muted text-sm font-medium">Locating streaming channels...</p>
                  </div>
                </div>
              )}

              {!isLoadingSources && sourceError && (
                <div className="aspect-video bg-bg-card rounded-2xl flex items-center justify-center border border-border/50 shadow-level-3">
                  <div className="flex flex-col items-center gap-3 text-center px-6">
                    <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-text-primary font-semibold">Source Error</p>
                    <p className="text-text-muted text-xs sm:text-sm max-w-sm">{sourceError}</p>
                  </div>
                </div>
              )}

              {!isLoadingSources && videoSources.length > 0 && (
                <>
                  <VideoPlayer
                    sources={videoSources}
                    title={localTitle}
                    backdropUrl={backdropUrl}
                    onNextEpisode={hasNextEpisode() ? playNextEpisode : undefined}
                    hasNextEpisode={hasNextEpisode()}
                    cast={cast}
                  />
                  
                  {/* Premium Upgrade Banner for Free Users */}
                  {!isPremium && (
                    <div className="mt-4 p-5 bg-gradient-to-br from-[#120826]/90 to-[#07050e]/95 backdrop-blur-md rounded-2xl border border-purple-500/25 shadow-level-3 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-left animate-fade-in">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 text-sm">👑</span>
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Viewing Preview (Official Trailer)</h4>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed max-w-xl">
                          You are currently watching the trailer preview. Unlock the premium plan to gain full access to all movie streaming servers, high definition quality, and synced watch parties.
                        </p>
                      </div>
                      <button
                        onClick={handleOpenUpgradeModal}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-purple-600 hover:opacity-90 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/25 border border-purple-500/30 transition-all shrink-0"
                      >
                        Unlock Full Video
                      </button>
                    </div>
                  )}

                  {/* Premium Server List Locking for Visual Feedback */}
                  {!isPremium && (
                    <div className="mt-4 p-4 bg-bg-card border border-border rounded-2xl text-left">
                      <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest font-mono mb-3">Streaming Server Status</h4>
                      <div className="flex gap-2 flex-wrap opacity-65 pointer-events-none select-none">
                        <div className="px-3 py-1.5 bg-bg-secondary rounded-lg border border-border text-xs text-text-muted flex items-center gap-1.5 font-mono">
                          <span>🔒</span> ScreenScape (4K Auto)
                        </div>
                        <div className="px-3 py-1.5 bg-bg-secondary rounded-lg border border-border text-xs text-text-muted flex items-center gap-1.5 font-mono">
                          <span>🔒</span> VidLink (1080p AD-FREE)
                        </div>
                        <div className="px-3 py-1.5 bg-bg-secondary rounded-lg border border-border text-xs text-text-muted flex items-center gap-1.5 font-mono">
                          <span>🔒</span> VidKing (1080p Multilingual)
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Premium Linguistic Playback Guide Banner */}
                  {isPremium && selectedLanguage !== 'English' && (
                    <div className="mt-4 p-4 rounded-xl bg-bg-card border border-border/80 shadow-level-2 flex gap-4 items-start animate-fade-in text-left">
                      <div className="p-2 rounded-lg bg-accent-purple/10 text-accent-purple shrink-0 mt-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-text-primary">
                          Playback Guide: {selectedLanguage} Audio/Dubs.
                        </h4>
                        <p className="text-xs text-text-muted leading-relaxed">
                          We've sent request parameters for <span className="text-text-primary font-medium">{selectedLanguage}</span> to the streaming channels.
                          If the video still plays in English or the original language:
                        </p>
                        <ol className="list-decimal list-inside text-xs text-text-muted pl-1 space-y-1 pt-1">
                          <li>Click the <strong className="text-text-primary font-medium">Settings (gear icon)</strong> or <strong className="text-text-primary font-medium">Audio Track</strong> option inside the video player controls.</li>
                          <li>Select <span className="text-accent-purple font-semibold">{selectedLanguage}</span> from the audio track list (if hosted by the current server).</li>
                          <li>If the current stream doesn't support it, try switching to another <strong className="text-text-primary font-medium">Stream</strong> (e.g. VidLink, VidKing, MoviesAPI) below the player.</li>
                        </ol>
                        <p className="text-[10px] text-text-muted/65 italic pt-1">
                          Note: Dub availability is determined by the third-party servers. New releases might temporarily only be available in their original language.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Episode selectors */}
            {type === 'tv' && seasons && seasons.length > 0 && (
              <div className="mt-6 p-5 bg-bg-card rounded-2xl border border-border shadow-level-2">
                <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
                  <h3 className="text-base font-semibold text-text-primary">Select Episode</h3>
                  <span className="font-mono text-xs text-text-muted bg-bg-secondary px-2 py-0.5 rounded border border-border">
                    Season {currentSeason}
                  </span>
                </div>
                <SeasonSelector
                  tvId={tmdbId}
                  seasons={seasons}
                  onSelectSeason={handleSeasonChange}
                  onSelectEpisode={handleEpisodeChange}
                  currentSeason={currentSeason}
                  currentEpisode={currentEpisode}
                />
              </div>
            )}

            {isAnime && (
              <div className="mt-6 p-5 bg-bg-card rounded-2xl border border-border shadow-level-2">
                <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
                  <h3 className="text-base font-semibold text-text-primary">Episodes</h3>
                  <span className="font-mono text-xs text-text-muted bg-bg-secondary px-2 py-0.5 rounded border border-border">
                    MAL Source
                  </span>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((ep) => (
                    <button
                      key={ep}
                      onClick={() => handleEpisodeChange(1, ep)}
                      className={`py-2 rounded-lg text-xs font-semibold font-mono tracking-wider transition-all ${
                        currentEpisode === ep
                          ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/35'
                          : 'bg-bg-secondary text-text-muted hover:bg-border/40 hover:text-text-primary'
                      }`}
                    >
                      EP {ep}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Audience Reviews & Local Discussion Board */}
            <div className="mt-6 p-5 bg-[#0d0d12]/60 backdrop-blur-md rounded-2xl border border-border/80 shadow-level-2 space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-text-primary">Audience Reviews</h3>
                  <p className="text-xs text-text-muted">Share your thoughts and rate this title locally</p>
                </div>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2 bg-bg-secondary px-3 py-1.5 rounded-lg border border-border">
                    <span className="text-yellow-500 font-bold text-sm">★</span>
                    <span className="font-mono text-xs font-bold text-text-primary">
                      {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}/10
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">({reviews.length} reviews)</span>
                  </div>
                )}
              </div>

              {/* Add a new review */}
              <div className="space-y-3 bg-[#0d0d12]/30 p-4 rounded-xl border border-border/40">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Write a Review</h4>
                
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs text-text-muted font-medium">Your Rating:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className={`text-xs font-bold font-mono w-7 h-7 rounded-md border flex items-center justify-center transition-all ${
                          newReviewRating === star
                            ? 'bg-accent-purple border-accent-purple text-white shadow-md shadow-accent-purple/35'
                            : 'bg-bg-secondary border-border text-text-muted hover:border-text-primary hover:text-text-primary'
                        }`}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    placeholder="Write your review here... What did you think of the story, acting, pacing, or visuals?"
                    rows={3}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 resize-none transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePostReview}
                  className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-accent-purple/20 transition-all font-mono uppercase tracking-wider flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Post Review
                </button>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-hide">
                {reviews.length === 0 ? (
                  <p className="text-center py-6 text-xs text-text-muted font-mono">No reviews posted yet. Be the first!</p>
                ) : (
                  reviews
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((rev) => (
                      <div key={rev.id} className="p-3.5 bg-bg-secondary border border-border/60 rounded-xl space-y-2 text-left">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-accent-purple text-white text-[10px] font-bold border border-border">
                              {rev.avatarUrl ? (
                                <img src={rev.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                rev.username.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-text-primary leading-none">{rev.username}</p>
                              <p className="text-[9px] text-text-muted font-mono leading-none">
                                {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-mono text-xs font-bold">
                            ★ {rev.rating}/10
                          </span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap pl-1">{rev.content}</p>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Title Info & Cast */}
          <div className="lg:w-[380px] shrink-0">
            {/* Widescreen Poster */}
            {posterUrl && (
              <div className="hidden lg:block relative aspect-[2/3] rounded-2xl overflow-hidden mb-6 border border-border shadow-level-3">
                <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Title & Metadata */}
            <div className="mb-6">
              {isTranslating ? (
                <div className="h-8 w-2/3 bg-bg-secondary skeleton rounded-md mb-4" />
              ) : (
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-3">
                  {localTitle}
                </h1>
              )}

              <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                {voteAverage > 0 && (
                  <span className="flex items-center gap-0.5 font-semibold text-yellow-500">
                    ★ {voteAverage.toFixed(1)}
                  </span>
                )}
                {releaseDate && <span className="font-mono">{releaseDate.split('-')[0]}</span>}
                
                {/* Original Language Emblem */}
                <span className="px-2 py-0.5 bg-accent-purple/15 text-accent-purple rounded border border-accent-purple/20 font-mono text-[10px] font-bold">
                  ORG: {originalLangLabel}
                </span>

                {genres.slice(0, 2).map((genre) => (
                  <span key={genre.id} className="px-2 py-0.5 bg-bg-secondary border border-border rounded text-[10px]">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Watch Party Quick Activation */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  if (!isPremium) {
                    handleOpenUpgradeModal();
                    return;
                  }
                  const room = prompt('Enter a room code to join, or leave empty to create a new one:');
                  if (room === null) return;
                  const finalRoom = room.trim() || 'ROOM_' + Math.random().toString(36).substring(2, 8).toUpperCase();
                  setPartyRoom(finalRoom);
                  setPartyChat([
                    { id: 'sys-1', user: 'System', text: `Connected to Party Room: ${finalRoom}`, time: 'Just Now', system: true },
                    { id: 'sys-2', user: 'System', text: 'Sarah, Alex, and David joined the watch party.', time: 'Just Now', system: true }
                  ]);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                  !isPremium
                    ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed opacity-60'
                    : partyRoom 
                      ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/35 animate-pulse'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {isPremium ? (partyRoom ? `Watch Party Active (${partyRoom})` : 'Start Group Watch') : '🔒 Start Group Watch'}
              </button>

              {partyRoom && (
                <button
                  onClick={() => {
                    setPartyRoom(null);
                    setPartyChat([]);
                  }}
                  className="px-4 bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors text-xs font-mono font-bold uppercase tracking-wider"
                  title="Leave Watch Party"
                >
                  Leave
                </button>
              )}
            </div>

            {/* Current Selection details */}
            {(type === 'tv' || isAnime) && (
              <div className="mb-5 p-3.5 bg-bg-secondary border border-border rounded-xl">
                <p className="text-text-primary font-semibold text-sm">
                  Now Streaming: {isAnime ? 'Anime Edition' : `Season ${currentSeason}`} • Episode {currentEpisode}
                </p>
              </div>
            )}

            {/* Description / Overview */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2 font-mono">Overview</h3>
              {isTranslating ? (
                <div className="space-y-2">
                  <div className="h-4 w-full bg-bg-secondary skeleton rounded" />
                  <div className="h-4 w-5/6 bg-bg-secondary skeleton rounded" />
                  <div className="h-4 w-4/6 bg-bg-secondary skeleton rounded" />
                </div>
              ) : (
                <p className="text-sm text-text-muted leading-relaxed">
                  {localOverview || 'No description available for this title.'}
                </p>
              )}
            </div>

            {/* Cast Panel */}
            {cast.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3 font-mono">Top Cast</h3>
                <div className="grid grid-cols-5 gap-2.5">
                  {cast.slice(0, 10).map((person) => (
                    <Link
                      key={person.id}
                      href={`/search?q=${encodeURIComponent(person.name)}`}
                      className="text-center group cursor-pointer block"
                    >
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-1.5 bg-bg-secondary border border-border shadow-level-1 group-hover:border-accent-purple transition-all duration-300">
                        {person.profile_path ? (
                          <img
                            src={getTMDBImageUrl(person.profile_path, 'w185') || ''}
                            alt={person.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-bg-secondary text-text-muted/40 font-mono text-sm">
                            ?
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-text-primary truncate group-hover:text-accent-purple transition-colors">{person.name}</p>
                      <p className="text-[9px] text-text-muted truncate mt-0.5">{person.character}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Rail */}
        {similar.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border/40">
            <h2 className="text-xl font-bold tracking-tight text-text-primary mb-6">
              Similar Titles.
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {similar.slice(0, 10).map((item: any, index: number) => (
                <ContentCard key={item.id} item={item} type={type as 'movie' | 'tv'} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Franchise Collection Rail */}
        {collectionDetail && collectionDetail.parts && collectionDetail.parts.filter((part: any) => part.id !== tmdbId).length > 0 && (
          <section className="mt-12 pt-8 border-t border-border/40">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold tracking-tight text-text-primary">
                {collectionDetail.name || 'Franchise Collection'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                Franchise
              </span>
            </div>
            {collectionDetail.overview && (
              <p className="text-sm text-text-muted mb-6 max-w-3xl leading-relaxed text-left">
                {collectionDetail.overview}
              </p>
            )}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {collectionDetail.parts
                .filter((part: any) => part.id !== tmdbId)
                .map((part: any, index: number) => (
                  <ContentCard key={part.id} item={{ ...part, media_type: 'movie' }} type="movie" index={index} />
                ))}
            </div>
          </section>
        )}
      </div>

      {/* Watch Party Sidebar Drawer */}
      <div className={`fixed top-0 right-0 h-full w-[380px] max-w-full z-[999] bg-[#09090d]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col transition-all duration-300 ${
        partyRoom ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111118]/80">
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
              <h3 className="font-bold text-sm text-white font-mono tracking-wide uppercase">Watch Party Room</h3>
            </div>
            <p className="text-[10px] text-accent-purple font-mono uppercase tracking-wider">Code: {partyRoom}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (partyRoom) {
                  const url = new URL(window.location.href);
                  url.searchParams.set('party', partyRoom);
                  navigator.clipboard.writeText(url.toString());
                  alert('Sync join link copied to clipboard!');
                }
              }}
              className="p-1.5 hover:bg-white/5 rounded text-accent-teal hover:text-white transition-colors"
              title="Copy Party Link"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l5.028-2.514m-5.028 3.514l5.028 2.514M17 12a3 3 0 11-6 0 3 3 0 016 0zm-7-5a3 3 0 11-6 0 3 3 0 016 0zm-7 10a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => {
                setPartyRoom(null);
                setPartyChat([]);
              }}
              className="text-xs text-text-muted hover:text-white font-mono uppercase tracking-widest px-2"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Room Members */}
        <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex gap-2 overflow-x-auto text-[10px] scrollbar-none items-center text-left">
          <span className="text-text-muted font-semibold uppercase tracking-wider font-mono shrink-0">Members:</span>
          <div className="flex gap-1.5 items-center">
            <span className="px-2 py-0.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-white font-semibold">You</span>
            {partyMembers.map((member) => (
              <span key={member} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">{member}</span>
            ))}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10 text-left">
          {partyChat.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.system ? 'items-center py-1' : ''}`}>
              {msg.system ? (
                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] text-accent-teal font-mono text-center max-w-[90%]">
                  {msg.text}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xs font-bold font-mono ${msg.user === 'You' ? 'text-accent-teal' : 'text-accent-purple'}`}>
                      {msg.user}
                    </span>
                    <span className="text-[8px] text-text-muted font-mono">{msg.time}</span>
                  </div>
                  <div className="px-3 py-2 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-200 leading-relaxed break-words max-w-[95%]">
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div id="party-chat-bottom" />
        </div>

        {/* Chat input form */}
        <form onSubmit={handleSendChat} className="p-4 border-t border-white/10 bg-[#0c0c11]">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-text-muted focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-accent-purple/20 transition-all font-mono uppercase tracking-wider"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Upgrade to Premium Modal */}
      <PremiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        mediaTitle={title}
      />
    </div>
  );
}