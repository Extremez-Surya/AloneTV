'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { fetchProfiles, adminTogglePremium, adminDeleteUser, getLocalProfile } from '@/lib/supabase/profile';
import type { UserProfile } from '@/lib/supabase/profile';

const PLAN_META: Record<string, { label: string; color: string; priceINR: number }> = {
  premium_mobile: { label: 'Mobile', color: '#3b82f6', priceINR: 149 },
  premium_basic: { label: 'Basic', color: '#8b5cf6', priceINR: 199 },
  premium_standard: { label: 'Standard', color: '#6366f1', priceINR: 499 },
  premium_premium: { label: 'Premium', color: '#ec4899', priceINR: 649 },
  premium_monthly: { label: 'Monthly', color: '#10b981', priceINR: 499 },
  premium_yearly: { label: 'Yearly', color: '#f59e0b', priceINR: 649 },
};

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'premium' | 'free'>('all');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const users = await fetchProfiles();
      setProfiles(users);
      const local = getLocalProfile();
      setCurrentUser(local);
    } catch {}
    try {
      const stored = localStorage.getItem('alonetv_mock_payments');
      if (stored) setPayments(JSON.parse(stored));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return profiles.filter(p => {
      const q = search.toLowerCase();
      const matchesSearch = (p.username || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (filterTier === 'premium') return p.is_premium;
      if (filterTier === 'free') return !p.is_premium;
      return true;
    });
  }, [profiles, search, filterTier]);

  const handleTogglePremium = async (userId: string, current: boolean) => {
    await adminTogglePremium(userId, !current);
    await loadData();
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, is_premium: !current } : null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await adminDeleteUser(userId);
    await loadData();
    if (selectedUser?.id === userId) closeDrawer();
  };

  const openDrawer = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  const totalPayments = payments.length;
  const successPayments = payments.filter(p => p.status === 'success').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-text-muted mt-1">Manage user accounts, subscriptions, and roles</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Users" value={profiles.length} subtitle="Registered accounts" accentColor="purple" />
        <StatCard label="Premium Users" value={profiles.filter(p => p.is_premium).length} subtitle="Active subscriptions" accentColor="amber" />
        <StatCard label="Free Users" value={profiles.filter(p => !p.is_premium).length} subtitle="Free tier" accentColor="blue" />
      </div>

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64 px-3.5 py-1.5 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple placeholder-text-muted"
            />
            <div className="flex gap-1">
              {(['all', 'premium', 'free'] as const).map(t => (
                <button key={t} onClick={() => setFilterTier(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider border transition-all ${
                    filterTier === t ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-transparent border-transparent text-text-muted hover:text-white'
                  }`}
                >{t}</button>
              ))}
            </div>
          </div>
          <span className="text-[10px] font-mono text-text-muted">{filtered.length} of {profiles.length} users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-bg-secondary/40 border-b border-border/80 text-text-muted font-mono uppercase tracking-wider text-[10px]">
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-text-muted"><div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-text-muted font-mono">No users found</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/20 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => openDrawer(p)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {(p.username || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white text-xs">{p.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-text-muted font-mono text-[11px]">{p.email || '—'}</td>
                    <td className="p-4 text-text-muted font-mono text-[11px]">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                    <td className="p-4 text-center">
                      <StatusBadge status={p.is_premium ? 'premium' : 'free'} />
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={p.is_admin ? 'admin' : 'member'} />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); handleTogglePremium(p.id, p.is_premium); }}
                        className={`px-2.5 py-1 rounded text-[9px] font-bold font-mono uppercase tracking-wider border transition-all ${
                          p.is_premium ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'
                        }`}
                      >
                        {p.is_premium ? 'Revoke' : 'Upgrade'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isDrawerOpen && selectedUser && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-[#0c0918] border-l border-purple-500/20 z-50 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 sticky top-0 bg-[#0c0918] z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                    {(selectedUser.username || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{selectedUser.username || 'Unknown'}</p>
                    <p className="text-text-muted text-[11px] font-mono">{selectedUser.email || 'No email'}</p>
                  </div>
                </div>
                <button onClick={closeDrawer} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white flex items-center justify-center text-lg">×</button>
              </div>

              <div className="flex-1 p-6 space-y-6">
                <div className="bg-white/5 border border-white/8 rounded-2xl divide-y divide-white/5 text-xs font-mono">
                  {[
                    ['Username', selectedUser.username || '—'],
                    ['Email', selectedUser.email || '—'],
                    ['User ID', selectedUser.id.slice(0, 16) + '…'],
                    ['Joined', selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
                    ['Status', selectedUser.is_premium ? 'Premium' : 'Free'],
                    ['Role', selectedUser.is_admin ? 'Admin' : 'Member'],
                  ].map(([k, v]) => (
                    <div key={k} className="px-4 py-3 flex justify-between items-center">
                      <span className="text-text-muted uppercase tracking-wider">{k}</span>
                      <span className="text-white font-semibold truncate max-w-[200px]">{v}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted font-mono mb-3">Payment History</h4>
                  {payments.filter(p => p.email === selectedUser.email || p.user_id === selectedUser.id).length === 0 ? (
                    <div className="bg-white/5 border border-white/8 rounded-2xl px-5 py-6 text-center">
                      <p className="text-text-muted text-xs">No payment records found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payments.filter(p => p.email === selectedUser.email || p.user_id === selectedUser.id).slice(0, 5).map(pay => (
                        <div key={pay.id} className="flex items-center justify-between bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-xs font-mono">
                          <div>
                            <p className="text-white font-semibold">{PLAN_META[pay.plan_type]?.label || pay.plan_type}</p>
                            <p className="text-text-muted">{new Date(pay.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-amber-400 font-bold">${pay.amount.toFixed(2)}</p>
                            <StatusBadge status={pay.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted font-mono mb-3">Admin Actions</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleTogglePremium(selectedUser.id, selectedUser.is_premium)}
                      className={`w-full py-3 rounded-xl text-sm font-bold font-mono uppercase tracking-wider border transition-all ${
                        selectedUser.is_premium ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' : 'bg-purple-600/15 border-purple-500/30 text-purple-300 hover:bg-purple-600/30'
                      }`}
                    >
                      {selectedUser.is_premium ? 'Revoke Premium' : 'Grant Premium'}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedUser.id)}
                      disabled={selectedUser.id === currentUser?.id}
                      className="w-full py-3 rounded-xl text-sm font-bold font-mono uppercase tracking-wider border bg-red-600/10 border-red-500/20 text-red-500 hover:bg-red-600/20 transition-all disabled:opacity-30"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
