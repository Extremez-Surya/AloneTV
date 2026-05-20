import HeroBanner from '@/components/layout/HeroBanner';
import CollectionRail from '@/components/content/CollectionRail';
import { getTVPageModel } from '@/lib/ott-collections';

export default async function TVShowsPage() {
  const model = await getTVPageModel();

  return (
    <div className="min-h-screen bg-bg-primary">
      <HeroBanner items={model.heroItems} />

      <div className="bg-linear-to-b from-bg-primary via-[#09090d] to-bg-primary">
        <div className="mx-auto max-w-350 px-4 py-8 sm:px-6">
          <div className="rounded-4xl border border-white/8 bg-white/3 p-6 shadow-[0_28px_70px_-34px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">TV Shows</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">A full-screen TV destination with originals, dramas, and bingeable collections.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              Every major TV collection now comes from a single reusable registry, including originals, mini series, reality, comedy specials, and regional hits.
            </p>
          </div>
        </div>

        {model.sections.map((section) => (
          <CollectionRail key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}