'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { PremiumCollectionItem } from '@/lib/ott-collections';

gsap.registerPlugin(ScrollTrigger);

interface HeroBannerProps {
  items: PremiumCollectionItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveIndex((c) => (c + 1) % items.length);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [items.length]);

  useEffect(() => {
    if (!heroRef.current || !parallaxRef.current) return;

    gsap.fromTo(parallaxRef.current,
      { scale: 1.1 },
      {
        scale: 1,
        duration: 1.5,
        ease: 'power2.out',
      }
    );

    ScrollTrigger.create({
      trigger: heroRef.current,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        if (parallaxRef.current) {
          gsap.set(parallaxRef.current, { y: self.progress * 100 });
        }
      },
    });

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, [activeIndex]);

  if (items.length === 0) {
    return (
      <section ref={heroRef} className="relative min-h-[90vh] overflow-hidden bg-bg-primary pt-24">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/30 blur-[150px]" />
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[70%] rounded-full bg-blue-500/20 blur-[150px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 py-20 flex flex-col items-center text-center">
          <div className="max-w-3xl space-y-4">
            <div className="h-6 w-32 rounded-full skeleton mx-auto" />
            <div className="h-14 w-4/5 rounded-2xl skeleton mx-auto" />
            <div className="h-20 w-full rounded-2xl skeleton mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  const current = items[activeIndex];

  return (
    <section
      ref={heroRef}
      className="relative min-h-[90vh] md:min-h-[95vh] flex flex-col justify-end overflow-hidden bg-bg-primary"
    >
      <div ref={parallaxRef} className="absolute inset-0 z-0 will-change-transform">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.type}-${current.id}-bg`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
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
              <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black" />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-[1]" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-bg-primary to-transparent z-[2]" />
      </div>

      <div ref={contentRef} className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
        <motion.div
          key={`${current.type}-${current.id}-content`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl space-y-5"
        >
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400"
            >
              Spotlight
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="px-3 py-1 text-[10px] font-mono rounded-full bg-white/5 border border-white/10 text-zinc-400"
            >
              {current.quality} • {current.year}
            </motion.span>
            {current.rating > 0 && (
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="px-3 py-1 text-[10px] font-mono rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center gap-1"
              >
                ★ {current.rating.toFixed(1)}
              </motion.span>
            )}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-7xl font-black tracking-[-3px] text-white leading-[1.05]"
          >
            {current.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl line-clamp-3"
          >
            {current.overview || 'Experience premium entertainment at your fingertips.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <Link
              href={current.href}
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 text-sm font-bold rounded-full bg-white text-black hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Play Now
            </Link>
            <Link
              href={current.href}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 text-sm font-medium rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              More Info
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-12 border-t border-white/10 pt-6"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4">
            Spotlight Selection
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.slice(0, 4).map((item, idx) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => setActiveIndex(items.findIndex((e) => e.id === item.id))}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all backdrop-blur-md ${
                  item.id === current.id
                    ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/5'
                    : 'border-white/5 bg-white/[0.03] hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="relative w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-zinc-900 ring-1 ring-white/10">
                  {item.posterUrl && (
                    <Image src={item.posterUrl} alt={item.title} fill className="object-cover" sizes="40px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${item.id === current.id ? 'text-purple-400' : 'text-zinc-300'}`}>
                    {item.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{item.genreLabel} • {item.year}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
