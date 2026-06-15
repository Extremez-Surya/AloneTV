// Public keyless IMDb API client using FM-DB
const IMDB_PUBLIC_BASE_URL = 'https://imdb.iamidiotareyoutoo.com';

export interface IMDBPublicResult {
  title: string;
  year: number;
  imdbId: string;
  rank?: number;
  actors?: string;
  poster: string | null;
}

export async function searchIMDBPublic(query: string): Promise<IMDBPublicResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const res = await fetch(`${IMDB_PUBLIC_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
      next: { revalidate: 3600 },
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (data && data.ok && Array.isArray(data.description)) {
      return data.description.map((item: any) => ({
        title: item['#TITLE'] || '',
        year: item['#YEAR'] || 0,
        imdbId: item['#IMDB_ID'] || '',
        rank: item['#RANK'],
        actors: item['#ACTORS'] || '',
        poster: item['#IMG_POSTER'] || null,
      })).filter((item: any) => item.imdbId !== '');
    }

    return [];
  } catch (error) {
    console.error('IMDb public search API error:', error);
    return [];
  }
}
