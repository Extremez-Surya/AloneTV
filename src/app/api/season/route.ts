import { NextRequest, NextResponse } from 'next/server';
import { getTVSeasonDetail } from '@/lib/api/tmdb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idStr = searchParams.get('id');
    const seasonStr = searchParams.get('season');

    if (!idStr || !seasonStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: id, season' },
        { status: 400 }
      );
    }

    const id = parseInt(idStr, 10);
    const season = parseInt(seasonStr, 10);

    if (isNaN(id) || isNaN(season)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const seasonDetail = await getTVSeasonDetail(id, season);

    return NextResponse.json({
      seasonDetail,
      success: true,
    });
  } catch (error) {
    console.error('Season Details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch season details', seasonDetail: null },
      { status: 500 }
    );
  }
}
