'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const mockWatchlist = [
  {
    id: 1,
    title: 'Inception',
    poster: 'https://image.tmdb.org/t/p/w342/ljsZTzVsr21OXuHLZb6A3M0FPwo.jpg',
    year: '2010',
    type: 'movie',
  },
  {
    id: 2,
    title: 'Breaking Bad',
    poster: 'https://image.tmdb.org/t/p/w342/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    year: '2008',
    type: 'tv',
  },
  {
    id: 3,
    title: 'Attack on Titan',
    poster: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
    year: '2013',
    type: 'anime',
  },
];

const mockContinueWatching = [
  {
    id: 4,
    title: 'Dune',
    poster: 'https://image.tmdb.org/t/p/w342/d5NXAEkYrJcD7PNKdM8dV88B1A.jpg',
    progress: 45,
    type: 'movie',
  },
  {
    id: 5,
    title: 'Stranger Things',
    poster: 'https://image.tmdb.org/t/p/w342/49WJfeN0moxb9UKfJ6n2MuZ1k1k.jpg',
    progress: 72,
    type: 'tv',
  },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'history' | 'settings'>('watchlist');

  return (
    <div className="min-h-screen pt-[72px]">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-bg-secondary to-transparent py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-purple to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
              V
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vinay Kumar</h1>
              <p className="text-gray-400">Member since 2024</p>
              <p className="text-sm text-gray-500 mt-2">3 items in watchlist</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex gap-6">
            {(['watchlist', 'history', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-medium capitalize transition-colors relative ${
                  activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-purple"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'watchlist' && (
          <div>
            {/* Continue Watching */}
            {mockContinueWatching.length > 0 && (
              <section className="mb-12">
                <h2 className="text-lg font-semibold text-white mb-4">Continue Watching</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {mockContinueWatching.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-[200px]">
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-bg-card group">
                        <Image
                          src={item.poster}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                          <div
                            className="h-full bg-accent-purple"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                      <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Watchlist Grid */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">My Watchlist</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {mockWatchlist.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group"
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-bg-card">
                      <Image
                        src={item.poster}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <button className="w-full py-2 bg-accent-purple text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          Play
                        </button>
                      </div>
                      <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.year}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No watch history yet</p>
            <p className="text-sm mt-2">Start watching to build your history</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-lg">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Display Name</h3>
                <input
                  type="text"
                  defaultValue="Vinay Kumar"
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-purple"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Email</h3>
                <input
                  type="email"
                  defaultValue="vinay@example.com"
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-purple"
                />
              </div>
              <button className="w-full py-3 bg-accent-purple text-white font-semibold rounded-xl hover:bg-accent-purple/90 transition-colors">
                Save Changes
              </button>
              <button className="w-full py-3 bg-red-600/20 text-red-400 font-semibold rounded-xl hover:bg-red-600/30 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}