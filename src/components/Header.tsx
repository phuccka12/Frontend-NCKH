'use client';

import React from 'react';
import { GraduationCap, BarChart3, Settings as SettingsIcon, LogOut } from 'lucide-react';
import styles from '../app/page.module.css';

interface HeaderProps {
  activeTab: 'training' | 'dashboard' | 'settings';
  setActiveTab: (tab: 'training' | 'dashboard' | 'settings') => void;
  isConnected: boolean;
  isConnecting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isConnected,
  isConnecting,
}) => {
  return (
    <header className={`${styles.header} glass-panel`}>
      <div className={styles.logoArea}>
        <span className={styles.logoIcon}>✈️</span>
        <div className={styles.logoTitleGroup}>
          <h1 className={styles.logoTitle}>Aircraft Marshalling</h1>
          <span className={styles.logoSubtitle}>AI Training System</span>
        </div>
      </div>

      <nav className={styles.navigation}>
        <button 
          className={`${styles.navButton} ${activeTab === 'training' ? styles.navButtonActive : ''}`}
          onClick={() => setActiveTab('training')}
        >
          <GraduationCap size={18} />
          Học tập
        </button>
        <button 
          className={`${styles.navButton} ${activeTab === 'dashboard' ? styles.navButtonActive : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={18} />
          Bảng điều khiển
        </button>
        <button 
          className={`${styles.navButton} ${activeTab === 'settings' ? styles.navButtonActive : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={18} />
          Cài đặt
        </button>
        <button 
          className={`${styles.navButton} ${styles.logoutButton}`}
          onClick={() => alert('Chức năng đăng xuất sẽ quay lại cổng đăng nhập chung.')}
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </nav>

      <div className={styles.connectionIndicator}>
        <div className={`${styles.statusDot} ${
          isConnected ? styles.statusConnected : (isConnecting ? styles.statusConnecting : '')
        }`} />
        <span>
          {isConnected 
            ? 'Đã kết nối AI Server' 
            : (isConnecting ? 'Đang kết nối...' : 'Mô phỏng (Offline)')}
        </span>
      </div>
    </header>
  );
};
