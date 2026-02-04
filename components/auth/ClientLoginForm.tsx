'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VALIDATION } from '@/lib/constants';
import './LoginForm.css';

interface ClientLoginFormProps {
  onLoginSuccess?: () => void;
}

export default function ClientLoginForm({
  onLoginSuccess,
}: ClientLoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    schoolUuid: '',
    userUuid: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.schoolUuid.trim()) {
      newErrors.schoolUuid = 'School UUID is required';
    } else if (!VALIDATION.UUID_PATTERN.test(formData.schoolUuid)) {
      newErrors.schoolUuid = 'Invalid format (4 digits)';
    }

    if (!formData.userUuid.trim()) {
      newErrors.userUuid = 'User UUID is required';
    } else if (!VALIDATION.UUID_PATTERN.test(formData.userUuid)) {
      newErrors.userUuid = 'Invalid format (4 digits)';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'client',
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          submit: data.error || 'Login failed. Please check your IDs and password.',
        });
        return;
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', 'client');
      localStorage.setItem('schoolUuid', formData.schoolUuid);
      localStorage.setItem('userUuid', formData.userUuid);

      onLoginSuccess?.();
      router.push('/client/capture');
    } catch (error) {
      setErrors({
        submit: 'An error occurred. Please try again.',
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="login-form glass animate-fade-in" onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Team Member Login</h2>

      {errors.submit && (
        <div className="form-error-message animate-fade-in" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          {errors.submit}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="schoolUuid">School ID</label>
        <input
          type="text"
          id="schoolUuid"
          name="schoolUuid"
          value={formData.schoolUuid}
          onChange={handleChange}
          placeholder="e.g., 1000"
          className={errors.schoolUuid ? 'input-error' : ''}
          maxLength={4}
        />
        {errors.schoolUuid && (
          <span className="field-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {errors.schoolUuid}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="userUuid">User ID</label>
        <input
          type="text"
          id="userUuid"
          name="userUuid"
          value={formData.userUuid}
          onChange={handleChange}
          placeholder="e.g., 1000"
          className={errors.userUuid ? 'input-error' : ''}
          maxLength={4}
        />
        {errors.userUuid && (
          <span className="field-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {errors.userUuid}
          </span>
        )}
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="e.g., P1000"
          className={errors.password ? 'input-error' : ''}
        />
        {errors.password && (
          <span className="field-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {errors.password}
          </span>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isLoading}
        style={{ width: '100%' }}
      >
        {isLoading ? 'Verifying...' : 'Login to Camera'}
      </button>
    </form>
  );
}
