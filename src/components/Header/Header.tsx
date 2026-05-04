import { AllowanceConfig } from './AllowanceConfig';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Leave Calendar</h1>
      <AllowanceConfig />
    </header>
  );
}
