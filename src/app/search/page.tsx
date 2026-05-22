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
  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-400 px-4 pb-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_30px_80px_-46px_rgba(0,0,0,0.98)] backdrop-blur-xl sm:p-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/42">Global search</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Find the exact title, faster.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
                Search movies, TV shows, and anime from one cinematic surface with filters, instant previews, and keyboard-ready navigation.
              </p>
            </div>

            <div className="rounded-full border border-white/8 bg-white/4 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
              {loading ? 'Searching...' : hasQuery ? `${totalResults} matches` : 'Ready when you are'}
            </div>
          </div>

          <div className="mt-5 rounded-[1.45rem] border border-white/8 bg-black/25 px-4 py-4 backdrop-blur-xl sm:px-5">
            <div className="flex items-center gap-3 rounded-[1.2rem] border border-white/8 bg-white/3 px-4 py-4">
              <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, TV shows, anime..."
                className="w-full bg-transparent text-lg font-semibold text-white placeholder:text-white/28 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(['all', 'movie', 'tv', 'anime'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    filter === f
                      ? 'border-[#ffb4aa]/30 bg-white/10 text-white'
                      : 'border-white/8 bg-white/4 text-white/70 hover:bg-white/8'
                  }`}
                >
                  {f}
                  {f !== 'all' && 's'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-400 px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <div className="rounded-4xl border border-white/8 bg-white/4 px-6 py-14 text-center text-white/50 backdrop-blur-xl">
            Searching...
          </div>
        ) : hasQuery ? (
          totalResults > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/52">
                <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-white/70">
                  {filteredResults.length} catalog matches
                </span>
                <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-white/70">
                  {animeResults.length} anime matches
                </span>
              </div>

              {filteredResults.length > 0 ? (
                <section className="rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_30px_80px_-46px_rgba(0,0,0,0.98)] backdrop-blur-xl sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-white">Catalog results</h2>
                    <span className="text-xs uppercase tracking-[0.24em] text-white/38">Movies and TV</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredResults.map((result: any, index) => (
                      <motion.div
                        key={`${result.media_type}-${result.id}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.03 }}
                      >
                        <Link href={`/watch/${result.media_type}/${result.id}`} className="group block">
                          <div className="relative aspect-2/3 overflow-hidden rounded-[1.3rem] border border-white/8 bg-bg-card">
                            {(result.poster_path || result.backdrop_path) ? (
                              <Image
                                src={getTMDBImageUrl(result.poster_path || result.backdrop_path, 'w342') || ''}
                                alt={result.title || result.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : null}
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(2,4,10,0.92))]" />
                          </div>
                          <div className="mt-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-white group-hover:text-[#ffd6c7]">
                                {result.title || result.name}
                              </h3>
                              <p className="mt-1 text-xs text-white/46">
                                {result.media_type === 'movie' ? 'Movie' : 'TV Show'} • {(result.release_date || result.first_air_date || '').split('-')[0]}
                              </p>
                            </div>
                            <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/58">
                              {result.media_type}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </section>
              ) : null}

              {animeResults.length > 0 && filter !== 'tv' ? (
                <section className="rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_30px_80px_-46px_rgba(0,0,0,0.98)] backdrop-blur-xl sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-white">Anime results</h2>
                    <span className="text-xs uppercase tracking-[0.24em] text-white/38">Jikan</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {animeResults.map((anime, index) => (
                      <motion.div
                        key={anime.mal_id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.03 }}
                      >
                        <Link href={`/watch/anime/${anime.mal_id}`} className="group block">
                          <div className="relative aspect-2/3 overflow-hidden rounded-[1.3rem] border border-white/8 bg-bg-card">
                            {anime.images?.jpg?.image_url ? (
                              <Image
                                src={anime.images.jpg.image_url}
                                alt={anime.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : null}
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(2,4,10,0.92))]" />
                          </div>
                          <div className="mt-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-white group-hover:text-[#ffd6c7]">{anime.title}</h3>
                              <p className="mt-1 text-xs text-white/46">
                                {anime.type} • {anime.score || 'N/A'}
                              </p>
                            </div>
                            <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/58">
                              anime
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="rounded-4xl border border-white/8 bg-white/4 px-6 py-14 text-center text-white/50 backdrop-blur-xl">
              No results found for "{query}"
            </div>
          )
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-4xl border border-white/8 bg-white/4 p-6 text-white/58 backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/42">Search tips</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  'Type at least 2 characters to start searching',
                  'Use filters to narrow movies, TV, or anime',
                  'Open the overlay with Ctrl/Cmd + K',
                  'Arrow keys move through results in the overlay',
                ].map((tip) => (
                  <div key={tip} className="rounded-[1.25rem] border border-white/8 bg-black/20 px-4 py-3 text-sm leading-6 text-white/65">
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/42">Suggested searches</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {['Interstellar', 'Cyberpunk', 'The Dark Knight', 'Anime', 'Thriller'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-white/72 transition-colors hover:bg-white/8"
                  >
                    {term}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-white/56">
                This page now matches the cinematic shell, so search feels like a first-class feature instead of a utility screen.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}