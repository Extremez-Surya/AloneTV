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
      <div className="relative min-h-[78vh] overflow-hidden bg-linear-to-br from-[#05070b] via-[#080b12] to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,92,115,0.14),transparent_28%),radial-gradient(circle_at_left,rgba(79,124,255,0.12),transparent_26%),linear-gradient(180deg,transparent,rgba(5,7,11,0.94))]" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-[1600px] items-end px-4 pb-12 sm:px-6 lg:pb-20">
          <div className="max-w-3xl space-y-4">
            <div className="h-6 w-32 rounded-full bg-white/10" />
            <div className="h-16 w-4/5 rounded-[1.4rem] bg-white/10" />
            <div className="h-24 w-full rounded-[1.4rem] bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  const current = items[activeIndex];
  const upcomingItems = items.slice(activeIndex + 1, activeIndex + 4).concat(items.slice(0, 3)).slice(0, 3);

  return (
    <section className="relative min-h-[78vh] overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.05, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {current.backdropUrl ? (
            <Image
              src={current.backdropUrl}
              alt={current.title}
              fill
              priority
              className="object-cover object-center will-change-transform"
              sizes="100vw"
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-bg-card via-black to-bg-primary" />
          )}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,123,84,0.18),transparent_20%),radial-gradient(circle_at_80%_18%,rgba(79,124,255,0.16),transparent_24%),radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_36%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,4,10,0.94),rgba(2,4,10,0.72)_38%,rgba(2,4,10,0.18)_72%,rgba(2,4,10,0.40)),linear-gradient(180deg,transparent,rgba(5,7,11,0.96))]" />
          <div className="absolute inset-0 opacity-25 mix-blend-soft-light [background-image:radial-gradient(rgba(255,255,255,0.14)_0.7px,transparent_0.7px)] [background-size:8px_8px]" />
        </motion.div>
      </AnimatePresence>

      <div className="relative mx-auto flex min-h-[78vh] max-w-[1600px] items-end px-4 pb-10 sm:px-6 lg:pb-16">
        <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1.12fr)_360px] xl:items-end">
          <motion.div
            key={`${current.id}-content`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-4xl"
          >
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/14 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/80 backdrop-blur-md">
                AloneTV original
              </span>
              <span className="rounded-full bg-linear-to-r from-[#ff7b54] via-[#ff4d6d] to-[#f4d35e] px-3 py-1 text-[11px] font-semibold text-white shadow-lg shadow-[#ff4d6d]/25">
                {current.quality}
              </span>
              <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm">
                {current.year}
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[0.9] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-[5.6rem]">
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

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/68 sm:text-base md:text-lg">
              {current.overview || 'A premium streaming selection powered by a dynamic collection catalog.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
              {current.genres.slice(0, 5).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 backdrop-blur-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={current.href}
                className="inline-flex items-center gap-2 rounded-[1.2rem] bg-white px-6 py-3.5 text-sm font-bold text-black shadow-2xl shadow-white/10 transition-transform duration-500 hover:scale-[1.03]"
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
                className="inline-flex items-center gap-2 rounded-[1.2rem] border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
              >
                More Info
              </Link>
            </div>

            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                'Autoplay next episode',
                '4K ready discovery',
                'Personalized rails',
                'Keyboard search',
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-[1.1rem] border border-white/8 bg-black/30 px-4 py-3 text-sm text-white/75 backdrop-blur-xl"
                >
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="hidden self-end xl:block"
          >
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Up next</p>
                  <p className="mt-1 text-sm text-white/65">Quick queue preview</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  Auto curated
                </span>
              </div>
              <div className="space-y-3">
                {upcomingItems.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(items.findIndex((entry) => entry.id === item.id))}
                    className={`flex w-full items-center gap-3 rounded-[1.35rem] border px-3 py-3 text-left transition-colors ${
                      item.id === current.id
                        ? 'border-white/25 bg-white/12'
                        : 'border-white/5 bg-white/[0.04] hover:bg-white/10'
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
