import { useState } from 'react';
import { AllowanceConfig } from './AllowanceConfig';
import { TeamSettings } from '../Team/TeamSettings';
import { useTeam } from '../../context/TeamContext';
import styles from './Header.module.css';

export function Header() {
  const { team } = useTeam();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Leave Calendar</h1>
        <div className={styles.right}>
          <AllowanceConfig />
          {team && (
            <button className={styles.teamBtn} onClick={() => setShowSettings(true)} title="Team settings">
              <TeamIcon />
              <span className={styles.teamName}>{team.name}</span>
            </button>
          )}
        </div>
      </header>
      {showSettings && <TeamSettings onClose={() => setShowSettings(false)} />}
    </>
  );
}

function TeamIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM17 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 0 0-1.5-4.33A5 5 0 0 1 19 16v1h-6.07zM6 11a5 5 0 0 1 5 5v1H1v-1a5 5 0 0 1 5-5z"/>
    </svg>
  );
}
