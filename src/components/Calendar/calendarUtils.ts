// Week starts Monday. Returns ISO date strings ("YYYY-MM-DD") or null for padding cells.
export function buildCalendarGrid(year: number, month: number): (string | null)[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayRaw = new Date(year, month - 1, 1).getDay();
  const firstDayMon = (firstDayRaw + 6) % 7; // Sun(0)->6, Mon(1)->0, ...

  const cells: (string | null)[] = Array(firstDayMon).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + 'T00:00:00').getDay();
  return day === 0 || day === 6;
}

export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
}
