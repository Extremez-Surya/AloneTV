'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getLocalProfile, syncUserProfile } from '@/lib/supabase/profile';
import type { UserProfile } from '@/lib/supabase/profile';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function verify() {
      const local = getLocalProfile();
      if (local) {
        const admin = local.demo ? Boolean(local.is_admin) : local.email === 'theextremez2.0@gmail.com';
        setIsAdmin(admin);
        setUser(local);
      }
      try {
        const server = await syncUserProfile();
        if (server) {
          const admin = server.demo ? Boolean(server.is_admin) : server.email === 'theextremez2.0@gmail.com';
          setIsAdmin(admin);
          setUser(server);
        }
      } catch {}
      if (!local) {
        setIsAdmin(false);
      }
    }
    verify();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm font-semibold font-mono uppercase tracking-wider">Verifying Admin...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-card border border-red-500/20 rounded-2xl p-8 text-center shadow-level-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 text-3xl">⚠️</div>
          <h1 className="text-xl font-bold text-white tracking-tight">Access Denied</h1>
          <p className="text-sm text-text-muted">You do not have admin privileges to access this panel.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold font-mono text-white uppercase tracking-wider"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar />
      <div className="lg:pl-[220px] transition-all duration-300">
        <main className="min-h-screen pb-16">{children}</main>
      </div>
    </div>
  );
}
