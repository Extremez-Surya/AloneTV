// OMDB API Client
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

export interface OMDBMovie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

const apiKey = process.env.OMDB_API_KEY;

export async function getMovieByTitle(title: string): Promise<OMDBMovie | null> {
  try {
    const res = await fetch(`${OMDB_BASE_URL}?t=${encodeURIComponent(title)}&apikey=${apiKey}`);
    const data = await res.json();
    if (data.Response === 'True') {
      return data;
    }
    return null;
  } catch (error) {
    console.error('OMDB API error:', error);
    return null;
  }
}

export async function getMovieByIMDB(imdbId: string): Promise<OMDBMovie | null> {
  try {
    const res = await fetch(`${OMDB_BASE_URL}?i=${imdbId}&apikey=${apiKey}`);
    const data = await res.json();
    if (data.Response === 'True') {
      return data;
    }
    return null;
  } catch (error) {
    console.error('OMDB API error:', error);
    return null;
  }
}

export async function searchMovies(query: string): Promise<OMDBMovie[]> {
  try {
    const res = await fetch(`${OMDB_BASE_URL}?s=${encodeURIComponent(query)}&apikey=${apiKey}`);
    const data = await res.json();
    if (data.Response === 'True' && data.Search) {
      return data.Search;
    }
    return [];
  } catch (error) {
    console.error('OMDB search error:', error);
    return [];
  }
}