// IPTV API Client
import { IPTVChannel, IPTVChannelGroup } from '@/types/iptv';

const CHANNELS_URL = 'https://iptv-org.github.io/api/channels.json';

interface RawIPTVChannel {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string[];
  country: string[];
  language: string[];
  website?: string;
}

// Cache for IPTV data
let cachedChannels: IPTVChannel[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour

async function fetchIPTVChannels(): Promise<IPTVChannel[]> {
  // Return cached data if valid
  if (cachedChannels && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedChannels;
  }

  try {
    // Don't use Next.js fetch caching for large external data
    const res = await fetch(CHANNELS_URL, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`IPTV API Error: ${res.status}`);
    }

    const rawChannels: RawIPTVChannel[] = await res.json();

    // Transform and validate channels
    const channels: IPTVChannel[] = rawChannels
      .filter((ch) => ch.url && ch.url.includes('.m3u8')) // Only M3U8 streams
      .map((ch) => ({
        id: ch.id,
        name: ch.name,
        logo: ch.logo || null,
        url: ch.url,
        category: ch.category[0] || 'General',
        country: ch.country,
        language: ch.language,
        website: ch.website || null,
        status: 'unknown' as const,
      }));

    // Filter out problematic streams (test basic URL validity)
    const validChannels = channels.filter((ch) => {
      try {
        new URL(ch.url);
        return true;
      } catch {
        return false;
      }
    });

    cachedChannels = validChannels;
    cacheTimestamp = Date.now();
    return validChannels;
  } catch (error) {
    console.error('Failed to fetch IPTV channels:', error);
    return cachedChannels || [];
  }
}

// Get all channels
export async function getAllChannels(): Promise<IPTVChannel[]> {
  return fetchIPTVChannels();
}

// Get channels grouped by category
export async function getChannelsByCategory(): Promise<IPTVChannelGroup[]> {
  const channels = await fetchIPTVChannels();

  const groups: Record<string, IPTVChannel[]> = {};

  channels.forEach((ch) => {
    if (!groups[ch.category]) {
      groups[ch.category] = [];
    }
    groups[ch.category].push(ch);
  });

  return Object.entries(groups)
    .map(([category, channels]) => ({
      category,
      channels,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

// Get featured channels (limit for display)
export async function getFeaturedChannels(limit = 12): Promise<IPTVChannel[]> {
  const channels = await fetchIPTVChannels();
  // Sort by name for consistent featured selection
  return channels
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}

// Search channels
export async function searchChannels(query: string): Promise<IPTVChannel[]> {
  const channels = await fetchIPTVChannels();
  const searchLower = query.toLowerCase();

  return channels.filter(
    (ch) =>
      ch.name.toLowerCase().includes(searchLower) ||
      ch.category.toLowerCase().includes(searchLower)
  );
}

// Get channels by country
export async function getChannelsByCountry(
  country: string
): Promise<IPTVChannel[]> {
  const channels = await fetchIPTVChannels();
  return channels.filter((ch) => ch.country.includes(country));
}