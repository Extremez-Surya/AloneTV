'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VideoSource } from '@/lib/api/videoSources';
import { 
  getPreferredAudioLanguage, 
  setPreferredAudioLanguage, 
  filterLanguagesBySource,
  SUPPORTED_LANGUAGES,
  type AudioLanguage 
} from '@/lib/audioPreferences';

interface VideoPlayerProps {
  sources: VideoSource[];
  title: string;
  backdropUrl?: string | null;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
  cast?: any[];
}

/**
 * Video Player with iframe embeds and auto-switching
 */
export default function VideoPlayer({ sources, title, backdropUrl, onNextEpisode, hasNextEpisode, cast = [] }: VideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [autoSwitchCount, setAutoSwitchCount] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<AudioLanguage>('English');
  const [availableLanguages, setAvailableLanguages] = useState<AudioLanguage[]>(['English']);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isDocked, setIsDocked] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showXRay, setShowXRay] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [hudTimer, setHudTimer] = useState<NodeJS.Timeout | null>(null);

  const showHUD = (message: string) => {
    setHudMessage(message);
    // Use window.setTimeout instead of NodeJS.Timeout
    setHudTimer(prev => {
      if (prev) clearTimeout(prev);
      return setTimeout(() => {
        setHudMessage(null);
      }, 800) as any;
    });
  };

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoSwitchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync start time query parameter on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('t');
      if (t) {
        const secs = parseInt(t, 10);
        if (!isNaN(secs) && secs > 0) {
          setStartTime(secs);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Scroll observer for docking player
  useEffect(() => {
    const handleScroll = () => {
      if (!playerContainerRef.current) return;
      const rect = playerContainerRef.current.getBoundingClientRect();
      const isPast = rect.bottom < 0;
      setIsDocked(isPast && !isTheaterMode && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTheaterMode, isDismissed]);

  // Reset docked stats when sources change
  useEffect(() => {
    setIsDismissed(false);
    setIsDocked(false);
  }, [sources]);

  const currentSource = sources[currentIndex] || sources[0];
  let currentStreamUrl = currentSource?.buildUrl ? currentSource.buildUrl(selectedLanguage) : currentSource?.url;

  if (startTime && currentStreamUrl) {
    try {
      const u = new URL(currentStreamUrl);
      u.searchParams.set('start', startTime.toString());
      u.searchParams.set('t', startTime.toString());
      currentStreamUrl = u.toString();
    } catch {
      const sep = currentStreamUrl.includes('?') ? '&' : '?';
      currentStreamUrl = `${currentStreamUrl}${sep}start=${startTime}&t=${startTime}`;
    }
  }

  // Initialize language preference
  useEffect(() => {
    const preferred = getPreferredAudioLanguage();
    setSelectedLanguage(preferred);

    const handleLangSync = () => {
      setSelectedLanguage(getPreferredAudioLanguage());
    };
    window.addEventListener('alonetv_language_changed', handleLangSync);
    return () => {
      window.removeEventListener('alonetv_language_changed', handleLangSync);
    };
  }, []);

  // Update available languages when source changes
  // Aggregate languages across all sources and update available languages
  useEffect(() => {
    const union = new Set<AudioLanguage>();
    for (const s of sources) {
      (s.languages || ['English']).forEach((l) => union.add(l as AudioLanguage));
    }
    // Always include English as a fallback
    union.add('English');
    const list = Array.from(union).filter(Boolean) as AudioLanguage[];
    // Sort by SUPPORTED_LANGUAGES order
    const sorted = SUPPORTED_LANGUAGES.filter((l) => list.includes(l));
    setAvailableLanguages(sorted.length ? sorted : (['English'] as AudioLanguage[]));

    // If the selected language is not available globally, fallback to English
    if (!list.includes(selectedLanguage)) {
      setSelectedLanguage(filterLanguagesBySource(Array.from(list), selectedLanguage));
    }
  }, [sources]);

  // When selected language changes, prefer a source that supports it
  useEffect(() => {
    if (!sources || sources.length === 0) return;

    // If current source supports the language, do nothing
    if (currentSource?.languages?.includes(selectedLanguage)) return;

    // Choose best matching source: recommended + fast, then recommended, then fast, then any
    const scoring = (s: typeof currentSource) => {
      let score = 0;
      if (s.languages?.includes(selectedLanguage)) score += 10;
      if (s.recommended) score += 3;
      if (s.fast) score += 2;
      return score;
    };

    let bestIndex = currentIndex;
    let bestScore = -1;
    sources.forEach((s, idx) => {
      const sc = scoring(s);
      if (sc > bestScore) {
        bestScore = sc;
        bestIndex = idx;
      }
    });

    if (bestIndex !== currentIndex) {
      setCurrentIndex(bestIndex);
    }
  }, [selectedLanguage]);

  // Debug: log current selection and computed stream URL so we can confirm behavior
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.info('VideoPlayer debug:', {
        selectedLanguage,
        currentIndex,
        currentSource: currentSource?.name,
        currentStreamUrl,
      });
    } catch (e) {
      // ignore
    }
  }, [selectedLanguage, currentIndex, currentStreamUrl]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    setAutoSwitchCount(0);

    if (autoSwitchTimerRef.current) {
      clearTimeout(autoSwitchTimerRef.current);
    }
  }, [sources]);

  // Reset state when source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    setAutoSwitchCount(0);

    if (autoSwitchTimerRef.current) {
      clearTimeout(autoSwitchTimerRef.current);
    }
  }, [currentIndex]);

  // Force iframe loading to complete after timeout
  useEffect(() => {
    if (isLoading && currentSource) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 12000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading, currentSource]);

  // Auto-switch to next source on error
  useEffect(() => {
    if (hasError && autoSwitchCount < 3 && sources.length > 1) {
      autoSwitchTimerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % sources.length);
        setAutoSwitchCount((prev) => prev + 1);
      }, 3000);
    }

    return () => {
      if (autoSwitchTimerRef.current) {
        clearTimeout(autoSwitchTimerRef.current);
      }
    };
  }, [hasError, autoSwitchCount, sources.length]);

  // Listen for ended, play, and pause event postMessages from third-party players
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data) {
          if (data.event === 'pause' || data.type === 'pause' || data.event === 'video_paused' || data.event === 'paused') {
            setIsPlaying(false);
          } else if (data.event === 'play' || data.type === 'play' || data.event === 'video_playing' || data.event === 'playing') {
            setIsPlaying(true);
          } else if (
            data.event === 'ended' || 
            data.event === 'video_ended' || 
            data.type === 'ended' || 
            data.event === 'finish' ||
            data.event === 'completed'
          ) {
            if (onNextEpisode) {
              onNextEpisode();
            }
          }
        }
      } catch {
        // Not a JSON message or unrelated
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNextEpisode]);

  // Global keyboard shortcuts / hotkeys listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if the user is typing in form inputs/textarea
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ': // Space bar - play/pause toggle
          e.preventDefault();
          setIsPlaying((prev) => {
            const next = !prev;
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: next ? 'play' : 'pause' }),
                '*'
              );
            }
            showHUD(next ? 'Play' : 'Pause');
            return next;
          });
          break;
        case 'm': // Mute toggle
          e.preventDefault();
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'mute' }),
              '*'
            );
          }
          showHUD('Mute Toggle');
          break;
        case 'f': // Fullscreen toggle
          e.preventDefault();
          if (playerContainerRef.current) {
            if (!document.fullscreenElement) {
              playerContainerRef.current.requestFullscreen().catch(() => {});
              showHUD('Fullscreen');
            } else {
              document.exitFullscreen().catch(() => {});
              showHUD('Exit Fullscreen');
            }
          }
          break;
        case 't': // Theater Mode toggle
          e.preventDefault();
          setIsTheaterMode((prev) => {
            const next = !prev;
            showHUD(next ? 'Theater Mode' : 'Normal Mode');
            return next;
          });
          break;
        case 'n': // Next episode
          if (hasNextEpisode && onNextEpisode) {
            e.preventDefault();
            onNextEpisode();
            showHUD('Next Episode');
          }
          break;
        case 'x': // X-Ray Mode toggle
          e.preventDefault();
          setShowXRay((prev) => {
            const next = !prev;
            showHUD(next ? 'X-Ray Active' : 'X-Ray Dismissed');
            return next;
          });
          break;
        case 'arrowright': // Seek forward 10s
          e.preventDefault();
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'seek', value: 10 }),
              '*'
            );
          }
          showHUD('+10 seconds');
          break;
        case 'arrowleft': // Seek backward 10s
          e.preventDefault();
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'seek', value: -10 }),
              '*'
            );
          }
          showHUD('-10 seconds');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isTheaterMode, hasNextEpisode, onNextEpisode, showXRay]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    setAutoSwitchCount(0);
  }, []);

  const handleIframeError = useCallback(() => {
    setHasError(true);
    setErrorMessage('Stream unavailable on this server');
    setIsLoading(false);
  }, []);

  const handleSourceChange = (index: number) => {
    if (autoSwitchTimerRef.current) {
      clearTimeout(autoSwitchTimerRef.current);
    }
    setCurrentIndex(index);
    setAutoSwitchCount(0);
  };

  const handleLanguageChange = (language: AudioLanguage) => {
    setSelectedLanguage(language);
    setPreferredAudioLanguage(language);
    window.dispatchEvent(new Event('alonetv_language_changed'));
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setAutoSwitchCount(0);
    if (iframeRef.current) {
      iframeRef.current.src = currentStreamUrl || '';
    }
  };

  const handleOpenNewTab = () => {
    if (currentSource?.url) {
      window.open(currentStreamUrl || currentSource.url, '_blank');
    }
  };

  if (!sources.length) {
    return (
      <div className="aspect-video bg-black rounded-xl flex items-center justify-center border border-white/10">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-400 font-medium">No video sources available</p>
          <p className="text-gray-500 text-sm mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  const handleGroupWatch = () => {
    const timeInput = prompt('Enter synchronized start time (e.g. 10:30, or 630 for seconds, or leave empty to start from beginning):');
    
    let seconds = 0;
    if (timeInput) {
      if (timeInput.includes(':')) {
        const parts = timeInput.split(':');
        const mins = parseInt(parts[0], 10) || 0;
        const secs = parseInt(parts[1], 10) || 0;
        seconds = mins * 60 + secs;
      } else {
        seconds = parseInt(timeInput, 10) || 0;
      }
    }

    try {
      const url = new URL(window.location.href);
      if (seconds > 0) {
        url.searchParams.set('t', seconds.toString());
      } else {
        url.searchParams.delete('t');
      }
      navigator.clipboard.writeText(url.toString());
      alert(`Group Watch sync link copied to clipboard!\nShare this with friends to watch together starting at ${seconds > 0 ? `${Math.floor(seconds/60)}m ${seconds%60}s` : 'the beginning'}.`);
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  return (
    <div ref={playerContainerRef} className="w-full space-y-4 relative">
      {/* Docked stand-in layout placeholder */}
      {isDocked && (
        <div className="aspect-video bg-[#0b0b0e] rounded-xl flex items-center justify-center border border-white/5 text-text-muted text-[10px] sm:text-xs font-mono uppercase tracking-widest">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
            <span>Streaming in Mini-Player</span>
          </div>
        </div>
      )}

      {/* Dimmer Overlay for Theater Mode */}
      {isTheaterMode && (
        <div 
          onClick={() => setIsTheaterMode(false)}
          className="fixed inset-0 bg-black/90 z-[90] transition-opacity duration-300 cursor-pointer pointer-events-auto"
        />
      )}

      {/* Ambient Glow (placed behind the video player container) */}
      {isTheaterMode && (
        <div className="absolute -inset-10 z-[91] pointer-events-none rounded-3xl overflow-hidden transition-all duration-500">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt=""
              className="w-full h-full object-cover blur-[100px] opacity-45 scale-125 animate-pulse"
              style={{ animationDuration: '6s' }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-accent-purple/30 via-accent-teal/20 to-yellow-500/20 blur-[100px] opacity-65 animate-pulse" style={{ animationDuration: '6s' }} />
          )}
        </div>
      )}

      {/* Video Container & Iframe Box */}
      <div className={`${
        isDocked 
          ? 'fixed bottom-4 right-4 w-[280px] sm:w-[360px] z-[999] shadow-2xl rounded-2xl overflow-hidden border border-accent-purple bg-[#07070a]' 
          : `relative aspect-video bg-black rounded-xl overflow-hidden ${
              isTheaterMode ? 'z-[92] shadow-[0_0_60px_rgba(147,51,234,0.25)] border border-white/25' : 'border border-white/10 shadow-2xl'
            }`
      } transition-all duration-300`}>
        {/* Floating Mini-Player bar */}
        {isDocked && (
          <div className="bg-[#0f0f15]/95 backdrop-blur-md px-3 py-1.5 border-b border-white/10 flex items-center justify-between text-[10px] text-left">
            <span className="font-semibold text-white truncate max-w-[150px]">{title}</span>
            <div className="flex gap-2 font-mono">
              {hasNextEpisode && onNextEpisode && (
                <button 
                  onClick={onNextEpisode}
                  className="text-accent-purple hover:text-white font-bold"
                >
                  Next
                </button>
              )}
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-accent-teal hover:text-white font-bold"
              >
                Focus
              </button>
              <button 
                onClick={() => setIsDismissed(true)} 
                className="text-red-500 hover:text-red-400 font-bold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Video Player aspect ratio box for mini-player */}
        <div 
          className={isDocked ? 'relative aspect-video' : 'w-full h-full relative'}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Loading Screen */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
              <div className="w-16 h-16 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white font-semibold mb-2">Loading {currentSource?.name}...</p>
              <p className="text-gray-400 text-sm">{title}</p>
              {autoSwitchCount > 0 && (
                <p className="text-yellow-500 text-xs mt-2">
                  Switching to next source...
                </p>
              )}
            </div>
          )}

          {/* Error Screen */}
          {hasError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
              <svg
                className="w-16 h-16 text-red-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-white font-semibold mb-2">{errorMessage || 'Unable to load stream'}</p>
              <p className="text-gray-400 text-sm mb-4">{currentSource?.name}</p>
              <div className="flex gap-3 flex-wrap justify-center">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={handleOpenNewTab}
                  className="px-4 py-2 bg-accent-teal hover:bg-accent-teal/90 text-white rounded-lg transition-colors"
                >
                  Open in New Tab
                </button>
                {sources.length > 1 && (
                  <button
                    onClick={() => handleSourceChange((currentIndex + 1) % sources.length)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Next Source ({currentIndex + 1}/{sources.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Iframe Player */}
          {currentSource && !hasError && (
            <iframe
              key={`player-${currentIndex}-${selectedLanguage}`}
              ref={iframeRef}
              src={currentStreamUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={`Video Player: ${title}`}
              style={{ border: 'none' }}
            />
          )}

          {/* X-Ray Cast Overlay */}
          {((!isPlaying && isHovered) || showXRay) && cast && cast.length > 0 && (
            <div className="absolute inset-0 z-30 bg-gradient-to-t from-black via-black/85 to-black/35 p-6 flex flex-col justify-end pointer-events-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-accent-purple px-2 py-0.5 bg-accent-purple/10 rounded-md border border-accent-purple/20">
                    X-Ray scene guide
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">Press X to Toggle</span>
                </div>
                <button 
                  onClick={() => setShowXRay(false)}
                  className="text-xs text-text-muted hover:text-white font-mono"
                >
                  ✕ Close
                </button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 select-none">
                {cast.map((member: any) => (
                  <div key={member.id} className="flex-shrink-0 w-24 flex flex-col items-center text-center">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-bg-secondary mb-1.5 shadow-level-2">
                      {member.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg bg-bg-card">👤</div>
                      )}
                    </div>
                    <div className="text-[10px] font-semibold text-white truncate w-full">{member.name}</div>
                    <div className="text-[8px] text-text-muted truncate w-full">{member.character}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Hotkey HUD */}
          <AnimatePresence>
            {hudMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 px-5 py-3.5 bg-black/85 backdrop-blur-md rounded-2xl border border-white/15 text-white font-mono font-bold tracking-wider text-xs flex flex-col items-center gap-1.5 pointer-events-none"
              >
                <div className="text-xl">
                  {hudMessage.includes('Play') ? '▶️' :
                   hudMessage.includes('Pause') ? '⏸️' :
                   hudMessage.includes('Mute') ? '🔇' :
                   hudMessage.includes('Fullscreen') ? '📺' :
                   hudMessage.includes('Theater') ? '🎭' :
                   hudMessage.includes('+10') ? '⏩' :
                   hudMessage.includes('-10') ? '⏪' : '⚙️'}
                </div>
                <span>{hudMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Source Selection */}
      <div className="p-4 bg-bg-card rounded-xl border border-white/10 space-y-4">
        {/* Stream Selection */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm font-medium">Stream:</span>
            <div className="flex gap-2 flex-wrap">
              {sources.map((source, index) => (
                <button
                  key={`${source.name}-${index}`}
                  onClick={() => handleSourceChange(index)}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    currentIndex === index
                      ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/50'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {source.name}
                  {source.quality !== 'auto' && (
                    <span className="ml-1 text-xs opacity-75">({source.quality})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {sources.length > 1 && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Source {currentIndex + 1} of {sources.length}</span>
            </div>
          )}
        </div>

        {/* Language Selection */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-3 flex-wrap">
          <span className="text-gray-400 text-sm font-medium">Languages:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as AudioLanguage)}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs sm:text-sm border border-white/20 hover:border-white/40 focus:border-accent-purple focus:outline-none transition-colors"
          >
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang} className="bg-gray-900">
                {lang}
              </option>
            ))}
          </select>
          <span className="text-gray-500 text-xs">
            {availableLanguages.length} available
          </span>
        </div>

        {currentSource && (
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-400">
            {currentSource.recommended && (
              <span className="rounded-full border border-accent-purple/40 bg-accent-purple/10 px-2 py-1 text-accent-purple">
                Recommended
              </span>
            )}
            {currentSource.fast && (
              <span className="rounded-full border border-accent-teal/40 bg-accent-teal/10 px-2 py-1 text-accent-teal">
                Fast
              </span>
            )}
            {currentSource.resumable && (
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-gray-300">
                Resumable
              </span>
            )}
            {currentSource.ads && (
              <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-1 text-yellow-300">
                Ads
              </span>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {currentSource && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 animate-fade-in">
            <div className="flex gap-2">
              <button
                onClick={handleOpenNewTab}
                className="px-3 py-1.5 bg-accent-teal/20 text-accent-teal rounded text-xs font-semibold hover:bg-accent-teal/30 transition-colors font-mono uppercase tracking-wider"
              >
                New Tab
              </button>
              <button
                onClick={handleGroupWatch}
                className="px-3 py-1.5 bg-accent-purple/20 text-accent-purple rounded text-xs font-semibold hover:bg-accent-purple/35 text-accent-purple transition-colors font-mono uppercase tracking-wider flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l5.028-2.514m-5.028 3.514l5.028 2.514M17 12a3 3 0 11-6 0 3 3 0 016 0zm-7-5a3 3 0 11-6 0 3 3 0 016 0zm-7 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Sync Share
              </button>
              {cast && cast.length > 0 && (
                <button
                  onClick={() => setShowXRay((prev) => !prev)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold hover:bg-white/10 transition-colors font-mono uppercase tracking-wider flex items-center gap-1 border ${
                    showXRay ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/30' : 'bg-white/5 text-gray-400 border-white/5'
                  }`}
                >
                  🎬 X-Ray
                </button>
              )}
              <a
                href={currentSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white/5 text-gray-400 rounded text-xs font-semibold hover:bg-white/10 transition-colors font-mono uppercase tracking-wider"
              >
                Direct Link
              </a>
            </div>

            <div className="flex gap-2">
              {hasNextEpisode && onNextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="px-3.5 py-1.5 bg-accent-purple hover:bg-accent-purple/90 text-white rounded text-xs font-bold transition-all shadow-md shadow-accent-purple/20 flex items-center gap-1.5 font-mono uppercase tracking-wider"
                >
                  <span>Next Episode</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Theater Mode Toggle */}
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 font-mono uppercase tracking-wider ${
                  isTheaterMode
                    ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/35'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isTheaterMode ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  )}
                </svg>
                {isTheaterMode ? 'Normal View' : 'Theater Mode'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-center text-gray-500 text-xs space-y-1">
        <p>If video doesn't load in iframe, click "Open in New Tab"</p>
        <p>Some sources may be blocked in your region</p>
      </div>
    </div>
  );
}