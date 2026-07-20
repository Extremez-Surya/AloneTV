'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import SearchBar from './SearchBar';
import { createClient } from '@/lib/supabase/client';
import { getLocalProfile, syncUserProfile } from '@/lib/supabase/profile';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'TV Shows' },
  { href: '/web-series', label: 'Web Series' },
  { href: '/anime', label: 'Anime' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navbarRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    const profile = getLocalProfile();
    if (profile) {
      setIsLoggedIn(true);
      setIsPremium(Boolean(profile.is_premium));
      setIsAdmin(Boolean(profile.is_admin) || profile.email === 'theextremez2.0@gmail.com');
    }

    syncUserProfile().then((p) => {
      if (p) {
        setIsLoggedIn(true);
        setIsPremium(Boolean(p.is_premium));
        setIsAdmin(Boolean(p.is_admin) || p.email === 'theextremez2.0@gmail.com');
      }
    });

    try { setAvatarUrl(localStorage.getItem('alonetv_avatar')); } catch {}

    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleAvatarSync = () => {
      try { setAvatarUrl(localStorage.getItem('alonetv_avatar')); } catch {}
    };
    const handleUserSync = () => {
      const p = getLocalProfile();
      if (p) { setIsLoggedIn(true); setIsPremium(Boolean(p.is_premium)); setIsAdmin(Boolean(p.is_admin)); }
      else { setIsLoggedIn(false); setIsPremium(false); setIsAdmin(false); }
    };
    window.addEventListener('alonetv_avatar_changed', handleAvatarSync);
    window.addEventListener('alonetv_user_changed', handleUserSync);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('alonetv_avatar_changed', handleAvatarSync);
      window.removeEventListener('alonetv_user_changed', handleUserSync);
    };
  }, []);

  useEffect(() => {
    if (navbarRef.current) {
      gsap.to(navbarRef.current, {
        y: isVisible ? 0 : -100,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [isVisible]);

  return (
    <>
      <nav
        ref={navbarRef}
        className="fixed top-0 left-0 right-0 z-50 h-[var(--navbar-height)]"
      >
        <div className={`h-full transition-all duration-500 ${
          isScrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg'
            : 'bg-transparent'
        }`}>
          <div className="max-w-[1400px] mx-auto h-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-full">
              <Link href="/" className="flex items-center gap-3 group shrink-0">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </motion.div>
                <span className="text-lg font-bold tracking-tight text-white">
                  Vinay<span className="text-purple-400">TV</span>
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <SearchBar />

                {!isLoggedIn && (
                  <div className="hidden sm:flex items-center gap-2">
                    <Link
                      href="/signin"
                      className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signin"
                      className="px-4 py-2 text-sm font-semibold text-black bg-white hover:bg-zinc-200 rounded-lg transition-all hover:scale-105 active:scale-95"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}

                {isLoggedIn && isPremium && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/20"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-glow-pulse" />
                    Premium
                  </motion.span>
                )}

                {isLoggedIn && isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all"
                  >
                    Admin
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white/10 text-white font-semibold text-xs border border-white/10 hover:border-white/30 transition-all hover:scale-105"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </Link>

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                  className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/[0.06]"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
                {isLoggedIn ? (
                  <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-2">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full py-3 text-center text-xs font-bold uppercase tracking-wider rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full py-3 text-center text-xs font-bold uppercase tracking-wider rounded-xl bg-white/5 border border-white/10 text-white"
                    >
                      Profile
                    </Link>
                  </div>
                ) : (
                  <div className="pt-3 mt-3 border-t border-white/[0.06] flex gap-2">
                    <Link
                      href="/signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 py-3 text-center text-sm font-semibold rounded-xl bg-white/5 border border-white/10 text-white"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 py-3 text-center text-sm font-semibold rounded-xl bg-white text-black"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
