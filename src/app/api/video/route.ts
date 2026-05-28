/**
 * Video Source API - Tested working embeds
 * These sites allow direct embedding
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFallbackSources } from '@/lib/api/videoSources';

async function isReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mediaId = searchParams.get('id') || '';
    const type = searchParams.get('type') || 'movie';
    const season = searchParams.get('season');
    const episode = searchParams.get('episode');
    const isAnime = searchParams.get('anime') === 'true';

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id', sources: [] },
        { status: 400 }
      );
    }

    const mediaType = isAnime || type === 'anime' ? 'anime' : type === 'tv' && season && episode ? 'tv' : 'movie';
    const screenScapeCandidate = getFallbackSources(mediaType, mediaId, season ? parseInt(season) : undefined, episode ? parseInt(episode) : undefined)[0];
    const includeScreenScape = screenScapeCandidate?.name === 'ScreenScape' ? await isReachable(screenScapeCandidate.url) : false;

    const sources = getFallbackSources(
      mediaType,
      mediaId,
      season ? parseInt(season) : undefined,
      episode ? parseInt(episode) : undefined,
      { includeScreenScape },
    );

    return NextResponse.json({
      sources,
      success: true,
      note: 'If video fails to load, try opening directly in new tab'
    });
  } catch (error) {
    console.error('Video API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video sources', sources: [] },
      { status: 500 }
    );
  }
}