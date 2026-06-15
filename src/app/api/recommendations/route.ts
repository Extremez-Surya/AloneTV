import { NextRequest, NextResponse } from 'next/server';
import { getMoviesByGenre, getTVShowsByGenre } from '@/lib/api/tmdb';

const GENRE_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'science fiction': 878,
  'sci-fi': 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const genresStr = searchParams.get('genres') || '';

    if (!genresStr.trim()) {
      return NextResponse.json({ recommendations: [], success: true });
    }

    const genreNames = genresStr.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean);
    const genreIds = genreNames.map((name) => GENRE_MAP[name]).filter(Boolean);

    if (genreIds.length === 0) {
      return NextResponse.json({ recommendations: [], success: true });
    }

    // Fetch movies and TV shows for each genre in parallel
    const promises: Promise<any[]>[] = [];
    genreIds.forEach((id) => {
      promises.push(getMoviesByGenre(id).then((items) => items.map((i) => ({ ...i, media_type: 'movie' }))));
      promises.push(getTVShowsByGenre(id).then((items) => items.map((i) => ({ ...i, media_type: 'tv' }))));
    });

    const resultsArray = await Promise.all(promises);
    const flatResults = resultsArray.flat();

    // Deduplicate results
    const seen = new Set<string>();
    const uniqueResults = flatResults.filter((item) => {
      const key = `${item.media_type}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by rating or popularity (vote_average desc)
    uniqueResults.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

    // Slice to top 18 recommendations
    const recommendations = uniqueResults.slice(0, 18).map((item) => ({
      id: item.id,
      type: item.media_type,
      title: item.title || item.name || '',
      posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
      year: (item.release_date || item.first_air_date || '').split('-')[0] || '',
      rating: item.vote_average || 0,
      quality: item.vote_average >= 7.6 ? '4K' : 'HD',
      genres: [item.media_type === 'movie' ? 'Movie' : 'TV Show'],
      href: `/watch/${item.media_type}/${item.id}`,
    }));

    return NextResponse.json({
      recommendations,
      success: true,
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations', recommendations: [] },
      { status: 500 }
    );
  }
}
