// Kitsu API Client (No API Key Required)
const KITSU_BASE_URL = 'https://kitsu.io/api/edge';

export interface KitsuMediaResult {
  id: string;
  type: 'anime' | 'manga';
  title: string;
  synopsis: string;
  averageRating: string | null;
  posterImage: string | null;
  backdropImage: string | null;
  startDate: string | null;
  subtype: string | null;
  status: string | null;
  episodeCount: number | null;
}

export async function searchKitsuAnime(query: string, limit = 10): Promise<KitsuMediaResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const url = `${KITSU_BASE_URL}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      return data.data.map((item: any) => {
        const attr = item.attributes || {};
        return {
          id: item.id || '',
          type: 'anime' as const,
          title: attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp || '',
          synopsis: attr.synopsis || attr.description || '',
          averageRating: attr.averageRating || null,
          posterImage: attr.posterImage?.medium || attr.posterImage?.original || null,
          backdropImage: attr.coverImage?.original || attr.coverImage?.large || null,
          startDate: attr.startDate || null,
          subtype: attr.subtype || null,
          status: attr.status || null,
          episodeCount: attr.episodeCount || null,
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Kitsu anime search API error:', error);
    return [];
  }
}

export async function getKitsuAnimeDetail(id: string): Promise<KitsuMediaResult | null> {
  try {
    const url = `${KITSU_BASE_URL}/anime/${id}`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data && data.data) {
      const item = data.data;
      const attr = item.attributes || {};
      return {
        id: item.id || '',
        type: 'anime' as const,
        title: attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp || '',
        synopsis: attr.synopsis || attr.description || '',
        averageRating: attr.averageRating || null,
        posterImage: attr.posterImage?.medium || attr.posterImage?.original || null,
        backdropImage: attr.coverImage?.original || attr.coverImage?.large || null,
        startDate: attr.startDate || null,
        subtype: attr.subtype || null,
        status: attr.status || null,
        episodeCount: attr.episodeCount || null,
      };
    }
    return null;
  } catch (error) {
    console.error('Kitsu anime detail API error:', error);
    return null;
  }
}
