'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getTMDBImageUrl } from '@/lib/api/tmdb';
import type { PremiumCollectionItem } from '@/lib/ott-collections';
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb';

type CardItem = TMDBMovie | TMDBTVShow | PremiumCollectionItem;

interface ContentCardProps {
  item: CardItem;
  type?: 'movie' | 'tv' | 'anime';
  index?: number;
}

function isPremiumItem(item: CardItem): item is PremiumCollectionItem {
  return 'posterUrl' in item && 'href' in item;
}

function getTitle(item: CardItem) {
  if (isPremiumItem(item)) {
    return item.title;
  }

  return 'title' in item ? item.title : item.name;
}

function getYear(item: CardItem) {
  if (isPremiumItem(item)) {
    return item.year;
  }

  return 'release_date' in item
    ? item.release_date?.split('-')[0]
    : item.first_air_date?.split('-')[0];
}

function getPosterUrl(item: CardItem, type: 'movie' | 'tv' | 'anime') {
  if (isPremiumItem(item)) {
    return item.posterUrl;
  }

  const posterPath = type === 'movie' ? item.poster_path : item.poster_path;
  return getTMDBImageUrl(posterPath, 'w342');
}

function getHref(item: CardItem, type: 'movie' | 'tv' | 'anime') {
  if (isPremiumItem(item)) {
    return item.href;
  }

  return `/watch/${type}/${item.id}`;
}

function getRating(item: CardItem) {
  if (isPremiumItem(item)) {
    return item.rating;
  }

  return 'vote_average' in item ? item.vote_average : 0;
}

function getQuality(item: CardItem) {
  if (isPremiumItem(item)) {
    return item.quality;
  }

  return getRating(item) >= 7.6 ? '4K' : 'HD';
}

function getGenres(item: CardItem) {
  if (isPremiumItem(item)) {
    return item.genres;
  }

  const source = 'genre_ids' in item ? item.genre_ids : [];
  return source.length > 0 ? [`${source.length} Genres`] : ['Featured'];
}

export default function ContentCard({ item, type = 'movie', index = 0 }: ContentCardProps) {
  const title = getTitle(item);
  const year = getYear(item);
  const rating = getRating(item);
  const quality = getQuality(item);
  const posterUrl = getPosterUrl(item, type);
  const href = getHref(item, type);
  const genres = getGenres(item);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -6 }}
      className="group shrink-0 w-41 sm:w-45 md:w-49.5"
    >
      <Link href={href} className="block">
        <div className="relative aspect-2/3 rounded-[1.15rem] overflow-hidden mb-3 bg-bg-card ring-1 ring-white/5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title || 'Poster'}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 164px, (max-width: 768px) 180px, 198px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-bg-card via-black to-black">
              <svg
                className="w-12 h-12 text-white/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
            <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-white/90 backdrop-blur-sm">
              {quality}
            </span>
            <button
              type="button"
              className="rounded-full bg-black/60 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
              aria-label={`Add ${title} to watchlist`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
              </svg>
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/75">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 backdrop-blur-sm">
                  <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {rating ? rating.toFixed(1) : 'N/A'}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-1 backdrop-blur-sm">{year}</span>
              </div>

              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-black transition-transform duration-300 hover:scale-[1.02]">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Play Now
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 px-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-amber-300">
              {title}
            </h3>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
              {year}
            </span>
          </div>
          <p className="line-clamp-1 text-xs text-white/45">{genres.slice(0, 2).join(' • ')}</p>
        </div>
      </Link>
    </motion.div>
  );
}