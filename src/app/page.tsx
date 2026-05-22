'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSocket, TelemetryData } from '../hooks/useSocket';
import styles from './page.module.css';

// Subcomponents imports
import { Header } from '@/components/Header';
import { ScenarioSelector } from '@/components/ScenarioSelector';
import { SimulatorScreen } from '@/components/SimulatorScreen';
import { ControlToolbar } from '@/components/ControlToolbar';
import { TelemetryDashboard } from '@/components/TelemetryDashboard';
import { DashboardView } from '@/components/DashboardView';
import { SettingsView } from '@/components/SettingsView';
import { SuccessModal } from '@/components/SuccessModal';
import { ImageRecognitionView } from '@/components/ImageRecognitionView';

interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  difficultyText: string;
  duration: string;
  expectedGestures: string[];
}

const scenarios: Scenario[] = [
  {
    id: '1',
    name: 'Hướng dẫn cơ bản',
    description: 'Tìm hiểu các tín hiệu cơ bản của người điều hành mặt đất.',
    difficulty: 'easy',
    difficultyText: 'Cơ bản',
    duration: '5 phút',
    expectedGestures: ['AHEAD', 'STOP']
  },
  {
    id: '2',
    name: 'Hướng dẫn tiêu chuẩn',
    description: 'Hướng dẫn máy bay di chuyển vào vạch đỗ an toàn chuẩn sân bay.',
    difficulty: 'easy',
    difficultyText: 'Cơ bản',
    duration: '8 phút',
    expectedGestures: ['AHEAD', 'LEFT', 'AHEAD', 'RIGHT', 'STOP']
  },
  {
    id: '3',
    name: 'Điều kiện gió mạnh',
    description: 'Điều phối máy bay giữ thăng bằng trong điều kiện thời tiết xấu.',
    difficulty: 'medium',
    difficultyText: 'Trung bình',
    duration: '10 phút',
    expectedGestures: ['LEFT', 'AHEAD', 'RIGHT', 'AHEAD', 'LEFT', 'STOP']
  },
  {
    id: '4',
    name: 'Tình huống khẩn cấp',
    description: 'Xử lý các tình huống nguy hiểm và phát tín hiệu dừng khẩn cấp.',
    difficulty: 'medium',
    difficultyText: 'Trung bình',
    duration: '12 phút',
    expectedGestures: ['AHEAD', 'STOP', 'STOP']
  },
  {
    id: '5',
    name: 'Hướng dẫn ban đêm',
    description: 'Thực hành điều hành bay đêm bằng gậy phát sáng chuyên dụng.',
    difficulty: 'hard',
    difficultyText: 'Nâng cao',
    duration: '15 phút',
    expectedGestures: ['AHEAD', 'LEFT', 'AHEAD', 'RIGHT', 'AHEAD', 'STOP']
  },
  {
    id: '6',
    name: 'Máy bay lớn',
    description: 'Điều phối các dòng máy bay Boeing/Airbus thân rộng, tải trọng cực lớn.',
    difficulty: 'hard',
    difficultyText: 'Nâng cao',
    duration: '20 phút',
    expectedGestures: ['AHEAD', 'LEFT', 'AHEAD', 'RIGHT', 'LEFT', 'STOP']
  }
];

const gestureRules: Record<string, { minConfidence: number; holdMs: number }> = {
  AHEAD: { minConfidence: 0.35, holdMs: 2200 },
  LEFT: { minConfidence: 0.35, holdMs: 2600 },
  RIGHT: { minConfidence: 0.35, holdMs: 2600 },
  STOP: { minConfidence: 0.4, holdMs: 1800 },
  NONE: { minConfidence: 0.0, holdMs: 2000 }
};
const gestureResetGapMs = 500;

export default function Home() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'training' | 'dashboard' | 'settings' | 'upload'>('training');

  // Scenario States
  const [activeScenarioId, setActiveScenarioId] = useState<string>('1');
  const [completedScenarios, setCompletedScenarios] = useState<string[]>(['1', '5']);
  
  // Custom user settings fields
  const [socketUrl, setSocketUrl] = useState(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000');
  const [selectedCamera, setSelectedCamera] = useState('default-webcam');
  const [enableSkeleton, setEnableSkeleton] = useState(true);

  // App core simulator/ticking states
  const [isRunning, setIsRunning] = useState(false);
  const [currentView, setCurrentView] = useState<'sim' | 'camera'>('camera'); // Default to camera
  const [sensitivity, setSensitivity] = useState(70);
  const [selectedModel, setSelectedModel] = useState<'dnn' | 'rf'>('dnn');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Active Scenario computed object
  const activeScenario = useMemo(() => {
    return scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  }, [activeScenarioId]);

  // Telemetry metric states (live updates)
  const [airplane, setAirplane] = useState({
    x: 50,
    y: 15,
    angle: 0,
    vx: 0,
    vy: 0
  });

  const [detectedGesture, setDetectedGesture] = useState<string>('Chưa bắt đầu');
  const [accuracy, setAccuracy] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [overallPerformance, setOverallPerformance] = useState<number>(0);

  // Recharts Chart database state
  const [scoresData, setScoresData] = useState<Record<string, number>>({
    '1': 92,
    '2': 88,
    '3': 0,
    '4': 0,
    '5': 85,
    '6': 0
  });

  // Skeletal simulation joints points refs
  const [points, setPoints] = useState({
    head: { cx: 200, cy: 75 },
    neck: { cx: 200, cy: 95 },
    pelvis: { cx: 200, cy: 195 },
    lShoulder: { cx: 160, cy: 115 },
    rShoulder: { cx: 240, cy: 115 },
    lElbow: { cx: 140, cy: 165 },
    rElbow: { cx: 260, cy: 165 },
    lWrist: { cx: 120, cy: 215 },
    rWrist: { cx: 280, cy: 215 }
  });

  const [allPoints, setAllPoints] = useState<{ cx: number; cy: number }[] | null>(null);

  // Training dynamic progress tracking
  const [activeGestureIndex, setActiveGestureIndex] = useState<number>(0);
  const [gestureHoldProgress, setGestureHoldProgress] = useState<number>(0);
  const [lastDetectedGesture, setLastDetectedGesture] = useState<string>('NONE');
  const lastProgressResetRef = useRef<number>(0);
  const needsGestureResetRef = useRef<boolean>(false);
  const lastCompletedGestureRef = useRef<string>('');
  const matchingStartRef = useRef<number | null>(null);
  const resetGapStartRef = useRef<number | null>(null);
  const lastTargetRef = useRef<string>('');

  const updateGestureProgress = (detected: string, confidenceVal: number) => {
    // Cập nhật lần phát hiện cuối cùng
    setLastDetectedGesture(detected);
    
    const targetGesture = activeScenario.expectedGestures[activeGestureIndex];
    if (!targetGesture) return;

    const isMatching = detected.trim().toUpperCase() === targetGesture.trim().toUpperCase();

    console.log('isMatching:', isMatching, 'confidenceVal:', confidenceVal, 'activeGestureIndex:', activeGestureIndex, 'expectedGestures:', activeScenario.expectedGestures);
    console.log('showSuccessModal:', showSuccessModal);

    const detectedUpper = detected.trim().toUpperCase();
    const targetUpper = targetGesture.trim().toUpperCase();

    if (needsGestureResetRef.current) {
      if (detectedUpper === lastCompletedGestureRef.current) {
        // Chưa rời khỏi cử chỉ trước đó, không tính tiến trình mới
        resetGapStartRef.current = null;
        return;
      }
      if (resetGapStartRef.current === null) {
        resetGapStartRef.current = Date.now();
        return;
      }
      if (Date.now() - resetGapStartRef.current < gestureResetGapMs) {
        // Cần giữ trạng thái khác cử chỉ cũ đủ lâu
        return;
      }
      // Đã rời khỏi cử chỉ cũ đủ lâu, cho phép bắt đầu cử chỉ mới
      needsGestureResetRef.current = false;
      resetGapStartRef.current = null;
    }

    const rule = gestureRules[targetUpper] || { minConfidence: 0.35, holdMs: 2200 };
    if (isMatching && confidenceVal >= rule.minConfidence) {
      // Yêu cầu 500ms đã trôi qua kể từ lần hoàn thành cử chỉ trước để tránh transition quá nhanh
      const timeSinceReset = Date.now() - lastProgressResetRef.current;
      if (timeSinceReset < gestureResetGapMs) {
        // Quá nhanh - bỏ qua, đây có thể là dư âm cử chỉ cũ
        return;
      }

      if (lastTargetRef.current !== targetUpper || matchingStartRef.current === null) {
        matchingStartRef.current = Date.now();
        lastTargetRef.current = targetUpper;
      }

      const elapsed = Date.now() - (matchingStartRef.current || Date.now());
      const requiredHoldMs = rule.holdMs;
      const progress = Math.min(100, Math.round((elapsed / requiredHoldMs) * 100));
      setGestureHoldProgress(progress);

      if (elapsed >= requiredHoldMs) {
        // Ghi nhận thời điểm hoàn thành
        lastProgressResetRef.current = Date.now();
        needsGestureResetRef.current = true;
        lastCompletedGestureRef.current = targetUpper;
        matchingStartRef.current = null;
        setGestureHoldProgress(0);

        // Hoàn thành cử chỉ hiện tại
        if (activeGestureIndex + 1 >= activeScenario.expectedGestures.length) {
          // Hoàn thành toàn bộ kịch bản huấn luyện!
          setIsRunning(false);
          setShowSuccessModal(true);
          
          // Lưu kịch bản hoàn thành
          if (!completedScenarios.includes(activeScenarioId)) {
            setCompletedScenarios(prevList => [...prevList, activeScenarioId]);
          }
          
          const finalAccuracy = Math.round(confidenceVal * 100);
          setScoresData(prevScores => ({
            ...prevScores,
            [activeScenarioId]: Math.max(prevScores[activeScenarioId] || 0, finalAccuracy)
          }));
        } else {
          setActiveGestureIndex(idx => idx + 1);
        }
      }
    } else {
      // Mất khớp -> reset thời gian giữ cử chỉ
      matchingStartRef.current = null;
      setGestureHoldProgress(prev => Math.max(0, prev - 10));
    }
  };

  // Real-time Socket io custom React Hook
  const { 
    isConnected, 
    isConnecting, 
    sendVideoFrame,
    startSession, 
    pauseSession, 
    resetSession,
    updateSettings,
    socket
  } = useSocket(socketUrl, (data: TelemetryData) => {
    // If the websocket triggers telemetry events, we directly feed values onto our HUD
    setDetectedGesture(data.gesture);
    setConfidence(Math.round(data.confidence * 100));
    setAccuracy(Math.round(data.accuracy * 100));
    setSpeed(data.speed);
    setElapsedTime(data.elapsedTime);

    // Live skeletal joints coordinates from MediaPipe!
    if (data.points) {
      setPoints(data.points);
    }
    if (data.allPoints) {
      setAllPoints(data.allPoints);
    } else {
      setAllPoints(null);
    }

    // Dynamic calculated overall rating
    const currentPerformance = Math.round((data.accuracy * 0.5 + data.confidence * 0.5) * 100);
    setOverallPerformance(currentPerformance);

    // Update real-time exercise progress
    if (isRunning) {
      updateGestureProgress(data.gesture, data.confidence);
    }
  });

  // Start marshalling
  const handleStart = () => {
    setIsRunning(true);
    lastProgressResetRef.current = Date.now(); // Không yêu cầu transition cho cự chỉ đầu tiên
    needsGestureResetRef.current = false;
    lastCompletedGestureRef.current = '';
    matchingStartRef.current = null;
    resetGapStartRef.current = null;
    lastTargetRef.current = '';
    if (isConnected) {
      startSession(activeScenarioId);
    }
  };

  // Pause marshalling
  const handlePause = () => {
    setIsRunning(false);
    if (isConnected) {
      pauseSession();
    }
  };

  // Reset simulator
  const handleReset = () => {
    setIsRunning(false);
    setShowSuccessModal(false);
    setDetectedGesture('Chưa bắt đầu');
    setAccuracy(0);
    setSpeed(0);
    setElapsedTime(0);
    setConfidence(0);
    setOverallPerformance(0);
    setAllPoints(null);
    setActiveGestureIndex(0);
    setGestureHoldProgress(0);
    lastProgressResetRef.current = Date.now(); // Reset transition timer
    needsGestureResetRef.current = false;
    lastCompletedGestureRef.current = '';
    matchingStartRef.current = null;
    resetGapStartRef.current = null;
    lastTargetRef.current = '';

    if (isConnected) {
      resetSession();
    }
  };

  // Switch scenario resets metrics
  const handleScenarioChange = (id: string) => {
    setActiveScenarioId(id);
    handleReset();
  };

  // Settings modification notifier
  const handleSaveSettings = () => {
    if (isConnected) {
      updateSettings({ sensitivity });
    }
    alert('Đã cập nhật cấu hình hệ thống thành công!');
  };

  // Success completed callback
  const handleComplete = (finalAccuracy: number) => {
    setIsRunning(false);
    setShowSuccessModal(true);
    
    // Add to completion array if new
    if (!completedScenarios.includes(activeScenarioId)) {
      setCompletedScenarios(prev => [...prev, activeScenarioId]);
    }

    // Save Recharts score records
    setScoresData(prev => ({
      ...prev,
      [activeScenarioId]: Math.max(prev[activeScenarioId] || 0, finalAccuracy)
    }));
  };

  // Offline Simulation engine loops
  useEffect(() => {
    if (!isRunning || isConnected) return; // utilize offline mock loop ONLY when server is disconnected

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const nextTime = prev + 1;
        
        // Lấy cử chỉ hiện tại yêu cầu của kịch bản
        const currentTarget = activeScenario.expectedGestures[activeGestureIndex] || 'NONE';
        setDetectedGesture(currentTarget);

        // Đặt chỉ số mô phỏng
        const currentAccuracy = Math.min(98, Math.max(85, 92 + Math.sin(nextTime) * 4));
        const currentConfidence = Math.min(96, Math.max(80, 88 + Math.cos(nextTime) * 5));
        setAccuracy(Math.round(currentAccuracy));
        setConfidence(Math.round(currentConfidence));
        setSpeed(Math.round(18 + Math.sin(nextTime) * 2));
        setOverallPerformance(Math.round(currentAccuracy * 0.5 + currentConfidence * 0.5));

        // Tích lũy tiến trình giữ cử chỉ (chạy offline sẽ mô phỏng khớp 35% mỗi giây để hoàn thành mượt mà)
        updateGestureProgress(currentTarget, currentConfidence / 100);

        // Giả lập vẽ bộ xương di chuyển theo cử chỉ để tạo hiệu ứng sinh động khi test offline
        setPoints(prevPoints => {
          const tick = Date.now() / 150;
          
          if (currentTarget === 'AHEAD') {
            const waveY = Math.sin(tick) * 35;
            return {
              ...prevPoints,
              lElbow: { cx: 130, cy: 155 },
              rElbow: { cx: 270, cy: 155 },
              lWrist: { cx: 120 + Math.cos(tick) * 5, cy: 95 + waveY },
              rWrist: { cx: 280 + Math.sin(tick) * 5, cy: 95 + waveY }
            };
          } else if (currentTarget === 'LEFT') {
            const shiftX = Math.sin(tick) * 30;
            return {
              ...prevPoints,
              lWrist: { cx: 80 + shiftX, cy: 80 },
              rWrist: { cx: 200, cy: 120 }
            };
          } else if (currentTarget === 'RIGHT') {
            const shiftX = Math.sin(tick) * 30;
            return {
              ...prevPoints,
              lWrist: { cx: 320 + shiftX, cy: 80 },
              rWrist: { cx: 200, cy: 120 }
            };
          } else if (currentTarget === 'STOP') {
            const shiftX = Math.sin(tick) * 20;
            return {
              ...prevPoints,
              lWrist: { cx: 180 + shiftX, cy: 55 },
              rWrist: { cx: 220 + shiftX, cy: 55 }
            };
          } else {
            // NONE - tư thế bình thường
            return {
              ...prevPoints,
              lWrist: { cx: 150, cy: 120 },
              rWrist: { cx: 250, cy: 120 }
            };
          }
        });

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, activeScenario, isConnected, activeGestureIndex]);

  // Formatter for seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Recharts scenario score computations
  const scenarioChartData = useMemo(() => {
    return scenarios.map(s => ({
      name: s.id === '1' ? 'Cơ bản 1' : (s.id === '2' ? 'Cơ bản 2' : s.name),
      score: scoresData[s.id] || 0,
      amt: 100
    }));
  }, [scoresData]);

  // Calculate difficulty distribution for PieChart
  const difficultyDistribution = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0 };
    scenarios.forEach(s => {
      counts[s.difficulty]++;
    });
    return [
      { name: 'Cơ bản', value: counts.easy, color: '#1e3a8a' }, // Deep/navy blue segment
      { name: 'Trung bình', value: counts.medium, color: '#3b82f6' }, // Light blue
      { name: 'Nâng cao', value: counts.hard, color: '#60a5fa' } // Sky blue
    ];
  }, []);

  const getOverallAccuracyAvg = () => {
    const completedList = Object.values(scoresData).filter(score => score > 0);
    if (completedList.length === 0) return 0;
    const sum = completedList.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / completedList.length);
  };

  const handleModelChange = (model: 'dnn' | 'rf') => {
    setSelectedModel(model);
    window.location.reload(); // Refresh the page to avoid cache issues
  };

  return (
    <div className={styles.pageContainer}>
      
      {/* 1. Brand Header */}
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        isConnecting={isConnecting}
      />

      {/* 2. Main Page Renderings depending on active tab */}
      {activeTab === 'training' && (
        <main className={styles.workspace}>
          
          {/* Left: Scenarios Selector panel */}
          <ScenarioSelector 
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            completedScenarios={completedScenarios}
            onScenarioChange={handleScenarioChange}
          />

          {/* Center: Main Visualizer Screen & Play controls */}
          <div className={styles.centerPanel}>
            <SimulatorScreen 
              activeScenario={activeScenario}
              currentView={currentView}
              airplane={airplane}
              detectedGesture={detectedGesture}
              isRunning={isRunning}
              enableSkeleton={enableSkeleton}
              points={points}
              allPoints={allPoints}
              activeGestureIndex={activeGestureIndex}
              gestureHoldProgress={gestureHoldProgress}
              onFrameCaptured={(base64, frameId) => sendVideoFrame(base64, selectedModel, frameId)}
            />

            <ControlToolbar 
              isRunning={isRunning}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              sensitivity={sensitivity}
              onSensitivityChange={(val) => {
                setSensitivity(val);
                if (isConnected) {
                  updateSettings({ sensitivity: val });
                }
              }}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
          </div>

          {/* Right: HUD Telemetry metrics grid */}
          <TelemetryDashboard 
            detectedGesture={detectedGesture}
            accuracy={accuracy}
            speed={speed}
            elapsedTime={elapsedTime}
            confidence={confidence}
            overallPerformance={overallPerformance}
            formatTime={formatTime}
          />
        </main>
      )}

      {activeTab === 'dashboard' && (
        <DashboardView 
          completedScenarios={completedScenarios}
          onBackToTraining={() => setActiveTab('training')}
          difficultyDistribution={difficultyDistribution}
          scenarioChartData={scenarioChartData}
          getOverallAccuracyAvg={getOverallAccuracyAvg}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView 
          socketUrl={socketUrl}
          setSocketUrl={setSocketUrl}
          selectedCamera={selectedCamera}
          setSelectedCamera={setSelectedCamera}
          enableSkeleton={enableSkeleton}
          setEnableSkeleton={setEnableSkeleton}
          onSave={handleSaveSettings}
        />
      )}

      {activeTab === 'upload' && (
        <ImageRecognitionView 
          socket={socket}
          isConnected={isConnected}
          socketUrl={socketUrl}
        />
      )}

      {/* 3. Successful Marshalling Completion Popup Modal Overlay */}
      {showSuccessModal && (
        <SuccessModal 
          activeScenarioName={activeScenario.name}
          accuracy={accuracy}
          elapsedTime={elapsedTime}
          formatTime={formatTime}
          onClose={handleReset}
          onViewReport={() => {
            setShowSuccessModal(false);
            setActiveTab('dashboard');
          }}
        />
      )}
    </div>
  );
}
