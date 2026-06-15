import { NextRequest, NextResponse } from 'next/server';
import { getAiringAnime } from '@/lib/api/jikan';

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch TVmaze schedule for today
    const tvmazeRes = await fetch('https://api.tvmaze.com/schedule?country=US', {
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    let tvEpisodes: any[] = [];
    if (tvmazeRes.ok) {
      const data = await tvmazeRes.json();
      if (Array.isArray(data)) {
        tvEpisodes = data
          .filter((item: any) => item.show && (item.show.weight || 0) >= 55) // Keep reasonably popular shows
          .map((item: any) => {
            const network = item.show.network?.name || item.show.webChannel?.name || 'Streaming';
            return {
              id: `tvmaze-ep-${item.id}`,
              showId: `tvmaze-${item.show.id}`,
              type: 'tv',
              showName: item.show.name,
              episodeName: item.name,
              season: item.season,
              episodeNumber: item.number,
              airtime: item.airtime || '12:00',
              network,
              posterUrl: item.image?.medium || item.show.image?.medium || null,
              rating: item.show.rating?.average || 0,
              weight: item.show.weight || 0,
              imdbId: item.show.externals?.imdb || null,
              summary: item.summary ? item.summary.replace(/<[^>]*>/g, '') : (item.show.summary ? item.show.summary.replace(/<[^>]*>/g, '') : '')
            };
          });
      }
    }

    // 2. Fetch anime schedule (airing titles) from Jikan
    let animeEpisodes: any[] = [];
    try {
      const airingAnimeList = await getAiringAnime();
      if (airingAnimeList && Array.isArray(airingAnimeList)) {
        animeEpisodes = airingAnimeList.slice(0, 15).map((anime: any) => {
          const ratingScore = anime.score || 0;
          return {
            id: `anime-ep-${anime.mal_id}`,
            showId: anime.mal_id,
            type: 'anime',
            showName: anime.title || anime.title_english || 'Anime',
            episodeName: anime.title_japanese || 'New Episode',
            season: 1,
            episodeNumber: anime.episodes || 1,
            airtime: anime.broadcast?.time || 'Airing',
            network: anime.producers?.[0]?.name || 'Japan TV',
            posterUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null,
            rating: ratingScore,
            weight: anime.members || 50, // use popularity rank
            imdbId: null,
            summary: anime.synopsis || ''
          };
        });
      }
    } catch (err) {
      console.error('Failed to fetch anime calendar:', err);
    }

    // 3. Combine and sort by popularity (weight desc)
    const combined = [...tvEpisodes, ...animeEpisodes];
    combined.sort((a, b) => (b.weight || 0) - (a.weight || 0));

    return NextResponse.json({
      schedule: combined,
      success: true
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Failed to load schedule calendar', schedule: [] },
      { status: 500 }
    );
  }
}
