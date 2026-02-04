'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientLoginForm from '@/components/auth/ClientLoginForm';
import '../login.css';

export default function ClientLoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/client/capture');
  };

  return (
    <div className="login-page">
      <div className="login-form-container">
        <Link href="/login" className="back-link">
          ← Back to Role Selection
        </Link>

        <div className="form-wrapper">
          <div className="form-icon">📱</div>
          <ClientLoginForm onLoginSuccess={handleLoginSuccess} />
        </div>

        <div className="form-footer">
          <p>Ask your team administrator for your login credentials</p>
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
