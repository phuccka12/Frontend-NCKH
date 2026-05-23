'use client';

import React, { useState } from 'react';
import { Play, Award, Cpu, BookOpen, Layers, CheckCircle2, ChevronRight, HelpCircle, Shield, ArrowRight, Eye, Cloud, BarChart2, Clock } from 'lucide-react';
import styles from '../app/page.module.css';

interface HomeViewProps {
  completedScenariosCount: number;
  overallAccuracyAvg: number;
  studyTimeText: string;
  onNavigate: (tab: 'home' | 'training' | 'dashboard' | 'settings' | 'upload') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  completedScenariosCount,
  overallAccuracyAvg,
  studyTimeText,
  onNavigate,
}) => {
  const [activeGestureTab, setActiveGestureTab] = useState<'AHEAD' | 'LEFT' | 'RIGHT' | 'STOP'>('AHEAD');

  const gestureDetails = {
    AHEAD: {
      key: "AHEAD",
      title: "Di chuyển thẳng phía trước",
      description: "Dẫn hướng cho máy bay di chuyển thẳng dọc theo vạch dừng an toàn.",
      standard: "2.2 giây",
      confidence: "35%",
      instructions: [
        "Giơ cả hai cánh tay lên cao, lòng bàn tay hướng về phía sau.",
        "Gập cánh tay từ khuỷu tay lên xuống liên tục.",
        "Duy trì tốc độ ổn định cho đến khi máy bay đến vị trí cần thiết."
      ],
      color: "#0047AB",
      bgLight: "rgba(0, 71, 171, 0.03)",
      hologramPath: "/hologram4.png"
    },
    LEFT: {
      key: "LEFT",
      title: "Rẽ về bên trái của bạn",
      description: "Dẫn hướng máy bay chuyển làn sang trái bằng cách làm cột mốc bên phải và vẫy tay trái.",
      standard: "2.6 giây",
      confidence: "35%",
      instructions: [
        "Giương cánh tay phải thẳng đứng trên đầu làm mốc cố định.",
        "Cánh tay trái đưa ngang vai và gập nhịp nhàng về phía mũi.",
        "Giữ thăng bằng và tốc độ vẫy đều đặn."
      ],
      color: "#0047AB",
      bgLight: "rgba(0, 71, 171, 0.03)",
      hologramPath: "/hologram2.png"
    },
    RIGHT: {
      key: "RIGHT",
      title: "Rẽ về bên phải của bạn",
      description: "Dẫn hướng máy bay chuyển làn sang phải bằng cách làm cột mốc bên trái và vẫy tay phải.",
      standard: "2.6 giây",
      confidence: "35%",
      instructions: [
        "Giương cánh tay trái thẳng đứng trên đầu làm mốc cố định.",
        "Cánh tay phải đưa ngang vai và gập nhịp nhàng về phía mũi.",
        "Duy trì tốc độ vẫy đồng bộ để hướng phi công đúng vạch."
      ],
      color: "#0047AB",
      bgLight: "rgba(0, 71, 171, 0.03)",
      hologramPath: "/hologram.png"
    },
    STOP: {
      key: "STOP",
      title: "Dừng khẩn cấp (Emergency Stop)",
      description: "Bắt buộc phi công phanh máy bay đứng yên tại chỗ lập tức.",
      standard: "1.8 giây",
      confidence: "40%",
      instructions: [
        "Bắt chéo hai cánh tay thẳng đứng qua đầu tạo hình chữ X.",
        "Đứng thẳng và giữ hoàn toàn yên lặng không được chuyển động.",
        "Đảm bảo phi công nhìn thấy rõ hiệu lệnh để phanh gấp."
      ],
      color: "#ef4444",
      bgLight: "rgba(239, 68, 68, 0.03)",
      hologramPath: "/hologram2.png"
    }
  };

  return (
    <main className="animate-fade-in" style={{ padding: 0, width: '100%', boxSizing: 'border-box', background: '#f8fafc', minHeight: '100vh' }}>

      {/* 1. Hero Full Width Banner with Airbus background */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.88) 35%, rgba(15, 23, 42, 0.4) 70%, rgba(15, 23, 42, 0.8) 100%), url(/marshaller_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '100px 8%',
          color: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '520px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ maxWidth: '680px', zIndex: 2 }}>
          {/* Compliance Tag */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(147, 197, 253, 0.3)',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#93c5fd',
            marginBottom: '20px'
          }}>
            ✈️ AVIATION STANDARDS COMPLIANT
          </div>

          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            lineHeight: 1.2,
            margin: '0 0 18px 0',
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textTransform: 'uppercase'
          }}>
            Hệ thống huấn luyện<br />điều phối viên máy bay<br />dùng AI
          </h2>

          <p style={{
            fontSize: '0.96rem',
            color: '#cbd5e1',
            margin: '0 0 32px 0',
            lineHeight: 1.6,
            fontWeight: 500
          }}>
            Nền tảng đào tạo kỹ năng điều phối mặt đất sân bay chuẩn Quốc tế ICAO. Ứng dụng mô hình mạng nơ-ron sâu DNN và thư viện MediaPipe để phân tích tư thế khớp xương thời gian thực, đảm bảo an toàn tuyệt đối trong vận hành hàng không.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('training')}
              style={{
                background: '#0047AB',
                color: '#ffffff',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 71, 171, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e3a8a';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0047AB';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Bắt đầu luyện tập <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '14px 28px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              Xem bảng thành tích
            </button>
          </div>
        </div>

        {/* Dynamic HUD Overlays */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '8%',
          display: 'flex',
          gap: '30px',
          zIndex: 2,
          flexWrap: 'wrap',
          fontSize: '0.78rem',
          color: '#cbd5e1'
        }}>
          <div>
            <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.95rem' }}>ICAO</strong>
            <span>An toàn hàng không chuẩn quốc tế</span>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', height: '24px', alignSelf: 'center' }} />
          <div>
            <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.95rem' }}>DNN + MP</strong>
            <span>Phân tích thời gian thực</span>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', height: '24px', alignSelf: 'center' }} />
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '6px 14px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            color: '#60a5fa'
          }}>
            TRAINING MODULE: MARSHALLING // SKELETON TRACKING // MEDIAPIPE
          </div>
        </div>
      </div>

      {/* 2. "Nền Tảng Công Nghệ Cốt Lõi" Section */}
      <section style={{ padding: '60px 8%', textAlign: 'center', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
          Nền Tảng Công Nghệ Cốt Lõi
        </h3>
        <div style={{ width: '60px', height: '4px', background: '#0047AB', margin: '0 auto 40px auto', borderRadius: '2px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>

          {/* Card 1 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px 24px', textAlign: 'left', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 71, 171, 0.05)', color: '#0047AB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Eye size={20} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>AI Computer Vision</h4>
            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
              Nhận diện cử chỉ 21 điểm khớp tay và 33 điểm khớp xương cơ thể với độ trễ cực thấp (&lt; 2.0ms) thông qua MediaPipe framework.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px 24px', textAlign: 'left', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 71, 171, 0.05)', color: '#0047AB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Layers size={20} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>Phản hồi mô phỏng</h4>
            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
              Hệ thống chấm điểm tức thì dựa trên góc xoay và vị trí chuẩn xác của cánh tay theo giáo trình huấn luyện mặt đất chuyên nghiệp.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px 24px', textAlign: 'left', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 71, 171, 0.05)', color: '#0047AB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Cloud size={20} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>CSDL MongoDB Cloud Atlas</h4>
            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
              Lưu trữ lộ trình học tập, lịch sử tập luyện và phân tích dữ liệu quy mô lớn trên nền tảng đám mây an toàn, ổn định.
            </p>
          </div>

        </div>
      </section>

      {/* 3. "Thư Viện Cử Chỉ (Aviation Rules)" Section */}
      <section style={{ padding: '60px 8%', background: '#ffffff', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px' }}>

          {/* Left Column - List Stack (30%) */}
          <div style={{ flex: '1 1 280px', maxWidth: '360px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
              Thư Viện Cử Chỉ<br />(Aviation Rules)
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Chọn một cử chỉ để xem hướng dẫn thực hiện và yêu cầu kỹ thuật AI chuẩn xác.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.keys(gestureDetails).map((key) => {
                const isActive = activeGestureTab === key;
                const gesture = gestureDetails[key as 'AHEAD' | 'LEFT' | 'RIGHT' | 'STOP'];
                return (
                  <button
                    key={key}
                    onClick={() => setActiveGestureTab(key as any)}
                    style={{
                      background: isActive ? '#0047AB' : '#eff6ff',
                      color: isActive ? '#ffffff' : '#0047AB',
                      border: isActive ? '1px solid #0047AB' : '1px solid #bfdbfe',
                      padding: '14px 20px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                  >
                    <span>Cử chỉ {key}</span>
                    <ChevronRight size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column - Detail Card (70%) */}
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px', position: 'relative', overflow: 'hidden' }}>

              {/* Left Detail content */}
              <div style={{ flex: '1 1 300px', zIndex: 2 }}>
                <span style={{ display: 'inline-block', background: '#dbeafe', border: '1px solid #bfdbfe', color: '#1e40af', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '14px' }}>
                  Active training: {gestureDetails[activeGestureTab].key}
                </span>

                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
                  {gestureDetails[activeGestureTab].title}
                </h4>

                {/* Sub-stat boxes */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 16px', borderRadius: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Quy chuẩn giữ</span>
                    <strong style={{ fontSize: '0.9rem', color: '#1e40af', fontWeight: 800 }}>{gestureDetails[activeGestureTab].standard}</strong>
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 16px', borderRadius: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Độ tin cậy AI</span>
                    <strong style={{ fontSize: '0.9rem', color: '#1e40af', fontWeight: 800 }}>{gestureDetails[activeGestureTab].confidence}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    📖 Các bước thực hiện:
                  </span>
                  {gestureDetails[activeGestureTab].instructions.map((inst, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                      <span style={{ color: '#0047AB', fontWeight: 800 }}>0{index + 1}.</span>
                      <span>{inst}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Blueprint Hologram Graphic */}
              <div
                style={{
                  flex: '1 1 200px',
                  maxWidth: '240px',
                  height: '280px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: '#0a192f',
                  position: 'relative'
                }}
              >
                <img
                  src={gestureDetails[activeGestureTab].hologramPath}
                  alt="Gesture Blueprint Hologram"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.95
                  }}
                />
                {/* Visual HUD overlay */}
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0,229,255,0.3)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5ff', display: 'inline-block', animation: 'scan-loop 1.5s infinite' }} />
                  <span style={{ color: '#00e5ff', fontSize: '0.62rem', fontWeight: 700, fontFamily: 'monospace' }}>HUD FEED</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. "Tiến độ cá nhân (Micro-Evaluation)" Section */}
      <section style={{ padding: '60px 8%', boxSizing: 'border-box' }}>
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '32px 30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Tiến độ cá nhân (Micro-Evaluation)
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Theo dõi chi tiết hiệu suất tập luyện và các chỉ số AI của bạn.
              </p>
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                background: '#0047AB',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1e3a8a'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0047AB'}
            >
              Truy cập Dashboard bản đầy đủ <ChevronRight size={14} />
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {/* Completed */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{completedScenariosCount}/6</strong>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Kịch bản hoàn thành</span>
              </div>
            </div>

            {/* Accuracy */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={18} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.4rem', fontWeight: 800, color: '#0047AB' }}>{overallAccuracyAvg}%</strong>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Độ chính xác trung bình</span>
              </div>
            </div>

            {/* Time */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{studyTimeText === "0 phút" ? "0 mins" : studyTimeText}</strong>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Thời gian tập luyện</span>
              </div>
            </div>
          </div>

          {/* Placeholder Line Chart illustration */}
          <div style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <BarChart2 size={36} style={{ color: '#94a3b8' }} />
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#475569', margin: 0 }}>Chưa có dữ liệu phân tích</h4>
            <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '420px', margin: 0, lineHeight: 1.5 }}>
              Vui lòng đăng nhập và hoàn thành ít nhất một buổi tập luyện để hệ thống AI có thể phân tích và báo cáo hiệu suất của bạn.
            </p>
          </div>

        </div>
      </section>

      {/* 5. Widescreen Footer Section */}
      <footer style={{ background: '#1e293b', padding: '60px 8% 30px 8%', color: '#ffffff', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '40px', marginBottom: '30px' }}>

          {/* Brand Col */}
          <div style={{ flex: '1 1 260px', maxWidth: '320px' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 14px 0', letterSpacing: '0.02em' }}>
              ✈️ AeroSignal AI
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Hệ thống ứng dụng AI trong huấn luyện điều phối viên máy bay đầu tiên tại Việt Nam tuân thủ tiêu chuẩn an toàn hàng không ICAO.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', fontSize: '1.1rem' }}>
              <span>⚙️</span>
              <span>⚡</span>
              <span>💻</span>
            </div>
          </div>

          {/* Links Col 1 */}
          <div style={{ flex: '1 1 120px' }}>
            <h5 style={{ fontSize: '0.76rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>SẢN PHẨM</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem', color: '#94a3b8' }}>
              <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Training Modules</a></li>
              <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>AI Documentation</a></li>
              <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Aviation Compliance</a></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div style={{ flex: '1 1 120px' }}>
            <h5 style={{ fontSize: '0.76rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>NGHIÊN CỨU</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem', color: '#94a3b8' }}>
              <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Research Paper</a></li>
              <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Methodology</a></li>
              <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Data Privacy</a></li>
            </ul>
          </div>

          {/* Links Col 3 */}
          <div style={{ flex: '1 1 120px' }}>
            <h5 style={{ fontSize: '0.76rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>HỖ TRỢ</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem', color: '#94a3b8' }}>
              <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Hướng dẫn sử dụng</a></li>
              <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Phản hồi</a></li>
              <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.74rem', color: '#64748b' }}>
          <span>© 2026 AeroSignal AI. Student Research Project. ICAO Annex 14 & NATO Standards Compliant.</span>
          <span>Version V2.0.0 (Cloud Atlas Connected)</span>
        </div>
      </footer>

    </main>
  );
};
