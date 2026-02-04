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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (useCapacitor) return;

    let mounted = true;
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not supported in this browser. Please use HTTPS or a modern browser.');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        });

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;

          try {
            await videoRef.current.play();
            setIsCameraReady(true);
            setCameraError(null);
          } catch (e) {
            console.error('Autoplay blocked:', e);
            // On some browsers, play() must be triggered by user gesture
            // We'll keep isCameraReady false which shows the loading/retry UI
          }
        }
      } catch (error: any) {
        console.error('Camera access error:', error);
        let msg = error.message || 'Could not access camera';
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          msg = 'Camera access denied. Please check your browser settings and refresh.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          msg = 'No camera found on this device.';
        }
        if (mounted) setCameraError(msg);
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useCapacitor]);

  const handleRetryCamera = () => {
    window.location.reload();
  };

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
    }, 'image/jpeg', 0.9);
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
      console.error('Capacitor capture error:', error);
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
    const urlToRemove = photos[index];
    URL.revokeObjectURL(urlToRemove);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadPhotos = async () => {
    const photoFiles: File[] = [];
    try {
      for (let i = 0; i < photos.length; i++) {
        const url = photos[i];
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], `photo-${Date.now()}-${i}.jpg`, { type: 'image/jpeg' });
        photoFiles.push(file);
      }
      await onPhotosCapture(photoFiles);
      photos.forEach(url => URL.revokeObjectURL(url));
      setPhotos([]);
    } catch (e) {
      console.error('Upload failed:', e);
    }
  };

  const handleEndSession = () => {
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
            <button className="btn btn-primary btn-large" onClick={capturePhotoFromCamera}>
              📷 Open Camera
            </button>
          </div>
        ) : cameraError ? (
          <div className="camera-error">
            <p>{cameraError}</p>
            <button className="btn btn-secondary mt-4" onClick={handleRetryCamera}>
              Retry Camera
            </button>
          </div>
        ) : !isCameraReady ? (
          <div className="camera-loading">
            <div className="spinner"></div>
            <p>Initializing Camera...</p>
            <p className="text-muted text-sm">Please allow camera access in your browser</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
            <button
              className="btn-capture"
              onClick={capturePhotoFromCamera}
              disabled={isUploading}
              aria-label="Capture Photo"
            ></button>
          </>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div className="photos-preview">
        <h3>Captured Photos ({photos.length})</h3>
        {photos.length > 0 && (
          <div className="preview-grid">
            {photos.map((url, index) => (
              <div key={index} className="preview-item">
                <img src={url} alt={`Captured ${index}`} />
                <button className="btn-remove" onClick={() => handleRemovePhoto(index)} disabled={isUploading}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="camera-actions">
        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p>Uploading... {uploadProgress}%</p>
          </div>
        )}
        <button className="btn btn-success btn-large" onClick={handleUploadPhotos} disabled={photos.length === 0 || isUploading}>
          ✓ Upload Photos
        </button>
        <button className="btn btn-danger btn-large" onClick={handleEndSession} disabled={isUploading}>
          End Session
        </button>
      </div>
    </div>
  );
}
