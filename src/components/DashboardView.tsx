'use client';

import React, { useState } from 'react';
import { Award, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import styles from '../app/page.module.css';

interface DashboardViewProps {
  completedScenarios: string[];
  onBackToTraining: () => void;
  difficultyDistribution: Array<{ name: string; value: number; color: string }>;
  scenarioChartData: Array<{ name: string; score: number; amt: number }>;
  getOverallAccuracyAvg: () => number;
  studyTimeText?: string;
  historyList: any[];
  socketUrl: string;
  user: { token: string } | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  completedScenarios,
  onBackToTraining,
  difficultyDistribution,
  scenarioChartData,
  getOverallAccuracyAvg,
  studyTimeText,
  historyList,
  socketUrl,
  user,
}) => {
  const [selectedHistoryDetails, setSelectedHistoryDetails] = useState<any[] | null>(null);
  const [selectedHistoryName, setSelectedHistoryName] = useState<string>('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleViewDetails = async (historyId: string, scenarioId: string, dateStr: string) => {
    if (!user) return;
    setIsLoadingDetails(true);
    const lessonNames: Record<string, string> = {
      "1": "Hướng dẫn cơ bản",
      "2": "Hướng dẫn tiêu chuẩn",
      "3": "Điều kiện gió mạnh",
      "4": "Tình huống khẩn cấp",
      "5": "Hướng dẫn ban đêm",
      "6": "Máy bay lớn"
    };
    setSelectedHistoryName(`${lessonNames[scenarioId] || `Kịch bản #${scenarioId}`} (${dateStr})`);
    try {
      const response = await fetch(`${socketUrl.replace(/\/$/, '')}/api/history/${historyId}/details`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedHistoryDetails(data);
      } else {
        console.error("Không thể lấy chi tiết cử chỉ:", await response.text());
      }
    } catch (e) {
      console.error("Lỗi mạng khi lấy chi tiết cử chỉ:", e);
    } finally {
      setIsLoadingDetails(false);
    }
  };
  return (
    <main className={styles.dashboardView}>
      <div className={styles.dashboardHeader}>
        <div>
          <h2 className={styles.dashboardTitle}>Bảng điều khiển</h2>
          <p className={styles.dashboardSubtitle}>Theo dõi tiến trình học tập của bạn</p>
        </div>
        <button 
          className={`${styles.controlBtn} ${styles.btnPrimary}`}
          onClick={onBackToTraining}
        >
          Quay lại học tập
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className={styles.dbCardsGrid}>
        
        {/* Total Score */}
        <div className={`${styles.dbCard} ${styles.dbCardBlue} glass-panel`}>
          <div className={styles.dbCardHeader}>
            <Award size={20} className={styles.dbCardIconBlue} />
          </div>
          <span className={styles.dbCardTitle}>Tổng điểm</span>
          <span className={styles.dbCardVal}>{getOverallAccuracyAvg()}%</span>
          <span className={styles.dbCardDescBlue}>
            +5% từ tuần trước
          </span>
        </div>

        {/* Completed Scenarios */}
        <div className={`${styles.dbCard} ${styles.dbCardGreen} glass-panel`}>
          <div className={styles.dbCardHeader}>
            <CheckCircle2 size={20} className={styles.dbCardIconGreen} />
          </div>
          <span className={styles.dbCardTitle}>Tình huống hoàn thành</span>
          <span className={styles.dbCardVal}>{completedScenarios.length}/6</span>
          <span className={styles.dbCardDescGreen}>
            {Math.round((completedScenarios.length / 6) * 100)}% hoàn thành
          </span>
        </div>

        {/* Study Time */}
        <div className={`${styles.dbCard} ${styles.dbCardOrange} glass-panel`}>
          <div className={styles.dbCardHeader}>
            <Clock size={20} className={styles.dbCardIconOrange} />
          </div>
          <span className={styles.dbCardTitle}>Thời gian học</span>
          <span className={styles.dbCardVal}>{studyTimeText || "0 phút"}</span>
          <span className={styles.dbCardDescOrange}>
            Tuần này
          </span>
        </div>

        {/* Improvement */}
        <div className={`${styles.dbCard} ${styles.dbCardPurple} glass-panel`}>
          <div className={styles.dbCardHeader}>
            <TrendingUp size={20} className={styles.dbCardIconPurple} />
          </div>
          <span className={styles.dbCardTitle}>Độ cải thiện</span>
          <span className={styles.dbCardVal}>+8%</span>
          <span className={styles.dbCardDescPurple}>
            So với tuần trước
          </span>
        </div>
      </div>

      {/* Charts section */}
      <div className={styles.chartsCardContainer}>
        
        {/* Score by Scenario */}
        <div className={`${styles.chartCard} glass-panel`}>
          <h3 className={styles.chartCardTitle}>Điểm số theo tình huống</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scenarioChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
                  itemStyle={{ color: '#1d4ed8' }}
                />
                <Bar dataKey="score" fill="#1d4ed8" radius={[4, 4, 0, 0]}>
                  {scenarioChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 0 ? '#1d4ed8' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution by Difficulty */}
        <div className={`${styles.chartCard} glass-panel`}>
          <h3 className={styles.chartCardTitle}>Phân bố theo độ khó</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={difficultyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {difficultyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value, entry: any) => {
                    const dataObj = difficultyDistribution.find(d => d.name === value);
                    return <span style={{ color: '#1e293b', fontSize: '0.85rem', fontWeight: 500 }}>{value}: {dataObj ? dataObj.value : 0}</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Exercise Log Section */}
      <div className="glass-panel animate-fade-in" style={{ marginTop: '30px', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', width: '100%', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '8px', marginTop: 0 }}>
          Lịch sử thực hành chi tiết
        </h3>
        
        {(!historyList || historyList.length === 0) ? (
          <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Bạn chưa thực hiện bài luyện tập nào. Hãy bắt đầu luyện tập để ghi nhận dữ liệu!
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  <th style={{ padding: '12px 16px' }}>#</th>
                  <th style={{ padding: '12px 16px' }}>Ngày thực hiện</th>
                  <th style={{ padding: '12px 16px' }}>Kịch bản bài tập</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Độ chính xác</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thời gian</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((item, index) => {
                  const date = new Date(item.created_at);
                  const dateStr = `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                  const lessonNames: Record<string, string> = {
                    "1": "Hướng dẫn cơ bản",
                    "2": "Hướng dẫn tiêu chuẩn",
                    "3": "Điều kiện gió mạnh",
                    "4": "Tình huống khẩn cấp",
                    "5": "Hướng dẫn ban đêm",
                    "6": "Máy bay lớn"
                  };
                  const scenarioName = lessonNames[item.scenario_id] || `Kịch bản #${item.scenario_id}`;
                  
                  const formatSecs = (sec: number) => {
                    const m = Math.floor(sec / 60);
                    const s = sec % 60;
                    return m > 0 ? `${m}m ${s}s` : `${s}s`;
                  };

                  return (
                    <tr 
                      key={item.id || index} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)', 
                        transition: 'background-color 0.2s ease',
                      }}
                      className="history-row"
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {historyList.length - index}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {dateStr}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {scenarioName}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <strong style={{ 
                          color: item.score >= 90 ? '#0f766e' : item.score >= 75 ? '#1d4ed8' : '#b45309',
                          background: item.score >= 90 ? '#ccfbf1' : item.score >= 75 ? '#dbeafe' : '#fef3c7',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {item.score}%
                        </strong>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {formatSecs(item.elapsed_time)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleViewDetails(item.id, item.scenario_id, dateStr)}
                          disabled={isLoadingDetails}
                          style={{
                            background: 'rgba(30, 58, 138, 0.06)',
                            border: '1px solid rgba(30, 58, 138, 0.15)',
                            color: '#1e3a8a',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isLoadingDetails ? 'Đang tải...' : 'Chi tiết cử chỉ'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Micro-evaluation Detail Popup Modal Overlay */}
      {selectedHistoryDetails && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
          }}
          onClick={() => setSelectedHistoryDetails(null)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px 20px',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Chi tiết kết quả cử chỉ
              </h3>
              <button 
                onClick={() => setSelectedHistoryDetails(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.4rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  lineHeight: 0.8
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontWeight: 800, color: '#1e3a8a', marginBottom: '2px', fontSize: '0.72rem', letterSpacing: '0.05em' }}>BÀI LUYỆN TẬP:</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{selectedHistoryName}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
              {selectedHistoryDetails.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Lượt tập này chưa ghi nhận chấm điểm động tác chi tiết.
                </div>
              ) : (
                selectedHistoryDetails.map((detail: any, index: number) => (
                  <div 
                    key={detail.id || index} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.84rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#1e3a8a', fontWeight: 800 }}>#{detail.sequence_index + 1}</span>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{detail.gesture_name}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 500 }}>{detail.elapsed_time}s</span>
                      <strong style={{ 
                        color: detail.score >= 90 ? '#0f766e' : detail.score >= 75 ? '#1d4ed8' : '#b45309',
                        background: detail.score >= 90 ? '#ccfbf1' : detail.score >= 75 ? '#dbeafe' : '#fef3c7',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.76rem',
                        fontWeight: 700
                      }}>
                        {detail.score}%
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setSelectedHistoryDetails(null)}
              style={{
                width: '100%',
                background: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                marginTop: '6px'
              }}
            >
              Đóng báo cáo
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
