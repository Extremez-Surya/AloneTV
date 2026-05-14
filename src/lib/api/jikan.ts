// Jikan API Client (MyAnimeList)
import { JikanAnime, JikanTopAnimeResponse } from '@/types/jikan';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Rate limit: 3 requests per second - throttle utility
const requestQueue: (() => void)[] = [];
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 350; // ms between requests

async function throttle<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;

      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }

      lastRequestTime = Date.now();
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    requestQueue.push(execute);
    if (requestQueue.length === 1) {
      execute();
    }
  });
}

// Process queue
setInterval(() => {
  if (requestQueue.length > 1) {
    requestQueue.shift();
    requestQueue[0]?.();
  }
}, MIN_REQUEST_INTERVAL);

async function fetchJikan<T>(endpoint: string, revalidate = 3600): Promise<T> {
  return throttle(async () => {
    const url = `${JIKAN_BASE_URL}${endpoint}`;

    try {
      const res = await fetch(url, {
        next: { revalidate },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle rate limiting (429) with retry
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
        const retryRes = await fetch(url, {
          next: { revalidate },
          headers: { 'Content-Type': 'application/json' },
        });
        if (!retryRes.ok) {
          return { data: [] } as T; // Return empty on persistent error
        }
        return retryRes.json();
      }

      if (!res.ok) {
        console.warn(`Jikan API returned ${res.status}`);
        return { data: [] } as T; // Return empty data on error
      }

      return res.json();
    } catch (error) {
      console.error('Jikan fetch error:', error);
      return { data: [] } as T;
    }
  });
}

// Top Anime
export async function getTopAnime(
  page = 1,
  filter?: 'airing' | 'upcoming' | 'bypopularity' | 'favorite'
): Promise<JikanAnime[]> {
  let endpoint = `/top/anime?page=${page}&limit=25`;
  if (filter) {
    endpoint += `&filter=${filter}`;
  }

  const data = await fetchJikan<JikanTopAnimeResponse>(endpoint);
  return data.data;
}

// Get Anime Details
export async function getAnimeDetail(id: number): Promise<JikanAnime> {
  const data = await fetchJikan<{ data: JikanAnime }>(`/anime/${id}/full`);
  return data.data;
}

// Search Anime
export async function searchAnime(
  query: string,
  page = 1
): Promise<JikanAnime[]> {
  const data = await fetchJikan<JikanTopAnimeResponse>(
    `/anime?q=${encodeURIComponent(query)}&page=${page}&limit=25`
  );
  return data.data;
}

// Get Anime Episodes
export async function getAnimeEpisodes(
  id: number,
  page = 1
): Promise<{ data: Array<{
  mal_id: number;
  title: string;
  aired: string;
  score: number | null;
}> }> {
  return fetchJikan(`/anime/${id}/episodes?page=${page}`);
}

// Get Anime Characters
export async function getAnimeCharacters(
  id: number
): Promise<{ data: Array<{
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  role: string;
  voice_actors: Array<{
    language: string;
    name: string;
    image: { jpg: { image_url: string } };
  }>;
}> }> {
  return fetchJikan(`/anime/${id}/characters`);
}

// Airing Schedule
export async function getAiringAnime(): Promise<JikanAnime[]> {
  const data = await fetchJikan<JikanTopAnimeResponse>('/top/anime?filter=airing&limit=20');
  return data.data;
}