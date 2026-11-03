import { describe, expect, it } from 'vitest';
import { buildMonthGrid } from './calendar';

describe('buildMonthGrid', () => {
  it('월요일 시작, 앞뒤 달로 주를 채운다', () => {
    // 2026-11-01은 일요일 → 첫 주는 10/26(월)부터
    const weeks = buildMonthGrid('2026-11');
    expect(weeks[0][0]).toMatchObject({ date: '2026-10-26', inMonth: false, weekday: 1 });
    expect(weeks[0][6]).toMatchObject({ date: '2026-11-01', inMonth: true, weekday: 0 });
    const last = weeks[weeks.length - 1];
    expect(last[6]).toMatchObject({ date: '2026-12-06', inMonth: false });
    expect(weeks).toHaveLength(6);
  });

  it('모든 주는 7일', () => {
    for (const m of ['2026-02', '2027-02', '2026-06', '2028-02']) {
      expect(buildMonthGrid(m).every((w) => w.length === 7)).toBe(true);
    }
  });

  it('해당 월 날짜가 빠짐없이 들어간다', () => {
    const days = buildMonthGrid('2028-02').flat().filter((d) => d.inMonth);
    expect(days).toHaveLength(29);
    expect(days[0].date).toBe('2028-02-01');
    expect(days[28].date).toBe('2028-02-29');
  });

  it('월요일로 시작하는 달은 앞 달 날짜가 없다', () => {
    // 2027-02-01은 월요일
    expect(buildMonthGrid('2027-02')[0][0]).toMatchObject({ date: '2027-02-01', inMonth: true });
  });
});
