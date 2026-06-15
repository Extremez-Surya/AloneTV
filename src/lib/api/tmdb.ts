// TMDB API Client
import { cache } from 'react';
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

// Request throttling queue
const requestQueue: (() => Promise<void>)[] = [];
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 1; // Be gentle with flaky upstream connections
const inFlightRequests = new Map<string, Promise<unknown>>();

function isRetryableTMDBError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause = (error as Error & { cause?: { code?: string } }).cause;
  const message = error.message || '';

  return (
    error instanceof TypeError ||
    message.includes('timeout') ||
    message.includes('ECONNRESET') ||
    cause?.code === 'ECONNRESET'
  );
}

function createEmptyTMDBResponse<T>(): T {
  return {
    page: 1,
    results: [],
    total_pages: 0,
    total_results: 0,
  } as T;
}

async function processQueue() {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return;
  }

  activeRequests++;
  const request = requestQueue.shift();
  if (request) {
    try {
      await request();
    } finally {
      activeRequests--;
      processQueue();
    }
  }
}

async function fetchTMDB<T>(
  endpoint: string,
  revalidate = 3600,
  maxRetries = 3
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    return createEmptyTMDBResponse<T>();
  }

  const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}&language=en-US`;
  const requestKey = `${endpoint}::${revalidate}`;

  const existingRequest = inFlightRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const requestPromise = new Promise<T>((resolve) => {
    const makeRequest = async () => {

      // Retry logic with exponential backoff
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch(url, {
            next: { revalidate },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            // Add timeout and connection settings
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          if (!res.ok) {
            if (res.status === 429) {
              // Rate limited - wait and retry
              const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
              await new Promise((r) => setTimeout(r, waitTime));
              continue;
            }
            throw new Error(`TMDB API Error: ${res.status}`);
          }

          const data = await res.json();
          resolve(data);
          return;
        } catch (error) {
          const shouldRetry = attempt < maxRetries && isRetryableTMDBError(error);

          if (shouldRetry) {
            const baseWaitTime = Math.pow(2, attempt) * 750;
            const jitter = Math.floor(Math.random() * 250);
            const waitTime = baseWaitTime + jitter;
            await new Promise((r) => setTimeout(r, waitTime));
            continue;
          }

          break;
        }
      }

      // All retries failed
      resolve(createEmptyTMDBResponse<T>());
    };

    // Add request to queue
    requestQueue.push(makeRequest);
    processQueue();
  });

  inFlightRequests.set(requestKey, requestPromise);

  return requestPromise.finally(() => {
    inFlightRequests.delete(requestKey);
  });
}

// Trending
export const getTrendingMovies = cache(async (): Promise<TMDBMovie[]> => {
  const data = await fetchTMDB<TMDBTrendingResponse<TMDBMovie>>('/trending/movie/week');
  return data.results;
});

export const getTrendingTV = cache(async (): Promise<TMDBTVShow[]> => {
  const data = await fetchTMDB<TMDBTrendingResponse<TMDBTVShow>>('/trending/tv/week');
  return data.results;
});

// Movie Details
export const getMovieDetail = cache(async (id: number): Promise<TMDBMovieDetail> => {
  return fetchTMDB<TMDBMovieDetail>(
    `/movie/${id}?append_to_response=videos,credits,images`,
    3600
  );
});

// TV Show Details
export const getTVShowDetail = cache(async (id: number): Promise<TMDBTVShowDetail> => {
  return fetchTMDB<TMDBTVShowDetail>(
    `/tv/${id}?append_to_response=videos,credits,images,seasons,external_ids`,
    3600
  );
});

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
  const cleanQuery = query.trim().toLowerCase();

  // Hardcoded standard TMDB Genre ID maps for fast lookup
  const MOVIE_GENRES: Record<string, number> = {
    action: 28,
    adventure: 12,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    fantasy: 14,
    history: 36,
    horror: 27,
    music: 10402,
    mystery: 9648,
    romance: 10749,
    'science fiction': 878,
    'sci-fi': 878,
    thriller: 53,
    war: 10752,
    western: 37,
  };

  const TV_GENRES: Record<string, number> = {
    'action & adventure': 10759,
    action: 10759,
    adventure: 10759,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    kids: 10762,
    mystery: 9648,
    news: 10763,
    reality: 10764,
    'sci-fi & fantasy': 10765,
    'sci-fi': 10765,
    fantasy: 10765,
    soap: 10766,
    talk: 10767,
    'war & politics': 10768,
    war: 10768,
    politics: 10768,
  };

  // Check if query matches a genre name (exact or prefix)
  const matchedMovieGenreKey = Object.keys(MOVIE_GENRES).find(
    (k) => k === cleanQuery || k.startsWith(cleanQuery)
  );
  const matchedTVGenreKey = Object.keys(TV_GENRES).find(
    (k) => k === cleanQuery || k.startsWith(cleanQuery)
  );

  const movieGenreId = matchedMovieGenreKey ? MOVIE_GENRES[matchedMovieGenreKey] : null;
  const tvGenreId = matchedTVGenreKey ? TV_GENRES[matchedTVGenreKey] : null;

  // 1. Kick off standard multi-search in parallel
  const multiSearchPromise = fetchTMDB<TMDBSearchResponse>(
    `/search/multi?query=${encodeURIComponent(query)}`,
    600
  ).then((data) =>
    (data.results || []).filter(
      (item) => item.media_type === 'movie' || item.media_type === 'tv'
    )
  );

  // 2. Fetch genre items in parallel if matched
  let genreResults: TMDBSearchResult[] = [];
  if (movieGenreId || tvGenreId) {
    try {
      const fetchPromises: Promise<void>[] = [];

      if (movieGenreId) {
        fetchPromises.push(
          getMoviesByGenre(movieGenreId).then((movies) => {
            movies.forEach((m) => {
              genreResults.push({
                id: m.id,
                media_type: 'movie',
                title: m.title,
                overview: m.overview,
                poster_path: m.poster_path,
                backdrop_path: m.backdrop_path,
                release_date: m.release_date,
                vote_average: m.vote_average,
                genre_ids: m.genre_ids,
              });
            });
          })
        );
      }

      if (tvGenreId) {
        fetchPromises.push(
          getTVShowsByGenre(tvGenreId).then((shows) => {
            shows.forEach((s) => {
              genreResults.push({
                id: s.id,
                media_type: 'tv',
                name: s.name,
                overview: s.overview,
                poster_path: s.poster_path,
                backdrop_path: s.backdrop_path,
                first_air_date: s.first_air_date,
                vote_average: s.vote_average,
                genre_ids: s.genre_ids,
              });
            });
          })
        );
      }

      await Promise.all(fetchPromises);
      // Sort the genre results by score/rating
      genreResults.sort((a, b) => b.vote_average - a.vote_average);
    } catch (e) {
      console.error('Failed to fetch genre search results:', e);
    }
  }

  // 3. Await standard results
  const multiResults = await multiSearchPromise;

  // 4. Merge and deduplicate
  const combined = [...genreResults, ...multiResults];
  const seen = new Set<string>();
  const deduplicated = combined.filter((item) => {
    const key = `${item.media_type}-${item.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return deduplicated;
}

// Discover
export async function discoverMovies(params: {
  genre_id?: number;
  page?: number;
  sort_by?: string;
  filters?: Record<string, string | number | boolean | undefined | null>;
}): Promise<{ results: TMDBMovie[]; total_pages: number }> {
  const { genre_id, page = 1, sort_by = 'popularity.desc' } = params;
  const filters = params.filters ?? {};
  let endpoint = `/discover/movie?sort_by=${sort_by}&page=${page}`;
  if (genre_id) endpoint += `&with_genres=${genre_id}`;
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      endpoint += `&${key}=${encodeURIComponent(String(value))}`;
    }
  });

  const data = await fetchTMDB<{ results: TMDBMovie[]; total_pages: number }>(endpoint);
  return data;
}

export async function discoverTVShows(params: {
  genre_id?: number;
  page?: number;
  sort_by?: string;
  filters?: Record<string, string | number | boolean | undefined | null>;
}): Promise<{ results: TMDBTVShow[]; total_pages: number }> {
  const { genre_id, page = 1, sort_by = 'popularity.desc' } = params;
  const filters = params.filters ?? {};
  let endpoint = `/discover/tv?sort_by=${sort_by}&page=${page}`;
  if (genre_id) endpoint += `&with_genres=${genre_id}`;
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      endpoint += `&${key}=${encodeURIComponent(String(value))}`;
    }
  });

  const data = await fetchTMDB<{ results: TMDBTVShow[]; total_pages: number }>(endpoint);
  return data;
}

// Genres
export const getMovieGenres = cache(async (): Promise<TMDBGenre[]> => {
  const data = await fetchTMDB<{ genres: TMDBGenre[] }>('/genre/movie/list');
  return data.genres;
});

export const getTVGenres = cache(async (): Promise<TMDBGenre[]> => {
  const data = await fetchTMDB<{ genres: TMDBGenre[] }>('/genre/tv/list');
  return data.genres;
});

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

// Category Functions - Top Rated
export const getTopRatedMovies = cache(async (): Promise<TMDBMovie[]> => {
  const data = await fetchTMDB<{ results: TMDBMovie[] }>('/movie/top_rated?page=1');
  return data.results;
});

export const getTopRatedTV = cache(async (): Promise<TMDBTVShow[]> => {
  const data = await fetchTMDB<{ results: TMDBTVShow[] }>('/tv/top_rated?page=1');
  return data.results;
});

// Now Playing / Currently Airing
export const getNowPlayingMovies = cache(async (): Promise<TMDBMovie[]> => {
  const data = await fetchTMDB<{ results: TMDBMovie[] }>('/movie/now_playing?page=1');
  return data.results;
});

export const getOnAirTV = cache(async (): Promise<TMDBTVShow[]> => {
  const data = await fetchTMDB<{ results: TMDBTVShow[] }>('/tv/on_the_air?page=1');
  return data.results;
});

// Upcoming
export const getUpcomingMovies = cache(async (): Promise<TMDBMovie[]> => {
  const data = await fetchTMDB<{ results: TMDBMovie[] }>('/movie/upcoming?page=1');
  return data.results;
});

// By Genre
export async function getMoviesByGenre(genreId: number): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<{ results: TMDBMovie[] }>(
    `/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=1`
  );
  return data.results;
}

export async function getTVShowsByGenre(genreId: number): Promise<TMDBTVShow[]> {
  const data = await fetchTMDB<{ results: TMDBTVShow[] }>(
    `/discover/tv?with_genres=${genreId}&sort_by=popularity.desc&page=1`
  );
  return data.results;
}

// High Rated (8.0+)
export const getHighRatedMovies = cache(async (): Promise<TMDBMovie[]> => {
  const data = await fetchTMDB<{ results: TMDBMovie[] }>(
    '/discover/movie?vote_average.gte=8&sort_by=vote_average.desc&page=1'
  );
  return data.results;
});

export const getHighRatedTV = cache(async (): Promise<TMDBTVShow[]> => {
  const data = await fetchTMDB<{ results: TMDBTVShow[] }>(
    '/discover/tv?vote_average.gte=8&sort_by=vote_average.desc&page=1'
  );
  return data.results;
});

// Popular
export const getPopularMovies = cache(async (): Promise<TMDBMovie[]> => {
  const data = await fetchTMDB<{ results: TMDBMovie[] }>('/movie/popular?page=1');
  return data.results;
});

export const getPopularTV = cache(async (): Promise<TMDBTVShow[]> => {
  const data = await fetchTMDB<{ results: TMDBTVShow[] }>('/tv/popular?page=1');
  return data.results;
});

// Get TV Season Details
export const getTVSeasonDetail = cache(async (tvId: number, seasonNumber: number): Promise<any> => {
  return fetchTMDB<any>(
    `/tv/${tvId}/season/${seasonNumber}`,
    3600
  );
});

// Get Collection Details
export const getCollectionDetail = cache(async (collectionId: number): Promise<any> => {
  return fetchTMDB<any>(
    `/collection/${collectionId}`,
    3600
  );
});

// Export image helper
export { getTMDBImageUrl };

export async function findByImdbId(imdbId: string): Promise<{
  movie_results: TMDBMovie[];
  tv_results: TMDBTVShow[];
} | null> {
  try {
    return await fetchTMDB<{
      movie_results: TMDBMovie[];
      tv_results: TMDBTVShow[];
    }>(`/find/${imdbId}?external_source=imdb_id`);
  } catch (error) {
    console.error('TMDB findByImdbId error:', error);
    return null;
  }
}

