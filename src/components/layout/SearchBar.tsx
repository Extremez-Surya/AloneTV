'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: 'movie' | 'tv' | 'person';
  release_date: string;
  first_air_date: string;
  vote_average: number;
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 260);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    const type = result.media_type === 'tv' ? 'tv' : 'movie';
    router.push(`/watch/${type}/${result.id}`);
    setIsOpen(false);
    setQuery('');
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSelect, isOpen, results, selectedIndex]);

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3.5 py-2 text-sm text-white/68 backdrop-blur-xl transition-all hover:border-white/18 hover:bg-white/10 hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded-full border border-white/10 bg-white/6 px-1.5 py-0.5 text-[11px] sm:inline">/</kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-[#02040a]/88 backdrop-blur-[10px]"
            onClick={() => setIsOpen(false)}
          >
            <div className="mx-auto max-w-5xl px-4 pt-20 sm:pt-24" onClick={(e) => e.stopPropagation()}>
              <motion.div
                initial={{ y: -20, opacity: 0, scale: 0.985 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -12, opacity: 0 }}
                className="overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] shadow-[0_40px_120px_-50px_rgba(0,0,0,1)] backdrop-blur-2xl"
              >
                <div className="border-b border-white/8 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/8 bg-black/25 px-4 py-4">
                    <svg className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="What do you want to watch?"
                      className="w-full bg-transparent text-xl font-semibold text-white placeholder:text-white/28 focus:outline-none"
                    />
                    <kbd className="hidden rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/45 sm:inline-flex">
                      Esc
                    </kbd>
                    {isLoading ? (
                      <div className="ml-1 h-5 w-5 rounded-full border-2 border-[#ffb4aa] border-t-transparent animate-spin" />
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                    <span className="text-white/62">Trending searches</span>
                    {['Interstellar', 'Cyberpunk', 'The Dark Knight'].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/70 transition-colors hover:bg-white/9"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {query.length >= 2 ? (
                  <div className="grid gap-5 px-4 py-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="max-h-104 overflow-y-auto pr-1">
                      <div className="mb-3 flex items-center justify-between px-1 text-sm text-white/55">
                        <span className="font-semibold text-white/82">Top results</span>
                        <span>Press Enter to play</span>
                      </div>
                      <div className="grid gap-3">
                        {results.length > 0 ? (
                          results.map((result, index) => (
                            <button
                              key={`${result.media_type}-${result.id}`}
                              onClick={() => handleSelect(result)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={`flex items-center gap-4 rounded-[1.35rem] border p-3 text-left transition-colors ${
                                index === selectedIndex
                                  ? 'border-[#ffb4aa]/30 bg-white/9'
                                  : 'border-white/8 bg-white/3 hover:bg-white/6'
                              }`}
                            >
                              {getImageUrl(result.poster_path) ? (
                                <div className="relative h-20 w-14 overflow-hidden rounded-xl border border-white/8">
                                  <Image
                                    src={getImageUrl(result.poster_path)!}
                                    alt={result.title || result.name || 'Search result'}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-20 w-14 items-center justify-center rounded-xl border border-white/8 bg-white/5">
                                  <svg className="h-6 w-6 text-white/26" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                  </svg>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
                                  <span className="rounded-full border border-white/8 bg-white/5 px-2 py-1 text-white/62">
                                    {result.media_type}
                                  </span>
                                  <span>{(result.release_date || result.first_air_date || '').split('-')[0]}</span>
                                  {result.vote_average > 0 ? <span className="text-amber-400">★ {result.vote_average.toFixed(1)}</span> : null}
                                </div>
                                <div className="mt-1 truncate text-lg font-semibold text-white">{result.title || result.name}</div>
                                <div className="mt-2 line-clamp-2 text-sm leading-6 text-white/52">
                                  Start instantly from search, with quick access to movie, TV, and anime results.
                                </div>
                              </div>
                              <svg className="h-5 w-5 shrink-0 text-white/28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ))
                        ) : !isLoading ? (
                          <div className="rounded-[1.35rem] border border-white/8 bg-white/3 px-4 py-10 text-center text-white/42">
                            No results found for "{query}"
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/8 bg-black/25 p-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">Search tips</p>
                        <p className="mt-2 text-sm leading-6 text-white/62">
                          Use the overlay to jump directly into movies, TV shows, or anime with keyboard navigation.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        {[
                          'Ctrl/Cmd + K to open search',
                          'Arrow keys to navigate results',
                          'Enter to launch the selected title',
                          'Esc to close instantly',
                        ].map((tip) => (
                          <div key={tip} className="rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-white/68">
                            {tip}
                          </div>
                        ))}
                      </div>

                      <div className="rounded-[1.25rem] border border-white/8 bg-white/3 px-4 py-3 text-xs text-white/52">
                        Searching across movies, TV, anime, and live-oriented content.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-5 py-4 text-xs text-white/36">
                    <span>Use `/` or `Ctrl/Cmd + K` to open search instantly.</span>
                    <span className="hidden sm:inline">Search across movies, TV, and anime.</span>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
