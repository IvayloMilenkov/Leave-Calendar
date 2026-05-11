import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTeam } from '../../context/TeamContext';
import { buildCalendarGrid } from './calendarUtils';
import { getHolidays } from './bulgarianHolidays';
import { DayCell } from './DayCell';
import styles from './CalendarGrid.module.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  year?: number;
  month?: number;
}

export function CalendarGrid({ year: yearProp, month: monthProp }: Props = {}) {
  const { state } = useAppContext();
  const { teamLeaveDays, members, team } = useTeam();
  const year = yearProp ?? state.ui.viewYear;
  const month = monthProp ?? state.ui.viewMonth;
  const cells = buildCalendarGrid(year, month);
  const holidays = useMemo(() => getHolidays(year), [year]);

  const teamDotsByDate = useMemo(() => {
    if (!team) return {};
    const map: Record<string, { color: string; label: string }[]> = {};
    for (const d of teamLeaveDays) {
      if (d.user_id === members.find(m => m.user_id === d.user_id)?.user_id) {
        const member = members.find(m => m.user_id === d.user_id);
        if (!member) continue;
        if (!map[d.date]) map[d.date] = [];
        map[d.date].push({ color: member.color, label: d.user_id.slice(0, 6) });
      }
    }
    return map;
  }, [teamLeaveDays, members, team]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {WEEKDAYS.map((d) => (
          <div key={d} className={styles.weekday}>{d}</div>
        ))}
        {cells.map((dateStr, i) =>
          dateStr
            ? <DayCell key={dateStr} dateStr={dateStr} holidayName={holidays[dateStr]} teamDots={teamDotsByDate[dateStr]} />
            : <div key={`pad-${i}`} className={styles.pad} />
        )}
      </div>
    </div>
  );
}
