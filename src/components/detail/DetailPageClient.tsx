'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import ContentCard from '@/components/content/ContentCard'
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/userHistory'

interface Season {
  season_number: number
  name: string
  episode_count?: number
  poster_path?: string
}

interface DetailPageClientProps {
  type: string
  id: string
  tmdbId: number | string
  imdbId: string
  title: string
  posterPath: string
  backdropPath: string
  overview: string
  voteAverage: number
  releaseDate: string
  genres: { id: number; name: string }[]
  cast: any[]
  similar: any[]
  seasons?: Season[]
  isAnime?: boolean
  originalLanguage?: string
  belongsToCollection?: {
    id: number
    name: string
    poster_path?: string
    backdrop_path?: string
  } | null
}

const LANG_MAP: Record<string, string> = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  kn: 'Kannada', ml: 'Malayalam', ja: 'Japanese', ko: 'Korean',
  es: 'Spanish', fr: 'French', de: 'German', zh: 'Chinese',
}

export default function DetailPageClient({
  type,
  id,
  title,
  posterPath,
  backdropPath,
  overview,
  voteAverage,
  releaseDate,
  genres,
  cast,
  similar,
  seasons,
  isAnime,
  originalLanguage = 'en',
}: DetailPageClientProps) {
  const [selectedSeason, setSelectedSeason] = useState(seasons?.[0]?.season_number || 1)
  const [inWatchlist, setInWatchlist] = useState(false)

  useEffect(() => {
    setInWatchlist(isInWatchlist(id, type))
  }, [id, type])

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(id, type)
      setInWatchlist(false)
    } else {
      addToWatchlist({
        id,
        tmdbId: String(tmdbId || id),
        type: (isAnime ? 'anime' : type) as 'movie' | 'tv' | 'anime',
        title,
        posterPath,
        backdropPath,
        releaseDate,
        voteAverage,
        genres: genres.map(g => g.name),
      })
      setInWatchlist(true)
    }
  }

  const posterUrl = posterPath?.startsWith('http')
    ? posterPath
    : posterPath
      ? `https://image.tmdb.org/t/p/w500${posterPath}`
      : null

  const backdropUrl = backdropPath?.startsWith('http')
    ? backdropPath
    : backdropPath
      ? `https://image.tmdb.org/t/p/original${backdropPath}`
      : null

  const year = releaseDate?.slice(0, 4) || ''

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Backdrop hero */}
      <div className="relative h-[50vh] sm:h-[60vh] w-full overflow-hidden">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 lg:p-12">
          <div className="mx-auto max-w-[1400px] flex items-end gap-6">
            {posterUrl && (
              <div className="hidden sm:block w-[180px] lg:w-[220px] shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/[0.06]">
                <div className="aspect-[2/3] relative">
                  <Image src={posterUrl} alt={title} fill className="object-cover" sizes="220px" />
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {genres.slice(0, 3).map(g => (
                  <span key={g.id} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/[0.06] text-zinc-300">
                    {g.name}
                  </span>
                ))}
                <span className="text-[10px] font-mono text-zinc-500">{LANG_MAP[originalLanguage] || originalLanguage}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-2">{title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 mb-4">
                {year && <span className="font-mono">{year}</span>}
                <span className="inline-flex items-center gap-1 text-yellow-500">★ {voteAverage.toFixed(1)}</span>
                {type === 'movie' && <span className="text-zinc-600">Movie</span>}
                {type === 'tv' && <span className="text-zinc-600">TV Series</span>}
                {type === 'anime' && <span className="text-zinc-600">Anime</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/watch/${type}/${id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-purple-500/25"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start Watching
                </Link>

                <button
                  onClick={toggleWatchlist}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    inWatchlist
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-white/10 hover:bg-white/20 border-white/[0.08] text-white'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  {inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column — overview + cast */}
          <div className="lg:col-span-2 space-y-10">
            {/* Overview */}
            <section>
              <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-purple-400 mb-3">Synopsis</h2>
              <p className="text-sm leading-relaxed text-zinc-300 max-w-3xl">{overview || 'No synopsis available.'}</p>
            </section>

            {/* Cast */}
            {cast.length > 0 && (
              <section>
                <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-purple-400 mb-4">Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {cast.map((member: any) => (
                    <div key={member.id || member.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                        {member.profile_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                            alt={member.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-bold">
                            {member.name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 truncate">{member.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{member.character || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Similar */}
            {similar.length > 0 && (
              <section>
                <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-purple-400 mb-4">You May Also Like</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {similar.slice(0, 8).map((item: any, i: number) => (
                    <ContentCard key={item.id || i} item={item} type={type === 'anime' ? 'anime' : type === 'tv' ? 'tv' : 'movie'} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column — info sidebar */}
          <div className="space-y-6">
            {/* Poster (mobile) */}
            {posterUrl && (
              <div className="sm:hidden rounded-xl overflow-hidden border border-white/[0.06]">
                <div className="aspect-[2/3] relative">
                  <Image src={posterUrl} alt={title} fill className="object-cover" sizes="100vw" />
                </div>
              </div>
            )}

            {/* Genres */}
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-4">
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500">Details</h3>
              <div className="space-y-3 text-sm">
                {year && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Released</span>
                    <span className="text-zinc-300 font-mono">{year}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rating</span>
                  <span className="text-yellow-500 font-mono">★ {voteAverage.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Language</span>
                  <span className="text-zinc-300">{LANG_MAP[originalLanguage] || originalLanguage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Type</span>
                  <span className="text-zinc-300 capitalize">{type}</span>
                </div>
                {genres.length > 0 && (
                  <div>
                    <span className="text-zinc-500 block mb-1.5">Genres</span>
                    <div className="flex flex-wrap gap-1.5">
                      {genres.map(g => (
                        <span key={g.id} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.06] text-zinc-400">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seasons (TV only) */}
            {seasons && seasons.length > 0 && (
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500">Seasons</h3>
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                  {seasons.map(s => (
                    <button
                      key={s.season_number}
                      onClick={() => setSelectedSeason(s.season_number)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                        selectedSeason === s.season_number
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                          : 'text-zinc-400 hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <span className="font-medium">{s.name}</span>
                      {s.episode_count != null && (
                        <span className="ml-2 text-zinc-600">{s.episode_count} episodes</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <Link
              href={`/watch/${type}/${id}`}
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-purple-500/25"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start Watching
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
