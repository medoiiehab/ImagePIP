'use client';

import { useState, useCallback } from 'react';
import { Team } from '@/types';

export const useTeamManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json',
  });

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teams', {
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch teams');
      }

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTeam = useCallback(async (name: string, schoolUuid?: string) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ name, schoolUuid }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create team');
      }

      const data = await response.json();
      setTeams((prev) => [data.team, ...prev]);
      return data.team;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create team';
      setError(message);
      throw err;
    }
  }, []);

  const updateTeam = useCallback(async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update team');
      }

      const data = await response.json();
      setTeams((prev) =>
        prev.map((t) => (t.id === id ? data.team : t))
      );
      return data.team;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update team';
      setError(message);
      throw err;
    }
  }, []);

  const deleteTeam = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete team');
      }

      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete team';
      setError(message);
      throw err;
    }
  }, []);

  return {
    teams,
    isLoading,
    error,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  };
};
