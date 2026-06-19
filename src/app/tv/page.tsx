import type { Metadata } from 'next';
import HeroBanner from '@/components/layout/HeroBanner';
import CollectionRail from '@/components/content/CollectionRail';
import { getTVPageModel } from '@/lib/ott-collections';

export const metadata: Metadata = {
  title: 'TV Shows Catalog - Watch HD Series Online | AloneTV',
  description: 'Stream popular TV series, Korean dramas, reality shows, and talk shows in stunning quality. Access unlimited seasons and episodes for free.',
  keywords: ['tv shows', 'stream series', 'watch tv online', 'k-dramas', 'free tv shows', 'AloneTV series'],
  alternates: {
    canonical: 'https://alonetv.com/tv',
  },
  openGraph: {
    title: 'TV Shows Catalog - Watch HD Series Online | AloneTV',
    description: 'Stream popular TV series, Korean dramas, reality shows, and talk shows in stunning quality. Access unlimited seasons and episodes for free.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TV Shows Catalog - Watch HD Series Online | AloneTV',
    description: 'Stream popular TV series, Korean dramas, reality shows, and talk shows in stunning quality. Access unlimited seasons and episodes for free.',
  },
};

export default async function TVShowsPage() {
  const model = await getTVPageModel();

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <HeroBanner items={model.heroItems} />

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-level-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-purple">TV Shows</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-[-1.28px] text-text-primary">
            A full-screen TV destination with originals, dramas, and bingeable collections.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
            Every major TV collection now comes from a single reusable registry, including originals, mini series, reality, comedy specials, and regional hits.
          </p>
        </div>
      </div>

      {model.sections.map((section) => (
        <CollectionRail key={section.id} section={section} />
      ))}
    </div>
  );
}