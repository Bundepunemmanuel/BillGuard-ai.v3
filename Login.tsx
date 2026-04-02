import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from './supabase';
import { cn } from './utils';

type Mode = 'signin' | 'signup' | 'forgot' | 'resend';

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password. Please try again.';
  if (msg.includes('Email not confirmed')) return 'Please confirm your email first. Check your inbox or resend below.';
  if (msg.includes('User already registered') || msg.includes('already been registered')) return 'Account already exists. Please sign in instead.';
  if (msg.includes('Password should')) return 'Password must be at least 6 characters.';
  if (msg.includes('Unable to validate')) return 'Please enter a valid email address.';
  return 'Something went wrong. Please try again.';
}

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const reset = () => { setError(null); setSuccess(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');

      } else if (mode === 'signup') {
        if (password !== confirm) throw new Error('Passwords do not match.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Check your email for the confirmation link!');

      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset`,
        });
        if (error) throw error;
        setSuccess('Password reset link sent. Check your inbox.');

      } else if (mode === 'resend') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback` },
        });
        if (error) throw error;
        setSuccess('Confirmation email sent. Check your inbox.');
      }
    } catch (err: any) {
      setError(translateError(err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, { heading: string; sub: string }> = {
    signin: { heading: 'Welcome Back', sub: 'Sign in to access your freight audits.' },
    signup: { heading: 'Create Account', sub: 'Start auditing freight invoices today.' },
    forgot: { heading: 'Reset Password', sub: 'We\'ll send a reset link to your email.' },
    resend: { heading: 'Resend Confirmation', sub: 'We\'ll resend your confirmation email.' },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">

        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl border border-gold/30 mx-auto">
            <Shield className="text-gold fill-gold" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">BillGuard <span className="text-primary">AI</span></h1>
            <p className="text-white/50 text-sm mt-1">{titles[mode].sub}</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-xl font-bold text-center">{titles[mode].heading}</h2>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-primary/10 border border-primary/20 text-primary text-sm rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field w-full pl-9 text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password */}
            {(mode === 'signin' || mode === 'signup') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field w-full pl-9 pr-9 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm password */}
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="input-field w-full pl-9 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : mode === 'signin' ? 'Sign In →'
                : mode === 'signup' ? 'Create Account →'
                : mode === 'forgot' ? 'Send Reset Link →'
                : 'Resend Confirmation →'}
            </button>
          </form>

          {/* Links */}
          <div className="space-y-2 text-center text-sm">
            {mode === 'signin' && (
              <>
                <div className="flex justify-between text-white/40">
                  <button onClick={() => { setMode('forgot'); reset(); }} className="hover:text-white transition-colors">
                    Forgot password?
                  </button>
                  <button onClick={() => { setMode('resend'); reset(); }} className="hover:text-white transition-colors">
                    Resend confirmation
                  </button>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <button onClick={() => { setMode('signup'); reset(); }} className="text-white/40 hover:text-white transition-colors">
                    Don't have an account? <span className="text-primary">Sign up</span>
                  </button>
                </div>
              </>
            )}
            {mode === 'signup' && (
              <button onClick={() => { setMode('signin'); reset(); }} className="text-white/40 hover:text-white transition-colors">
                Already have an account? <span className="text-primary">Sign in</span>
              </button>
            )}
            {(mode === 'forgot' || mode === 'resend') && (
              <button onClick={() => { setMode('signin'); reset(); }} className="text-white/40 hover:text-white transition-colors">
                ← Back to sign in
              </button>
            )}
          </div>

          <p className="text-center text-xs text-white/20">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
