'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import './AdminSidebar.css';

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Check valid routes to set active state
  const isActive = (path: string) => pathname.includes(path);

  // Handle window resize to detect mobile state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMobileOpen(false);
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: 'Photos', path: '/admin/photos', icon: '📸' },
    { label: 'Schools', path: '/admin/teams', icon: '🏫' },
    { label: 'Users', path: '/admin/users', icon: '👤' },
  ];

  return (
    <>
      {/* Mobile Burger Button - Only visible on mobile */}
      <button
        className="mobile-burger-btn"
        onClick={toggleMobileMenu}
        aria-label="Toggle Menu"
      >
        {isMobileOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && <div className="sidebar-overlay" onClick={closeMobileMenu}></div>}

      <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button
            className="btn btn-logout-sidebar"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
