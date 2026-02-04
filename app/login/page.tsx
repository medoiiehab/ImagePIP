'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import './login.css';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to appropriate dashboard
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else if (userRole === 'client') {
        router.push('/client/capture');
      }
    }
  }, [router]);

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>📸 Image Pipeline</h1>
          <p>Streamlined Image Intake System</p>
        </div>

        <div className="login-content">
          <h2>Select Your Role</h2>
          <p className="login-subtitle">Choose how you want to access the system</p>

          <div className="login-options">
            {/* Admin Login */}
            <Link href="/login/admin" className="login-option admin">
              <div className="option-icon">👨‍💼</div>
              <h3>Admin</h3>
              <p>Manage teams, users, and approve photos</p>
              <span className="option-cta">Login as Admin →</span>
            </Link>

            {/* Client Login */}
            <Link href="/login/client" className="login-option client">
              <div className="option-icon">📱</div>
              <h3>Team Member</h3>
              <p>Capture and upload photos for your team</p>
              <span className="option-cta">Login as Client →</span>
            </Link>
          </div>
        </div>

        <div className="login-footer">
          <p>
            <strong>🔒 Secure Login:</strong> All data is encrypted and stored securely
          </p>
          <p>
            <strong>❓ Need Help?</strong> Contact your system administrator
          </p>
        </div>
      </div>

      <div className="login-background">
        <div className="bg-circle bg-1"></div>
        <div className="bg-circle bg-2"></div>
        <div className="bg-circle bg-3"></div>
      </div>
    </div>
  );
}
