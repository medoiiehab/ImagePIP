'use client';
import './AdminStats.css';
// Note: Colors will now rely on global minimal palette
// Removed specific color classes in favor of cleaner layout


interface AdminStatsData {
  totalPhotos: number;
  pendingPhotos: number;
  approvedPhotos: number;
  migratedPhotos: number;
  totalTeams: number;
  totalUsers: number;
  storageUsed: number; // in MB
}

interface AdminStatsProps {
  data?: AdminStatsData;
  isLoading?: boolean;
}

export default function AdminStats({
  data = {
    totalPhotos: 0,
    pendingPhotos: 0,
    approvedPhotos: 0,
    migratedPhotos: 0,
    totalTeams: 0,
    totalUsers: 0,
    storageUsed: 0,
  },
  isLoading = false,
}: AdminStatsProps) {
  const stats = [
    {
      label: 'Total Photos',
      value: data.totalPhotos,
      icon: '📸',
      color: 'blue',
    },
    {
      label: 'Pending',
      value: data.pendingPhotos,
      icon: '⏳',
      color: 'warning',
    },
    {
      label: 'Approved',
      value: data.approvedPhotos,
      icon: '✅',
      color: 'success',
    },
    {
      label: 'Migrated',
      value: data.migratedPhotos,
      icon: '☁️',
      color: 'info',
    },
    {
      label: 'Teams',
      value: data.totalTeams,
      icon: '👥',
      color: 'purple',
    },
    {
      label: 'Users',
      value: data.totalUsers,
      icon: '👤',
      color: 'pink',
    },
    {
      label: 'Storage (MB)',
      value: data.storageUsed.toFixed(2),
      icon: '💾',
      color: 'orange',
    },
  ];

  return (
    <div className="admin-stats">
      <h2>Dashboard Overview</h2>
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card stat-${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">
                {isLoading ? '-' : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
