import { getTopAnime } from '@/lib/api/jikan';
import type { JikanAnime } from '@/types/jikan';
import AnimeCardClient from './AnimeCardClient';

export default async function AnimeCarousel() {
  let anime: JikanAnime[] = [];
  try {
    anime = await getTopAnime(1, 'airing');
  } catch (error) {
    console.error('Failed to fetch anime:', error);
  }

  return (
    <section className="py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-4">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h2 className="text-xl font-semibold text-white">Top Airing Anime</h2>
        </div>
      </div>

      <div className="relative group/carousel">
        <div className="flex gap-4 px-4 sm:px-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {anime.map((item, index) => (
            <AnimeCardClient key={`${item.mal_id}-${index}`} anime={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}