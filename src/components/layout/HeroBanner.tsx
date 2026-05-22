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
    }, 6500);

    return () => window.clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="relative min-h-[82vh] overflow-hidden bg-linear-to-br from-bg-primary via-[#0f0f19] to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(13,148,136,0.16),transparent_28%)]" />
        <div className="relative mx-auto flex min-h-[82vh] max-w-350 items-end px-4 pb-16 sm:px-6 lg:pb-24">
          <div className="max-w-2xl space-y-4">
            <div className="h-6 w-32 rounded-full bg-white/10" />
            <div className="h-14 w-4/5 rounded-2xl bg-white/10" />
            <div className="h-20 w-full rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  const current = items[activeIndex];

  return (
    <section className="relative min-h-[82vh] overflow-hidden bg-black pt-18">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {current.backdropUrl ? (
            <Image
              src={current.backdropUrl}
              alt={current.title}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-bg-card via-black to-bg-primary" />
          )}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(124,58,237,0.28),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(13,148,136,0.2),transparent_18%)]" />
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/55 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-bg-primary via-bg-primary/55 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative mx-auto flex min-h-[82vh] max-w-350 items-end px-4 pb-14 sm:px-6 lg:pb-20">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.15fr)_380px] lg:items-end">
          <motion.div
            key={`${current.id}-content`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-3xl"
          >
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
                Featured Spotlight
              </span>
              <span className="rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-amber-500/25">
                {current.quality}
              </span>
              <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm">
                {current.year}
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {current.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {current.rating ? current.rating.toFixed(1) : 'N/A'}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">{current.genreLabel}</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">{current.year}</span>
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-base md:text-lg">
              {current.overview || 'A premium streaming selection powered by a dynamic collection catalog.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
              {current.genres.slice(0, 5).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 backdrop-blur-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={current.href}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-black shadow-2xl shadow-white/10 transition-transform hover:scale-[1.02]"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Play Now
              </Link>

              <Link
                href={current.href}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
              >
                More Info
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="hidden self-end lg:block"
          >
            <div className="rounded-4xl border border-white/10 bg-black/35 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                Up next
              </p>
              <div className="space-y-3">
                {items.slice(activeIndex + 1, activeIndex + 4).concat(items.slice(0, 1)).slice(0, 3).map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(items.findIndex((entry) => entry.id === item.id))}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                      item.id === current.id
                        ? 'border-white/25 bg-white/12'
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {item.posterUrl ? (
                        <Image src={item.posterUrl} alt={item.title} fill className="object-cover" sizes="44px" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-white/55">{item.genreLabel} • {item.year}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center px-4 sm:bottom-6">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-xl">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'w-10 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60'
              }`}
              aria-label={`Show featured title ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}