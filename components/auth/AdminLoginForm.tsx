'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './LoginForm.css';

interface AdminLoginFormProps {
  onLoginSuccess?: () => void;
}

export default function AdminLoginForm({
  onLoginSuccess,
}: AdminLoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
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
          type: 'admin',
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          submit: data.error || 'Login failed. Please check your credentials.',
        });
        return;
      }

      // Store auth info
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userEmail', formData.email);

      onLoginSuccess?.();
      router.push('/admin/dashboard');
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
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Admin Login</h2>

      {errors.submit && (
        <div className="form-error-message">{errors.submit}</div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="admin@example.com"
          className={errors.email ? 'input-error' : ''}
        />
        {errors.email && (
          <span className="error">{errors.email}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          className={errors.password ? 'input-error' : ''}
        />
        {errors.password && (
          <span className="error">{errors.password}</span>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={isLoading}
        style={{ width: '100%', marginTop: '0.5rem' }}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
