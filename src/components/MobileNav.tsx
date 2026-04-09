'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard',          icon: '📊' },
    { name: 'Habits',    path: '/dashboard/habits',   icon: '✅' },
    { name: 'Timer',     path: '/dashboard/timer',    icon: '⏱️' },
    { name: 'Projects',  path: '/dashboard/projects', icon: '📁' },
  ];

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-inner">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`mobile-nav-item ${pathname === item.path ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
