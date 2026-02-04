'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminStats from '@/components/admin/AdminStats';
import PhotoGrid from '@/components/photos/PhotoGrid';
import SchoolFilter from '@/components/admin/SchoolFilter';
import { usePhotoManagement } from '@/hooks/usePhotoManagement';
import './admin-dashboard.css';

export default function AdminDashboard() {
  const router = useRouter();
  const [selectedSchool, setSelectedSchool] = useState<string | undefined>(undefined);
  const {
    photos,
    isLoading,
    fetchPhotos,
    approvePhoto,
    deletePhoto,
  } = usePhotoManagement();

  useEffect(() => {
    // Check authentication
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      router.push('/login');
      return;
    }

    // Load photos with filter
    fetchPhotos({ schoolUuid: selectedSchool });
  }, [router, fetchPhotos, selectedSchool]);

  const stats = {
    totalPhotos: photos.length,
    pendingPhotos: photos.filter((p) => p.status !== 'approved').length,
    approvedPhotos: photos.filter((p) => p.status === 'approved' && !p.migratedToGoogleDrive).length,
    migratedPhotos: photos.filter((p) => p.migratedToGoogleDrive).length,
    totalTeams: 0,
    totalUsers: 0,
    storageUsed: photos.reduce((sum, p) => sum + (p.metadata?.size || 0), 0) / (1024 * 1024),
  };

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />
      <div className="admin-dashboard-content">
        <Header title="Admin Dashboard" />

        <div className="dashboard-container">
          <AdminStats data={stats} isLoading={isLoading} />

          <SchoolFilter
            onSchoolChange={setSelectedSchool}
            selectedSchoolUuid={selectedSchool}
          />

          <div className="dashboard-section">
            <h2>📸 {selectedSchool ? 'School Photos' : 'Recent Photos'}</h2>
            <div className="section-content">
              <PhotoGrid
                photos={selectedSchool ? photos : photos.slice(0, 12)}
                onApprove={approvePhoto}
                onDelete={deletePhoto}
                isAdmin={true}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
