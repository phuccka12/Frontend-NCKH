'use client';

import React, { useState } from 'react';
import { Shield, User, Lock, Key, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

interface AuthViewProps {
  socketUrl: string;
  onAuthSuccess: (user: { id: string; username: string; full_name: string; token: string }) => void;
  onClose?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ socketUrl, onAuthSuccess, onClose }) => {
  const apiBaseUrl = socketUrl.replace(/\/$/, '');
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { username, password }
      : { username, password, full_name: fullName, email };

    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Có lỗi xảy ra, vui lòng thử lại!');
      }

      if (isLogin) {
        setBiometricScanning(true);
        setTimeout(() => {
          setBiometricScanning(false);
          setIsSuccess(true);
          setTimeout(() => {
            onAuthSuccess({
              id: data.user.id,
              username: data.user.username,
              full_name: data.user.full_name,
              token: data.access_token
            });
          }, 1000);
        }, 1500);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsLogin(true); // Chuyển sang màn đăng nhập
          setPassword('');
          setError(null);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối tới máy chủ!');
    } finally {
      if (!isLogin) {
        setIsLoading(false);
      }
    }
  };


  return (
    <div className="auth-container" onClick={onClose}>
      <div className="auth-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 'bold',
              lineHeight: 0.8,
              zIndex: 20,
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            ×
          </button>
        )}
        {/* Brand Header */}
        <div className="auth-header">
          <div className="brand-logo">
            <Shield size={32} className="logo-icon" />
          </div>
          <h1 className="brand-title">AIRCRAFT MARSHALLER</h1>
          <p className="brand-subtitle">HỆ THỐNG HUẤN LUYỆN ĐIỀU PHỐI AI</p>
        </div>

        {isSuccess ? (
          <div className="success-overlay animate-fade-in">
            <CheckCircle2 size={64} className="success-icon" />
            <h2 className="success-title">
              {isLogin ? 'ĐĂNG NHẬP THÀNH CÔNG' : 'ĐĂNG KÝ THÀNH CÔNG'}
            </h2>
            <p className="success-text">
              {isLogin 
                ? 'Đang đồng bộ hóa dữ liệu từ hệ thống...' 
                : 'Đang chuyển hướng sang trang đăng nhập...'}
            </p>
          </div>
        ) : biometricScanning ? (
          <div className="success-overlay">
            <div className="biometric-scanner">
              <div className="scanner-line" />
              <User size={64} className="scanner-user-icon" />
            </div>
            <h2 className="success-title scan-text">ĐANG XÁC THỰC...</h2>
            <p className="success-text">Đang kết nối vào hệ thống huấn luyện</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-mode-selector">
              <button
                type="button"
                className={`mode-btn ${isLogin ? 'active-mode' : ''}`}
                onClick={() => { setIsLogin(true); setError(null); }}
              >
                ĐĂNG NHẬP
              </button>
              <button
                type="button"
                className={`mode-btn ${!isLogin ? 'active-mode' : ''}`}
                onClick={() => { setIsLogin(false); setError(null); }}
              >
                ĐĂNG KÝ
              </button>
            </div>

            {error && (
              <div className="auth-error-alert">
                <AlertCircle size={16} className="error-icon" />
                <span>{error}</span>
              </div>
            )}

            {!isLogin && (
              <>
                <div className="input-group">
                  <label className="input-label">HỌ VÀ TÊN HỌC VIÊN</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      required
                      className="clean-input"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">ĐỊA CHỈ EMAIL</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      required
                      className="clean-input"
                      placeholder="nguyenvana@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="input-group">
              <label className="input-label">TÊN TÀI KHOẢN (USERNAME)</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  required
                  className="clean-input"
                  placeholder="student01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">MẬT KHẨU (PASSWORD)</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  required
                  className="clean-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="clean-submit-btn"
            >
              {isLoading ? (
                <div className="loader" />
              ) : (
                <>
                  <Key size={18} className="btn-icon" />
                  <span>{isLogin ? 'XÁC THỰC HỆ THỐNG' : 'TẠO TÀI KHOẢN MỚI'}</span>
                </>
              )}
            </button>

            <div className="auth-footer">
              {isLogin ? (
                <>
                  <button
                    type="button"
                    className="demo-btn-action"
                    onClick={() => { setIsLogin(false); setError(null); }}
                  >
                    Chưa có tài khoản? Đăng ký ngay
                  </button>
                  <button
                    type="button"
                    className="demo-btn-action-muted"
                    onClick={() => alert('Vui lòng liên hệ Admin để cấp lại mật khẩu!')}
                  >
                    Quên mật khẩu?
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="demo-btn-action"
                  onClick={() => { setIsLogin(true); setError(null); }}
                >
                  Đã có tài khoản? Đăng nhập ngay
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <style jsx global>{`
        .auth-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 999999;
          font-family: var(--font-family);
        }

        .auth-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 40px 30px;
          z-index: 10;
          box-shadow: var(--shadow-lg);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: var(--accent-blue-bg);
          border-radius: 16px;
          margin-bottom: 15px;
          box-shadow: var(--shadow-sm);
        }

        .logo-icon {
          color: var(--primary);
        }

        .brand-title {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #1e3a8a;
          margin-bottom: 6px;
        }

        .brand-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .auth-mode-selector {
          display: flex;
          background: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .mode-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 600;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all var(--transition-speed) ease;
        }

        .mode-btn:hover:not(.active-mode) {
          background: rgba(0, 0, 0, 0.02);
          color: var(--text-primary);
        }

        .active-mode {
          background: #1e3a8a;
          color: #ffffff;
          box-shadow: var(--shadow-sm);
        }

        .auth-error-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--accent-red-bg);
          border: 1px solid var(--accent-red-border);
          color: var(--accent-red-text);
          font-size: 0.85rem;
          font-weight: 500;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .input-group {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          transition: all var(--transition-speed) ease;
        }

        .clean-input {
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px 12px 12px 42px;
          color: var(--text-primary);
          font-size: 0.95rem;
          outline: none;
          transition: all var(--transition-speed) ease;
        }

        .clean-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        .clean-input:focus + .input-icon {
          color: var(--primary);
        }

        .clean-submit-btn {
          width: 100%;
          background: #1e3a8a;
          border: none;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 14px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all var(--transition-speed) ease;
          box-shadow: var(--shadow-sm);
          margin-top: 15px;
        }

        .clean-submit-btn:hover:not(:disabled) {
          background: #172554;
          transform: translateY(-1px);
        }

        .clean-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .clean-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .demo-btn-action {
          background: transparent;
          border: none;
          color: var(--primary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-speed) ease;
        }

        .demo-btn-action:hover {
          color: var(--primary-hover);
          text-decoration: underline;
        }

        .demo-btn-action-muted {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-speed) ease;
        }

        .demo-btn-action-muted:hover {
          color: var(--text-primary);
          text-decoration: underline;
        }

        .success-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 10px;
        }

        .success-icon {
          color: #10b981;
          margin-bottom: 20px;
        }

        .success-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 10px;
        }

        .success-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .loader {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Biometric Scanner styling clean */
        .biometric-scanner {
          position: relative;
          width: 100px;
          height: 100px;
          border: 2px solid var(--accent-blue-border);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          background: var(--accent-blue-bg);
          overflow: hidden;
        }

        .scanner-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: var(--primary);
          top: 0;
          animation: scan-loop 2s infinite ease-in-out;
          z-index: 5;
        }

        @keyframes scan-loop {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }

        .scanner-user-icon {
          color: var(--primary);
        }

        .scan-text {
          color: var(--primary);
        }
      `}</style>
    </div>
  );
};

