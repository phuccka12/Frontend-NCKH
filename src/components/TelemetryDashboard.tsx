'use client';

import React from 'react';
import { Target, Activity, Clock, Zap, Video, Plane } from 'lucide-react';
import styles from '../app/page.module.css';

interface TelemetryDashboardProps {
  detectedGesture: string;
  accuracy: number;
  speed: number;
  elapsedTime: number;
  confidence: number;
  overallPerformance: number;
  currentView: 'sim' | 'camera';
  onViewToggle: () => void;
  formatTime: (time: number) => string;
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  detectedGesture,
  accuracy,
  speed,
  elapsedTime,
  confidence,
  overallPerformance,
  currentView,
  onViewToggle,
  formatTime,
}) => {
  return (
    <section className={styles.rightPanel}>
      
      {/* Active Gesture Card */}
      <div className={`${styles.gestureCard} glass-panel`}>
        <span className={styles.gestureLabel}>Cử chỉ hiện tại</span>
        <div className={styles.gestureValWrapper}>
          <span className={styles.gestureVal}>
            {detectedGesture}
          </span>
        </div>
      </div>

      {/* Stats Cards grid */}
      <div className={styles.rightDashboardTitle}>Thống kê thực tế</div>
      <div className={styles.statsGrid}>
        
        {/* Accuracy Card */}
        <div className={`${styles.statCard} ${styles.statCardBlue} glass-panel`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Độ chính xác</span>
            <Target size={18} className={styles.statIconBlue} />
          </div>
          <span className={styles.statVal}>{accuracy}%</span>
          <span className={styles.statTrendRed}>
            ↓ Cần cải thiện
          </span>
        </div>

        {/* Speed Card */}
        <div className={`${styles.statCard} ${styles.statCardGreen} glass-panel`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Tốc độ</span>
            <Activity size={18} className={styles.statIconGreen} />
          </div>
          <span className={styles.statVal}>{speed} <span className={styles.statSubText}>bước/phút</span></span>
          <span className={styles.statTrendGreen}>
            ↑ Tốt
          </span>
        </div>

        {/* Time Card */}
        <div className={`${styles.statCard} ${styles.statCardOrange} glass-panel`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Thời gian</span>
            <Clock size={18} className={styles.statIconOrange} />
          </div>
          <span className={styles.statVal}>{formatTime(elapsedTime)}</span>
        </div>

        {/* AI Confidence Card */}
        <div className={`${styles.statCard} ${styles.statCardPurple} glass-panel`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Độ tin cậy AI</span>
            <Zap size={18} className={styles.statIconPurple} />
          </div>
          <span className={styles.statVal}>{confidence}%</span>
          <span className={styles.statTrendRed}>
            ↓ Cần cải thiện
          </span>
        </div>
      </div>

      {/* Overall Performance Card */}
      <div className={`${styles.performanceCard} glass-panel`}>
        <div className={styles.performanceHeader}>
          <span className={styles.performanceTitle}>Hiệu suất tổng thể</span>
          <span className={styles.performanceVal}>{overallPerformance}%</span>
        </div>
        <div className={styles.performanceTrack}>
          <div 
            className={styles.performanceFill} 
            style={{ width: `${overallPerformance}%` }}
          />
        </div>
      </div>

      {/* View Switcher Button */}
      <button 
        className={`${styles.controlBtn} ${styles.btnPrimary} ${styles.viewSwitcherButton}`}
        onClick={onViewToggle}
      >
        {currentView === 'sim' ? (
          <>
            <Video size={16} fill="white" />
            Hiển thị Camera
          </>
        ) : (
          <>
            <Plane size={16} fill="white" />
            Hiển thị Mô phỏng
          </>
        )}
      </button>
    </section>
  );
};
