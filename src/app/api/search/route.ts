import { NextRequest, NextResponse } from 'next/server';
import { searchMulti } from '@/lib/api/tmdb';
import { searchMovies as searchOMDB } from '@/lib/api/omdb';
import { searchTVMaze } from '@/lib/api/tvmaze';
import { searchIMDBPublic } from '@/lib/api/imdbPublic';
import { searchKitsuAnime } from '@/lib/api/kitsu';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Run all searches in parallel for maximum performance
    const [tmdbResults, tvmazeResults, imdbPublicResults, kitsuResults] = await Promise.all([
      searchMulti(query).catch(() => []),
      searchTVMaze(query).catch(() => []),
      searchIMDBPublic(query).catch(() => []),
      searchKitsuAnime(query).catch(() => []),
    ]);

    let results: any[] = [...tmdbResults];
    let source = 'tmdb';

    // 1. Process TVmaze results
    if (tvmazeResults && tvmazeResults.length > 0) {
      const formattedTVmaze = tvmazeResults
        .map((r: any) => {
          const show = r.show;
          if (!show) return null;
          
          // Deduplicate: check if this title is already in results
          const cleanTitle = show.name.toLowerCase().trim();
          const exists = results.some((t: any) => {
            const tTitle = (t.title || t.name || '').toLowerCase().trim();
            return tTitle === cleanTitle;
          });
          if (exists) return null;

          return {
            id: `tvmaze-${show.id}`, // prefix to identify TVmaze source
            title: show.name,
            name: show.name,
            poster_path: show.image?.medium || show.image?.original || null,
            backdrop_path: show.image?.original || null,
            media_type: 'tv' as const,
            release_date: show.premiered || '',
            first_air_date: show.premiered || '',
            vote_average: show.rating?.average || 0,
            overview: show.summary ? show.summary.replace(/<[^>]*>/g, '') : '',
            genre_ids: [] as number[],
          };
        })
        .filter((item): item is Exclude<typeof item, null> => item !== null);

      if (formattedTVmaze.length > 0) {
        results = [...results, ...formattedTVmaze];
        source += '+tvmaze';
      }
    }

    // 2. Process IMDb Public results (FM-DB)
    if (imdbPublicResults && imdbPublicResults.length > 0) {
      const formattedIMDb = imdbPublicResults
        .map((item) => {
          // Deduplicate: check if this title is already in results
          const cleanTitle = item.title.toLowerCase().trim();
          const exists = results.some((t: any) => {
            const tTitle = (t.title || t.name || '').toLowerCase().trim();
            return tTitle === cleanTitle;
          });
          if (exists) return null;

          return {
            id: item.imdbId, // Starts with "tt"
            title: item.title,
            name: item.title,
            poster_path: item.poster,
            backdrop_path: null,
            media_type: 'movie' as const, // Default to movie
            release_date: item.year ? String(item.year) : '',
            first_air_date: item.year ? String(item.year) : '',
            vote_average: 0,
            overview: `Actors: ${item.actors || 'N/A'}. Source: IMDb Public API`,
            genre_ids: [] as number[],
          };
        })
        .filter((item): item is Exclude<typeof item, null> => item !== null);

      if (formattedIMDb.length > 0) {
        results = [...results, ...formattedIMDb];
        source += '+imdb_public';
      }
    }

    // 3. Process Kitsu results
    if (kitsuResults && kitsuResults.length > 0) {
      const formattedKitsu = kitsuResults
        .map((item) => {
          // Deduplicate: check if this title is already in results
          const cleanTitle = item.title.toLowerCase().trim();
          const exists = results.some((t: any) => {
            const tTitle = (t.title || t.name || '').toLowerCase().trim();
            return tTitle === cleanTitle;
          });
          if (exists) return null;

          return {
            id: `kitsu-${item.id}`, // prefix to identify Kitsu source
            title: item.title,
            name: item.title,
            poster_path: item.posterImage,
            backdrop_path: item.backdropImage,
            media_type: 'tv' as const, // anime treated as tv
            release_date: item.startDate || '',
            first_air_date: item.startDate || '',
            vote_average: item.averageRating ? parseFloat(item.averageRating) / 10 : 0,
            overview: item.synopsis || '',
            genre_ids: [] as number[],
          };
        })
        .filter((item): item is Exclude<typeof item, null> => item !== null);

      if (formattedKitsu.length > 0) {
        results = [...results, ...formattedKitsu];
        source += '+kitsu';
      }
    }

    // 4. Fallback to OMDB if still completely empty
    if (results.length === 0) {
      const omdbResults = await searchOMDB(query);
      if (omdbResults.length > 0) {
        const formattedOMDB = omdbResults.map(movie => ({
          id: movie.imdbID,
          title: movie.Title,
          name: movie.Title,
          poster_path: movie.Poster !== 'N/A' ? movie.Poster : null,
          media_type: movie.Type === 'movie' ? 'movie' : ('tv' as const),
          release_date: movie.Year,
          first_air_date: movie.Year,
          vote_average: movie.imdbRating !== 'N/A' ? parseFloat(movie.imdbRating) : 0,
          overview: '',
        }));
        return NextResponse.json({ results: formattedOMDB, source: 'omdb' });
      }
    }

    return NextResponse.json({ results, source });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [], source: 'error' });
  }
}