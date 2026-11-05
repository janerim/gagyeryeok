import { describe, expect, it } from 'vitest';
import { homeBalance } from './homeBalance';

const expense = (accountId: string, amount: number) => ({
  type: 'EXPENSE' as const,
  amount,
  accountId,
  toAccountId: null,
});
const income = (accountId: string, amount: number) => ({
  type: 'INCOME' as const,
  amount,
  accountId,
  toAccountId: null,
});
const transfer = (from: string, to: string, amount: number) => ({
  type: 'TRANSFER' as const,
  amount,
  accountId: from,
  toAccountId: to,
});

describe('homeBalance', () => {
  it('이 계좌에서 나갈 예정은 빼고, 이 계좌로 들어올 이체는 더한다', () => {
    const r = homeBalance(
      'a1',
      500000,
      [
        expense('a1', 120000),
        transfer('a1', 'a3', 50000),
        transfer('a2', 'a1', 700000),
        expense('a2', 99999), // 다른 계좌 것은 무시
      ],
      '2026-11-05'
    );
    expect(r).toMatchObject({
      balance: 500000,
      scheduledOut: 170000,
      scheduledIn: 700000,
      available: 1030000,
      daysLeft: 26,
    });
    expect(r.perDay).toBe(Math.floor(1030000 / 26));
  });

  it('이 계좌로 들어올 수입형 자동이체는 더한다', () => {
    const r = homeBalance(
      'a1',
      100000,
      [income('a1', 3000000), income('a2', 500000), expense('a1', 20000)],
      '2026-11-05'
    );
    expect(r).toMatchObject({ scheduledOut: 20000, scheduledIn: 3000000, available: 3080000 });
  });

  it('남은 날은 오늘을 포함한다', () => {
    expect(homeBalance('a', 0, [], '2026-11-30').daysLeft).toBe(1);
    expect(homeBalance('a', 0, [], '2026-02-01').daysLeft).toBe(28);
  });

  it('쓸 수 있는 돈이 없으면 하루 금액은 0', () => {
    expect(homeBalance('a', 1000, [expense('a', 5000)], '2026-11-05')).toMatchObject({
      available: -4000,
      perDay: 0,
    });
  });
});
