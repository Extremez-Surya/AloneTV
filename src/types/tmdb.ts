// TMDB API Types

export interface TMDBImage {
  file_path: string;
  width?: number;
  height?: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCredits {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: 'Trailer' | 'Teaser' | 'Clip' | 'Featurette' | 'Behind the Scenes' | 'Bloopers';
  official: boolean;
}

export interface TMDBSeason {
  id: number;
  name: string;
  season_number: number;
  overview: string;
  poster_path: string | null;
  air_date: string;
  episode_count: number;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  season_number: number;
  episode_number: number;
  air_date: string;
  runtime: number | null;
  vote_average: number;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  video: boolean;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  original_language: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country: string[];
}

export interface TMDBMovieDetail extends TMDBMovie {
  runtime: number | null;
  budget: number;
  revenue: number;
  genres: TMDBGenre[];
  status: string;
  tagline: string | null;
  imdb_id?: string;
  videos: {
    results: TMDBVideo[];
  };
  credits: {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
  };
  images: {
    backdrops: TMDBImage[];
    posters: TMDBImage[];
  };
}

export interface TMDBTVShowDetail extends TMDBTVShow {
  runtime: number | null;
  episode_run_time: number[];
  genres: TMDBGenre[];
  status: string;
  tagline: string | null;
  imdb_id?: string;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TMDBSeason[];
  external_ids?: {
    imdb_id?: string;
    tvdb_id?: number;
  };
  videos: {
    results: TMDBVideo[];
  };
  credits: {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
  };
  images: {
    backdrops: TMDBImage[];
    posters: TMDBImage[];
  };
}

export interface TMDBSearchResult {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBSearchResult[];
  total_pages: number;
  total_results: number;
}

export interface TMDBTrendingResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBPerson {
  id: number;
  name: string;
  known_for_department: string;
  profile_path: string | null;
  popularity: number;
  known_for: TMDBSearchResult[];
  adult: boolean;
  gender: number;
}

export interface TMDBPersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  also_known_as: string[];
  gender: number;
  popularity: number;
  homepage: string | null;
  imdb_id: string | null;
  combined_credits: {
    cast: TMDBCredit[];
    crew: TMDBCrewMember[];
  };
}

export interface TMDBCredit {
  id: number;
  title?: string;
  name?: string;
  character: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  popularity: number;
  overview: string;
  genre_ids: number[];
  credit_id: string;
  order: number;
}

// Image URL helper
export function getTMDBImageUrl(
  path: string | null,
  size: 'w780' | 'w500' | 'w342' | 'original' | 'h632' = 'w780'
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}