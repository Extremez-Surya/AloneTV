'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import VideoPlayer from '@/components/player/VideoPlayer';
import type { IPTVChannel, IPTVGuideEntry } from '@/types/iptv';

interface LiveTVExplorerProps {
  channels: IPTVChannel[];
  featured: IPTVChannel[];
  categories: string[];
  guide: IPTVGuideEntry[];
}

function formatGuideTime(value: string) {
  const date = new Date(value.replace(/\s+/g, 'T'));
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function LiveTVExplorer({ channels, featured, categories, guide }: LiveTVExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedChannelId, setSelectedChannelId] = useState(featured[0]?.id ?? channels[0]?.id ?? '');

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? featured[0] ?? channels[0] ?? null;

  const filteredChannels = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();

    return channels.filter((channel) => {
      const matchesCategory = selectedCategory === 'All' || channel.category === selectedCategory;
      const matchesSearch =
        needle.length === 0 ||
        channel.name.toLowerCase().includes(needle) ||
        channel.category.toLowerCase().includes(needle) ||
        channel.country.some((country) => country.toLowerCase().includes(needle));

      return matchesCategory && matchesSearch;
    });
  }, [channels, searchQuery, selectedCategory]);

  const selectedGuide = useMemo(() => {
    if (!selectedChannel) {
      return [];
    }

    const channelIds = [selectedChannel.tvgId, selectedChannel.xmltvId, selectedChannel.id]
      .filter(Boolean)
      .map(String);

    return guide.filter((entry) => channelIds.includes(entry.channelId));
  }, [guide, selectedChannel]);

  return (
    <div className="min-h-screen pt-18">
      <div className="bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_34%),linear-gradient(180deg,rgba(10,10,14,0.98),rgba(10,10,14,0.9))] py-10">
        <div className="mx-auto flex max-w-350 flex-col gap-8 px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                Legal live TV stack
              </p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                Free public channels, one player, and a guide-ready experience.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                Built around public IPTV playlists, channel categories, and optional XMLTV guide data. The app keeps unstable sources out of the UI and gives you a clean way to browse, search, and play legal free streams.
              </p>
            </div>

            <div className="grid gap-4 rounded-4xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">Channels</p>
                <p className="mt-2 text-2xl font-black text-white">{channels.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">Categories</p>
                <p className="mt-2 text-2xl font-black text-white">{categories.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">Guide</p>
                <p className="mt-2 text-2xl font-black text-white">{guide.length > 0 ? 'On' : 'Optional'}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {['All', ...categories].slice(0, 16).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'border-accent-purple bg-accent-purple text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-350 px-4 py-8 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            {selectedChannel ? (
              <section className="rounded-4xl border border-white/10 bg-white/5 p-4 shadow-[0_30px_120px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/35">Now Playing</p>
                    <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                      {selectedChannel.name}
                    </h2>
                    <p className="mt-1 text-sm text-white/55">
                      {selectedChannel.category} · {selectedChannel.country.join(', ') || 'Global'}
                    </p>
                  </div>
                  <Link
                    href={selectedChannel.website || '/live'}
                    target={selectedChannel.website ? '_blank' : undefined}
                    rel={selectedChannel.website ? 'noreferrer' : undefined}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
                  >
                    Open source
                  </Link>
                </div>

                <VideoPlayer src={selectedChannel.url} title={selectedChannel.name} autoplay={false} poster={selectedChannel.logo ?? undefined} />

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
                  {selectedChannel.language.slice(0, 3).map((language) => (
                    <span key={language} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {language}
                    </span>
                  ))}
                  {selectedChannel.tvgId && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      tvg-id: {selectedChannel.tvgId}
                    </span>
                  )}
                </div>
              </section>
            ) : (
              <section className="rounded-4xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-white/50">
                No channel selected.
              </section>
            )}

            <section className="rounded-4xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/35">Guide</p>
                  <h3 className="mt-2 text-lg font-bold text-white">Current and upcoming programs</h3>
                </div>
                <p className="text-xs text-white/45">Uses XMLTV when LIVE_TV_EPG_URL is configured.</p>
              </div>

              {selectedGuide.length > 0 ? (
                <div className="space-y-3">
                  {selectedGuide.slice(0, 6).map((item) => (
                    <div key={`${item.channelId}-${item.start}`} className="flex gap-4 rounded-2xl border border-white/8 bg-black/20 p-4">
                      <div className="min-w-20 text-xs uppercase tracking-[0.2em] text-white/35">
                        {formatGuideTime(item.start)}
                        <span className="mx-1 text-white/20">-</span>
                        {formatGuideTime(item.stop)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{item.title}</p>
                        {item.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/55">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/55">
                  Guide data is optional. Set <span className="font-semibold text-white">LIVE_TV_EPG_URL</span> to an XMLTV source such as iptv-org EPG or another legal guide feed and the schedule panel will populate automatically.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-4xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/35">Search</p>
                  <h3 className="mt-2 text-lg font-bold text-white">Find a channel</h3>
                </div>
                <span className="text-xs text-white/35">Public streams only</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search news, sports, anime, kids..."
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent-purple focus:outline-none"
                />
              </div>

              <div className="mt-4 grid gap-2">
                {featured.slice(0, 5).map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                      selectedChannelId === channel.id
                        ? 'border-accent-purple bg-accent-purple/15'
                        : 'border-white/10 bg-black/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5">
                      {channel.logo ? (
                        <Image src={channel.logo} alt={channel.name} width={40} height={40} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-sm font-bold text-white/70">{channel.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{channel.name}</p>
                      <p className="truncate text-xs text-white/45">{channel.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-4xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/35">Directory</p>
                  <h3 className="mt-2 text-lg font-bold text-white">Filtered channels</h3>
                </div>
                <span className="text-xs text-white/35">{filteredChannels.length}</span>
              </div>

              <div className="max-h-144 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
                {filteredChannels.slice(0, 48).map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                      selectedChannelId === channel.id
                        ? 'border-accent-teal bg-accent-teal/10'
                        : 'border-white/10 bg-black/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5">
                      {channel.logo ? (
                        <Image src={channel.logo} alt={channel.name} width={40} height={40} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-sm font-bold text-white/70">{channel.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{channel.name}</p>
                      <p className="truncate text-xs text-white/45">
                        {channel.category} · {channel.country.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}