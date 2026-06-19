import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscribe to Premium Plans | AloneTV',
  description: 'Upgrade your AloneTV experience to premium. Unlock free 4K UHD streaming, multiple audio tracks, offline downloads, and zero ads.',
  alternates: {
    canonical: 'https://alonetv.com/payment',
  },
  openGraph: {
    title: 'Subscribe to Premium Plans | AloneTV',
    description: 'Upgrade your AloneTV experience to premium. Unlock free 4K UHD streaming, multiple audio tracks, offline downloads, and zero ads.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Subscribe to Premium Plans | AloneTV',
    description: 'Upgrade your AloneTV experience to premium. Unlock free 4K UHD streaming, multiple audio tracks, offline downloads, and zero ads.',
  },
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
