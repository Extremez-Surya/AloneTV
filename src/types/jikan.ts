// Jikan API (MyAnimeList) Types

export interface JikanImage {
  image_url: string;
  small_image_url: string;
  large_image_url: string;
}

export interface JikanAnimeGenre {
  mal_id: number;
  name: string;
  type: string;
}

export interface JikanAired {
  from: string;
  to: string | null;
  string: string;
}

export interface JikanAnimeStudio {
  mal_id: number;
  name: string;
}

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  images: {
    jpg: JikanImage;
    webp: JikanImage;
  };
  synopsis: string | null;
  type: 'TV' | 'Movie' | 'OVA' | 'Special' | 'ONA' | 'Music';
  source: string;
  episodes: number | null;
  status: 'Currently Airing' | 'Finished Airing' | 'Not yet aired';
  airing: boolean;
  aired: JikanAired;
  duration: string;
  rating: string;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number;
  members: number;
  favorites: number;
  studios: JikanAnimeStudio[];
  genres: JikanAnimeGenre[];
  url: string;
}

export interface JikanAnimeEpisode {
  mal_id: number;
  anime_id: number;
  aired: string;
  score: number | null;
  filler: boolean;
  recap: boolean;
  forum_url: string;
  title: string;
  title_japanese: string | null;
  title_romanji: string | null;
  duration: number;
  synopsis: string | null;
}

export interface JikanCharacter {
  mal_id: number;
  name: string;
  name_kanji: string | null;
  images: {
    jpg: JikanImage;
    webp: JikanImage;
  };
  anime: Array<{
    mal_id: number;
    name: string;
    image: JikanImage;
  }>;
  voice_actors: Array<{
    mal_id: number;
    name: string;
    image: JikanImage;
    language: string;
  }>;
}

export interface JikanResponse<T> {
  data: T;
  request_hash: string;
  request_cached: boolean;
  request_cache_expiry: number;
}

export interface JikanPaginatedResponse<T> {
  data: T[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
  request_hash: string;
  request_cached: boolean;
  request_cache_expiry: number;
}

export interface JikanTopAnimeResponse {
  data: JikanAnime[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}