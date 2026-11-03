import { describe, expect, it } from 'vitest';
import { dailyTotals, expenseByCategory, sumTotals } from './stats';

const tx = (type: 'INCOME' | 'EXPENSE' | 'TRANSFER', amount: number, date = '2026-11-03') => ({
  type,
  amount,
  date,
});

describe('sumTotals', () => {
  it('수입·지출을 합산하고 이체는 제외', () => {
    expect(
      sumTotals([tx('INCOME', 3_000_000), tx('EXPENSE', 12_000), tx('EXPENSE', 8_000), tx('TRANSFER', 500_000)])
    ).toEqual({ income: 3_000_000, expense: 20_000 });
  });
  it('빈 목록은 0', () => {
    expect(sumTotals([])).toEqual({ income: 0, expense: 0 });
  });
});

describe('dailyTotals', () => {
  it('날짜별로 나눠 합산', () => {
    const map = dailyTotals([
      tx('EXPENSE', 5_000, '2026-11-01'),
      tx('EXPENSE', 7_000, '2026-11-01'),
      tx('INCOME', 100_000, '2026-11-02'),
    ]);
    expect(map.get('2026-11-01')).toEqual({ income: 0, expense: 12_000 });
    expect(map.get('2026-11-02')).toEqual({ income: 100_000, expense: 0 });
  });
  it('이체만 있는 날은 빠진다', () => {
    const map = dailyTotals([tx('TRANSFER', 500_000, '2026-11-05')]);
    expect(map.has('2026-11-05')).toBe(false);
  });
});

describe('expenseByCategory', () => {
  const c = (type: 'INCOME' | 'EXPENSE' | 'TRANSFER', amount: number, categoryId: string | null) => ({
    type,
    amount,
    categoryId,
  });

  it('지출만 카테고리별로 합산, 큰 순', () => {
    const shares = expenseByCategory([
      c('EXPENSE', 30_000, 'food'),
      c('EXPENSE', 10_000, 'cafe'),
      c('EXPENSE', 60_000, 'food'),
      c('INCOME', 1_000_000, 'salary'),
      c('TRANSFER', 500_000, null),
    ]);
    expect(shares).toEqual([
      { categoryId: 'food', amount: 90_000, ratio: 0.9 },
      { categoryId: 'cafe', amount: 10_000, ratio: 0.1 },
    ]);
  });

  it('지출이 없으면 빈 배열', () => {
    expect(expenseByCategory([c('INCOME', 1000, 'salary')])).toEqual([]);
  });
});
