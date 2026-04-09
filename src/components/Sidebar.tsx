'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/auth/login');
  };

  const navItems = [
    { name: 'Dashboard',   path: '/dashboard',          icon: '📊' },
    { name: 'Habits',      path: '/dashboard/habits',   icon: '✅' },
    { name: 'Projects',    path: '/dashboard/projects', icon: '📁' },
    { name: 'Time Logger', path: '/dashboard/timer',    icon: '⏱️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">⚡</div>
        <div className="sidebar-logo-text">Zenith</div>
      </div>

      <div className="nav-section-label">Menu</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-link ${pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-link-icon">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="nav-section-label">Settings</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Link href="/dashboard/settings" className={`nav-link ${pathname === '/dashboard/settings' ? 'active' : ''}`}>
          <span className="nav-link-icon">⚙️</span>
          Preferences
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill" onClick={handleSignOut} title="Click to sign out">
          <div className="user-avatar">{userEmail?.charAt(0).toUpperCase() || 'U'}</div>
          <div className="flex-1 truncate">
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{userEmail.split('@')[0]}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Sign out</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
