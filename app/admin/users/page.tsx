'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminUserManager from '@/components/admin/AdminUserManager';
import { useUserManagement } from '@/hooks/useUserManagement';
import '../dashboard/admin-dashboard.css';

export default function AdminUsers() {
  const router = useRouter();
  const {
    users,
    isLoading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useUserManagement();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [router, fetchUsers]);

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />
      <div className="admin-dashboard-content">
        <Header title="User Management" />

        <div className="dashboard-container">
          <AdminUserManager
            users={users}
            onCreateUser={createUser}
            onEditUser={updateUser}
            onDeleteUser={deleteUser}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
