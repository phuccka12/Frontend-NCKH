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
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  activeScenarioName,
  accuracy,
  elapsedTime,
  formatTime,
  onClose,
  onViewReport,
}) => {
  return (
    <div className={styles.modalBackdrop}>
      <div className={`${styles.modalCard} active-glow`}>
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
