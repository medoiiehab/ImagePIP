'use client';

import { useState } from 'react';
import { User } from '@/types';
import { VALIDATION } from '@/lib/constants';
import MultiSchoolSelector from './MultiSchoolSelector';
import './AdminUserManager.css';
import './MultiSchoolSelector.css';

interface AdminUserManagerProps {
  users: User[];
  onCreateUser?: (userUuid: string, schools: string[], role: string) => void;
  onEditUser?: (id: string, userUuid: string, schools: string[], role: string) => void;
  onDeleteUser?: (id: string) => void;
  isLoading?: boolean;
}

export default function AdminUserManager({
  users,
  onCreateUser,
  onEditUser,
  onDeleteUser,
  isLoading = false,
}: AdminUserManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{ userUuid: string; schools: string[]; role: string }>({
    userUuid: '',
    schools: [],
    role: 'client'
  });
  // Keep track of the "last entered" school in case they just type and submit without adding to list
  // But better to force adding to list. Let's simplify and just use the list.

  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roles = ['admin', 'client'];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editingId && formData.userUuid.trim()) {
      if (!VALIDATION.UUID_PATTERN.test(formData.userUuid)) {
        newErrors.userUuid = 'Invalid format (4 digits)';
      }
    }

    if (formData.schools.length === 0) {
      newErrors.schools = 'At least one school is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (editingId) {
      // For editing, we pass the full list of schools
      onEditUser?.(editingId, formData.userUuid, formData.schools, formData.role);
    } else {
      // Create with full list
      onCreateUser?.(formData.userUuid, formData.schools, formData.role);
    }

    setFormData({ userUuid: '', schools: [], role: 'client' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (user: User) => {
    // Populate schools from user object or fallback to schoolUuid
    const userSchools = user.schools && user.schools.length > 0
      ? user.schools
      : (user.schoolUuid ? [user.schoolUuid] : []);

    setFormData({
      userUuid: user.uuid || '',
      schools: userSchools,
      role: user.role
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ userUuid: '', schools: [], role: 'client' });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      onDeleteUser?.(id);
    }
  };

  return (
    <div className="admin-user-manager animate-fade-in">
      <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Users Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>Create and manage school members and administrators.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) handleCancel();
          }}
        >
          {showForm ? '✕ Close' : '+ Create User'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '2rem' }}>
          <form className="user-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>User ID (Optional)</label>
                <input
                  type="text"
                  value={formData.userUuid}
                  onChange={(e) => {
                    setFormData({ ...formData, userUuid: e.target.value });
                    if (errors.userUuid) setErrors({ ...errors, userUuid: '' });
                  }}
                  placeholder="Auto-generated if empty"
                  maxLength={4}
                  className={errors.userUuid ? 'input-error' : ''}
                />
                {errors.userUuid && <span className="error" style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.userUuid}</span>}
              </div>

              <div className="form-group">
                {editingId && formData.role === 'client' ? (
                  // Edit Mode: Show Multi School Selector
                  <MultiSchoolSelector
                    schools={formData.schools}
                    onAddSchool={(newUuid) => {
                      // Add to list
                      if (!formData.schools.includes(newUuid)) {
                        const updatedSchools = [...formData.schools, newUuid];
                        setFormData(prev => ({ ...prev, schools: updatedSchools }));
                        onEditUser?.(editingId, formData.userUuid, updatedSchools, formData.role);
                      }
                    }}
                    onRemoveSchool={(uuidToRemove) => {
                      // Remove from list
                      const updatedSchools = formData.schools.filter(id => id !== uuidToRemove);
                      setFormData(prev => ({ ...prev, schools: updatedSchools }));
                      // Trigger update
                      onEditUser?.(editingId, formData.userUuid, updatedSchools, formData.role);
                    }}
                  />
                ) : (
                  // Create Mode: Show Multi School Selector
                  <MultiSchoolSelector
                    schools={formData.schools}
                    onAddSchool={(newUuid) => {
                      if (!formData.schools.includes(newUuid)) {
                        setFormData(prev => ({ ...prev, schools: [...prev.schools, newUuid] }));
                        if (errors.schools) setErrors(prev => ({ ...prev, schools: '' }));
                      }
                    }}
                    onRemoveSchool={(uuidToRemove) => {
                      setFormData(prev => ({ ...prev, schools: prev.schools.filter(id => id !== uuidToRemove) }));
                    }}
                  />
                )}
                {errors.schools && <span className="error" style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.schools}</span>}
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)' }}
                >
                  {roles.map((role) => (
                    <option key={role} value={role} style={{ background: '#1e293b' }}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-success">
                {editingId ? 'Update User' : 'Create User'}
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
          <div className="animate-pulse">Loading users...</div>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No users yet. Add your first member.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>School Link</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id}>
                  <td>
                    <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                      {user.uuid}
                    </code>
                  </td>
                  <td>
                    {user.schools && user.schools.length > 0 ? (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {user.schools.map((s: string) => (
                          <span key={s} className="badge-school">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      user.school_uuid || user.schoolUuid || <span style={{ color: 'var(--text-muted)' }}>None</span>
                    )}
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      background: user.role === 'admin' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: user.role === 'admin' ? '#8b5cf6' : '#6366f1'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {new Date(user.created_at || user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleEdit(user)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleDelete(user.id)}>
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
