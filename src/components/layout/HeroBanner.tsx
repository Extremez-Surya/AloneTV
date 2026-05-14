'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getTMDBImageUrl } from '@/lib/api/tmdb';
import type { TMDBMovie } from '@/types/tmdb';

interface HeroBannerProps {
  movie: TMDBMovie;
}

export default function HeroBanner({ movie }: HeroBannerProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const backdropUrl = movie?.backdrop_path
    ? getTMDBImageUrl(movie.backdrop_path, 'original')
    : null;

  const posterUrl = movie?.poster_path
    ? getTMDBImageUrl(movie.poster_path, 'w780')
    : null;

  const releaseYear = movie?.release_date?.split('-')[0] || '';

  return (
    <div className="relative h-[85vh] min-h-[600px] overflow-hidden">
      {/* Backdrop Image or Video */}
      <div className="absolute inset-0">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={movie?.title || 'Featured Movie'}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-bg-card to-bg-primary" />
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-overlay-hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-end pb-20">
        <div className="max-w-2xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-4"
          >
            <span className="px-3 py-1 text-xs font-semibold bg-accent-purple/90 text-white rounded-full">
              Featured
            </span>
            <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              4K ULTRA HD
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight"
          >
            {movie?.title || 'Loading...'}
          </motion.h1>

          {/* Meta Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-4 text-sm text-gray-300 mb-4"
          >
            {movie?.vote_average && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {movie.vote_average.toFixed(1)}
              </span>
            )}
            <span>{releaseYear}</span>
            {movie?.overview && (
              <p className="hidden md:block line-clamp-1 text-gray-400 max-w-xl">
                {movie.overview}
              </p>
            )}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <Link
              href={`/watch/movie/${movie?.id}`}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Watch Now
            </Link>

            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              My List
            </button>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}