// TMDB API Client
import {
  TMDBMovie,
  TMDBTVShow,
  TMDBMovieDetail,
  TMDBTVShowDetail,
  TMDBSearchResponse,
  TMDBTrendingResponse,
  TMDBSearchResult,
  TMDBVideo,
  TMDBGenre,
} from '@/types/tmdb';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

function getTMDBImageUrl(
  path: string | null,
  size: 'w780' | 'w500' | 'w342' | 'w185' | 'original' | 'h632' = 'w780'
): string | null {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

async function fetchTMDB<T>(endpoint: string, revalidate = 3600): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    console.warn('TMDB_API_KEY is not configured. Using fallback data.');
    // Return fallback data
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    } as T;
  }

  const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}&language=en-US`;

  try {
    const res = await fetch(url, {
      next: { revalidate },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`TMDB API Error: ${res.status} ${res.statusText}`);
      return { page: 1, results: [], total_pages: 0, total_results: 0 } as T;
    }

    return res.json();
  } catch (error) {
    console.error('TMDB fetch error:', error);
    return { page: 1, results: [], total_pages: 0, total_results: 0 } as T;
  }
}

// Trending
export async function getTrendingMovies(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<TMDBTrendingResponse<TMDBMovie>>('/trending/movie/week');
  return data.results;
}

export async function getTrendingTV(): Promise<TMDBTVShow[]> {
  const data = await fetchTMDB<TMDBTrendingResponse<TMDBTVShow>>('/trending/tv/week');
  return data.results;
}

// Movie Details
export async function getMovieDetail(id: number): Promise<TMDBMovieDetail> {
  return fetchTMDB<TMDBMovieDetail>(
    `/movie/${id}?append_to_response=videos,credits,images`,
    3600
  );
}

// TV Show Details
export async function getTVShowDetail(id: number): Promise<TMDBTVShowDetail> {
  return fetchTMDB<TMDBTVShowDetail>(
    `/tv/${id}?append_to_response=videos,credits,images,seasons,external_ids`,
    3600
  );
}

// Get External IDs (IMDB, etc.)
export async function getExternalIds(tmdbId: number, type: 'movie' | 'tv'): Promise<{ imdb_id?: string; tvdb_id?: string }> {
  try {
    const data = await fetchTMDB<{ imdb_id?: string; tvdb_id?: string }>(
      `/${type}/${tmdbId}/external_ids`
    );
    return data;
  } catch (error) {
    console.error('Failed to get external IDs:', error);
    return {};
  }
}

// Search
export async function searchMulti(query: string): Promise<TMDBSearchResult[]> {
  const data = await fetchTMDB<TMDBSearchResponse>(
    `/search/multi?query=${encodeURIComponent(query)}`,
    600
  );
  return (data.results || []).filter(
    (item) => item.media_type === 'movie' || item.media_type === 'tv'
  );
}

// Discover
export async function discoverMovies(params: {
  genre_id?: number;
  page?: number;
  sort_by?: string;
}): Promise<{ results: TMDBMovie[]; total_pages: number }> {
  const { genre_id, page = 1, sort_by = 'popularity.desc' } = params;
  let endpoint = `/discover/movie?sort_by=${sort_by}&page=${page}`;
  if (genre_id) endpoint += `&with_genres=${genre_id}`;

  const data = await fetchTMDB<{ results: TMDBMovie[]; total_pages: number }>(endpoint);
  return data;
}

export async function discoverTVShows(params: {
  genre_id?: number;
  page?: number;
  sort_by?: string;
}): Promise<{ results: TMDBTVShow[]; total_pages: number }> {
  const { genre_id, page = 1, sort_by = 'popularity.desc' } = params;
  let endpoint = `/discover/tv?sort_by=${sort_by}&page=${page}`;
  if (genre_id) endpoint += `&with_genres=${genre_id}`;

  const data = await fetchTMDB<{ results: TMDBTVShow[]; total_pages: number }>(endpoint);
  return data;
}

// Genres
export async function getMovieGenres(): Promise<TMDBGenre[]> {
  const data = await fetchTMDB<{ genres: TMDBGenre[] }>('/genre/movie/list');
  return data.genres;
}

export async function getTVGenres(): Promise<TMDBGenre[]> {
  const data = await fetchTMDB<{ genres: TMDBGenre[] }>('/genre/tv/list');
  return data.genres;
}

// Similar
export async function getSimilarMovies(movieId: number): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<{ results: TMDBMovie[] }>(`/movie/${movieId}/similar`);
  return data.results;
}

export async function getSimilarTVShows(tvId: number): Promise<TMDBTVShow[]> {
  const data = await fetchTMDB<{ results: TMDBTVShow[] }>(`/tv/${tvId}/similar`);
  return data.results;
}

// Get Trailer
export async function getMovieTrailer(movieId: number): Promise<TMDBVideo | null> {
  const data = await fetchTMDB<{ results: TMDBVideo[] }>(`/movie/${movieId}/videos`);
  const trailer = data.results.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
  );
  return trailer || data.results.find((v) => v.type === 'Trailer') || null;
}

export async function getTVTrailer(tvId: number): Promise<TMDBVideo | null> {
  const data = await fetchTMDB<{ results: TMDBVideo[] }>(`/tv/${tvId}/videos`);
  const trailer = data.results.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
  );
  return trailer || data.results.find((v) => v.type === 'Trailer') || null;
}

// Export image helper
export { getTMDBImageUrl };