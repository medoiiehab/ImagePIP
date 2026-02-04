'use client';

import { useRef, useState, useEffect } from 'react';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import './CameraInterface.css';

interface CameraInterfaceProps {
  onPhotosCapture: (files: File[]) => void;
  onEndSession: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function CameraInterface({
  onPhotosCapture,
  onEndSession,
  isUploading = false,
  uploadProgress = 0,
}: CameraInterfaceProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [useCapacitor, setUseCapacitor] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // ... (rest of useEffects)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: string[] = [];
      Array.from(e.target.files).forEach((file) => {
        newPhotos.push(URL.createObjectURL(file));
      });
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Check if Capacitor is available (native app)
  useEffect(() => {
    const checkCapacitor = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform?.()) {
          setUseCapacitor(true);
        }
      } catch {
        setUseCapacitor(false);
      }
    };
    checkCapacitor();
  }, []);

  // Initialize web camera
  useEffect(() => {
    if (useCapacitor || !videoRef.current) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
        }
      } catch (error) {
        console.error('Camera access denied:', error);
        // Fallback to file input if camera not available
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [useCapacitor]);

  const capturePhotoFromCamera = async () => {
    if (useCapacitor) {
      await captureWithCapacitor();
    } else {
      captureWithWebAPI();
    }
  };

  const captureWithWebAPI = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    context.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPhotos((prev) => [...prev, url]);
      }
    }, 'image/jpeg');
  };

  const captureWithCapacitor = async () => {
    try {
      const { Camera } = await import('@capacitor/camera');
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (photo.base64String) {
        const blob = base64ToBlob(photo.base64String, 'image/jpeg');
        const url = URL.createObjectURL(blob);
        setPhotos((prev) => [...prev, url]);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  };



  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadPhotos = async () => {
    // Convert blob URLs to Files
    const photoFiles: File[] = [];

    for (let i = 0; i < photos.length; i++) {
      const url = photos[i];
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `photo-${Date.now()}-${i}.jpg`, {
        type: 'image/jpeg',
      });
      photoFiles.push(file);
    }

    onPhotosCapture(photoFiles);
  };

  const handleEndSession = () => {
    // Clean up URLs
    photos.forEach((url) => URL.revokeObjectURL(url));
    onEndSession();
  };

  return (
    <div className="camera-interface">
      <div className="camera-container">
        {useCapacitor ? (
          <div className="native-camera-area">
            <div className="camera-placeholder">
              <span className="camera-icon-large">📸</span>
              <p>Mobile Camera Ready</p>
            </div>
            <button
              className="btn btn-primary btn-large"
              onClick={capturePhotoFromCamera}
            >
              📷 Open Camera
            </button>
          </div>
        ) : !isCameraReady ? (
          <div className="camera-loading">
            <p>Initializing Camera...</p>
            <p className="text-muted text-sm">Please allow camera access</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="camera-video"
              autoPlay
              playsInline
              muted
              controls={false}
            />
            <button
              className="btn btn-primary btn-capture"
              onClick={capturePhotoFromCamera}
              disabled={!isCameraReady || isUploading}
            >
              📷 Capture
            </button>
          </>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Temporary File Upload for non-HTTPS dev */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            📁 Upload from File (Temp)
          </button>
        </div>
      </div>

      <div className="photos-preview">
        <h3>
          Captured Photos ({photos.length})
        </h3>
        {photos.length > 0 && (
          <div className="preview-grid">
            {photos.map((url, index) => (
              <div key={index} className="preview-item">
                <img src={url} alt={`Captured ${index}`} />
                <button
                  className="btn-remove"
                  onClick={() => handleRemovePhoto(index)}
                  disabled={isUploading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="camera-actions">
        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p>Uploading... {uploadProgress}%</p>
          </div>
        )}

        <button
          className="btn btn-success btn-large"
          onClick={handleUploadPhotos}
          disabled={photos.length === 0 || isUploading}
        >
          ✓ Upload Photos
        </button>

        <button
          className="btn btn-danger btn-large"
          onClick={handleEndSession}
          disabled={isUploading}
        >
          End Session
        </button>
      </div>
    </div>
  );
}
