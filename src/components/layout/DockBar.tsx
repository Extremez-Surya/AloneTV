'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const dockItems = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/movies', icon: '🎬', label: 'Movies' },
  { href: '/tv', icon: '📺', label: 'TV Shows' },
  { href: '/anime', icon: '⭐', label: 'Anime' },
  { href: '/search', icon: '🔍', label: 'Search' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export default function DockBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [activeItem, setActiveItem] = useState('/');
  const lastScrollY = useRef(0);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 200) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    setActiveItem(window.location.pathname);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={dockRef}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden sm:block"
        >
          <div className="flex items-center gap-1 px-2 py-2 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-purple-500/5">
            {dockItems.map((item) => {
              const isActive = activeItem === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setActiveItem(item.href)}
                  className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className={`text-[8px] font-semibold uppercase tracking-widest ${
                    isActive ? 'text-purple-400' : 'text-zinc-600'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="dock-active"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
