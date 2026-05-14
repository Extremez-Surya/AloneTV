'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '@/components/content/ContentCard';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { discoverMovies, getMovieGenres } from '@/lib/api/tmdb';
import type { TMDBMovie, TMDBGenre } from '@/types/tmdb';

const genreTabs = [
  { id: 0, name: 'All' },
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
];

export default function MoviesPage() {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [genres, setGenres] = useState<TMDBGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching movies for genre:', selectedGenre, 'page:', page);
        const [moviesData, genresData] = await Promise.all([
          discoverMovies({ genre_id: selectedGenre || undefined, page }),
          getMovieGenres(),
        ]);

        console.log('Movies response:', moviesData);

        if (moviesData?.results && moviesData.results.length > 0) {
          setMovies((prev) => (page === 1 ? moviesData.results : [...prev, ...moviesData.results]));
          setTotalPages(moviesData.total_pages || 1);
          setGenres(genresData || []);
        } else {
          // If no results, try page 1 again to see if API is working
          if (page === 1) {
            setMovies([]);
            setError('No movies found. The TMDB API might not be responding properly.');
          }
        }
      } catch (err) {
        console.error('Failed to fetch movies:', err);
        setError('Failed to load movies. Please check your internet connection and API configuration.');
        setMovies([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedGenre, page]);

  const handleGenreChange = (genreId: number) => {
    setSelectedGenre(genreId);
    setPage(1);
    setMovies([]);
  };

  const handleRetry = () => {
    setPage(1);
    setMovies([]);
    setError(null);
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
            Movies
          </motion.h1>

          {/* Genre Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {genreTabs.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreChange(genre.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedGenre === genre.id
                    ? 'bg-accent-purple text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {loading && movies.length === 0 ? (
          <SkeletonLoader count={12} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80"
            >
              Retry
            </button>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No movies found.</p>
            <p className="text-sm mt-2">Try selecting a different genre.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((movie, index) => (
                <ContentCard key={movie.id} item={movie} type="movie" index={index} />
              ))}
            </div>

            {/* Load More */}
            {page < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  className="px-8 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}