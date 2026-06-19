import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/profile', '/api', '/settings', '/search'],
    },
    sitemap: 'https://vinaytv.vercel.app/sitemap.xml',
  };
}
