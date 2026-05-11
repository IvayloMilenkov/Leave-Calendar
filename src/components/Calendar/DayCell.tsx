import { useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTeam } from '../../context/TeamContext';
import { useAuth } from '../../context/AuthContext';
import { isWeekend, isToday } from './calendarUtils';
import { DayTooltip, type TooltipEntry } from './DayTooltip';
import styles from './DayCell.module.css';

interface TeamDot {
  color: string;
  label: string;
  status: 'planned' | 'approved';
}

interface Props {
  dateStr: string;
  holidayName?: string;
  teamDots?: TeamDot[];
}

const LONG_PRESS_MS = 500;

export function DayCell({ dateStr, holidayName, teamDots = [] }: Props) {
  const { state, dispatch } = useAppContext();
  const { team, syncLeaveDay, members } = useTeam();
  const { user } = useAuth();
  const weekend = isWeekend(dateStr);
  const today = isToday(dateStr);
  const dayState = state.leaveDays[dateStr];
  const planned  = dayState === 'planned';
  const approved = dayState === 'approved';
  const blocked = weekend || Boolean(holidayName);
  const day = parseInt(dateStr.split('-')[2], 10);

  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const openTooltip = useCallback(() => {
    if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect());
  }, []);

  const closeTooltip = useCallback(() => setAnchorRect(null), []);

  function handleClick() {
    if (blocked) return;
    const next = dayState === 'planned' ? 'approved' : dayState === 'approved' ? null : 'planned';
    dispatch({ type: 'TOGGLE_LEAVE_DAY', payload: dateStr });
    if (team) syncLeaveDay(dateStr, next);
  }

  // Build tooltip entries — own booking + teammates
  const myColor = members.find(m => m.user_id === user?.id)?.color ?? '#6366f1';

  const tooltipEntries: TooltipEntry[] = [
    ...(dayState ? [{ color: myColor, name: 'You', status: dayState }] : []),
    ...teamDots.map(d => ({ color: d.color, name: d.label, status: d.status })),
  ];

  const hasTooltip = tooltipEntries.length > 0 && !holidayName;

  return (
    <>
      <button
        ref={btnRef}
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
        onMouseEnter={hasTooltip ? openTooltip : undefined}
        onMouseLeave={hasTooltip ? closeTooltip : undefined}
        onTouchStart={hasTooltip ? () => { longPressTimer.current = setTimeout(openTooltip, LONG_PRESS_MS); } : undefined}
        onTouchEnd={hasTooltip ? () => { clearTimeout(longPressTimer.current); closeTooltip(); } : undefined}
        onTouchMove={() => clearTimeout(longPressTimer.current)}
      >
        <span className={today && !holidayName ? styles.todayRing : ''}>{day}</span>
        {teamDots.length > 0 && (
          <span className={styles.dots}>
            {teamDots.slice(0, 3).map((d, i) => (
              <span key={i} className={styles.dot} style={{ background: d.color }} />
            ))}
          </span>
        )}
      </button>
      {anchorRect && <DayTooltip entries={tooltipEntries} anchorRect={anchorRect} />}
    </>
  );
}
