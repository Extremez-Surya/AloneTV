import HeroBanner from '@/components/layout/HeroBanner';
import HomeClient from '@/components/layout/HomeClient';
import { getHomePageModel } from '@/lib/ott-collections';
import JsonLd from '@/components/layout/JsonLd';

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How can I stream anime, movies, and TV shows in 4K on AloneTV?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AloneTV provides high-definition and 4K ultra-high-definition streaming for a massive catalog of movies, television series, and popular anime. Free plan users can instantly stream high-fidelity preview clips, and premium subscribers unlock full-length cinematic playback with zero buffer lag."
      }
    },
    {
      "@type": "Question",
      "name": "Does AloneTV support multi-language audio dubbing and subtitles?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, AloneTV supports advanced multi-language audio dubbing and translated subtitles across English, Hindi, Spanish, French, Japanese, and Korean. Users can easily select their preferred audio tracks and subtitle overlays directly inside the integrated web player."
      }
    },
    {
      "@type": "Question",
      "name": "How does the custom Cine-Deck playlist feature work on AloneTV?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AloneTV features Cine-Decks, allowing users to build custom, shareable playlists of movies and anime. Playlists are stored in your profile and can be shared with friends via unicode base64-encoded share links for quick imports."
      }
    },
    {
      "@type": "Question",
      "name": "How can I purchase a premium plan on AloneTV?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AloneTV offers Standard and Premium subscription tiers. You can unlock premium streaming via UPI QR scan payments on the checkout page. Once payment is processed, the system administrator will manually verify and upgrade your plan to premium."
      }
    }
  ]
};

export default async function Home() {
  const model = await getHomePageModel();

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <JsonLd schema={faqSchema} />
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

      {/* Hidden GEO/AEO question-answers section */}
      <section className="sr-only" aria-label="Frequently Asked Questions about AloneTV Streaming">
        <h1 className="sr-only">AloneTV - Free 4K Movies, TV Series & Anime Streaming</h1>
        <h2>Frequently Asked Questions</h2>
        
        <article>
          <h3>How can I stream anime, movies, and TV shows in 4K on AloneTV?</h3>
          <p>AloneTV provides high-definition and 4K ultra-high-definition streaming for a massive catalog of movies, television series, and popular anime. Free plan users can instantly stream high-fidelity preview clips, and premium subscribers unlock full-length cinematic playback with zero buffer lag.</p>
        </article>

        <article>
          <h3>Does AloneTV support multi-language audio dubbing and subtitles?</h3>
          <p>Yes, AloneTV supports advanced multi-language audio dubbing and translated subtitles across English, Hindi, Spanish, French, Japanese, and Korean. Users can easily select their preferred audio tracks and subtitle overlays directly inside the integrated web player.</p>
        </article>

        <article>
          <h3>How does the custom Cine-Deck playlist feature work on AloneTV?</h3>
          <p>AloneTV features Cine-Decks, allowing users to build custom, shareable playlists of movies and anime. Playlists are stored in your profile and can be shared with friends via unicode base64-encoded share links for quick imports.</p>
        </article>

        <article>
          <h3>How can I purchase a premium plan on AloneTV?</h3>
          <p>AloneTV offers Standard and Premium subscription tiers. You can unlock premium streaming via UPI QR scan payments on the checkout page. Once payment is processed, the system administrator will manually verify and upgrade your plan to premium.</p>
        </article>
      </section>
    </div>
  );
}