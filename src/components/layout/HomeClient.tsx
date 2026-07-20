'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LocalHistoryRails from '@/components/content/LocalHistoryRails';
import CollectionRail from '@/components/content/CollectionRail';
import type { PremiumCollectionSection } from '@/lib/ott-collections';

gsap.registerPlugin(ScrollTrigger);

interface HomeClientProps {
  sections: PremiumCollectionSection[];
}

interface Mood {
  id: string;
  name: string;
  genres: string;
  description: string;
  gradient: string;
  borderColor: string;
  icon: string;
}

interface CalendarItem {
  id: string;
  showId: string | number;
  type: string;
  showName: string;
  episodeName: string;
  season: number;
  episodeNumber: number;
  airtime: string;
  network: string;
  posterUrl: string | null;
  rating: number;
  weight: number;
  imdbId: string | null;
  summary: string;
}

const MOODS: Mood[] = [
  { id: 'spooky', name: 'Spooky Vibes', genres: 'horror,mystery', description: 'Dark, creepy, and thrilling supernatural tales.', gradient: 'from-indigo-950/40 via-purple-950/30', borderColor: 'border-purple-600/30 hover:border-purple-500/80', icon: '👻' },
  { id: 'adrenaline', name: 'Adrenaline Rush', genres: 'action,thriller', description: 'Fast-paced, action-packed high-octane blockbusters.', gradient: 'from-red-950/40 via-rose-950/30', borderColor: 'border-rose-600/30 hover:border-rose-500/80', icon: '⚡' },
  { id: 'laughter', name: 'Laughter Therapy', genres: 'comedy', description: 'Lighthearted, witty comedy and sitcom specials.', gradient: 'from-yellow-950/20 via-amber-950/20', borderColor: 'border-amber-600/30 hover:border-amber-500/80', icon: '😂' },
  { id: 'romance', name: 'Hopeless Romantic', genres: 'romance', description: 'Charming love stories, dramas, and romantic getaways.', gradient: 'from-pink-950/30 via-rose-950/20', borderColor: 'border-pink-600/30 hover:border-pink-500/80', icon: '💖' },
  { id: 'mindbending', name: 'Mind-Bending', genres: 'science fiction,mystery', description: 'Mind-bending sci-fi, time loops, and cryptic plots.', gradient: 'from-violet-950/40 via-fuchsia-950/30', borderColor: 'border-fuchsia-600/30 hover:border-fuchsia-500/80', icon: '🔮' },
  { id: 'cozy', name: 'Cozy Anime', genres: 'animation,fantasy', description: 'Wholesome fantasy anime and animated favorites.', gradient: 'from-emerald-950/30 via-teal-950/20', borderColor: 'border-teal-600/30 hover:border-teal-500/80', icon: '✨' },
];

export default function HomeClient({ sections }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<'featured' | 'mood' | 'calendar'>('featured');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [moodRecommendations, setMoodRecommendations] = useState<any[]>([]);
  const [loadingMood, setLoadingMood] = useState(false);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);

  const handleMoodSelect = async (mood: Mood) => {
    setSelectedMood(mood);
    setLoadingMood(true);
    try {
      const res = await fetch(`/api/recommendations?genres=${encodeURIComponent(mood.genres)}`);
      if (res.ok) {
        const data = await res.json();
        setMoodRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMood(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'calendar' && calendarItems.length === 0) {
      const fetchCalendar = async () => {
        setLoadingCalendar(true);
        try {
          const res = await fetch('/api/calendar');
          if (res.ok) {
            const data = await res.json();
            setCalendarItems(data.schedule || []);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingCalendar(false);
        }
      };
      fetchCalendar();
    }
  }, [activeTab, calendarItems.length]);

  return (
    <div className="w-full">
      {/* Tab Switcher */}
      <div ref={tabRef} className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mb-8 mt-4">
        <div className="flex border-b border-white/[0.06] pb-px gap-6">
          {(['featured', 'mood', 'calendar'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 relative transition-colors text-sm font-medium ${
                activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'featured' ? 'Featured' : tab === 'mood' ? 'Mood Discovery' : 'Release Calendar'}
              {activeTab === tab && (
                <motion.div
                  layoutId="tabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'featured' && (
          <motion.div
            key="featured"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <LocalHistoryRails />
            {sections.map((section) => (
              <CollectionRail key={section.id} section={section} />
            ))}
          </motion.div>
        )}

        {activeTab === 'mood' && (
          <motion.div
            key="mood"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">How are you feeling today?</h2>
            <p className="text-sm text-zinc-400 mb-6">Select a mood to discover tailored recommendations.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood)}
                  className={`flex flex-col text-left p-4 rounded-xl border bg-gradient-to-br transition-all duration-300 hover:scale-[1.02] ${
                    mood.gradient
                  } ${mood.borderColor} ${
                    selectedMood?.id === mood.id ? 'ring-2 ring-purple-500 border-purple-500/50' : 'border-white/[0.06]'
                  }`}
                >
                  <span className="text-2xl mb-3">{mood.icon}</span>
                  <span className="font-semibold text-sm text-white mb-1">{mood.name}</span>
                  <span className="text-xs text-zinc-500 line-clamp-2">{mood.description}</span>
                </button>
              ))}
            </div>

            {selectedMood && (
              <div className="border-t border-white/[0.06] pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{selectedMood.icon}</span>
                  <h3 className="text-lg font-bold text-white">{selectedMood.name} Recommendations</h3>
                  {loadingMood && <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}
                </div>

                {loadingMood ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-900 animate-pulse border border-white/[0.06]" />
                    ))}
                  </div>
                ) : moodRecommendations.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {moodRecommendations.map((item, index) => (
                      <motion.div
                        key={`${item.type}-${item.id}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.02 }}
                        className="group bg-zinc-900/50 rounded-xl border border-white/[0.06] p-2 hover:border-white/20 transition-all"
                      >
                        <Link href={item.href} className="block">
                          <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-zinc-800">
                            {item.posterUrl ? (
                              <Image src={item.posterUrl} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 15vw" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Poster</div>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-zinc-300 truncate group-hover:text-white transition-colors">{item.title}</h4>
                          <p className="text-[10px] text-zinc-600 font-mono mt-0.5 capitalize">{item.genres?.[0]} • {item.year}</p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-12 text-zinc-500 text-sm">No items found matching this vibe. Try another!</p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Today Airing</h2>
            <p className="text-sm text-zinc-400 mb-6">Popular TV series and anime episodes premiering today.</p>

            {loadingCalendar ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-zinc-900 animate-pulse border border-white/[0.06]" />
                ))}
              </div>
            ) : calendarItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {calendarItems.map((item, index) => {
                  const watchUrl = item.type === 'anime' 
                    ? `/detail/anime/${item.showId}` 
                    : `/detail/tv/${item.imdbId || item.showId}`;

                  return (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="group flex gap-3 bg-zinc-900/50 rounded-xl border border-white/[0.06] p-3 hover:border-white/20 hover:bg-zinc-900/80 transition-all"
                    >
                      <div className="relative w-16 h-24 flex-shrink-0 bg-zinc-800 rounded-lg overflow-hidden border border-white/[0.06]">
                        {item.posterUrl ? (
                          <Image src={item.posterUrl} alt={item.showName} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">TV</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 bg-white/5 text-purple-400 rounded-md">
                              {item.network}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">{item.airtime}</span>
                          </div>
                          <h4 className="font-semibold text-zinc-300 text-sm truncate group-hover:text-white transition-colors mb-0.5">{item.showName}</h4>
                          <p className="text-xs text-zinc-500 truncate">S{item.season}E{item.episodeNumber} — {item.episodeName}</p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {item.rating > 0 ? (
                            <span className="text-[11px] font-mono text-yellow-400">★ {item.rating.toFixed(1)}</span>
                          ) : (
                            <span className="text-[11px] font-mono text-zinc-600">No rating</span>
                          )}
                          <Link href={watchUrl} className="text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-purple-500 px-3 py-1.5 rounded-lg transition-all">
                            Watch
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-12 text-zinc-500 text-sm">No schedule information available for today.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
