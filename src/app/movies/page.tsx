import type { Metadata } from 'next'
import MovieGrid from '@/components/layout/MovieGrid'
import { getMoviesPageModel } from '@/lib/ott-collections'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Movies Catalog - Premium HD/4K Movies | VinayTV',
  description: 'Stream Bollywood hits, Hollywood blockbusters, action, thriller, and regional cinema in stunning quality. Watch unlimited movies.',
  keywords: ['movies', 'stream movies', '4k movies', 'bollywood movies', 'free movies online', 'VinayTV movies'],
  alternates: { canonical: 'https://vinaytv.vercel.app/movies' },
  openGraph: {
    title: 'Movies Catalog - Premium HD/4K Movies | VinayTV',
    description: 'Stream Bollywood hits, Hollywood blockbusters, action, thriller, and regional cinema in stunning quality.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movies Catalog - Premium HD/4K Movies | VinayTV',
    description: 'Stream Bollywood hits, Hollywood blockbusters, action, thriller, and regional cinema in stunning quality.',
  },
}

export default async function MoviesPage() {
  const model = await getMoviesPageModel()

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-purple-400">Movies</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">A complete movie universe.</h1>
          </div>
        </div>
        <MovieGrid sections={model.sections} />
      </div>
    </div>
  )
}
