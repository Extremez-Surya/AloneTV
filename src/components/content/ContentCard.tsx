'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getTMDBImageUrl } from '@/lib/api/tmdb';
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb';

interface ContentCardProps {
  item: TMDBMovie | TMDBTVShow;
  type: 'movie' | 'tv';
  index?: number;
}

export default function ContentCard({ item, type, index = 0 }: ContentCardProps) {
  const title = 'title' in item ? item.title : item.name;
  const releaseYear =
    'release_date' in item
      ? item.release_date?.split('-')[0]
      : item.first_air_date?.split('-')[0];
  const posterPath =
    type === 'movie' ? (item as TMDBMovie).poster_path : (item as TMDBTVShow).poster_path;
  const posterUrl = getTMDBImageUrl(posterPath, 'w342');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]"
    >
      <Link href={`/watch/${type}/${item.id}`} className="block">
        {/* Poster Container */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-bg-card">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title || 'Movie Poster'}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, 200px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
              <svg
                className="w-12 h-12 text-gray-600"
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

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <button className="w-full py-2 bg-accent-purple text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Play
            </button>
          </div>

          {/* Rating Badge */}
          {item.vote_average > 0 && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md flex items-center gap-1">
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-medium text-white">
                {item.vote_average.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h3 className="text-sm font-medium text-white truncate group-hover:text-accent-purple transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{releaseYear}</p>
        </div>
      </Link>
    </motion.div>
  );
}