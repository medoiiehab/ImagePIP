'use client';

import { useState } from 'react';
import { Team } from '@/types';
import './AdminTeamManager.css';

interface AdminTeamManagerProps {
  teams: Team[];
  onCreateTeam?: (name: string, schoolUuid?: string) => void;
  onEditTeam?: (id: string, name: string) => void;
  onDeleteTeam?: (id: string) => void;
  isLoading?: boolean;
}

export default function AdminTeamManager({
  teams,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
  isLoading = false,
}: AdminTeamManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', schoolUuid: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter out teams that are actually schools (if any convention exists)
  // or just present them clearly.
  // The user said "Schools" and "Teams" are the same essentially.
  // So we will just call everything "Schools" for simplicity in the UI,
  // but keep the functionality flexible.

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'School Name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingId) {
      onEditTeam?.(editingId, formData.name);
    } else {
      onCreateTeam?.(formData.name, formData.schoolUuid || undefined);
    }

    setFormData({ name: '', schoolUuid: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (team: any) => {
    setFormData({ name: team.name, schoolUuid: team.schoolUuid || '' });
    setEditingId(team.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', schoolUuid: '' });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this School? This will delete all associated users and photos.')) {
      onDeleteTeam?.(id);
    }
  };

  return (
    <div className="admin-team-manager animate-fade-in">
      <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Participating Schools</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage schools and their unique IDs.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) handleCancel();
          }}
        >
          {showForm ? '✕ Close' : '+ Add School'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '2rem' }}>
          <form className="team-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>School Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="e.g. West High School"
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <span className="error" style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.name}</span>}
              </div>

              {/* Hidden or Optional School Link since we are treating everything as a School now */}
              {/* <div className="form-group">
                <label>Parent School ID (Optional)</label>
                 ...
              </div> */}
            </div>

            <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-success">
                {editingId ? 'Update School' : 'Save School'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="animate-pulse">Loading schools...</div>
        </div>
      ) : teams.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No schools found. Start by adding one.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>School Name</th>
                <th>School UUID</th>
                <th>Members</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team: any) => (
                <tr key={team.id} className="team-row">
                  <td style={{ fontWeight: 600 }}>{team.name}</td>
                  <td>
                    <code style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 'bold' }}>
                      {team.uuid}
                    </code>
                  </td>
                  <td>
                    {/* Users Dropdown */}
                    <div className="users-dropdown-container">
                      <button
                        className="btn-text"
                        onClick={() => {
                          // Toggle using a special class or state? 
                          // For simplicity in a map, we might need a local state component or handle it via a parent state map.
                          // Let's use a details/summary or a simple popover approach if possible, 
                          // but for a table row, a state map is best.
                          const el = document.getElementById(`users-${team.id}`);
                          if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                        }}
                      >
                        {team.users?.length || 0} Members ▼
                      </button>
                      <div id={`users-${team.id}`} className="users-dropdown-list" style={{ display: 'none' }}>
                        {team.users?.length > 0 ? (
                          team.users.map((u: any) => (
                            <div key={u.id} className="user-item">
                              <span className="user-uuid">#{u.uuid}</span>
                              <span className={`user-role role-${u.role}`}>{u.role}</span>
                            </div>
                          ))
                        ) : (
                          <div className="user-item empty">No members</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      background: team.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: team.is_active ? '#10b981' : '#ef4444'
                    }}>
                      {team.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleEdit(team)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleDelete(team.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
