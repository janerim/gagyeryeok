import { addDays, addMonths, endOfMonth, format, getISODay, parseISO, startOfWeek } from 'date-fns';
import type { RetroPeriodType, Transaction } from '@/types';

const toKey = (d: Date) => format(d, 'yyyy-MM-dd');

export type RetroPeriod = {
  type: RetroPeriodType;
  /** 저장 키. 주간: 그 주 월요일(YYYY-MM-DD), 월간: YYYY-MM */
  key: string;
  from: string; // YYYY-MM-DD, 포함
  to: string; // YYYY-MM-DD, 포함
  /** 예: "11.16 ~ 11.22", "26년 11월" */
  label: string;
};

/** date(YYYY-MM-DD)가 속한 주(월요일~일요일, 달력과 같다) 또는 달 */
export function retroPeriod(type: RetroPeriodType, date: string): RetroPeriod {
  const d = parseISO(date);
  if (type === 'WEEK') {
    const monday = startOfWeek(d, { weekStartsOn: 1 });
    const sunday = addDays(monday, 6);
    return {
      type,
      key: toKey(monday),
      from: toKey(monday),
      to: toKey(sunday),
      label: `${format(monday, 'M.d')} ~ ${format(sunday, 'M.d')}`,
    };
  }
  return {
    type,
    key: format(d, 'yyyy-MM'),
    from: `${format(d, 'yyyy-MM')}-01`,
    to: toKey(endOfMonth(d)),
    label: `${format(d, 'yy')}년 ${d.getMonth() + 1}월`,
  };
}

/** delta 만큼 앞뒤 주기 (-1: 지난 주·지난달) */
export function shiftRetroPeriod(p: RetroPeriod, delta: number): RetroPeriod {
  const from = parseISO(p.from);
  return retroPeriod(p.type, toKey(p.type === 'WEEK' ? addDays(from, 7 * delta) : addMonths(from, delta)));
}

type Tx = Pick<
  Transaction,
  'id' | 'type' | 'amount' | 'date' | 'categoryId' | 'necessity' | 'review' | 'recurringId'
>;

export type Tally = { amount: number; count: number };

export type RetroSummary<T extends Tx> = {
  expense: number;
  /** 지난 주기 지출. 비교용 */
  prevExpense: number;
  impulse: Tally;
  prevImpulse: Tally;
  needed: Tally;
  /** 충동 구매를 카테고리별로, 금액 큰 순 */
  impulseByCategory: (Tally & { categoryId: string | null })[];
  /** 충동 구매가 가장 많았던 요일 1(월)~7(일). 금액 기준, 없으면 null */
  impulseWeekday: number | null;
  /** 필수/충동을 표시했거나 리뷰를 남긴 지출. 충동 먼저, 그 안에서 날짜순 */
  reviewed: T[];
  /** 아직 표시하지 않은 지출 (자동이체로 기록된 것은 제외), 날짜순 */
  unmarked: T[];
};

const tally = (txs: Tx[]): Tally => ({
  amount: txs.reduce((sum, t) => sum + t.amount, 0),
  count: txs.length,
});

/** 한 주기(txs)의 지출을 돌아보는 요약. prev 는 바로 앞 주기의 거래 */
export function summarizeRetro<T extends Tx>(txs: T[], prev: Tx[]): RetroSummary<T> {
  const expenses = txs.filter((t) => t.type === 'EXPENSE');
  const prevExpenses = prev.filter((t) => t.type === 'EXPENSE');
  const impulses = expenses.filter((t) => t.necessity === 'IMPULSE');

  const byCategory = new Map<string | null, Tx[]>();
  const byWeekday = new Map<number, number>();
  for (const t of impulses) {
    const list = byCategory.get(t.categoryId);
    if (list) list.push(t);
    else byCategory.set(t.categoryId, [t]);
    const wd = getISODay(parseISO(t.date));
    byWeekday.set(wd, (byWeekday.get(wd) ?? 0) + t.amount);
  }
  const topWeekday = [...byWeekday.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];

  const byDate = (a: Tx, b: Tx) => a.date.localeCompare(b.date);
  const rank = (t: Tx) => (t.necessity === 'IMPULSE' ? 0 : 1);

  return {
    expense: tally(expenses).amount,
    prevExpense: tally(prevExpenses).amount,
    impulse: tally(impulses),
    prevImpulse: tally(prevExpenses.filter((t) => t.necessity === 'IMPULSE')),
    needed: tally(expenses.filter((t) => t.necessity === 'NEEDED')),
    impulseByCategory: [...byCategory.entries()]
      .map(([categoryId, list]) => ({ categoryId, ...tally(list) }))
      .sort((a, b) => b.amount - a.amount),
    impulseWeekday: topWeekday ? topWeekday[0] : null,
    reviewed: expenses
      .filter((t) => t.necessity || t.review)
      .sort((a, b) => rank(a) - rank(b) || byDate(a, b)),
    unmarked: expenses.filter((t) => !t.necessity && !t.recurringId).sort(byDate),
  };
}

/** 지난 주기와의 차이를 한 줄로. 예: "지난주보다 12,000원 적어요". 비교할 게 없으면 null */
export function compareText(
  type: RetroPeriodType,
  current: number,
  previous: number,
  formatAmount: (n: number) => string
): string | null {
  if (previous === 0 && current === 0) return null;
  const prevName = type === 'WEEK' ? '지난주' : '지난달';
  if (current === previous) return type === 'WEEK' ? '지난주와 같아요' : '지난달과 같아요';
  const diff = Math.abs(current - previous);
  return `${prevName}보다 ${formatAmount(diff)}원 ${current > previous ? '많아요' : '적어요'}`;
}
