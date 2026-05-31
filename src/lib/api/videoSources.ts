/**
 * Video Source Management
 * Reliable iframe embed sources with auto-switching
 */

import { SUPPORTED_LANGUAGES, type AudioLanguage } from '@/lib/audioPreferences';

export interface VideoSource {
  name: string;
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'iframe';
  recommended?: boolean;
  fast?: boolean;
  ads?: boolean;
  resumable?: boolean;
  languages?: string[]; // Audio languages: 'English', 'Hindi', 'Tamil', etc.
  buildUrl?: (language: AudioLanguage) => string;
}

function createSource(
  name: string,
  url: string,
  quality = 'auto',
  flags: Omit<VideoSource, 'name' | 'url' | 'quality' | 'type'> = {},
): VideoSource {
  const source: VideoSource = {
    name,
    url,
    quality,
    type: 'iframe',
    ...flags,
  };

  // Default buildUrl: if the source advertises support for the language, try common query params
  if (!source.buildUrl) {
    source.buildUrl = (language: AudioLanguage) => {
      // If the source explicitly lists languages and doesn't include the requested one, return original
      if (source.languages && !source.languages.includes(language)) return source.url;

      const code = SCREENSCAPE_SUBTITLE_MAP[language] || 'en';

      // If URL already contains a subtitle/lang param, replace it; otherwise, try appending common keys
      const tryAppend = (base: string, key: string) => {
        try {
          const u = new URL(base);
          u.searchParams.set(key, code);
          return u.toString();
        } catch {
          // Fallback for non-absolute URLs: naive append
          const sep = base.includes('?') ? '&' : '?';
          return `${base}${sep}${key}=${code}`;
        }
      };

      // Prefer subtitle param used by screenscape/embed providers
      let candidate = tryAppend(source.url, 'subtitle');
      if (candidate !== source.url) return candidate;

      candidate = tryAppend(source.url, 'lang');
      if (candidate !== source.url) return candidate;

      candidate = tryAppend(source.url, 'language');
      if (candidate !== source.url) return candidate;

      // As last resort, return original URL
      return source.url;
    };
  }

  return source;
}

const SCREENSCAPE_SUBTITLE_MAP: Record<AudioLanguage, string> = {
  English: 'en',
  Hindi: 'hi',
  Tamil: 'ta',
  Telugu: 'te',
  Kannada: 'kn',
  Malayalam: 'ml',
  Marathi: 'mr',
  Bengali: 'bn',
  Spanish: 'es',
  French: 'fr',
  German: 'de',
  Portuguese: 'pt',
  Italian: 'it',
  Russian: 'ru',
  Japanese: 'ja',
  Korean: 'ko',
  Chinese: 'zh',
  Thai: 'th',
  Vietnamese: 'vi',
  Indonesian: 'id',
};

function buildScreenScapeUrl(
  mediaType: 'movie' | 'tv',
  id: string,
  language: AudioLanguage,
  season?: number,
  episode?: number,
): string {
  const subtitle = SCREENSCAPE_SUBTITLE_MAP[language] || 'en';
  const baseUrl = mediaType === 'tv'
    ? `https://screenscape.me/embed/tv/${id}/${season ?? 1}/${episode ?? 1}`
    : `https://screenscape.me/embed/movie/${id}`;

  return `${baseUrl}?autoplay=0&controls=1&theme=dark&quality=auto&subtitle=${subtitle}`;
}

function createScreenScapeSource(
  mediaType: 'movie' | 'tv',
  id: string,
  season?: number,
  episode?: number,
): VideoSource {
  return {
    name: 'ScreenScape',
    url: buildScreenScapeUrl(mediaType, id, 'English', season, episode),
    quality: 'auto',
    type: 'iframe',
    recommended: true,
    fast: true,
    resumable: true,
    languages: [...SUPPORTED_LANGUAGES],
    buildUrl: (language: AudioLanguage) => buildScreenScapeUrl(mediaType, id, language, season, episode),
  };
}

interface SourceOptions {
  includeScreenScape?: boolean;
}

/**
 * Get supported languages for a provider
 * Most providers support original + select dubs
 */
function getProviderLanguages(providerName: string): string[] {
  const languageMap: Record<string, string[]> = {
    'VidLink': ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'],
    'VidLink 2': ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada'],
    'VidKing': ['English', 'Hindi', 'Spanish'],
    '2Embed': ['English'],
    'Vidsrc': ['English'],
    'Movies7': ['English', 'Hindi'],
    'VidPlay': ['English', 'Hindi', 'Tamil'],
    'AutoEmbed': ['English', 'Spanish', 'Portuguese'],
    'SuperEmbed': ['English'],
    'MultiEmbed': ['English'],
    'MoviesAPI': ['English', 'Hindi'],
  };

  return languageMap[providerName] || ['English'];
}

/**
 * Get working video sources for movies
 * Uses multi-provider embed sites with auto-switching
 */
export function getMovieSources(tmdbId: string, options: SourceOptions = {}): VideoSource[] {
  const sources = [
    createSource(
      'VidLink',
      `https://vidlink.pro/movie/${tmdbId}?player=jw&primaryColor=006fee&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false`,
      'auto',
      { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'] },
    ),
    createSource(
      'VidLink 2',
      `https://vidlink.pro/movie/${tmdbId}?primaryColor=006fee&autoplay=false`,
      'auto',
      { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada'] },
    ),
    createSource(
      'VidKing',
      `https://www.vidking.net/embed/movie/${tmdbId}?color=006fee&autoplay=false`,
      'auto',
      { recommended: true, fast: true, resumable: true, languages: ['English', 'Hindi', 'Spanish'] },
    ),
    createSource('2Embed', `https://www.2embed.cc/embed/${tmdbId}`, '1080p', {
      recommended: true,
      fast: true,
      languages: ['English'],
    }),
    createSource('Vidsrc', `https://vidsrc.cc/embed/${tmdbId}`, '1080p', {
      recommended: true,
      fast: true,
      ads: true,
      languages: ['English'],
    }),
    createSource('Movies7', `https://movies7.to/watch/${tmdbId}`, '720p', {
      fast: true,
      ads: true,
      languages: ['English', 'Hindi'],
    }),
    createSource('VidPlay', `https://vidplay.online/embed/${tmdbId}`, '1080p', {
      fast: true,
      ads: true,
      resumable: true,
      languages: ['English', 'Hindi', 'Tamil'],
    }),
    createSource('AutoEmbed', `https://autoembed.to/movie/tmdb/${tmdbId}`, 'auto', {
      languages: ['English', 'Spanish', 'Portuguese'],
    }),
    createSource(
      'SuperEmbed',
      `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`,
      'auto',
      { fast: true, ads: true, languages: ['English'] },
    ),
    createSource('MultiEmbed', `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`, 'auto', {
      languages: ['English'],
    }),
    createSource('VidSrc 1', `https://vidsrc.xyz/embed/movie/${tmdbId}`, '1080p', {
      ads: true,
      languages: ['English'],
    }),
    createSource('VidSrc 2', `https://vidsrc.to/embed/movie/${tmdbId}`, '1080p', {
      ads: true,
      languages: ['English'],
    }),
    createSource('VidSrc 3', `https://vidsrc.icu/embed/movie/${tmdbId}`, '1080p', {
      ads: true,
      languages: ['English'],
    }),
    createSource('VidSrc 4', `https://vidsrc.cc/v2/embed/movie/${tmdbId}?autoPlay=false`, '1080p', {
      ads: true,
      languages: ['English'],
    }),
    createSource('VidSrc 5', `https://vidsrc.cc/v3/embed/movie/${tmdbId}?autoPlay=false`, '1080p', {
      recommended: true,
      fast: true,
      ads: true,
      languages: ['English'],
    }),
    createSource('MoviesAPI', `https://moviesapi.club/movie/${tmdbId}`, 'auto', {
      ads: true,
      languages: ['English', 'Hindi'],
    }),
  ];

  if (options.includeScreenScape !== false) {
    sources.unshift(createScreenScapeSource('movie', tmdbId));
  }

  return sources;
}

/**
 * Get working video sources for TV shows
 */
export function getTVSources(tmdbId: string, season: number, episode: number, options: SourceOptions = {}): VideoSource[] {
  const sources = [
    createSource(
      'VidLink',
      `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false`,
      'auto',
      { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'] },
    ),
    createSource(
      'VidLink 2',
      `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=f5a524&autoplay=false`,
      'auto',
      { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada'] },
    ),
    createSource(
      'VidKing',
      `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=f5a524&autoplay=false`,
      'auto',
      { recommended: true, fast: true, resumable: true, languages: ['English', 'Hindi', 'Spanish'] },
    ),
    createSource('2Embed', `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`, '1080p', {
      recommended: true,
      fast: true,
      languages: ['English'],
    }),
    createSource('Vidsrc', `https://vidsrc.cc/embed/tv/${tmdbId}/${season}/${episode}`, '1080p', {
      recommended: true,
      fast: true,
      ads: true,
      languages: ['English'],
    }),
    createSource('Movies7', `https://movies7.to/watch-tv/${tmdbId}-${season}-${episode}`, '720p', {
      fast: true,
      ads: true,
      languages: ['English', 'Hindi'],
    }),
    createSource('VidPlay', `https://vidplay.online/embed/${tmdbId}?season=${season}&episode=${episode}`, '1080p', {
      fast: true,
      ads: true,
      resumable: true,
      languages: ['English', 'Hindi', 'Tamil'],
    }),
    createSource('AutoEmbed', `https://autoembed.to/series/tmdb/${tmdbId}/${season}/${episode}`, 'auto', {
      languages: ['English', 'Spanish', 'Portuguese'],
    }),
    createSource(
      'SuperEmbed',
      `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
      'auto',
      { fast: true, ads: true, languages: ['English'] },
    ),
    createSource('MultiEmbed', `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`, 'auto', {
      languages: ['English'],
    }),
    createSource('VidSrc 1', `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`, '1080p', {
      ads: true,
      languages: ['English'],
    }),
    createSource('VidSrc 2', `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`, '1080p', {
      ads: true,
      languages: ['English'],
    }),
    createSource('VidSrc 3', `https://vidsrc.icu/embed/tv/${tmdbId}/${season}/${episode}`, '1080p', {
      ads: true,
      languages: ['English'],
    }),
    createSource('VidSrc 4', `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=false`, '1080p', {
      ads: true,
      languages: ['English'],
    }),
    createSource('VidSrc 5', `https://vidsrc.cc/v3/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=false`, '1080p', {
      recommended: true,
      fast: true,
      ads: true,
      languages: ['English'],
    }),
    createSource('MoviesAPI', `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`, 'auto', {
      ads: true,
      languages: ['English', 'Hindi'],
    }),
  ];

  if (options.includeScreenScape !== false) {
    sources.unshift(createScreenScapeSource('tv', tmdbId, season, episode));
  }

  return sources;
}

/**
 * Fetch video sources from our backend API
 */
export async function fetchVideoSources(
  type: 'movie' | 'tv' | 'anime',
  id: string,
  season?: number,
  episode?: number
): Promise<VideoSource[]> {
  try {
    const params = new URLSearchParams({
      id,
      type: type === 'anime' ? 'tv' : type,
      ...(season && { season: season.toString() }),
      ...(episode && { episode: episode.toString() }),
      ...(type === 'anime' && { anime: 'true' })
    });

    const res = await fetch(`/api/video?${params}`, {
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();

      if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
        return data.sources.map((source: any) => ({
          name: source.name || 'Source',
          url: source.url,
          quality: source.quality || 'auto',
          type: (source.type === 'hls' || source.type === 'mp4' ? source.type : 'iframe') as 'hls' | 'mp4' | 'iframe',
          recommended: Boolean(source.recommended),
          fast: Boolean(source.fast),
          ads: Boolean(source.ads),
          resumable: Boolean(source.resumable),
          languages: Array.isArray(source.languages) && source.languages.length > 0 ? source.languages : undefined,
        }));
      }
    }

    // Fallback to direct source generation if API fails
    return getFallbackSources(type, id, season, episode, { includeScreenScape: false });
  } catch (error) {
    console.error('Failed to fetch video sources:', error);
    return getFallbackSources(type, id, season, episode, { includeScreenScape: false });
  }
}

/**
 * Fallback sources when API fails - directly generated
 */
export function getFallbackSources(
  type: 'movie' | 'tv' | 'anime',
  id: string,
  season?: number,
  episode?: number,
  options: SourceOptions = {}
): VideoSource[] {
  if (type === 'anime') {
    return [createSource('AutoEmbed Anime', `https://autoembed.to/anime/${id}`)];
  } else if (type === 'tv' && season && episode) {
    return getTVSources(id, season, episode, options);
  } else {
    return getMovieSources(id, options);
  }
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