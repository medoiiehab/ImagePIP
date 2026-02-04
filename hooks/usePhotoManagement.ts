'use client';

import { useState, useCallback } from 'react';
import { Photo } from '@/types';

export const usePhotoManagement = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async (filters?: {
    schoolUuid?: string;
    status?: string;
    migrated?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.schoolUuid) queryParams.append('schoolUuid', filters.schoolUuid);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.migrated !== undefined) queryParams.append('migrated', String(filters.migrated));

      const response = await fetch(`/api/photos?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch photos');
      }

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approvePhoto = useCallback(async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve photo');
      }

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? { ...p, status: 'approved' as any }
            : p
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve photo';
      setError(message);
    }
  }, []);

  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete photo');
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete photo';
      setError(message);
    }
  }, []);

  const uploadPhoto = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        setIsUploading(false);
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setPhotos((prev) => [response.photo, ...prev]);
            resolve(response.photo);
          } else {
            const errorMsg = response.error || 'Upload failed';
            setError(errorMsg);
            reject(new Error(errorMsg));
          }
        } catch (e) {
          const errorMsg = 'Failed to parse server response';
          setError(errorMsg);
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener('error', () => {
        setIsUploading(false);
        const errorMsg = 'Network error during upload';
        setError(errorMsg);
        reject(new Error(errorMsg));
      });

      xhr.open('POST', '/api/photos');
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('authToken')}`);
      xhr.send(formData);
    });
  }, []);

  return {
    photos,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    fetchPhotos,
    approvePhoto,
    deletePhoto,
    uploadPhoto,
  };
};
