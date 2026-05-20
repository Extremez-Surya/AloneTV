import { cache } from 'react';
import {
  discoverMovies,
  discoverTVShows,
  getHighRatedMovies,
  getHighRatedTV,
  getNowPlayingMovies,
  getOnAirTV,
  getPopularMovies,
  getPopularTV,
  getTMDBImageUrl,
  getTopRatedMovies,
  getTopRatedTV,
  getTrendingMovies,
  getTrendingTV,
  getUpcomingMovies,
} from '@/lib/api/tmdb';
import { getTopAnime } from '@/lib/api/jikan';
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
  12: 'Adventure',
  16: 'Animation',
  18: 'Drama',
  27: 'Horror',
  28: 'Action',
  35: 'Comedy',
  36: 'History',
  53: 'Thriller',
  80: 'Crime',
  99: 'Documentary',
  878: 'Sci-Fi',
  9648: 'Mystery',
  10749: 'Romance',
  10751: 'Family',
  10752: 'War',
  10762: 'Kids',
  10764: 'Reality',
  10765: 'Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'Politics',
};

const QUALITY_THRESHOLD = 7.6;

function uniqueById(items: PremiumCollectionItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}-${item.id}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function pick(items: PremiumCollectionItem[], count = 20) {
  return uniqueById(items).slice(0, count);
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
  if (!genreIds || genreIds.length === 0) {
    return 'Featured';
  }

  return TMDB_GENRE_NAMES[genreIds[0]] ?? 'Featured';
}

function genreNames(genreIds: number[] | undefined) {
  if (!genreIds || genreIds.length === 0) {
    return ['Featured'];
  }

  return genreIds.map((genreId) => TMDB_GENRE_NAMES[genreId]).filter(Boolean);
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
    href: `/watch/movie/${movie.id}`,
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
    href: `/watch/tv/${show.id}`,
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
    posterUrl,
    backdropUrl: posterUrl,
    year,
    rating: typeof anime.score === 'number' ? Number(anime.score.toFixed(1)) : 0,
    quality: anime.score && anime.score >= 8 ? '4K' : 'HD',
    genres: anime.genres.map((genre) => genre.name).filter(Boolean),
    genreLabel: 'Anime',
    href: `/watch/anime/${anime.mal_id}`,
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

async function buildMovieCatalog() {
  const [trending, popular, topRated, nowPlaying, upcoming, highRated, bollywood, hollywood, southTamil, southTelugu, southMalayalam, southKannada, hindiDubbed, japanese, chinese] = await Promise.all([
    getTrendingMovies(),
    getPopularMovies(),
    getTopRatedMovies(),
    getNowPlayingMovies(),
    getUpcomingMovies(),
    getHighRatedMovies(),
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

  const combined = uniqueById([
    ...trendingItems,
    ...popularItems,
    ...topRatedItems,
    ...nowPlayingItems,
    ...upcomingItems,
    ...highRatedItems,
    ...bollywoodItems,
    ...hollywoodItems,
    ...southIndianItems,
    ...hindiDubbedItems,
    ...japaneseItems,
    ...chineseItems,
  ]);

  return {
    trending: trendingItems,
    popular: popularItems,
    topRated: topRatedItems,
    nowPlaying: nowPlayingItems,
    upcoming: upcomingItems,
    highRated: highRatedItems,
    bollywood: bollywoodItems,
    hollywood: firstFallback(hollywoodItems, popularItems),
    southIndian: firstFallback(southIndianItems, popularItems),
    hindiDubbed: firstFallback(hindiDubbedItems, popularItems),
    tamil: firstFallback(southTamil.map(mapMovie), popularItems),
    telugu: firstFallback(southTelugu.map(mapMovie), popularItems),
    malayalam: firstFallback(southMalayalam.map(mapMovie), popularItems),
    kannada: firstFallback(southKannada.map(mapMovie), popularItems),
    japanese: firstFallback(japaneseItems, popularItems),
    chinese: firstFallback(chineseItems, popularItems),
    all: combined,
  };
}

async function buildTVCatalog() {
  const [trending, popular, topRated, onAir, highRated, koreanDramas, netflixOriginals, primeContent, disneyContent, realityShows, kidsCollection, webSeries, miniSeries, standUpComedy] = await Promise.all([
    getTrendingTV(),
    getPopularTV(),
    getTopRatedTV(),
    getOnAirTV(),
    getHighRatedTV(),
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

  const combined = uniqueById([
    ...trendingItems,
    ...popularItems,
    ...topRatedItems,
    ...onAirItems,
    ...highRatedItems,
    ...koreanItems,
    ...netflixItems,
    ...primeItems,
    ...disneyItems,
    ...realityItems,
    ...kidsItems,
    ...webSeriesItems,
    ...miniSeriesItems,
    ...standUpItems,
  ]);

  return {
    trending: trendingItems,
    popular: popularItems,
    topRated: topRatedItems,
    onAir: onAirItems,
    highRated: highRatedItems,
    koreanDramas: firstFallback(koreanItems, popularItems),
    netflixOriginals: firstFallback(netflixItems, popularItems),
    primeContent: firstFallback(primeItems, popularItems),
    disneyContent: firstFallback(disneyItems, popularItems),
    realityShows: firstFallback(realityItems, popularItems),
    kidsCollection: firstFallback(kidsItems, popularItems),
    webSeries: firstFallback(webSeriesItems, popularItems),
    miniSeries: firstFallback(miniSeriesItems, popularItems),
    standUpComedy: firstFallback(standUpItems, popularItems),
    all: combined,
  };
}

async function buildAnimeCatalog() {
  const [airing, popular, upcoming, favorite] = await Promise.all([
    getTopAnime(1, 'airing'),
    getTopAnime(1, 'bypopularity'),
    getTopAnime(1, 'upcoming'),
    getTopAnime(1, 'favorite'),
  ]);

  const airingItems = airing.map(mapAnime);
  const popularItems = popular.map(mapAnime);
  const upcomingItems = upcoming.map(mapAnime);
  const favoriteItems = favorite.map(mapAnime);

  const uniqueAiring = uniqueById(airingItems);
  const uniquePopular = uniqueById(popularItems);
  const uniqueUpcoming = uniqueById(upcomingItems);
  const uniqueFavorite = uniqueById(favoriteItems);
  const combined = uniqueById([...uniqueAiring, ...uniquePopular, ...uniqueUpcoming, ...uniqueFavorite]);

  return {
    airing: uniqueAiring,
    popular: uniquePopular,
    upcoming: uniqueUpcoming,
    favorite: uniqueFavorite,
    all: combined,
  };
}

const getMovieCatalog = cache(buildMovieCatalog);
const getTVCatalog = cache(buildTVCatalog);
const getAnimeCatalog = cache(buildAnimeCatalog);

export const getHomePageModel = cache(async (): Promise<PremiumPageModel> => {
  const [movies, tv, anime] = await Promise.all([getMovieCatalog(), getTVCatalog(), getAnimeCatalog()]);
  const heroItems = pick([...movies.trending.slice(0, 3), ...tv.trending.slice(0, 3), ...anime.airing.slice(0, 3)], 6);

  return {
    heroItems,
    sections: [
      { id: 'trending-now', title: 'Trending Now', subtitle: 'The most talked-about titles this week', href: '/movies#trending-now', type: 'mixed', items: pick([...movies.trending, ...tv.trending]) },
      { id: 'popular-movies', title: 'Popular Movies', subtitle: 'Audience favorites across every genre', href: '/movies#popular-movies', type: 'movie', items: movies.popular },
      { id: 'popular-tv-shows', title: 'Popular TV Shows', subtitle: 'Binge-worthy series people keep returning to', href: '/tv#popular-tv-shows', type: 'tv', items: tv.popular },
      { id: 'top-rated', title: 'Top Rated', subtitle: 'Critically favored stories and series', href: '/movies#top-rated', type: 'mixed', items: pick([...movies.topRated, ...tv.topRated]) },
      { id: 'latest-releases', title: 'Latest Releases', subtitle: 'Fresh arrivals from theaters and TV', href: '/movies#latest-releases', type: 'mixed', items: pick([...movies.nowPlaying, ...tv.onAir, ...movies.upcoming]) },
      { id: 'bollywood-movies', title: 'Bollywood Movies', subtitle: 'Hindi cinema with big-screen energy', href: '/movies#bollywood-movies', type: 'movie', items: movies.bollywood },
      { id: 'hollywood-movies', title: 'Hollywood Movies', subtitle: 'English-language blockbusters and fan favorites', href: '/movies#hollywood-movies', type: 'movie', items: movies.hollywood },
      { id: 'south-indian-movies', title: 'South Indian Movies', subtitle: 'Tamil, Telugu, Malayalam, and Kannada picks', href: '/movies#south-indian-movies', type: 'movie', items: movies.southIndian },
      { id: 'hindi-dubbed-movies', title: 'Hindi Dubbed Movies', subtitle: 'Regional hits with Hindi audio reach', href: '/movies#hindi-dubbed-movies', type: 'movie', items: movies.hindiDubbed },
      { id: 'tamil-movies', title: 'Tamil Movies', subtitle: 'Tamil-language cinema with premium scale', href: '/movies#tamil-movies', type: 'movie', items: movies.tamil },
      { id: 'telugu-movies', title: 'Telugu Movies', subtitle: 'High-energy Telugu releases', href: '/movies#telugu-movies', type: 'movie', items: movies.telugu },
      { id: 'malayalam-movies', title: 'Malayalam Movies', subtitle: 'Thoughtful storytelling and strong performances', href: '/movies#malayalam-movies', type: 'movie', items: movies.malayalam },
      { id: 'kannada-movies', title: 'Kannada Movies', subtitle: 'Fresh Kannada titles and regional hits', href: '/movies#kannada-movies', type: 'movie', items: movies.kannada },
      { id: 'korean-dramas', title: 'Korean Dramas', subtitle: 'High-drama, high-style series', href: '/tv#korean-dramas', type: 'tv', items: tv.koreanDramas },
      { id: 'japanese-movies', title: 'Japanese Movies', subtitle: 'Japanese cinema with a cinematic edge', href: '/movies#japanese-movies', type: 'movie', items: movies.japanese },
      { id: 'chinese-movies', title: 'Chinese Movies', subtitle: 'Blockbusters and prestige titles', href: '/movies#chinese-movies', type: 'movie', items: movies.chinese },
      { id: 'anime', title: 'Anime', subtitle: 'Airing, popular, and upcoming anime', href: '/anime#airing-anime', type: 'anime', items: anime.all },
      { id: 'netflix-originals', title: 'Netflix Originals', subtitle: 'Platform-first originals and exclusives', href: '/tv#netflix-originals', type: 'tv', items: tv.netflixOriginals },
      { id: 'amazon-prime-content', title: 'Amazon Prime Content', subtitle: 'Big, polished original series', href: '/tv#amazon-prime-content', type: 'tv', items: tv.primeContent },
      { id: 'disney-plus-content', title: 'Disney+ Content', subtitle: 'Family-friendly and franchise-rich titles', href: '/tv#disney-plus-content', type: 'tv', items: tv.disneyContent },
      { id: 'action-movies', title: 'Action Movies', subtitle: 'High-octane chases and stunts', href: '/movies#action-movies', type: 'movie', items: byGenre(movies.all, 'Action') },
      { id: 'thriller-movies', title: 'Thriller Movies', subtitle: 'Edge-of-your-seat suspense', href: '/movies#thriller-movies', type: 'movie', items: byGenre(movies.all, 'Thriller') },
      { id: 'horror-movies', title: 'Horror Movies', subtitle: 'Dark, moody, and intense', href: '/movies#horror-movies', type: 'movie', items: byGenre(movies.all, 'Horror') },
      { id: 'comedy-movies', title: 'Comedy Movies', subtitle: 'Light, bright, and bingeable', href: '/movies#comedy-movies', type: 'movie', items: byGenre(movies.all, 'Comedy') },
      { id: 'romantic-movies', title: 'Romantic Movies', subtitle: 'Love stories with heart', href: '/movies#romantic-movies', type: 'movie', items: byGenre(movies.all, 'Romance') },
      { id: 'sci-fi-movies', title: 'Sci-Fi Movies', subtitle: 'Future worlds and bold ideas', href: '/movies#sci-fi-movies', type: 'movie', items: byGenre(movies.all, 'Sci-Fi') },
      { id: 'crime-movies', title: 'Crime Movies', subtitle: 'Heists, investigations, and underworld stories', href: '/movies#crime-movies', type: 'movie', items: byGenre(movies.all, 'Crime') },
      { id: 'mystery-movies', title: 'Mystery Movies', subtitle: 'Twists, clues, and reveals', href: '/movies#mystery-movies', type: 'movie', items: byGenre(movies.all, 'Mystery') },
      { id: 'adventure-movies', title: 'Adventure Movies', subtitle: 'Expansive journeys and discoveries', href: '/movies#adventure-movies', type: 'movie', items: byGenre(movies.all, 'Adventure') },
      { id: 'family-movies', title: 'Family Movies', subtitle: 'For every age group', href: '/movies#family-movies', type: 'movie', items: byGenre(movies.all, 'Family') },
      { id: 'documentary', title: 'Documentary', subtitle: 'Real stories, real impact', href: '/movies#documentary', type: 'movie', items: byGenre(movies.all, 'Documentary') },
      { id: 'award-winning-movies', title: 'Award Winning Movies', subtitle: 'Prestige cinema and festival favorites', href: '/movies#award-winning-movies', type: 'movie', items: movies.highRated },
      { id: 'trending-this-week', title: 'Trending This Week', subtitle: 'The week’s fastest-rising titles', href: '/movies#trending-this-week', type: 'mixed', items: pick([...movies.trending, ...tv.trending, ...anime.airing]) },
      { id: 'most-watched', title: 'Most Watched', subtitle: 'What everyone is playing right now', href: '/movies#most-watched', type: 'mixed', items: pick([...movies.popular, ...tv.popular]) },
      { id: 'recommended-for-you', title: 'Recommended For You', subtitle: 'A premium blend of the best available content', href: '/movies#recommended-for-you', type: 'mixed', items: pick([...movies.highRated, ...tv.highRated, ...movies.popular]) },
      { id: 'continue-watching', title: 'Continue Watching', subtitle: 'Pick up where the feed left off', href: '/movies#continue-watching', type: 'mixed', items: pick([...movies.nowPlaying, ...tv.onAir, ...anime.airing]) },
      { id: 'newly-added', title: 'Newly Added', subtitle: 'Recent arrivals with fresh posters', href: '/movies#newly-added', type: 'mixed', items: pick([...movies.nowPlaying, ...movies.upcoming, ...tv.onAir]) },
      { id: 'upcoming', title: 'Upcoming', subtitle: 'Coming soon to the platform', href: '/movies#upcoming', type: 'mixed', items: pick([...movies.upcoming, ...anime.upcoming]) },
      { id: 'imdb-top-rated', title: 'IMDB Top Rated', subtitle: 'The strongest community ratings in the catalog', href: '/movies#imdb-top-rated', type: 'mixed', items: sortByRating([...movies.topRated, ...tv.topRated]) },
      { id: 'oscar-winning-movies', title: 'Oscar Winning Movies', subtitle: 'Decorated films with major awards pedigree', href: '/movies#oscar-winning-movies', type: 'movie', items: movies.highRated },
      { id: 'stand-up-comedy', title: 'Stand-Up Comedy', subtitle: 'Specials and laugh-out-loud sets', href: '/tv#stand-up-comedy', type: 'tv', items: tv.standUpComedy },
      { id: 'web-series', title: 'Web Series', subtitle: 'Serialized stories built for streaming', href: '/tv#web-series', type: 'tv', items: tv.webSeries },
      { id: 'mini-series', title: 'Mini Series', subtitle: 'Tight, compact, high-impact storytelling', href: '/tv#mini-series', type: 'tv', items: tv.miniSeries },
      { id: 'reality-shows', title: 'Reality Shows', subtitle: 'Competition, lifestyle, and unscripted buzz', href: '/tv#reality-shows', type: 'tv', items: tv.realityShows },
      { id: 'animated-movies', title: 'Animated Movies', subtitle: 'Stylized, all-ages visual storytelling', href: '/movies#animated-movies', type: 'movie', items: byGenre(movies.all, 'Animation') },
      { id: 'kids-collection', title: 'Kids Collection', subtitle: 'Family safe picks for younger audiences', href: '/tv#kids-collection', type: 'tv', items: tv.kidsCollection },
    ],
  };
});

export const getMoviesPageModel = cache(async (): Promise<PremiumPageModel> => {
  const movies = await getMovieCatalog();

  return {
    heroItems: pick([...movies.trending.slice(0, 3), ...movies.highRated.slice(0, 3), ...movies.nowPlaying.slice(0, 3)], 6),
    sections: [
      { id: 'trending-now', title: 'Trending Now', href: '/movies#trending-now', type: 'movie', items: movies.trending },
      { id: 'popular-movies', title: 'Popular Movies', href: '/movies#popular-movies', type: 'movie', items: movies.popular },
      { id: 'top-rated', title: 'Top Rated', href: '/movies#top-rated', type: 'movie', items: movies.topRated },
      { id: 'latest-releases', title: 'Latest Releases', href: '/movies#latest-releases', type: 'movie', items: movies.nowPlaying },
      { id: 'bollywood-movies', title: 'Bollywood Movies', href: '/movies#bollywood-movies', type: 'movie', items: movies.bollywood },
      { id: 'hollywood-movies', title: 'Hollywood Movies', href: '/movies#hollywood-movies', type: 'movie', items: movies.hollywood },
      { id: 'south-indian-movies', title: 'South Indian Movies', href: '/movies#south-indian-movies', type: 'movie', items: movies.southIndian },
      { id: 'hindi-dubbed-movies', title: 'Hindi Dubbed Movies', href: '/movies#hindi-dubbed-movies', type: 'movie', items: movies.hindiDubbed },
      { id: 'tamil-movies', title: 'Tamil Movies', href: '/movies#tamil-movies', type: 'movie', items: movies.tamil },
      { id: 'telugu-movies', title: 'Telugu Movies', href: '/movies#telugu-movies', type: 'movie', items: movies.telugu },
      { id: 'malayalam-movies', title: 'Malayalam Movies', href: '/movies#malayalam-movies', type: 'movie', items: movies.malayalam },
      { id: 'kannada-movies', title: 'Kannada Movies', href: '/movies#kannada-movies', type: 'movie', items: movies.kannada },
      { id: 'japanese-movies', title: 'Japanese Movies', href: '/movies#japanese-movies', type: 'movie', items: movies.japanese },
      { id: 'chinese-movies', title: 'Chinese Movies', href: '/movies#chinese-movies', type: 'movie', items: movies.chinese },
      { id: 'action-movies', title: 'Action Movies', href: '/movies#action-movies', type: 'movie', items: byGenre(movies.all, 'Action') },
      { id: 'thriller-movies', title: 'Thriller Movies', href: '/movies#thriller-movies', type: 'movie', items: byGenre(movies.all, 'Thriller') },
      { id: 'horror-movies', title: 'Horror Movies', href: '/movies#horror-movies', type: 'movie', items: byGenre(movies.all, 'Horror') },
      { id: 'comedy-movies', title: 'Comedy Movies', href: '/movies#comedy-movies', type: 'movie', items: byGenre(movies.all, 'Comedy') },
      { id: 'romantic-movies', title: 'Romantic Movies', href: '/movies#romantic-movies', type: 'movie', items: byGenre(movies.all, 'Romance') },
      { id: 'sci-fi-movies', title: 'Sci-Fi Movies', href: '/movies#sci-fi-movies', type: 'movie', items: byGenre(movies.all, 'Sci-Fi') },
      { id: 'crime-movies', title: 'Crime Movies', href: '/movies#crime-movies', type: 'movie', items: byGenre(movies.all, 'Crime') },
      { id: 'mystery-movies', title: 'Mystery Movies', href: '/movies#mystery-movies', type: 'movie', items: byGenre(movies.all, 'Mystery') },
      { id: 'adventure-movies', title: 'Adventure Movies', href: '/movies#adventure-movies', type: 'movie', items: byGenre(movies.all, 'Adventure') },
      { id: 'family-movies', title: 'Family Movies', href: '/movies#family-movies', type: 'movie', items: byGenre(movies.all, 'Family') },
      { id: 'documentary', title: 'Documentary', href: '/movies#documentary', type: 'movie', items: byGenre(movies.all, 'Documentary') },
      { id: 'award-winning-movies', title: 'Award Winning Movies', href: '/movies#award-winning-movies', type: 'movie', items: movies.highRated },
      { id: 'trending-this-week', title: 'Trending This Week', href: '/movies#trending-this-week', type: 'mixed', items: pick([...movies.trending, ...movies.popular]) },
      { id: 'most-watched', title: 'Most Watched', href: '/movies#most-watched', type: 'mixed', items: pick([...movies.popular, ...movies.highRated]) },
      { id: 'recommended-for-you', title: 'Recommended For You', href: '/movies#recommended-for-you', type: 'mixed', items: pick([...movies.highRated, ...movies.topRated, ...movies.popular]) },
      { id: 'continue-watching', title: 'Continue Watching', href: '/movies#continue-watching', type: 'mixed', items: pick([...movies.nowPlaying, ...movies.upcoming]) },
      { id: 'newly-added', title: 'Newly Added', href: '/movies#newly-added', type: 'mixed', items: pick([...movies.nowPlaying, ...movies.upcoming]) },
      { id: 'upcoming', title: 'Upcoming', href: '/movies#upcoming', type: 'movie', items: movies.upcoming },
      { id: 'imdb-top-rated', title: 'IMDB Top Rated', href: '/movies#imdb-top-rated', type: 'movie', items: sortByRating(movies.topRated) },
      { id: 'oscar-winning-movies', title: 'Oscar Winning Movies', href: '/movies#oscar-winning-movies', type: 'movie', items: movies.highRated },
      { id: 'animated-movies', title: 'Animated Movies', href: '/movies#animated-movies', type: 'movie', items: byGenre(movies.all, 'Animation') },
    ],
  };
});

export const getTVPageModel = cache(async (): Promise<PremiumPageModel> => {
  const tv = await getTVCatalog();

  return {
    heroItems: pick([...tv.trending.slice(0, 3), ...tv.highRated.slice(0, 3), ...tv.onAir.slice(0, 3)], 6),
    sections: [
      { id: 'trending-now', title: 'Trending Now', href: '/tv#trending-now', type: 'tv', items: tv.trending },
      { id: 'popular-tv-shows', title: 'Popular TV Shows', href: '/tv#popular-tv-shows', type: 'tv', items: tv.popular },
      { id: 'top-rated', title: 'Top Rated', href: '/tv#top-rated', type: 'tv', items: tv.topRated },
      { id: 'latest-releases', title: 'Latest Releases', href: '/tv#latest-releases', type: 'tv', items: tv.onAir },
      { id: 'korean-dramas', title: 'Korean Dramas', href: '/tv#korean-dramas', type: 'tv', items: tv.koreanDramas },
      { id: 'netflix-originals', title: 'Netflix Originals', href: '/tv#netflix-originals', type: 'tv', items: tv.netflixOriginals },
      { id: 'amazon-prime-content', title: 'Amazon Prime Content', href: '/tv#amazon-prime-content', type: 'tv', items: tv.primeContent },
      { id: 'disney-plus-content', title: 'Disney+ Content', href: '/tv#disney-plus-content', type: 'tv', items: tv.disneyContent },
      { id: 'web-series', title: 'Web Series', href: '/tv#web-series', type: 'tv', items: tv.webSeries },
      { id: 'mini-series', title: 'Mini Series', href: '/tv#mini-series', type: 'tv', items: tv.miniSeries },
      { id: 'reality-shows', title: 'Reality Shows', href: '/tv#reality-shows', type: 'tv', items: tv.realityShows },
      { id: 'stand-up-comedy', title: 'Stand-Up Comedy', href: '/tv#stand-up-comedy', type: 'tv', items: tv.standUpComedy },
      { id: 'kids-collection', title: 'Kids Collection', href: '/tv#kids-collection', type: 'tv', items: tv.kidsCollection },
      { id: 'trending-this-week', title: 'Trending This Week', href: '/tv#trending-this-week', type: 'mixed', items: pick([...tv.trending, ...tv.popular]) },
      { id: 'most-watched', title: 'Most Watched', href: '/tv#most-watched', type: 'mixed', items: pick([...tv.popular, ...tv.highRated]) },
      { id: 'recommended-for-you', title: 'Recommended For You', href: '/tv#recommended-for-you', type: 'mixed', items: pick([...tv.highRated, ...tv.topRated, ...tv.popular]) },
      { id: 'continue-watching', title: 'Continue Watching', href: '/tv#continue-watching', type: 'mixed', items: pick([...tv.onAir, ...tv.topRated]) },
      { id: 'newly-added', title: 'Newly Added', href: '/tv#newly-added', type: 'mixed', items: pick([...tv.onAir, ...tv.popular]) },
      { id: 'imdb-top-rated', title: 'IMDB Top Rated', href: '/tv#imdb-top-rated', type: 'tv', items: sortByRating(tv.topRated) },
    ],
  };
});

export const getAnimePageModel = cache(async (): Promise<PremiumPageModel> => {
  const anime = await getAnimeCatalog();

  return {
    heroItems: pick([...anime.airing.slice(0, 3), ...anime.popular.slice(0, 3), ...anime.upcoming.slice(0, 3)], 6),
    sections: [
      { id: 'airing-anime', title: 'Airing Anime', href: '/anime#airing-anime', type: 'anime', items: anime.airing },
      { id: 'popular-anime', title: 'Popular Anime', href: '/anime#popular-anime', type: 'anime', items: anime.popular },
      { id: 'upcoming-anime', title: 'Upcoming Anime', href: '/anime#upcoming-anime', type: 'anime', items: anime.upcoming },
      { id: 'favorite-anime', title: 'Fan Favorites', href: '/anime#favorite-anime', type: 'anime', items: anime.favorite },
    ],
  };
});

export { mapAnime, mapMovie, mapTV };
export { getTMDBImageUrl };