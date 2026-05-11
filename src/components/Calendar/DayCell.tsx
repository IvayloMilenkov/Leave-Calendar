import { useAppContext } from '../../context/AppContext';
import { useTeam } from '../../context/TeamContext';
import { isWeekend, isToday } from './calendarUtils';
import styles from './DayCell.module.css';

interface TeamDot {
  color: string;
  label: string;
}

interface Props {
  dateStr: string;
  holidayName?: string;
  teamDots?: TeamDot[];
}

export function DayCell({ dateStr, holidayName, teamDots = [] }: Props) {
  const { state, dispatch } = useAppContext();
  const { team, syncLeaveDay } = useTeam();
  const weekend = isWeekend(dateStr);
  const today = isToday(dateStr);
  const dayState = state.leaveDays[dateStr];
  const planned  = dayState === 'planned';
  const approved = dayState === 'approved';
  const blocked = weekend || Boolean(holidayName);
  const day = parseInt(dateStr.split('-')[2], 10);

  function handleClick() {
    if (blocked) return;
    const next = dayState === 'planned' ? 'approved' : dayState === 'approved' ? null : 'planned';
    dispatch({ type: 'TOGGLE_LEAVE_DAY', payload: dateStr });
    if (team) syncLeaveDay(dateStr, next);
  }

  const dotTitle = teamDots.map(d => d.label).join(', ');

  return (
    <button
      className={[
        styles.cell,
        weekend ? styles.weekend : '',
        holidayName && !weekend ? styles.holiday : '',
        today && !planned && !approved && !holidayName ? styles.today : '',
        planned  ? styles.planned  : '',
        approved ? styles.approved : '',
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
      disabled={blocked}
      title={holidayName ?? (dotTitle || undefined)}
      aria-label={`${dateStr}${holidayName ? ` — ${holidayName}` : ''}${planned ? ' (planned)' : approved ? ' (approved)' : ''}`}
      aria-pressed={planned || approved}
    >
      <span className={today && !holidayName ? styles.todayRing : ''}>{day}</span>
      {teamDots.length > 0 && (
        <span className={styles.dots} title={dotTitle}>
          {teamDots.slice(0, 3).map((d, i) => (
            <span key={i} className={styles.dot} style={{ background: d.color }} />
          ))}
        </span>
      )}
    </button>
  );
}
