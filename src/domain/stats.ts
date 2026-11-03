import type { Transaction } from '@/types';

export type Totals = { income: number; expense: number };

type Tx = Pick<Transaction, 'type' | 'amount' | 'date'>;

/** 수입·지출 합계. TRANSFER는 지출로 세지 않는다. */
export function sumTotals(txs: Tx[]): Totals {
  const totals = { income: 0, expense: 0 };
  for (const t of txs) {
    if (t.type === 'INCOME') totals.income += t.amount;
    else if (t.type === 'EXPENSE') totals.expense += t.amount;
  }
  return totals;
}

/** 날짜(YYYY-MM-DD)별 수입·지출 합계. 수입·지출이 없는 날(이체만 있는 날 포함)은 빠진다. */
export function dailyTotals(txs: Tx[]): Map<string, Totals> {
  const map = new Map<string, Totals>();
  for (const t of txs) {
    if (t.type === 'TRANSFER') continue;
    let day = map.get(t.date);
    if (!day) {
      day = { income: 0, expense: 0 };
      map.set(t.date, day);
    }
    if (t.type === 'INCOME') day.income += t.amount;
    else day.expense += t.amount;
  }
  return map;
}
