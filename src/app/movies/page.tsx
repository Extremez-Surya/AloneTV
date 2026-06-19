import type { Metadata } from 'next';
import HeroBanner from '@/components/layout/HeroBanner';
import CollectionRail from '@/components/content/CollectionRail';
import { getMoviesPageModel } from '@/lib/ott-collections';

export const metadata: Metadata = {
  title: 'Movies Catalog - Stream Free 4K Movies | AloneTV',
  description: 'Stream Bollywood hits, Hollywood blockbusters, action, thriller, and regional cinema in stunning 4K quality. Watch unlimited movies for free.',
  keywords: ['movies', 'stream movies', '4k movies', 'bollywood movies', 'free movies online', 'AloneTV movies'],
  alternates: {
    canonical: 'https://alonetv.com/movies',
  },
  openGraph: {
    title: 'Movies Catalog - Stream Free 4K Movies | AloneTV',
    description: 'Stream Bollywood hits, Hollywood blockbusters, action, thriller, and regional cinema in stunning 4K quality. Watch unlimited movies for free.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movies Catalog - Stream Free 4K Movies | AloneTV',
    description: 'Stream Bollywood hits, Hollywood blockbusters, action, thriller, and regional cinema in stunning 4K quality. Watch unlimited movies for free.',
  },
};

export default async function MoviesPage() {
  const model = await getMoviesPageModel();

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <HeroBanner items={model.heroItems} />

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-level-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-purple">Movies</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-[-1.28px] text-text-primary">
            A complete movie universe, arranged like a premium streaming home.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
            Explore regional cinema, global blockbusters, genres, award winners, upcoming releases, and carefully curated mixed collections.
          </p>
        </div>
      </div>

      {model.sections.map((section) => (
        <CollectionRail key={section.id} section={section} />
      ))}
    </div>
  );
}