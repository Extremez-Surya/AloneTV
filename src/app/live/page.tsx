'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getAllChannels, searchChannels } from '@/lib/api/iptv';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import VideoPlayer from '@/components/player/VideoPlayer';
import type { IPTVChannel } from '@/types/iptv';

export default function LiveTVPage() {
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<IPTVChannel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getAllChannels();
        setChannels(data);

        const uniqueCategories = ['All', ...new Set(data.map((ch) => ch.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredChannels = channels.filter((ch) => {
    const matchesCategory = selectedCategory === 'All' || ch.category === selectedCategory;
    const matchesSearch = !searchQuery || ch.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pt-[72px]">
      {/* Header */}
      <div className="bg-gradient-to-b from-bg-secondary to-transparent py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white mb-6"
          >
            Live TV
          </motion.h1>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels..."
                className="w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.slice(0, 10).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-accent-purple text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Video Player */}
        {selectedChannel && (
          <div className="mb-8">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <VideoPlayer src={selectedChannel.url} title={selectedChannel.name} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedChannel.logo && (
                  <Image
                    src={selectedChannel.logo}
                    alt={selectedChannel.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedChannel.name}</h2>
                  <p className="text-gray-400">{selectedChannel.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChannel(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Close Player
              </button>
            </div>
          </div>
        )}

        {/* Channels Grid */}
        {loading ? (
          <SkeletonLoader count={12} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredChannels.map((channel, index) => (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.02 }}
              >
                <button
                  onClick={() => setSelectedChannel(channel)}
                  className="group w-full text-left bg-bg-card rounded-xl p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="relative w-12 h-12 mb-3">
                    {channel.logo ? (
                      <Image
                        src={channel.logo}
                        alt={channel.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-accent-purple/20 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-accent-purple">
                          {channel.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-white truncate group-hover:text-accent-purple transition-colors">
                    {channel.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">{channel.category}</p>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {filteredChannels.length === 0 && !loading && (
          <div className="py-12 text-center text-gray-400">
            No channels found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}