'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LocalHistoryRails from '@/components/content/LocalHistoryRails';
import CollectionRail from '@/components/content/CollectionRail';
import type { PremiumCollectionSection } from '@/lib/ott-collections';

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
  {
    id: 'spooky',
    name: 'Spooky Vibes',
    genres: 'horror,mystery',
    description: 'Dark, creepy, and thrilling supernatural tales.',
    gradient: 'from-indigo-950/40 via-purple-950/30 to-black/40',
    borderColor: 'border-purple-600/30 hover:border-purple-500/80',
    icon: '👻',
  },
  {
    id: 'adrenaline',
    name: 'Adrenaline Rush',
    genres: 'action,thriller',
    description: 'Fast-paced, action-packed high-octane blockbusters.',
    gradient: 'from-red-950/40 via-rose-950/30 to-black/40',
    borderColor: 'border-rose-600/30 hover:border-rose-500/80',
    icon: '⚡',
  },
  {
    id: 'laughter',
    name: 'Laughter Therapy',
    genres: 'comedy',
    description: 'Lighthearted, witty comedy and sitcom specials.',
    gradient: 'from-yellow-950/20 via-amber-950/20 to-black/40',
    borderColor: 'border-amber-600/30 hover:border-amber-500/80',
    icon: '😂',
  },
  {
    id: 'romance',
    name: 'Hopeless Romantic',
    genres: 'romance',
    description: 'Charming love stories, dramas, and romantic getaways.',
    gradient: 'from-pink-950/30 via-rose-950/20 to-black/40',
    borderColor: 'border-pink-600/30 hover:border-pink-500/80',
    icon: '💖',
  },
  {
    id: 'mindbending',
    name: 'Mind-Bending',
    genres: 'science fiction,mystery',
    description: 'Mind-bending sci-fi, time loops, and cryptic plots.',
    gradient: 'from-violet-950/40 via-fuchsia-950/30 to-black/40',
    borderColor: 'border-fuchsia-600/30 hover:border-fuchsia-500/80',
    icon: '🔮',
  },
  {
    id: 'cozy',
    name: 'Cosy Anime',
    genres: 'animation,fantasy',
    description: 'Wholesome fantasy anime and animated favorites.',
    gradient: 'from-emerald-950/30 via-teal-950/20 to-black/40',
    borderColor: 'border-teal-600/30 hover:border-teal-500/80',
    icon: '✨',
  },
];

export default function HomeClient({ sections }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<'featured' | 'mood' | 'calendar'>('featured');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [moodRecommendations, setMoodRecommendations] = useState<any[]>([]);
  const [loadingMood, setLoadingMood] = useState(false);

  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Fetch Mood recommendations
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

  // Fetch Calendar airing items
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
      {/* Dynamic Tab Switcher */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 mb-8 mt-4">
        <div className="flex border-b border-border/80 pb-px gap-6 font-mono text-sm">
          {(['featured', 'mood', 'calendar'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 relative transition-colors font-medium ${
                activeTab === tab ? 'text-white font-semibold' : 'text-text-muted hover:text-white'
              }`}
            >
              {tab === 'featured' ? 'Featured catalog' : tab === 'mood' ? 'Mood discovery' : 'Release calendar'}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-purple"
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
            key="featured-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Watchlist and History */}
            <LocalHistoryRails />

            {/* Render initial catalog categories */}
            {sections.map((section) => (
              <CollectionRail key={section.id} section={section} />
            ))}
          </motion.div>
        )}

        {activeTab === 'mood' && (
          <motion.div
            key="mood-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-[1400px] px-4 sm:px-6"
          >
            {/* Mood selector grid */}
            <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.6px] text-text-primary mb-2">How are you feeling today?</h2>
            <p className="text-sm text-text-muted mb-6">Select a mood category to discover tailored recommendations instantly.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood)}
                  className={`flex flex-col text-left p-5 rounded-2xl border bg-gradient-to-br transition-all duration-300 transform hover:scale-[1.02] shadow-level-2 ${mood.gradient} ${mood.borderColor} ${
                    selectedMood?.id === mood.id ? 'ring-2 ring-accent-purple border-accent-purple/50' : ''
                  }`}
                >
                  <span className="text-3xl mb-4">{mood.icon}</span>
                  <span className="font-semibold text-sm text-text-primary mb-1">{mood.name}</span>
                  <span className="text-xs text-text-muted line-clamp-2 leading-relaxed">{mood.description}</span>
                </button>
              ))}
            </div>

            {/* Mood results display */}
            {selectedMood && (
              <div className="border-t border-border/60 pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{selectedMood.icon}</span>
                  <h3 className="text-lg font-bold text-text-primary">{selectedMood.name} Recommendations</h3>
                  {loadingMood && (
                    <div className="w-4 h-4 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {loadingMood ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-[2/3] rounded-2xl bg-bg-card animate-pulse border border-border" />
                    ))}
                  </div>
                ) : moodRecommendations.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {moodRecommendations.map((item, index) => (
                      <motion.div
                        key={`${item.type}-${item.id}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.02 }}
                        className="group bg-bg-card rounded-2xl border border-border p-3 shadow-level-2 hover:shadow-level-3 transition-all"
                      >
                        <Link href={item.href} className="block">
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-bg-secondary border border-border/40">
                            {item.posterUrl ? (
                              <Image
                                src={item.posterUrl}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, 15vw"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-text-muted text-xs bg-bg-card">No Poster</div>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-purple transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-text-muted font-mono mt-1 capitalize">
                            {item.genres[0]} • {item.year}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-12 text-text-muted font-mono text-sm">No items found matching this vibe. Try another!</p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'calendar' && (
          <motion.div
            key="calendar-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-[1400px] px-4 sm:px-6"
          >
            <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.6px] text-text-primary mb-2">Today's Airing Release Calendar</h2>
            <p className="text-sm text-text-muted mb-6">Popular TV series and anime episodes premiering today globally.</p>

            {loadingCalendar ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-2xl bg-bg-card animate-pulse border border-border" />
                ))}
              </div>
            ) : calendarItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {calendarItems.map((item, index) => {
                  const watchUrl = item.type === 'anime' 
                    ? `/watch/anime/${item.showId}` 
                    : `/watch/tv/${item.imdbId || item.showId}`;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="group flex gap-4 bg-bg-card rounded-2xl border border-border p-4 hover:border-white/20 transition-all shadow-level-2"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative w-20 h-28 flex-shrink-0 bg-bg-secondary rounded-xl overflow-hidden border border-border/40">
                        {item.posterUrl ? (
                          <Image
                            src={item.posterUrl}
                            alt={item.showName}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-bg-card text-[10px] text-text-muted">TV</div>
                        )}
                      </div>

                      {/* Episode Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 bg-white/5 text-accent-purple rounded-md border border-white/5">
                              {item.network}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">
                              🕒 {item.airtime}
                            </span>
                          </div>
                          
                          <h4 className="font-semibold text-text-primary text-sm truncate group-hover:text-accent-purple transition-colors mb-0.5">
                            {item.showName}
                          </h4>
                          
                          <p className="text-xs text-text-muted truncate">
                            S{item.season}E{item.episodeNumber} — {item.episodeName}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {item.rating > 0 ? (
                            <span className="text-[11px] font-mono text-yellow-400">
                              ★ {item.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-text-muted">No rating</span>
                          )}

                          <Link
                            href={watchUrl}
                            className="text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-accent-purple hover:text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                          >
                            Watch episode
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-12 text-text-muted font-mono text-sm">No schedule information available for today.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
