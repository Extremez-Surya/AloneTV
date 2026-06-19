import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Control Center | AloneTV',
  description: 'Administrative portal for AloneTV database syncs, settings configurations, and plan logs.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://vinaytv.vercel.app/admin',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
