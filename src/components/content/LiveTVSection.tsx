import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getFeaturedChannels } from '@/lib/api/iptv';
import type { IPTVChannel } from '@/types/iptv';

export const dynamic = 'force-dynamic';

export default async function LiveTVSection() {
  let channels: IPTVChannel[] = [];
  try {
    channels = await getFeaturedChannels(8);
  } catch (error) {
    console.error('Failed to fetch live TV channels:', error);
  }

  return (
    <section className="py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 8.5l6-4 5.5 3.5v6L11 14v-4.5l-5.5 3.5V8.5z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">Live TV</h2>
          </div>
          <Link
            href="/live"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4 sm:px-6">
        {channels.map((channel, index) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <Link
              href={`/live?channel=${channel.id}`}
              className="group block bg-bg-card rounded-xl p-4 hover:bg-white/5 transition-colors"
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
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}