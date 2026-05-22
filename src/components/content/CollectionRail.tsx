'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import ContentCard from './ContentCard';
import type { PremiumCollectionSection } from '@/lib/ott-collections';

interface CollectionRailProps {
  section: PremiumCollectionSection;
  icon?: ReactNode;
}

export default function CollectionRail({ section, icon }: CollectionRailProps) {
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

  return (
    <section id={section.id} className="scroll-mt-24 py-8 sm:py-10">
      <div className="mx-auto mb-5 flex max-w-[1600px] items-end justify-between gap-4 px-4 sm:px-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {icon && <span className="text-accent-purple">{icon}</span>}
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {section.title}
            </h2>
            <span className="hidden rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/38 sm:inline-flex">
              {section.items.length} titles
            </span>
          </div>
          {section.subtitle && <p className="max-w-2xl text-sm text-white/50">{section.subtitle}</p>}
        </div>

        <Link
          href={section.href}
          className="hidden shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 sm:inline-flex"
        >
          View All
        </Link>
      </div>

      <div className="relative group/rail">
        <button
          type="button"
          onClick={() => scroll('left')}
          className={`absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/70 p-3 text-white opacity-0 shadow-xl backdrop-blur-xl transition-opacity group-hover/rail:opacity-100 ${
            canScrollLeft ? 'pointer-events-auto' : 'pointer-events-none opacity-0'
          }`}
          aria-label={`Scroll ${section.title} left`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 pb-2 sm:px-6 scroll-smooth scrollbar-hide"
        >
          {section.items.length > 0 ? (
            section.items.map((item, index) => (
              <ContentCard key={`${item.type}-${item.id}-${index}`} item={item} type={item.type !== 'anime' ? item.type : 'tv'} index={index} />
            ))
          ) : (
            <div className="flex min-h-80 w-full items-center justify-center rounded-4xl border border-dashed border-white/10 bg-white/2 px-6 text-center text-sm text-white/45">
              No titles matched this collection yet.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          className={`absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/70 p-3 text-white opacity-0 shadow-xl backdrop-blur-xl transition-opacity group-hover/rail:opacity-100 ${
            canScrollRight ? 'pointer-events-auto' : 'pointer-events-none opacity-0'
          }`}
          aria-label={`Scroll ${section.title} right`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="mx-auto mt-4 max-w-[1600px] px-4 sm:px-6 sm:hidden">
        <Link
          href={section.href}
          className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
        >
          View All
        </Link>
      </div>
    </section>
  );
}
