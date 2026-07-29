import { NextRequest, NextResponse } from 'next/server';

// Video streaming sources with proxy support
const STREAM_SOURCES: Record<string, (id: string, season?: number, episode?: number) => string> = {
  'vidlink': (id, season, episode) =>
    season ? `https://vidlink.pro/tv/${id}/${season}/${episode}`
           : `https://vidlink.pro/movie/${id}`,

  'vidsrc': (id, season, episode) =>
    season ? `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}`
           : `https://vidsrc.pro/embed/movie/${id}`,

  'embedsu': (id, season, episode) =>
    season ? `https://embed.su/embed/tv/${id}/${season}/${episode}`
           : `https://embed.su/embed/movie/${id}`,

  'autoembed': (id, season, episode) =>
    season ? `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`
           : `https://player.autoembed.cc/embed/movie/${id}`,

  'vidking': (id, season, episode) =>
    season ? `https://www.vidking.net/embed/tv/${id}/${season}/${episode}`
           : `https://www.vidking.net/embed/movie/${id}`,
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tmdbId = searchParams.get('id');
  const type = searchParams.get('type') || 'movie';
  const source = searchParams.get('source') || 'vidsrc';
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');
  const subtitle = searchParams.get('subtitle') || 'en';

  if (!tmdbId) {
    return NextResponse.json({ error: 'Missing tmdbId' }, { status: 400 });
  }

  // Get the stream URL
  const streamFn = STREAM_SOURCES[source];
  if (!streamFn) {
    return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
  }

  let streamUrl = streamFn(tmdbId, season ? parseInt(season) : undefined, episode ? parseInt(episode) : undefined);
  if (source === 'screenscape') {
    streamUrl = streamUrl.replace('subtitle=en', `subtitle=${subtitle}`);
  }

  // Return the stream URL with proxy-friendly headers
  return NextResponse.json({
    url: streamUrl,
    source,
    type,
    quality: '1080p'
  });
}

// Also handle POST for getting multiple sources
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tmdbId, type = 'movie', season, episode } = body;

  if (!tmdbId) {
    return NextResponse.json({ error: 'Missing tmdbId' }, { status: 400 });
  }

  // Return all available sources
  const sources = Object.entries(STREAM_SOURCES).map(([name, fn]) => ({
    name,
    url: fn(tmdbId, season, episode),
    quality: '1080p'
  }));

  return NextResponse.json({
    sources,
    primary: sources[0]?.url
  });
}