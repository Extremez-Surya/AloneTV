/**
 * Video Source Management
 * Fetches direct .m3u8 HLS links via Consumet API
 * No iframe restrictions - clean, ad-free streaming
 */

export interface VideoSource {
  name: string;
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'iframe';
  isM3u8?: boolean;
}

interface CacheEntry {
  sources: VideoSource[];
  timestamp: number;
}

// Simple in-memory cache (5 minutes)
const sourceCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Fetch video sources from our backend API
 * which uses Consumet to scrape direct links
 */
export async function fetchVideoSources(
  type: 'movie' | 'tv' | 'anime',
  id: string,
  season?: number,
  episode?: number
): Promise<VideoSource[]> {
  // Create cache key
  const cacheKey = `${type}-${id}-${season || 0}-${episode || 0}`;
  
  // Check cache
  const cached = sourceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.sources;
  }

  try {
    const params = new URLSearchParams({
      id,
      type: type === 'anime' ? 'tv' : type,
      anime: (type === 'anime').toString(),
      ...(season && { season: season.toString() }),
      ...(episode && { episode: episode.toString() })
    });

    const res = await fetch(`/api/video?${params}`, {
      next: { revalidate: 300 } // 5 minute revalidation
    });

    if (!res.ok) {
      // Fallback to backup sources
      return getBackupSources(type, id);
    }

    const data = await res.json();
    
    if (data.sources && Array.isArray(data.sources)) {
      const sources = data.sources.map((source: any) => ({
        name: source.name || source.provider || source.quality || 'Source',
        url: source.url,
        quality: source.quality || 'auto',
        type: source.isM3u8 ? 'hls' : 'iframe',
        isM3u8: source.isM3u8 || source.url?.includes('.m3u8')
      }));

      // Cache the result
      sourceCache.set(cacheKey, {
        sources,
        timestamp: Date.now()
      });

      return sources;
    }

    return getBackupSources(type, id);
  } catch (error) {
    console.error('Failed to fetch video sources:', error);
    return getBackupSources(type, id);
  }
}

/**
 * Fallback sources when Consumet fails
 * These are reliable multi-embed alternatives
 */
function getBackupSources(type: 'movie' | 'tv' | 'anime', id: string): VideoSource[] {
  const backupSources: VideoSource[] = [];

  if (type === 'anime') {
    // Anime fallbacks
    backupSources.push(
      { name: 'GoGoAnime', url: `https://gogocdn.net/embed/${id}`, quality: '1080p', type: 'iframe' },
      { name: '9Anime', url: `https://vip.9anime.to/watch/${id}`, quality: '1080p', type: 'iframe' },
      { name: 'Backup Player', url: `https://autoembed.to/anime/${id}`, quality: '720p', type: 'iframe' }
    );
  } else {
    // Movie/TV fallbacks - use MultiEmbed which supports auto-switching
    backupSources.push(
      {
        name: 'MultiEmbed (Auto-Switch)',
        url: `https://multiembed.mov/?video_id=${id}&tmdb=1`,
        quality: 'auto',
        type: 'iframe'
      },
      {
        name: 'AutoEmbed',
        url: `https://autoembed.to/movie/tmdb/${id}`,
        quality: 'auto',
        type: 'iframe'
      },
      {
        name: 'SuperEmbed',
        url: `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
        quality: '720p',
        type: 'iframe'
      }
    );
  }

  return backupSources.filter(s => s.url);
}

/**
 * Get all video sources for a media item
 */
export async function getAllVideoSources(
  type: 'movie' | 'tv' | 'anime',
  id: string,
  season?: number,
  episode?: number
): Promise<VideoSource[]> {
  return fetchVideoSources(type, id, season, episode);
}

/**
 * Get primary video source (first available)
 */
export async function getVideoSource(
  type: 'movie' | 'tv' | 'anime',
  id: string,
  season?: number,
  episode?: number
): Promise<VideoSource | null> {
  const sources = await getAllVideoSources(type, id, season, episode);
  return sources[0] || null;
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearSourceCache(): void {
  sourceCache.clear();
}