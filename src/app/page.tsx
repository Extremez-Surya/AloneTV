import HeroBanner from '@/components/layout/HeroBanner';
import HomeClient from '@/components/layout/HomeClient';
import { getHomePageModel } from '@/lib/ott-collections';

export default async function Home() {
  const model = await getHomePageModel();

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <HeroBanner items={model.heroItems} />

      <div className="mx-auto max-w-[1400px] px-4 pb-6 pt-8 sm:px-6">
        {/* Stark brand info card */}
        <div className="grid gap-6 rounded-2xl border border-border bg-bg-card p-6 shadow-level-3 md:grid-cols-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-purple">Premium OTT</p>
            <h2 className="mt-2 text-xl sm:text-2xl font-semibold tracking-[-1.28px] text-text-primary">
              All collections, one cinematic home.
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-text-muted md:col-span-2">
            Browse a live catalog of movies, TV shows, anime, regional cinema, awards, and streaming originals.
            AloneTV curates streams across multi-language audio dubs and translated subtitles, presented on a design-focused developer surface.
          </p>
        </div>
      </div>

      {/* Interactive Client Hub for rails, mood filters, and calendar schedules */}
      <HomeClient sections={model.sections} />
    </div>
  );
}