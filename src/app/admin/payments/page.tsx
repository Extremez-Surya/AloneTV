'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { fetchProfiles, adminTogglePremium } from '@/lib/supabase/profile';
import type { UserProfile } from '@/lib/supabase/profile';

interface PaymentLog {
  id: string; user_id?: string | null; email: string; amount: number;
  plan_type: string; status: 'success' | 'pending' | 'failed'; created_at: string;
}

const PLAN_OPTIONS = [
  { value: 'premium_mobile', label: 'Mobile ($4.99/mo)', amount: 4.99 },
  { value: 'premium_basic', label: 'Basic ($6.99/mo)', amount: 6.99 },
  { value: 'premium_standard', label: 'Standard ($9.99/mo)', amount: 9.99 },
  { value: 'premium_premium', label: 'Premium ($14.99/mo)', amount: 14.99 },
  { value: 'premium_monthly', label: 'Monthly ($9.99)', amount: 9.99 },
  { value: 'premium_yearly', label: 'Yearly ($99.99)', amount: 99.99 },
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  const [showSimulator, setShowSimulator] = useState(false);
  const [simEmail, setSimEmail] = useState('');
  const [simPlan, setSimPlan] = useState('premium_monthly');
  const [simAmount, setSimAmount] = useState('9.99');
  const [simStatus, setSimStatus] = useState<'success' | 'pending' | 'failed'>('success');
  const [simulating, setSimulating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const users = await fetchProfiles();
      setProfiles(users);
      if (users.length > 0 && !simEmail) setSimEmail(users[0].email || '');
    } catch {}
    try {
      const stored = localStorage.getItem('alonetv_mock_payments');
      if (stored) setPayments(JSON.parse(stored));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search && !p.email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [payments, search, statusFilter]);

  const totalRevenue = payments.filter(p => p.status === 'success').reduce((a, p) => a + p.amount, 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const successCount = payments.filter(p => p.status === 'success').length;

  const approvePayment = async (email: string, userId?: string | null, paymentId?: string) => {
    const stored = JSON.parse(localStorage.getItem('alonetv_mock_payments') || '[]');
    const updated = stored.map((pay: any) => {
      if (paymentId && pay.id === paymentId) return { ...pay, status: 'success' };
      if (email && pay.email === email && pay.status === 'pending') return { ...pay, status: 'success' };
      return pay;
    });
    localStorage.setItem('alonetv_mock_payments', JSON.stringify(updated));
    setPayments(updated);
    if (userId) {
      await adminTogglePremium(userId, true);
    } else {
      const match = profiles.find(u => u.email === email);
      if (match) await adminTogglePremium(match.id, true);
    }
    await loadData();
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simEmail.trim()) return;
    setSimulating(true);
    const matchedUser = profiles.find(u => u.email === simEmail || u.username === simEmail);
    const newPayment: PaymentLog = {
      id: 'pay-' + Date.now(),
      user_id: matchedUser?.id || null,
      email: simEmail,
      amount: parseFloat(simAmount),
      plan_type: simPlan,
      status: simStatus,
      created_at: new Date().toISOString(),
    };
    const stored = JSON.parse(localStorage.getItem('alonetv_mock_payments') || '[]');
    const updated = [newPayment, ...stored];
    localStorage.setItem('alonetv_mock_payments', JSON.stringify(updated));
    setPayments(updated);
    if (simStatus === 'success' && matchedUser) {
      await adminTogglePremium(matchedUser.id, true);
    }
    setSimulating(false);
  };

  const exportCSV = () => {
    const headers = 'ID,Email,Amount,Plan,Status,Date\n';
    const rows = payments.map(p =>
      `"${p.id}","${p.email}",${p.amount},"${p.plan_type}","${p.status}","${p.created_at}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Payments</h1>
            <p className="text-sm text-text-muted mt-1">Track transactions, approve payments, and simulate billing</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted hover:text-white transition-all">Export CSV</button>
            <button onClick={() => setShowSimulator(!showSimulator)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider border transition-all ${showSimulator ? 'bg-purple-600/20 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}>
              {showSimulator ? 'Hide Simulator' : '+ New Transaction'}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Transactions" value={payments.length} accentColor="purple" />
        <StatCard label="Successful" value={successCount} accentColor="green" />
        <StatCard label="Pending" value={pendingCount} accentColor="amber" />
        <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} accentColor="green" />
      </div>

      {showSimulator && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
          <form onSubmit={handleSimulate} className="bg-bg-card border border-purple-500/15 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 font-mono">Transaction Simulator</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">User</label>
                <select value={simEmail} onChange={e => setSimEmail(e.target.value)} className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple">
                  {profiles.map(u => <option key={u.id} value={u.email || u.username}>{u.email || u.username}</option>)}
                  <option value="guest@external.com">Guest (guest@external.com)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Plan</label>
                <select value={simPlan} onChange={e => { const opt = PLAN_OPTIONS.find(p => p.value === e.target.value); setSimPlan(e.target.value); if (opt) setSimAmount(opt.amount.toString()); }} className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple">
                  {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Amount</label>
                <input type="number" step="0.01" value={simAmount} onChange={e => setSimAmount(e.target.value)} className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Status</label>
                <select value={simStatus} onChange={e => setSimStatus(e.target.value as any)} className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple">
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={simulating} className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-purple-600 to-accent-purple text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl border border-purple-500/30 hover:opacity-90 transition-all disabled:opacity-50">
              {simulating ? 'Processing...' : 'Log Transaction'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text" placeholder="Search by email..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-56 px-3.5 py-1.5 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple placeholder-text-muted"
            />
            <div className="flex gap-1">
              {(['all', 'success', 'pending', 'failed'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider border transition-all ${
                    statusFilter === s ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-transparent border-transparent text-text-muted hover:text-white'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-bg-secondary/40 border-b border-border/80 text-text-muted font-mono uppercase tracking-wider text-[10px]">
                <th className="p-4">Email</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-text-muted"><div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-text-muted font-mono">No payments found</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/20 hover:bg-white/[0.02]">
                    <td className="p-4 font-medium text-white font-mono text-[11px]">{p.email}</td>
                    <td className="p-4 font-mono text-white font-bold">${p.amount.toFixed(2)}</td>
                    <td className="p-4 text-text-muted capitalize font-mono text-[10px]">{p.plan_type.replace(/_/g, ' ')}</td>
                    <td className="p-4"><StatusBadge status={p.status} /></td>
                    <td className="p-4 text-text-muted font-mono text-[10px]">{new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="p-4 text-right">
                      {p.status === 'pending' ? (
                        <button onClick={() => approvePayment(p.email, p.user_id, p.id)}
                          className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider transition-all"
                        >Approve</button>
                      ) : p.status === 'success' ? (
                        <span className="text-[9px] text-green-500/60 font-mono">Completed</span>
                      ) : (
                        <span className="text-[9px] text-red-500/60 font-mono">Failed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
