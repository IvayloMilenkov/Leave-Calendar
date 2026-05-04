import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
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
  const year = yearProp ?? state.ui.viewYear;
  const month = monthProp ?? state.ui.viewMonth;
  const cells = buildCalendarGrid(year, month);
  const holidays = useMemo(() => getHolidays(year), [year]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {WEEKDAYS.map((d) => (
          <div key={d} className={styles.weekday}>{d}</div>
        ))}
        {cells.map((dateStr, i) =>
          dateStr
            ? <DayCell key={dateStr} dateStr={dateStr} holidayName={holidays[dateStr]} />
            : <div key={`pad-${i}`} className={styles.pad} />
        )}
      </div>
    </div>
  );

}
