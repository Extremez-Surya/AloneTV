'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    try {
      setSupabase(createClient());
    } catch {
      // Supabase not configured
    }
  }, []);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setIsDemoMode(false);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/profile`,
        },
      });

      if (error) {
        throw error;
      } else {
        setSent(true);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      // Supabase paused/offline detection
      const isNetworkError = 
        err.message?.toLowerCase().includes('fetch') || 
        err.message?.toLowerCase().includes('network') || 
        err.message?.toLowerCase().includes('initialized') ||
        !supabase;

      if (isNetworkError) {
        console.warn('Supabase is offline/paused. Redirecting using local Demo Session.');
        setIsDemoMode(true);
        localStorage.setItem('alonetv_user', JSON.stringify({
          email: email || 'demo@example.com',
          name: email ? email.split('@')[0] : 'Demo User',
          demo: true
        }));
        setSent(true);
        // Redirect to profile page after delay
        setTimeout(() => {
          window.location.href = '/profile';
        }, 2000);
      } else {
        setErrorMsg(err.message || 'Failed to authenticate');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      handleDirectDemoLogin();
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/profile`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      handleDirectDemoLogin();
    }
  };

  const handleDirectDemoLogin = () => {
    localStorage.setItem('alonetv_user', JSON.stringify({
      id: 'demo-user-id',
      email: 'demo@example.com',
      username: 'Demo Watcher',
      name: 'Demo Watcher',
      is_premium: false,
      demo: true
    }));
    window.dispatchEvent(new Event('alonetv_user_changed'));
    window.location.href = '/profile';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-text-primary flex items-center justify-center transition-transform group-hover:scale-95">
              <svg
                className="w-5 h-5 text-bg-card"
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
            <span className="text-xl font-bold tracking-tight text-text-primary">AloneTV.</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-bg-card rounded-2xl p-8 border border-border shadow-level-3">
          <h1 className="text-xl font-semibold text-text-primary text-center mb-1">Welcome Back.</h1>
          <p className="text-sm text-text-muted text-center mb-6">Sign in to continue watching</p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 text-xs font-semibold leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {sent ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Check your email.</h2>
              <p className="text-xs text-text-muted leading-relaxed">
                {isDemoMode 
                  ? 'Supabase auth is paused/offline. Auto-logging in via Demo session...' 
                  : `We sent a magic link to ${email}`}
              </p>
              {isDemoMode && (
                <div className="flex justify-center pt-2">
                  <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 font-mono">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-text-primary text-bg-card text-sm font-semibold rounded-lg hover:bg-black/95 transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>

              <button
                type="button"
                onClick={handleDirectDemoLogin}
                className="w-full py-2.5 bg-accent-purple text-white text-sm font-semibold rounded-lg hover:bg-accent-purple/90 transition-all shadow-md shadow-accent-purple/20"
              >
                Instant Demo Login
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-mono">
                  <span className="px-3 bg-bg-card text-text-muted">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 bg-bg-card text-text-primary border border-border text-sm font-semibold rounded-lg hover:bg-bg-secondary transition-all flex items-center justify-center gap-2 shadow-level-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google Identity
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-text-muted mt-6 text-xs font-medium">
          Don't have an account?{' '}
          <Link href="/signup" className="text-accent-purple hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}