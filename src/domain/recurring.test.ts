import { describe, expect, it } from 'vitest';
import {
  billingDate,
  dueOccurrences,
  monthTotal,
  nextOccurrence,
  occurrencesBetween,
  scheduleLabel,
  scheduledByDate,
} from './recurring';

const monthly = (billingDay: number, startDate = '2026-01-01', endDate: string | null = null) => ({
  cycle: 'MONTHLY' as const,
  billingDay,
  startDate,
  endDate,
});

describe('billingDate', () => {
  it('없는 날짜는 말일로 보정', () => {
    expect(billingDate(2026, 2, 31)).toBe('2026-02-28');
    expect(billingDate(2028, 2, 31)).toBe('2028-02-29');
    expect(billingDate(2026, 4, 31)).toBe('2026-04-30');
    expect(billingDate(2026, 1, 31)).toBe('2026-01-31');
  });
});

describe('occurrencesBetween', () => {
  it('매월 출금일', () => {
    expect(occurrencesBetween(monthly(25), '2026-01-01', '2026-03-31')).toEqual([
      '2026-01-25',
      '2026-02-25',
      '2026-03-25',
    ]);
  });

  it('시작일 이전 출금일은 제외', () => {
    expect(occurrencesBetween(monthly(10, '2026-01-15'), '2026-01-01', '2026-02-28')).toEqual([
      '2026-02-10',
    ]);
  });

  it('종료일 이후는 제외', () => {
    expect(occurrencesBetween(monthly(10, '2026-01-01', '2026-02-09'), '2026-01-01', '2026-12-31')).toEqual([
      '2026-01-10',
    ]);
  });

  it('31일 출금은 짧은 달에 말일로', () => {
    expect(occurrencesBetween(monthly(31), '2026-01-01', '2026-04-30')).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
  });

  it('매년은 시작일의 월에만', () => {
    const yearly = { cycle: 'YEARLY' as const, billingDay: 5, startDate: '2026-03-01', endDate: null };
    expect(occurrencesBetween(yearly, '2026-01-01', '2028-12-31')).toEqual([
      '2026-03-05',
      '2027-03-05',
      '2028-03-05',
    ]);
  });

  it('연도를 넘어가는 구간', () => {
    expect(occurrencesBetween(monthly(1), '2026-11-15', '2027-02-15')).toEqual([
      '2026-12-01',
      '2027-01-01',
      '2027-02-01',
    ]);
  });
});

describe('dueOccurrences', () => {
  it('오늘까지 아직 안 만든 것만', () => {
    expect(dueOccurrences(monthly(25, '2026-09-01'), '2026-11-03', ['2026-09-25'])).toEqual([
      '2026-10-25',
    ]);
  });

  it('오늘이 출금일이면 오늘 것도 포함', () => {
    expect(dueOccurrences(monthly(3, '2026-11-01'), '2026-11-03', [])).toEqual(['2026-11-03']);
  });

  it('출금일을 바꿔도 이미 만든 달은 다시 만들지 않는다', () => {
    // 25일로 9·10월분을 만든 뒤 출금일을 28일로 변경
    expect(
      dueOccurrences(monthly(28, '2026-09-01'), '2026-11-30', ['2026-09-25', '2026-10-25'])
    ).toEqual(['2026-11-28']);
  });
});

describe('nextOccurrence', () => {
  it('오늘 다음 출금일', () => {
    expect(nextOccurrence(monthly(25), '2026-11-03')).toBe('2026-11-25');
    expect(nextOccurrence(monthly(25), '2026-11-25')).toBe('2026-12-25');
  });

  it('종료됐으면 null', () => {
    expect(nextOccurrence(monthly(25, '2026-01-01', '2026-10-31'), '2026-11-03')).toBeNull();
  });
});

describe('monthTotal', () => {
  it('그 달에 빠져나가는 것만 합산', () => {
    const rs = [
      { ...monthly(25), amount: 17_000 },
      { ...monthly(5), amount: 500_000 },
      { cycle: 'YEARLY' as const, billingDay: 1, startDate: '2026-03-01', endDate: null, amount: 99_000 },
    ];
    expect(monthTotal(rs, '2026-11')).toBe(517_000);
    expect(monthTotal(rs, '2027-03')).toBe(616_000);
  });
});

describe('scheduleLabel', () => {
  it('주기와 출금일 문구', () => {
    expect(scheduleLabel(monthly(25))).toBe('매월 25일');
    expect(scheduleLabel(monthly(31))).toBe('매월 말일');
    expect(scheduleLabel({ cycle: 'YEARLY', billingDay: 5, startDate: '2026-03-01' })).toBe('매년 3월 5일');
  });
});

describe('scheduledByDate', () => {
  it('날짜별로 묶는다', () => {
    const a = { ...monthly(25), id: 'a' };
    const b = { ...monthly(25), id: 'b' };
    const c = { ...monthly(10), id: 'c' };
    const map = scheduledByDate([a, b, c], '2026-11-04', '2026-11-30');
    expect(map.get('2026-11-25')?.map((r) => r.id)).toEqual(['a', 'b']);
    expect(map.has('2026-11-10')).toBe(true);
    expect(map.size).toBe(2);
  });
});
