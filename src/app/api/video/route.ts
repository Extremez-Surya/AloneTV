/**
 * Video Source Scraping API
 * Uses Consumet API to extract direct .m3u8 links from multiple providers
 * Bypasses iframe restrictions and provides clean HLS streaming
 */

import { NextRequest, NextResponse } from 'next/server';

const CONSUMET_API = 'https://api.consumet.org/movies/flixhq';
const CONSUMET_ANIME_API = 'https://api.consumet.org/anime/gogoanime';

interface VideoLink {
  url: string;
  quality: string;
  isM3u8: boolean;
}

interface ScrapedSource {
  sources: VideoLink[];
  subtitles: Array<{ lang: string; url: string }>;
  headers?: Record<string, string>;
}

/**
 * Search for media on Consumet
 */
async function searchMedia(query: string, type: 'movie' | 'tv'): Promise<any[]> {
  try {
    const endpoint = type === 'movie' 
      ? `${CONSUMET_API}/search?query=${encodeURIComponent(query)}`
      : `${CONSUMET_API}/search?query=${encodeURIComponent(query)}`;
    
    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Consumet search error:', error);
    return [];
  }
}

/**
 * Get video sources from Consumet for a specific media
 */
async function getConsumMetSources(
  mediaId: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): Promise<ScrapedSource | null> {
  try {
    // Build endpoint
    let endpoint = `${CONSUMET_API}/info?id=${mediaId}`;
    if (type === 'tv' && season && episode) {
      endpoint += `&type=TV&season=${season}&episode=${episode}`;
    }

    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) return null;

    const data = await res.json();

    // Normalize Consumet response
    if (data.episodes) {
      // TV show response
      const ep = data.episodes.find((e: any) => e.number === episode);
      if (ep && ep.sources) {
        return {
          sources: ep.sources
            .filter((s: any) => s.url)
            .map((s: any) => ({
              url: s.url,
              quality: s.quality || 'auto',
              isM3u8: s.url?.includes('.m3u8') || false
            })),
          subtitles: ep.subtitles || []
        };
      }
    } else if (data.sources) {
      // Movie response
      return {
        sources: data.sources
          .filter((s: any) => s.url)
          .map((s: any) => ({
            url: s.url,
            quality: s.quality || 'auto',
            isM3u8: s.url?.includes('.m3u8') || false
          })),
        subtitles: data.subtitles || []
      };
    }

    return null;
  } catch (error) {
    console.error('Consumet fetch error:', error);
    return null;
  }
}

/**
 * Get anime sources from Consumet
 */
async function getAnimeSource(malId: string, episode: number = 1): Promise<ScrapedSource | null> {
  try {
    const endpoint = `${CONSUMET_ANIME_API}/info?id=${malId}`;

    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (data.episodes && data.episodes[episode - 1]) {
      const ep = data.episodes[episode - 1];
      if (ep.sources) {
        return {
          sources: ep.sources
            .filter((s: any) => s.url)
            .map((s: any) => ({
              url: s.url,
              quality: s.quality || '720p',
              isM3u8: s.url?.includes('.m3u8') || true
            })),
          subtitles: ep.subtitles || []
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Anime source fetch error:', error);
    return null;
  }
}

/**
 * Main API handler
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mediaId = searchParams.get('id');
    const type = (searchParams.get('type') || 'movie') as 'movie' | 'tv';
    const season = searchParams.get('season') ? parseInt(searchParams.get('season')!) : undefined;
    const episode = searchParams.get('episode') ? parseInt(searchParams.get('episode')!) : undefined;
    const isAnime = searchParams.get('anime') === 'true';

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    let sources: ScrapedSource | null = null;

    if (isAnime) {
      sources = await getAnimeSource(mediaId, episode || 1);
    } else {
      sources = await getConsumMetSources(mediaId, type, season, episode);
    }

    if (!sources || !sources.sources.length) {
      // Fallback to direct embed sources if Consumet fails
      // Try multiple embed providers
      const fallbackSources = [
        {
          url: `https://www.2embed.cc/embed/${mediaId}`,
          quality: 'auto',
          isM3u8: false,
          name: '2Embed'
        },
        {
          url: `https://vidsrc.me/embed/${type === 'movie' ? mediaId : `tv/${mediaId}`}`,
          quality: 'auto',
          isM3u8: false,
          name: 'VidSrc'
        }
      ];
      
      return NextResponse.json({
        sources: fallbackSources,
        subtitles: [],
        fallback: true
      });
    }

    return NextResponse.json({
      sources: sources.sources,
      subtitles: sources.subtitles,
      success: true
    });
  } catch (error) {
    console.error('Video API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video sources' },
      { status: 500 }
    );
  }
}
