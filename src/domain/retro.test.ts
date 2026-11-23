import { describe, expect, it } from 'vitest';
import { compareText, retroPeriod, shiftRetroPeriod, summarizeRetro } from './retro';
import { formatWon } from './money';
import type { Necessity } from '@/types';

// 2026-11-16 이 월요일, 2026-11-22 가 일요일
describe('retroPeriod', () => {
  it('주간은 월요일부터 일요일까지', () => {
    expect(retroPeriod('WEEK', '2026-11-18')).toEqual({
      type: 'WEEK',
      key: '2026-11-16',
      from: '2026-11-16',
      to: '2026-11-22',
      label: '11.16 ~ 11.22',
    });
    expect(retroPeriod('WEEK', '2026-11-22').key).toBe('2026-11-16');
    expect(retroPeriod('WEEK', '2026-11-23').key).toBe('2026-11-23');
  });

  it('달을 넘어가는 주', () => {
    const p = retroPeriod('WEEK', '2026-12-01');
    expect([p.from, p.to, p.label]).toEqual(['2026-11-30', '2026-12-06', '11.30 ~ 12.6']);
  });

  it('월간은 1일부터 말일까지', () => {
    expect(retroPeriod('MONTH', '2026-11-18')).toEqual({
      type: 'MONTH',
      key: '2026-11',
      from: '2026-11-01',
      to: '2026-11-30',
      label: '26년 11월',
    });
    expect(retroPeriod('MONTH', '2028-02-10').to).toBe('2028-02-29');
  });
});

describe('shiftRetroPeriod', () => {
  it('주 단위로 이동', () => {
    const p = retroPeriod('WEEK', '2026-11-18');
    expect(shiftRetroPeriod(p, -1).key).toBe('2026-11-09');
    expect(shiftRetroPeriod(p, 1).key).toBe('2026-11-23');
  });

  it('월 단위로 이동, 해를 넘긴다', () => {
    const p = retroPeriod('MONTH', '2026-12-31');
    expect(shiftRetroPeriod(p, 1).key).toBe('2027-01');
    expect(shiftRetroPeriod(p, -1).key).toBe('2026-11');
  });
});

describe('summarizeRetro', () => {
  let seq = 0;
  const tx = (
    amount: number,
    date: string,
    necessity: Necessity | null,
    extra: Partial<{
      type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      categoryId: string | null;
      review: string | null;
      recurringId: string | null;
    }> = {}
  ) => ({
    id: `t${++seq}`,
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    amount,
    date,
    categoryId: 'shopping' as string | null,
    necessity,
    review: null as string | null,
    recurringId: null as string | null,
    ...extra,
  });

  const week = [
    tx(8500, '2026-11-16', 'NEEDED', { categoryId: 'food' }),
    tx(32000, '2026-11-20', 'IMPULSE', { review: '없어도 됐다' }), // 금
    tx(6800, '2026-11-20', 'IMPULSE', { categoryId: 'cafe' }), // 금
    tx(9000, '2026-11-17', 'IMPULSE'), // 화
    tx(12000, '2026-11-18', null, { review: '그냥 메모' }),
    tx(4500, '2026-11-19', null),
    tx(14900, '2026-11-19', null, { recurringId: 'r1' }),
    tx(3000000, '2026-11-20', null, { type: 'INCOME', categoryId: 'salary' }),
    tx(500000, '2026-11-20', null, { type: 'TRANSFER', categoryId: null }),
  ];
  const prev = [tx(50000, '2026-11-10', 'IMPULSE'), tx(20000, '2026-11-11', null)];
  const s = summarizeRetro(week, prev);

  it('지출과 충동·필수 합계 (수입·이체 제외)', () => {
    expect(s.expense).toBe(87700);
    expect(s.impulse).toEqual({ amount: 47800, count: 3 });
    expect(s.needed).toEqual({ amount: 8500, count: 1 });
  });

  it('지난 주기 합계', () => {
    expect(s.prevExpense).toBe(70000);
    expect(s.prevImpulse).toEqual({ amount: 50000, count: 1 });
  });

  it('충동 구매를 카테고리별로 금액 큰 순', () => {
    expect(s.impulseByCategory).toEqual([
      { categoryId: 'shopping', amount: 41000, count: 2 },
      { categoryId: 'cafe', amount: 6800, count: 1 },
    ]);
  });

  it('충동 구매 금액이 가장 큰 요일', () => {
    expect(s.impulseWeekday).toBe(5);
  });

  it('리뷰 모음은 표시했거나 리뷰를 쓴 지출, 충동 먼저 날짜순', () => {
    expect(s.reviewed.map((t) => [t.date, t.amount])).toEqual([
      ['2026-11-17', 9000],
      ['2026-11-20', 32000],
      ['2026-11-20', 6800],
      ['2026-11-16', 8500],
      ['2026-11-18', 12000],
    ]);
  });

  it('표시 안 한 지출에서 자동이체는 뺀다', () => {
    expect(s.unmarked.map((t) => t.amount)).toEqual([12000, 4500]);
  });

  it('거래가 없으면 비어 있다', () => {
    const empty = summarizeRetro([], []);
    expect(empty.expense).toBe(0);
    expect(empty.impulse).toEqual({ amount: 0, count: 0 });
    expect(empty.impulseWeekday).toBeNull();
    expect(empty.reviewed).toEqual([]);
  });
});

describe('compareText', () => {
  it('지난 주기와의 차이', () => {
    expect(compareText('WEEK', 38000, 50000, formatWon)).toBe('지난주보다 12,000원 적어요');
    expect(compareText('MONTH', 50000, 38000, formatWon)).toBe('지난달보다 12,000원 많아요');
    expect(compareText('WEEK', 5000, 5000, formatWon)).toBe('지난주와 같아요');
    expect(compareText('MONTH', 5000, 5000, formatWon)).toBe('지난달과 같아요');
  });

  it('둘 다 0이면 비교하지 않는다', () => {
    expect(compareText('WEEK', 0, 0, formatWon)).toBeNull();
  });
});
