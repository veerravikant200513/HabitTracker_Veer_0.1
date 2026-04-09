'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  
  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      setPassword('');
    }
    setLoading(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/auth/login');
  }

  return (
    <>
      <header className="page-header">
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-secondary">Manage your account and interface settings.</p>
      </header>

      <div className="max-w-2xl flex flex-col gap-6">
        
        {/* Account Details */}
        <div className="card bento-12">
          <h2 className="text-lg font-semibold mb-4">Account Security</h2>
          
          <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4 max-w-sm">
            <div className="input-group">
              <label className="input-label">Update Password</label>
              <input 
                type="password" 
                className="input" 
                placeholder="New password (min 8 chars)" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div>
              <button type="submit" className="btn btn-primary" disabled={!password || loading}>
                {loading ? <span className="spinner" /> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* App SettingsPlaceholder */}
        <div className="card bento-12 opacity-75">
          <h2 className="text-lg font-semibold mb-4 text-muted">Theme Preferences (Coming Soon)</h2>
          <p className="text-sm text-secondary mb-4">
            Customise the look and feel of Zenith. We are currently locked into the deep dark matter theme for ultimate focus.
          </p>
          <div className="flex gap-2">
            <button className="btn btn-secondary" disabled>Dark Mode (Active)</button>
            <button className="btn btn-ghost" disabled>Light Mode</button>
          </div>
        </div>
        
        {/* Danger Zone */}
        <div className="card bento-12 border border-[var(--error)] bg-[rgba(239,68,68,0.02)]">
          <h2 className="text-lg font-semibold mb-2 text-error">Danger Zone</h2>
          <p className="text-sm text-secondary mb-4">You can log out of your active session here.</p>
          <button onClick={handleSignOut} className="btn btn-danger">
            Sign Out
          </button>
        </div>

      </div>
    </>
  );
}
