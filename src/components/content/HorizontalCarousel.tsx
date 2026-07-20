'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ContentCard from './ContentCard';
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb';

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -500 : 500,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section ref={sectionRef} className="py-6 sm:py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <span className="text-purple-500">{icon}</span>}
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                canScrollLeft
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-white/5 text-zinc-600 cursor-not-allowed'
              }`}
              aria-label="Scroll left"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                canScrollRight
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-white/5 text-zinc-600 cursor-not-allowed'
              }`}
              aria-label="Scroll right"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="relative group/carousel">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <div key={`${type}-${item.id}`} className="snap-start shrink-0">
              <ContentCard item={item} type={type} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
