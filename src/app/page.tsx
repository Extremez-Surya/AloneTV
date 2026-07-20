import TrailerHero from '@/components/layout/TrailerHero';
import HomeClient from '@/components/layout/HomeClient';
import { getHomePageModel } from '@/lib/ott-collections';
import JsonLd from '@/components/layout/JsonLd';

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How can I stream movies and TV shows on VinayTV?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "VinayTV provides high-definition and 4K ultra-high-definition streaming for a massive catalog of movies, television series, and popular anime. Premium subscribers unlock full-length cinematic playback with zero buffer lag."
      }
    },
    {
      "@type": "Question",
      "name": "Does VinayTV support multi-language audio and subtitles?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, VinayTV supports advanced multi-language audio dubbing and translated subtitles across English, Hindi, Spanish, French, Japanese, and Korean."
      }
    },
    {
      "@type": "Question",
      "name": "How can I purchase a premium plan on VinayTV?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "VinayTV offers Standard and Premium subscription tiers. You can unlock premium streaming via UPI QR scan payments on the checkout page."
      }
    }
  ]
};

export default async function Home() {
  const model = await getHomePageModel();

  return (
    <div className="min-h-screen bg-bg-primary">
      <JsonLd schema={faqSchema} />
      <TrailerHero items={model.heroItems} />

      {/* Brand intro */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-6 pt-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 border border-white/[0.06] p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-purple-400">VinayTV Premium</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
                All entertainment, one cinematic home.
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400 md:col-span-2">
              Browse a live catalog of movies, TV shows, anime, regional cinema, and streaming originals.
              VinayTV curates streams across multi-language audio dubs and translated subtitles, 
              presented on a premium design-focused platform.
            </p>
          </div>
        </div>
      </div>

      <HomeClient sections={model.sections} />

      {/* Hidden SEO content */}
      <section className="sr-only" aria-label="Frequently Asked Questions about VinayTV Streaming">
        <h1>VinayTV - Premium Movies, TV Series & Anime Streaming</h1>
        <h2>Frequently Asked Questions</h2>
        <article>
          <h3>How can I stream content in 4K on VinayTV?</h3>
          <p>VinayTV provides high-definition and 4K ultra-high-definition streaming for a massive catalog of movies, television series, and popular anime.</p>
        </article>
        <article>
          <h3>Does VinayTV support multi-language audio dubbing and subtitles?</h3>
          <p>Yes, VinayTV supports advanced multi-language audio dubbing and translated subtitles across English, Hindi, Spanish, French, Japanese, and Korean.</p>
        </article>
      </section>
    </div>
  );
}
