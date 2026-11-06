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

/** 자동이체로 기록된 지출 합계. 아직 빠져나가지 않은 예정분과 계좌 간 이체는 넣지 않는다 */
export function recurringExpense(txs: Pick<Transaction, 'type' | 'amount' | 'recurringId'>[]): number {
  return txs.reduce(
    (sum, t) => (t.type === 'EXPENSE' && t.recurringId ? sum + t.amount : sum),
    0
  );
}

export type CategoryShare = {
  categoryId: string | null; // 카테고리 없는 지출은 null
  amount: number;
  ratio: number; // 0~1, 전체 지출 대비
};

/** 카테고리별 지출 합계와 비율, 금액 큰 순. EXPENSE만 집계 */
export function expenseByCategory(txs: Pick<Transaction, 'type' | 'amount' | 'categoryId'>[]): CategoryShare[] {
  const map = new Map<string | null, number>();
  let total = 0;
  for (const t of txs) {
    if (t.type !== 'EXPENSE') continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    total += t.amount;
  }
  return [...map.entries()]
    .map(([categoryId, amount]) => ({ categoryId, amount, ratio: total ? amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
}
