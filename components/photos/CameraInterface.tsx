'use client';

import { useRef, useState, useEffect } from 'react';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import imageCompression from 'browser-image-compression';
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

    if (photos.length >= 20) {
      alert('تم الوصول للحد الأقصى (20 صورة في المرة الواحدة)');
      return;
    }

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

      const availableSlots = 20 - photos.length;
      if (availableSlots <= 0) {
        alert('تم الوصول للحد الأقصى (20 صورة في المرة الواحدة)');
        if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = '';
        return;
      }

      let toAdd = filesArray;
      if (filesArray.length > availableSlots) {
        alert(`تم تحديد عدد كبير من الصور. سيتم إضافة ${availableSlots} صورة فقط للوصول للحد الأقصى (20).`);
        toAdd = filesArray.slice(0, availableSlots);
      }

      const newUrls = toAdd.map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newUrls]);
    }
    // Reset input so the same file can be picked again if needed
    if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = '';
  };

  const captureWithCapacitor = async () => {
    if (photos.length >= 20) {
      alert('تم الوصول للحد الأقصى (20 صورة في المرة الواحدة)');
      return;
    }

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

    // Compression Options
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
    };

    for (const url of photos) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();

        // Convert Blob to File
        const rawFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });

        // Compress
        const compressedFile = await imageCompression(rawFile, options);
        files.push(new File([compressedFile], rawFile.name, { type: 'image/jpeg' }));
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
          <div className="mode-placeholder glass-panel">
            <span className="icon">📸</span>
            <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>وضع التطبيق</p>
            <button className="btn btn-primary btn-xl" onClick={captureWithCapacitor} style={{ padding: '1.5rem 2.5rem', fontSize: '1.5rem' }}>
              فتح الكاميرا
            </button>
          </div>
        ) : !isCameraReady ? (
          <div className="mode-placeholder glass-panel">
            <div className="spinner big"></div>
            <p style={{ marginTop: '1rem', fontSize: '1.2rem', color: '#0A0A0A', fontWeight: '600' }}>جاري تجهيز الكاميرا...</p>
            <p className="text-sm" style={{ color: '#737373' }}>يمكنك استخدام زر الالتقاط بالأسفل للبدء فوراً</p>
          </div>
        ) : (
          <div className="live-feed">
            <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
            <button
              className="btn-capture big-shutter"
              onClick={captureLivePhoto}
              aria-label="التقاط"
              disabled={photos.length >= 20}
              style={{ opacity: photos.length >= 20 ? 0.5 : 1 }}
            ></button>
          </div>
        )}
      </div>

      {/* 2. IMMEDIATE NATIVE ACCESS BUTTON - Labeled and Prominent */}
      <div className="native-access-section animate-fade-in">
        <button
          className="btn btn-primary btn-xxl native-shutter-btn big-action-btn"
          onClick={() => {
            if (photos.length >= 20) {
              alert('تم الوصول للحد الأقصى (20 صورة في المرة الواحدة)');
            } else {
              nativeCameraInputRef.current?.click();
            }
          }}
          disabled={photos.length >= 20}
          style={{
            width: '100%',
            height: '100px',
            fontSize: '1.75rem',
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            background: photos.length >= 20 ? '#f3f4f6' : '#FFFFFF',
            color: photos.length >= 20 ? '#9ca3af' : '#0A0A0A',
            border: '1px solid #0A0A0A',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: photos.length >= 20 ? 'not-allowed' : 'pointer',
            opacity: photos.length >= 20 ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (photos.length >= 20) return;
            e.currentTarget.style.background = '#0A0A0A';
            e.currentTarget.style.color = '#D4AF37';
          }}
          onMouseLeave={(e) => {
            if (photos.length >= 20) return;
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.color = '#0A0A0A';
          }}
        >
          <span className="btn-icon" style={{ fontSize: '2.5rem' }}>📸</span>
          التقاط صورة الآن
        </button>
        <p className="helper-text" style={{ marginTop: '0.75rem', fontSize: '1rem', textAlign: 'center', color: '#737373' }}>
          سيتم فتح كاميرا الجوال الأساسية للالتقاط
        </p>

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
      <div className="photos-preview glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem', borderRadius: '1.5rem' }}>
        <div className="preview-header" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#0A0A0A' }}>الصور الملتقطة ({photos.length}/20)</h3>
          {photos.length > 0 && (
            <button className="btn-clear-all" onClick={() => {
              if (window.confirm('هل تريد مسح جميع الصور؟')) {
                photos.forEach(url => URL.revokeObjectURL(url));
                setPhotos([]);
              }
            }} style={{ background: 'rgba(255, 107, 107, 0.05)', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.1)' }}>مسح الكل</button>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="empty-preview" style={{ padding: '2rem' }}>
            <p>لا توجد صور ملتقطة بعد.</p>
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
      <div className="camera-actions" style={{ marginTop: '1.5rem' }}>
        {isUploading && (
          <div className="progress-container glass-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '2rem' }}>
            <div className="progress-bar-container" style={{ background: 'rgba(0,0,0,0.05)', height: '12px', borderRadius: '1rem', overflow: 'hidden' }}>
              <div className="progress-bar" style={{ width: `${uploadProgress}%`, height: '100%', background: '#D4AF37', transition: 'width 0.3s ease' }}></div>
            </div>
            <p style={{ marginTop: '0.5rem', textAlign: 'center', fontWeight: 600, color: '#737373' }}>جاري الرفع... {uploadProgress}%</p>
          </div>
        )}
        <button
          className="btn btn-success btn-xxl w-full big-submit-btn glass-btn"
          onClick={handleUpload}
          disabled={photos.length === 0 || isUploading}
          style={{
            width: '100%',
            height: '80px',
            fontSize: '1.5rem',
            borderRadius: '100px', // Fully rounded
            background: '#D4AF37',
            color: '#0A0A0A',
            border: 'none',
            boxShadow: '0 8px 30px rgba(212, 175, 55, 0.3)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          ✓ إرسال الصور ( {photos.length} )
        </button>
        <button
          className="btn btn-danger btn-xxl w-full big-submit-btn glass-btn"
          onClick={onEndSession}
          disabled={isUploading}
          style={{
            width: '100%',
            height: '70px',
            fontSize: '1.25rem',
            borderRadius: '100px', // Fully rounded
            marginTop: '1.25rem',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.1)',
            background: 'rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          ✕ إنهاء الجلسة والخروج
        </button>
      </div>
    </div>
  );
}
