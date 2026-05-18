'use client';

import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import styles from '../app/page.module.css';

interface SettingsViewProps {
  socketUrl: string;
  setSocketUrl: (value: string) => void;
  selectedCamera: string;
  setSelectedCamera: (value: string) => void;
  enableSkeleton: boolean;
  setEnableSkeleton: (value: boolean) => void;
  onSave: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  socketUrl,
  setSocketUrl,
  selectedCamera,
  setSelectedCamera,
  enableSkeleton,
  setEnableSkeleton,
  onSave,
}) => {
  return (
    <main className={`${styles.settingsView} glass-panel`}>
      <div className={styles.settingsSection}>
        <h2 className={styles.settingsSectionTitle}>
          <SettingsIcon size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
          Cấu hình Trình kết nối AI Real-time
        </h2>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Cổng kết nối Socket (Python API / Node Server)</label>
          <input 
            type="text" 
            value={socketUrl}
            onChange={(e) => setSocketUrl(e.target.value)}
            placeholder="http://localhost:5000" 
            className={styles.formInput}
          />
          <span className={styles.currentScenarioDesc}>Địa chỉ WebSocket/Socket.io để truyền tải luồng cử chỉ trực tiếp từ máy ảnh camera.</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Thiết bị Camera nguồn</label>
          <select 
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className={`${styles.formInput} ${styles.selectInput}`}
          >
            <option value="default-webcam">Camera chính tích hợp (Webcam)</option>
            <option value="external-usb">Camera phụ cổng USB (1080p FHD)</option>
            <option value="network-stream">Luồng Stream Camera mạng LAN</option>
          </select>
        </div>

        <div className={styles.checkboxGroup} onClick={() => setEnableSkeleton(!enableSkeleton)}>
          <input 
            type="checkbox" 
            checked={enableSkeleton}
            readOnly
            className={styles.checkboxInput}
          />
          <label className={styles.checkboxLabel}>Hiển thị khung xương AI (Body Landmarks overlay)</label>
        </div>
      </div>

      <div className={styles.settingsSection} style={{ borderTop: '1px solid var(--border-color)' }}>
        <h2 className={styles.settingsSectionTitle}>Thông số nhận dạng bộ lọc cử chỉ</h2>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Độ nhạy cử chỉ tối thiểu (Confidence threshold)</label>
          <input 
            type="range" 
            min="50" 
            max="95" 
            defaultValue="75" 
            className={styles.sliderInput}
          />
          <span className={styles.currentScenarioDesc}>Ngưỡng tối thiểu của tỷ lệ tin cậy AI để được ghi nhận là một hành vi hợp lệ (Khuyên dùng: 75%).</span>
        </div>

        <button 
          className={`${styles.controlBtn} ${styles.btnPrimary} ${styles.settingsSaveButton}`}
          onClick={onSave}
        >
          Lưu cấu hình
        </button>
      </div>
    </main>
  );
};
