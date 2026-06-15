import { NextRequest, NextResponse } from 'next/server';
import { getCollectionDetail } from '@/lib/api/tmdb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const id = parseInt(idStr, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid parameter' }, { status: 400 });
    }

    const collectionDetail = await getCollectionDetail(id);

    return NextResponse.json({
      collectionDetail,
      success: true,
    });
  } catch (error) {
    console.error('Collection Details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection details', collectionDetail: null },
      { status: 500 }
    );
  }
}
