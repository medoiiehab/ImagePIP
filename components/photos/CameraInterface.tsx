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
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Check for Capacitor
  useEffect(() => {
    const checkCapacitor = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform?.()) {
          setUseCapacitor(true);
        }
      } catch {
        // Not native
      }
    };
    checkCapacitor();
  }, []);

  // Web Camera Initialization (Try for live feed)
  useEffect(() => {
    if (useCapacitor) return;

    let mounted = true;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Live feed not supported');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              if (mounted) {
                setIsCameraReady(true);
                setCameraError(null);
              }
            }).catch(err => {
              console.error('Play error:', err);
            });
          };
        }
      } catch (err: any) {
        console.warn('Live feed could not be started:', err);
        if (mounted) {
          setIsCameraReady(false);
          // Don't set error, just let it stay in loading/background state while native button is available
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [useCapacitor]);

  const captureLivePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPhotos(prev => [...prev, url]);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newUrls = filesArray.map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newUrls]);
    }
    // Reset input so the same file can be picked again if needed
    if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = '';
  };

  const captureWithCapacitor = async () => {
    try {
      const { Camera } = await import('@capacitor/camera');
      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (photo.base64String) {
        const binaryString = atob(photo.base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setPhotos(prev => [...prev, url]);
      }
    } catch (err) {
      console.error('Capacitor Error:', err);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const url = photos[index];
    URL.revokeObjectURL(url);
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const files: File[] = [];
    for (const url of photos) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        files.push(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      } catch (e) {
        console.error('Failed to process photo for upload:', e);
      }
    }
    await onPhotosCapture(files);
    photos.forEach(url => URL.revokeObjectURL(url));
    setPhotos([]);
  };

  return (
    <div className="camera-interface">
      {/* 1. THE CAMERA AREA (Live Feed or Native Icon) */}
      <div className="camera-container">
        {useCapacitor ? (
          <div className="mode-placeholder">
            <span className="icon">�</span>
            <p>Mobile App Mode</p>
            <button className="btn btn-primary btn-lg" onClick={captureWithCapacitor}>
              Open Native Camera
            </button>
          </div>
        ) : !isCameraReady ? (
          <div className="mode-placeholder">
            <div className="spinner"></div>
            <p>Waiting for Live Feed...</p>
            <p className="text-xs text-muted">Use button below to start immediately</p>
          </div>
        ) : (
          <div className="live-feed">
            <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
            <button className="btn-capture" onClick={captureLivePhoto} aria-label="Capture"></button>
          </div>
        )}
      </div>

      {/* 2. IMMEDIATE NATIVE ACCESS BUTTON - Labeled and Prominent */}
      <div className="native-access-section animate-fade-in">
        <button
          className="btn btn-primary btn-lg native-shutter-btn"
          onClick={() => nativeCameraInputRef.current?.click()}
        >
          <span className="btn-icon">📸</span>
          CAPTURE PHOTO (Native App)
        </button>
        <p className="helper-text">Opens your phone's built-in camera app</p>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={nativeCameraInputRef}
          style={{ display: 'none' }}
          onChange={handleNativeCapture}
          multiple // Allow multiple photos if browser supports it
        />
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 3. PREVIEW SECTION */}
      <div className="photos-preview">
        <div className="preview-header">
          <h3>Captured Photos ({photos.length})</h3>
          {photos.length > 0 && (
            <button className="btn-clear-all" onClick={() => {
              photos.forEach(url => URL.revokeObjectURL(url));
              setPhotos([]);
            }}>Clear All</button>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="empty-preview">
            <p>No photos captured yet.</p>
          </div>
        ) : (
          <div className="preview-grid">
            {photos.map((url, i) => (
              <div key={i} className="preview-item scale-in">
                <img src={url} alt="Preview" />
                <button className="btn-remove" onClick={() => handleRemovePhoto(i)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. GLOBAL ACTIONS */}
      <div className="camera-actions">
        {isUploading && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
            <p>Uploading... {uploadProgress}%</p>
          </div>
        )}
        <button className="btn btn-success btn-lg w-full" onClick={handleUpload} disabled={photos.length === 0 || isUploading}>
          ✓ SUBMIT ALL PHOTOS
        </button>
        <button className="btn-text mt-4" onClick={onEndSession} disabled={isUploading}>
          Exit Session
        </button>
      </div>
    </div>
  );
}
