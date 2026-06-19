'use client';

import { useState } from 'react';
import { getLocalProfile } from '@/lib/supabase/profile';
import { createClient } from '@/lib/supabase/client';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaTitle?: string;
  onPaymentSubmitted?: () => void;
}

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  mediaTitle,
  onPaymentSubmitted
}: PremiumUpgradeModalProps) {
  const [checkoutStep, setCheckoutStep] = useState<'plans' | 'qr' | 'success'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  if (!isOpen) return null;

  const handleConfirmPayment = async () => {
    setIsSubmittingPayment(true);
    try {
      const amount = selectedPlan === 'monthly' ? 9.99 : 99.99;
      const planLabel = selectedPlan === 'monthly' ? 'premium_monthly' : 'premium_yearly';
      
      const local = getLocalProfile();
      
      if (local && local.demo) {
        // Log in Demo Mode local storage
        const newPayment = {
          id: 'pay-' + Date.now(),
          email: local.email || 'demo@example.com',
          amount: amount,
          plan_type: planLabel,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        const stored = JSON.parse(localStorage.getItem('alonetv_mock_payments') || '[]');
        localStorage.setItem('alonetv_mock_payments', JSON.stringify([newPayment, ...stored]));
        
        setCheckoutStep('success');
        if (onPaymentSubmitted) onPaymentSubmitted();
      } else {
        // Authenticated Supabase session
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('payments')
            .insert({
              user_id: user.id,
              email: user.email,
              amount: amount,
              plan_type: planLabel,
              status: 'pending' // logged as pending
            });
          if (error) throw error;
          
          setCheckoutStep('success');
          if (onPaymentSubmitted) onPaymentSubmitted();
        } else {
          alert('You must be logged in to confirm a payment.');
        }
      }
    } catch (err: any) {
      console.error('Failed to submit checkout transaction:', err);
      alert('Error: ' + (err.message || 'Failed to submit payment confirmation.'));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleClose = () => {
    setCheckoutStep('plans');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-gradient-to-b from-[#130d2b] to-[#0a0715] border border-purple-500/30 p-6 rounded-2xl shadow-level-4 text-left relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-lg">👑</span>
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">AloneTV Premium</h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-text-muted hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1: Selection */}
        {checkoutStep === 'plans' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-bold text-white">Unlock Streaming Access</h4>
              <p className="text-xs text-text-muted leading-relaxed mt-1">
                {mediaTitle ? (
                  <>Enjoy the full duration of "{mediaTitle}" in high quality 1080p and 4K resolution.</>
                ) : (
                  <>Gain full access to all movie streaming servers, high definition quality, and synced watch parties.</>
                )}
                {' '}Choose a plan to continue.
              </p>
            </div>

            {/* Plan Choices */}
            <div className="grid grid-cols-2 gap-3 py-2">
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-28 ${
                  selectedPlan === 'monthly'
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Monthly Pass</span>
                <div>
                  <span className="text-lg font-bold text-white font-mono">$9.99</span>
                  <span className="text-[10px] text-text-muted"> / month</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('yearly')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-28 ${
                  selectedPlan === 'yearly'
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Yearly Pass</span>
                <div>
                  <span className="text-lg font-bold text-white font-mono">$99.99</span>
                  <span className="text-[10px] text-text-muted"> / year</span>
                  <div className="text-[9px] text-green-400 font-bold font-mono">SAVE 20%</div>
                </div>
              </button>
            </div>

            {/* Perks list */}
            <div className="space-y-2 py-3 border-y border-white/5 font-mono text-[10px] text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-purple-500 font-bold">✓</span>
                <span>Unlimited 4K/1080p Streaming Access</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500 font-bold">✓</span>
                <span>Ad-Free Streams & Co-Watching Sync</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCheckoutStep('qr')}
                className="w-full py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider bg-gradient-to-r from-amber-500 via-purple-600 to-accent-purple text-white hover:opacity-95 transition-all shadow-lg shadow-purple-500/20 border border-purple-500/30"
              >
                Proceed to QR Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 2: QR Payment */}
        {checkoutStep === 'qr' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-white uppercase tracking-wider font-mono">Scan QR to Complete Payment</h4>
              <p className="text-xs text-text-muted">
                Transfer exactly <span className="text-white font-bold font-mono">{selectedPlan === 'monthly' ? '$9.99' : '$99.99'}</span> to activate premium.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl">
              <img
                src="/qr.png"
                alt="Payment QR Code"
                className="w-44 h-44 object-contain rounded-lg border border-border bg-white p-2"
              />
              <p className="text-[10px] text-text-muted mt-2 font-mono text-center leading-normal">
                UPI / Scan & Pay supported. Please transfer matching funds.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={isSubmittingPayment}
                onClick={handleConfirmPayment}
                className="w-full py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-95 transition-all shadow-lg border border-emerald-500/30 flex items-center justify-center gap-1.5 disabled:opacity-55"
              >
                {isSubmittingPayment ? 'Submitting Transfer Log...' : '✔️ I Have Paid (Confirm Payment)'}
              </button>
              
              <button
                type="button"
                onClick={() => setCheckoutStep('plans')}
                className="w-full py-2 text-center text-text-muted hover:text-white text-xs font-mono uppercase tracking-wider"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Screen */}
        {checkoutStep === 'success' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center text-3xl mx-auto animate-bounce">
              ✓
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-white font-mono uppercase tracking-wider">Payment Submitted!</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Your transfer has been logged as <span className="text-yellow-500 font-bold font-mono">PENDING</span>.
              </p>
              <p className="text-[11px] text-text-muted/80 leading-relaxed max-w-sm mx-auto">
                Since premium accounts are approved manually, our site administrators will verify the payment transaction and activate your premium plan shortly.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
