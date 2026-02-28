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
    <div className="login-page ltr-layout">
      <div className="login-container">
        <div className="login-header">
          <h1>📸 نظام معالجة الصور</h1>
          <p>نظام مبسط لاستلام ومعالجة الصور</p>
        </div>

        <div className="login-content">
          <h2>اختر دورك</h2>
          <p className="login-subtitle">يرجى تحديد طريقة الدخول إلى النظام</p>

          <div className="login-options">
            {/* Admin Login */}
            <Link href="/login/admin" className="login-option admin">
              <div className="option-icon">👨‍💼</div>
              <h3>المسؤول</h3>
              <p>إدارة الفرق، المستخدمين، واعتماد الصور</p>
              <span className="option-cta">دخول المسؤول ←</span>
            </Link>

            {/* Client Login */}
            <Link href="/login/client" className="login-option client">
              <div className="option-icon">📱</div>
              <h3>عضو الفريق</h3>
              <p>التقاط ورفع الصور الخاصة بفريقك</p>
              <span className="option-cta">دخول المصور ←</span>
            </Link>
          </div>
        </div>

        <div className="login-footer">
          <p>
            <strong>🔒 دخول آمن:</strong> جميع البيانات مشفرة ومخزنة بأمان
          </p>
          <p>
            <strong>❓ تحتاج مساعدة؟</strong> تواصل مع مسؤول النظام الخاص بك
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
