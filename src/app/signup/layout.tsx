import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an Account | AloneTV',
  description: 'Sign up for AloneTV to stream movies, TV shows, and anime. Start building custom playlist Cine-Decks for free.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://vinaytv.vercel.app/signup',
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
