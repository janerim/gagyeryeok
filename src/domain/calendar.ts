import { addDays, endOfMonth, endOfWeek, format, parseISO, startOfWeek } from 'date-fns';

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  day: number; // 1~31
  weekday: number; // 0=일 ~ 6=토
  inMonth: boolean;
};

/** month(YYYY-MM)의 달력 그리드. 월요일 시작, 앞뒤 달 날짜로 주를 채운다. */
export function buildMonthGrid(month: string): CalendarDay[][] {
  const first = parseISO(`${month}-01`);
  const start = startOfWeek(first, { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(first), { weekStartsOn: 1 });

  const weeks: CalendarDay[][] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (weeks.length === 0 || weeks[weeks.length - 1].length === 7) weeks.push([]);
    weeks[weeks.length - 1].push({
      date: format(d, 'yyyy-MM-dd'),
      day: d.getDate(),
      weekday: d.getDay(),
      inMonth: format(d, 'yyyy-MM') === month,
    });
  }
  return weeks;
}
