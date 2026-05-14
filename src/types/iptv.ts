// IPTV Channel Types

export interface IPTVChannel {
  id: string;
  name: string;
  logo: string | null;
  url: string;
  category: string;
  country: string[];
  language: string[];
  website: string | null;
  status: 'online' | 'offline' | 'unknown';
}

export interface IPTVChannelGroup {
  category: string;
  channels: IPTVChannel[];
}

export interface IPTVAPIResponse {
  channels: IPTVChannel[];
  categories: string[];
}