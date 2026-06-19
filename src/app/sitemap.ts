import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://vinaytv.vercel.app';

  const staticUrls = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/movies`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/tv`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/web-series`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/anime`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/payment`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  let mediaUrls: { url: string; lastModified: Date; changeFrequency: 'weekly'; priority: number }[] = [];
  try {
    const { getHomePageModel } = await import('@/lib/ott-collections');
    const homeModel = await getHomePageModel();
    if (homeModel && homeModel.sections) {
      homeModel.sections.forEach((section) => {
        if (section.items) {
          section.items.forEach((item) => {
            const mediaType = item.type === 'anime' ? 'anime' : (item.type || 'movie');
            const mediaId = item.id;
            mediaUrls.push({
              url: `${baseUrl}/watch/${mediaType}/${mediaId}`,
              lastModified: new Date(),
              changeFrequency: 'weekly' as const,
              priority: 0.7,
            });
          });
        }
      });
    }
  } catch (err) {
    console.error('Failed to generate sitemap URLs for media catalog:', err);
  }

  // Deduplicate URLs to avoid crawler warning logs
  const uniqueUrlsMap = new Map();
  [...staticUrls, ...mediaUrls].forEach((item) => {
    uniqueUrlsMap.set(item.url, item);
  });

  return Array.from(uniqueUrlsMap.values());
}
