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
      name: "Đi thẳng",
      title: "Di chuyển thẳng phía trước",
      description: "Dẫn hướng máy bay di chuyển thẳng dọc theo vạch an toàn.",
      standard: "2.2 giây",
      confidence: "35%",
      instructions: [
        "Giơ hai tay lên cao, lòng bàn tay hướng về phía sau.",
        "Gập tay từ khuỷu tay lên xuống liên tục.",
        "Duy trì tốc độ ổn định đến khi máy bay vào vị trí."
      ],
      color: "#0047AB",
      bgLight: "rgba(0, 71, 171, 0.03)",
      hologramPath: "/ahead.png"
    },
    LEFT: {
      key: "LEFT",
      name: "Rẽ trái",
      title: "Rẽ về bên trái (của người dẫn đường)",
      description: "Hướng dẫn máy bay rẽ trái bằng cách giữ cố định tay phải và vẫy tay trái.",
      standard: "2.6 giây",
      confidence: "35%",
      instructions: [
        "Giơ tay phải thẳng đứng trên đầu làm mốc cố định.",
        "Đưa tay trái ngang vai và gập nhịp nhàng về phía mũi.",
        "Duy trì tốc độ vẫy đều đặn."
      ],
      color: "#0047AB",
      bgLight: "rgba(0, 71, 171, 0.03)",
      hologramPath: "/left.png"
    },
    RIGHT: {
      key: "RIGHT",
      name: "Rẽ phải",
      title: "Rẽ về bên phải (của người dẫn đường)",
      description: "Hướng dẫn máy bay rẽ phải bằng cách giữ cố định tay trái và vẫy tay phải.",
      standard: "2.6 giây",
      confidence: "35%",
      instructions: [
        "Giơ tay trái thẳng đứng trên đầu làm mốc cố định.",
        "Đưa tay phải ngang vai và gập nhịp nhàng về phía mũi.",
        "Duy trì tốc độ vẫy đều đặn."
      ],
      color: "#0047AB",
      bgLight: "rgba(0, 71, 171, 0.03)",
      hologramPath: "/right.png"
    },
    STOP: {
      key: "STOP",
      name: "Dừng bình thường",
      title: "Dừng máy bay thông thường",
      description: "Hiệu lệnh yêu cầu phi công giảm tốc và dừng máy bay tại vạch dừng.",
      standard: "1.8 giây",
      confidence: "40%",
      instructions: [
        "Dang rộng hai tay sang hai bên một góc 180° (ngang vai).",
        "Từ từ đưa hai tay lên phía trên đầu cho đến khi bắt chéo nhau.",
        "Giữ nguyên tư thế bắt chéo cho đến khi máy bay dừng hẳn."
      ],
      color: "#ef4444",
      bgLight: "rgba(239, 68, 68, 0.03)",
      hologramPath: "/stop.png"
    },
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
            TUÂN THỦ TIÊU CHUẨN HÀNG KHÔNG
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
              Thư Viện Cử Chỉ
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Chọn một cử chỉ để xem hướng dẫn thực hiện và yêu cầu kỹ thuật AI chuẩn xác.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.keys(gestureDetails).map((key) => {
                const item = gestureDetails[key as 'AHEAD' | 'LEFT' | 'RIGHT' | 'STOP'];
                const isActive = activeGestureTab === key;

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
                      textAlign: 'left',
                      width: '100%' // Thêm width 100% nếu bạn muốn các nút bấm đều nhau
                    }}
                  >
                    <span>Cử chỉ {item.name}</span>
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
                  Hướng dẫn: {gestureDetails[activeGestureTab].name}
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
                    Các bước thực hiện:
                  </span>
                  {gestureDetails[activeGestureTab].instructions.map((inst, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                      <span style={{ color: '#0047AB', fontWeight: 800 }}>0{index + 1}.</span>
                      <span>{inst}</span>
                    </div>
                  ))}
                </div>
              </div>

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
                    objectFit: 'fill',
                    opacity: 0.95
                  }}
                />
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
    </main>
  );
};
