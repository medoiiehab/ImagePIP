'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CameraInterface from '@/components/photos/CameraInterface';
import { usePhotoManagement } from '@/hooks/usePhotoManagement';
import '@/app/login/login.css'; // Reuse background styles

export default function ClientCapture() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<{ userUuid: string; schoolUuid: string } | null>(null);

  const { uploadPhoto, isUploading, uploadProgress } = usePhotoManagement();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const userUuid = localStorage.getItem('userUuid');
    const schoolUuid = localStorage.getItem('schoolUuid');

    if (userRole !== 'client' || !userUuid || !schoolUuid) {
      router.push('/login');
      return;
    }

    setUserData({ userUuid, schoolUuid });
    setIsAuthenticated(true);
  }, [router]);

  const handlePhotosCapture = async (files: File[]) => {
    for (const file of files) {
      try {
        await uploadPhoto(file);
      } catch (error) {
        console.error('Failed to upload photo:', error);
      }
    }
    alert(`${files.length} photos uploaded successfully!`);
  };

  const handleEndSession = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('schoolUuid');
    localStorage.removeItem('userUuid');
    router.push('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="client-capture-page ltr-layout">
      {/* Static Solid Background for Clean Mobile View */}
      <div className="static-bg"></div>

      <div className="capture-layout animate-fade-in" style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '600px',
        padding: '1rem',
        margin: '0 auto'
      }}>
        <div className="capture-header glass-panel" style={{
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center',
          borderRadius: '2rem'
        }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: '#0A0A0A' }}>📸 نظام التصوير</h1>
          <p style={{ color: '#737373', fontSize: '1.1rem', fontWeight: 600 }}>
            المصور: {userData?.userUuid} • المدرسة: {userData?.schoolUuid}
          </p>
        </div>

        <CameraInterface
          onPhotosCapture={handlePhotosCapture}
          onEndSession={() => {
            if (window.confirm('هل أنت متأكد من إنهاء الجلسة؟')) {
              handleEndSession();
            }
          }}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      </div>
    </div>
  );
}
