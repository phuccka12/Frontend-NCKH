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
  selectedModel: 'dnn' | 'rf';
  onModelChange: (model: 'dnn' | 'rf') => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  sensitivity,
  onSensitivityChange,
  selectedModel,
  onModelChange,
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

      <div className={styles.sliderContainer} style={{ maxWidth: '240px', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Bộ phân loại:</span>
        <select 
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as 'dnn' | 'rf')}
          className={`${styles.formInput} ${styles.selectInput}`}
          style={{ 
            width: '100%', 
            padding: '0.35rem 0.5rem', 
            fontSize: '0.8rem', 
            height: 'auto', 
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="dnn">Mô hình DNN</option>
          <option value="rf">Random Forest</option>
        </select>
      </div>
    </div>
  );
};
