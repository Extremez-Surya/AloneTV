import { NextRequest, NextResponse } from 'next/server';

// Video streaming sources with proxy support
const STREAM_SOURCES: Record<string, (id: string, season?: number, episode?: number) => string> = {
  'screenscape': (id, season, episode) =>
    season ? `https://screenscape.me/embed/tv/${id}/${season}/${episode}?autoplay=0&controls=1&theme=dark&quality=auto&subtitle=en`
           : `https://screenscape.me/embed/movie/${id}?autoplay=0&controls=1&theme=dark&quality=auto&subtitle=en`,

  'vidlink': (id, season, episode) =>
    season ? `https://vidlink.pro/tv/${id}/${season}/${episode}`
           : `https://vidlink.pro/movie/${id}`,

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