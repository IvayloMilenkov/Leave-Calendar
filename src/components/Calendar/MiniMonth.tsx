import { useAppContext } from '../../context/AppContext';
import { useTeam } from '../../context/TeamContext';
import { buildCalendarGrid, isWeekend, isToday, monthName } from './calendarUtils';
import styles from './MiniMonth.module.css';

interface Props {
  year: number;
  month: number;
  holidays: Record<string, string>;
}

export function MiniMonth({ year, month, holidays }: Props) {
  const { state, dispatch } = useAppContext();
  const { team, syncLeaveDay } = useTeam();
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
          const dayState = state.leaveDays[dateStr];
          const planned  = dayState === 'planned';
          const approved = dayState === 'approved';
          const blocked  = weekend || holiday;
          const day      = parseInt(dateStr.split('-')[2], 10);

          function handleClick() {
            if (blocked) return;
            const next: 'planned' | 'approved' | null =
              dayState === 'planned' ? 'approved' : dayState === 'approved' ? null : 'planned';
            dispatch({ type: 'TOGGLE_LEAVE_DAY', payload: dateStr! });
            if (team) syncLeaveDay(dateStr!, next);
          }

          return (
            <button
              key={dateStr}
              className={[
                styles.cell,
                weekend             ? styles.weekend  : '',
                holiday && !weekend ? styles.holiday  : '',
                today               ? styles.today    : '',
                planned             ? styles.planned  : '',
                approved            ? styles.marked   : '',
              ].filter(Boolean).join(' ')}
              disabled={blocked}
              onClick={handleClick}
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
