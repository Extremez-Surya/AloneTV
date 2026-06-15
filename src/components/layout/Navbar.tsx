'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';
import { 
  getPreferredAudioLanguage, 
  setPreferredAudioLanguage, 
  SUPPORTED_LANGUAGES, 
  type AudioLanguage 
} from '@/lib/audioPreferences';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'TV Shows' },
  { href: '/web-series', label: 'Web Series' },
  { href: '/anime', label: 'Anime' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalLanguage, setGlobalLanguage] = useState<AudioLanguage>('English');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Load initial preferred language
    setGlobalLanguage(getPreferredAudioLanguage());

    // Load initial avatar
    try {
      setAvatarUrl(localStorage.getItem('alonetv_avatar'));
    } catch {
      // ignore
    }

    window.addEventListener('scroll', handleScroll);
    
    // Listen for language changes from elsewhere
    const handleLanguageSync = () => {
      setGlobalLanguage(getPreferredAudioLanguage());
    };
    window.addEventListener('alonetv_language_changed', handleLanguageSync);

    const handleAvatarSync = () => {
      try {
        setAvatarUrl(localStorage.getItem('alonetv_avatar'));
      } catch {
        // ignore
      }
    };
    window.addEventListener('alonetv_avatar_changed', handleAvatarSync);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('alonetv_language_changed', handleLanguageSync);
      window.removeEventListener('alonetv_avatar_changed', handleAvatarSync);
    };
  }, []);

  const handleGlobalLanguageChange = (lang: AudioLanguage) => {
    setPreferredAudioLanguage(lang);
    setGlobalLanguage(lang);
    // Dispatch custom event to notify watch page & player components
    window.dispatchEvent(new Event('alonetv_language_changed'));
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 border-b transition-all duration-200 ${
        isScrolled
          ? 'bg-bg-card/90 backdrop-blur-md border-border shadow-level-1'
          : 'bg-bg-card border-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto h-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-text-primary flex items-center justify-center transition-transform group-hover:scale-95">
              <svg
                className="w-4 h-4 text-bg-card"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-text-primary">
              AloneTV
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm font-medium text-text-muted hover:text-text-primary transition-colors rounded-full hover:bg-bg-secondary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <SearchBar />

            {/* Global Language Selector */}
            <div className="relative">
              <select
                value={globalLanguage}
                onChange={(e) => handleGlobalLanguageChange(e.target.value as AudioLanguage)}
                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border bg-bg-secondary text-text-primary cursor-pointer hover:border-text-muted transition-colors focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Action CTAs */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Link
                href="/signin"
                className="flex items-center justify-center px-3 text-xs font-medium text-text-primary rounded-md h-7 border border-border hover:bg-bg-secondary transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signin"
                className="flex items-center justify-center px-3 text-xs font-semibold text-bg-card bg-text-primary rounded-md h-7 hover:bg-black/90 transition-colors"
              >
                Sign Up
              </Link>
            </div>

            {/* User Menu / Profile */}
            <Link
              href="/profile"
              className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-text-primary text-bg-card font-semibold text-xs transition-transform hover:scale-95 border border-border"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                'V'
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-text-muted hover:text-text-primary transition-colors"
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bg-card border-b border-border shadow-level-3"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-border flex gap-2">
                <Link
                  href="/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-semibold text-text-primary rounded-md border border-border hover:bg-bg-secondary transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-semibold text-bg-card bg-text-primary rounded-md hover:bg-black/90 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}