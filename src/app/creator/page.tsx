'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getLiveStreams, getRecentVideos, getYouTubeEmbedUrl } from '@/lib/api/youtube';
import type { YouTubeStream } from '@/lib/api/youtube';
import VideoPlayer from '@/components/player/VideoPlayer';

export default function CreatorPage() {
  const [liveStreams, setLiveStreams] = useState<YouTubeStream[]>([]);
  const [recentVideos, setRecentVideos] = useState<YouTubeStream[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const videoId = searchParams.get('video');
    if (videoId) {
      setSelectedVideo(videoId);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [live, recent] = await Promise.all([
          getLiveStreams(),
          getRecentVideos(),
        ]);
        setLiveStreams(live);
        setRecentVideos(recent);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen pt-[72px]">
      {/* Header */}
      <div className="bg-gradient-to-b from-bg-secondary to-transparent py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
              V
            </div>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-white"
              >
                VinayVerse
              </motion.h1>
              <p className="text-gray-400">Gaming & Entertainment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      {selectedVideo && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
            <iframe
              src={getYouTubeEmbedUrl(selectedVideo, true)}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <button
            onClick={() => setSelectedVideo(null)}
            className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Close Player
          </button>
        </div>
      )}

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Live Now */}
        {liveStreams.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <h2 className="text-xl font-semibold text-white">Live Now</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {liveStreams.map((stream) => (
                <motion.div
                  key={stream.videoId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button
                    onClick={() => setSelectedVideo(stream.videoId)}
                    className="group w-full text-left bg-bg-card rounded-xl overflow-hidden hover:bg-white/5 transition-colors"
                  >
                    <div className="relative aspect-video bg-bg-secondary">
                      {stream.thumbnailUrl && (
                        <Image
                          src={stream.thumbnailUrl}
                          alt={stream.title}
                          fill
                          className="object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-white line-clamp-2">{stream.title}</h3>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Videos */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-6">Recent Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentVideos.map((video, index) => (
              <motion.div
                key={video.videoId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <button
                  onClick={() => setSelectedVideo(video.videoId)}
                  className="group w-full text-left bg-bg-card rounded-xl overflow-hidden hover:bg-white/5 transition-colors"
                >
                  <div className="relative aspect-video bg-bg-secondary">
                    {video.thumbnailUrl && (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
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
                </button>
              </motion.div>
            ))}
          </div>

          {recentVideos.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              No videos available yet. Check back soon!
            </div>
          )}
        </section>
      </div>
    </div>
  );
}