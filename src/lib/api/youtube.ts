// YouTube API Client

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: string;
  liveBroadcastContent: 'live' | 'none' | 'upcoming';
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: { url: string };
      high: { url: string };
    };
    publishedAt: string;
    liveBroadcastContent: 'live' | 'none' | 'upcoming';
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
}

export interface YouTubeStream {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  isLive: boolean;
  viewCount?: string;
}

// Default channel ID (VinayVerse)
const DEFAULT_CHANNEL_ID = 'UCvinFKzRnoswAjRBBEBqvJA'; // Placeholder

export async function getChannelId(channelHandle: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    console.warn('YOUTUBE_API_KEY is not configured');
    return null;
  }

  try {
    const res = await fetch(
      `${YOUTUBE_BASE_URL}/channels?part=id&forHandle=${channelHandle}&key=${apiKey}`
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.items?.[0]?.id || null;
  } catch {
    return null;
  }
}

export async function getLiveStreams(channelId?: string): Promise<YouTubeStream[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const targetChannelId = channelId || DEFAULT_CHANNEL_ID;

  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    console.warn('YOUTUBE_API_KEY is not configured. Returning mock data.');
    return [];
  }

  try {
    const res = await fetch(
      `${YOUTUBE_BASE_URL}/search?part=snippet&channelId=${targetChannelId}&eventType=live&type=video&key=${apiKey}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      throw new Error(`YouTube API Error: ${res.status}`);
    }

    const data: YouTubeSearchResponse = await res.json();

    return data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      publishedAt: item.snippet.publishedAt,
      isLive: true,
    }));
  } catch (error) {
    console.error('Failed to fetch live streams:', error);
    return [];
  }
}

export async function getRecentVideos(
  channelId?: string,
  maxResults = 10
): Promise<YouTubeStream[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const targetChannelId = channelId || DEFAULT_CHANNEL_ID;

  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    return [];
  }

  try {
    const res = await fetch(
      `${YOUTUBE_BASE_URL}/search?part=snippet&channelId=${targetChannelId}&type=video&order=date&maxResults=${maxResults}&key=${apiKey}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      throw new Error(`YouTube API Error: ${res.status}`);
    }

    const data: YouTubeSearchResponse = await res.json();

    return data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      publishedAt: item.snippet.publishedAt,
      isLive: item.snippet.liveBroadcastContent === 'live',
    }));
  } catch (error) {
    console.error('Failed to fetch recent videos:', error);
    return [];
  }
}

export function getYouTubeEmbedUrl(videoId: string, autoplay = false): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0`;
}

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}