'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getLocalProfile } from '@/lib/supabase/profile';

/* ─────────────────────────────────────────────────
   Plan data — Netflix-style structure with rich features
───────────────────────────────────────────────── */
type PlanKey = 'mobile' | 'basic' | 'standard' | 'premium';

interface PlanFeature {
  label: string;
  value: string | number | boolean;
  highlight?: boolean;
}

interface Plan {
  key: PlanKey;
  label: string;
  plan_type: string;
  resolution: string;
  resolutionBadge: string;
  priceINR: number;
  videoQuality: string;
  supportedDevices: string;
  simultaneousStreams: number;
  downloadDevices: number;
  spatialAudio: boolean;
  adFree: boolean;
  offlineDownloads: boolean;
  earlyAccess: boolean;
  gradientFrom: string;
  gradientTo: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    key: 'mobile',
    label: 'Mobile',
    plan_type: 'premium_mobile',
    resolution: '480p',
    resolutionBadge: '480p',
    priceINR: 149,
    videoQuality: 'Fair',
    supportedDevices: 'Mobile phone, tablet',
    simultaneousStreams: 1,
    downloadDevices: 1,
    spatialAudio: false,
    adFree: true,
    offlineDownloads: true,
    earlyAccess: false,
    gradientFrom: '#1a3a6b',
    gradientTo: '#0f2248',
  },
  {
    key: 'basic',
    label: 'Basic',
    plan_type: 'premium_basic',
    resolution: '720p (HD)',
    resolutionBadge: '720p',
    priceINR: 199,
    videoQuality: 'Good',
    supportedDevices: 'TV, computer, mobile phone, tablet',
    simultaneousStreams: 1,
    downloadDevices: 1,
    spatialAudio: false,
    adFree: true,
    offlineDownloads: true,
    earlyAccess: false,
    gradientFrom: '#4c1d95',
    gradientTo: '#2e1065',
    popular: true,
  },
  {
    key: 'standard',
    label: 'Standard',
    plan_type: 'premium_standard',
    resolution: '1080p (Full HD)',
    resolutionBadge: '1080p',
    priceINR: 499,
    videoQuality: 'Great',
    supportedDevices: 'TV, computer, mobile phone, tablet',
    simultaneousStreams: 2,
    downloadDevices: 2,
    spatialAudio: false,
    adFree: true,
    offlineDownloads: true,
    earlyAccess: false,
    gradientFrom: '#5b21b6',
    gradientTo: '#1e40af',
  },
  {
    key: 'premium',
    label: 'Premium',
    plan_type: 'premium_premium',
    resolution: '4K (Ultra HD) + HDR',
    resolutionBadge: '4K+HDR',
    priceINR: 649,
    videoQuality: 'Best',
    supportedDevices: 'TV, computer, mobile phone, tablet',
    simultaneousStreams: 4,
    downloadDevices: 6,
    spatialAudio: true,
    adFree: true,
    offlineDownloads: true,
    earlyAccess: true,
    gradientFrom: '#7c1d2e',
    gradientTo: '#4c0519',
  },
];

const FEATURE_ROWS: { key: keyof Plan; label: string }[] = [
  { key: 'priceINR', label: 'Monthly price' },
  { key: 'videoQuality', label: 'Video and sound quality' },
  { key: 'resolution', label: 'Resolution' },
  { key: 'supportedDevices', label: 'Supported devices' },
  { key: 'simultaneousStreams', label: 'Streams at same time' },
  { key: 'downloadDevices', label: 'Download devices' },
  { key: 'adFree', label: 'Ad-free viewing' },
  { key: 'offlineDownloads', label: 'Offline downloads' },
  { key: 'spatialAudio', label: 'Spatial audio (immersive)' },
  { key: 'earlyAccess', label: 'Early access & premieres' },
];

function renderFeatureValue(val: string | number | boolean, key: keyof Plan) {
  if (key === 'priceINR') return `₹${val}/mo`;
  if (typeof val === 'boolean') {
    return val ? (
      <span className="text-green-400 text-base font-bold">✓</span>
    ) : (
      <span className="text-white/20 text-base">—</span>
    );
  }
  return String(val);
}

/* ─────────────────────────────────────────────────
   Main page content (needs Suspense for useSearchParams)
───────────────────────────────────────────────── */
function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get('redirect') || '/profile';
  const mediaTitle = searchParams.get('title') || '';

  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('standard');
  const [checkoutStep, setCheckoutStep] = useState<'plans' | 'qr' | 'success'>('plans');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function checkUser() {
      try {
        setIsCheckingUser(true);
        const local = getLocalProfile();
        if (local?.demo) {
          setIsDemo(true);
          setUserEmail(local.email || 'demo@example.com');
          setUserId(local.id || 'demo-user-id');
          setIsCheckingUser(false);
          return;
        }
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          setUserId(user.id);
        } else {
          const q = new URLSearchParams();
          if (redirectUrl) q.set('redirect', redirectUrl);
          if (mediaTitle) q.set('title', mediaTitle);
          router.push(`/signin?${q.toString()}`);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsCheckingUser(false);
      }
    }
    checkUser();
  }, [router, redirectUrl, mediaTitle]);

  const plan = PLANS.find(p => p.key === selectedPlan)!;

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      if (isDemo) {
        const newPayment = {
          id: 'pay-' + Date.now(),
          email: userEmail,
          user_id: userId,
          amount: plan.priceINR,
          plan_type: plan.plan_type,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        const stored = JSON.parse(localStorage.getItem('alonetv_mock_payments') || '[]');
        localStorage.setItem('alonetv_mock_payments', JSON.stringify([newPayment, ...stored]));
      } else {
        const supabase = createClient();
        const { error } = await supabase.from('payments').insert({
          user_id: userId,
          email: userEmail,
          amount: plan.priceINR,
          plan_type: plan.plan_type,
          status: 'pending',
        });
        if (error) throw error;
      }
      setCheckoutStep('success');
    } catch (err: any) {
      console.error('Payment log failed:', err);
      alert('Error: ' + (err.message || 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-sm font-medium">Checking your account...</p>
      </div>
    );
  }

  /* ── STEP 1: Plan Selection ── */
  if (checkoutStep === 'plans') {
    return (
      <div className="w-full max-w-[1300px] mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-left">
          <p className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-1">Step 1 of 2</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Choose the plan that&apos;s right for you
          </h1>
          {mediaTitle && (
            <p className="mt-2 text-sm text-text-muted">
              Unlock full playback of <span className="text-white font-semibold">&ldquo;{mediaTitle}&rdquo;</span>
            </p>
          )}
        </div>

        {/* Plan cards — horizontal like Netflix */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {PLANS.map((p) => {
            const isActive = selectedPlan === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPlan(p.key)}
                className={`relative flex flex-col rounded-2xl overflow-hidden text-left border-2 transition-all duration-200 focus:outline-none ${
                  isActive
                    ? 'border-purple-400 shadow-[0_0_0_3px_rgba(168,85,247,0.3),0_8px_32px_rgba(168,85,247,0.2)]'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {/* Popular badge */}
                {p.popular && (
                  <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-center py-1 bg-gradient-to-r from-purple-600 to-indigo-600">
                    <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-white">Most Popular</span>
                  </div>
                )}

                {/* Gradient header */}
                <div
                  className="relative flex flex-col justify-end px-4 pb-4 pt-8 min-h-[90px]"
                  style={{ background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-extrabold text-white leading-none">{p.label}</p>
                      <p className="text-sm font-semibold text-white/70 mt-0.5">{p.resolutionBadge}</p>
                    </div>
                    {isActive && (
                      <div className="w-6 h-6 rounded-full bg-white/20 border-2 border-white flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-3 h-3 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Feature rows */}
                <div className="flex-1 bg-[#0e0a1f] divide-y divide-white/5">
                  {FEATURE_ROWS.map(({ key, label }) => {
                    const val = p[key] as string | number | boolean;
                    return (
                      <div key={key} className="px-4 py-3">
                        <p className="text-[10px] text-purple-300/70 uppercase tracking-wider font-mono mb-0.5">{label}</p>
                        <p className={`text-sm font-semibold ${key === 'priceINR' ? 'text-amber-400 text-base font-bold font-mono' : 'text-white'}`}>
                          {renderFeatureValue(val, key)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footnote */}
        <p className="text-[11px] text-text-muted/70 leading-relaxed mb-8 max-w-3xl font-sans">
          HD (720p), Full HD (1080p), Ultra HD (4K) and HDR availability subject to your internet service and device capabilities.
          Not all content is available in all resolutions. Only people who live with you may use your account.
          Live events may include ads.
        </p>

        {/* Next button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <button
            type="button"
            onClick={() => setCheckoutStep('qr')}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base rounded-xl shadow-lg shadow-purple-500/25 border border-purple-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Next — Pay ₹{plan.priceINR}/mo
          </button>
          {redirectUrl !== '/profile' && (
            <Link
              href={redirectUrl}
              className="px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white font-semibold text-sm rounded-xl transition-all"
            >
              ← Back to content
            </Link>
          )}
        </div>
      </div>
    );
  }

  /* ── STEP 2: QR Payment ── */
  if (checkoutStep === 'qr') {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-1">Step 2 of 2</p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Scan &amp; Pay</h1>
          <p className="mt-1 text-sm text-text-muted">
            Transfer exactly{' '}
            <span className="text-amber-400 font-bold font-mono">₹{plan.priceINR}</span>
            {' '}using any UPI app, then confirm below.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0e0a1f] border border-purple-500/20 rounded-2xl overflow-hidden shadow-level-4">
          {/* Plan summary bar */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${plan.gradientFrom}, ${plan.gradientTo})` }}
          >
            <div>
              <p className="text-xs font-mono text-white/60 uppercase tracking-widest">Selected Plan</p>
              <p className="text-xl font-extrabold text-white">{plan.label} — {plan.resolutionBadge}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-white/60">Due now</p>
              <p className="text-2xl font-extrabold text-amber-300 font-mono">₹{plan.priceINR}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-lg">
                <img
                  src="/qr.png"
                  alt="UPI QR Code"
                  className="w-52 h-52 object-contain rounded-lg"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-accent-teal font-mono">
                  UPI Scan &amp; Pay
                </p>
                <p className="text-xs text-text-muted">
                  Use GPay, PhonePe, Paytm, BHIM, or any UPI app
                </p>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-black/40 rounded-xl border border-white/5 divide-y divide-white/5 text-xs font-mono">
              <div className="flex justify-between px-4 py-3 text-text-muted">
                <span>Account</span>
                <span className="text-white font-semibold truncate max-w-[200px]">{userEmail}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-text-muted">
                <span>Plan</span>
                <span className="text-white font-semibold uppercase">{plan.label}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-text-muted">
                <span>Resolution</span>
                <span className="text-white font-semibold">{plan.resolution}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-text-muted">
                <span>Billing</span>
                <span className="text-white font-semibold">Monthly</span>
              </div>
              <div className="flex justify-between px-4 py-3 font-bold border-t border-white/10">
                <span className="text-white">Total Due</span>
                <span className="text-amber-400 text-sm">₹{plan.priceINR}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmPayment}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-lg border border-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging payment...
                  </>
                ) : (
                  '✔ I Have Completed the Payment'
                )}
              </button>
              <button
                type="button"
                onClick={() => setCheckoutStep('plans')}
                className="w-full py-3 text-text-muted hover:text-white transition-colors text-xs font-mono uppercase tracking-wider text-center"
              >
                ← Change Plan
              </button>
            </div>

            <p className="text-[10px] text-text-muted/60 text-center leading-relaxed">
              After payment confirmation, our admin team will verify your transfer and activate your{' '}
              <span className="text-purple-400 font-semibold">{plan.label}</span> membership within a few hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP 3: Success ── */
  return (
    <div className="w-full max-w-md mx-auto px-4 py-10 text-center">
      <div className="bg-[#0e0a1f] border border-green-500/20 rounded-2xl p-8 space-y-6 shadow-level-4">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 text-green-400 flex items-center justify-center text-4xl mx-auto animate-bounce">
          ✓
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white font-mono uppercase tracking-wider">Payment Logged!</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Your payment request has been recorded as{' '}
            <span className="text-yellow-400 font-bold font-mono">PENDING</span> manual review.
          </p>
          <p className="text-xs text-text-muted/70 leading-relaxed">
            Our admins will verify the UPI transfer and activate your{' '}
            <span className="text-purple-400 font-semibold">{plan.label}</span> plan shortly.
            You&apos;ll be able to watch premium content once approved. Thank you!
          </p>
        </div>
        <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
          <Link
            href={redirectUrl}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold font-mono uppercase tracking-wider block text-center transition-colors"
          >
            Return to Content
          </Link>
          <Link
            href="/profile"
            className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-xs font-mono uppercase tracking-wider block text-center transition-colors"
          >
            View My Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Root export with Suspense boundary
───────────────────────────────────────────────── */
export default function PaymentPage() {
  return (
    <div className="theme-dark min-h-screen bg-bg-primary text-text-primary pt-[80px] pb-16 relative">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-text-muted text-sm font-medium">Loading plans...</p>
          </div>
        }
      >
        <PaymentPageContent />
      </Suspense>
    </div>
  );
}
