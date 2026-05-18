'use client';

import React from 'react';
import { Award, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import styles from '../app/page.module.css';

interface DashboardViewProps {
  completedScenarios: string[];
  onBackToTraining: () => void;
  difficultyDistribution: Array<{ name: string; value: number; color: string }>;
  scenarioChartData: Array<{ name: string; score: number; amt: number }>;
  getOverallAccuracyAvg: () => number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  completedScenarios,
  onBackToTraining,
  difficultyDistribution,
  scenarioChartData,
  getOverallAccuracyAvg,
}) => {
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
          <span className={styles.dbCardVal}>2h 45m</span>
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
    </main>
  );
};
