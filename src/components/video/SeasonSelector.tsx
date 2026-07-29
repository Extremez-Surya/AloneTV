'use client';

import { useState, useEffect } from 'react';

interface Season {
  season_number: number;
  name: string;
  episode_count?: number;
  poster_path?: string;
}

interface Episode {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  vote_average: number;
  air_date?: string;
  runtime?: number;
}

interface SeasonSelectorProps {
  tvId: number | string;
  seasons: Season[];
  onSelectSeason: (seasonNumber: number) => void;
  onSelectEpisode: (seasonNumber: number, episodeNumber: number) => void;
  currentSeason: number;
  currentEpisode: number;
}

export default function SeasonSelector({
  tvId,
  seasons,
  onSelectSeason,
  onSelectEpisode,
  currentSeason,
  currentEpisode
}: SeasonSelectorProps) {
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [showEpisodeDropdown, setShowEpisodeDropdown] = useState(false);
  const [selectedSeasonData, setSelectedSeasonData] = useState<Season | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Sync current season data details
  useEffect(() => {
    const season = seasons.find(s => s.season_number === currentSeason);
    if (season) {
      setSelectedSeasonData(season);
    }
  }, [currentSeason, seasons]);

  // Fetch episodes from proxy API route when season changes
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!tvId) return;
      setLoadingEpisodes(true);
      try {
        const res = await fetch(`/api/season?id=${tvId}&season=${currentSeason}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.seasonDetail?.episodes) {
            setEpisodes(data.seasonDetail.episodes);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch rich episodes list:', err);
      } finally {
        setLoadingEpisodes(false);
      }
      setEpisodes([]);
    };
    fetchEpisodes();
  }, [tvId, currentSeason]);

  const handleSeasonChange = (seasonNum: number) => {
    onSelectSeason(seasonNum);
    setShowSeasonDropdown(false);
  };

  const handleEpisodeClick = (episodeNum: number) => {
    onSelectEpisode(currentSeason, episodeNum);
    setShowEpisodeDropdown(false);
  };

  // Generate fallback episode list if API is fetching or fails
  const getFallbackEpisodes = (): Episode[] => {
    const count = selectedSeasonData?.episode_count || 12;
    return Array.from({ length: count }, (_, i) => ({
      episode_number: i + 1,
      name: `Episode ${i + 1}`,
      overview: 'No description available for this episode.',
      still_path: null,
      vote_average: 0
    }));
  };

  const activeEpisodes = episodes.length > 0 ? episodes : getFallbackEpisodes();
  const currentEpData = activeEpisodes.find(e => e.episode_number === currentEpisode);

  return (
    <div className="text-left">
      {/* Selector controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Season Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">Season:</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSeasonDropdown(!showSeasonDropdown);
                setShowEpisodeDropdown(false);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium text-xs sm:text-sm border border-white/5 transition-colors focus:outline-none"
            >
              <span>{selectedSeasonData?.name || `Season ${currentSeason}`}</span>
              <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Season Dropdown Options */}
            {showSeasonDropdown && (
              <div className="absolute top-full left-0 mt-2 w-60 max-h-72 overflow-y-auto bg-[#0f0f14] border border-white/10 rounded-xl shadow-2xl z-50 animate-fade-in scrollbar-thin scrollbar-thumb-white/20">
                {seasons.map((season) => (
                  <button
                    type="button"
                    key={season.season_number}
                    onClick={() => handleSeasonChange(season.season_number)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors flex items-center justify-between text-xs sm:text-sm ${
                      currentSeason === season.season_number ? 'bg-accent-purple/20 text-accent-purple font-semibold' : 'text-white'
                    }`}
                  >
                    <div>
                      <div>{season.name || `Season ${season.season_number}`}</div>
                      <div className="text-[10px] text-text-muted font-mono mt-0.5">{season.episode_count || '?'} episodes</div>
                    </div>
                    {currentSeason === season.season_number && (
                      <svg className="w-4 h-4 text-accent-purple fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Episode Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">Episode:</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowEpisodeDropdown(!showEpisodeDropdown);
                setShowSeasonDropdown(false);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium text-xs sm:text-sm border border-white/5 transition-colors focus:outline-none"
            >
              <span className="truncate max-w-[200px] sm:max-w-[300px]">
                Episode {currentEpisode}{currentEpData?.name ? `: ${currentEpData.name}` : ''}
              </span>
              <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Episode Dropdown Options */}
            {showEpisodeDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 max-h-80 overflow-y-auto bg-[#0f0f14] border border-white/10 rounded-xl shadow-2xl z-50 animate-fade-in scrollbar-thin scrollbar-thumb-white/20">
                {activeEpisodes.map((ep) => (
                  <button
                    type="button"
                    key={ep.episode_number}
                    onClick={() => handleEpisodeClick(ep.episode_number)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors flex items-center justify-between text-xs sm:text-sm border-b border-white/5 last:border-0 ${
                      currentEpisode === ep.episode_number ? 'bg-accent-purple/20 text-accent-purple font-semibold' : 'text-white'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium truncate">EP {ep.episode_number}: {ep.name || `Episode ${ep.episode_number}`}</div>
                      {ep.overview && (
                        <div className="text-[10px] text-text-muted truncate mt-0.5">{ep.overview}</div>
                      )}
                    </div>
                    {currentEpisode === ep.episode_number && (
                      <svg className="w-4 h-4 text-accent-purple fill-current shrink-0" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loadingEpisodes && (
          <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono uppercase tracking-wider">
            <div className="w-3.5 h-3.5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>
    </div>
  );
}