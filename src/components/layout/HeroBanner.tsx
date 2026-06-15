'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import type { PremiumCollectionItem } from '@/lib/ott-collections';

interface HeroBannerProps {
  items: PremiumCollectionItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 8000);

    return () => window.clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="relative min-h-[70vh] overflow-hidden bg-bg-primary pt-24">
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-br from-[#007cf0] to-[#00dfd8] blur-[120px]" />
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[70%] rounded-full bg-gradient-to-br from-[#7928ca] to-[#ff0080] blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 py-16 flex flex-col items-center text-center">
          <div className="max-w-3xl space-y-4">
            <div className="h-6 w-32 rounded-full bg-bg-secondary skeleton mx-auto" />
            <div className="h-14 w-4/5 rounded-2xl bg-bg-secondary skeleton mx-auto" />
            <div className="h-20 w-full rounded-2xl bg-bg-secondary skeleton mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const current = items[activeIndex];

  // Helper to ensure headline ends with a period as per Vercel guidelines
  const formatHeadline = (title: string) => {
    if (!title) return '';
    return title.trim().endsWith('.') ? title : `${title.trim()}.`;
  };

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex flex-col justify-end overflow-hidden bg-bg-primary pt-20 pb-12">
      {/* Ambient background image underlays */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            {current.backdropUrl ? (
              <Image
                src={current.backdropUrl}
                alt={current.title}
                fill
                priority
                className="object-cover object-top"
                sizes="100vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-bg-secondary to-bg-primary" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Premium Dark Gradient Overlays (Netflix / Prime style) */}
        {/* Left Side fade to black (desktop only) */}
        <div className="absolute inset-y-0 left-0 w-full md:w-[65%] bg-gradient-to-r from-bg-primary via-bg-primary/95 to-transparent z-[1]" />
        
        {/* Mobile full background dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/60 md:hidden z-[1]" />

        {/* Bottom fade to page bg-primary */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-bg-primary via-bg-primary/30 to-transparent z-[2]" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col gap-8 md:gap-12 mt-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          {/* Spotlight Details Block */}
          <div className="max-w-2xl space-y-4 text-left">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent-purple px-2 py-0.5 bg-accent-purple/10 border border-accent-purple/20 rounded-md">
                Spotlight Selection
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">
                {current.quality} • {current.year}
              </span>
              {current.rating > 0 && (
                <span className="font-mono text-[10px] text-yellow-500 font-semibold flex items-center gap-0.5 px-2 py-0.5 bg-yellow-500/5 border border-yellow-500/15 rounded-md">
                  ★ {current.rating.toFixed(1)}
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.h1
                key={current.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-2px] text-text-primary leading-[1.1] uppercase drop-shadow-md"
              >
                {formatHeadline(current.title)}
              </motion.h1>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.p
                key={`${current.id}-desc`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm sm:text-base text-text-muted leading-relaxed max-w-xl drop-shadow-sm line-clamp-3 text-left"
              >
                {current.overview || 'Explore regional cinema, global blockbusters, and curated selections in their original voices.'}
              </motion.p>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={current.href}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full bg-text-primary text-bg-primary hover:bg-white hover:text-black transition-all hover:scale-[1.02] shadow-level-3 active:scale-[0.98]"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play Now
              </Link>
              <Link
                href={current.href}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 shadow-level-2 transition-all active:scale-[0.98]"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Floating Genre Tag (Only on Desktop) */}
          <div className="hidden lg:block p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 max-w-xs shrink-0 self-end mb-1">
            <p className="text-[10px] font-mono text-accent-teal uppercase tracking-widest font-semibold">{current.genreLabel}</p>
            <div className="flex gap-1.5 flex-wrap mt-2">
              {current.genres.slice(0, 3).map((g) => (
                <span key={g} className="px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] font-mono text-gray-300 rounded-md">{g}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Up Next Widescreen overlay row */}
        <div className="border-t border-white/10 pt-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-3">
            Spotlight Selection / Up Next
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.slice(0, 4).map((item, idx) => (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => setActiveIndex(items.findIndex((e) => e.id === item.id))}
                className={`flex items-center gap-3 p-2 rounded-xl border text-left transition-all backdrop-blur-md ${
                  item.id === current.id
                    ? 'border-accent-purple bg-accent-purple/10 shadow-md shadow-accent-purple/5'
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="relative w-9 h-12 shrink-0 rounded-lg overflow-hidden bg-bg-secondary">
                  {item.posterUrl && (
                    <Image src={item.posterUrl} alt={item.title} fill className="object-cover" sizes="36px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${item.id === current.id ? 'text-accent-purple' : 'text-text-primary'}`}>
                    {item.title}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5 font-mono">{item.genreLabel} • {item.year}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}