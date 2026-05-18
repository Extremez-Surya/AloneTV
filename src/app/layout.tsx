import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CineVibez - Free 4K Movies, TV Shows & Anime Streaming",
    template: "%s | CineVibez",
  },
  description:
    "Stream unlimited movies, TV shows, anime, and live TV in stunning 4K quality. Your premium entertainment destination.",
  keywords: [
    "streaming",
    "movies",
    "TV shows",
    "anime",
    "live TV",
    "4K",
    "free streaming",
  ],
  openGraph: {
    title: "CineVibez - Free 4K Streaming Platform",
    description: "Stream unlimited movies, TV shows, anime & live TV in stunning 4K quality.",
    type: "website",
    locale: "en_US",
    siteName: "CineVibez",
  },
  twitter: {
    card: "summary_large_image",
    title: "CineVibez - Free 4K Streaming Platform",
    description: "Stream unlimited movies, TV shows, anime & live TV in stunning 4K quality.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/5 py-8">
          <div className="max-w-350 mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent-purple to-accent-teal flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-400">
                  CineVibez {new Date().getFullYear()}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}