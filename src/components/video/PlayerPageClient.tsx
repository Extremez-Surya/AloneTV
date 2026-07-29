'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getAllVideoSources, getAvailableLanguages, findSourcesForLanguage, type VideoSource } from '@/lib/api/videoSources'
import { getPreferredAudioLanguage, setPreferredAudioLanguage, type AudioLanguage } from '@/lib/audioPreferences'
import SeasonSelector from '@/components/video/SeasonSelector'
import DubSelector from '@/components/video/DubSelector'
import VidstackPlayer, { type AudioTrackInfo } from '@/components/video/VidstackPlayer'

import { addToContinueWatching } from '@/lib/userHistory'

const VideoPlayer = dynamic(() => import('@/components/video/VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-black/60">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Loading player...</span>
      </div>
    </div>
  ),
})

const PremiumUpgradeModal = dynamic(() => import('@/components/video/PremiumUpgradeModal'), {
  ssr: false,
})

interface Season {
  season_number: number
  name: string
  episode_count?: number
  poster_path?: string
}

interface PlayerPageClientProps {
  type: string
  id: string
  tmdbId: number | string
  imdbId: string
  title: string
  posterPath: string
  backdropPath: string
  isAnime?: boolean
  seasons?: Season[]
}

const CODE_TO_LANG: Record<string, AudioLanguage> = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  kn: 'Kannada', ml: 'Malayalam', mr: 'Marathi', bn: 'Bengali',
  es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  it: 'Italian', ru: 'Russian', ja: 'Japanese', ko: 'Korean',
  zh: 'Chinese', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian',
}

function hlsLangToAudioLang(code: string): AudioLanguage {
  const lower = code.toLowerCase().slice(0, 2)
  return CODE_TO_LANG[lower] || 'English'
}

const FALLBACK_LANGUAGES: AudioLanguage[] = ['English', 'Hindi', 'Spanish', 'Japanese', 'Korean', 'Chinese', 'Tamil', 'Telugu']

export default function PlayerPageClient({
  type,
  id,
  tmdbId,
  imdbId,
  title,
  posterPath,
  backdropPath,
  isAnime,
  seasons,
}: PlayerPageClientProps) {
  const [currentSeason, setCurrentSeason] = useState(1)
  const [currentEpisode, setCurrentEpisode] = useState(1)
  const [videoSources, setVideoSources] = useState<VideoSource[]>([])
  const [hlsUrl, setHlsUrl] = useState<string | null>(null)
  const [isLoadingSources, setIsLoadingSources] = useState(true)
  const [sourceError, setSourceError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [isCheckingPremium, setIsCheckingPremium] = useState(true)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<AudioLanguage>('English')
  const [availableLanguages, setAvailableLanguages] = useState<AudioLanguage[]>(FALLBACK_LANGUAGES)
  const [hlsAudioTracks, setHlsAudioTracks] = useState<AudioTrackInfo[]>([])
  const [showInfo, setShowInfo] = useState(false)
  const [playerKey, setPlayerKey] = useState(0)

  const videoId = String(tmdbId || id || imdbId)

  useEffect(() => {
    const preferred = getPreferredAudioLanguage()
    setSelectedLanguage(preferred)
    const fn = () => setSelectedLanguage(getPreferredAudioLanguage())
    window.addEventListener('alonetv_language_changed', fn)
    return () => window.removeEventListener('alonetv_language_changed', fn)
  }, [])

  const fetchSources = useCallback(async () => {
    setIsLoadingSources(true)
    setSourceError(null)
    setHlsUrl(null)
    setHlsAudioTracks([])
    try {
      const [sources, hlsRes] = await Promise.all([
        getAllVideoSources(
          type as 'movie' | 'tv' | 'anime',
          videoId,
          currentSeason,
          currentEpisode,
        ),
        fetch(`/api/hls?id=${videoId}&type=${type}${currentSeason ? `&season=${currentSeason}` : ''}${currentEpisode ? `&episode=${currentEpisode}` : ''}`)
          .then(r => r.ok ? r.json() : null),
      ])

      if (sources.length > 0) {
        setVideoSources(sources)
        const langs = getAvailableLanguages(sources)
        if (langs.length > 0) setAvailableLanguages(langs as AudioLanguage[])
      }

      if (hlsRes?.sources?.length > 0) {
        setHlsUrl(hlsRes.sources[0].url)
        if (hlsRes.audioTracks?.length > 0) {
          const tracks: AudioTrackInfo[] = hlsRes.audioTracks.map((t: any, i: number) => ({
            index: i,
            label: t.language || '',
            language: t.language || '',
          }))
          setHlsAudioTracks(tracks)
          const hlsLangs = [...new Set(tracks.map(t => hlsLangToAudioLang(t.language)))]
          setAvailableLanguages(prev => [...new Set([...hlsLangs, ...prev])])
        }
      } else if (sources.length === 0) {
        setSourceError('No streaming sources available for this title.');
      }
    } catch (error) {
      setSourceError('Failed to load video sources. Please try again.');
    } finally {
      setIsLoadingSources(false);
    }
  }, [type, videoId, currentSeason, currentEpisode]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Record watch history
  useEffect(() => {
    if (!title) return;
    addToContinueWatching({
      id: videoId || id,
      tmdbId: String(tmdbId || id),
      type: type as 'movie' | 'tv' | 'anime',
      title,
      posterPath,
      backdropPath,
      season: type === 'tv' ? currentSeason : undefined,
      episode: type === 'tv' || isAnime ? currentEpisode : undefined,
    });
  }, [id, videoId, tmdbId, type, title, posterPath, backdropPath, currentSeason, currentEpisode, isAnime]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('alonetv_premium');
      if (stored) {
        const p = JSON.parse(stored);
        setIsLoggedIn(true);
        setIsPremium(p.isPremium || false);
      }
    } catch (error) {}
    setIsCheckingPremium(false);
  }, []);

  const handleAudioTracksReady = (tracks: AudioTrackInfo[]) => {
    if (tracks.length > 0) {
      setHlsAudioTracks(tracks)
      const newLangs = [...new Set(tracks.map(t => hlsLangToAudioLang(t.language)))]
      setAvailableLanguages(prev => [...new Set([...newLangs, ...prev])])
    }
  }

  const handleLanguageChange = (language: AudioLanguage) => {
    setSelectedLanguage(language)
    setPreferredAudioLanguage(language)
    setPlayerKey(k => k + 1)
    window.dispatchEvent(new CustomEvent('alonetv_language_changed'))
  }

  const sourcesForLanguage = findSourcesForLanguage(videoSources, selectedLanguage)
  const effectiveSources = sourcesForLanguage.length > 0 ? sourcesForLanguage : videoSources

  const handleSeasonChange = (seasonNum: number) => {
    setCurrentSeason(seasonNum)
    setCurrentEpisode(1)
  }

  const handleEpisodeChange = (seasonNum: number, episodeNum: number) => {
    setCurrentSeason(seasonNum)
    setCurrentEpisode(episodeNum)
  }

  return (
    <div className="h-screen bg-black flex flex-col relative">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/80 backdrop-blur-sm border-b border-white/[0.04] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href={`/detail/${type}/${id}`}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm font-medium text-white truncate max-w-[300px] sm:max-w-[500px]">{title}</h1>
            <p className="text-[10px] text-zinc-500 font-mono">{type === 'movie' ? 'Movie' : type === 'tv' ? 'TV Series' : 'Anime'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DubSelector
            availableLanguages={availableLanguages}
            currentLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
          />
          {seasons && seasons.length > 0 && (
            <SeasonSelector
              tvId={tmdbId as number}
              seasons={seasons}
              currentSeason={currentSeason}
              currentEpisode={currentEpisode}
              onSelectSeason={handleSeasonChange}
              onSelectEpisode={handleEpisodeChange}
            />
          )}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-mono bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors"
          >
            Info
          </button>
        </div>
      </div>

      {/* Player */}
      <div className="flex-1 relative">
        {isLoadingSources ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Finding sources...</span>
            </div>
          </div>
        ) : sourceError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-zinc-400 text-sm max-w-md">{sourceError}</p>
            <button
              onClick={() => fetchSources()}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        ) : hlsUrl ? (
          <VidstackPlayer
            key={playerKey}
            src={hlsUrl}
            poster={backdropPath || posterPath}
            title={title}
            selectedAudioLanguage={selectedLanguage}
            onAudioTracksReady={handleAudioTracksReady}
          />
        ) : (
          <VideoPlayer
            key={playerKey}
            sources={effectiveSources.length > 0 ? effectiveSources : videoSources}
          />
        )}
      </div>

      {/* Info panel overlay */}
      {showInfo && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 p-6 flex items-start justify-center overflow-y-auto pt-16">
          <div className="bg-zinc-900/90 rounded-2xl border border-white/[0.06] p-6 max-w-lg w-full max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <button onClick={() => setShowInfo(false)} className="text-zinc-500 hover:text-white text-xl">&times;</button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Audio: <span className="text-purple-400 font-mono">{selectedLanguage}</span>
              </p>
              {hlsAudioTracks.length > 0 && (
                <p className="text-xs text-zinc-500 font-mono">
                  HLS tracks: {hlsAudioTracks.map(t => `${t.label} (${t.language})`).join(', ')}
                </p>
              )}
              <p className="text-xs text-zinc-500 font-mono">
                Servers supporting {selectedLanguage}: {sourcesForLanguage.length}
              </p>
            </div>
          </div>
        </div>
      )}

      <PremiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  )
}
