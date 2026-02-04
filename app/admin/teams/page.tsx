'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTeamManager from '@/components/admin/AdminTeamManager';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import '../dashboard/admin-dashboard.css';

export default function AdminTeams() {
  const router = useRouter();
  const {
    teams,
    isLoading,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  } = useTeamManagement();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      router.push('/login');
      return;
    }

    fetchTeams();
  }, [router, fetchTeams]);

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />
      <div className="admin-dashboard-content">
        <Header title="School Management" />

        <div className="dashboard-container">
          <AdminTeamManager
            teams={teams}
            onCreateTeam={createTeam}
            onEditTeam={updateTeam}
            onDeleteTeam={deleteTeam}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
