import { useAppContext } from '../../context/AppContext';
import { isWeekend, isToday } from './calendarUtils';
import styles from './DayCell.module.css';

interface Props {
  dateStr: string;
  holidayName?: string;
}

export function DayCell({ dateStr, holidayName }: Props) {
  const { state, dispatch } = useAppContext();
  const weekend = isWeekend(dateStr);
  const today = isToday(dateStr);
  const dayState = state.leaveDays[dateStr];
  const planned  = dayState === 'planned';
  const approved = dayState === 'approved';
  const blocked = weekend || Boolean(holidayName);
  const day = parseInt(dateStr.split('-')[2], 10);

  function handleClick() {
    if (!blocked) dispatch({ type: 'TOGGLE_LEAVE_DAY', payload: dateStr });
  }

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
      title={holidayName}
      aria-label={`${dateStr}${holidayName ? ` — ${holidayName}` : ''}${planned ? ' (planned)' : approved ? ' (approved)' : ''}`}
      aria-pressed={planned || approved}
    >
      <span className={today && !holidayName ? styles.todayRing : ''}>{day}</span>
    </button>
  );
}
