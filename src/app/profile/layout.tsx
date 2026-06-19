import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile & Cine-Decks | AloneTV',
  description: 'Manage your watch history, watchlist, saved custom playlist Cine-Decks, and account settings on AloneTV.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://vinaytv.vercel.app/profile',
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
