'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import ContentCard from './ContentCard';
import type { PremiumCollectionSection } from '@/lib/ott-collections';

interface CollectionRailProps {
  section: PremiumCollectionSection;
  icon?: ReactNode;
  isHistory?: boolean;
  extraHeaderAction?: ReactNode;
}

export default function CollectionRail({ section, icon, isHistory, extraHeaderAction }: CollectionRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollRef.current) {
      return;
    }

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

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollBy({
      left: direction === 'left' ? -420 : 420,
      behavior: 'smooth',
    });
  };

  // Helper to format section header as sentence-case and period-terminated
  const formatHeader = (title: string) => {
    if (!title) return '';
    const clean = title.trim();
    // Ensure period-terminated
    return clean.endsWith('.') ? clean : `${clean}.`;
  };

  return (
    <section id={section.id} className="scroll-mt-20 py-6 sm:py-8 border-b border-border/40 last:border-0 bg-bg-primary">
      <div className="mx-auto mb-4 flex max-w-[1400px] items-end justify-between gap-4 px-4 sm:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {icon && <span className="text-accent-purple">{icon}</span>}
            <h2 className="text-xl sm:text-2xl font-semibold tracking-[-1.28px] text-text-primary">
              {formatHeader(section.title)}
            </h2>
          </div>
          {section.subtitle && (
            <p className="max-w-2xl text-xs sm:text-sm text-text-muted leading-relaxed">
              {section.subtitle}
            </p>
          )}
        </div>

        {extraHeaderAction ? (
          <div className="shrink-0">
            {extraHeaderAction}
          </div>
        ) : (
          section.href && section.href !== '#' && (
            <Link
              href={section.href}
              className="hidden shrink-0 rounded-full border border-border bg-bg-card px-4 py-2 text-xs font-semibold text-text-primary shadow-level-1 transition-all hover:bg-bg-secondary sm:inline-flex"
            >
              View All
            </Link>
          )
        )}
      </div>

      <div className="relative group/rail max-w-[1400px] mx-auto">
        {/* Left Arrow */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className={`absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-bg-card p-2.5 text-text-primary opacity-0 shadow-level-3 backdrop-blur-md transition-opacity group-hover/rail:opacity-100 ${
            canScrollLeft ? 'pointer-events-auto' : 'pointer-events-none opacity-0'
          }`}
          aria-label={`Scroll ${section.title} left`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 pb-3 sm:px-6 scroll-smooth scrollbar-hide"
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
            <div className="flex min-h-64 w-full items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card px-6 text-center text-xs sm:text-sm text-text-muted">
              No titles matched this collection yet.
            </div>
          )}
        </div>

        {/* Right Arrow */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className={`absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-bg-card p-2.5 text-text-primary opacity-0 shadow-level-3 backdrop-blur-md transition-opacity group-hover/rail:opacity-100 ${
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
        <div className="mx-auto mt-3 max-w-[1400px] px-4 sm:px-6 sm:hidden">
          <Link
            href={section.href}
            className="inline-flex rounded-full border border-border bg-bg-card px-4 py-2 text-xs font-semibold text-text-primary shadow-level-1 hover:bg-bg-secondary transition-all"
          >
            View All
          </Link>
        </div>
      )}
    </section>
  );
}