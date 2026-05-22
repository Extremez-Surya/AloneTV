'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';
import { siteConfig } from '@/lib/platform';

const navLinks = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/movies', label: 'Movies', icon: 'movie' },
  { href: '/tv', label: 'Series', icon: 'tv' },
  { href: '/tv-shows', label: 'TV Shows', icon: 'play_circle' },
  { href: '/live-tv', label: 'Live TV', icon: 'live_tv' },
  { href: '/web-series', label: 'Web Series', icon: 'layers' },
  { href: '/anime', label: 'Anime', icon: 'theater_comedy' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-8 border-b border-white/8 bg-[#05070b]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-white/90">
            <div className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-linear-to-br from-[#ffb4aa] via-[#ff7b54] to-[#ff4d6d] text-[10px] font-black text-black shadow-[0_0_24px_rgba(255,92,115,0.28)]">
              A
            </div>
            <span className="text-[11px] font-semibold tracking-[0.24em] uppercase">{siteConfig.name}</span>
          </Link>

          <div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/35 md:flex">
            <span>Desktop cinema shell</span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span>Ctrl+K search</span>
          </div>

          <div className="flex items-center gap-2 text-white/55">
            <button type="button" className="rounded p-1 transition-colors hover:bg-white/8 hover:text-white" aria-label="Minimize">
              <span className="block h-0.5 w-3 rounded-full bg-current" />
            </button>
            <button type="button" className="rounded p-1 transition-colors hover:bg-white/8 hover:text-white" aria-label="Maximize">
              <span className="block h-3 w-3 rounded-[2px] border border-current" />
            </button>
            <button type="button" className="rounded p-1 transition-colors hover:bg-error/20 hover:text-error" aria-label="Close">
              <span className="material-symbols-outlined text-[14px] leading-none">close</span>
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed left-0 top-8 z-40 hidden h-[calc(100vh-2rem)] w-[280px] border-r border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-6 backdrop-blur-[40px] md:flex md:flex-col">
        <div className="mb-6 flex items-center gap-3 rounded-[1.4rem] border border-white/8 bg-black/28 px-4 py-3 backdrop-blur-2xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-[#ffb4aa] via-[#ff7b54] to-[#e50914] text-white shadow-[0_18px_40px_-20px_rgba(229,9,20,0.8)]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="truncate text-[1.15rem] font-semibold tracking-tight text-white">{siteConfig.name}</div>
            <div className="truncate text-[11px] uppercase tracking-[0.3em] text-white/40">Premium streaming</div>
          </div>
        </div>

        <div className="mb-5">
          <SearchBar />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center gap-3 rounded-[1.1rem] border-l-4 px-4 py-3 transition-all ${
                  active
                    ? 'border-[#ffb4aa] bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                    : 'border-transparent text-white/58 hover:border-white/10 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-[19px] ${active ? 'text-[#ffb4aa]' : 'text-current'}`}>
                  {link.icon}
                </span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.22em]">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-[1.35rem] border border-white/8 bg-black/25 p-4 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-[#37c8ab] to-[#4f7cff] text-sm font-bold text-white shadow-[0_18px_40px_-22px_rgba(79,124,255,0.65)]">
              V
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">Viewer profile</div>
              <div className="truncate text-[11px] text-white/42">Continue watching, downloads, and watchlist</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <Link href="/profile" className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-center text-white/75 transition-colors hover:bg-white/[0.06]">
              Profile
            </Link>
            <Link href="/search" className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-center text-white/75 transition-colors hover:bg-white/[0.06]">
              Search
            </Link>
          </div>
        </div>
      </aside>

      <div className="fixed left-0 right-0 top-8 z-40 border-b border-white/8 bg-[#05070b]/88 backdrop-blur-2xl md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-[#ffb4aa] via-[#ff7b54] to-[#e50914] text-sm font-black text-black">
              A
            </div>
            <div>
              <div className="text-lg font-semibold leading-none tracking-tight">{siteConfig.name}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/42">Cinematic streaming</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <SearchBar />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
              aria-label="Toggle navigation menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/8 bg-[#06080d]/96 px-4 py-4"
            >
              <div className="grid gap-2">
                {navLinks.map((link) => {
                  const active = isActive(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-[1rem] border px-4 py-3 ${
                        active
                          ? 'border-[#ffb4aa]/30 bg-white/[0.08] text-white'
                          : 'border-white/8 bg-white/[0.03] text-white/68'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
                      <span className="text-[12px] font-semibold uppercase tracking-[0.2em]">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
