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
    expectedGestures: ['DI CHUYỂN THẲNG', 'GIẢM TỐC ĐỘ', 'DỪNG LẠI']
  },
  {
    id: '2',
    name: 'Hướng dẫn tiêu chuẩn',
    description: 'Hướng dẫn máy bay di chuyển vào vạch đỗ an toàn chuẩn sân bay.',
    difficulty: 'easy',
    difficultyText: 'Cơ bản',
    duration: '8 phút',
    expectedGestures: ['DI CHUYỂN THẲNG', 'GIẢM TỐC ĐỘ', 'DỪNG LẠI']
  },
  {
    id: '3',
    name: 'Điều kiện gió mạnh',
    description: 'Điều phối máy bay giữ thăng bằng trong điều kiện thời tiết xấu.',
    difficulty: 'medium',
    difficultyText: 'Trung bình',
    duration: '10 phút',
    expectedGestures: ['RẼ TRÁI', 'RẼ PHẢI', 'DI CHUYỂN THẲNG', 'DỪNG LẠI']
  },
  {
    id: '4',
    name: 'Tình huống khẩn cấp',
    description: 'Xử lý các tình huống nguy hiểm và phát tín hiệu dừng khẩn cấp.',
    difficulty: 'medium',
    difficultyText: 'Trung bình',
    duration: '12 phút',
    expectedGestures: ['DỪNG KHẨN CẤP']
  },
  {
    id: '5',
    name: 'Hướng dẫn ban đêm',
    description: 'Thực hành điều hành bay đêm bằng gậy phát sáng chuyên dụng.',
    difficulty: 'hard',
    difficultyText: 'Nâng cao',
    duration: '15 phút',
    expectedGestures: ['DI CHUYỂN THẲNG', 'RẼ TRÁI', 'RẼ PHẢI', 'DỪNG LẠI']
  },
  {
    id: '6',
    name: 'Máy bay lớn',
    description: 'Điều phối các dòng máy bay Boeing/Airbus thân rộng, tải trọng cực lớn.',
    difficulty: 'hard',
    difficultyText: 'Nâng cao',
    duration: '20 phút',
    expectedGestures: ['DI CHUYỂN THẲNG', 'GIẢM TỐC ĐỘ', 'RẼ TRÁI', 'RẼ PHẢI', 'DỪNG LẠI']
  }
];

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
  const [currentView, setCurrentView] = useState<'sim' | 'camera'>('sim');
  const [sensitivity, setSensitivity] = useState(70);
  const [selectedModel, setSelectedModel] = useState<'dnn' | 'rf'>('dnn');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Active Scenario computed object
  const activeScenario = useMemo(() => {
    return scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  }, [activeScenarioId]);

  // Telemetry metric states (live updates)
  const [airplane, setAirplane] = useState({
    x: 50, // 0 - 100 canvas percentage
    y: 15, // start near the top
    angle: 0, // degrees
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
    setAirplane({
      x: data.x,
      y: data.y,
      vx: data.vx,
      vy: data.vy,
      angle: data.vx * 30 // angle drifts with x-velocity
    });
    setDetectedGesture(data.gesture);
    setConfidence(Math.round(data.confidence * 100));
    setAccuracy(Math.round(data.accuracy * 100));
    setSpeed(data.speed);
    setElapsedTime(data.elapsedTime);

    // Live skeletal joints coordinates from MediaPipe!
    if (data.points) {
      setPoints(data.points);
    }

    // Dynamic calculated overall rating
    const currentPerformance = Math.round((data.accuracy * 0.5 + data.confidence * 0.5) * 100);
    setOverallPerformance(currentPerformance);

    // Auto complete session when airplane gets safely onto gate (y threshold)
    if (data.y >= 80) {
      handleComplete(Math.round(data.accuracy * 100));
    }
  });

  // Start marshalling
  const handleStart = () => {
    setIsRunning(true);
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
    setAirplane({
      x: 50,
      y: 15,
      angle: 0,
      vx: 0,
      vy: 0
    });
    setDetectedGesture('Chưa bắt đầu');
    setAccuracy(0);
    setSpeed(0);
    setElapsedTime(0);
    setConfidence(0);
    setOverallPerformance(0);

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
        
        // Define scenario gesture sequences based on elapsed time ticks
        let expectedGesture = 'DI CHUYỂN THẲNG';
        let isEmergency = activeScenario.expectedGestures.includes('DỪNG KHẨN CẤP');

        if (isEmergency) {
          expectedGesture = 'DỪNG KHẨN CẤP';
        } else {
          if (nextTime > 15) {
            expectedGesture = 'DỪNG LẠI';
          } else if (nextTime > 8) {
            expectedGesture = 'GIẢM TỐC ĐỘ';
          } else if (activeScenario.id === '3' && nextTime > 4) {
            expectedGesture = nextTime % 2 === 0 ? 'RẼ TRÁI' : 'RẼ PHẢI';
          }
        }

        setDetectedGesture(expectedGesture);

        // Set telemetry indicators
        const currentAccuracy = Math.min(98, Math.max(82, 90 + Math.sin(nextTime) * 8));
        const currentConfidence = Math.min(96, Math.max(76, 85 + Math.cos(nextTime) * 6));
        setAccuracy(Math.round(currentAccuracy));
        setConfidence(Math.round(currentConfidence));
        setSpeed(Math.round(18 + Math.sin(nextTime) * 3));
        setOverallPerformance(Math.round(currentAccuracy * 0.6 + currentConfidence * 0.4));

        // Update Airplane X/Y coordinates drift
        setAirplane(prevPlane => {
          let nextY = prevPlane.y + 1.2; // plane travels downward
          let nextX = prevPlane.x;
          let angle = 0;

          if (expectedGesture === 'DỪNG LẠI') {
            nextY = prevPlane.y; // stops moving
          } else if (expectedGesture === 'RẼ TRÁI') {
            nextX = Math.max(25, prevPlane.x - 0.7);
            angle = -20;
          } else if (expectedGesture === 'RẼ PHẢI') {
            nextX = Math.min(75, prevPlane.x + 0.7);
            angle = 20;
          }

          // Trigger completion on y bounds
          if (nextY >= 80) {
            clearInterval(interval);
            setTimeout(() => {
              handleComplete(Math.round(currentAccuracy));
            }, 300);
          }

          return {
            x: nextX,
            y: nextY,
            vx: expectedGesture === 'RẼ PHẢI' ? 0.7 : (expectedGesture === 'RẼ TRÁI' ? -0.7 : 0),
            vy: expectedGesture === 'DỪNG LẠI' ? 0 : 1.2,
            angle
          };
        });

        // Simulating floating green skeletal joint coordinates based on gesture wave
        setPoints(prevPoints => {
          const tick = Date.now() / 150;
          
          if (expectedGesture === 'DI CHUYỂN THẲNG') {
            // Wave hands vertically up and down in loops
            const waveY = Math.sin(tick) * 35;
            return {
              ...prevPoints,
              lElbow: { cx: 130, cy: 155 },
              rElbow: { cx: 270, cy: 155 },
              lWrist: { cx: 120 + Math.cos(tick) * 5, cy: 95 + waveY },
              rWrist: { cx: 280 + Math.sin(tick) * 5, cy: 95 + waveY }
            };
          } else if (expectedGesture === 'GIẢM TỐC ĐỘ') {
            // Slow hover hands below shoulder level
            const slowY = 160 + Math.sin(tick) * 15;
            return {
              ...prevPoints,
              lWrist: { cx: 110, cy: slowY },
              rWrist: { cx: 290, cy: slowY }
            };
          } else if (expectedGesture === 'DỪNG KHẨN CẤP') {
            // Rapidly cross arms overhead
            const shiftX = Math.sin(tick) * 20;
            return {
              ...prevPoints,
              lWrist: { cx: 180 + shiftX, cy: 55 },
              rWrist: { cx: 220 + shiftX, cy: 55 }
            };
          } else {
            // "DỪNG LẠI" - Raise arms in fixed standard shape above head
            return {
              ...prevPoints,
              lWrist: { cx: 150, cy: 45 },
              rWrist: { cx: 250, cy: 45 }
            };
          }
        });

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, activeScenario, isConnected]);

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
              onFrameCaptured={(base64) => sendVideoFrame(base64, selectedModel)}
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
              onModelChange={setSelectedModel}
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
            currentView={currentView}
            onViewToggle={() => setCurrentView(prev => prev === 'sim' ? 'camera' : 'sim')}
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
