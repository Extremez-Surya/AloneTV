import HeroBanner from '@/components/layout/HeroBanner';
import CollectionRail from '@/components/content/CollectionRail';
import { getAnimePageModel } from '@/lib/ott-collections';

export default async function AnimePage() {
  const model = await getAnimePageModel();

  return (
    <div className="min-h-screen bg-bg-primary">
      <HeroBanner items={model.heroItems} />

      <div className="bg-linear-to-b from-bg-primary via-[#09090d] to-bg-primary">
        <div className="mx-auto max-w-350 px-4 py-8 sm:px-6">
          <div className="rounded-4xl border border-white/8 bg-white/3 p-6 shadow-[0_28px_70px_-34px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Anime</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Curated anime collections with airing, upcoming, and fan favorite titles.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              The anime page now participates in the same dynamic catalog architecture as the rest of the site, so it can share hero rotation and collection rails without hardcoded tiles.
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