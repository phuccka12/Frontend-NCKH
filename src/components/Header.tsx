'use client';

import React, { useState } from 'react';
import { Home as HomeIcon, GraduationCap, BarChart3, Settings as SettingsIcon, LogOut, Image as ImageIcon, User as UserIcon } from 'lucide-react';
import styles from '../app/page.module.css';

interface HeaderProps {
  activeTab: 'home' | 'training' | 'dashboard' | 'settings' | 'upload';
  setActiveTab: (tab: 'home' | 'training' | 'dashboard' | 'settings' | 'upload') => void;
  isConnected: boolean;
  isConnecting: boolean;
  user: { username: string; full_name: string; email?: string } | null;
  onLogout: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isConnected,
  isConnecting,
  user,
  onLogout,
  onOpenAuth,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  return (
    <header className={`${styles.header} glass-panel`}>
      <div className={styles.logoArea}>
        <span className={styles.logoIcon} style={{ color: '#0047AB' }}>✈️</span>
        <div className={styles.logoTitleGroup}>
          <h1 className={styles.logoTitle} style={{ color: '#0047AB', fontWeight: 900 }}>AeroSignal AI</h1>
          <span className={styles.logoSubtitle} style={{ color: '#64748b', fontSize: '0.66rem', letterSpacing: '0.05em' }}>✈️ AI-POWERED GROUND CONTROL</span>
        </div>
      </div>

      <nav className={styles.navigation}>
        <button 
          className={`${styles.navButton} ${activeTab === 'home' ? styles.navButtonActive : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <HomeIcon size={18} />
          Trang chủ
        </button>
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
          className={`${styles.navButton} ${activeTab === 'upload' ? styles.navButtonActive : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <ImageIcon size={18} />
          Nhận diện ảnh
        </button>
        <button 
          className={`${styles.navButton} ${activeTab === 'settings' ? styles.navButtonActive : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={18} />
          Cài đặt
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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

        {user ? (
          <div 
            style={{ position: 'relative' }}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button 
              className="profile-trigger" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(30, 58, 138, 0.05)',
                border: '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div 
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.full_name}
              </span>
            </button>

            {isDropdownOpen && (
              <div 
                className="profile-dropdown glass-panel animate-fade-in"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '240px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 99999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 700 }}>
                    <UserIcon size={14} />
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                      {user.full_name}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{user.username}</span>
                  {user.email && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{user.email}</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                  }}
                >
                  <LogOut size={14} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              background: '#2563eb',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '8px 18px',
              borderRadius: '9999px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(37, 99, 235, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(37, 99, 235, 0.2)';
            }}
          >
            Đăng nhập / Đăng ký
          </button>
        )}
      </div>
    </header>
  );
};
