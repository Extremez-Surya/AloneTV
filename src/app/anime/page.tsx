import HeroBanner from '@/components/layout/HeroBanner';
import CollectionRail from '@/components/content/CollectionRail';
import { getAnimePageModel } from '@/lib/ott-collections';

export default async function AnimePage() {
  const model = await getAnimePageModel();

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <HeroBanner items={model.heroItems} />

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-level-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-purple">Anime</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-[-1.28px] text-text-primary">
            Curated anime collections with airing, upcoming, and fan favorite titles.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
            The anime page now participates in the same dynamic catalog architecture as the rest of the site, so it can share hero rotation and collection rails without hardcoded tiles.
          </p>
        </div>
      </div>

      {model.sections.map((section) => (
        <CollectionRail key={section.id} section={section} />
      ))}
    </div>
  );
}