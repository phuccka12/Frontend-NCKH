'use client';

import React from 'react';
import { CheckCircle2, Clock, List } from 'lucide-react';
import styles from '../app/page.module.css';

interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  difficultyText: string;
  duration: string;
  expectedGestures: string[];
}

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  completedScenarios: string[];
  onScenarioChange: (id: string) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  scenarios,
  activeScenarioId,
  completedScenarios,
  onScenarioChange,
}) => {
  return (
    <section className={`${styles.sidebar} glass-panel`}>
      <h2 className={styles.sidebarTitle}>
        <List size={18} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'text-bottom' }} />
        Trainer
      </h2>
      
      <div className={styles.scenarioList}>
        {scenarios.map((scenario) => {
          const isActive = scenario.id === activeScenarioId;
          const isFinished = completedScenarios.includes(scenario.id);

          return (
            <div 
              key={scenario.id} 
              className={`${styles.scenarioCard} ${isActive ? styles.scenarioCardActive : ''}`}
              onClick={() => onScenarioChange(scenario.id)}
            >
              <div className={styles.scenarioHeader}>
                <span className={styles.scenarioName}>{scenario.name}</span>
                {isFinished && <CheckCircle2 size={16} className={styles.checkIcon} />}
              </div>
              
              <div className={styles.scenarioMeta}>
                <span className={`${styles.difficultyBadge} ${
                  scenario.difficulty === 'easy' ? styles.diffEasy : 
                  scenario.difficulty === 'medium' ? styles.diffMedium : styles.diffHard
                }`}>
                  {scenario.difficultyText}
                </span>
                <span className={styles.duration}>
                  <Clock size={12} />
                  {scenario.duration}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressLabel}>
          <span>Tiến trình</span>
          <strong>{completedScenarios.length} / {scenarios.length}</strong>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${(completedScenarios.length / scenarios.length) * 100}%` }}
          />
        </div>
        <span className={styles.progressSubtext}>tình huống hoàn thành</span>
      </div>
    </section>
  );
};
