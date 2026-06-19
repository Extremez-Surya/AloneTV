import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Movies, TV Shows & Anime | AloneTV',
  description: 'Search and discover unlimited free movies, TV series, web series, and anime in stunning 4K quality on AloneTV.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://alonetv.com/search',
  },
  openGraph: {
    title: 'Search Movies, TV Shows & Anime | AloneTV',
    description: 'Search and discover unlimited free movies, TV series, web series, and anime in stunning 4K quality.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Search Movies, TV Shows & Anime | AloneTV',
    description: 'Search and discover unlimited free movies, TV series, web series, and anime in stunning 4K quality.',
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
