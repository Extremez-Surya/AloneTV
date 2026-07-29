import { type AudioLanguage } from '@/lib/audioPreferences';

export interface VideoSource {
  name: string;
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'iframe';
  recommended?: boolean;
  fast?: boolean;
  ads?: boolean;
  resumable?: boolean;
  languages?: string[];
}

export function attachBuildUrl(source: Omit<VideoSource, 'buildUrl'> & { name: string; url: string }): VideoSource {
  return {
    ...source,
  };
}

function createSource(
  name: string,
  url: string,
  quality = 'auto',
  flags: Omit<VideoSource, 'name' | 'url' | 'quality' | 'type'> = {},
): VideoSource {
  return { name, url, quality, type: 'iframe', ...flags };
}

export function getMovieSources(tmdbId: string): VideoSource[] {
  return [
    createSource('VidSrc.net', `https://vidsrc.net/embed/movie/${tmdbId}`, '1080p',
      { recommended: true, fast: true, resumable: true, languages: ['English', 'Hindi', 'Spanish', 'Japanese', 'Korean', 'Chinese'] }),
    createSource('VidSrc Pro', `https://vidsrc.pro/embed/movie/${tmdbId}`, '1080p',
      { recommended: true, fast: true, languages: ['English', 'Hindi', 'Spanish', 'Japanese'] }),
    createSource('VidKing', `https://www.vidking.net/embed/movie/${tmdbId}`, '1080p',
      { recommended: true, fast: true, languages: ['English', 'Hindi', 'Spanish'] }),
    createSource('AutoEmbed', `https://autoembed.co/movie/tmdb/${tmdbId}`, '1080p',
      { recommended: true, fast: true, languages: ['English', 'Hindi'] }),
    createSource('VidSrc.icu', `https://vidsrc.icu/embed/movie/${tmdbId}`, 'auto',
      { fast: true, languages: ['English', 'Hindi', 'Spanish'] }),
    createSource('2Embed', `https://www.2embed.cc/embed/${tmdbId}`, 'auto',
      { fast: true, languages: ['English', 'Hindi', 'Spanish'] }),
    createSource('VidLink', `https://vidlink.pro/movie/${tmdbId}`, 'auto',
      { languages: ['English', 'Hindi'] }),
  ];
}

export function getTVSources(tmdbId: string, season: number, episode: number): VideoSource[] {
  return [
    createSource('VidSrc.net', `https://vidsrc.net/embed/tv/${tmdbId}/${season}/${episode}`, '1080p',
      { recommended: true, fast: true, resumable: true, languages: ['English', 'Hindi', 'Spanish', 'Japanese', 'Korean', 'Chinese'] }),
    createSource('VidSrc Pro', `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`, '1080p',
      { recommended: true, fast: true, languages: ['English', 'Hindi', 'Spanish', 'Japanese'] }),
    createSource('VidKing', `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}`, '1080p',
      { recommended: true, fast: true, languages: ['English', 'Hindi', 'Spanish'] }),
    createSource('AutoEmbed', `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`, '1080p',
      { recommended: true, fast: true, languages: ['English', 'Hindi'] }),
    createSource('VidSrc.icu', `https://vidsrc.icu/embed/tv/${tmdbId}/${season}/${episode}`, 'auto',
      { fast: true, languages: ['English', 'Hindi', 'Spanish'] }),
    createSource('2Embed', `https://www.2embed.cc/embed/tv/${tmdbId}/${season}/${episode}`, 'auto',
      { fast: true, languages: ['English', 'Hindi', 'Spanish'] }),
    createSource('VidLink', `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`, 'auto',
      { languages: ['English', 'Hindi'] }),
  ];
}

export async function fetchVideoSources(
  type: 'movie' | 'tv' | 'anime',
  id: string,
  season?: number,
  episode?: number,
): Promise<VideoSource[]> {
  try {
    const params = new URLSearchParams({
      id,
      type: type === 'anime' ? 'tv' : type,
      ...(season && { season: season.toString() }),
      ...(episode && { episode: episode.toString() }),
      ...(type === 'anime' && { anime: 'true' }),
    });

    const res = await fetch(`/api/video?${params}`, { cache: 'no-store' });

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

    return getFallbackSources(type, id, season, episode);
  } catch (error) {
    console.error('Failed to fetch video sources:', error);
    return getFallbackSources(type, id, season, episode);
  }
}

export function getFallbackSources(
  type: 'movie' | 'tv' | 'anime',
  id: string,
  season?: number,
  episode?: number,
): VideoSource[] {
  if (type === 'anime') {
    const ep = episode ?? 1;
    return [
      createSource('VidSrc.net', `https://vidsrc.net/embed/tv/${id}/1/${ep}`, '1080p',
        { recommended: true, fast: true, resumable: true, languages: ['English', 'Japanese', 'Hindi'] }),
      createSource('VidSrc Pro', `https://vidsrc.pro/embed/tv/${id}/1/${ep}`, '1080p',
        { recommended: true, fast: true, languages: ['English', 'Japanese', 'Hindi'] }),
      createSource('VidKing', `https://www.vidking.net/embed/tv/${id}/1/${ep}`, '1080p',
        { recommended: true, languages: ['English', 'Japanese'] }),
      createSource('AutoEmbed', `https://autoembed.co/tv/tmdb/${id}-1-${ep}`, '1080p',
        { recommended: true, languages: ['English', 'Japanese'] }),
      createSource('VidSrc.icu', `https://vidsrc.icu/embed/tv/${id}/1/${ep}`, 'auto',
        { languages: ['English', 'Japanese'] }),
      createSource('2Embed', `https://www.2embed.cc/embed/tv/${id}/1/${ep}`, 'auto',
        { languages: ['English', 'Japanese', 'Hindi'] }),
    ];
  } else if (type === 'tv' && season && episode) {
    return getTVSources(id, season, episode);
  } else {
    return getMovieSources(id);
  }
}

export async function getAllVideoSources(
  type: 'movie' | 'tv' | 'anime',
  id: string,
  season?: number,
  episode?: number,
): Promise<VideoSource[]> {
  return fetchVideoSources(type, id, season, episode);
}

export async function getVideoSource(
  type: 'movie' | 'tv' | 'anime',
  id: string,
  season?: number,
  episode?: number,
): Promise<VideoSource | null> {
  const sources = await getAllVideoSources(type, id, season, episode);
  return sources[0] || null;
}

export function getAvailableLanguages(sources: VideoSource[]): string[] {
  const langs = new Set<string>()
  for (const s of sources) {
    if (s.languages) s.languages.forEach(l => langs.add(l))
  }
  return Array.from(langs)
}

export function findSourcesForLanguage(sources: VideoSource[], language: string): VideoSource[] {
  return sources.filter(s => s.languages?.includes(language))
}
