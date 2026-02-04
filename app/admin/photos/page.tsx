'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PhotoGrid from '@/components/photos/PhotoGrid';
import SchoolFilter from '@/components/admin/SchoolFilter';
import { usePhotoManagement } from '@/hooks/usePhotoManagement';
import '../dashboard/admin-dashboard.css';

export default function AdminPhotos() {
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
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      router.push('/login');
      return;
    }

    fetchPhotos({ schoolUuid: selectedSchool });
  }, [router, fetchPhotos, selectedSchool]);

  const pendingPhotos = photos.filter((p) => p.status !== 'approved');
  const approvedPhotos = photos.filter((p) => p.status === 'approved');

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />
      <div className="admin-dashboard-content">
        <Header title="Photo Management" />

        <div className="dashboard-container">
          <SchoolFilter
            onSchoolChange={setSelectedSchool}
            selectedSchoolUuid={selectedSchool}
          />

          <div className="dashboard-section">
            <h2>📸 Pending Photos ({pendingPhotos.length})</h2>
            <div className="section-content">
              <PhotoGrid
                photos={pendingPhotos}
                onApprove={approvePhoto}
                onDelete={deletePhoto}
                isAdmin={true}
                isLoading={isLoading}
              />
            </div>
          </div>

          <div className="dashboard-section">
            <h2>✅ Approved Photos ({approvedPhotos.length})</h2>
            <div className="section-content">
              <PhotoGrid
                photos={approvedPhotos}
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
