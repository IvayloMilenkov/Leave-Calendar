import { useState } from 'react';
import { useTeam } from '../../context/TeamContext';
import { TeamSetup } from './TeamSetup';
import styles from './TeamPicker.module.css';

interface Props {
  initialCode?: string;
}

export function TeamPicker({ initialCode }: Props) {
  const { allTeams, selectTeam } = useTeam();
  const [showSetup, setShowSetup] = useState(!!initialCode);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (showSetup) return <TeamSetup />;

  async function handleSelect(id: string) {
    setLoadingId(id);
    await selectTeam(id);
    setLoadingId(null);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>Your teams</h2>
        <p className={styles.subtitle}>Pick a team to open its calendar.</p>
        <ul className={styles.list}>
          {allTeams.map(t => (
            <li key={t.id}>
              <button
                className={styles.teamBtn}
                onClick={() => handleSelect(t.id)}
                disabled={loadingId === t.id}
              >
                <span className={styles.teamName}>{t.name}</span>
                <span className={styles.arrow}>{loadingId === t.id ? '…' : '→'}</span>
              </button>
            </li>
          ))}
        </ul>
        <button className={styles.joinBtn} onClick={() => setShowSetup(true)}>
          + Join or create another team
        </button>
      </div>
    </div>
  );
}
