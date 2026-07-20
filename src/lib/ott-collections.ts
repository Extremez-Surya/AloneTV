import { cache } from 'react';
import {
  discoverMovies,
  discoverTVShows,
  fetchTMDbPages,
  getTMDBImageUrl,
} from '@/lib/api/tmdb';
import { getTopAnimePages } from '@/lib/api/jikan';
import type { JikanAnime } from '@/types/jikan';
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb';

export type PremiumMediaType = 'movie' | 'tv' | 'anime';

export interface PremiumCollectionItem {
  id: number;
  type: PremiumMediaType;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  year: string;
  rating: number;
  quality: 'HD' | '4K';
  genres: string[];
  genreLabel: string;
  href: string;
}

export interface PremiumCollectionSection {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: PremiumMediaType | 'mixed';
  items: PremiumCollectionItem[];
}

export interface PremiumPageModel {
  heroItems: PremiumCollectionItem[];
  sections: PremiumCollectionSection[];
}

const TMDB_GENRE_NAMES: Record<number, string> = {
  12: 'Adventure', 16: 'Animation', 18: 'Drama', 27: 'Horror', 28: 'Action',
  35: 'Comedy', 36: 'History', 53: 'Thriller', 80: 'Crime', 99: 'Documentary',
  878: 'Sci-Fi', 9648: 'Mystery', 10749: 'Romance', 10751: 'Family',
  10752: 'War', 10762: 'Kids', 10764: 'Reality', 10765: 'Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'Politics',
};

const QUALITY_THRESHOLD = 7.6;

function uniqueById(items: PremiumCollectionItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pick(items: PremiumCollectionItem[], count = 20) {
  return uniqueById(items).slice(0, count);
}

function nonEmpty(sections: PremiumCollectionSection[]) {
  return sections.filter(s => s.items.length > 0);
}

function poster(path: string | null) {
  return getTMDBImageUrl(path, 'w780');
}

function rating(value: number | null | undefined) {
  return typeof value === 'number' ? Number(value.toFixed(1)) : 0;
}

function quality(value: number) {
  return value >= QUALITY_THRESHOLD ? '4K' : 'HD';
}

function genreLabel(genreIds: number[] | undefined) {
  if (!genreIds || genreIds.length === 0) return 'Featured';
  return TMDB_GENRE_NAMES[genreIds[0]] ?? 'Featured';
}

function genreNames(genreIds: number[] | undefined) {
  if (!genreIds || genreIds.length === 0) return ['Featured'];
  return genreIds.map((genreId) => TMDB_GENRE_NAMES[genreId]).filter(Boolean);
}

const API_KEY_MISSING = !process.env.TMDB_API_KEY || process.env.TMDB_API_KEY === 'your_tmdb_api_key_here';

const DEMO_MOVIES: PremiumCollectionItem[] = [
  { id: 1, type: 'movie', title: 'The Dark Knight', overview: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests.', posterUrl: null, backdropUrl: null, year: '2008', rating: 8.5, quality: '4K', genres: ['Action', 'Crime'], genreLabel: 'Action', href: '/detail/movie/1' },
  { id: 2, type: 'movie', title: 'Inception', overview: 'A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea.', posterUrl: null, backdropUrl: null, year: '2010', rating: 8.3, quality: '4K', genres: ['Action', 'Sci-Fi'], genreLabel: 'Action', href: '/detail/movie/2' },
  { id: 3, type: 'movie', title: 'Interstellar', overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.', posterUrl: null, backdropUrl: null, year: '2014', rating: 8.7, quality: '4K', genres: ['Adventure', 'Drama', 'Sci-Fi'], genreLabel: 'Adventure', href: '/detail/movie/3' },
  { id: 4, type: 'movie', title: 'Avatar: The Way of Water', overview: 'Jake Sully lives with his newfound family on the world of Pandora.', posterUrl: null, backdropUrl: null, year: '2022', rating: 7.8, quality: '4K', genres: ['Action', 'Adventure', 'Fantasy'], genreLabel: 'Action', href: '/detail/movie/4' },
  { id: 5, type: 'movie', title: 'Jawan', overview: 'A man driven by revenge to fix the societal evils.', posterUrl: null, backdropUrl: null, year: '2023', rating: 7.0, quality: 'HD', genres: ['Action', 'Thriller'], genreLabel: 'Action', href: '/detail/movie/5' },
  { id: 6, type: 'movie', title: 'Spider-Man: No Way Home', overview: 'With Spider-Man identity now revealed, Peter asks Doctor Strange for help.', posterUrl: null, backdropUrl: null, year: '2021', rating: 8.0, quality: '4K', genres: ['Action', 'Adventure'], genreLabel: 'Action', href: '/detail/movie/6' },
  { id: 7, type: 'movie', title: 'Oppenheimer', overview: 'The story of American scientist J. Robert Oppenheimer.', posterUrl: null, backdropUrl: null, year: '2023', rating: 8.5, quality: '4K', genres: ['Drama', 'History', 'Thriller'], genreLabel: 'Drama', href: '/detail/movie/7' },
  { id: 8, type: 'movie', title: 'Dune: Part Two', overview: 'Paul Atreides unites with the Fremen to seek revenge.', posterUrl: null, backdropUrl: null, year: '2024', rating: 8.6, quality: '4K', genres: ['Action', 'Adventure', 'Sci-Fi'], genreLabel: 'Action', href: '/detail/movie/8' },
  { id: 9, type: 'movie', title: 'RRR', overview: 'A fictional story about two Indian revolutionaries.', posterUrl: null, backdropUrl: null, year: '2022', rating: 7.9, quality: '4K', genres: ['Action', 'Drama'], genreLabel: 'Action', href: '/detail/movie/9' },
  { id: 10, type: 'movie', title: 'The Batman', overview: 'When a serial killer targets Gotham elite, Batman investigates.', posterUrl: null, backdropUrl: null, year: '2022', rating: 7.9, quality: '4K', genres: ['Action', 'Crime', 'Drama'], genreLabel: 'Action', href: '/detail/movie/10' },
  { id: 11, type: 'movie', title: 'Pathaan', overview: 'An exiled agent must work with a scientist to stop a nuclear threat.', posterUrl: null, backdropUrl: null, year: '2023', rating: 7.5, quality: 'HD', genres: ['Action', 'Thriller'], genreLabel: 'Action', href: '/detail/movie/11' },
  { id: 12, type: 'movie', title: 'Everything Everywhere', overview: 'A middle-aged Chinese immigrant is swept up into an insane adventure.', posterUrl: null, backdropUrl: null, year: '2022', rating: 8.1, quality: '4K', genres: ['Action', 'Adventure', 'Comedy'], genreLabel: 'Action', href: '/detail/movie/12' },
  { id: 13, type: 'movie', title: 'The Shawshank Redemption', overview: 'Two imprisoned men bond over a number of years.', posterUrl: null, backdropUrl: null, year: '1994', rating: 8.7, quality: '4K', genres: ['Drama'], genreLabel: 'Drama', href: '/detail/movie/13' },
  { id: 14, type: 'movie', title: 'Pushpa 2', overview: 'The rise of a laborer who becomes a sandalwood smuggler.', posterUrl: null, backdropUrl: null, year: '2024', rating: 7.2, quality: 'HD', genres: ['Action', 'Drama'], genreLabel: 'Action', href: '/detail/movie/14' },
  { id: 15, type: 'movie', title: 'The Matrix', overview: 'A computer hacker learns about the true nature of reality.', posterUrl: null, backdropUrl: null, year: '1999', rating: 8.0, quality: '4K', genres: ['Action', 'Sci-Fi'], genreLabel: 'Action', href: '/detail/movie/15' },
];

const DEMO_TV: PremiumCollectionItem[] = [
  { id: 101, type: 'tv', title: 'Stranger Things', overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments.', posterUrl: null, backdropUrl: null, year: '2016', rating: 8.6, quality: '4K', genres: ['Drama', 'Fantasy', 'Horror'], genreLabel: 'Drama', href: '/detail/tv/101' },
  { id: 102, type: 'tv', title: 'Breaking Bad', overview: 'A high school chemistry teacher turned methamphetamine producer.', posterUrl: null, backdropUrl: null, year: '2008', rating: 9.5, quality: '4K', genres: ['Crime', 'Drama', 'Thriller'], genreLabel: 'Crime', href: '/detail/tv/102' },
  { id: 103, type: 'tv', title: 'Game of Thrones', overview: 'Nine noble families fight for control of the lands of Westeros.', posterUrl: null, backdropUrl: null, year: '2011', rating: 9.2, quality: '4K', genres: ['Action', 'Adventure', 'Drama'], genreLabel: 'Action', href: '/detail/tv/103' },
  { id: 104, type: 'tv', title: 'Squid Game', overview: 'Hundreds of cash-strapped players accept a strange invitation to compete in children games.', posterUrl: null, backdropUrl: null, year: '2021', rating: 8.0, quality: '4K', genres: ['Drama', 'Thriller'], genreLabel: 'Drama', href: '/detail/tv/104' },
  { id: 105, type: 'tv', title: 'Money Heist', overview: 'A mysterious man plans the biggest heist in recorded history.', posterUrl: null, backdropUrl: null, year: '2017', rating: 8.3, quality: '4K', genres: ['Action', 'Crime', 'Thriller'], genreLabel: 'Action', href: '/detail/tv/105' },
  { id: 106, type: 'tv', title: 'The Last of Us', overview: 'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl.', posterUrl: null, backdropUrl: null, year: '2023', rating: 8.8, quality: '4K', genres: ['Action', 'Drama', 'Horror'], genreLabel: 'Action', href: '/detail/tv/106' },
  { id: 107, type: 'tv', title: 'Dark', overview: 'A family saga with a supernatural twist, set in a German town.', posterUrl: null, backdropUrl: null, year: '2017', rating: 8.7, quality: '4K', genres: ['Crime', 'Drama', 'Mystery'], genreLabel: 'Crime', href: '/detail/tv/107' },
  { id: 108, type: 'tv', title: 'Wednesday', overview: 'Follows Wednesday Addams years as a student at Nevermore Academy.', posterUrl: null, backdropUrl: null, year: '2022', rating: 8.1, quality: '4K', genres: ['Comedy', 'Fantasy', 'Mystery'], genreLabel: 'Comedy', href: '/detail/tv/108' },
  { id: 109, type: 'tv', title: 'The Crown', overview: 'Follows the political rivalries and romance of Queen Elizabeth II reign.', posterUrl: null, backdropUrl: null, year: '2016', rating: 8.6, quality: '4K', genres: ['Drama', 'History'], genreLabel: 'Drama', href: '/detail/tv/109' },
  { id: 110, type: 'tv', title: 'Narcos', overview: 'A chronicled look at the criminal exploits of Colombian drug lord Pablo Escobar.', posterUrl: null, backdropUrl: null, year: '2015', rating: 8.8, quality: '4K', genres: ['Crime', 'Drama', 'Thriller'], genreLabel: 'Crime', href: '/detail/tv/110' },
];

const DEMO_ANIME: PremiumCollectionItem[] = [
  { id: 201, type: 'anime', title: 'Attack on Titan', overview: 'Humanity fights for survival against giant humanoid Titans.', posterUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', backdropUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', year: '2013', rating: 9.1, quality: '4K', genres: ['Action', 'Drama', 'Fantasy'], genreLabel: 'Anime', href: '/detail/anime/201' },
  { id: 202, type: 'anime', title: 'Demon Slayer', overview: 'A young boy becomes a demon slayer to avenge his family.', posterUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', backdropUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', year: '2019', rating: 8.7, quality: '4K', genres: ['Action', 'Fantasy'], genreLabel: 'Anime', href: '/detail/anime/202' },
  { id: 203, type: 'anime', title: 'Jujutsu Kaisen', overview: 'A boy swallows a cursed talisman and joins a school of Jujutsu sorcerers.', posterUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', backdropUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', year: '2020', rating: 8.6, quality: '4K', genres: ['Action', 'Fantasy'], genreLabel: 'Anime', href: '/detail/anime/203' },
  { id: 204, type: 'anime', title: 'One Piece', overview: 'Monkey D. Luffy sets off on an adventure to find the One Piece treasure.', posterUrl: 'https://cdn.myanimelist.net/images/anime/1244/138851.jpg', backdropUrl: 'https://cdn.myanimelist.net/images/anime/1244/138851.jpg', year: '1999', rating: 8.7, quality: '4K', genres: ['Action', 'Adventure', 'Comedy'], genreLabel: 'Anime', href: '/detail/anime/204' },
  { id: 205, type: 'anime', title: 'Naruto Shippuden', overview: 'Naruto Uzumaki returns to Konoha after two years of training.', posterUrl: 'https://cdn.myanimelist.net/images/anime/1565/111305.jpg', backdropUrl: 'https://cdn.myanimelist.net/images/anime/1565/111305.jpg', year: '2007', rating: 8.2, quality: '4K', genres: ['Action', 'Adventure'], genreLabel: 'Anime', href: '/detail/anime/205' },
  { id: 206, type: 'anime', title: 'Death Note', overview: 'A high school student discovers a supernatural notebook.', posterUrl: 'https://cdn.myanimelist.net/images/anime/1079/138161.jpg', backdropUrl: 'https://cdn.myanimelist.net/images/anime/1079/138161.jpg', year: '2006', rating: 8.6, quality: '4K', genres: ['Crime', 'Drama', 'Mystery'], genreLabel: 'Anime', href: '/detail/anime/206' },
  { id: 207, type: 'anime', title: 'Fullmetal Alchemist: Brotherhood', overview: 'Two brothers search for the Philosopher Stone to restore their bodies.', posterUrl: 'https://cdn.myanimelist.net/images/anime/1208/94745.jpg', backdropUrl: 'https://cdn.myanimelist.net/images/anime/1208/94745.jpg', year: '2009', rating: 9.1, quality: '4K', genres: ['Action', 'Adventure', 'Drama'], genreLabel: 'Anime', href: '/detail/anime/207' },
  { id: 208, type: 'anime', title: 'Solo Leveling', overview: 'In a world of hunters and monsters, the weakest hunter gets a second chance.', posterUrl: 'https://cdn.myanimelist.net/images/anime/1920/141049.jpg', backdropUrl: 'https://cdn.myanimelist.net/images/anime/1920/141049.jpg', year: '2024', rating: 8.8, quality: '4K', genres: ['Action', 'Fantasy'], genreLabel: 'Anime', href: '/detail/anime/208' },
  { id: 209, type: 'anime', title: 'Spy x Family', overview: 'A spy must build a family to complete a mission.', posterUrl: 'https://cdn.myanimelist.net/images/anime/1441/122753.jpg', backdropUrl: 'https://cdn.myanimelist.net/images/anime/1441/122753.jpg', year: '2022', rating: 8.3, quality: '4K', genres: ['Action', 'Comedy'], genreLabel: 'Anime', href: '/detail/anime/209' },
  { id: 210, type: 'anime', title: 'Chainsaw Man', overview: 'A young man who makes a contract with a devil hunts devils.', posterUrl: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', backdropUrl: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', year: '2022', rating: 8.4, quality: '4K', genres: ['Action', 'Fantasy'], genreLabel: 'Anime', href: '/detail/anime/210' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mapMovie(movie: TMDBMovie): PremiumCollectionItem {
  return {
    id: movie.id,
    type: 'movie',
    title: movie.title,
    overview: movie.overview,
    posterUrl: poster(movie.poster_path),
    backdropUrl: poster(movie.backdrop_path),
    year: movie.release_date?.split('-')[0] || '2025',
    rating: rating(movie.vote_average),
    quality: quality(movie.vote_average),
    genres: genreNames(movie.genre_ids),
    genreLabel: genreLabel(movie.genre_ids),
    href: `/detail/movie/${movie.id}`,
  };
}

function mapTV(show: TMDBTVShow): PremiumCollectionItem {
  return {
    id: show.id,
    type: 'tv',
    title: show.name,
    overview: show.overview,
    posterUrl: poster(show.poster_path),
    backdropUrl: poster(show.backdrop_path),
    year: show.first_air_date?.split('-')[0] || '2025',
    rating: rating(show.vote_average),
    quality: quality(show.vote_average),
    genres: genreNames(show.genre_ids),
    genreLabel: genreLabel(show.genre_ids),
    href: `/detail/tv/${show.id}`,
  };
}

function mapAnime(anime: JikanAnime): PremiumCollectionItem {
  const year = anime.aired?.from?.slice(0, 4) || anime.aired?.string?.match(/\b(19|20)\d{2}\b/)?.[0] || '2025';
  const posterUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null;
  return {
    id: anime.mal_id,
    type: 'anime',
    title: anime.title,
    overview: anime.synopsis || anime.title,
    posterUrl: posterUrl || `https://placehold.co/342x513/1a1a2e/a855f7?text=${encodeURIComponent(anime.title.slice(0, 20))}`,
    backdropUrl: posterUrl,
    year,
    rating: typeof anime.score === 'number' ? Number(anime.score.toFixed(1)) : 0,
    quality: anime.score && anime.score >= 8 ? '4K' : 'HD',
    genres: anime.genres.map((genre) => genre.name).filter(Boolean),
    genreLabel: 'Anime',
    href: `/detail/anime/${anime.mal_id}`,
  };
}

function byGenre(items: PremiumCollectionItem[], label: string) {
  const needle = label.toLowerCase();
  return items.filter((item) => item.genres.some((genre) => genre.toLowerCase() === needle));
}

function sortByRating(items: PremiumCollectionItem[]) {
  return [...items].sort((left, right) => right.rating - left.rating || right.year.localeCompare(left.year));
}

function firstFallback(primary: PremiumCollectionItem[], fallback: PremiumCollectionItem[]) {
  return primary.length > 0 ? primary : fallback;
}

function demoMode() {
  return {
    trending: shuffle(DEMO_MOVIES).slice(0, 10),
    popular: shuffle(DEMO_MOVIES).slice(0, 10),
    topRated: sortByRating(DEMO_MOVIES).slice(0, 10),
    nowPlaying: shuffle(DEMO_MOVIES).slice(0, 8),
    upcoming: shuffle(DEMO_MOVIES).slice(0, 5),
    highRated: sortByRating(DEMO_MOVIES).slice(0, 8),
    bollywood: shuffle(DEMO_MOVIES).filter(m => m.title.match(/Pathaan|Jawan|RRR/i)).slice(0, 5).length > 0
      ? shuffle(DEMO_MOVIES).filter(m => m.title.match(/Pathaan|Jawan|RRR/i))
      : shuffle(DEMO_MOVIES).slice(0, 5),
    hollywood: shuffle(DEMO_MOVIES).slice(0, 10),
    southIndian: shuffle(DEMO_MOVIES).filter(m => m.title.match(/Pushpa|RRR/i)),
    hindiDubbed: shuffle(DEMO_MOVIES).slice(0, 6),
    tamil: shuffle(DEMO_MOVIES).slice(0, 4),
    telugu: shuffle(DEMO_MOVIES).slice(0, 4),
    malayalam: shuffle(DEMO_MOVIES).slice(0, 4),
    kannada: shuffle(DEMO_MOVIES).slice(0, 4),
    japanese: shuffle(DEMO_MOVIES).slice(0, 4),
    chinese: shuffle(DEMO_MOVIES).slice(0, 4),
    all: DEMO_MOVIES,
  };
}

function demoTVMode() {
  return {
    trending: shuffle(DEMO_TV).slice(0, 8),
    popular: shuffle(DEMO_TV).slice(0, 8),
    topRated: sortByRating(DEMO_TV).slice(0, 8),
    onAir: shuffle(DEMO_TV).slice(0, 6),
    highRated: sortByRating(DEMO_TV).slice(0, 6),
    koreanDramas: shuffle(DEMO_TV).filter(m => m.title.match(/Squid/i)).length > 0
      ? shuffle(DEMO_TV).filter(m => m.title.match(/Squid/i))
      : shuffle(DEMO_TV).slice(0, 4),
    netflixOriginals: shuffle(DEMO_TV).slice(0, 6),
    primeContent: shuffle(DEMO_TV).slice(0, 4),
    disneyContent: shuffle(DEMO_TV).slice(0, 4),
    realityShows: shuffle(DEMO_TV).slice(0, 3),
    kidsCollection: shuffle(DEMO_TV).slice(0, 3),
    webSeries: shuffle(DEMO_TV).slice(0, 5),
    webSeriesOnly: shuffle(DEMO_TV).slice(0, 5),
    miniSeries: shuffle(DEMO_TV).slice(0, 4),
    standUpComedy: shuffle(DEMO_TV).slice(0, 3),
    all: DEMO_TV,
  };
}

function demoAnimeMode() {
  return {
    airing: shuffle(DEMO_ANIME).slice(0, 8),
    popular: shuffle(DEMO_ANIME).slice(0, 8),
    upcoming: shuffle(DEMO_ANIME).slice(0, 5),
    favorite: sortByRating(DEMO_ANIME).slice(0, 8),
    all: DEMO_ANIME,
  };
}

async function buildMovieCatalog() {
  if (API_KEY_MISSING) return demoMode();

  const PAGES = 3

  const [trending, popular, topRated, nowPlaying, upcoming, highRated, bollywood, hollywood, southTamil, southTelugu, southMalayalam, southKannada, hindiDubbed, japanese, chinese] = await Promise.all([
    fetchTMDbPages<TMDBMovie>(p => `/trending/movie/week?page=${p}`, PAGES),
    fetchTMDbPages<TMDBMovie>(p => `/movie/popular?page=${p}`, PAGES),
    fetchTMDbPages<TMDBMovie>(p => `/movie/top_rated?page=${p}`, PAGES),
    fetchTMDbPages<TMDBMovie>(p => `/movie/now_playing?page=${p}`, PAGES),
    fetchTMDbPages<TMDBMovie>(p => `/movie/upcoming?page=${p}`, PAGES),
    fetchTMDbPages<TMDBMovie>(p => `/discover/movie?vote_average.gte=8&sort_by=vote_average.desc&page=${p}`, PAGES),
    discoverMovies({ sort_by: 'popularity.desc', filters: { with_original_language: 'hi' } }).then((data) => data.results),
    discoverMovies({ sort_by: 'popularity.desc', filters: { with_original_language: 'en' } }).then((data) => data.results),
    discoverMovies({ sort_by: 'popularity.desc', filters: { with_original_language: 'ta' } }).then((data) => data.results),
    discoverMovies({ sort_by: 'popularity.desc', filters: { with_original_language: 'te' } }).then((data) => data.results),
    discoverMovies({ sort_by: 'popularity.desc', filters: { with_original_language: 'ml' } }).then((data) => data.results),
    discoverMovies({ sort_by: 'popularity.desc', filters: { with_original_language: 'kn' } }).then((data) => data.results),
    discoverMovies({ sort_by: 'popularity.desc', filters: { with_original_language: 'hi' } }).then((data) => data.results),
    discoverMovies({ sort_by: 'popularity.desc', filters: { with_original_language: 'ja' } }).then((data) => data.results),
    discoverMovies({ sort_by: 'popularity.desc', filters: { with_original_language: 'zh' } }).then((data) => data.results),
  ]);

  if (!trending.length) return demoMode();

  const trendingItems = trending.map(mapMovie);
  const popularItems = popular.map(mapMovie);
  const topRatedItems = topRated.map(mapMovie);
  const nowPlayingItems = nowPlaying.map(mapMovie);
  const upcomingItems = upcoming.map(mapMovie);
  const highRatedItems = highRated.map(mapMovie);
  const bollywoodItems = bollywood.map(mapMovie);
  const hollywoodItems = hollywood.map(mapMovie);
  const southIndianItems = [...southTamil, ...southTelugu, ...southMalayalam, ...southKannada].map(mapMovie);
  const hindiDubbedItems = hindiDubbed.map(mapMovie);
  const japaneseItems = japanese.map(mapMovie);
  const chineseItems = chinese.map(mapMovie);

  const combined = uniqueById([...trendingItems, ...popularItems, ...topRatedItems, ...nowPlayingItems, ...upcomingItems, ...highRatedItems, ...bollywoodItems, ...hollywoodItems, ...southIndianItems, ...hindiDubbedItems, ...japaneseItems, ...chineseItems]);

  return {
    trending: trendingItems, popular: popularItems, topRated: topRatedItems, nowPlaying: nowPlayingItems,
    upcoming: upcomingItems, highRated: highRatedItems, bollywood: bollywoodItems, hollywood: firstFallback(hollywoodItems, popularItems),
    southIndian: firstFallback(southIndianItems, popularItems), hindiDubbed: firstFallback(hindiDubbedItems, popularItems),
    tamil: firstFallback(southTamil.map(mapMovie), popularItems), telugu: firstFallback(southTelugu.map(mapMovie), popularItems),
    malayalam: firstFallback(southMalayalam.map(mapMovie), popularItems), kannada: firstFallback(southKannada.map(mapMovie), popularItems),
    japanese: firstFallback(japaneseItems, popularItems), chinese: firstFallback(chineseItems, popularItems), all: combined,
  };
}

async function buildTVCatalog() {
  if (API_KEY_MISSING) return demoTVMode();

  const PAGES = 3

  const [trending, popular, topRated, onAir, highRated, koreanDramas, netflixOriginals, primeContent, disneyContent, realityShows, kidsCollection, webSeries, miniSeries, standUpComedy] = await Promise.all([
    fetchTMDbPages<TMDBTVShow>(p => `/trending/tv/week?page=${p}`, PAGES),
    fetchTMDbPages<TMDBTVShow>(p => `/tv/popular?page=${p}`, PAGES),
    fetchTMDbPages<TMDBTVShow>(p => `/tv/top_rated?page=${p}`, PAGES),
    fetchTMDbPages<TMDBTVShow>(p => `/tv/on_the_air?page=${p}`, PAGES),
    fetchTMDbPages<TMDBTVShow>(p => `/discover/tv?vote_average.gte=8&sort_by=vote_average.desc&page=${p}`, PAGES),
    discoverTVShows({ sort_by: 'popularity.desc', filters: { with_origin_country: 'KR' } }).then((data) => data.results),
    discoverTVShows({ sort_by: 'popularity.desc', filters: { with_networks: 213 } }).then((data) => data.results),
    discoverTVShows({ sort_by: 'popularity.desc', filters: { with_networks: 1024 } }).then((data) => data.results),
    discoverTVShows({ sort_by: 'popularity.desc', filters: { with_networks: 2739 } }).then((data) => data.results),
    discoverTVShows({ sort_by: 'popularity.desc', filters: { with_genres: 10764 } }).then((data) => data.results),
    discoverTVShows({ sort_by: 'popularity.desc', filters: { with_genres: 10762 } }).then((data) => data.results),
    discoverTVShows({ sort_by: 'popularity.desc', filters: { with_genres: 10767 } }).then((data) => data.results),
    discoverTVShows({ sort_by: 'popularity.desc', filters: { with_genres: 10766 } }).then((data) => data.results),
    discoverTVShows({ sort_by: 'popularity.desc', filters: { with_genres: 10764 } }).then((data) => data.results),
  ]);

  if (!trending.length) return demoTVMode();

  const trendingItems = trending.map(mapTV);
  const popularItems = popular.map(mapTV);
  const topRatedItems = topRated.map(mapTV);
  const onAirItems = onAir.map(mapTV);
  const highRatedItems = highRated.map(mapTV);
  const koreanItems = koreanDramas.map(mapTV);
  const netflixItems = netflixOriginals.map(mapTV);
  const primeItems = primeContent.map(mapTV);
  const disneyItems = disneyContent.map(mapTV);
  const realityItems = realityShows.map(mapTV);
  const kidsItems = kidsCollection.map(mapTV);
  const webSeriesItems = webSeries.map(mapTV);
  const miniSeriesItems = miniSeries.map(mapTV);
  const standUpItems = standUpComedy.map(mapTV);
  const combined = uniqueById([...trendingItems, ...popularItems, ...topRatedItems, ...onAirItems, ...highRatedItems, ...koreanItems, ...netflixItems, ...primeItems, ...disneyItems, ...realityItems, ...kidsItems, ...webSeriesItems, ...miniSeriesItems, ...standUpItems]);

  return {
    trending: trendingItems, popular: popularItems, topRated: topRatedItems, onAir: onAirItems, highRated: highRatedItems,
    koreanDramas: firstFallback(koreanItems, popularItems), netflixOriginals: firstFallback(netflixItems, popularItems),
    primeContent: firstFallback(primeItems, popularItems), disneyContent: firstFallback(disneyItems, popularItems),
    realityShows: firstFallback(realityItems, popularItems), kidsCollection: firstFallback(kidsItems, popularItems),
    webSeriesOnly: webSeriesItems, webSeries: firstFallback(webSeriesItems, popularItems),
    miniSeries: firstFallback(miniSeriesItems, popularItems), standUpComedy: firstFallback(standUpItems, popularItems), all: combined,
  };
}

async function buildAnimeCatalog() {
  const [airing, popular, upcoming, favorite] = await Promise.all([
    getTopAnimePages(3, 'airing'), getTopAnimePages(3, 'bypopularity'), getTopAnimePages(3, 'upcoming'), getTopAnimePages(3, 'favorite'),
  ]);

  if (!airing.length) return demoAnimeMode();

  const airingItems = airing.map(mapAnime);
  const popularItems = popular.map(mapAnime);
  const upcomingItems = upcoming.map(mapAnime);
  const favoriteItems = favorite.map(mapAnime);
  const uniqueAiring = uniqueById(airingItems);
  const uniquePopular = uniqueById(popularItems);
  const uniqueUpcoming = uniqueById(upcomingItems);
  const uniqueFavorite = uniqueById(favoriteItems);
  const combined = uniqueById([...uniqueAiring, ...uniquePopular, ...uniqueUpcoming, ...uniqueFavorite]);

  return { airing: uniqueAiring, popular: uniquePopular, upcoming: uniqueUpcoming, favorite: uniqueFavorite, all: combined };
}

const getMovieCatalog = cache(buildMovieCatalog);
const getTVCatalog = cache(buildTVCatalog);
const getAnimeCatalog = cache(buildAnimeCatalog);

function createSections(movies: any, tv: any, anime: any): PremiumCollectionSection[] {
  return [
    { id: 'trending-now', title: 'Trending Now', subtitle: 'The most talked-about titles this week', href: '/movies#trending-now', type: 'mixed' as const, items: pick([...movies.trending, ...tv.trending]) },
    { id: 'popular-movies', title: 'Popular Movies', subtitle: 'Audience favorites across every genre', href: '/movies#popular-movies', type: 'movie' as const, items: movies.popular },
    { id: 'popular-tv-shows', title: 'Popular TV Shows', subtitle: 'Binge-worthy series people keep returning to', href: '/tv#popular-tv-shows', type: 'tv' as const, items: tv.popular },
    { id: 'top-rated', title: 'Top Rated', subtitle: 'Critically favored stories and series', href: '/movies#top-rated', type: 'mixed' as const, items: pick([...movies.topRated, ...tv.topRated]) },
    { id: 'latest-releases', title: 'Latest Releases', subtitle: 'Fresh arrivals from theaters and TV', href: '/movies#latest-releases', type: 'mixed' as const, items: pick([...movies.nowPlaying, ...tv.onAir, ...movies.upcoming]) },
    { id: 'hollywood-movies', title: 'Hollywood Movies', subtitle: 'English-language blockbusters and fan favorites', href: '/movies#hollywood-movies', type: 'movie' as const, items: movies.hollywood },
    { id: 'anime', title: 'Anime', subtitle: 'Airing, popular, and upcoming anime', href: '/anime#airing-anime', type: 'anime' as const, items: anime.all },
    { id: 'netflix-originals', title: 'Netflix Originals', subtitle: 'Platform-first originals and exclusives', href: '/tv#netflix-originals', type: 'tv' as const, items: tv.netflixOriginals },
    { id: 'action-movies', title: 'Action Movies', subtitle: 'High-octane chases and stunts', href: '/movies#action-movies', type: 'movie' as const, items: byGenre(movies.all, 'Action') },
    { id: 'comedy-movies', title: 'Comedy Movies', subtitle: 'Light, bright, and bingeable', href: '/movies#comedy-movies', type: 'movie' as const, items: byGenre(movies.all, 'Comedy') },
    { id: 'recommended-for-you', title: 'Recommended For You', subtitle: 'A premium blend of the best available content', href: '/movies#recommended-for-you', type: 'mixed' as const, items: pick([...movies.highRated, ...tv.highRated, ...movies.popular]) },
  ].filter(s => s.items.length > 0);
}

export const getHomePageModel = cache(async (): Promise<PremiumPageModel> => {
  const [movies, tv, anime] = await Promise.all([getMovieCatalog(), getTVCatalog(), getAnimeCatalog()]);
  const heroItems = pick([...movies.trending.slice(0, 3), ...tv.trending.slice(0, 3), ...anime.airing.slice(0, 3)], 6);
  return { heroItems, sections: createSections(movies, tv, anime) };
});

export const getMoviesPageModel = cache(async (): Promise<PremiumPageModel> => {
  const movies = await getMovieCatalog();
  return {
    heroItems: pick([...movies.trending.slice(0, 3), ...movies.highRated.slice(0, 3), ...movies.nowPlaying.slice(0, 3)], 6),
    sections: nonEmpty([
      { id: 'trending-now', title: 'Trending Now', href: '/movies#trending-now', type: 'movie', items: movies.trending },
      { id: 'popular-movies', title: 'Popular Movies', href: '/movies#popular-movies', type: 'movie', items: movies.popular },
      { id: 'top-rated', title: 'Top Rated', href: '/movies#top-rated', type: 'movie', items: movies.topRated },
      { id: 'latest-releases', title: 'Latest Releases', href: '/movies#latest-releases', type: 'movie', items: movies.nowPlaying },
      { id: 'hollywood-movies', title: 'Hollywood Movies', href: '/movies#hollywood-movies', type: 'movie', items: movies.hollywood },
      { id: 'action-movies', title: 'Action Movies', href: '/movies#action-movies', type: 'movie', items: byGenre(movies.all, 'Action') },
      { id: 'comedy-movies', title: 'Comedy Movies', href: '/movies#comedy-movies', type: 'movie', items: byGenre(movies.all, 'Comedy') },
      { id: 'horror-movies', title: 'Horror Movies', href: '/movies#horror-movies', type: 'movie', items: byGenre(movies.all, 'Horror') },
      { id: 'recommended-for-you', title: 'Recommended For You', href: '/movies#recommended-for-you', type: 'mixed', items: pick([...movies.highRated, ...movies.topRated, ...movies.popular]) },
    ]),
  };
});

export const getTVPageModel = cache(async (): Promise<PremiumPageModel> => {
  const tv = await getTVCatalog();
  return {
    heroItems: pick([...tv.trending.slice(0, 3), ...tv.highRated.slice(0, 3), ...tv.onAir.slice(0, 3)], 6),
    sections: nonEmpty([
      { id: 'trending-now', title: 'Trending Now', href: '/tv#trending-now', type: 'tv', items: tv.trending },
      { id: 'popular-tv-shows', title: 'Popular TV Shows', href: '/tv#popular-tv-shows', type: 'tv', items: tv.popular },
      { id: 'top-rated', title: 'Top Rated', href: '/tv#top-rated', type: 'tv', items: tv.topRated },
      { id: 'latest-releases', title: 'Latest Releases', href: '/tv#latest-releases', type: 'tv', items: tv.onAir },
      { id: 'netflix-originals', title: 'Netflix Originals', href: '/tv#netflix-originals', type: 'tv', items: tv.netflixOriginals },
      { id: 'recommended-for-you', title: 'Recommended For You', href: '/tv#recommended-for-you', type: 'mixed', items: pick([...tv.highRated, ...tv.topRated, ...tv.popular]) },
    ]),
  };
});

export const getWebSeriesPageModel = cache(async (): Promise<PremiumPageModel> => {
  const tv = await getTVCatalog();
  return { heroItems: pick(tv.webSeriesOnly.slice(0, 6), 6), sections: [{ id: 'web-series', title: 'Web Series', subtitle: 'Serialized stories built for streaming', href: '/web-series#web-series', type: 'tv', items: tv.webSeriesOnly }] };
});

export const getAnimePageModel = cache(async (): Promise<PremiumPageModel> => {
  const anime = await getAnimeCatalog();
  return {
    heroItems: pick([...anime.airing.slice(0, 3), ...anime.popular.slice(0, 3), ...anime.upcoming.slice(0, 3)], 6),
    sections: nonEmpty([
      { id: 'airing-anime', title: 'Airing Anime', href: '/anime#airing-anime', type: 'anime', items: anime.airing },
      { id: 'popular-anime', title: 'Popular Anime', href: '/anime#popular-anime', type: 'anime', items: anime.popular },
      { id: 'upcoming-anime', title: 'Upcoming Anime', href: '/anime#upcoming-anime', type: 'anime', items: anime.upcoming },
      { id: 'favorite-anime', title: 'Fan Favorites', href: '/anime#favorite-anime', type: 'anime', items: anime.favorite },
    ]),
  };
});

export { mapAnime, mapMovie, mapTV };
export { getTMDBImageUrl };
