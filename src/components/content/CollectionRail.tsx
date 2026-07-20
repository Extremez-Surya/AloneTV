'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ContentCard from './ContentCard';
import type { PremiumCollectionSection } from '@/lib/ott-collections';

gsap.registerPlugin(ScrollTrigger);

interface CollectionRailProps {
  section: PremiumCollectionSection;
  icon?: ReactNode;
  isHistory?: boolean;
  extraHeaderAction?: ReactNode;
}

export default function CollectionRail({ section, icon, isHistory, extraHeaderAction }: CollectionRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollState();
    const container = scrollRef.current;
    container?.addEventListener('scroll', updateScrollState, { passive: true });
    return () => container?.removeEventListener('scroll', updateScrollState);
  }, [section.items]);

  useEffect(() => {
    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -420 : 420, behavior: 'smooth' });
  };

  const formatHeader = (title: string) => {
    if (!title) return '';
    const clean = title.trim();
    return clean.endsWith('.') ? clean : `${clean}.`;
  };

  return (
    <section ref={sectionRef} id={section.id} className="scroll-mt-20 py-6 sm:py-8 border-b border-white/[0.04] last:border-0">
      <div className="mx-auto mb-4 flex max-w-[1400px] items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {icon && <span className="text-purple-500">{icon}</span>}
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {formatHeader(section.title)}
            </h2>
          </div>
          {section.subtitle && (
            <p className="max-w-2xl text-xs sm:text-sm text-zinc-500 leading-relaxed">
              {section.subtitle}
            </p>
          )}
        </div>

        {extraHeaderAction ? (
          <div className="shrink-0">{extraHeaderAction}</div>
        ) : (
          section.href && section.href !== '#' && (
            <Link
              href={section.href}
              className="hidden shrink-0 rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all sm:inline-flex"
            >
              View All
            </Link>
          )
        )}
      </div>

      <div className="relative group/rail max-w-[1400px] mx-auto">
        <button
          type="button"
          onClick={() => scroll('left')}
          className={`absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/80 backdrop-blur-md border border-white/[0.06] p-2.5 text-white opacity-0 shadow-lg transition-opacity group-hover/rail:opacity-100 hover:bg-white/10 ${
            canScrollLeft ? 'pointer-events-auto' : 'pointer-events-none opacity-0'
          }`}
          aria-label={`Scroll ${section.title} left`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8 scroll-smooth scrollbar-hide"
        >
          {section.items.length > 0 ? (
            section.items.map((item, index) => (
              <ContentCard 
                key={`${item.type}-${item.id}-${index}`} 
                item={item} 
                type={item.type !== 'anime' ? item.type : 'anime'} 
                index={index} 
                showRemoveFromHistory={isHistory}
                ranking={section.id === 'trending-now' && index < 10 ? index + 1 : undefined}
              />
            ))
          ) : (
            <div className="flex min-h-64 w-full items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] px-6 text-center text-xs sm:text-sm text-zinc-500">
              No titles matched this collection yet.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          className={`absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/80 backdrop-blur-md border border-white/[0.06] p-2.5 text-white opacity-0 shadow-lg transition-opacity group-hover/rail:opacity-100 hover:bg-white/10 ${
            canScrollRight ? 'pointer-events-auto' : 'pointer-events-none opacity-0'
          }`}
          aria-label={`Scroll ${section.title} right`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {section.href && section.href !== '#' && !extraHeaderAction && (
        <div className="mx-auto mt-3 max-w-[1400px] px-4 sm:px-6 lg:px-8 sm:hidden">
          <Link
            href={section.href}
            className="inline-flex rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
          >
            View All
          </Link>
        </div>
      )}
    </section>
  );
}
