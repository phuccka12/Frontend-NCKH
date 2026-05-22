'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera } from 'lucide-react';
import styles from '../app/page.module.css';

const POSE_CONNECTIONS = [
  // Face/Head
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  
  // Torso and Upper limbs
  [11, 12], // Left shoulder - Right shoulder
  [11, 13], [13, 15], // Left arm: shoulder - elbow - wrist
  [12, 14], [14, 16], // Right arm: shoulder - elbow - wrist
  
  // Left hand fingers
  [15, 17], [17, 19], [19, 21], [15, 21],
  // Right hand fingers
  [16, 18], [18, 20], [20, 22], [16, 22],
  
  // Torso side lines & hip
  [11, 23], [12, 24],
  [23, 24], // Left hip - Right hip
  
  // Lower limbs (Legs)
  [23, 25], [25, 27], // Left leg: hip - knee - ankle
  [24, 26], [26, 28], // Right leg: hip - knee - ankle
  
  // Left foot
  [27, 29], [29, 31], [27, 31],
  // Right foot
  [28, 30], [30, 32], [28, 32]
];

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
  currentView?: 'sim' | 'camera';
  airplane?: { x: number; y: number; angle: number; vx: number; vy: number };
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
  allPoints?: { cx: number; cy: number }[] | null;
  activeGestureIndex: number;
  gestureHoldProgress: number;
  onFrameCaptured?: (base64: string, frameId: number) => void;
}

export const SimulatorScreen: React.FC<SimulatorScreenProps> = ({
  activeScenario,
  detectedGesture,
  isRunning,
  enableSkeleton,
  points,
  allPoints,
  activeGestureIndex,
  gestureHoldProgress,
  onFrameCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);

  // HTML5 MediaDevice Web Camera handling
  useEffect(() => {
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
  }, []);

  const onFrameCapturedRef = useRef(onFrameCaptured);
  const frameSeqRef = useRef<number>(0);

  useEffect(() => {
    onFrameCapturedRef.current = onFrameCaptured;
  }, [onFrameCaptured]);

  // Frame Capture tick loop to send to Python server
  useEffect(() => {
    if (!isRunning || !hasCameraAccess) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Draw frame to hidden canvas and convert to base64 JPEG
        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Frame = canvas.toDataURL('image/jpeg', 0.55); // 55% quality jpeg for lightweight streaming
          frameSeqRef.current += 1;
          onFrameCapturedRef.current?.(base64Frame, frameSeqRef.current);
        }
      }
    }, 140); // 7 frames per second (plenty for high-fidelity pose classification)

    return () => clearInterval(interval);
  }, [isRunning, hasCameraAccess]);

  return (
    <div className={styles.centerPanel}>
      <div className={`${styles.viewTitleCard} glass-panel`}>
        <div>
          <h3 className={styles.currentScenarioTitle}>{activeScenario.name}</h3>
          <p className={styles.currentScenarioDesc}>{activeScenario.description}</p>
        </div>
        <span className={styles.versionTag}>Phiên bản 1.0 AI 3D Trainer</span>
      </div>

      <div className={`${styles.screenContainer} ${styles.screenContainerCamera}`}>
        
        {/* Mock AI Camera feed with SVG skeletons */}
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

          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              // transform: 'scaleX(-1)', // Bỏ - Backend đã lật frame
              display: hasCameraAccess === true ? 'block' : 'none'
            }}
          />

          {hasCameraAccess === null && (
            <div className={styles.cameraMockOverlay}>
              <Camera size={48} className={styles.cameraMockIcon} style={{ color: '#3b82f6' }} />
              <div className={styles.cameraErrorTitle}>Đang tải nguồn camera...</div>
            </div>
          )}

          {/* HUD Nhiệm vụ bài học & Tiến trình giữ cử chỉ tay */}
          <div className={styles.taskHudContainer}>
            <span className={styles.taskHudTitle}>BÀI TẬP: THỰC HÀNH TÍN HIỆU GIAO TIẾP</span>
            <div className={styles.taskBadgeList}>
              {activeScenario.expectedGestures.map((gesture, idx) => {
                let badgeStatus = 'upcoming'; // 'completed' | 'active' | 'upcoming'
                if (idx < activeGestureIndex) badgeStatus = 'completed';
                else if (idx === activeGestureIndex) badgeStatus = 'active';

                return (
                  <div 
                    key={`task-${idx}`} 
                    className={`${styles.taskBadge} ${
                      badgeStatus === 'completed' 
                        ? styles.taskBadgeCompleted 
                        : badgeStatus === 'active' 
                        ? styles.taskBadgeActive 
                        : styles.taskBadgeUpcoming
                    }`}
                  >
                    {badgeStatus === 'completed' && <span className={styles.taskBadgeCheck}>✓</span>}
                    {gesture}
                  </div>
                );
              })}
            </div>

            {/* Hold Progress Bar */}
            {isRunning && activeScenario.expectedGestures[activeGestureIndex] && (
              <div className={styles.holdProgressWrapper}>
                <div className={styles.holdProgressTextRow}>
                  <span className={styles.holdProgressLabel}>
                    Hãy giữ vững cử chỉ: <strong className={styles.holdGestureTarget}>{activeScenario.expectedGestures[activeGestureIndex]}</strong>
                  </span>
                  <span className={styles.holdProgressPct}>{gestureHoldProgress}%</span>
                </div>
                <div className={styles.holdProgressBar}>
                  <div 
                    className={styles.holdProgressFill} 
                    style={{ width: `${gestureHoldProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

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
              {allPoints && allPoints.length > 0 ? (
                <>
                  {/* Render full 33-point skeleton */}
                  {POSE_CONNECTIONS.map(([start, end], idx) => {
                    const startPt = allPoints[start];
                    const endPt = allPoints[end];
                    if (!startPt || !endPt) return null;

                    // Determine the type of connection to apply premium classes
                    let lineClass = styles.skeletonLine;
                    if (start < 11 && end < 11) {
                      lineClass = styles.skeletonLineFace;
                    } else if (start >= 23 || end >= 23) {
                      lineClass = styles.skeletonLineLeg;
                    } else if (
                      ((start === 11 && end === 12) || (start === 23 && end === 24) ||
                       (start === 11 && end === 23) || (start === 12 && end === 24))
                    ) {
                      lineClass = styles.skeletonLineTorso;
                    } else {
                      lineClass = styles.skeletonLineArm;
                    }

                    return (
                      <line 
                        key={`full-line-${idx}`} 
                        x1={startPt.cx} 
                        y1={startPt.cy} 
                        x2={endPt.cx} 
                        y2={endPt.cy} 
                        className={lineClass} 
                      />
                    );
                  })}
                  {allPoints.map((pt, idx) => {
                    if (idx < 11) return null; // Clutter-free face

                    let jointClass = styles.skeletonJoint;
                    if (idx === 15 || idx === 16) {
                      jointClass = styles.skeletonJointCritical;
                    } else if (idx >= 23) {
                      jointClass = styles.skeletonJointLeg;
                    } else {
                      jointClass = styles.skeletonJointArm;
                    }

                    return (
                      <circle 
                        key={`full-joint-${idx}`} 
                        cx={pt.cx} 
                        cy={pt.cy} 
                        className={jointClass} 
                      />
                    );
                  })}
                </>
              ) : (
                <>
                  {/* Fallback to original 9-point skeleton */}
                  <line x1={points.lShoulder.cx} y1={points.lShoulder.cy} x2={points.rShoulder.cx} y2={points.rShoulder.cy} className={styles.skeletonLine} />
                  <line x1={points.lShoulder.cx} y1={points.lShoulder.cy} x2={points.lElbow.cx} y2={points.lElbow.cy} className={styles.skeletonLine} />
                  <line x1={points.rShoulder.cx} y1={points.rShoulder.cy} x2={points.rElbow.cx} y2={points.rElbow.cy} className={styles.skeletonLine} />
                  <line x1={points.lElbow.cx} y1={points.lElbow.cy} x2={points.lWrist.cx} y2={points.lWrist.cy} className={styles.skeletonLine} />
                  <line x1={points.rElbow.cx} y1={points.rElbow.cy} x2={points.rWrist.cx} y2={points.rWrist.cy} className={styles.skeletonLine} />
                  <line x1={points.neck.cx} y1={points.neck.cy} x2={points.pelvis.cx} y2={points.pelvis.cy} className={styles.skeletonLine} />
                  
                  <circle cx={points.head.cx} cy={points.head.cy} className={styles.skeletonJoint} style={{ r: 8 }} />
                  <circle cx={points.neck.cx} cy={points.neck.cy} className={styles.skeletonJoint} />
                  <circle cx={points.pelvis.cx} cy={points.pelvis.cy} className={styles.skeletonJoint} />
                  <circle cx={points.lShoulder.cx} cy={points.lShoulder.cy} className={styles.skeletonJoint} />
                  <circle cx={points.rShoulder.cx} cy={points.rShoulder.cy} className={styles.skeletonJoint} />
                  <circle cx={points.lElbow.cx} cy={points.lElbow.cy} className={styles.skeletonJoint} />
                  <circle cx={points.rElbow.cx} cy={points.rElbow.cy} className={styles.skeletonJoint} />
                  <circle cx={points.lWrist.cx} cy={points.lWrist.cy} className={styles.skeletonJoint} style={{ fill: '#3b82f6' }} />
                  <circle cx={points.rWrist.cx} cy={points.rWrist.cy} className={styles.skeletonJoint} style={{ fill: '#3b82f6' }} />
                </>
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
