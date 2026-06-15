import { NextRequest, NextResponse } from 'next/server';
import { getMovieTrailer, getTVTrailer } from '@/lib/api/tmdb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idStr = searchParams.get('id');
    const type = searchParams.get('type') || 'movie';

    if (!idStr) {
      return NextResponse.json({ error: 'Missing required parameter: id' }, { status: 400 });
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    let trailer = null;
    if (type === 'tv' || type === 'anime') {
      trailer = await getTVTrailer(id);
    } else {
      trailer = await getMovieTrailer(id);
    }

    return NextResponse.json({
      trailer,
      success: true
    });
  } catch (error) {
    console.error('Trailer API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trailer', trailer: null },
      { status: 500 }
    );
  }
}
