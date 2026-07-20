import type { Metadata } from 'next'
import MovieGrid from '@/components/layout/MovieGrid'
import { getTVPageModel } from '@/lib/ott-collections'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'TV Shows - Premium HD Series | VinayTV',
  description: 'Stream popular TV series, Korean dramas, reality shows, and talk shows in stunning quality. Unlimited seasons and episodes.',
  keywords: ['tv shows', 'stream series', 'watch tv online', 'k-dramas', 'free tv shows', 'VinayTV series'],
  alternates: { canonical: 'https://vinaytv.vercel.app/tv' },
  openGraph: {
    title: 'TV Shows - Premium HD Series | VinayTV',
    description: 'Stream popular TV series, Korean dramas, reality shows, and talk shows in stunning quality.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TV Shows - Premium HD Series | VinayTV',
    description: 'Stream popular TV series, Korean dramas, reality shows, and talk shows in stunning quality.',
  },
}

export default async function TVShowsPage() {
  const model = await getTVPageModel()

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-purple-400">TV Shows</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">A full-screen TV destination.</h1>
          </div>
        </div>
        <MovieGrid sections={model.sections} />
      </div>
    </div>
  )
}
