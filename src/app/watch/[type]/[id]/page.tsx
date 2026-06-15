import { notFound } from 'next/navigation';
import {
  getMovieDetail,
  getTVShowDetail,
  getSimilarMovies,
  getSimilarTVShows,
  getTMDBImageUrl,
  getExternalIds,
  searchMulti,
  findByImdbId,
} from '@/lib/api/tmdb';
import { getAnimeDetail } from '@/lib/api/jikan';
import { getTVMazeShowDetail } from '@/lib/api/tvmaze';
import { getKitsuAnimeDetail } from '@/lib/api/kitsu';
import WatchPageClient from '@/components/video/WatchPageClient';

interface WatchPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const resolvedParams = await params;
  let { type, id } = resolvedParams;

  if (!['movie', 'tv', 'anime'].includes(type)) {
    notFound();
  }

  let title = '';
  let posterPath = '';
  let backdropPath = '';
  let overview = '';
  let voteAverage = 0;
  let releaseDate = '';
  let genres: { id: number; name: string }[] = [];
  let cast: any[] = [];
  let similar: any[] = [];
  let seasons: any[] = [];
  let imdbId = '';
  let originalLanguage = 'en';
  let tmdbId = 0;
  let belongsToCollection: any = null;

  // 1. Resolve ID to numeric TMDB ID or fetch fallback details
  try {
    if (id.startsWith('tt')) {
      // It is an IMDb ID
      imdbId = id;
      // Resolve using TMDB /find API
      const findResult = await findByImdbId(id);
      if (findResult) {
        const movieMatch = findResult.movie_results?.[0];
        const tvMatch = findResult.tv_results?.[0];
        
        if (movieMatch) {
          tmdbId = movieMatch.id;
          type = 'movie';
        } else if (tvMatch) {
          tmdbId = tvMatch.id;
          type = 'tv';
        }
      }

      // If we couldn't resolve TMDB ID, fallback to OMDB API
      if (!tmdbId) {
        const { getMovieByIMDB } = await import('@/lib/api/omdb');
        const omdbMovie = await getMovieByIMDB(id);
        if (omdbMovie) {
          title = omdbMovie.Title || '';
          posterPath = omdbMovie.Poster !== 'N/A' ? omdbMovie.Poster : '';
          backdropPath = '';
          overview = omdbMovie.Plot || '';
          voteAverage = omdbMovie.imdbRating !== 'N/A' ? parseFloat(omdbMovie.imdbRating) : 0;
          releaseDate = omdbMovie.Released || omdbMovie.Year || '';
          originalLanguage = 'en';
          genres = (omdbMovie.Genre || '').split(',').map((g, i) => ({ id: i + 1, name: g.trim() }));
          cast = (omdbMovie.Actors || '').split(',').map((a, i) => ({ id: i + 1, name: a.trim(), character: 'Cast' }));
        }
      }
    } else if (id.startsWith('tvmaze-')) {
      // It is a TVmaze ID
      const tvmazeId = parseInt(id.replace('tvmaze-', ''));
      if (!isNaN(tvmazeId)) {
        const show = await getTVMazeShowDetail(tvmazeId);
        if (show) {
          title = show.name;
          posterPath = show.image?.medium || show.image?.original || '';
          backdropPath = show.image?.original || '';
          overview = show.summary ? show.summary.replace(/<[^>]*>/g, '') : '';
          voteAverage = show.rating?.average || 0;
          releaseDate = show.premiered || '';
          genres = (show.genres || []).map((g, i) => ({ id: i + 1, name: g }));
          imdbId = show.externals?.imdb || '';

          // Try mapping to TMDB ID using the IMDb ID or title search
          if (imdbId) {
            const findResult = await findByImdbId(imdbId);
            if (findResult?.tv_results?.[0]) {
              tmdbId = findResult.tv_results[0].id;
            }
          }
          if (!tmdbId) {
            const tmdbSearch = await searchMulti(show.name);
            const matched = tmdbSearch.find(r => r.media_type === 'tv' && (r.name || '').toLowerCase() === show.name.toLowerCase());
            if (matched) {
              tmdbId = matched.id;
            }
          }
        }
      }
    } else if (id.startsWith('kitsu-')) {
      // It is a Kitsu ID
      const kitsuId = id.replace('kitsu-', '');
      const anime = await getKitsuAnimeDetail(kitsuId);
      if (anime) {
        title = anime.title;
        posterPath = anime.posterImage || '';
        backdropPath = anime.backdropImage || '';
        overview = anime.synopsis || '';
        voteAverage = anime.averageRating ? parseFloat(anime.averageRating) / 10 : 0;
        releaseDate = anime.startDate || '';
        originalLanguage = 'ja';
        genres = [{ id: 1, name: 'Anime' }];

        // Try mapping to TMDB ID by title
        const tmdbSearch = await searchMulti(anime.title);
        const matched = tmdbSearch.find(r => r.media_type === 'tv' || r.media_type === 'movie');
        if (matched) {
          tmdbId = matched.id;
          type = matched.media_type;
        }
      }
    } else {
      // Regular TMDB ID
      const mediaId = parseInt(id);
      if (!isNaN(mediaId)) {
        tmdbId = mediaId;
      }
    }

    // 2. Fetch full details from TMDB if we have a valid tmdbId
    if (tmdbId) {
      if (type === 'movie') {
        const movie = await getMovieDetail(tmdbId);
        if (movie && movie.id) {
          title = movie.title || title || '';
          posterPath = movie.poster_path || posterPath || '';
          backdropPath = movie.backdrop_path || backdropPath || '';
          overview = movie.overview || overview || '';
          voteAverage = movie.vote_average || voteAverage || 0;
          releaseDate = movie.release_date || releaseDate || '';
          genres = movie.genres || genres || [];
          cast = movie.credits?.cast?.slice(0, 10) || [];
          imdbId = movie.imdb_id || imdbId || '';
          originalLanguage = movie.original_language || 'en';
          belongsToCollection = (movie as any).belongs_to_collection || null;
          const similarData = await getSimilarMovies(tmdbId);
          similar = similarData || [];
        }
      } else if (type === 'tv' || type === 'anime') {
        const tv = await getTVShowDetail(tmdbId);
        if (tv && tv.id) {
          title = tv.name || title || 'TV Show';
          posterPath = tv.poster_path || posterPath || '';
          backdropPath = tv.backdrop_path || backdropPath || '';
          overview = tv.overview || overview || '';
          voteAverage = tv.vote_average || voteAverage || 0;
          releaseDate = tv.first_air_date || releaseDate || '';
          genres = tv.genres || genres || [];
          cast = tv.credits?.cast?.slice(0, 10) || [];
          seasons = tv.seasons?.filter((s: any) => s.season_number > 0) || [];
          imdbId = (tv as any).external_ids?.imdb_id || imdbId || '';
          originalLanguage = tv.original_language || 'en';
          const similarData = await getSimilarTVShows(tmdbId);
          similar = similarData || [];
        }
      }
    } else if (type === 'anime' && !title) {
      // If it was regular TMDB ID lookup for anime that didn't resolve to a TMDB ID, fallback to Jikan
      const mediaId = parseInt(id);
      if (!isNaN(mediaId)) {
        const anime = await getAnimeDetail(mediaId);
        if (anime && anime.mal_id) {
          title = anime.title || '';
          posterPath = anime.images?.jpg?.large_image_url || '';
          backdropPath = anime.images?.jpg?.large_image_url || '';
          overview = anime.synopsis || '';
          voteAverage = anime.score || 0;
          releaseDate = anime.aired?.from || '';
          originalLanguage = 'ja';
          genres = anime.genres?.slice(0, 4).map((g: { mal_id: number; name: string }) => ({
            id: g.mal_id,
            name: g.name,
          })) || [];

          // Try mapping to TMDB ID
          const searchTitle = anime.title_english || anime.title || '';
          if (searchTitle) {
            const tmdbSearch = await searchMulti(searchTitle);
            const matched = tmdbSearch.find(r => r.media_type === 'tv' || r.media_type === 'movie');
            if (matched) {
              tmdbId = matched.id;
              // Re-fetch details using matched TMDB ID if found
              const tv = await getTVShowDetail(tmdbId);
              if (tv && tv.id) {
                cast = tv.credits?.cast?.slice(0, 10) || [];
                seasons = tv.seasons?.filter((s: any) => s.season_number > 0) || [];
                imdbId = (tv as any).external_ids?.imdb_id || '';
                const similarData = await getSimilarTVShows(tmdbId);
                similar = similarData || [];
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch media details:', error);
  }

  if (!title) {
    notFound();
  }

  return (
    <WatchPageClient
      type={type}
      id={id}
      tmdbId={tmdbId || id}
      imdbId={imdbId}
      title={title}
      posterPath={posterPath}
      backdropPath={backdropPath}
      overview={overview}
      voteAverage={voteAverage}
      releaseDate={releaseDate}
      genres={genres}
      cast={cast}
      similar={similar}
      seasons={seasons}
      isAnime={type === 'anime'}
      originalLanguage={originalLanguage}
      belongsToCollection={belongsToCollection}
    />
  );
}