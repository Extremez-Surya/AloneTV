// TVmaze API Client (Public, No API Key Required)
const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

export interface TVMazeShow {
  id: number;
  name: string;
  type: string;
  language: string;
  genres: string[];
  premiered: string;
  rating: { average: number | null };
  image: { medium: string; original: string } | null;
  summary: string | null;
  externals: {
    tvrage: number | null;
    thetvdb: number | null;
    imdb: string | null;
  };
}

export async function searchTVMaze(query: string): Promise<any[]> {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/search/shows?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data || [];
  } catch (error) {
    console.error('TVmaze search error:', error);
    return [];
  }
}

export async function getTVMazeShowDetail(id: number): Promise<TVMazeShow | null> {
  try {
    const res = await fetch(`${TVMAZE_BASE_URL}/shows/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('TVmaze show detail error:', error);
    return null;
  }
}