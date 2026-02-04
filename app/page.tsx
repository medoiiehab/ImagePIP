'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to appropriate page based on authentication
    const userRole = localStorage.getItem('userRole');
    
    if (userRole === 'admin') {
      router.push('/admin/dashboard');
    } else if (userRole === 'client') {
      router.push('/client/capture');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex-center w-full h-full">
      <p>Redirecting...</p>
    </div>
  );
}
