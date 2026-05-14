'use client';

import { useState, useEffect } from 'react';

interface Season {
  season_number: number;
  name: string;
  episode_count?: number;
  poster_path?: string;
}

interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  season_number: number;
  episode_number: number;
  air_date: string;
  vote_average: number;
}

interface SeasonSelectorProps {
  seasons: Season[];
  onSelectSeason: (seasonNumber: number) => void;
  onSelectEpisode: (seasonNumber: number, episodeNumber: number) => void;
  currentSeason: number;
  currentEpisode: number;
}

export default function SeasonSelector({
  seasons,
  onSelectSeason,
  onSelectEpisode,
  currentSeason,
  currentEpisode
}: SeasonSelectorProps) {
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [selectedSeasonData, setSelectedSeasonData] = useState<Season | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Fetch episodes when season changes
  useEffect(() => {
    const season = seasons.find(s => s.season_number === currentSeason);
    if (season) {
      setSelectedSeasonData(season);
    }
  }, [currentSeason, seasons]);

  const handleSeasonChange = (seasonNum: number) => {
    onSelectSeason(seasonNum);
    setShowSeasonDropdown(false);
  };

  const handleEpisodeClick = (episodeNum: number) => {
    onSelectEpisode(currentSeason, episodeNum);
  };

  // Generate episode numbers (1 to 10 or whatever is available)
  const getEpisodeNumbers = (season: Season | null): number[] => {
    const count = season?.episode_count || 12;
    return Array.from({ length: count }, (_, i) => i + 1);
  };

  return (
    <div className="space-y-4">
      {/* Season Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-400">Season:</label>
        <div className="relative">
          <button
            onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <span>Season {currentSeason}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Season Dropdown */}
          {showSeasonDropdown && (
            <div className="absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto bg-bg-card border border-white/10 rounded-xl shadow-xl z-50">
              {seasons.map((season) => (
                <button
                  key={season.season_number}
                  onClick={() => handleSeasonChange(season.season_number)}
                  className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between ${
                    currentSeason === season.season_number ? 'bg-accent-purple/20 text-accent-purple' : 'text-white'
                  }`}
                >
                  <div>
                    <div className="font-medium">{season.name || `Season ${season.season_number}`}</div>
                    <div className="text-xs text-gray-400">{season.episode_count || '?'} episodes</div>
                  </div>
                  {currentSeason === season.season_number && (
                    <svg className="w-5 h-5 text-accent-purple" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-gray-500">|</span>

        {/* Episode Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Episode:</label>
          <div className="flex gap-1 flex-wrap max-w-[300px]">
            {getEpisodeNumbers(selectedSeasonData || { season_number: currentSeason, episode_count: 12, name: '' }).map((epNum) => (
              <button
                key={epNum}
                onClick={() => handleEpisodeClick(epNum)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  currentEpisode === epNum
                    ? 'bg-accent-purple text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {epNum}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Episode Grid */}
      <div>
        <h4 className="text-sm text-gray-400 mb-2">
          Episodes in Season {currentSeason}
        </h4>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {getEpisodeNumbers(selectedSeasonData || { season_number: currentSeason, episode_count: 12, name: '' }).map((epNum) => (
            <button
              key={epNum}
              onClick={() => handleEpisodeClick(epNum)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                currentEpisode === epNum
                  ? 'bg-accent-purple text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              EP {epNum}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}