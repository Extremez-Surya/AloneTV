import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import Shared Cine-Deck Playlists | AloneTV',
  description: 'View and save custom shared movie and anime playlist Cine-Decks on AloneTV. Build your own collection of free 4K streams.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://vinaytv.vercel.app/playlist',
  },
  openGraph: {
    title: 'Shared Cine-Deck Playlists | AloneTV',
    description: 'View and save custom shared movie and anime playlist Cine-Decks on AloneTV.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shared Cine-Deck Playlists | AloneTV',
    description: 'View and save custom shared movie and anime playlist Cine-Decks on AloneTV.',
  },
};

export default function PlaylistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
