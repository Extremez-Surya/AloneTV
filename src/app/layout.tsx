import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import DockBar from "@/components/layout/DockBar";
import AuroraBackground from "@/components/ui/AuroraBackground";
import JsonLd from "@/components/layout/JsonLd";
import AppShell from "@/components/layout/AppShell";
import LenisProvider from "@/components/ui/LenisProvider";
import LayoutGate from "@/components/layout/LayoutGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VinayTV - Premium Movies, TV Shows, Web Series & Anime Streaming",
    template: "%s | VinayTV",
  },
  description:
    "Stream unlimited movies, TV shows, web series, and anime in stunning quality. Your premium entertainment destination.",
  keywords: [
    "streaming", "movies", "TV shows", "web series", "anime",
    "4K", "premium streaming", "VinayTV",
  ],
  openGraph: {
    title: "VinayTV - Premium Streaming Platform",
    description: "Stream unlimited movies, TV shows, web series & anime in stunning quality.",
    type: "website",
    locale: "en_US",
    siteName: "VinayTV",
    images: [
      {
        url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80",
        width: 1200,
        height: 630,
        alt: "VinayTV Premium Cinematic Platform",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VinayTV - Premium Streaming Platform",
    description: "Stream unlimited movies, TV shows, web series & anime in stunning quality.",
  },
  robots: { index: true, follow: true },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VinayTV",
  "url": "https://vinaytv.vercel.app",
  "logo": "https://vinaytv.vercel.app/favicon.ico",
  "description": "Stream unlimited premium movies, TV series, web series, and anime in stunning quality.",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "VinayTV",
  "url": "https://vinaytv.vercel.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://vinaytv.vercel.app/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <JsonLd schema={organizationSchema} />
        <JsonLd schema={websiteSchema} />
        <div className="noise-overlay" />
        <AuroraBackground />
        <LayoutGate><Navbar /></LayoutGate>
        <main className="flex-1 relative z-10"><LenisProvider><AppShell>{children}</AppShell></LenisProvider></main>
        <LayoutGate><DockBar /></LayoutGate>

        <LayoutGate>
        <footer className="relative z-10 bg-black border-t border-white/[0.04] pt-16 pb-8">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-white/[0.06]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold text-white">Vinay<span className="text-purple-400">TV</span></span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                  Premium entertainment platform. Stream movies, TV shows, web series, and anime in stunning quality.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">Platform</h4>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">Home Feed</Link></li>
                  <li><Link href="/movies" className="text-sm text-zinc-500 hover:text-white transition-colors">Movies Catalog</Link></li>
                  <li><Link href="/tv" className="text-sm text-zinc-500 hover:text-white transition-colors">TV Shows</Link></li>
                  <li><Link href="/anime" className="text-sm text-zinc-500 hover:text-white transition-colors">Anime Streams</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">Collections</h4>
                <ul className="space-y-2">
                  <li><Link href="/movies#trending" className="text-sm text-zinc-500 hover:text-white transition-colors">Trending Now</Link></li>
                  <li><Link href="/movies#bollywood" className="text-sm text-zinc-500 hover:text-white transition-colors">Bollywood Hits</Link></li>
                  <li><Link href="/tv#k-drama" className="text-sm text-zinc-500 hover:text-white transition-colors">Korean Dramas</Link></li>
                  <li><Link href="/anime#popular" className="text-sm text-zinc-500 hover:text-white transition-colors">Popular Anime</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">DMCA Notice</a></li>
                  <li><a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Cookie Choices</a></li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="font-semibold text-zinc-400">VinayTV.</span>
                <span>© {new Date().getFullYear()} all rights reserved.</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 border border-white/[0.06] text-zinc-500">
                  CDN: OPERATIONAL
                </span>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-green-500/5 border border-green-500/10 text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  All Systems Normal
                </span>
              </div>
            </div>
          </div>
        </footer>
        </LayoutGate>
      </body>
    </html>
  );
}
