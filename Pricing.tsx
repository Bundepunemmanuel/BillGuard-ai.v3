import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { createPaymentInvoice } from './payments';
import { useAuth } from './AuthContext';
import { cn } from './utils';

const ADMIN_EMAILS = ['e8318276@gmail.com', 'billguard.ai@gmail.com'];

export default function Pricing() {
  const { user, profile, refreshProfile } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  const plans = [
    {
      name: 'free', price: 0, label: 'FREE',
      badge: null, borderClass: '',
      buttonText: 'Get Started Free',
      buttonClass: 'border border-white/20 hover:bg-white/5',
      features: [
        { text: '5 audits per month', ok: true },
        { text: 'Basic detection', ok: true },
        { text: '7-day history', ok: true },
        { text: 'Dispute email', ok: false },
        { text: 'Risk Dashboard', ok: false },
        { text: 'Cost Intelligence', ok: false },
      ]
    },
    {
      name: 'starter', price: 15, label: 'STARTER',
      badge: 'MOST POPULAR', borderClass: 'border-primary/40',
      buttonText: 'Pay $15 with USDT',
      buttonClass: 'bg-primary text-background hover:bg-primary/90',
      features: [
        { text: '25 audits per month', ok: true },
        { text: 'Full audit + dispute email', ok: true },
        { text: 'Unlimited history', ok: true },
        { text: 'Risk Dashboard', ok: true },
        { text: 'Multi-language support', ok: true },
        { text: 'Cost Intelligence', ok: false },
      ]
    },
    {
      name: 'pro', price: 49, label: 'PRO',
      badge: null, borderClass: 'border-gold/30',
      buttonText: 'Pay $49 with USDT',
      buttonClass: 'bg-gold text-background hover:bg-gold/90',
      features: [
        { text: 'Unlimited audits', ok: true },
        { text: 'Full audit + dispute email', ok: true },
        { text: 'Unlimited history', ok: true },
        { text: 'Risk Dashboard + Cost Intelligence', ok: true },
        { text: 'Multi-language + currency', ok: true },
        { text: 'Priority AI processing', ok: true },
      ]
    }
  ];

  const handlePay = async (planName: string, planPrice: number) => {
    if (planPrice === 0) return;
    setLoadingPlan(planName);
    setError(null);
    try {
      await createPaymentInvoice(planPrice, planName, user?.email || '');
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setLoadingPlan(null);
    }
  };

  const handleAdminActivate = async (planName: string) => {
    if (!user?.email) return;
    const limits: Record<string, number> = { free: 5, starter: 25, pro: 999999 };
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    const { supabase } = await import('./supabase');
    const { error } = await supabase.from('users').upsert({
      email: user.email,
      plan: planName,
      audits_used: 0,
      audits_limit: limits[planName] || 5,
      expiry: expiry.toISOString()
    }, { onConflict: 'email' });
    if (error) { alert('Failed: ' + error.message); return; }
    await refreshProfile();
    alert(planName + ' plan activated!');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-white/60">Catch overcharges. Pay with USDT.</p>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.name} className={cn('glass-card p-6 flex flex-col space-y-6 relative', plan.borderClass)}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-background text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{plan.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-white/40">/month</span>
              </div>
            </div>
            <ul className="space-y-3 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  {f.ok ? <Check size={16} className="text-primary mt-0.5 flex-shrink-0" /> : <X size={16} className="text-white/20 mt-0.5 flex-shrink-0" />}
                  <span className={cn('text-sm', !f.ok && 'text-white/30')}>{f.text}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <button
                onClick={() => handlePay(plan.name, plan.price)}
                disabled={loadingPlan === plan.name || plan.price === 0}
                className={cn('w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2', plan.buttonClass, loadingPlan === plan.name && 'opacity-70 cursor-not-allowed')}
              >
                {loadingPlan === plan.name ? <><Loader2 size={18} className="animate-spin" />Creating...</> : plan.buttonText}
              </button>
              {plan.price > 0 && <p className="text-center text-xs text-white/30">USDT TRC20 · Card coming soon</p>}
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="glass-card p-6 border border-white/5 space-y-4">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Admin Test Panel</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleAdminActivate('starter')} className="py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-sm font-bold">Activate Starter (Test)</button>
            <button onClick={() => handleAdminActivate('pro')} className="py-3 border border-gold/20 text-gold rounded-xl hover:bg-gold/5 transition-all text-sm font-bold">Activate Pro (Test)</button>
          </div>
        </div>
      )}
    </div>
  );
}
