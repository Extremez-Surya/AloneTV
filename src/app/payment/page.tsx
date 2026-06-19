'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getLocalProfile } from '@/lib/supabase/profile';

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const redirectUrl = searchParams.get('redirect') || '/profile';
  const mediaTitle = searchParams.get('title') || '';
  
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [isCheckingUser, setIsCheckingUser] = useState<boolean>(true);
  
  type PlanKey = 'mobile' | 'basic' | 'standard' | 'premium';
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('mobile');

  const PLAN_DATA: Record<PlanKey, { label: string; plan_type: string; monthlyPriceINR: number; resolution: string; videoQuality: string; deviceCount: number; downloadDevices: number; spatialAudio?: boolean; }> = {
    mobile: {
      label: 'Mobile',
      plan_type: 'premium_mobile',
      monthlyPriceINR: 149,
      resolution: '480p',
      videoQuality: 'Fair',
      deviceCount: 1,
      downloadDevices: 1
    },
    basic: {
      label: 'Basic',
      plan_type: 'premium_basic',
      monthlyPriceINR: 199,
      resolution: '720p (HD)',
      videoQuality: 'Good',
      deviceCount: 1,
      downloadDevices: 1
    },
    standard: {
      label: 'Standard',
      plan_type: 'premium_standard',
      monthlyPriceINR: 499,
      resolution: '1080p (Full HD)',
      videoQuality: 'Great',
      deviceCount: 2,
      downloadDevices: 2
    },
    premium: {
      label: 'Premium',
      plan_type: 'premium_premium',
      monthlyPriceINR: 649,
      resolution: '4K (Ultra HD) + HDR',
      videoQuality: 'Best',
      deviceCount: 4,
      downloadDevices: 6,
      spatialAudio: true
    }
  };

  const [checkoutStep, setCheckoutStep] = useState<'plans' | 'qr' | 'success'>('plans');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>('');

  useEffect(() => {
    async function checkUser() {
      try {
        setIsCheckingUser(true);
        const local = getLocalProfile();
        if (local && local.demo) {
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
          // If not logged in, direct them to signin page, but preserve redirect details
          const queryParams = new URLSearchParams();
          if (redirectUrl) queryParams.set('redirect', redirectUrl);
          if (mediaTitle) queryParams.set('title', mediaTitle);
          router.push(`/signin?${queryParams.toString()}`);
        }
      } catch (err) {
        console.error('Failed to resolve authentication session:', err);
      } finally {
        setIsCheckingUser(false);
      }
    }
    checkUser();
  }, [router, redirectUrl, mediaTitle]);

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      const amount = PLAN_DATA[selectedPlan].monthlyPriceINR;
      const planLabel = PLAN_DATA[selectedPlan].plan_type;

      if (isDemo) {
        // Log locally for Demo Mode
        const newPayment = {
          id: 'pay-' + Date.now(),
          email: userEmail,
          user_id: userId,
          amount: amount,
          plan_type: planLabel,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        const stored = JSON.parse(localStorage.getItem('alonetv_mock_payments') || '[]');
        localStorage.setItem('alonetv_mock_payments', JSON.stringify([newPayment, ...stored]));
        setCheckoutStep('success');
      } else {
        // Log in live Supabase Database
        const supabase = createClient();
        const { error } = await supabase
          .from('payments')
          .insert({
            user_id: userId,
            email: userEmail,
            amount: amount,
            plan_type: planLabel,
            status: 'pending' // pending manual admin review
          });
        
        if (error) throw error;
        setCheckoutStep('success');
      }
    } catch (err: any) {
      console.error('Failed to register payment:', err);
      alert('Error logging payment details: ' + (err.message || 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-sm font-medium">Resolving your account status...</p>
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto w-full pt-12 pb-16">
      {/* Background aurora blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="relative bg-gradient-to-b from-[#130d2b] to-[#0a0715] border border-purple-500/25 p-6 sm:p-8 rounded-2xl shadow-level-4 text-left overflow-hidden">
        {/* Step 1: Plan Selection */}
        {checkoutStep === 'plans' ? (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-purple-400">Step 1 of 2</span>
              <h2 className="text-2xl font-bold text-white mt-1">Unlock AloneTV Premium</h2>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                {mediaTitle ? (
                  <>You are viewing a preview of <strong className="text-white">"{mediaTitle}"</strong>. Choose a membership plan to unlock full playback.</>
                ) : (
                  <>Unlock unlimited 4K/1080p movies, TV series, watch parties, audio dubs, and stream ad-free.</>
                )}
              </p>
            </div>

            {/* Plans List */}
            <div className="space-y-3">
              {/* Netflix-like tiers (custom wording, no trademark) */}
              <div className="space-y-3">
                {(['mobile','basic','standard','premium'] as const).map((key) => {
                  const isActive = selectedPlan === key;
                  const title = PLAN_DATA[key].label;
                  const price = `₹${PLAN_DATA[key].monthlyPriceINR}`;

                  const subtitle =
                    key === 'mobile'
                      ? '480p • Fair quality'
                      : key === 'basic'
                        ? '720p (HD) • Good quality'
                        : key === 'standard'
                          ? '1080p (Full HD) • Great quality'
                          : '4K (Ultra HD) + HDR • Best quality';

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPlan(key)}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isActive
                          ? 'border-purple-500 bg-purple-500/15 shadow-[0_0_15px_rgba(168,85,247,0.15)] text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-mono text-xs font-bold uppercase tracking-wider text-purple-300">
                          {title}
                          {key === 'basic' && isActive ? null : null}
                        </div>
                        <div className="text-[10px] text-text-muted">{subtitle}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white font-mono">{price}</div>
                        <div className="text-[9px] text-text-muted">per month</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tier perks preview */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2 text-[11px] font-mono text-gray-300 leading-relaxed">
                <div className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span><span>{PLAN_DATA[selectedPlan].resolution}</span></div>
                <div className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span><span>Multiple devices (same household)</span></div>
                {selectedPlan === 'premium' && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500 font-bold">✓</span>
                    <span>Spatial audio (immersive sound)</span>
                  </div>
                )}
              </div>


            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setCheckoutStep('qr')}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-purple-600 hover:opacity-90 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-purple-500/20 border border-purple-500/30 transition-all"
            >
              Continue to Payment (Scan QR)
            </button>
          </div>
        : null)}

        {/* Step 2: QR scan page */}
        {checkoutStep === 'qr' ? (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-purple-400">Step 2 of 2</span>
              <h2 className="text-xl font-bold text-white mt-1">Scan Payment QR Code</h2>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                Scan the QR code below and transfer exactly{' '}
                <span className="text-white font-bold font-mono">{`₹${PLAN_DATA[selectedPlan].monthlyPriceINR}`}</span>.

              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
              <img
                src="/qr.png"
                alt="Scan QR"
                className="w-48 h-48 object-contain rounded-xl border border-white/10 bg-white p-3"
              />
              <div className="mt-3 text-center space-y-1 z-10">
                <p className="text-[10px] text-accent-teal uppercase tracking-widest font-mono font-bold">UPI Scan & Pay</p>
                <p className="text-[10px] text-text-muted font-mono leading-normal max-w-xs">
                  Pay with any UPI client, credit card, or wallet app.
                </p>
              </div>
            </div>

            {/* Order Summary details */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-xs font-mono space-y-2">
              <div className="flex justify-between items-center text-text-muted">
                <span>Account:</span>
                <span className="text-white font-semibold">{userEmail}</span>
              </div>
              <div className="flex justify-between items-center text-text-muted">
                <span>Pass Selected:</span>
                <span className="text-white font-semibold uppercase">{PLAN_DATA[selectedPlan].label}</span>

              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2 text-text-muted">
                <span className="font-bold text-white">Amount Due:</span>
                <span className="text-amber-400 font-bold text-sm">{`₹${PLAN_DATA[selectedPlan].monthlyPriceINR}`}</span>

              </div>
            </div>

            {/* Confirm Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmPayment}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider hover:opacity-95 shadow-lg border border-emerald-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirming transfer log...
                  </>
                ) : (
                  '✔️ I Have Completed Payment'
                )}
              </button>

              <button
                type="button"
                onClick={() => setCheckoutStep('plans')}
                className="w-full py-2.5 text-center text-text-muted hover:text-white transition-colors text-xs font-mono uppercase tracking-wider"
              >
                ← Back to Plans
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Screen */}
        {checkoutStep === 'success' && (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center text-3xl mx-auto animate-bounce">
              ✓
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wider">Payment Submitted!</h2>
              <p className="text-xs text-text-muted leading-relaxed max-w-xs mx-auto">
                Your payment request has been logged successfully and is currently <span className="text-yellow-500 font-bold font-mono">PENDING</span> manual review.
              </p>
              <p className="text-[11px] text-text-muted/70 leading-relaxed max-w-sm mx-auto">
                Our site administrators will verify the transfer in the background and activate your Premium membership shortly. Thank you for your support!
              </p>
            </div>

            <div className="pt-6 border-t border-white/5">
              <Link
                href={redirectUrl}
                className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider block text-center transition-colors"
              >
                Return to Content
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="theme-dark min-h-screen bg-bg-primary text-text-primary pt-[100px] pb-12 px-4 relative flex flex-col justify-center">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm font-medium">Loading checkout details...</p>
        </div>
      }>
        <PaymentPageContent />
      </Suspense>
    </div>
  );
}
