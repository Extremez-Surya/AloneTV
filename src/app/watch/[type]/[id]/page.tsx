import { notFound } from 'next/navigation';
import { getMovieDetail, getTVShowDetail, getSimilarMovies, getSimilarTVShows, getTMDBImageUrl, getExternalIds } from '@/lib/api/tmdb';
import { getAnimeDetail } from '@/lib/api/jikan';
import WatchPageClient from '@/components/video/WatchPageClient';

interface WatchPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const resolvedParams = await params;
  const { type, id } = resolvedParams;

  if (!['movie', 'tv', 'anime'].includes(type)) {
    notFound();
  }

  const mediaId = parseInt(id);
  if (isNaN(mediaId)) {
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
  let tmdbId = mediaId;

  try {
    if (type === 'movie') {
      const movie = await getMovieDetail(mediaId);
      if (movie && movie.id) {
        title = movie.title || '';
        posterPath = movie.poster_path || '';
        backdropPath = movie.backdrop_path || '';
        overview = movie.overview || '';
        voteAverage = movie.vote_average || 0;
        releaseDate = movie.release_date || '';
        genres = movie.genres || [];
        cast = movie.credits?.cast?.slice(0, 10) || [];
        imdbId = movie.imdb_id || '';
        const similarData = await getSimilarMovies(mediaId);
        similar = similarData || [];
      }
    } else if (type === 'tv') {
      const tv = await getTVShowDetail(mediaId);
      if (tv && tv.id) {
        title = tv.name || 'TV Show';
        posterPath = tv.poster_path || '';
        backdropPath = tv.backdrop_path || '';
        overview = tv.overview || '';
        voteAverage = tv.vote_average || 0;
        releaseDate = tv.first_air_date || '';
        genres = tv.genres || [];
        cast = tv.credits?.cast?.slice(0, 10) || [];
        seasons = tv.seasons?.filter((s: any) => s.season_number > 0) || [];
        // Get IMDB ID for TV shows
        imdbId = (tv as any).external_ids?.imdb_id || '';
        const similarData = await getSimilarTVShows(mediaId);
        similar = similarData || [];
      }
    } else if (type === 'anime') {
      const anime = await getAnimeDetail(mediaId);
      if (anime && anime.mal_id) {
        title = anime.title || '';
        posterPath = anime.images?.jpg?.large_image_url || '';
        backdropPath = anime.images?.jpg?.large_image_url || '';
        overview = anime.synopsis || '';
        voteAverage = anime.score || 0;
        releaseDate = anime.aired?.from || '';
        genres = anime.genres?.slice(0, 4).map((g: { mal_id: number; name: string }) => ({
          id: g.mal_id,
          name: g.name,
        })) || [];
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
      tmdbId={tmdbId}
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
    />
  );
}