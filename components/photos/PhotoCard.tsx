'use client';

import { useState, useEffect } from 'react';
import './PhotoCard.css';

interface PhotoCardProps {
  photo: any;
  isSelected?: boolean;
  onSelect?: () => void;
  onApprove?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

export default function PhotoCard({
  photo,
  isSelected = false,
  onSelect,
  onApprove,
  onDelete,
  isAdmin = false,
}: PhotoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Handle both camelCase (JS) and snake_case (DB) property names
  const fileName = photo.fileName || photo.file_name || 'Unknown';
  const filePath = photo.filePath || photo.file_path || '';
  const uploadedAt = photo.uploadedAt || photo.uploaded_at || photo.created_at;
  const status = photo.status || 'pending';
  const isApproved = photo.approved || status === 'approved';
  const isMigrated = photo.migratedToGoogleDrive || photo.migrated_to_google_drive;
  const approvedAt = photo.approvedAt || photo.approved_at;
  const metadata = photo.metadata || {};
  const schoolName = photo.school_name || photo.schools?.name || 'Unknown School';
  const userId = photo.userId || photo.user_id || 'N/A';

  // Generate Supabase public URL
  useEffect(() => {
    if (filePath) {
      if (filePath.startsWith('http')) {
        setImageUrl(filePath);
      } else if (metadata?.publicUrl) {
        setImageUrl(metadata.publicUrl);
      } else {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          setImageUrl(`${supabaseUrl}/storage/v1/object/public/photos/${filePath}`);
        }
      }
    }
  }, [filePath, metadata]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = () => {
    if (isApproved) return 'status-approved';
    if (isMigrated) return 'status-migrated';
    if (status === 'rejected') return 'status-rejected';
    return 'status-pending';
  };

  const getStatusText = () => {
    if (isApproved) return 'Approved';
    if (isMigrated) return 'Migrated';
    if (status === 'rejected') return 'Rejected';
    return 'Pending';
  };

  const truncate = (str: string, len: number) => {
    if (!str) return 'Unknown';
    return str.length > len ? str.substring(0, len - 3) + '...' : str;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className={`photo-card ${isSelected ? 'selected' : ''}`}>
      {isAdmin && (
        <input
          type="checkbox"
          className="photo-card-checkbox"
          checked={isSelected}
          onChange={onSelect}
        />
      )}

      <div className="photo-card-image-container">
        {!imageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={fileName}
            className="photo-card-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="photo-card-placeholder">
            <span>📷</span>
            <span style={{ fontSize: '0.7rem' }}>No preview</span>
          </div>
        )}

        <div className={`photo-card-status ${getStatusBadgeClass()}`}>
          {getStatusText()}
        </div>
      </div>

      <div className="photo-card-content">
        <h3 className="photo-card-title" title={fileName}>
          {truncate(fileName, 25)}
        </h3>

        <div className="photo-card-meta">
          <span className="meta-item" title={`School: ${schoolName}`}>
            🏫 {truncate(schoolName, 15)}
          </span>
          <span className="meta-item">
            👤 User #{userId}
          </span>
        </div>

        <p className="photo-card-date">{formatDate(uploadedAt)}</p>

        {isAdmin && (
          <div className="photo-card-actions">
            {!isApproved && status !== 'rejected' && (
              <button
                className="btn btn-sm btn-success"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.();
                }}
                title="Approve"
              >
                ✓
              </button>
            )}
            <button
              className="btn btn-sm btn-danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              title="Delete"
            >
              ✕
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
            >
              {showDetails ? '−' : '+'}
            </button>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="photo-card-details">
          <dl>
            <dt>File:</dt>
            <dd>{fileName}</dd>
            <dt>School:</dt>
            <dd>{schoolName}</dd>
            <dt>User ID:</dt>
            <dd>{userId}</dd>
            <dt>Uploaded:</dt>
            <dd>{formatDate(uploadedAt)}</dd>
            <dt>Status:</dt>
            <dd>{getStatusText()}</dd>
            {(metadata?.size || photo.file_size) && (
              <>
                <dt>Size:</dt>
                <dd>{formatFileSize(metadata.size || photo.file_size)}</dd>
              </>
            )}
            {approvedAt && (
              <>
                <dt>Approved:</dt>
                <dd>{formatDate(approvedAt)}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
