// TVMaze API Client
const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

export interface TVMazeShow {
  id: number;
  name: string;
  summary: string;
  image: { medium: string; original: string };
  premiered: string;
  ended: string | null;
  rating: { average: number | null };
  genres: string[];
  status: string;
  runtime: number | null;
  schedule: { time: string; days: string[] };
  network: { name: string } | null;
  webChannel: { name: string } | null;
}

export interface TVMazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
  runtime: number | null;
  summary: string;
}

// Search shows
export async function searchTVShows(query: string): Promise<TVMazeShow[]> {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/search/shows?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.map((item: any) => item.show);
  } catch (error) {
    console.error('TVMaze search error:', error);
    return [];
  }
}

// Get show details
export async function getTVShowById(tvmazeId: number): Promise<TVMazeShow | null> {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/shows/${tvmazeId}`);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('TVMaze get show error:', error);
    return null;
  }
}

// Get show episodes
export async function getShowEpisodes(tvmazeId: number): Promise<TVMazeEpisode[]> {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/shows/${tvmazeId}/episodes`);
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('TVMaze episodes error:', error);
    return [];
  }
}

// Get show seasons
export async function getShowSeasons(tvmazeId: number): Promise<any[]> {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/shows/${tvmazeId}/seasons`);
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('TVMaze seasons error:', error);
    return [];
  }
}

// Get all shows (popular)
export async function getPopularTVShows(page = 1): Promise<TVMazeShow[]> {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/shows?page=${page}`);
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('TVMaze popular error:', error);
    return [];
  }
}

// Get episodes by season
export async function getEpisodesBySeason(tvmazeId: number, season: number): Promise<TVMazeEpisode[]> {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/seasons/${tvmazeId}/episodes`);
    if (!res.ok) return [];
    const allEpisodes = await res.json();
    return allEpisodes.filter((ep: TVMazeEpisode) => ep.season === season);
  } catch (error) {
    console.error('TVMaze season episodes error:', error);
    return [];
  }
}