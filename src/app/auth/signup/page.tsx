'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      // Try to sign in right away (if email confirmation is disabled in Supabase)
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInErr) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setSuccess(true);
        setLoading(false);
      }
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-mark">⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>Zenith</div>
            <div className="auth-subtitle">Level up every single day</div>
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📬</div>
            <h3 style={{ marginBottom: 8 }}>Check your email</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              We sent a confirmation link to <strong style={{ color:'var(--text-primary)' }}>{email}</strong>. Click it to activate your account.
            </p>
            <Link href="/auth/login" className="btn btn-primary" style={{ display:'inline-flex', marginTop: 24 }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: 4 }}>Create your account</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Free forever. No credit card needed.</p>

            <form className="auth-form" onSubmit={handleSignup}>
              {error && <div className="auth-error">{error}</div>}

              <div className="input-group">
                <label className="input-label" htmlFor="email">Email address</label>
                <input id="email" type="email" className="input" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="password">Password</label>
                <input id="password" type="password" className="input" placeholder="Min. 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="confirm">Confirm password</label>
                <input id="confirm" type="password" className="input" placeholder="Repeat password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>

              <button id="signup-btn" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <span className="spinner" /> : 'Create Account →'}
              </button>
            </form>

            <div className="auth-footer">
              Already have an account?{' '}
              <Link href="/auth/login">Sign in</Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
