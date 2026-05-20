import LiveTVExplorer from '@/components/content/LiveTVExplorer';
import { getAllChannels, getChannelsByCategory, getFeaturedChannels, getLiveTVGuide } from '@/lib/api/iptv';

export const dynamic = 'force-dynamic';

export default async function LiveTVPage() {
  const [channels, groups, featured] = await Promise.all([
    getAllChannels(),
    getChannelsByCategory(),
    getFeaturedChannels(12),
  ]);

  const guide = await getLiveTVGuide(
    [...featured, ...channels]
      .map((channel) => channel.tvgId || channel.xmltvId || channel.id)
      .filter(Boolean) as string[],
    80
  );

  const categories = groups.map((group) => group.category);

  return (
    <LiveTVExplorer
      channels={channels}
      featured={featured}
      categories={categories}
      guide={guide}
    />
  );
}