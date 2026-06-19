import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AloneTV Premium OTT Platform',
    short_name: 'AloneTV',
    description: 'Stream unlimited movies, TV shows, web series, and anime in stunning 4K quality.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a051b',
    theme_color: '#9333ea',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
