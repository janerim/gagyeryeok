import { describe, expect, it } from 'vitest';
import {
  backdatedStart,
  billingDate,
  dueOccurrences,
  matchRecurringLinks,
  monthTotal,
  nextOccurrence,
  occurrencesBetween,
  scheduleLabel,
  scheduledByDate,
} from './recurring';
import type { Recurring } from '@/types';

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

  it('거래로 만든 자동이체는 그 거래의 달을 빼고 오늘까지 빈 달을 채운다', () => {
    // 8/25 거래로 만들어 시작일이 8/25, 그 거래는 저장할 때 연결됨
    expect(dueOccurrences(monthly(25, '2026-08-25'), '2026-11-13', ['2026-08-25'])).toEqual([
      '2026-09-25',
      '2026-10-25',
    ]);
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

describe('matchRecurringLinks', () => {
  const r = {
    id: 'r1',
    name: 'iCloud',
    type: 'EXPENSE',
    amount: 4400,
    accountId: 'a1',
    toAccountId: null,
    categoryId: null,
    cycle: 'MONTHLY',
    billingDay: 3,
    startDate: '2026-11-30',
    endDate: null,
  } as Recurring;
  const tx = (id: string, date: string, memo: string | null, over = {}) => ({
    id,
    date,
    memo,
    type: 'EXPENSE' as const,
    amount: 4400,
    accountId: 'a1',
    toAccountId: null,
    ...over,
  });
  const ids = (links: { transactionId: string }[]) => links.map((l) => l.transactionId);

  it('시작일 이전이어도 출금일이나 같은 이름이면 연결한다', () => {
    const links = matchRecurringLinks(
      [r],
      [tx('day', '2026-11-03', null), tx('name', '2026-10-20', ' iCloud ')],
      new Map()
    );
    expect(ids(links).sort()).toEqual(['day', 'name']);
  });

  it('출금일도 이름도 다르거나 금액·계좌·유형이 다르면 연결하지 않는다', () => {
    const links = matchRecurringLinks(
      [r],
      [
        tx('other-day', '2026-11-05', '커피'),
        tx('amount', '2026-11-03', null, { amount: 5000 }),
        tx('account', '2026-11-03', null, { accountId: 'a2' }),
        tx('type', '2026-11-03', null, { type: 'INCOME' }),
      ],
      new Map()
    );
    expect(links).toEqual([]);
  });

  it('이미 연결된 달에는 더 연결하지 않고, 한 달에 후보가 여럿이면 이름이 같은 쪽을 고른다', () => {
    expect(
      matchRecurringLinks([r], [tx('dup', '2026-11-03', null)], new Map([['r1', ['2026-11-03']]]))
    ).toEqual([]);
    const links = matchRecurringLinks(
      [r],
      [tx('day', '2026-11-03', null), tx('name', '2026-11-10', 'iCloud')],
      new Map()
    );
    expect(ids(links)).toEqual(['name']);
  });

  it('매년 자동이체는 시작일의 달이 아니면 출금일로 보지 않고, 종료일 뒤도 연결하지 않는다', () => {
    const yearly = { ...r, cycle: 'YEARLY', startDate: '2026-03-01' } as Recurring;
    expect(matchRecurringLinks([yearly], [tx('m', '2026-11-03', null)], new Map())).toEqual([]);
    expect(ids(matchRecurringLinks([yearly], [tx('m', '2025-03-03', null)], new Map()))).toEqual(['m']);
    const ended = { ...r, endDate: '2026-10-31' };
    expect(matchRecurringLinks([ended], [tx('m', '2026-11-03', null)], new Map())).toEqual([]);
  });

  it('이체는 받는 계좌까지 같아야 하고, 한 거래는 한 자동이체에만 연결한다', () => {
    const t = { ...r, type: 'TRANSFER', toAccountId: 'a2' } as Recurring;
    const row = (id: string, to: string) => tx(id, '2026-11-03', null, { type: 'TRANSFER', toAccountId: to });
    expect(ids(matchRecurringLinks([t], [row('x', 'a3'), row('y', 'a2')], new Map()))).toEqual(['y']);
    expect(matchRecurringLinks([r, { ...r, id: 'r2' }], [tx('one', '2026-11-03', null)], new Map())).toHaveLength(1);
  });
});

describe('backdatedStart', () => {
  it('오늘 등록했는데 이번 달 출금일이 지났으면 그 출금일로 당긴다', () => {
    expect(backdatedStart('2026-11-03', monthly(1), '2026-11-03')).toBe('2026-11-01');
  });

  it('출금일이 오늘이거나 아직 안 왔으면 그대로', () => {
    expect(backdatedStart('2026-11-03', monthly(3), '2026-11-03')).toBe('2026-11-03');
    expect(backdatedStart('2026-11-03', monthly(28), '2026-11-03')).toBe('2026-11-03');
  });

  it('시작일을 직접 고른 경우는 그대로', () => {
    expect(backdatedStart('2026-12-01', monthly(1), '2026-11-03')).toBe('2026-12-01');
  });

  it('당긴 시작일이면 이번 달 거래가 만들어진다', () => {
    const startDate = backdatedStart('2026-11-03', monthly(1), '2026-11-03');
    expect(
      dueOccurrences({ cycle: 'MONTHLY', billingDay: 1, startDate, endDate: null }, '2026-11-03', [])
    ).toEqual(['2026-11-01']);
  });
});

// 매주: billingDay 는 요일 (1 월요일 ~ 7 일요일). 2026-11-02 가 월요일, 2026-11-13 이 금요일
describe('매주 자동이체', () => {
  const weekly = (weekday: number, startDate = '2026-01-01', endDate: string | null = null) => ({
    cycle: 'WEEKLY' as const,
    billingDay: weekday,
    startDate,
    endDate,
  });

  it('그 요일마다 출금일이 생기고, 시작일 이전은 제외한다', () => {
    expect(occurrencesBetween(weekly(3), '2026-11-01', '2026-11-30')).toEqual([
      '2026-11-04',
      '2026-11-11',
      '2026-11-18',
      '2026-11-25',
    ]);
    expect(occurrencesBetween(weekly(3, '2026-11-10'), '2026-11-01', '2026-11-30')).toEqual([
      '2026-11-11',
      '2026-11-18',
      '2026-11-25',
    ]);
    // 범위 첫날이 그 요일이면 첫날도 포함 (11월 1일은 일요일)
    expect(occurrencesBetween(weekly(7), '2026-11-01', '2026-11-15')).toEqual([
      '2026-11-01',
      '2026-11-08',
      '2026-11-15',
    ]);
  });

  it('같은 주(월~일)에 이미 만든 거래가 있으면 다시 만들지 않는다', () => {
    // 11/4(수) 주에는 11/5 에 이미 기록됨 → 11/11 만 만든다
    expect(dueOccurrences(weekly(3, '2026-11-01'), '2026-11-13', ['2026-11-05'])).toEqual([
      '2026-11-11',
    ]);
    // 일요일 거래는 그 앞 월요일의 주에 속한다
    expect(dueOccurrences(weekly(1, '2026-11-01'), '2026-11-13', ['2026-11-08'])).toEqual([
      '2026-11-09',
    ]);
  });

  it('다음 출금일, 문구, 그 달 합계', () => {
    expect(nextOccurrence(weekly(5), '2026-11-13')).toBe('2026-11-20');
    expect(scheduleLabel(weekly(3))).toBe('매주 수요일');
    expect(scheduleLabel(weekly(7))).toBe('매주 일요일');
    // 11월은 수요일 4번, 일요일 5번
    expect(monthTotal([{ ...weekly(3), amount: 10_000 }], '2026-11')).toBe(40_000);
    expect(monthTotal([{ ...weekly(7), amount: 10_000 }], '2026-11')).toBe(50_000);
  });

  it('직접 입력한 거래는 그 요일이거나 이름이 같으면 연결하고, 한 주에 하나만 연결한다', () => {
    const r = {
      id: 'w1',
      name: '용돈',
      type: 'TRANSFER',
      amount: 50_000,
      accountId: 'a1',
      toAccountId: 'a2',
      categoryId: null,
      ...weekly(1, '2026-11-30'),
    } as Recurring;
    const tx = (id: string, date: string, memo: string | null) => ({
      id,
      date,
      memo,
      type: 'TRANSFER' as const,
      amount: 50_000,
      accountId: 'a1',
      toAccountId: 'a2',
    });
    const links = matchRecurringLinks(
      [r],
      [
        tx('mon', '2026-11-09', null),
        tx('same-week', '2026-11-10', null), // 화요일, 이름도 다름
        tx('name', '2026-11-04', '용돈'), // 수요일이지만 이름이 같음
      ],
      new Map()
    );
    expect(links.map((l) => l.transactionId).sort()).toEqual(['mon', 'name']);
  });

  it('오늘 등록했는데 이번 주 출금 요일이 지났으면 그날로 당긴다', () => {
    expect(backdatedStart('2026-11-13', weekly(1), '2026-11-13')).toBe('2026-11-09');
    expect(backdatedStart('2026-11-13', weekly(5), '2026-11-13')).toBe('2026-11-13');
    expect(backdatedStart('2026-11-13', weekly(7), '2026-11-13')).toBe('2026-11-13');
    const startDate = backdatedStart('2026-11-13', weekly(1), '2026-11-13');
    expect(dueOccurrences({ ...weekly(1), startDate }, '2026-11-13', [])).toEqual(['2026-11-09']);
  });
});
