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

export function attachBuildUrl(source: Omit<VideoSource, 'buildUrl'> & { name: string; url: string }): VideoSource {
  return {
    ...source,
    buildUrl: (language: AudioLanguage) => {
      // If the source explicitly lists languages and doesn't include the requested one, return original
      if (source.languages && !source.languages.includes(language)) return source.url;

      const code = AUDIO_LANGUAGE_CODE_MAP[language] || 'en';
      const providerName = source.name;

      // Special ScreenScape mapping (both subtitles and direct embeds)
      if (providerName === 'ScreenScape') {
        try {
          const u = new URL(source.url);
          u.searchParams.set('subtitle', code);
          return u.toString();
        } catch {
          return source.url;
        }
      }

      try {
        const u = new URL(source.url);
        
        if (providerName.startsWith('VidLink Anime')) {
          try {
            const u = new URL(source.url);
            const pathname = u.pathname;
            const segments = pathname.split('/');
            const subOrDub = language === 'Japanese' ? 'sub' : 'dub';
            if (segments.length >= 5) {
              segments[segments.length - 1] = subOrDub;
            }
            u.pathname = segments.join('/');
            u.searchParams.set('fallback', 'true');
            return u.toString();
          } catch {
            return source.url;
          }
        } else if (providerName.startsWith('VidLink')) {
          // VidLink parses audioLang parameter (e.g. &audioLang=Hindi) for audio track
          if (language !== 'English') {
            u.searchParams.set('audioLang', language);
          } else {
            u.searchParams.delete('audioLang');
          }
          // Also set sub_lang for subtitle track selection
          u.searchParams.set('sub_lang', code);
        } else if (providerName.startsWith('VidKing')) {
          // VidKing handles &lang=hi &sub=hi &audio=hi
          u.searchParams.set('lang', code);
          u.searchParams.set('sub', code);
          u.searchParams.set('audio', code);
        } else if (providerName.startsWith('VidPlay')) {
          u.searchParams.set('lang', code);
          u.searchParams.set('sub_lang', code);
        } else if (providerName.startsWith('AutoEmbed')) {
          u.searchParams.set('lang', code);
          u.searchParams.set('audio', code);
        } else if (providerName.startsWith('MoviesAPI')) {
          u.searchParams.set('lang', code);
          u.searchParams.set('language', code);
        } else {
          // Standard fallback: try multiple query parameters for audio and subtitles
          u.searchParams.set('lang', code);
          u.searchParams.set('subtitle', code);
          u.searchParams.set('audioLang', language);
        }
        
        return u.toString();
      } catch {
        const sep = source.url.includes('?') ? '&' : '?';
        return `${source.url}${sep}lang=${code}&subtitle=${code}&audioLang=${language}`;
      }
    }
  };
}

function createSource(
  name: string,
  url: string,
  quality = 'auto',
  flags: Omit<VideoSource, 'name' | 'url' | 'quality' | 'type'> = {},
): VideoSource {
  const source = {
    name,
    url,
    quality,
    type: 'iframe' as const,
    ...flags,
  };
  return attachBuildUrl(source);
}

const AUDIO_LANGUAGE_CODE_MAP: Record<AudioLanguage, string> = {
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
  const subtitle = AUDIO_LANGUAGE_CODE_MAP[language] || 'en';
  const baseUrl = 'https://screenscape.me/embed';
  const idParam = id.startsWith('tt') ? `imdb=${id}` : `tmdb=${id}`;
  
  if (mediaType === 'tv') {
    return `${baseUrl}?${idParam}&type=tv&s=${season ?? 1}&e=${episode ?? 1}&autoplay=0&controls=1&theme=dark&quality=auto&subtitle=${subtitle}`;
  } else {
    return `${baseUrl}?${idParam}&type=movie&autoplay=0&controls=1&theme=dark&quality=auto&subtitle=${subtitle}`;
  }
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
 * Get working video sources for movies
 * Uses multi-provider embed sites with auto-switching
 */
export function getMovieSources(tmdbId: string, options: SourceOptions = {}): VideoSource[] {
  const sources = [
    createSource(
      'VidSrc.xyz',
      `https://vidsrc.xyz/embed/movie/${tmdbId}`,
      'auto',
      { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'] }
    ),
    createSource(
      'VidSrc.to',
      `https://vidsrc.to/embed/movie/${tmdbId}`,
      'auto',
      { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'] }
    ),
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
    createSource('AutoEmbed', tmdbId.startsWith('tt') ? `https://autoembed.to/movie/imdb/${tmdbId}` : `https://autoembed.to/movie/tmdb/${tmdbId}`, 'auto', {
      languages: ['English', 'Spanish', 'Portuguese'],
    }),
  ];

  if (options.includeScreenScape !== false) {
    sources.push(createScreenScapeSource('movie', tmdbId));
  }

  return sources;
}

/**
 * Get working video sources for TV shows
 */
export function getTVSources(tmdbId: string, season: number, episode: number, options: SourceOptions = {}): VideoSource[] {
  const sources = [
    createSource(
      'VidSrc.xyz',
      `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`,
      'auto',
      { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'] }
    ),
    createSource(
      'VidSrc.to',
      `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
      'auto',
      { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'] }
    ),
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
    createSource('AutoEmbed', tmdbId.startsWith('tt') ? `https://autoembed.to/series/imdb/${tmdbId}/${season}/${episode}` : `https://autoembed.to/series/tmdb/${tmdbId}/${season}/${episode}`, 'auto', {
      languages: ['English', 'Spanish', 'Portuguese'],
    }),
  ];

  if (options.includeScreenScape !== false) {
    sources.push(createScreenScapeSource('tv', tmdbId, season, episode));
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
        return data.sources.map((source: any) => attachBuildUrl({
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
    return getFallbackSources(type, id, season, episode, { includeScreenScape: true });
  } catch (error) {
    console.error('Failed to fetch video sources:', error);
    return getFallbackSources(type, id, season, episode, { includeScreenScape: true });
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
    const ep = episode ?? 1;
    const sources: VideoSource[] = [];

    // 1. ScreenScrape (Series / TV)
    if (options.includeScreenScape !== false) {
      const idParam = id.startsWith('tt') ? `imdb=${id}` : `tmdb=${id}`;
      sources.push({
        name: 'ScreenScape Anime',
        url: `https://screenscape.me/embed?${idParam}&type=tv&s=1&e=${ep}&autoplay=0&controls=1&theme=dark&quality=auto`,
        quality: 'auto',
        type: 'iframe',
        recommended: true,
        fast: true,
        resumable: true,
        languages: [...SUPPORTED_LANGUAGES],
        buildUrl: (language: AudioLanguage) => {
          const subtitle = AUDIO_LANGUAGE_CODE_MAP[language] || 'en';
          return `https://screenscape.me/embed?${idParam}&type=tv&s=1&e=${ep}&autoplay=0&controls=1&theme=dark&quality=auto&subtitle=${subtitle}`;
        }
      });
    }

    // 2. VidLink Anime Series
    sources.push(
      createSource(
        'VidLink Anime',
        `https://vidlink.pro/tv/${id}/1/${ep}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false`,
        'auto',
        { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Japanese', 'Hindi', 'Tamil', 'Telugu'] }
      )
    );

    // 3. VidLink Anime 2
    sources.push(
      createSource(
        'VidLink Anime 2',
        `https://vidlink.pro/tv/${id}/1/${ep}?primaryColor=f5a524&autoplay=false`,
        'auto',
        { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Japanese', 'Hindi'] }
      )
    );

    // 4. VidKing Anime
    sources.push(
      createSource(
        'VidKing Anime',
        `https://www.vidking.net/embed/tv/${id}/1/${ep}?color=f5a524&autoplay=false`,
        'auto',
        { recommended: true, fast: true, resumable: true, languages: ['English', 'Japanese', 'Hindi'] }
      )
    );

    // 5. AutoEmbed Anime
    sources.push(
      createSource(
        'AutoEmbed Anime',
        id.startsWith('tt') ? `https://autoembed.to/series/imdb/${id}/1/${ep}` : `https://autoembed.to/series/tmdb/${id}/1/${ep}`,
        'auto',
        { languages: ['English', 'Japanese'] }
      )
    );

    // Append Movie fallback sources if it's episode 1
    if (ep === 1) {
      if (options.includeScreenScape !== false) {
        const idParam = id.startsWith('tt') ? `imdb=${id}` : `tmdb=${id}`;
        sources.push({
          name: 'ScreenScape Movie',
          url: `https://screenscape.me/embed?${idParam}&type=movie&autoplay=0&controls=1&theme=dark&quality=auto`,
          quality: 'auto',
          type: 'iframe',
          languages: [...SUPPORTED_LANGUAGES],
          buildUrl: (language: AudioLanguage) => {
            const subtitle = AUDIO_LANGUAGE_CODE_MAP[language] || 'en';
            return `https://screenscape.me/embed?${idParam}&type=movie&autoplay=0&controls=1&theme=dark&quality=auto&subtitle=${subtitle}`;
          }
        });
      }
      sources.push(
        createSource(
          'VidLink Movie',
          `https://vidlink.pro/movie/${id}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false`,
          'auto',
          { recommended: true, fast: true, ads: true, resumable: true, languages: ['English', 'Japanese', 'Hindi', 'Tamil', 'Telugu'] }
        )
      );
      sources.push(
        createSource(
          'VidKing Movie',
          `https://www.vidking.net/embed/movie/${id}?color=f5a524&autoplay=false`,
          'auto',
          { recommended: true, fast: true, resumable: true, languages: ['English', 'Japanese', 'Hindi'] }
        )
      );
    }

    return sources;
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