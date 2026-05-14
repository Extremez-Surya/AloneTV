'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getTMDBImageUrl } from '@/lib/api/tmdb';
import { getAllVideoSources, type VideoSource } from '@/lib/api/videoSources';
import VideoPlayer from '@/components/video/VideoPlayer';
import SeasonSelector from '@/components/video/SeasonSelector';
import ContentCard from '@/components/content/ContentCard';

interface Season {
  season_number: number;
  name: string;
  episode_count?: number;
  poster_path?: string;
}

interface WatchPageClientProps {
  type: string;
  id: string;
  tmdbId: number;
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
}

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
  isAnime
}: WatchPageClientProps) {
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [sourceError, setSourceError] = useState<string | null>(null);

  // Use TMDB ID for video sources
  const videoId = String(tmdbId);

  // Fetch video sources asynchronously
  useEffect(() => {
    async function fetchSources() {
      try {
        setIsLoadingSources(true);
        setSourceError(null);

        let sources: VideoSource[] = [];

        if (isAnime) {
          sources = await getAllVideoSources('anime', id, undefined, currentEpisode);
        } else if (type === 'tv' && seasons && seasons.length > 0) {
          sources = await getAllVideoSources('tv', videoId, currentSeason, currentEpisode);
        } else {
          sources = await getAllVideoSources('movie', videoId);
        }

        setVideoSources(sources);

        if (sources.length === 0) {
          setSourceError('No video sources available. Please try again later.');
        }
      } catch (error) {
        console.error('Failed to load video sources:', error);
        setSourceError('Failed to load video sources');
      } finally {
        setIsLoadingSources(false);
      }
    }

    fetchSources();
  }, [type, id, videoId, currentSeason, currentEpisode, isAnime]);

  const handleSeasonChange = (seasonNum: number) => {
    setCurrentSeason(seasonNum);
    setCurrentEpisode(1);
  };

  const handleEpisodeChange = (seasonNum: number, episodeNum: number) => {
    setCurrentSeason(seasonNum);
    setCurrentEpisode(episodeNum);
  };

  const backdropUrl = backdropPath ? (backdropPath.startsWith('http') ? backdropPath : getTMDBImageUrl(backdropPath, 'original')) : null;
  const posterUrl = posterPath ? (posterPath.startsWith('http') ? posterPath : getTMDBImageUrl(posterPath, 'w780')) : null;

  return (
    <div className="min-h-screen pt-[72px]">
      {/* Backdrop */}
      {backdropUrl && (
        <div className="fixed inset-0 z-0">
          <img src={backdropUrl} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-bg-primary" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Video Player Section */}
          <div className="flex-1">
            {/* Loading State */}
            {isLoadingSources && (
              <div className="aspect-video bg-black rounded-xl flex items-center justify-center border border-white/10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400">Loading video sources...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!isLoadingSources && sourceError && (
              <div className="aspect-video bg-black rounded-xl flex items-center justify-center border border-red-500/50">
                <div className="flex flex-col items-center gap-3 text-center">
                  <svg
                    className="w-12 h-12 text-red-500"
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
                  <p className="text-gray-400 max-w-xs">{sourceError}</p>
                </div>
              </div>
            )}

            {/* Video Player */}
            {!isLoadingSources && videoSources.length > 0 && (
              <VideoPlayer sources={videoSources} title={title} />
            )}

            {/* Season/Episode Selector for TV Shows */}
            {type === 'tv' && seasons && seasons.length > 0 && (
              <div className="mt-6 p-4 bg-bg-card rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Select Episode</h3>
                <SeasonSelector
                  seasons={seasons}
                  onSelectSeason={handleSeasonChange}
                  onSelectEpisode={handleEpisodeChange}
                  currentSeason={currentSeason}
                  currentEpisode={currentEpisode}
                />
              </div>
            )}

            {/* Anime Episodes */}
            {isAnime && (
              <div className="mt-6 p-4 bg-bg-card rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Episodes</h3>
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((ep) => (
                    <button
                      key={ep}
                      onClick={() => handleEpisodeChange(1, ep)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentEpisode === ep
                          ? 'bg-accent-purple text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {ep}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="lg:w-[400px]">
            {/* Poster */}
            {posterUrl && (
              <div className="hidden lg:block relative aspect-[2/3] rounded-xl overflow-hidden mb-6">
                <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Title & Meta */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                {voteAverage > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {voteAverage.toFixed(1)}
                  </span>
                )}
                {releaseDate && <span>{releaseDate.split('-')[0]}</span>}
                {genres.slice(0, 2).map((genre) => (
                  <span key={genre.id} className="px-2 py-1 bg-white/10 rounded text-xs">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Current Selection Info */}
            {(type === 'tv' || isAnime) && (
              <div className="mb-4 p-3 bg-accent-purple/20 rounded-lg">
                <p className="text-white font-medium">
                  {isAnime ? 'Anime' : `Season ${currentSeason}`} • Episode {currentEpisode}
                </p>
              </div>
            )}

            {/* Overview */}
            {overview && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-5">{overview}</p>
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Cast</h3>
                <div className="grid grid-cols-5 gap-3">
                  {cast.slice(0, 10).map((person) => (
                    <div key={person.id} className="text-center">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-bg-card">
                        {person.profile_path ? (
                          <img
                            src={getTMDBImageUrl(person.profile_path, 'w185') || ''}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-accent-purple/20">
                            <span className="text-lg">?</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white truncate">{person.name}</p>
                      <p className="text-xs text-gray-500 truncate">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Content */}
        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-white mb-6">Similar Titles</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {similar.slice(0, 10).map((item: any, index: number) => (
                <ContentCard key={item.id} item={item} type={type as 'movie' | 'tv'} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}