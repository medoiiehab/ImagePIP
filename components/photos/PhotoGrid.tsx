'use client';

import { useState } from 'react';
import PhotoCard from './PhotoCard';
import './PhotoGrid.css';

interface PhotoGridProps {
  photos: any[];
  onApprove?: (photoId: string) => void;
  onDelete?: (photoId: string) => void;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export default function PhotoGrid({
  photos,
  onApprove,
  onDelete,
  isAdmin = false,
  isLoading = false,
}: PhotoGridProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');

  // Handle both snake_case and camelCase
  const getPhotoId = (photo: any) => String(photo.id);
  const getUploadedAt = (photo: any) => photo.uploadedAt || photo.uploaded_at || photo.created_at;
  const isApproved = (photo: any) => photo.approved || photo.status === 'approved';

  const sortedPhotos = [...photos].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(getUploadedAt(b)).getTime() - new Date(getUploadedAt(a)).getTime();
    }
    return isApproved(a) === isApproved(b) ? 0 : isApproved(a) ? 1 : -1;
  });

  const handleSelectPhoto = (photoId: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map((p) => getPhotoId(p)));
    }
  };

  const handleBulkApprove = () => {
    selectedPhotos.forEach((photoId) => onApprove?.(photoId));
    setSelectedPhotos([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedPhotos.length} photo(s)?`)) {
      selectedPhotos.forEach((photoId) => onDelete?.(photoId));
      setSelectedPhotos([]);
    }
  };

  if (isLoading) {
    return <div className="photo-grid-loading">Loading photos...</div>;
  }

  if (photos.length === 0) {
    return <div className="photo-grid-empty">No photos yet</div>;
  }

  return (
    <div className="photo-grid-container">
      <div className="photo-grid-controls">
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={selectedPhotos.length === photos.length && photos.length > 0}
              onChange={handleSelectAll}
              disabled={!isAdmin}
            />
            Select All ({selectedPhotos.length}/{photos.length})
          </label>
        </div>

        <div className="control-group">
          <label htmlFor="sort">Sort:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'status')}
          >
            <option value="date">Newest</option>
            <option value="status">Status</option>
          </select>
        </div>

        {isAdmin && selectedPhotos.length > 0 && (
          <div className="bulk-actions">
            <button className="btn btn-success" onClick={handleBulkApprove}>
              ✓ Approve ({selectedPhotos.length})
            </button>
            <button className="btn btn-danger" onClick={handleBulkDelete}>
              ✕ Delete ({selectedPhotos.length})
            </button>
          </div>
        )}
      </div>

      <div className="photo-grid">
        {sortedPhotos.map((photo) => {
          const photoId = getPhotoId(photo);
          return (
            <PhotoCard
              key={photoId}
              photo={photo}
              isSelected={selectedPhotos.includes(photoId)}
              onSelect={() => handleSelectPhoto(photoId)}
              onApprove={() => onApprove?.(photoId)}
              onDelete={() => onDelete?.(photoId)}
              isAdmin={isAdmin}
            />
          );
        })}
      </div>
    </div>
  );
}
