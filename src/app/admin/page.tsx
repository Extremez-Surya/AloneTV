'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { fetchProfiles } from '@/lib/supabase/profile';
import type { UserProfile } from '@/lib/supabase/profile';

interface PaymentLog {
  id: string; user_id?: string | null; email: string; amount: number;
  plan_type: string; status: 'success' | 'pending' | 'failed'; created_at: string;
}

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const users = await fetchProfiles();
        setProfiles(users);
      } catch {}
      try {
        const stored = localStorage.getItem('alonetv_mock_payments');
        if (stored) {
          setPayments(JSON.parse(stored));
        } else {
          const defaults: PaymentLog[] = [
            { id: 'pay-1', email: 'sarah.j@example.com', amount: 9.99, plan_type: 'premium_monthly', status: 'success', created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
            { id: 'pay-2', email: 'david.miller@example.com', amount: 99.99, plan_type: 'premium_yearly', status: 'success', created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString() },
            { id: 'pay-3', email: 'alex.m@example.com', amount: 9.99, plan_type: 'premium_monthly', status: 'failed', created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString() },
            { id: 'pay-4', email: 'jessica@example.rabbit', amount: 9.99, plan_type: 'premium_monthly', status: 'pending', created_at: new Date().toISOString() },
          ];
          localStorage.setItem('alonetv_mock_payments', JSON.stringify(defaults));
          setPayments(defaults);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const totalUsers = profiles.length;
  const premiumUsers = profiles.filter(p => p.is_premium).length;
  const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;
  const totalRevenue = payments.filter(p => p.status === 'success').reduce((a, p) => a + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const recentPayments = [...payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 7);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toLocaleDateString('en', { weekday: 'short' });
    const count = profiles.filter(p => {
      if (!p.created_at) return false;
      const created = new Date(p.created_at);
      return created.toDateString() === d.toDateString();
    }).length;
    return { day, count };
  });
  const maxCount = Math.max(1, ...last7Days.map(d => d.count));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-text-muted mt-1">Overview of your platform metrics and activity</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              All Systems Normal
            </span>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Accounts" value={totalUsers} subtitle="Active registrations" accentColor="purple" icon="U" />
            <StatCard label="Premium Users" value={premiumUsers} subtitle="Subscribed members" accentColor="amber" icon="P" />
            <StatCard label="Conversion Rate" value={`${conversionRate.toFixed(0)}%`} subtitle="Free to Premium" accentColor="teal" icon="%" />
            <StatCard label="Gross Revenue" value={`$${totalRevenue.toFixed(2)}`} subtitle="Simulated aggregate" accentColor="green" icon="$" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono mb-4">New Users (7 Days)</h3>
              <div className="flex items-end gap-2 h-32">
                {last7Days.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[9px] font-mono text-text-muted">{d.count}</span>
                    <div className="w-full rounded-md bg-purple-500/20 relative overflow-hidden" style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? '4px' : '2px' }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/60 to-purple-500/10 rounded-md" />
                    </div>
                    <span className="text-[9px] font-mono text-text-muted">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-xs text-text-muted">Pending Approvals</span>
                  <span className="text-sm font-bold text-yellow-400 font-mono">{pendingPayments}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-xs text-text-muted">Failed Transactions</span>
                  <span className="text-sm font-bold text-red-400 font-mono">{payments.filter(p => p.status === 'failed').length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-xs text-text-muted">Avg. Revenue/User</span>
                  <span className="text-sm font-bold text-green-400 font-mono">{totalUsers > 0 ? `$${(totalRevenue / totalUsers).toFixed(2)}` : '$0.00'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-text-muted">Active Users</span>
                  <span className="text-sm font-bold text-purple-400 font-mono">{profiles.filter(p => p.is_premium || !p.is_premium).length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Recent Payments</h3>
                <Link href="/admin/payments" className="text-[10px] font-mono text-purple-400 hover:text-purple-300 uppercase tracking-wider">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border/60 text-text-muted font-mono uppercase tracking-wider">
                      <th className="py-2.5 pr-3">Email</th>
                      <th className="py-2.5 pr-3">Amount</th>
                      <th className="py-2.5 pr-3">Plan</th>
                      <th className="py-2.5 pr-3">Status</th>
                      <th className="py-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-text-muted font-mono">No payments recorded</td></tr>
                    ) : (
                      recentPayments.map((pay) => (
                        <tr key={pay.id} className="border-b border-border/20 hover:bg-white/[0.02]">
                          <td className="py-3 pr-3 font-medium text-white">{pay.email}</td>
                          <td className="py-3 pr-3 font-mono text-white">${pay.amount.toFixed(2)}</td>
                          <td className="py-3 pr-3 text-text-muted capitalize font-mono text-[10px]">{pay.plan_type.replace('_', ' ')}</td>
                          <td className="py-3 pr-3"><StatusBadge status={pay.status} /></td>
                          <td className="py-3 text-text-muted font-mono text-[10px]">{new Date(pay.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/15 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 font-mono">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/admin/users" className="block w-full py-2.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold font-mono uppercase tracking-wider text-center transition-all">
                    Manage Users
                  </Link>
                  <Link href="/admin/payments" className="block w-full py-2.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold font-mono uppercase tracking-wider text-center transition-all">
                    View Transactions
                  </Link>
                  <Link href="/admin/content" className="block w-full py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold font-mono uppercase tracking-wider text-center transition-all">
                    Browse Content
                  </Link>
                  <Link href="/admin/settings" className="block w-full py-2.5 bg-zinc-600/10 hover:bg-zinc-600/20 text-zinc-300 border border-zinc-500/30 rounded-xl text-xs font-bold font-mono uppercase tracking-wider text-center transition-all">
                    System Settings
                  </Link>
                </div>
              </div>
              <div className="bg-bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono mb-3">Top Users</h3>
                <div className="space-y-2.5">
                  {[...profiles].sort((a, b) => (a.is_premium === b.is_premium ? 0 : a.is_premium ? -1 : 1)).slice(0, 4).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-[9px] font-mono font-bold text-text-muted">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{p.username || 'User'}</p>
                        <p className="text-[9px] font-mono text-text-muted truncate">{p.email || 'No email'}</p>
                      </div>
                      {p.is_premium && <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase tracking-wider font-mono">PREMIUM</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
