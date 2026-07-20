'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { PremiumCollectionSection } from '@/lib/ott-collections'

function matchesFilters(
  item: PremiumCollectionSection['items'][number],
  params: URLSearchParams,
): boolean {
  const selectedGenres = params.get('genres')?.split(',').filter(Boolean) || []
  const minRating = Number(params.get('minRating')) || 0
  const quality = params.get('quality') || 'all'
  const activeDecade = params.get('decade') || ''

  if (selectedGenres.length > 0 && !item.genres.some(g => selectedGenres.includes(g))) return false
  if (minRating > 0 && item.rating < minRating) return false
  if (quality !== 'all' && item.quality !== quality) return false
  if (activeDecade) {
    const year = parseInt(item.year)
    if (isNaN(year)) return false
    const decadeMap: Record<string, [number, number]> = {
      '2020s': [2020, 2029], '2010s': [2010, 2019], '2000s': [2000, 2009],
      '1990s': [1990, 1999], '1980s': [1980, 1989], '1970s': [1970, 1979],
    }
    if (activeDecade === 'Older') {
      if (year >= 1970) return false
    } else {
      const [start, end] = decadeMap[activeDecade]
      if (year < start || year > end) return false
    }
  }
  return true
}

function sortItems(items: PremiumCollectionSection['items'], sortBy: string) {
  const sorted = [...items]
  switch (sortBy) {
    case 'rating': return sorted.sort((a, b) => b.rating - a.rating)
    case 'year': return sorted.sort((a, b) => parseInt(b.year) - parseInt(a.year) || b.rating - a.rating)
    case 'title': return sorted.sort((a, b) => a.title.localeCompare(b.title))
    default: return sorted
  }
}

export default function MovieGrid({ sections }: { sections: PremiumCollectionSection[] }) {
  const searchParams = useSearchParams()
  const sortBy = searchParams.get('sort') || 'popularity'
  const keyword = searchParams.get('q') || ''

  const items = useMemo(() => {
    const seen = new Set<string>()
    const all = sections.flatMap(s => s.items).filter(item => {
      const key = `${item.type}-${item.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const filtered = all.filter(item => matchesFilters(item, searchParams))
    const sorted = sortItems(filtered, sortBy)
    if (keyword) {
      return sorted.filter(item =>
        item.title.toLowerCase().includes(keyword.toLowerCase()),
      )
    }
    return sorted
  }, [sections, searchParams, sortBy, keyword])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/[0.04] flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-zinc-500 text-sm mb-1">No results match your filters.</p>
        <p className="text-zinc-600 text-xs">Try adjusting or clearing the filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {items.map((item) => (
        <Link
          key={`${item.type}-${item.id}`}
          href={`/detail/${item.type}/${item.id}`}
          className="group block"
        >
          <div className="relative rounded-xl overflow-hidden mb-2 bg-zinc-900 border border-white/[0.06] aspect-[2/3] shadow-lg transition-all duration-300 group-hover:shadow-purple-500/20 group-hover:shadow-2xl group-hover:scale-[1.02]">
            {item.posterUrl ? (
              <Image
                src={item.posterUrl}
                alt={item.title}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 gap-2">
                <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
            )}

            <div className="absolute top-2 left-2 flex gap-1.5">
              <span className="rounded-md bg-black/70 px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider text-white backdrop-blur-sm border border-white/10">
                {item.quality}
              </span>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-black shadow-2xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-200">
                <svg className="h-5 w-5 fill-current ml-0.5" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="px-0.5 space-y-1">
            <h3 className="line-clamp-1 text-xs sm:text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
              {item.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-500">
              <span className="font-mono">{item.year}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-0.5 text-yellow-500">
                ★ {item.rating.toFixed(1)}
              </span>
              <span>•</span>
              <span className="text-zinc-600">{item.quality}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
