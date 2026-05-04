import { useAppContext } from '../../context/AppContext';
import styles from './LeaveCounter.module.css';

export function LeaveCounter() {
  const { state } = useAppContext();
  const { viewYear } = state.ui;
  const { totalAllowanceDays } = state.config;

  const used = Object.keys(state.leaveDays).filter(d => d.startsWith(`${viewYear}-`)).length;
  const remaining = totalAllowanceDays - used;

  return (
    <div className={styles.counter}>
      <Pill label="Total" value={totalAllowanceDays} mod={styles.neutral} />
      <Pill label="Used" value={used} mod={styles.used} />
      <Pill label="Remaining" value={remaining} mod={remaining < 0 ? styles.over : styles.remaining} />
    </div>
  );
}

function Pill({ label, value, mod }: { label: string; value: number; mod: string }) {
  return (
    <div className={`${styles.pill} ${mod}`}>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
