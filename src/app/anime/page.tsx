'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getTopAnime } from '@/lib/api/jikan';
import type { JikanAnime } from '@/types/jikan';

const filterTabs = [
  { id: 'bypopularity', name: 'Popular' },
  { id: 'airing', name: 'Airing' },
  { id: 'upcoming', name: 'Upcoming' },
  { id: 'favorite', name: 'Favorite' },
];

export default function AnimePage() {
  const [anime, setAnime] = useState<JikanAnime[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('airing');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getTopAnime(1, selectedFilter as 'airing' | 'upcoming' | 'bypopularity' | 'favorite');
        setAnime(data);
      } catch (error) {
        console.error('Failed to fetch anime:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedFilter]);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setAnime([]);
  };

  return (
    <div className="min-h-screen pt-[72px]">
      {/* Header */}
      <div className="bg-gradient-to-b from-bg-secondary to-transparent py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white mb-6"
          >
            Anime
          </motion.h1>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === tab.id
                    ? 'bg-accent-purple text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Anime Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl bg-bg-card mb-3" />
                <div className="h-4 w-3/4 bg-bg-card rounded" />
                <div className="h-3 w-1/2 bg-bg-card rounded mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {anime.map((item, index) => (
              <motion.div
                key={`anime-${item.mal_id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
              >
                <Link
                  href={`/watch/anime/${item.mal_id}`}
                  className="group block"
                >
                  {/* Poster */}
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-bg-card">
                    {item.images?.jpg?.image_url && (
                      <Image
                        src={item.images.jpg.image_url}
                        alt={item.title || 'Anime'}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <button className="w-full py-2 bg-accent-purple text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Watch
                      </button>
                    </div>
                    {/* Score Badge */}
                    {item.score && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md flex items-center gap-1">
                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-medium text-white">{item.score}</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <h3 className="text-sm font-medium text-white truncate group-hover:text-accent-purple transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{item.type}</span>
                    {item.episodes && (
                      <>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{item.episodes} eps</span>
                      </>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}