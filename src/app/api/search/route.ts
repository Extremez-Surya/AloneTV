import { NextRequest, NextResponse } from 'next/server';
import { searchMulti } from '@/lib/api/tmdb';
import { searchMovies as searchOMDB } from '@/lib/api/omdb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Primary: TMDB search
    const tmdbResults = await searchMulti(query);

    // If TMDB returns results, use those
    if (tmdbResults.length > 0) {
      return NextResponse.json({ results: tmdbResults, source: 'tmdb' });
    }

    // Fallback: OMDB search
    const omdbResults = await searchOMDB(query);
    if (omdbResults.length > 0) {
      const formatted = omdbResults.map(movie => ({
        id: movie.imdbID,
        title: movie.Title,
        name: movie.Title,
        poster_path: movie.Poster !== 'N/A' ? movie.Poster : null,
        media_type: movie.Type === 'movie' ? 'movie' : 'tv',
        release_date: movie.Year,
        first_air_date: movie.Year,
        vote_average: movie.imdbRating !== 'N/A' ? parseFloat(movie.imdbRating) : 0,
      }));
      return NextResponse.json({ results: formatted, source: 'omdb' });
    }

    return NextResponse.json({ results: [], source: 'none' });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [], source: 'error' });
  }
}