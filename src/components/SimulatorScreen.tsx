'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera } from 'lucide-react';
import { ThreeSimulator } from './ThreeSimulator';
import styles from '../app/page.module.css';

interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  difficultyText: string;
  duration: string;
  expectedGestures: string[];
}

interface SimulatorScreenProps {
  activeScenario: Scenario;
  currentView: 'sim' | 'camera';
  airplane: { x: number; y: number; angle: number; vx: number; vy: number };
  detectedGesture: string;
  isRunning: boolean;
  enableSkeleton: boolean;
  points: {
    head: { cx: number; cy: number };
    neck: { cx: number; cy: number };
    pelvis: { cx: number; cy: number };
    lShoulder: { cx: number; cy: number };
    rShoulder: { cx: number; cy: number };
    lElbow: { cx: number; cy: number };
    rElbow: { cx: number; cy: number };
    lWrist: { cx: number; cy: number };
    rWrist: { cx: number; cy: number };
  };
  onFrameCaptured?: (base64: string) => void;
}

export const SimulatorScreen: React.FC<SimulatorScreenProps> = ({
  activeScenario,
  currentView,
  airplane,
  detectedGesture,
  isRunning,
  enableSkeleton,
  points,
  onFrameCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);

  // HTML5 MediaDevice Web Camera handling
  useEffect(() => {
    if (currentView !== 'camera') {
      setHasCameraAccess(null);
      return;
    }

    let activeStream: MediaStream | null = null;

    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCameraAccess(true);
        }
      } catch (err) {
        console.warn('Webcam permission denied or unavailable, showing mock visual:', err);
        setHasCameraAccess(false);
      }
    };

    initWebcam();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentView]);

  // Frame Capture tick loop to send to Python server
  useEffect(() => {
    if (currentView !== 'camera' || !isRunning || !hasCameraAccess || !onFrameCaptured) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Draw frame to hidden canvas and convert to base64 JPEG
        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Frame = canvas.toDataURL('image/jpeg', 0.55); // 55% quality jpeg for lightweight streaming
          onFrameCaptured(base64Frame);
        }
      }
    }, 140); // 7 frames per second (plenty for high-fidelity pose classification)

    return () => clearInterval(interval);
  }, [currentView, isRunning, hasCameraAccess, onFrameCaptured]);

  return (
    <div className={styles.centerPanel}>
      <div className={`${styles.viewTitleCard} glass-panel`}>
        <div>
          <h3 className={styles.currentScenarioTitle}>{activeScenario.name}</h3>
          <p className={styles.currentScenarioDesc}>{activeScenario.description}</p>
        </div>
        <span className={styles.versionTag}>Phiên bản 1.0 AI 3D Trainer</span>
      </div>

      <div className={styles.screenContainer}>
        
        {/* 3D Flight Simulator using Three.js */}
        {currentView === 'sim' && (
          <div className={styles.gridSimulator} style={{ background: '#93c5fd' }}>
            {/* Coordinate Overlay */}
            <div className={styles.coordinateHud}>
              <div>X: {Math.round(airplane.x * 8)} Y: {Math.round(airplane.y * 5)}</div>
              <div>VX: {airplane.vx.toFixed(1)} VY: {airplane.vy.toFixed(1)}</div>
              <div>Gesture: {detectedGesture.toLowerCase() === 'chưa bắt đầu' ? 'none' : detectedGesture}</div>
            </div>

            <ThreeSimulator 
              airplane={airplane}
              detectedGesture={detectedGesture}
              isRunning={isRunning}
            />
          </div>
        )}

        {/* Mock AI Camera feed with SVG skeletons */}
        {currentView === 'camera' && (
          <div className={styles.cameraContainer} style={{ background: '#090a0f', position: 'relative' }}>
            
            {/* Hidden Canvas for video frames extraction */}
            <canvas 
              ref={canvasRef} 
              width="400" 
              height="300" 
              style={{ display: 'none' }}
            />

            {hasCameraAccess === false && (
              <div className={styles.cameraMockOverlay}>
                <AlertCircle size={48} className={styles.cameraMockIcon} />
                <div className={styles.cameraErrorTitle}>Không thể truy cập camera</div>
                <div className={styles.cameraErrorSub}>Vui lòng cấp quyền truy cập camera trong trình duyệt</div>
              </div>
            )}

            {hasCameraAccess === true && (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transform: 'scaleX(-1)' // Mirror view for natural interaction
                }}
              />
            )}

            {hasCameraAccess === null && (
              <div className={styles.cameraMockOverlay}>
                <Camera size={48} className={styles.cameraMockIcon} style={{ color: '#3b82f6' }} />
                <div className={styles.cameraErrorTitle}>Đang tải nguồn camera...</div>
              </div>
            )}

            {/* Joint Overlay */}
            {enableSkeleton && isRunning && (
              <svg 
                className={styles.skeletonOverlay} 
                viewBox="0 0 400 300"
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              >
                {/* Skeleton skeleton body outline */}
                <line x1={points.lShoulder.cx} y1={points.lShoulder.cy} x2={points.rShoulder.cx} y2={points.rShoulder.cy} className={styles.skeletonLine} />
                <line x1={points.lShoulder.cx} y1={points.lShoulder.cy} x2={points.lElbow.cx} y2={points.lElbow.cy} className={styles.skeletonLine} />
                <line x1={points.rShoulder.cx} y1={points.rShoulder.cy} x2={points.rElbow.cx} y2={points.rElbow.cy} className={styles.skeletonLine} />
                <line x1={points.lElbow.cx} y1={points.lElbow.cy} x2={points.lWrist.cx} y2={points.lWrist.cy} className={styles.skeletonLine} />
                <line x1={points.rElbow.cx} y1={points.rElbow.cy} x2={points.rWrist.cx} y2={points.rWrist.cy} className={styles.skeletonLine} />
                <line x1={points.neck.cx} y1={points.neck.cy} x2={points.pelvis.cx} y2={points.pelvis.cy} className={styles.skeletonLine} />
                
                {/* Joints points circles */}
                <circle cx={points.head.cx} cy={points.head.cy} className={styles.skeletonJoint} style={{ r: 8 }} />
                <circle cx={points.neck.cx} cy={points.neck.cy} className={styles.skeletonJoint} />
                <circle cx={points.pelvis.cx} cy={points.pelvis.cy} className={styles.skeletonJoint} />
                <circle cx={points.lShoulder.cx} cy={points.lShoulder.cy} className={styles.skeletonJoint} />
                <circle cx={points.rShoulder.cx} cy={points.rShoulder.cy} className={styles.skeletonJoint} />
                <circle cx={points.lElbow.cx} cy={points.lElbow.cy} className={styles.skeletonJoint} />
                <circle cx={points.rElbow.cx} cy={points.rElbow.cy} className={styles.skeletonJoint} />
                <circle cx={points.lWrist.cx} cy={points.lWrist.cy} className={styles.skeletonJoint} style={{ fill: '#3b82f6' }} />
                <circle cx={points.rWrist.cx} cy={points.rWrist.cy} className={styles.skeletonJoint} style={{ fill: '#3b82f6' }} />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
