'use client';

import { useState, useEffect } from 'react';
import './Header.css';

interface HeaderProps {
  title?: string;
}

export default function Header({
  title = 'Image Pipeline',
}: HeaderProps) {
  const [userRole, setUserRole] = useState<string | null>(null);

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


      </div>
    </header>
  );
}
