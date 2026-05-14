'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import ContentCard from './ContentCard';
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb';

interface HorizontalCarouselProps {
  title: string;
  items: (TMDBMovie | TMDBTVShow)[];
  type: 'movie' | 'tv';
  icon?: ReactNode;
}

export default function HorizontalCarousel({
  title,
  items,
  type,
  icon,
}: HorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const ref = scrollRef.current;
    ref?.addEventListener('scroll', checkScrollPosition);
    return () => ref?.removeEventListener('scroll', checkScrollPosition);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-8">
      {/* Section Header */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-accent-purple">{icon}</span>
          )}
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black ${
            canScrollLeft ? 'cursor-pointer' : 'pointer-events-none opacity-0'
          }`}
          aria-label="Scroll left"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <ContentCard key={`${type}-${item.id}`} item={item} type={type} index={index} />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black ${
            canScrollRight ? 'cursor-pointer' : 'pointer-events-none opacity-0'
          }`}
          aria-label="Scroll right"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}