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
  const [useSystemCamera, setUseSystemCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemCameraRef = useRef<HTMLInputElement>(null);

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

  // Web Camera Initialization
  useEffect(() => {
    if (useCapacitor || useSystemCamera) return;

    let mounted = true;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Your browser does not support camera access.');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for metadata to load to get dimensions
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              if (mounted) {
                setIsCameraReady(true);
                setCameraError(null);
              }
            }).catch(err => {
              console.error('Play error:', err);
              // Autoplay block? Show error so user can trigger manually
              if (mounted) setCameraError('Tap to start camera feed');
            });
          };
        }
      } catch (err: any) {
        console.error('Camera Init Error:', err);
        if (mounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraError('Permission denied. Please allow camera access.');
          } else {
            setCameraError(err.message || 'Could not start camera.');
          }
          // Suggest system camera if web cam fails
          setUseSystemCamera(true);
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
  }, [useCapacitor, useSystemCamera]);

  const capturePhoto = () => {
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

  const handleSystemCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPhotos(prev => [...prev, url]);
    }
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
      const res = await fetch(url);
      const blob = await res.blob();
      files.push(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }
    await onPhotosCapture(files);
    photos.forEach(url => URL.revokeObjectURL(url));
    setPhotos([]);
  };

  const toggleCameraMode = () => {
    setUseSystemCamera(!useSystemCamera);
    setIsCameraReady(false);
    setCameraError(null);
  };

  return (
    <div className="camera-interface">
      <div className="camera-container">
        {useCapacitor ? (
          <div className="native-camera-placeholder">
            <span className="icon">📷</span>
            <p>Native Mobile Mode</p>
            <button className="btn btn-primary" onClick={captureWithCapacitor}>Take Photo</button>
          </div>
        ) : useSystemCamera ? (
          <div className="system-camera-placeholder">
            <span className="icon">�</span>
            <p>Use your device's native camera app</p>
            <button className="btn btn-primary btn-lg" onClick={() => systemCameraRef.current?.click()}>
              Open System Camera
            </button>
            <button className="btn-text mt-4" onClick={toggleCameraMode} style={{ color: 'white' }}>
              Switch to Live Browser Feed
            </button>
          </div>
        ) : !isCameraReady ? (
          <div className="camera-loading">
            {cameraError ? (
              <div className="error-box">
                <p>{cameraError}</p>
                <button className="btn btn-secondary mt-4" onClick={() => window.location.reload()}>Retry</button>
                <button className="btn-text mt-4 block" onClick={toggleCameraMode} style={{ color: 'white', display: 'block', margin: '1rem auto' }}>
                  Use System Camera instead
                </button>
              </div>
            ) : (
              <div className="loading-box">
                <div className="spinner"></div>
                <p>Starting Live Feed...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="live-feed">
            <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
            <div className="feed-controls">
              <button className="btn-capture" onClick={capturePhoto} aria-label="Capture"></button>
              <button className="btn-switch-mode" onClick={toggleCameraMode} title="Use System Camera">
                🔄
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={systemCameraRef}
        style={{ display: 'none' }}
        onChange={handleSystemCapture}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="photos-preview">
        <h3>Captured Photos ({photos.length})</h3>
        <div className="preview-grid">
          {photos.map((url, i) => (
            <div key={i} className="preview-item">
              <img src={url} alt="Preview" />
              <button className="btn-remove" onClick={() => handleRemovePhoto(i)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="camera-actions">
        {isUploading && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
            <p>Uploading... {uploadProgress}%</p>
          </div>
        )}
        <button className="btn btn-success btn-lg w-full" onClick={handleUpload} disabled={photos.length === 0 || isUploading}>
          ✓ Upload All Photos
        </button>
        <button className="btn btn-danger btn-lg w-full mt-2" onClick={onEndSession} disabled={isUploading}>
          End Session
        </button>
      </div>
    </div>
  );
}
