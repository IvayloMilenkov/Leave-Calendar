import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getHolidays } from './bulgarianHolidays';
import { MiniMonth } from './MiniMonth';
import styles from './YearView.module.css';

export function YearView() {
  const { state } = useAppContext();
  const { viewYear } = state.ui;
  const holidays = useMemo(() => getHolidays(viewYear), [viewYear]);

  return (
    <div className={styles.grid}>
      {Array.from({ length: 12 }, (_, i) => (
        <MiniMonth key={i} year={viewYear} month={i + 1} holidays={holidays} />
      ))}
    </div>
  );
}
