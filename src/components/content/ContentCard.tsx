'use client';

import { useState, useEffect } from 'react';
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
  showRemoveFromHistory?: boolean;
  ranking?: number;
}

function isPremiumItem(item: CardItem): item is PremiumCollectionItem {
  return 'posterUrl' in item && 'href' in item;
}

function getTitle(item: CardItem) {
  if (isPremiumItem(item)) return item.title;
  return 'title' in item ? item.title : item.name;
}

function getYear(item: CardItem) {
  if (isPremiumItem(item)) return item.year;
  return 'release_date' in item
    ? item.release_date?.split('-')[0]
    : item.first_air_date?.split('-')[0];
}

function getPosterUrl(item: CardItem, _type: 'movie' | 'tv' | 'anime', isLandscape = false) {
  if (isPremiumItem(item)) {
    if (isLandscape && 'backdropUrl' in item && item.backdropUrl) return item.backdropUrl;
    return item.posterUrl;
  }
  return getTMDBImageUrl(item.poster_path, 'w342');
}

function getHref(item: CardItem, type: 'movie' | 'tv' | 'anime') {
  if (isPremiumItem(item)) return item.href;
  return `/detail/${type}/${item.id}`;
}

function getRating(item: CardItem) {
  if (isPremiumItem(item)) return item.rating;
  return 'vote_average' in item ? item.vote_average : 0;
}

function getQuality(item: CardItem) {
  if (isPremiumItem(item)) return item.quality;
  return getRating(item) >= 7.6 ? '4K' : 'HD';
}

export default function ContentCard({ item, type = 'movie', index = 0, showRemoveFromHistory = false, ranking }: ContentCardProps) {
  const title = getTitle(item);
  const year = getYear(item);
  const rating = getRating(item);
  const quality = getQuality(item);
  const posterUrl = getPosterUrl(item, type, showRemoveFromHistory);
  const href = getHref(item, type);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group shrink-0 relative ${
        ranking !== undefined
          ? 'w-[220px] sm:w-[240px] pl-12 sm:pl-14'
          : showRemoveFromHistory
            ? 'w-[260px] sm:w-[300px]'
            : 'w-[170px] sm:w-[190px]'
      }`}
    >
      {ranking !== undefined && (
        <span className="absolute left-[-5px] bottom-[-8px] text-[160px] font-black leading-none select-none pointer-events-none text-stroke z-0 font-sans tracking-tighter">
          {String(ranking).padStart(2, '0')}
        </span>
      )}

      <Link href={href} className="block relative z-10">
        <div className={`relative rounded-xl overflow-hidden mb-2.5 bg-zinc-900 border border-white/[0.06] shadow-lg transition-all duration-300 ${
          showRemoveFromHistory ? 'aspect-video' : 'aspect-[2/3]'
        } ${isHovered ? 'shadow-purple-500/20 shadow-2xl scale-[1.02]' : ''}`}>
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title || 'Poster'}
              fill
              className={`object-cover transition-all duration-500 ${isHovered ? 'scale-110 brightness-75' : ''}`}
              sizes={showRemoveFromHistory ? "300px" : "190px"}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 gap-2">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <span className="text-[10px] text-zinc-600 line-clamp-2 text-center px-2">{title}</span>
            </div>
          )}

          <div className="absolute inset-0 gradient-overlay-card opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {ranking === undefined && (
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex gap-1.5">
                <span className="rounded-md bg-black/70 px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider text-white backdrop-blur-sm border border-white/10">
                  {quality}
                </span>
              </div>
            </div>
          )}

          {showRemoveFromHistory && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 z-10">
              <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${(Number(item.id) % 55) + 30}%` }} />
            </div>
          )}

          <motion.div
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-black shadow-2xl backdrop-blur-sm"
            >
              <svg className="h-5 w-5 fill-current ml-0.5" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </motion.div>
          </motion.div>
        </div>

        <div className="px-0.5 space-y-1">
          <h3 className="line-clamp-1 text-xs sm:text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-500">
            <span className="font-mono">{year}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-0.5 text-yellow-500">
              ★ {rating ? rating.toFixed(1) : 'N/A'}
            </span>
            <span>•</span>
            <span className="text-zinc-600">{quality}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
