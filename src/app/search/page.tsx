'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { searchMulti, getTMDBImageUrl } from '@/lib/api/tmdb';
import { searchAnime } from '@/lib/api/jikan';
import type { TMDBSearchResult } from '@/types/tmdb';
import type { JikanAnime } from '@/types/jikan';

type SearchResult = TMDBSearchResult | { mal_id: number; title: string; images: any; type: 'anime' };

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchContent />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [animeResults, setAnimeResults] = useState<JikanAnime[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    async function search() {
      if (!query.trim()) {
        setResults([]);
        setAnimeResults([]);
        return;
      }

      setLoading(true);
      try {
        const [tmdbResults, jikanResults] = await Promise.all([
          searchMulti(query),
          searchAnime(query),
        ]);
        setResults(tmdbResults);
        setAnimeResults(jikanResults);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }

    const debounceTimer = setTimeout(search, 500);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const filteredResults = results.filter((r) => {
    if (filter === 'all') return true;
    return 'media_type' in r && r.media_type === filter;
  });

  const totalResults = filteredResults.length + animeResults.length;

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
            Search
          </motion.h1>

          {/* Search Input */}
          <div className="relative max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, TV shows, anime..."
              className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple"
            />
            <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 mt-6">
            {(['all', 'movie', 'tv', 'anime'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-accent-purple text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {f}
                {f !== 'all' && 's'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Searching...</div>
        ) : totalResults > 0 ? (
          <p className="text-gray-400 mb-6">{totalResults} results for "{query}"</p>
        ) : query.trim() ? (
          <div className="text-center py-12 text-gray-400">
            No results found for "{query}"
          </div>
        ) : null}

        {/* TMDB Results */}
        {filteredResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
            {filteredResults.map((result: any, index) => (
              <motion.div
                key={`${result.media_type}-${result.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
              >
                <Link
                  href={`/watch/${result.media_type}/${result.id}`}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-bg-card">
                    {(result.poster_path || result.backdrop_path) && (
                      <Image
                        src={getTMDBImageUrl(result.poster_path || result.backdrop_path, 'w342') || ''}
                        alt={result.title || result.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-white truncate group-hover:text-accent-purple transition-colors">
                    {result.title || result.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.media_type === 'movie' ? 'Movie' : 'TV Show'} •{' '}
                    {(result.release_date || result.first_air_date || '').split('-')[0]}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Anime Results */}
        {animeResults.length > 0 && filter !== 'tv' && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Anime</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {animeResults.map((anime, index) => (
                <motion.div
                  key={anime.mal_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                >
                  <Link
                    href={`/watch/anime/${anime.mal_id}`}
                    className="group block"
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-bg-card">
                      {anime.images?.jpg?.image_url && (
                        <Image
                          src={anime.images.jpg.image_url}
                          alt={anime.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-white truncate group-hover:text-accent-purple transition-colors">
                      {anime.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {anime.type} • {anime.score || 'N/A'}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}