import HeroBanner from '@/components/layout/HeroBanner';
import CollectionRail from '@/components/content/CollectionRail';
import PageIntro from '@/components/layout/PageIntro';
import { getHomePageModel } from '@/lib/ott-collections';
import { capabilityChips, experiencePillars, platformStats } from '@/lib/platform';

export default async function Home() {
  const model = await getHomePageModel();

  return (
    <div className="min-h-screen bg-bg-primary">
      <HeroBanner items={model.heroItems} />

      <div className="bg-linear-to-b from-bg-primary via-[#071019] to-bg-primary">
        <PageIntro
          eyebrow="Now streaming"
          title="A premium streaming shell built to feel faster, denser, and more cinematic."
          description="Move from spotlight picks into trending films, premium series, anime, regional hits, and live content with a tighter visual rhythm and stronger discovery hierarchy."
          chips={[
            'Trending now',
            'Continue watching',
            'Bollywood',
            'Anime',
            'Thrillers',
            'Recently added',
          ]}
        />

        <section className="mx-auto max-w-400 px-4 pb-8 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_30px_80px_-46px_rgba(0,0,0,0.98)] backdrop-blur-xl sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/42">Platform snapshot</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Discovery, playback, and live content in one focused surface.
                  </h2>
                </div>
                <div className="rounded-full border border-white/8 bg-white/4 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                  SSR + PWA ready
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {platformStats.map((stat) => (
                  <div key={stat.label} className="rounded-[1.35rem] border border-white/8 bg-black/25 p-4">
                    <div className="text-2xl font-black tracking-tight text-white">{stat.value}</div>
                    <div className="mt-2 text-sm font-semibold text-white/82">{stat.label}</div>
                    <p className="mt-2 text-sm leading-6 text-white/52">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_30px_80px_-46px_rgba(0,0,0,0.98)] backdrop-blur-xl sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/42">Experience pillars</p>
              <div className="mt-4 grid gap-3">
                {experiencePillars.map((pillar) => (
                  <div key={pillar.title} className="relative overflow-hidden rounded-[1.35rem] border border-white/8 bg-black/24 p-4">
                    <div className={`absolute inset-0 bg-linear-to-r ${pillar.accent} opacity-70`} />
                    <div className="relative">
                      <div className="text-lg font-bold text-white">{pillar.title}</div>
                      <p className="mt-2 text-sm leading-6 text-white/58">{pillar.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {capabilityChips.slice(0, 8).map((chip) => (
                  <span key={chip} className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/72">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {model.sections.map((section) => (
          <CollectionRail key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
