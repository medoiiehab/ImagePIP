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
    <div className="login-page">
      <div className="login-background">
        <div className="bg-circle bg-1"></div>
        <div className="bg-circle bg-2"></div>
        <div className="bg-circle bg-3"></div>
      </div>

      <div className="capture-layout animate-fade-in" style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '500px'
      }}>
        <div className="glass" style={{
          padding: '1.5rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📸 Intake System</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ID: {userData?.userUuid} • School: {userData?.schoolUuid}
          </p>
        </div>

        <CameraInterface
          onPhotosCapture={handlePhotosCapture}
          onEndSession={handleEndSession}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      </div>
    </div>
  );
}
