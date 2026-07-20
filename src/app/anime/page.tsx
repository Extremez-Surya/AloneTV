import type { Metadata } from 'next'
import MovieGrid from '@/components/layout/MovieGrid'
import { getAnimePageModel } from '@/lib/ott-collections'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Anime Streams - Premium Anime Collection | VinayTV',
  description: 'Stream popular anime series, movies, and classics in stunning quality. Watch subbed and dubbed anime for free.',
  keywords: ['anime', 'stream anime', 'anime series', 'subbed anime', 'dubbed anime', 'VinayTV anime'],
  alternates: { canonical: 'https://vinaytv.vercel.app/anime' },
  openGraph: {
    title: 'Anime Streams - Premium Anime Collection | VinayTV',
    description: 'Stream popular anime series, movies, and classics in stunning quality.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anime Streams - Premium Anime Collection | VinayTV',
    description: 'Stream popular anime series, movies, and classics in stunning quality.',
  },
}

export default async function AnimePage() {
  const model = await getAnimePageModel()

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-pink-400">Anime</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">Anime universe, endless adventures.</h1>
          </div>
        </div>
        <MovieGrid sections={model.sections} />
      </div>
    </div>
  )
}
