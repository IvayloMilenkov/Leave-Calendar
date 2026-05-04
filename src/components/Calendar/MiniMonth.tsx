import { useAppContext } from '../../context/AppContext';
import { buildCalendarGrid, isWeekend, isToday, monthName } from './calendarUtils';
import styles from './MiniMonth.module.css';

interface Props {
  year: number;
  month: number;
  holidays: Record<string, string>;
}

export function MiniMonth({ year, month, holidays }: Props) {
  const { state, dispatch } = useAppContext();
  const cells = buildCalendarGrid(year, month);

  function switchToMonth() {
    dispatch({ type: 'SET_VIEW', payload: { year, month } });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'month' });
  }

  return (
    <div className={styles.month}>
      <button className={styles.name} onClick={switchToMonth}>
        {monthName(month)}
      </button>
      <div className={styles.grid}>
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`p-${i}`} />;

          const weekend  = isWeekend(dateStr);
          const holiday  = Boolean(holidays[dateStr]);
          const today    = isToday(dateStr);
          const marked   = Boolean(state.leaveDays[dateStr]);
          const blocked  = weekend || holiday;
          const day      = parseInt(dateStr.split('-')[2], 10);

          return (
            <button
              key={dateStr}
              className={[
                styles.cell,
                weekend            ? styles.weekend : '',
                holiday && !weekend ? styles.holiday : '',
                today              ? styles.today   : '',
                marked             ? styles.marked  : '',
              ].filter(Boolean).join(' ')}
              disabled={blocked}
              onClick={() => !blocked && dispatch({ type: 'TOGGLE_LEAVE_DAY', payload: dateStr })}
              title={holidays[dateStr]}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
