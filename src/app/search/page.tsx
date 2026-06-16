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
        const [searchRes, jikanResults] = await Promise.all([
          fetch(`/api/search?q=${encodeURIComponent(query)}`),
          searchAnime(query),
        ]);
        
        const searchData = searchRes.ok ? await searchRes.json() : { results: [] };
        const tmdbResults = searchData.results || [];
        
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
    <div className="min-h-screen bg-bg-primary pb-12 pt-[72px]">
      {/* Header */}
      <div className="bg-bg-card border-b border-border py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-semibold tracking-[-1.28px] text-text-primary mb-6"
          >
            Search.
          </motion.h1>
 
          {/* Search Input */}
          <div className="relative max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, TV shows, anime..."
              className="w-full h-12 px-5 bg-bg-card border border-border rounded-xl text-base text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple shadow-level-1 transition-all"
            />
            <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
 
          {/* Filter Pills */}
          <div className="flex gap-2 mt-6">
            {(['all', 'movie', 'tv', 'anime'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                  filter === f
                    ? 'bg-text-primary text-bg-card shadow-level-2'
                    : 'bg-bg-card text-text-muted border border-border hover:bg-bg-secondary hover:text-text-primary'
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
          <div className="text-center py-12 text-text-muted font-mono text-sm">Searching...</div>
        ) : totalResults > 0 ? (
          <p className="text-text-muted font-mono text-xs mb-6">{totalResults} results for "{query}"</p>
        ) : query.trim() ? (
          <div className="text-center py-12 text-text-muted font-mono text-sm">
            No results found for "{query}"
          </div>
        ) : null}
 
        {/* TMDB Results */}
        {filteredResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
            {filteredResults.map((result: any, index) => (
              <motion.div
                key={`${result.media_type}-${result.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.02 }}
                className="group bg-bg-card rounded-2xl border border-border p-3 shadow-level-2 hover:shadow-level-3 transition-all"
              >
                <Link
                  href={`/watch/${result.media_type}/${result.id}`}
                  className="block"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-bg-secondary border border-border/40">
                    {(result.poster_path || result.backdrop_path) && (
                      (result.poster_path || result.backdrop_path).startsWith('http') ? (
                        <img
                          src={result.poster_path || result.backdrop_path}
                          alt={result.title || result.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Image
                          src={getTMDBImageUrl(result.poster_path || result.backdrop_path, 'w342') || ''}
                          alt={result.title || result.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          unoptimized
                        />
                      )
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-purple transition-colors">
                    {result.title || result.name}
                  </h3>
                  <p className="text-[10px] text-text-muted font-mono mt-1 capitalize">
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
            <h2 className="text-lg font-bold tracking-[-0.6px] text-text-primary mb-4">Anime.</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {animeResults.map((anime, index) => (
                <motion.div
                  key={anime.mal_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.02 }}
                  className="group bg-bg-card rounded-2xl border border-border p-3 shadow-level-2 hover:shadow-level-3 transition-all"
                >
                  <Link
                    href={`/watch/anime/${anime.mal_id}`}
                    className="block"
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-bg-secondary border border-border/40">
                      {anime.images?.jpg?.image_url && (
                        <Image
                          src={anime.images.jpg.image_url}
                          alt={anime.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-purple transition-colors">
                      {anime.title}
                    </h3>
                    <p className="text-[10px] text-text-muted font-mono mt-1">
                      {anime.type} • ★ {anime.score || 'N/A'}
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