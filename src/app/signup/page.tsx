'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    try { setSupabase(createClient()); } catch {}
  }, []);

  const handleOAuthSignUp = async (provider: 'google' | 'discord') => {
    if (!supabase) { handleDirectDemoLogin(); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/profile` },
      });
      if (error) throw error;
    } catch {
      handleDirectDemoLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDemoLogin = () => {
    localStorage.setItem('alonetv_user', JSON.stringify({
      id: 'demo-user-id', email: 'demo@example.com',
      username: 'Demo Watcher', name: 'Demo Watcher',
      is_premium: false, demo: true,
    }));
    window.dispatchEvent(new Event('alonetv_user_changed'));
    window.location.href = '/profile';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-600/20 blur-[200px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/15 blur-[200px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          </Link>
        </div>

        <div className="bg-zinc-900/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/[0.06] shadow-2xl">
          <h1 className="text-2xl font-bold text-white text-center mb-1 tracking-tight">Join VinayTV.</h1>
          <p className="text-sm text-zinc-400 text-center mb-8">Create your account to start streaming</p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuthSignUp('google')}
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-zinc-100 text-black text-sm font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuthSignUp('discord')}
              disabled={loading}
              className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
              </svg>
              Sign up with Discord
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[10px] uppercase tracking-wider text-zinc-600 bg-zinc-900/70">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDirectDemoLogin}
            disabled={loading}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-medium rounded-xl transition-all border border-white/[0.06] disabled:opacity-50"
          >
            Continue as Guest (Demo)
          </button>

          <p className="text-center text-zinc-600 mt-6 text-[10px] font-mono leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-zinc-400 hover:text-white underline underline-offset-2">Terms</a>
            {' & '}
            <a href="#" className="text-zinc-400 hover:text-white underline underline-offset-2">Privacy Policy</a>
          </p>
        </div>

        <p className="text-center text-zinc-600 mt-6 text-xs">
          Already have an account?{' '}
          <Link href="/signin" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
