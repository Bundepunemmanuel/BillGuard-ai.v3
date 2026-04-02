import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, CreditCard, Shield, AlertTriangle, LogOut, Trash2, CheckCircle, PartyPopper } from 'lucide-react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import { cn } from './utils';

function PlanBadge({ plan }: { plan: string }) {
  const config: Record<string, { label: string; className: string }> = {
    free: { label: 'Free', className: 'bg-white/10 text-white/60 border border-white/10' },
    starter: { label: 'Starter', className: 'bg-info/10 text-info border border-info/20' },
    pro: { label: 'Pro ★', className: 'bg-gold/10 text-gold border border-gold/20' },
  };
  const c = config[plan] || config.free;
  return <span className={cn('px-3 py-1 rounded-full text-sm font-bold', c.className)}>{c.label}</span>;
}

export default function Settings() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      // Refresh profile to show new plan
      refreshProfile();
      // Remove query param from URL
      navigate('/settings', { replace: true });
      // Auto-dismiss after 5 seconds
      setTimeout(() => setPaymentSuccess(false), 5000);
    }
  }, []);
  const [deleteInput, setDeleteInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const plan = profile?.plan || 'free';
  const auditsUsed = profile?.audits_used || 0;
  const auditsLimit = profile?.audits_limit || 5;
  const usagePercent = Math.min((auditsUsed / auditsLimit) * 100, 100);

  const memberSince = user?.created_at
    ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
        .format(new Date(user.created_at))
    : 'Unknown';

  const expiryText = profile?.expiry
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })
        .format(new Date(profile.expiry))
    : 'No expiry (Free plan)';

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        user?.email || '',
        { redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset` }
      );
      if (error) throw error;
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to send reset email.' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    try {
      await supabase.from('users').delete().eq('id', user?.id);
      await supabase.from('audits').delete().eq('user_id', user?.id);
      await supabase.auth.signOut();
      navigate('/login');
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete account.' });
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-white/60">Manage your account and subscription.</p>
      </div>

      {paymentSuccess && (
        <div className="p-4 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center gap-3">
          <PartyPopper size={20} />
          <p className="font-medium">🎉 Payment successful! Your plan is now active.</p>
        </div>
      )}

      {message && (
        <div className={cn(
          'p-4 rounded-xl flex items-center gap-3',
          message.type === 'success' ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-danger/10 border border-danger/20 text-danger'
        )}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Account Section */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <User className="text-primary" size={20} />
          <h2 className="font-bold text-white/60 uppercase text-xs tracking-widest">Account</h2>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-white/5">
          <span className="text-white/60">Email</span>
          <span className="font-medium">{user?.email}</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="text-white/60">Member Since</span>
          <span className="font-medium">{memberSince}</span>
        </div>
      </div>

      {/* Plan & Usage Section */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="text-primary" size={20} />
          <h2 className="font-bold text-white/60 uppercase text-xs tracking-widest">Plan & Usage</h2>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-white/5">
          <span className="text-white/60">Current Plan</span>
          <PlanBadge plan={plan} />
        </div>

        <div className="py-3 border-b border-white/5 space-y-2">
          <div className="flex justify-between">
            <span className="text-white/60">Audits Used</span>
            <span className="font-mono font-bold">{auditsUsed} of {auditsLimit === 999999 ? '∞' : auditsLimit}</span>
          </div>
          {auditsLimit !== 999999 && (
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  usagePercent > 80 ? 'bg-danger' : 'bg-primary'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center py-3 border-b border-white/5">
          <span className="text-white/60">Audits Remaining</span>
          <span className={cn('font-bold', auditsUsed >= auditsLimit ? 'text-danger' : 'text-primary')}>
            {auditsLimit === 999999 ? 'Unlimited' : Math.max(0, auditsLimit - auditsUsed) + ' remaining'}
          </span>
        </div>

        <div className="flex justify-between items-center py-3">
          <span className="text-white/60">Plan Expires</span>
          <span className={cn(
            'font-medium',
            profile?.expiry && new Date(profile.expiry) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              ? 'text-danger' : ''
          )}>{expiryText}</span>
        </div>

        {plan !== 'pro' && (
          <button
            onClick={() => navigate('/pricing')}
            className="btn-primary w-full mt-2"
          >
            Upgrade Plan →
          </button>
        )}
      </div>

      {/* Security Section */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-primary" size={20} />
          <h2 className="font-bold text-white/60 uppercase text-xs tracking-widest">Security</h2>
        </div>
        <button
          onClick={handleResetPassword}
          className="w-full py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all font-medium flex items-center justify-center gap-2"
        >
          {resetSent ? (
            <>
              <CheckCircle className="text-primary" size={18} />
              <span className="text-primary">Reset link sent to your email</span>
            </>
          ) : (
            'Change Password'
          )}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 space-y-4 border border-danger/20">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-danger" size={20} />
          <h2 className="font-bold text-danger/80 uppercase text-xs tracking-widest">Danger Zone</h2>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-danger text-white rounded-xl hover:bg-danger/90 transition-all font-bold flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 border border-danger/30 text-danger rounded-xl hover:bg-danger/5 transition-all font-bold flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Delete Account
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-danger/5 rounded-xl border border-danger/20">
            <p className="text-sm text-danger font-medium">This cannot be undone. Type DELETE to confirm:</p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="input-field w-full"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                className="py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE'}
                className="py-2 bg-danger text-white rounded-lg hover:bg-danger/90 transition-all text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
