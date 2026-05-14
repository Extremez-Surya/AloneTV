'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCallback as useCallbackHook } from 'react';

interface VideoSource {
  name: string;
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'iframe';
  isM3u8?: boolean;
}

interface VideoPlayerProps {
  sources: VideoSource[];
  title: string;
}

/**
 * HLS-compatible video player using HTML5 video + Fetch
 * Supports both direct HLS (.m3u8) and iframe sources
 */
export default function VideoPlayer({ sources, title }: VideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sourceAttemptRef = useRef(0);

  const currentSource = sources[currentIndex];
  const isHLS = currentSource?.type === 'hls' || currentSource?.isM3u8;
  const isIframe = currentSource?.type === 'iframe';

  // Reset state when source changes
  useEffect(() => {
    setIsLoading(true);
    setLoadProgress(0);
    setHasError(false);
    setErrorMessage('');
    sourceAttemptRef.current = 0;
  }, [currentIndex]);

  // Simulate loading progress for UX
  useEffect(() => {
    if (isLoading && !isIframe) {
      const interval = setInterval(() => {
        setLoadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isLoading, isIframe]);

  // Handle video load for direct HLS streams
  const handleVideoLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    setIsLoading(false);
    setLoadProgress(100);
    setHasError(false);
  }, []);

  const handleVideoError = useCallback((e: Event) => {
    const video = e.target as HTMLVideoElement;
    const errorCode = video.error?.code;
    
    const errorMessages: Record<number, string> = {
      1: 'Loading aborted',
      2: 'Network error',
      3: 'Decoding failed',
      4: 'Format not supported'
    };

    setHasError(true);
    setErrorMessage(errorMessages[errorCode || 0] || 'Unable to load stream');
    setIsLoading(false);
    setLoadProgress(0);

    // Auto-switch to next source on error (max 3 attempts)
    if (sourceAttemptRef.current < 2 && sources.length > 1) {
      sourceAttemptRef.current++;
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % sources.length);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sources.length]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setLoadProgress(100);
    setHasError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setHasError(true);
    setErrorMessage('Failed to load embed');
    setIsLoading(false);

    // Auto-switch to next source
    if (sourceAttemptRef.current < 2 && sources.length > 1) {
      sourceAttemptRef.current++;
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % sources.length);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sources.length]);

  const handleSourceChange = (index: number) => {
    setCurrentIndex(index);
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    if (videoRef.current) {
      videoRef.current.load();
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
            <p className="text-white font-semibold mb-3">{currentSource?.name}</p>
            <div className="w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-purple to-accent-teal transition-all duration-300"
                style={{ width: `${Math.min(loadProgress, 100)}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-3">{Math.round(loadProgress)}%</p>
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
            <p className="text-white font-semibold mb-2">{errorMessage}</p>
            {sources.length > 1 && sourceAttemptRef.current < 2 && (
              <p className="text-gray-400 text-sm">Trying next server...</p>
            )}
            {sourceAttemptRef.current >= 2 && (
              <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Native Video Player (for HLS streams) */}
        {isHLS && !isIframe && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full"
            controls
            autoPlay
            crossOrigin="anonymous"
            onLoadStart={handleVideoLoadStart}
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoError}
          >
            <source src={currentSource.url} type="application/x-mpegURL" />
            <p>Your browser does not support HTML5 video.</p>
          </video>
        )}

        {/* Fallback Iframe Player */}
        {isIframe && (
          <iframe
            ref={iframeRef}
            key={`iframe-${currentIndex}-${Date.now()}`}
            src={currentSource.url}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Video Player: ${title}`}
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms"
            style={{ border: 'none' }}
          />
        )}
      </div>

      {/* Server/Source Selection */}
      {sources.length > 1 && (
        <div className="p-4 bg-bg-card rounded-xl border border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm font-medium">Stream Source:</span>
              <div className="flex gap-2 flex-wrap">
                {sources.map((source, index) => (
                  <button
                    key={`${source.name}-${index}`}
                    onClick={() => handleSourceChange(index)}
                    disabled={hasError && index === currentIndex}
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      currentIndex === index
                        ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/50'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {source.name}
                    {source.quality !== 'auto' && (
                      <span className="hidden sm:inline ml-2 text-xs opacity-75">
                        ({source.quality})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{currentIndex + 1} of {sources.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}