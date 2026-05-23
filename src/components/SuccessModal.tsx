'use client';

import React from 'react';
import { Award } from 'lucide-react';
import styles from '../app/page.module.css';

interface SuccessModalProps {
  activeScenarioName: string;
  accuracy: number;
  elapsedTime: number;
  formatTime: (time: number) => string;
  onClose: () => void;
  onViewReport: () => void;
  details?: Array<{ gesture_name: string; sequence_index: number; score: number; elapsed_time: number; completed: boolean }>;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  activeScenarioName,
  accuracy,
  elapsedTime,
  formatTime,
  onClose,
  onViewReport,
  details = [],
}) => {
  return (
    <div className={styles.modalBackdrop} style={{ zIndex: 1000 }}>
      <div className={`${styles.modalCard} active-glow`} style={{ zIndex: 1001 }}>
        <div className={styles.modalAwardCircle}>
          <Award size={36} />
        </div>

        <div>
          <h3 className={styles.modalTitle}>HOÀN THÀNH XUẤT SẮC!</h3>
          <p className={styles.modalDesc}>
            Kịch bản <strong>"{activeScenarioName}"</strong> đã được thực hiện an toàn với hiệu suất bay tuyệt vời!
          </p>
        </div>

        <div className={styles.modalMetricsGrid}>
          <div className={styles.modalMetricCol}>
            <span className={styles.modalMetricLabel}>Độ chính xác</span>
            <strong className={styles.modalMetricValGreen}>{accuracy}%</strong>
          </div>
          <div className={styles.modalMetricCol}>
            <span className={styles.modalMetricLabel}>Thời gian bay</span>
            <strong className={styles.modalMetricValBlue}>{formatTime(elapsedTime)}</strong>
          </div>
        </div>

        {details && details.length > 0 && (
          <div style={{ marginTop: '20px', width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              Chấm điểm vi mô từng động tác
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {details.map((detail, index) => (
                <div 
                  key={index} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#1e3a8a', fontWeight: 800 }}>#{detail.sequence_index + 1}</span>
                    <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{detail.gesture_name}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>{detail.elapsed_time}s</span>
                    <strong style={{ 
                      color: detail.score >= 90 ? '#0f766e' : detail.score >= 75 ? '#1d4ed8' : '#b45309',
                      background: detail.score >= 90 ? '#ccfbf1' : detail.score >= 75 ? '#dbeafe' : '#fef3c7',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {detail.score}%
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.modalButtonGroup}>
          <button 
            className={styles.controlBtn}
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Làm lại
          </button>
          <button 
            className={`${styles.controlBtn} ${styles.btnPrimary}`}
            style={{ flex: 1 }}
            onClick={onViewReport}
          >
            Xem báo cáo
          </button>
        </div>
      </div>
    </div>
  );
};
