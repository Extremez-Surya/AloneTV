'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
}

/**
 * Video Player with iframe embeds and auto-switching
 */
export default function VideoPlayer({ sources, title }: VideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [autoSwitchCount, setAutoSwitchCount] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<AudioLanguage>('English');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['English']);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoSwitchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSource = sources[currentIndex] || sources[0];
  const currentStreamUrl = currentSource?.buildUrl ? currentSource.buildUrl(selectedLanguage) : currentSource?.url;

  // Initialize language preference
  useEffect(() => {
    const preferred = getPreferredAudioLanguage();
    setSelectedLanguage(preferred);
  }, []);

  // Update available languages when source changes
  useEffect(() => {
    const sourceLanguages = currentSource?.languages?.length ? currentSource.languages : ['English'];
    setAvailableLanguages(sourceLanguages);

    // If current language not available in new source, pick the closest match.
    if (!sourceLanguages.includes(selectedLanguage)) {
      setSelectedLanguage(filterLanguagesBySource(sourceLanguages, selectedLanguage));
    }
  }, [currentSource, selectedLanguage]);

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

  return (
    <div className="w-full space-y-4">
      {/* Video Container */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
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
          <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
            <button
              onClick={handleOpenNewTab}
              className="px-3 py-1.5 bg-accent-teal/20 text-accent-teal rounded text-xs font-medium hover:bg-accent-teal/30 transition-colors"
            >
              Open in New Tab
            </button>
            <a
              href={currentSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white/5 text-gray-400 rounded text-xs font-medium hover:bg-white/10 transition-colors"
            >
              Open Link
            </a>
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