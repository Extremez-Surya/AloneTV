import type { Metadata } from 'next'
import MovieGrid from '@/components/layout/MovieGrid'
import { getWebSeriesPageModel } from '@/lib/ott-collections'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Web Series - Premium Streaming Originals | VinayTV',
  description: 'Stream popular web series, serialized dramas, and streaming originals in high quality. Binge entire seasons.',
  keywords: ['web series', 'stream web series', 'serialized stories', 'free web series', 'binge watch shows'],
  alternates: { canonical: 'https://vinaytv.vercel.app/web-series' },
  openGraph: {
    title: 'Web Series - Premium Streaming Originals | VinayTV',
    description: 'Stream popular web series, serialized dramas, and streaming originals in high quality.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Series - Premium Streaming Originals | VinayTV',
    description: 'Stream popular web series, serialized dramas, and streaming originals in high quality.',
  },
}

export default async function WebSeriesPage() {
  const model = await getWebSeriesPageModel()

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-purple-400">Web Series</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">Serialized stories, endless entertainment.</h1>
          </div>
        </div>
        <MovieGrid sections={model.sections} />
      </div>
    </div>
  )
}
