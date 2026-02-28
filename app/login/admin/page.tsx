'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLoginForm from '@/components/auth/AdminLoginForm';
import '../login.css';

export default function AdminLoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/admin/dashboard');
  };

  return (
    <div className="login-page ltr-layout">
      <div className="login-form-container">
        <Link href="/login" className="back-link">
          → العودة لاختيار الدور
        </Link>

        <div className="form-wrapper">
          <div className="form-icon">👨‍💼</div>
          <AdminLoginForm onLoginSuccess={handleLoginSuccess} />
        </div>

        <div className="form-footer">
          <p>ليس لديك حساب؟ تواصل مع مسؤول النظام</p>
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
