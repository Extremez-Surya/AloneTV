// Supabase Database Types

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  media_type: 'movie' | 'tv' | 'anime';
  media_id: number;
  title: string;
  poster_path: string | null;
  added_at: string;
}

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  media_type: 'movie' | 'tv' | 'anime';
  media_id: number;
  episode_id: number | null;
  episode_number: number | null;
  season_number: number | null;
  progress_seconds: number;
  duration_seconds: number;
  watched_at: string;
}

// API Response types
export interface WatchHistoryResponse {
  data: WatchHistoryItem[];
  error: null;
}

export interface WatchlistResponse {
  data: WatchlistItem[];
  error: null;
}

// Auth types
export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  email_confirmed_at: string | null;
  aud: string;
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  provider: string | null;
}