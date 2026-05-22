import HeroBanner from '@/components/layout/HeroBanner';
import CollectionRail from '@/components/content/CollectionRail';
import PageIntro from '@/components/layout/PageIntro';
import { getHomePageModel } from '@/lib/ott-collections';

export default async function Home() {
  const model = await getHomePageModel();

  return (
    <div className="min-h-screen bg-bg-primary">
      <HeroBanner items={model.heroItems} />

      <div className="bg-linear-to-b from-bg-primary via-[#071019] to-bg-primary">
        <PageIntro
          eyebrow="Now streaming"
          title="A premium streaming shell with a cleaner hierarchy and stronger cinematic flow."
          description="Move from spotlight picks into trending films, premium series, anime, regional hits, and live content without the extra dashboard clutter."
          chips={[
            'Trending now',
            'Continue watching',
            'Bollywood',
            'Anime',
            'Thrillers',
            'Recently added',
          ]}
        />

        {model.sections.map((section) => (
          <CollectionRail key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
