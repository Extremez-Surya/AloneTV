'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { fetchProfiles } from '@/lib/supabase/profile';
import type { UserProfile } from '@/lib/supabase/profile';

interface PaymentLog {
  id: string; email: string; amount: number; plan_type: string;
  status: string; created_at: string;
}

export default function AdminAnalyticsPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'revenue' | 'plans' | 'growth'>('growth');

  useEffect(() => {
    async function load() {
      try { setProfiles(await fetchProfiles()); } catch {}
      try {
        const stored = localStorage.getItem('alonetv_mock_payments');
        if (stored) setPayments(JSON.parse(stored));
      } catch {}
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const total = profiles.length;
    const premium = profiles.filter(p => p.is_premium).length;
    const free = total - premium;
    const conversion = total > 0 ? (premium / total) * 100 : 0;
    const revenue = payments.filter(p => p.status === 'success').reduce((a, p) => a + p.amount, 0);
    const avgRevenue = premium > 0 ? revenue / premium : 0;
    const planDist: Record<string, number> = {};
    payments.filter(p => p.status === 'success').forEach(p => {
      planDist[p.plan_type] = (planDist[p.plan_type] || 0) + 1;
    });
    return { total, premium, free, conversion, revenue, avgRevenue, planDist };
  }, [profiles, payments]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { users: number; revenue: number }> = {};
    profiles.forEach(p => {
      if (p.created_at) {
        const m = p.created_at.slice(0, 7);
        months[m] = months[m] || { users: 0, revenue: 0 };
        months[m].users++;
      }
    });
    payments.filter(p => p.status === 'success').forEach(p => {
      const m = p.created_at.slice(0, 7);
      months[m] = months[m] || { users: 0, revenue: 0 };
      months[m].revenue += p.amount;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b));
  }, [profiles, payments]);

  const maxMonthlyUsers = Math.max(1, ...monthlyData.map(([, d]) => d.users));
  const maxMonthlyRevenue = Math.max(1, ...monthlyData.map(([, d]) => d.revenue));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-text-muted mt-1">Platform metrics, trends, and growth insights</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats.total, change: '+12%', positive: true },
          { label: 'Premium Rate', value: `${stats.conversion.toFixed(1)}%`, change: '+5%', positive: true },
          { label: 'Avg Revenue/User', value: `$${stats.avgRevenue.toFixed(2)}`, change: '+8%', positive: true },
          { label: 'Total Revenue', value: `$${stats.revenue.toFixed(2)}`, change: '+15%', positive: true },
        ].map(s => (
          <div key={s.label} className="bg-bg-card border border-border rounded-2xl p-5">
            <p className="text-[10px] uppercase font-mono tracking-widest text-text-muted">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1.5 font-mono">{s.value}</p>
            <span className={`text-[10px] font-mono font-bold ${s.positive ? 'text-green-400' : 'text-red-400'}`}>{s.change} vs last month</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Monthly Trends</h3>
            <div className="flex gap-1">
              {(['growth', 'users', 'revenue'] as const).map(m => (
                <button key={m} onClick={() => setSelectedMetric(m)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider border transition-all ${
                    selectedMetric === m ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-transparent border-transparent text-text-muted hover:text-white'
                  }`}
                >{m}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {monthlyData.length === 0 ? (
              <p className="text-center text-text-muted text-xs font-mono py-8">No data available yet</p>
            ) : (
              monthlyData.map(([month, data]) => {
                const userPercent = (data.users / maxMonthlyUsers) * 100;
                const revenuePercent = (data.revenue / maxMonthlyRevenue) * 100;
                return (
                  <div key={month} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-text-muted">{month}</span>
                      <div className="flex gap-4">
                        <span className="text-purple-400">{data.users} users</span>
                        <span className="text-green-400">${data.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-3">
                      <div className="flex-1 bg-purple-500/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500/60 to-purple-500/30 rounded-full transition-all" style={{ width: `${userPercent}%` }} />
                      </div>
                      <div className="flex-1 bg-green-500/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500/60 to-green-500/30 rounded-full transition-all" style={{ width: `${revenuePercent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono mb-4">User Distribution</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-3 rounded-full bg-zinc-700 overflow-hidden flex">
                {stats.total > 0 && (
                  <>
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all" style={{ width: `${(stats.premium / stats.total) * 100}%` }} />
                    <div className="h-full bg-zinc-500 transition-all" style={{ width: `${(stats.free / stats.total) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Premium</span>
                <span className="font-mono text-white">{stats.premium} ({stats.total > 0 ? ((stats.premium / stats.total) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-zinc-500" /> Free</span>
                <span className="font-mono text-white">{stats.free} ({stats.total > 0 ? ((stats.free / stats.total) * 100).toFixed(0) : 0}%)</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono mb-4">Plan Distribution</h3>
            <div className="space-y-2">
              {Object.entries(stats.planDist).length === 0 ? (
                <p className="text-xs text-text-muted font-mono text-center py-4">No data</p>
              ) : (
                Object.entries(stats.planDist).sort(([, a], [, b]) => b - a).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between py-1.5 border-b border-border/20">
                    <span className="text-xs text-text-muted capitalize">{plan.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-bold font-mono text-white">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ['User Growth Rate', '+18%', 'text-green-400'],
            ['Premium Churn', '2.1%', 'text-yellow-400'],
            ['Avg. Session', '24m', 'text-blue-400'],
            ['API Uptime', '99.9%', 'text-green-400'],
          ].map(([label, value, color]) => (
            <div key={label} className="bg-bg-secondary/40 border border-border/50 rounded-xl p-4">
              <p className="text-[9px] font-mono text-text-muted uppercase tracking-wider">{label}</p>
              <p className={`text-lg font-bold font-mono mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
