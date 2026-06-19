import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

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

import JsonLd from "@/components/layout/JsonLd";

export const metadata: Metadata = {
  title: {
    default: "AloneTV - Free 4K Movies, TV Shows, Web Series & Anime Streaming",
    template: "%s | AloneTV",
  },
  description:
    "Stream unlimited movies, TV shows, web series, and anime in stunning 4K quality. Your premium entertainment destination.",
  keywords: [
    "streaming",
    "movies",
    "TV shows",
    "web series",
    "anime",
    "4K",
    "free streaming",
  ],
  openGraph: {
    title: "AloneTV - Free 4K Streaming Platform",
    description: "Stream unlimited movies, TV shows, web series & anime in stunning 4K quality.",
    type: "website",
    locale: "en_US",
    siteName: "AloneTV",
  },
  twitter: {
    card: "summary_large_image",
    title: "AloneTV - Free 4K Streaming Platform",
    description: "Stream unlimited movies, TV shows, web series & anime in stunning 4K quality.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AloneTV",
  "url": "https://alonetv.com",
  "logo": "https://alonetv.com/favicon.ico",
  "description": "Stream unlimited free movies, TV series, web series, and anime in stunning 4K quality.",
  "sameAs": [
    "https://twitter.com/alonetv",
    "https://facebook.com/alonetv"
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AloneTV",
  "url": "https://alonetv.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://alonetv.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <JsonLd schema={organizationSchema} />
        <JsonLd schema={websiteSchema} />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-bg-card border-t border-border mt-auto pt-16 pb-8 z-10 relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            {/* 4 Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-border">
              {/* Platform */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-widest text-text-primary">Platform</h4>
                <ul className="space-y-2 text-sm text-text-muted">
                  <li><Link href="/" className="hover:text-text-primary transition-colors">Home Feed</Link></li>
                  <li><Link href="/movies" className="hover:text-text-primary transition-colors">Movies Catalog</Link></li>
                  <li><Link href="/tv" className="hover:text-text-primary transition-colors">TV Shows</Link></li>
                  <li><Link href="/anime" className="hover:text-text-primary transition-colors">Anime Streams</Link></li>
                </ul>
              </div>

              {/* Collections */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-widest text-text-primary">Collections</h4>
                <ul className="space-y-2 text-sm text-text-muted">
                  <li><Link href="/movies#trending-now" className="hover:text-text-primary transition-colors">Trending Now</Link></li>
                  <li><Link href="/movies#bollywood-movies" className="hover:text-text-primary transition-colors">Bollywood Hits</Link></li>
                  <li><Link href="/tv#korean-dramas" className="hover:text-text-primary transition-colors">Korean Dramas</Link></li>
                  <li><Link href="/anime#popular-anime" className="hover:text-text-primary transition-colors">Popular Anime</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-widest text-text-primary">Legal</h4>
                <ul className="space-y-2 text-sm text-text-muted">
                  <li><a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-text-primary transition-colors">DMCA Notice</a></li>
                  <li><a href="#" className="hover:text-text-primary transition-colors">Cookie Choices</a></li>
                </ul>
              </div>

              {/* Providers */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-widest text-text-primary">Metadata APIs</h4>
                <ul className="space-y-2 text-sm text-text-muted">
                  <li><a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">The Movie DB</a></li>
                  <li><a href="https://jikan.moe" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">Jikan MAL</a></li>
                  <li><a href="https://tvmaze.com" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">TVMaze</a></li>
                  <li><a href="#" className="hover:text-text-primary transition-colors">System Status</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-text-primary flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-bg-card" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </div>
                <span className="font-semibold text-text-primary">AloneTV.</span>
                <span>© {new Date().getFullYear()} all rights reserved.</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="font-mono text-[10px] bg-bg-secondary px-2 py-0.5 border border-border rounded text-text-muted">
                  CDN STATUS: OPERATIONAL
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}