import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Your Account | AloneTV',
  description: 'Log in to your AloneTV streaming account to resume watching, access your watchlist, and view premium benefits.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://vinaytv.vercel.app/signin',
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
