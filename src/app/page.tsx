import HeroBanner from '@/components/layout/HeroBanner';
import CollectionRail from '@/components/content/CollectionRail';
import { getHomePageModel } from '@/lib/ott-collections';

export default async function Home() {
  const model = await getHomePageModel();

  return (
    <div className="min-h-screen bg-bg-primary">
      <HeroBanner items={model.heroItems} />

      <div className="bg-linear-to-b from-bg-primary via-[#0a0a0f] to-bg-primary">
        <div className="mx-auto max-w-350 px-4 pb-6 pt-8 sm:px-6">
          <div className="grid gap-4 rounded-4xl border border-white/8 bg-white/3 p-5 shadow-[0_32px_80px_-36px_rgba(0,0,0,0.9)] backdrop-blur-xl md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Premium OTT</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">All collections, one cinematic home.</h2>
            </div>
            <p className="text-sm leading-7 text-white/60 md:col-span-2">
              Browse a live catalog of movies, TV, anime, regional cinema, awards, and streaming originals.
              The homepage is now driven by reusable collection definitions so every rail can be updated from one place.
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