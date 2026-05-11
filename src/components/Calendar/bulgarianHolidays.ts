const FIXED: Array<{ month: number; day: number; name: string }> = [
  { month: 1,  day: 1,  name: "New Year's Day" },
  { month: 3,  day: 3,  name: "Liberation Day" },
  { month: 5,  day: 1,  name: "Labour Day" },
  { month: 5,  day: 6,  name: "St. George's Day" },
  { month: 5,  day: 24, name: "Education & Culture Day" },
  { month: 9,  day: 6,  name: "Unification Day" },
  { month: 9,  day: 22, name: "Independence Day" },
  { month: 11, day: 1,  name: "National Revival Day" },
  { month: 12, day: 24, name: "Christmas Eve" },
  { month: 12, day: 25, name: "Christmas Day" },
  { month: 12, day: 26, name: "Christmas Day (2nd day)" },
];

// Meeus algorithm for Julian Easter, converted to Gregorian (+13 days, valid 1900–2099)
function orthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return new Date(year, month - 1, day + 13);
}

function fmt(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
}

// Returns a map of "YYYY-MM-DD" -> holiday name for the given year
export function getHolidays(year: number): Record<string, string> {
  const result: Record<string, string> = {};

  for (const h of FIXED) {
    const key = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`;
    result[key] = h.name;
  }

  const easter = orthodoxEaster(year);
  result[fmt(addDays(easter, -2))] = 'Good Friday';
  result[fmt(addDays(easter, -1))] = 'Holy Saturday';
  result[fmt(easter)]              = 'Easter Sunday';
  result[fmt(addDays(easter,  1))] = 'Easter Monday';

  // When a fixed holiday falls on Sunday, Monday is a substitute holiday
  for (const h of FIXED) {
    const date = new Date(year, h.month - 1, h.day);
    if (date.getDay() === 0) {
      result[fmt(addDays(date, 1))] = `${h.name} (substitute)`;
    }
  }

  return result;
}
