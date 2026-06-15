import type { Metadata } from 'next';
import HeroBanner from '@/components/layout/HeroBanner';
import CollectionRail from '@/components/content/CollectionRail';
import { getWebSeriesPageModel } from '@/lib/ott-collections';

export const metadata: Metadata = {
  title: 'Web Series',
  description: 'Browse serialized TV stories and web series in one dedicated destination.',
};

export default async function WebSeriesPage() {
  const model = await getWebSeriesPageModel();

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <HeroBanner items={model.heroItems} />

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-level-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-purple">Web Series</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-[-1.28px] text-text-primary">
            A dedicated catalog for serialized streaming stories only.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
            This page surfaces the web-series collection directly, so you can browse every available web series without the rest of the TV catalog mixed in.
          </p>
        </div>
      </div>

      {model.sections.map((section) => (
        <CollectionRail key={section.id} section={section} />
      ))}
    </div>
  );
}