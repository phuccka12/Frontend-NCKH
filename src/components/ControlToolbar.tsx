'use client';

import React from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import styles from '../app/page.module.css';

interface ControlToolbarProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  sensitivity,
  onSensitivityChange,
}) => {
  return (
    <div className={`${styles.toolbar} glass-panel`}>
      <div className={styles.buttonGroup}>
        {!isRunning ? (
          <button 
            className={`${styles.controlBtn} ${styles.btnPrimary}`}
            onClick={onStart}
          >
            <Play size={16} fill="white" />
            Bắt đầu
          </button>
        ) : (
          <button 
            className={`${styles.controlBtn}`}
            onClick={onPause}
          >
            <Pause size={16} fill="#64748b" />
            Tạm dừng
          </button>
        )}
        
        <button 
          className={`${styles.controlBtn}`}
          onClick={onReset}
        >
          <RotateCcw size={16} />
          Đặt lại
        </button>
      </div>

      <div className={styles.sliderContainer}>
        <Volume2 size={16} className={styles.sliderIcon} />
        <input 
          type="range" 
          min="30" 
          max="100" 
          value={sensitivity}
          onChange={(e) => onSensitivityChange(parseInt(e.target.value))}
          className={styles.sliderInput} 
        />
        <span className={styles.sliderVal}>{sensitivity}%</span>
      </div>
    </div>
  );
};
