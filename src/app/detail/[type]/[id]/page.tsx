import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/layout/JsonLd';
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
import DetailPageClient from '@/components/detail/DetailPageClient';

interface DetailPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

async function getMediaInfo(type: string, id: string) {
  let title = '';
  let overview = '';
  let posterPath = '';
  try {
    if (id.startsWith('tt')) {
      const findResult = await findByImdbId(id);
      if (findResult) {
        const movieMatch = findResult.movie_results?.[0];
        const tvMatch = findResult.tv_results?.[0];
        if (movieMatch) {
          title = movieMatch.title || '';
          overview = movieMatch.overview || '';
          posterPath = movieMatch.poster_path ? `https://image.tmdb.org/t/p/w780${movieMatch.poster_path}` : '';
        } else if (tvMatch) {
          title = tvMatch.name || '';
          overview = tvMatch.overview || '';
          posterPath = tvMatch.poster_path ? `https://image.tmdb.org/t/p/w780${tvMatch.poster_path}` : '';
        }
      }
    } else if (id.startsWith('tvmaze-')) {
      const tvmazeId = parseInt(id.replace('tvmaze-', ''));
      if (!isNaN(tvmazeId)) {
        const show = await getTVMazeShowDetail(tvmazeId);
        if (show) {
          title = show.name;
          overview = show.summary ? show.summary.replace(/<[^>]*>/g, '') : '';
          posterPath = show.image?.medium || show.image?.original || '';
        }
      }
    } else if (id.startsWith('kitsu-')) {
      const kitsuId = id.replace('kitsu-', '');
      const anime = await getKitsuAnimeDetail(kitsuId);
      if (anime) {
        title = anime.title;
        overview = anime.synopsis || '';
        posterPath = anime.posterImage || '';
      }
    } else {
      const mediaId = parseInt(id);
      if (!isNaN(mediaId)) {
        if (type === 'movie') {
          const movie = await getMovieDetail(mediaId);
          if (movie) {
            title = movie.title || '';
            overview = movie.overview || '';
            posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : '';
          }
        } else if (type === 'tv' || type === 'anime') {
          const tv = await getTVShowDetail(mediaId);
          if (tv) {
            title = tv.name || '';
            overview = tv.overview || '';
            posterPath = tv.poster_path ? `https://image.tmdb.org/t/p/w780${tv.poster_path}` : '';
          }
        }
      }
    }

    if (type === 'anime' && !title) {
      const mediaId = parseInt(id);
      if (!isNaN(mediaId)) {
        const anime = await getAnimeDetail(mediaId);
        if (anime) {
          title = anime.title || '';
          overview = anime.synopsis || '';
          posterPath = anime.images?.jpg?.large_image_url || '';
        }
      }
    }
  } catch (error) {
    console.error('Metadata resolver error:', error);
  }

  return { title, overview, posterPath };
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { type, id } = resolvedParams;

  const info = await getMediaInfo(type, id);
  if (!info.title) {
    return {
      title: 'Media Details | VinayTV',
      description: 'Browse movie and show details on VinayTV.',
    };
  }

  const cleanDescription = info.overview.slice(0, 160) + (info.overview.length > 160 ? '...' : '');

  return {
    title: `${info.title} — Details & Streaming Info | VinayTV`,
    description: cleanDescription || `Browse ${info.title} details, cast, seasons, and start streaming on VinayTV.`,
    keywords: [info.title, type, 'streaming', 'VinayTV'],
    alternates: {
      canonical: `https://vinaytv.vercel.app/detail/${type}/${id}`,
    },
    openGraph: {
      title: `${info.title} — Details & Streaming Info | VinayTV`,
      description: cleanDescription,
      type: 'video.other',
      images: info.posterPath ? [{ url: info.posterPath }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${info.title} — Details & Streaming Info | VinayTV`,
      description: cleanDescription,
      images: info.posterPath ? [info.posterPath] : [],
    },
  };
}

export default async function DetailPage({ params }: DetailPageProps) {
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

  try {
    if (id.startsWith('tt')) {
      imdbId = id;
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

        const tmdbSearch = await searchMulti(anime.title);
        const matched = tmdbSearch.find(r => r.media_type === 'tv' || r.media_type === 'movie');
        if (matched) {
          tmdbId = matched.id;
          type = matched.media_type;
        }
      }
    } else {
      const mediaId = parseInt(id);
      if (!isNaN(mediaId)) {
        tmdbId = mediaId;
      }
    }

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

          const searchTitle = anime.title_english || anime.title || '';
          if (searchTitle) {
            const tmdbSearch = await searchMulti(searchTitle);
            const isMalMovie = anime.type?.toLowerCase() === 'movie';
            let matched = tmdbSearch.find(r =>
              isMalMovie ? r.media_type === 'movie' : r.media_type === 'tv'
            );
            if (!matched) {
              matched = tmdbSearch.find(r => r.media_type === 'tv' || r.media_type === 'movie');
            }
            if (matched) {
              tmdbId = matched.id;
              type = matched.media_type;
              if (type === 'tv') {
                const tv = await getTVShowDetail(tmdbId);
                if (tv && tv.id) {
                  cast = tv.credits?.cast?.slice(0, 10) || [];
                  seasons = tv.seasons?.filter((s: any) => s.season_number > 0) || [];
                  imdbId = (tv as any).external_ids?.imdb_id || '';
                  const similarData = await getSimilarTVShows(tmdbId);
                  similar = similarData || [];
                }
              } else if (type === 'movie') {
                const movie = await getMovieDetail(tmdbId);
                if (movie && movie.id) {
                  cast = movie.credits?.cast?.slice(0, 10) || [];
                  imdbId = movie.imdb_id || '';
                  const similarData = await getSimilarMovies(tmdbId);
                  similar = similarData || [];
                }
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

  const mediaSchema = {
    "@context": "https://schema.org",
    "@type": type === 'movie' ? 'Movie' : 'TVSeries',
    "name": title,
    "description": overview,
    "image": posterPath ? (posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w780${posterPath}`) : undefined,
    "dateCreated": releaseDate,
    "genre": genres.map(g => g.name),
    "actor": cast.slice(0, 5).map((c: any) => ({
      "@type": "Person",
      "name": c.name
    }))
  };

  return (
    <>
      <JsonLd schema={mediaSchema} />
      <DetailPageClient
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
    </>
  );
}
