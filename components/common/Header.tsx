'use client';

import { useState, useEffect } from 'react';
import './Header.css';

interface HeaderProps {
  title?: string;
  showLogout?: boolean;
}

export default function Header({
  title = 'Image Pipeline',
  showLogout = false,
}: HeaderProps) {
  const [userRole, setUserRole] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <h1>{title}</h1>
          {userRole && (
            <span className={`role-badge role-${userRole}`}>{userRole}</span>
          )}
        </div>

        {showLogout && (
          <button className="btn btn-secondary logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
