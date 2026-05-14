'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getRecentVideos } from '@/lib/api/youtube';

export default function CreatorCorner() {
  const [videos, setVideos] = useState<Awaited<ReturnType<typeof getRecentVideos>>>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getRecentVideos(undefined, 6);
        setVideos(data);
      } catch (error) {
        console.error('Failed to fetch creator videos:', error);
      }
    }
    fetchData();
  }, []);

  return (
    <section className="py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">Creator Corner</h2>
            <span className="px-2 py-0.5 text-xs font-medium bg-red-600 text-white rounded-full animate-pulse-live">
              LIVE
            </span>
          </div>
          <Link
            href="/creator"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            View Channel
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-6">
        {videos.length > 0 ? (
          videos.map((video, index) => (
            <motion.div
              key={video.videoId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                href={`/creator?video=${video.videoId}`}
                className="group block bg-bg-card rounded-xl overflow-hidden hover:bg-white/5 transition-colors"
              >
                <div className="relative aspect-video bg-bg-secondary">
                  {video.thumbnailUrl && (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                  {video.isLive && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      LIVE
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-accent-purple transition-colors">
                    {video.title}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-400">
            No videos available. Check back soon!
          </div>
        )}
      </div>
    </section>
  );
}