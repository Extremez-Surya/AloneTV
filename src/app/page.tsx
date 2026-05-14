import { Suspense } from 'react';
import { getTrendingMovies, getTrendingTV } from '@/lib/api/tmdb';
import { getTopAnime } from '@/lib/api/jikan';
import { getFeaturedChannels } from '@/lib/api/iptv';
import HeroBanner from '@/components/layout/HeroBanner';
import HorizontalCarousel from '@/components/content/HorizontalCarousel';
import LiveTVSection from '@/components/content/LiveTVSection';
import CreatorCorner from '@/components/content/CreatorCorner';
import AnimeCarousel from '@/components/content/AnimeCarousel';
import { SkeletonBanner, SkeletonRow } from '@/components/ui/SkeletonLoader';

async function HeroSection() {
  let movie = null;
  try {
    const movies = await getTrendingMovies();
    movie = movies[0];
  } catch (error) {
    console.error('Failed to fetch hero movie:', error);
  }

  if (!movie) {
    return <SkeletonBanner />;
  }

  return <HeroBanner movie={movie} />;
}

async function TrendingMoviesSection() {
  try {
    const movies = await getTrendingMovies();
    if (!movies || movies.length === 0) return null;
    return (
      <HorizontalCarousel
        title="Trending Movies"
        items={movies}
        type="movie"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />
    );
  } catch (error) {
    console.error('Failed to fetch trending movies:', error);
    return null;
  }
}

async function TrendingTVSection() {
  try {
    const shows = await getTrendingTV();
    if (!shows || shows.length === 0) return null;
    return (
      <HorizontalCarousel
        title="Trending TV Shows"
        items={shows}
        type="tv"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 8.5l6-4 5.5 3.5v6L11 14v-4.5l-5.5 3.5V8.5z" />
          </svg>
        }
      />
    );
  } catch (error) {
    console.error('Failed to fetch trending TV shows:', error);
    return null;
  }
}

async function TopAnimeSection() {
  return <AnimeCarousel />;
}

export default async function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <Suspense fallback={<SkeletonBanner />}>
        <HeroSection />
      </Suspense>

      {/* Content Sections */}
      <div className="bg-gradient-to-b from-bg-primary to-bg-secondary">
        <Suspense fallback={<SkeletonRow />}>
          <TrendingMoviesSection />
        </Suspense>

        <Suspense fallback={<SkeletonRow />}>
          <TrendingTVSection />
        </Suspense>

        <Suspense fallback={<SkeletonRow />}>
          <TopAnimeSection />
        </Suspense>

        <Suspense fallback={<SkeletonRow />}>
          <LiveTVSection />
        </Suspense>

        <Suspense fallback={<SkeletonRow />}>
          <CreatorCorner />
        </Suspense>
      </div>
    </div>
  );
}