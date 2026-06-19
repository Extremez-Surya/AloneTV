'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: number | string;
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
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

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
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    const type = result.media_type === 'tv' ? 'tv' : 'movie';
    router.push(`/watch/${type}/${result.id}`);
    setIsOpen(false);
    setQuery('');
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open search catalog"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 bg-white/10 rounded text-xs">/</kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="max-w-2xl mx-auto pt-20 px-4"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative"
              >
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search movies, TV shows, anime..."
                    aria-label="Search movies, TV shows, anime"
                    className="w-full pl-12 pr-12 py-4 bg-bg-card border border-white/10 rounded-2xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple"
                  />
                  {isLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Results Dropdown */}
                {query.length >= 2 && (
                  <div className="mt-3 bg-bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    {results.length > 0 ? (
                      <div className="max-h-[400px] overflow-y-auto">
                        {results.map((result, index) => (
                          <button
                            key={`${result.media_type}-${result.id}`}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`w-full flex items-center gap-4 p-3 transition-colors text-left ${
                              index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                            }`}
                          >
                            {getImageUrl(result.poster_path) ? (
                              <img
                                src={getImageUrl(result.poster_path)!}
                                alt={`${result.title || result.name || 'Media'} poster`}
                                className="w-12 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">
                                {result.title || result.name}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="capitalize">{result.media_type}</span>
                                <span>•</span>
                                <span>{(result.release_date || result.first_air_date || '').split('-')[0]}</span>
                                {result.vote_average > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-yellow-400">★ {result.vote_average.toFixed(1)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    ) : !isLoading ? (
                      <div className="p-8 text-center text-gray-400">
                        No results found for "{query}"
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Keyboard Hints */}
                <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd>
                    Close
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}