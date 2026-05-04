import { useAppContext } from '../../context/AppContext';
import { monthName } from './calendarUtils';
import styles from './CalendarNav.module.css';

export function CalendarNav() {
  const { state, dispatch } = useAppContext();
  const { viewYear, viewMonth, viewMode } = state.ui;
  const isYearMode = viewMode === 'year';

  function go(delta: number) {
    if (isYearMode) {
      dispatch({ type: 'SET_VIEW', payload: { year: viewYear + delta, month: viewMonth } });
    } else {
      let m = viewMonth + delta;
      let y = viewYear;
      if (m > 12) { m = 1; y++; }
      if (m < 1)  { m = 12; y--; }
      dispatch({ type: 'SET_VIEW', payload: { year: y, month: m } });
    }
  }

  function jumpToToday() {
    const now = new Date();
    dispatch({ type: 'SET_VIEW', payload: { year: now.getFullYear(), month: now.getMonth() + 1 } });
    if (isYearMode) dispatch({ type: 'SET_VIEW_MODE', payload: 'month' });
  }

  const hasLeave = Object.keys(state.leaveDays).length > 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.nav}>
        <button className={styles.btn} onClick={() => go(-1)} aria-label={isYearMode ? 'Previous year' : 'Previous month'}>&#8249;</button>
        <h2 className={styles.label}>
          {isYearMode ? viewYear : <>{monthName(viewMonth)} <span className={styles.yearMuted}>{viewYear}</span></>}
        </h2>
        <button className={styles.btn} onClick={() => go(1)} aria-label={isYearMode ? 'Next year' : 'Next month'}>&#8250;</button>
      </div>
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={jumpToToday}>Today</button>
        <button
          className={`${styles.actionBtn} ${styles.danger}`}
          onClick={() => dispatch({ type: 'CLEAR_ALL' })}
          disabled={!hasLeave}
        >
          Clear all
        </button>
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${!isYearMode ? styles.toggleActive : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'month' })}
          >
            Month
          </button>
          <button
            className={`${styles.toggleBtn} ${isYearMode ? styles.toggleActive : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'year' })}
          >
            Year
          </button>
        </div>
      </div>
    </div>
  );
}
