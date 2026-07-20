'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import CollectionRail from '@/components/content/CollectionRail'
import type { PremiumCollectionSection } from '@/lib/ott-collections'

function matchesFilters(item: PremiumCollectionSection['items'][number], params: URLSearchParams): boolean {
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

const hasActiveFilters = (params: URLSearchParams): boolean => {
  return !!(
    params.get('genres') ||
    params.get('minRating') ||
    params.get('quality') ||
    params.get('decade') ||
    (params.get('sort') && params.get('sort') !== 'popularity')
  )
}

export default function FilteredCatalog({ sections }: { sections: PremiumCollectionSection[] }) {
  const searchParams = useSearchParams()
  const sortBy = searchParams.get('sort') || 'popularity'

  const filtered = useMemo(() => {
    if (!hasActiveFilters(searchParams)) return sections

    return sections
      .map(section => ({
        ...section,
        items: sortItems(
          section.items.filter(item => matchesFilters(item, searchParams)),
          sortBy,
        ),
      }))
      .filter(section => section.items.length > 0)
  }, [sections, searchParams, sortBy])

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/[0.04] flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-zinc-500 text-sm mb-1">No results match your filters.</p>
        <p className="text-zinc-600 text-xs">Try adjusting or clearing the filters above.</p>
      </div>
    )
  }

  return (
    <>
      {filtered.map(section => (
        <CollectionRail key={section.id} section={section} />
      ))}
    </>
  )
}
