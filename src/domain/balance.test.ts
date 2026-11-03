import { describe, expect, it } from 'vitest';
import { computeBalance } from './balance';

describe('computeBalance', () => {
  it('거래가 없으면 초기 잔액', () => {
    expect(computeBalance(150_000)).toBe(150_000);
  });

  it('수입·이체 입금은 더하고 지출·이체 출금은 뺀다', () => {
    expect(
      computeBalance(100_000, { income: 3_000_000, expense: 50_000, transferIn: 0, transferOut: 1_000_000 })
    ).toBe(2_050_000);
  });

  it('이체는 보낸 계좌와 받은 계좌 잔액 합을 바꾸지 않는다', () => {
    const from = computeBalance(1_000_000, { income: 0, expense: 0, transferIn: 0, transferOut: 300_000 });
    const to = computeBalance(0, { income: 0, expense: 0, transferIn: 300_000, transferOut: 0 });
    expect(from + to).toBe(1_000_000);
  });

  it('카드처럼 지출만 있으면 음수가 될 수 있다', () => {
    expect(computeBalance(0, { income: 0, expense: 42_000, transferIn: 0, transferOut: 0 })).toBe(-42_000);
  });
});
