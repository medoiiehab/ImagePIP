'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import AdminSidebar from '@/components/admin/AdminSidebar';
import '../dashboard/admin-dashboard.css';
import './settings.css';

export default function AdminSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    siteName: 'Image Pipeline',
    maxFileSize: 10,
    autoDeleteDays: 30,
    emailNotifications: true,
    maintenanceMode: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      router.push('/login');
      return;
    }

    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [router]);

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />
      <div className="admin-dashboard-content">
        <Header title="Settings" />

        <div className="dashboard-container">
          <div className="settings-container">
            <h2>⚙️ System Settings</h2>

            {saved && <div className="success-message">Settings saved successfully!</div>}

            <div className="settings-form">
              <div className="settings-section">
                <h3>General</h3>

                <div className="setting-item">
                  <label htmlFor="site-name">Site Name</label>
                  <input
                    id="site-name"
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleChange('siteName', e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-section">
                <h3>Storage</h3>

                <div className="setting-item">
                  <label htmlFor="max-file">Max File Size (MB)</label>
                  <input
                    id="max-file"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) =>
                      handleChange('maxFileSize', parseInt(e.target.value))
                    }
                    min="1"
                    max="500"
                  />
                </div>

                <div className="setting-item">
                  <label htmlFor="auto-delete">Auto Delete Days</label>
                  <input
                    id="auto-delete"
                    type="number"
                    value={settings.autoDeleteDays}
                    onChange={(e) =>
                      handleChange('autoDeleteDays', parseInt(e.target.value))
                    }
                    min="1"
                    max="365"
                  />
                  <p className="setting-desc">
                    Automatically delete non-approved photos after this many days
                  </p>
                </div>
              </div>

              <div className="settings-section">
                <h3>Notifications</h3>

                <div className="setting-item">
                  <label htmlFor="email-notifications">
                    <input
                      id="email-notifications"
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) =>
                        handleChange('emailNotifications', e.target.checked)
                      }
                    />
                    Email Notifications
                  </label>
                  <p className="setting-desc">
                    Send email when new photos are uploaded
                  </p>
                </div>
              </div>

              <div className="settings-section danger">
                <h3>Maintenance</h3>

                <div className="setting-item">
                  <label htmlFor="maintenance">
                    <input
                      id="maintenance"
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) =>
                        handleChange('maintenanceMode', e.target.checked)
                      }
                    />
                    Maintenance Mode
                  </label>
                  <p className="setting-desc">
                    Disable user access during maintenance
                  </p>
                </div>
              </div>

              <div className="settings-actions">
                <button className="btn btn-success btn-large" onClick={handleSave}>
                  💾 Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
