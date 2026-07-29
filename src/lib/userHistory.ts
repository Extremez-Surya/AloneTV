export interface UserMediaItem {
  id: string | number;
  tmdbId?: string | number;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  posterPath?: string | null;
  posterUrl?: string | null;
  backdropPath?: string | null;
  backdropUrl?: string | null;
  releaseDate?: string;
  year?: string;
  rating?: number;
  voteAverage?: number;
  quality?: string;
  genres?: string[];
  genreLabel?: string;
  href?: string;
  season?: number;
  episode?: number;
  progress?: number;
  duration?: number;
  watchedAt?: string;
  addedAt?: string;
}

const CONTINUE_KEY = 'alonetv_continue_watching';
const WATCHLIST_KEY = 'alonetv_watchlist';

export function getContinueWatchingList(): UserMediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CONTINUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse continue watching list:', e);
    return [];
  }
}

export function getWatchlist(): UserMediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(WATCHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse watchlist:', e);
    return [];
  }
}

export function addToContinueWatching(item: UserMediaItem): UserMediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const history = getContinueWatchingList();
    const cleanHistory = history.filter(
      (h) => !(String(h.id) === String(item.id) && h.type === item.type)
    );

    const newItem: UserMediaItem = {
      ...item,
      id: String(item.id),
      tmdbId: item.tmdbId ? String(item.tmdbId) : String(item.id),
      title: item.title || 'Untitled',
      posterUrl: item.posterUrl || (item.posterPath ? (item.posterPath.startsWith('http') ? item.posterPath : `https://image.tmdb.org/t/p/w342${item.posterPath}`) : null),
      backdropUrl: item.backdropUrl || (item.backdropPath ? (item.backdropPath.startsWith('http') ? item.backdropPath : `https://image.tmdb.org/t/p/w780${item.backdropPath}`) : null),
      year: item.year || (item.releaseDate ? item.releaseDate.split('-')[0] : '2025'),
      rating: item.rating || item.voteAverage || 0,
      quality: item.quality || (item.rating && item.rating >= 7.6 ? '4K' : 'HD'),
      href: item.href || `/detail/${item.type}/${item.id}`,
      watchedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...cleanHistory].slice(0, 20);
    localStorage.setItem(CONTINUE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('alonetv_continue_watching_changed'));
    return updated;
  } catch (e) {
    console.error('Failed to add item to continue watching:', e);
    return [];
  }
}

export function addToWatchlist(item: UserMediaItem): UserMediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const watchlist = getWatchlist();
    const exists = watchlist.some(
      (w) => String(w.id) === String(item.id) && w.type === item.type
    );
    if (exists) return watchlist;

    const newItem: UserMediaItem = {
      ...item,
      id: String(item.id),
      tmdbId: item.tmdbId ? String(item.tmdbId) : String(item.id),
      title: item.title || 'Untitled',
      posterUrl: item.posterUrl || (item.posterPath ? (item.posterPath.startsWith('http') ? item.posterPath : `https://image.tmdb.org/t/p/w342${item.posterPath}`) : null),
      backdropUrl: item.backdropUrl || (item.backdropPath ? (item.backdropPath.startsWith('http') ? item.backdropPath : `https://image.tmdb.org/t/p/w780${item.backdropPath}`) : null),
      year: item.year || (item.releaseDate ? item.releaseDate.split('-')[0] : '2025'),
      rating: item.rating || item.voteAverage || 0,
      quality: item.quality || (item.rating && item.rating >= 7.6 ? '4K' : 'HD'),
      href: item.href || `/detail/${item.type}/${item.id}`,
      addedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...watchlist];
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('alonetv_watchlist_changed'));
    return updated;
  } catch (e) {
    console.error('Failed to add to watchlist:', e);
    return [];
  }
}

export function removeFromWatchlist(id: string | number, type?: string): UserMediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const watchlist = getWatchlist();
    const updated = watchlist.filter((w) => {
      if (type && w.type !== type) return true;
      return String(w.id) !== String(id) && String(w.tmdbId) !== String(id);
    });
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('alonetv_watchlist_changed'));
    return updated;
  } catch (e) {
    console.error('Failed to remove from watchlist:', e);
    return [];
  }
}

export function removeFromContinueWatching(id: string | number, type?: string): UserMediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const history = getContinueWatchingList();
    const updated = history.filter((h) => {
      if (type && h.type !== type) return true;
      return String(h.id) !== String(id) && String(h.tmdbId) !== String(id);
    });
    localStorage.setItem(CONTINUE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('alonetv_continue_watching_changed'));
    return updated;
  } catch (e) {
    console.error('Failed to remove from continue watching:', e);
    return [];
  }
}

export function isInWatchlist(id: string | number, type?: string): boolean {
  if (typeof window === 'undefined') return false;
  const watchlist = getWatchlist();
  return watchlist.some((w) => {
    if (type && w.type !== type) return false;
    return String(w.id) === String(id) || String(w.tmdbId) === String(id);
  });
}
