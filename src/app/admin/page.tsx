'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getLocalProfile, 
  syncUserProfile, 
  fetchProfiles, 
  adminTogglePremium, 
  adminToggleAdmin, 
  adminDeleteUser,
  UserProfile 
} from '@/lib/supabase/profile';
import { createClient } from '@/lib/supabase/client';

interface PaymentLog {
  id: string;
  user_id?: string | null;
  email: string;
  amount: number;
  plan_type: string;
  status: 'success' | 'pending' | 'failed';
  created_at: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payments' | 'settings'>('overview');
  
  // Auth/Session states
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // User list states
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Payment logs states
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  
  // Simulated Payment Form states
  const [simEmail, setSimEmail] = useState('');
  const [simAmount, setSimAmount] = useState('9.99');
  const [simPlan, setSimPlan] = useState('premium_monthly');
  const [simStatus, setSimStatus] = useState<'success' | 'pending' | 'failed'>('success');
  const [isSimulating, setIsSimulating] = useState(false);

  // System Settings state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [globalNotice, setGlobalNotice] = useState('Welcome to AloneTV! Complete your profile to start watching.');
  const [noticeSaved, setNoticeSaved] = useState(false);

  // Redirect count
  const [redirectSeconds, setRedirectSeconds] = useState(5);

  // Verify Admin privileges
  useEffect(() => {
    async function verifyAdmin() {
      try {
        setIsVerifying(true);
        // 1. Check local profile first
        const local = getLocalProfile();
        if (local) {
          setCurrentUser(local);
          const isLocalAdmin = local.demo ? Boolean(local.is_admin) : (local.email === 'theextremez2.0@gmail.com');
          setIsAdmin(isLocalAdmin);
        }

        // 2. Double check with database state
        const server = await syncUserProfile();
        if (server) {
          setCurrentUser(server);
          const isServerAdmin = server.demo ? Boolean(server.is_admin) : (server.email === 'theextremez2.0@gmail.com');
          setIsAdmin(isServerAdmin);
        }
      } catch (err) {
        console.error('Failed to authenticate admin access:', err);
      } finally {
        setIsVerifying(false);
      }
    }
    verifyAdmin();
  }, []);

  // Countdown redirect if not admin
  useEffect(() => {
    if (!isVerifying && !isAdmin) {
      const timer = setInterval(() => {
        setRedirectSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = '/profile';
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isVerifying, isAdmin]);

  // Load Admin Data on tab navigation or status updates
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await fetchProfiles();
      setProfiles(users);
      if (users.length > 0 && !simEmail) {
        setSimEmail(users[0].email || 'demo@example.com');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      if (currentUser?.demo) {
        // Load simulated payments from localStorage
        const stored = localStorage.getItem('alonetv_mock_payments');
        if (!stored) {
          const defaultPayments: PaymentLog[] = [
            { id: 'pay-1', email: 'sarah.j@example.com', amount: 9.99, plan_type: 'premium_monthly', status: 'success', created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
            { id: 'pay-2', email: 'david.miller@example.com', amount: 99.99, plan_type: 'premium_yearly', status: 'success', created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString() },
            { id: 'pay-3', email: 'alex.m@example.com', amount: 9.99, plan_type: 'premium_monthly', status: 'failed', created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString() }
          ];
          localStorage.setItem('alonetv_mock_payments', JSON.stringify(defaultPayments));
          setPayments(defaultPayments);
        } else {
          setPayments(JSON.parse(stored));
        }
      } else {
        // Fetch from Database
        const res = await fetch('/api/admin/payments');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPayments(data.payments || []);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadPayments();
    }
  }, [isAdmin, activeTab]);

  // Handle Action functions
  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    const success = await adminTogglePremium(userId, !currentStatus);
    if (success) {
      loadUsers();
    } else {
      alert('Failed to update premium status.');
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    const success = await adminToggleAdmin(userId, !currentStatus);
    if (success) {
      loadUsers();
    } else {
      alert('Failed to update admin role.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user profile?')) {
      const success = await adminDeleteUser(userId);
      if (success) {
        loadUsers();
      } else {
        alert('Failed to delete user.');
      }
    }
  };

  const handleApprovePayment = async (email: string, userId?: string | null, paymentId?: string | null) => {
    try {
      if (currentUser?.demo) {
        // Handle locally for Demo Mode
        const stored = JSON.parse(localStorage.getItem('alonetv_mock_payments') || '[]');
        const updated = stored.map((pay: any) => {
          if (paymentId && pay.id === paymentId) {
            return { ...pay, status: 'success' };
          }
          if (email && pay.email === email && pay.status === 'pending') {
            return { ...pay, status: 'success' };
          }
          return pay;
        });
        localStorage.setItem('alonetv_mock_payments', JSON.stringify(updated));
        
        // Upgrade the profile in demo mode as well
        if (userId) {
          await adminTogglePremium(userId, true);
        } else {
          // Look up matching mock user profile
          const mockProfiles = JSON.parse(localStorage.getItem('alonetv_mock_profiles') || '[]');
          const match = mockProfiles.find((u: any) => u.email === email || u.username === email);
          if (match) {
            await adminTogglePremium(match.id, true);
          }
        }
        
        loadPayments();
        loadUsers();
        alert('Payment approved successfully! Premium membership granted.');
      } else {
        // Supabase mode - update payment row(s) to success
        const body: any = {};
        if (paymentId) body.paymentId = paymentId;
        else if (email) body.email = email;
        
        const res = await fetch('/api/admin/payments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          // Trigger premium upgrade in profiles table
          if (userId) {
            await adminTogglePremium(userId, true);
          } else {
            // Find matched user profile in state to get user ID
            const matchedUser = profiles.find(u => u.email === email || u.username === email);
            if (matchedUser) {
              await adminTogglePremium(matchedUser.id, true);
            }
          }
          loadPayments();
          loadUsers();
          alert('Payment approved successfully! Premium membership granted.');
        } else {
          alert('Failed to update database payment logs.');
        }
      }
    } catch (err) {
      console.error('Failed to approve transaction:', err);
      alert('Error approving payment.');
    }
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simEmail.trim()) return;

    setIsSimulating(true);
    try {
      // Find matches for linking user IDs
      const matchedUser = profiles.find(u => u.email === simEmail || u.username === simEmail);
      const parsedAmount = parseFloat(simAmount);

      if (currentUser?.demo) {
        // Handle locally
        const newPayment: PaymentLog = {
          id: 'pay-' + Date.now(),
          user_id: matchedUser?.id || null,
          email: simEmail,
          amount: parsedAmount,
          plan_type: simPlan,
          status: simStatus,
          created_at: new Date().toISOString()
        };

        const stored = JSON.parse(localStorage.getItem('alonetv_mock_payments') || '[]');
        const updatedPayments = [newPayment, ...stored];
        localStorage.setItem('alonetv_mock_payments', JSON.stringify(updatedPayments));
        setPayments(updatedPayments);

        // If payment was a success, upgrade user status in demo mock profile list
        if (simStatus === 'success' && matchedUser) {
          await adminTogglePremium(matchedUser.id, true);
          loadUsers();
        }
      } else {
        // Send to server API
        const res = await fetch('/api/admin/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: matchedUser?.id || null,
            email: simEmail,
            amount: parsedAmount,
            plan_type: simPlan,
            status: simStatus
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            loadPayments();
            loadUsers();
          }
        } else {
          alert('Backend error recording simulated transaction.');
        }
      }
      
      // Visual feedback
      alert(`Simulation completed! Payment status logged as: ${simStatus.toUpperCase()}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetDemoDatabase = () => {
    if (confirm('Reset simulated database? This clears custom logs and restores 5 default mock users.')) {
      localStorage.removeItem('alonetv_mock_profiles');
      localStorage.removeItem('alonetv_mock_payments');
      loadUsers();
      loadPayments();
      alert('Demo database re-seeded successfully.');
    }
  };

  // Filter profiles based on search
  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase();
    return (p.username || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
  });

  // Calculate KPIs
  const totalUsersCount = profiles.length;
  const premiumCount = profiles.filter(p => p.is_premium).length;
  const conversionRate = totalUsersCount > 0 ? ((premiumCount / totalUsersCount) * 100).toFixed(0) : '0';
  
  // Calculate simulated MRR
  const activePremiumSales = payments.filter(p => p.status === 'success');
  const totalRevenue = activePremiumSales.reduce((acc, curr) => acc + curr.amount, 0);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center pt-[72px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm font-semibold font-mono uppercase tracking-wider">Verifying Admin Privileges...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 pt-[72px]">
        <div className="max-w-md w-full bg-bg-card border border-red-500/20 rounded-2xl p-8 text-center shadow-level-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 text-3xl">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Access Denied</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            You do not have the required admin credentials to access this dashboard.
          </p>
          <div className="pt-2">
            <p className="text-xs text-accent-purple font-mono font-bold">
              Redirecting to profile page in {redirectSeconds}s...
            </p>
          </div>
          <div className="pt-4 border-t border-border/40">
            <Link 
              href="/profile" 
              className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold font-mono text-white uppercase tracking-wider block"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-16 pt-[72px] text-left">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Admin Control Center</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                👑 Superuser
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Manage accounts, toggle premium plans manually, simulate billing events, and audit logs.
            </p>
          </div>
          
          {currentUser?.demo && (
            <button
              onClick={handleResetDemoDatabase}
              className="px-3.5 py-2 bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-950/40 hover:text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-colors shrink-0"
            >
              🔄 Reset Demo Database
            </button>
          )}
        </div>

        {/* Tab selection bar */}
        <div className="flex gap-4 border-b border-border/30 mb-8 overflow-x-auto pb-0.5 scrollbar-none">
          {(['overview', 'users', 'payments', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-xs font-bold uppercase tracking-wider font-mono transition-colors relative shrink-0 ${
                activeTab === tab ? 'text-purple-400' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'users' && '👥 Accounts Manager'}
              {tab === 'payments' && '💳 Transaction Logs'}
              {tab === 'settings' && '⚙️ Operations'}
              {activeTab === tab && (
                <motion.div
                  layoutId="adminActiveTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Main tabs panels */}
        <div>
          
          {/* Tab 1: Overview Dashboard */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* Stats widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Stat 1 */}
                <div className="bg-bg-card border border-border p-5 rounded-2xl shadow-level-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                  <p className="text-xs uppercase font-mono tracking-widest text-text-muted">Total Accounts</p>
                  <p className="text-3xl font-bold text-white mt-2 font-mono">{totalUsersCount}</p>
                  <p className="text-[10px] text-text-muted mt-2">Active registrations</p>
                </div>

                {/* Stat 2 */}
                <div className="bg-bg-card border border-border p-5 rounded-2xl shadow-level-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  <p className="text-xs uppercase font-mono tracking-widest text-text-muted">Premium Users</p>
                  <p className="text-3xl font-bold text-amber-500 mt-2 font-mono">{premiumCount}</p>
                  <p className="text-[10px] text-text-muted mt-2">Subscribed members</p>
                </div>

                {/* Stat 3 */}
                <div className="bg-bg-card border border-border p-5 rounded-2xl shadow-level-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent-teal/5 rounded-full blur-2xl pointer-events-none" />
                  <p className="text-xs uppercase font-mono tracking-widest text-text-muted">Conversion Rate</p>
                  <p className="text-3xl font-bold text-accent-teal mt-2 font-mono">{conversionRate}%</p>
                  <p className="text-[10px] text-text-muted mt-2">Free to Premium conversion</p>
                </div>

                {/* Stat 4 */}
                <div className="bg-bg-card border border-border p-5 rounded-2xl shadow-level-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
                  <p className="text-xs uppercase font-mono tracking-widest text-text-muted">Gross Revenue</p>
                  <p className="text-3xl font-bold text-green-500 mt-2 font-mono">${totalRevenue.toFixed(2)}</p>
                  <p className="text-[10px] text-text-muted mt-2">Simulated log aggregate</p>
                </div>

              </div>

              {/* General audit log brief list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left panel: Quick server status */}
                <div className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Recent Payments Audit</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/60 text-text-muted font-mono uppercase tracking-wider">
                          <th className="py-2.5">Email</th>
                          <th className="py-2.5">Amount</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5">Date</th>
                          <th className="py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-text-muted font-mono">No logged payments</td>
                          </tr>
                        ) : (
                          payments.slice(0, 5).map((pay) => (
                            <tr key={pay.id} className="border-b border-border/30 hover:bg-white/5">
                              <td className="py-2.5 font-medium text-white">{pay.email}</td>
                              <td className="py-2.5 font-mono">${pay.amount.toFixed(2)}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  pay.status === 'success' ? 'bg-green-500/10 text-green-500' :
                                  pay.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {pay.status}
                                </span>
                              </td>
                              <td className="py-2.5 text-text-muted font-mono">
                                {new Date(pay.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 text-center">
                                {pay.status === 'pending' && (
                                  <button
                                    onClick={() => handleApprovePayment(pay.email, pay.user_id, pay.id)}
                                    className="px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white rounded border border-green-500/30 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors"
                                  >
                                    Approve
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right panel: Controls helper */}
                <div className="bg-[#110d24]/60 border border-purple-500/15 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 font-mono">Quick Actions panel</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Set up test criteria. In the Accounts Manager tab, you can manually flip user access on and off. You can simulate direct checkout loops in the Transaction Logs tab.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider text-center"
                    >
                      Manage Accounts
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Tab 2: User Accounts Manager */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">User profiles directory</h3>
                
                {/* Search bar */}
                <div className="w-full sm:max-w-xs relative">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3.5 py-1.5 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple placeholder-text-muted"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-bg-secondary/40 border-b border-border/80 text-text-muted font-mono uppercase tracking-wider">
                        <th className="p-4">User</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Created At</th>
                        <th className="p-4 text-center">Premium Tier</th>
                        <th className="p-4 text-center">Admin Role</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-text-muted">
                            <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <span>Loading user directory...</span>
                          </td>
                        </tr>
                      ) : filteredProfiles.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-text-muted font-mono">
                            No profiles found matching search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredProfiles.map((p) => {
                          const pendingPayments = payments.filter(pay => pay.email === p.email && pay.status === 'pending');
                          const hasPendingPayment = pendingPayments.length > 0;
                          return (
                            <tr key={p.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                              <td className="p-4 font-semibold text-white font-mono flex items-center gap-2">
                                {p.username}
                                {hasPendingPayment && !p.is_premium && (
                                  <span className="inline-flex h-2 w-2 rounded-full bg-yellow-500 animate-ping" title="Has pending payment!" />
                                )}
                              </td>
                              <td className="p-4 text-text-muted font-mono">
                                {p.email || 'N/A'}
                                {hasPendingPayment && !p.is_premium && (
                                  <span className="block text-[9px] text-yellow-500 font-bold uppercase tracking-wider font-mono">⚠️ Paid (Pending Approval)</span>
                                )}
                              </td>
                              <td className="p-4 text-text-muted font-mono">
                                {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              {/* Toggle switches */}
                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePremium(p.id, p.is_premium)}
                                  className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                    p.is_premium
                                      ? 'bg-amber-500/10 border-amber-500/35 text-amber-500'
                                      : 'bg-white/5 border-white/10 text-gray-500'
                                  }`}
                                >
                                  {p.is_premium ? '👑 PREMIUM' : 'FREE'}
                                </button>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAdmin(p.id, p.is_admin)}
                                  className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                    p.is_admin
                                      ? 'bg-purple-500/10 border-purple-500/35 text-purple-400'
                                      : 'bg-white/5 border-white/10 text-gray-500'
                                  }`}
                                >
                                  {p.is_admin ? 'ADMIN' : 'MEMBER'}
                                </button>
                              </td>
                              <td className="p-4 text-center flex items-center justify-center gap-2">
                                {hasPendingPayment && !p.is_premium && (
                                  <button
                                    onClick={() => handleApprovePayment(p.email || '', p.id)}
                                    className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded border border-green-500/30 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors"
                                  >
                                    Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(p.id)}
                                  disabled={p.id === currentUser?.id}
                                  className="px-2 py-1 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded border border-red-500/20 font-mono text-[10px] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Transaction Logs & Simulators */}
          {activeTab === 'payments' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              
              {/* Payments table logs list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Billing Audit logs</h3>
                
                <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-bg-secondary/40 border-b border-border/80 text-text-muted font-mono uppercase tracking-wider">
                          <th className="p-4">Transaction ID</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Plan</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingPayments ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-text-muted">
                              <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                              <span>Loading payment logs...</span>
                            </td>
                          </tr>
                        ) : payments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-text-muted font-mono">No payment logs.</td>
                          </tr>
                        ) : (
                          payments.map((p) => (
                            <tr key={p.id} className="border-b border-border/30 hover:bg-white/5 font-mono">
                              <td className="p-4 text-text-muted truncate max-w-[120px]">{p.id}</td>
                              <td className="p-4 text-white font-semibold">{p.email}</td>
                              <td className="p-4 text-white font-bold">${p.amount.toFixed(2)}</td>
                              <td className="p-4 text-text-muted capitalize">{p.plan_type.replace('_', ' ')}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  p.status === 'success' ? 'bg-green-500/10 text-green-500' :
                                  p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {p.status === 'pending' && (
                                  <button
                                    onClick={() => handleApprovePayment(p.email, p.user_id, p.id)}
                                    className="px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white rounded border border-green-500/30 text-[9px] font-bold uppercase tracking-wider transition-colors"
                                  >
                                    Approve
                                  </button>
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

              {/* Payments Simulator Form */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 font-mono">Transaction Simulator</h3>
                
                <form onSubmit={handleSimulatePayment} className="bg-bg-card border border-border p-5 rounded-2xl shadow-level-2 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 font-mono">Select User Email</label>
                    <select
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple"
                    >
                      {profiles.map(u => (
                        <option key={u.id} value={u.email || u.username}>{u.email || u.username}</option>
                      ))}
                      <option value="external@visitor.com">Guest User (external@visitor.com)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 font-mono">Plan Tier</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setSimPlan('premium_monthly'); setSimAmount('9.99'); }}
                        className={`py-2 border rounded-lg text-xs font-bold font-mono transition-all ${
                          simPlan === 'premium_monthly' 
                            ? 'bg-purple-600 border-purple-500 text-white' 
                            : 'bg-bg-secondary border-border text-text-muted hover:border-text-primary'
                        }`}
                      >
                        Monthly ($9.99)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSimPlan('premium_yearly'); setSimAmount('99.99'); }}
                        className={`py-2 border rounded-lg text-xs font-bold font-mono transition-all ${
                          simPlan === 'premium_yearly' 
                            ? 'bg-purple-600 border-purple-500 text-white' 
                            : 'bg-bg-secondary border-border text-text-muted hover:border-text-primary'
                        }`}
                      >
                        Yearly ($99.99)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 font-mono">Transaction Status</label>
                    <select
                      value={simStatus}
                      onChange={(e) => setSimStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple"
                    >
                      <option value="success">Success (Grants Premium)</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSimulating}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-purple-600 to-accent-purple hover:opacity-90 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl shadow-lg border border-purple-500/30 transition-all disabled:opacity-50 mt-2"
                  >
                    {isSimulating ? 'Processing Transaction...' : '⚡ Log Checkout Simulation'}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* Tab 4: Operation Panels */}
          {activeTab === 'settings' && (
            <div className="max-w-lg space-y-6 animate-fade-in text-left">
              
              {/* Operations card */}
              <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono border-b border-border pb-3">System operations</h3>
                
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white">Maintenance Mode</p>
                    <p className="text-[10px] text-text-muted">Blocks movie content streams globally for maintenance.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMaintenanceMode(!maintenanceMode);
                      alert(`Maintenance Mode is now ${!maintenanceMode ? 'ENABLED' : 'DISABLED'}. (Demo mock toggle)`);
                    }}
                    className={`px-3 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      maintenanceMode 
                        ? 'bg-red-500/10 border-red-500/35 text-red-500' 
                        : 'bg-white/5 border-white/10 text-gray-500'
                    }`}
                  >
                    {maintenanceMode ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {/* Global Notification Panel */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white">Global Banner Notice</p>
                    <p className="text-[10px] text-text-muted">Broadcast a banner notification message to all profiles.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={globalNotice}
                      onChange={(e) => { setGlobalNotice(e.target.value); setNoticeSaved(false); }}
                      className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-purple"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNoticeSaved(true);
                        alert(`Banner notice broadcast updated: "${globalNotice}"`);
                      }}
                      className="px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider"
                    >
                      Update
                    </button>
                  </div>
                  {noticeSaved && (
                    <p className="text-[10px] text-green-500 font-mono">Notice saved and broadcasted.</p>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
