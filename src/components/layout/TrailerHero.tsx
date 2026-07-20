'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { PremiumCollectionItem } from '@/lib/ott-collections'

interface TrailerHeroProps {
  items: PremiumCollectionItem[]
}

const INTERVAL = 10000

export default function TrailerHero({ items }: TrailerHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const current = items[activeIndex]

  // Preload images for smooth transitions
  useEffect(() => {
    if (!items.length) return
    let loaded = 0
    items.forEach(item => {
      if (!item.backdropUrl) { loaded++; return }
      const img = new window.Image()
      img.onload = () => { loaded++; if (loaded >= items.length) setImagesLoaded(true) }
      img.onerror = () => { loaded++; if (loaded >= items.length) setImagesLoaded(true) }
      img.src = item.backdropUrl
    })
  }, [items])

  // Auto-advance interval
  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % items.length)
    }, INTERVAL)
  }, [items.length])

  useEffect(() => {
    if (isPlaying && items.length > 1) startInterval()
    else if (intervalRef.current) clearInterval(intervalRef.current)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, items.length, startInterval])

  const goTo = (index: number) => {
    setActiveIndex(index)
    if (isPlaying) startInterval()
  }

  if (!items.length) return null

  const title = current.title || (current as any).name || ''
  const overview = current.overview || ''
  const year = current.year || ''
  const backdrop = current.backdropUrl

  return (
    <section className="relative min-h-[90vh] md:min-h-[95vh] flex flex-col justify-end overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {backdrop ? (
          <Image
            src={backdrop}
            alt={title}
            fill
            className={`object-cover transition-opacity duration-700 ${imagesLoaded ? 'opacity-100' : 'opacity-0'}`}
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-[1]" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-bg-primary to-transparent z-[2]" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.type}-${current.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/20 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                Featured
              </span>
              {year && (
                <span className="text-xs font-mono text-zinc-500">{year}</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-4">
              {title}
            </h1>

            {overview && (
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl line-clamp-3 mb-6">
                {overview}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Link
                href={`/detail/${current.type}/${current.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-100 text-black text-sm font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Info
              </Link>
              <Link
                href={`/detail/${current.type}/${current.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-all backdrop-blur-md border border-white/[0.06]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                More Info
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Carousel Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-8 left-8 z-20 flex items-center gap-2">
          {items.map((item, i) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Gradient bottom edge for smooth transition */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-bg-primary to-transparent z-[3]" />
    </section>
  )
}
