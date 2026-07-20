'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { JikanAnime } from '@/types/jikan';

interface AnimeCardClientProps {
  anime: JikanAnime;
  index: number;
}

export default function AnimeCardClient({ anime, index }: AnimeCardClientProps) {
  const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const [imgError, setImgError] = useState(false);
  const title = anime.title_english || anime.title || 'Anime';

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]"
    >
      <Link href={`/detail/anime/${anime.mal_id}`} className="block">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-zinc-900 border border-white/[0.06]">
          {imageUrl && !imgError ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, 200px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 gap-2">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-[10px] text-zinc-600 line-clamp-2 text-center px-2">{title}</span>
            </div>
          )}

          {anime.score && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md flex items-center gap-1">
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-medium text-white">{anime.score}</span>
            </div>
          )}
        </div>

        <h3 className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors truncate">
          {title}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] font-mono text-zinc-600 uppercase">{anime.type}</span>
          {anime.episodes && (
            <>
              <span className="text-[10px] text-zinc-700">•</span>
              <span className="text-[10px] font-mono text-zinc-600">{anime.episodes} eps</span>
            </>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
