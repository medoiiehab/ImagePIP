'use client';

import { useState, useCallback } from 'react';
import { User } from '@/types';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json',
  });

  const fetchUsers = useCallback(async (schoolUuid?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = schoolUuid ? `?schoolUuid=${schoolUuid}` : '';
      const response = await fetch(`/api/users${queryParams}`, {
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userUuid: string, schools: string[], role: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ userUuid, schools, role }), // Send schools array
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      const data = await response.json();
      setUsers((prev) => [data.user, ...prev]);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
      throw err;
    }
  }, []);

  const updateUser = useCallback(async (id: string, userUuid: string, schools: string[], role: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ userUuid, schools, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      const data = await response.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? data.user : u))
      );
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setError(message);
      throw err;
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setError(message);
      throw err;
    }
  }, []);

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};
