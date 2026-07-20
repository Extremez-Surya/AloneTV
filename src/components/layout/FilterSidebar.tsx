'use client'

import { useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Kids', 'Mystery',
  'Reality', 'Romance', 'Sci-Fi', 'Soap', 'Talk', 'Thriller', 'War',
]

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Rating' },
  { value: 'year', label: 'Year' },
  { value: 'title', label: 'Title A-Z' },
]

const QUALITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'HD', label: 'HD' },
  { value: '4K', label: '4K' },
]

const DECADES = ['2020s', '2010s', '2000s', '1990s', '1980s', '1970s', 'Older']

export default function FilterSidebar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const selectedGenres = searchParams.get('genres')?.split(',').filter(Boolean) || []
  const sortBy = searchParams.get('sort') || 'popularity'
  const minRating = Number(searchParams.get('minRating')) || 0
  const quality = searchParams.get('quality') || 'all'
  const activeDecade = searchParams.get('decade') || ''

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const toggleGenre = (genre: string) => {
    const current = new Set(selectedGenres)
    if (current.has(genre)) current.delete(genre)
    else current.add(genre)
    updateParam('genres', Array.from(current).join(','))
  }

  const clearAll = () => {
    router.push(pathname, { scroll: false })
  }

  const hasActiveFilters = selectedGenres.length > 0 || minRating > 0 || quality !== 'all' || activeDecade || sortBy !== 'popularity'

  return (
    <aside className="fixed left-0 top-[72px] bottom-[64px] z-40 hidden lg:flex flex-col w-[220px] bg-black/70 backdrop-blur-2xl border-r border-white/[0.04]">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 pb-6 space-y-5">

          {/* Sort By */}
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500 mb-2.5">Sort By</p>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateParam('sort', opt.value === 'popularity' ? '' : opt.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                    sortBy === opt.value
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                      : 'text-zinc-500 hover:text-zinc-300 bg-white/5 border border-white/[0.04] hover:border-white/[0.1]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/[0.04]" />

          {/* Genre */}
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500 mb-2.5">
              Genre {selectedGenres.length > 0 && <span className="text-purple-400">({selectedGenres.length})</span>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((genre) => {
                const active = selectedGenres.includes(genre)
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                      active
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                        : 'text-zinc-500 hover:text-zinc-300 bg-white/5 border border-white/[0.04] hover:border-white/[0.1]'
                    }`}
                  >
                    {genre}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="h-px bg-white/[0.04]" />

          {/* Decade */}
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500 mb-2.5">Decade</p>
            <div className="flex flex-wrap gap-1.5">
              {DECADES.map((decade) => (
                <button
                  key={decade}
                  onClick={() => updateParam('decade', activeDecade === decade ? '' : decade)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeDecade === decade
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                      : 'text-zinc-500 hover:text-zinc-300 bg-white/5 border border-white/[0.04] hover:border-white/[0.1]'
                  }`}
                >
                  {decade}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/[0.04]" />

          {/* Rating */}
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500 mb-2.5">
              Min. Rating {minRating > 0 && <span className="text-purple-400">≥ {minRating}</span>}
            </p>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={minRating}
              onChange={(e) => updateParam('minRating', Number(e.target.value) > 0 ? e.target.value : '')}
              className="w-full accent-purple-500 h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          <div className="h-px bg-white/[0.04]" />

          {/* Quality */}
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500 mb-2.5">Quality</p>
            <div className="flex gap-1.5">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateParam('quality', opt.value === 'all' ? '' : opt.value)}
                  className={`flex-1 text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    quality === opt.value
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                      : 'text-zinc-500 hover:text-zinc-300 bg-white/5 border border-white/[0.04] hover:border-white/[0.1]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/[0.04]" />

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="w-full text-[11px] px-3 py-2 rounded-lg font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/[0.04] transition-all"
            >
              Clear All Filters
            </button>
          )}

        </div>
      </div>

      <div className="flex-shrink-0 p-3 border-t border-white/[0.04]">
        <div className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          <span className="text-[10px] font-mono text-zinc-600">Filters</span>
        </div>
      </div>
    </aside>
  )
}
