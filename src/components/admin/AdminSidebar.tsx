'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'D' },
  { href: '/admin/users', label: 'Users', icon: 'U' },
  { href: '/admin/payments', label: 'Payments', icon: '$' },
  { href: '/admin/content', label: 'Content', icon: 'C' },
  { href: '/admin/providers', label: 'Providers', icon: 'P' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'A' },
  { href: '/admin/settings', label: 'Settings', icon: 'S' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-white"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      <aside className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 bg-bg-primary border-r border-border flex flex-col ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-[68px]' : 'translate-x-0 w-[220px]'}`}>
        <div className="flex items-center gap-2.5 px-5 h-[72px] border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-extrabold">A</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight">Admin Panel</p>
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Control Center</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCollapsed(true)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'text-text-muted hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="w-7 h-7 rounded-lg bg-bg-secondary border border-border flex items-center justify-center text-[11px] font-mono font-bold shrink-0">
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold text-text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {!collapsed && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {collapsed && (
        <div
          onClick={() => setCollapsed(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}
    </>
  );
}
