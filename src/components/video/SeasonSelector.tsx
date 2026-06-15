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

  return (
    <div className="space-y-5 text-left">
      {/* Selector controls */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">Season:</label>
        <div className="relative">
          <button
            onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium text-xs sm:text-sm border border-white/5 transition-colors focus:outline-none"
          >
            <span>{selectedSeasonData?.name || `Season ${currentSeason}`}</span>
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Options */}
          {showSeasonDropdown && (
            <div className="absolute top-full left-0 mt-2 w-60 max-h-72 overflow-y-auto bg-[#0f0f14] border border-white/10 rounded-xl shadow-2xl z-50 animate-fade-in scrollbar-hide">
              {seasons.map((season) => (
                <button
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
        
        {loadingEpisodes && (
          <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono uppercase tracking-wider">
            <div className="w-3.5 h-3.5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Episode Card Deck Carousel */}
      <div className="relative group/episodes">
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide scroll-smooth">
          {activeEpisodes.map((ep) => {
            const isCurrent = ep.episode_number === currentEpisode;
            const imgUrl = ep.still_path 
              ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
              : null;

            return (
              <button
                key={ep.episode_number}
                onClick={() => handleEpisodeClick(ep.episode_number)}
                className={`flex-shrink-0 w-[240px] sm:w-[280px] bg-[#0c0c11]/45 border text-left rounded-xl overflow-hidden transition-all duration-300 relative focus:outline-none ${
                  isCurrent 
                    ? 'border-accent-purple bg-accent-purple/5 ring-1 ring-accent-purple/35 shadow-md shadow-accent-purple/20' 
                    : 'border-border/60 hover:border-border hover:bg-[#0f0f15]/80'
                }`}
              >
                {/* Backdrop Thumbnail */}
                <div className="relative aspect-video w-full bg-[#050508] border-b border-border/30 overflow-hidden group">
                  {imgUrl ? (
                    <img 
                      src={imgUrl} 
                      alt={ep.name} 
                      className={`w-full h-full object-cover transition-transform duration-500 ${isCurrent ? 'scale-105' : 'group-hover:scale-105'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-muted/20">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold font-mono tracking-wider text-white backdrop-blur-sm">
                    EP {ep.episode_number}
                  </span>
                  
                  {isCurrent && (
                    <div className="absolute inset-0 bg-accent-purple/10 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-accent-purple text-white flex items-center justify-center shadow-lg animate-pulse">
                        <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Details */}
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-text-primary truncate">{ep.name || `Episode ${ep.episode_number}`}</h4>
                    {ep.vote_average > 0 && (
                      <span className="text-[10px] font-bold text-yellow-500 font-mono shrink-0">
                        ★ {ep.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed">
                    {ep.overview || 'No overview details available for this episode.'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}