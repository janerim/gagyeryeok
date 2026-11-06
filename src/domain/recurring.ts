import { addDays, addYears, format, parseISO } from 'date-fns';
import type { Recurring, Transaction } from '@/types';

type Schedule = Pick<Recurring, 'cycle' | 'billingDay' | 'startDate' | 'endDate'>;

const pad = (n: number) => String(n).padStart(2, '0');
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

/** year년 month(1~12)월의 출금일. 31일처럼 없는 날짜는 그 달 말일로 보정 */
export function billingDate(year: number, month: number, billingDay: number): string {
  return `${year}-${pad(month)}-${pad(Math.min(billingDay, daysInMonth(year, month)))}`;
}

/** from~to(YYYY-MM-DD, 양끝 포함) 사이 출금일, 오름차순. 시작일·종료일 밖은 제외 */
export function occurrencesBetween(r: Schedule, from: string, to: string): string[] {
  const lo = from > r.startDate ? from : r.startDate;
  const hi = r.endDate && r.endDate < to ? r.endDate : to;
  if (lo > hi) return [];

  const startMonth = Number(r.startDate.slice(5, 7));
  let y = Number(lo.slice(0, 4));
  let m = Number(lo.slice(5, 7));
  const endY = Number(hi.slice(0, 4));
  const endM = Number(hi.slice(5, 7));

  const out: string[] = [];
  while (y < endY || (y === endY && m <= endM)) {
    if (r.cycle === 'MONTHLY' || m === startMonth) {
      const d = billingDate(y, m, r.billingDay);
      if (d >= lo && d <= hi) out.push(d);
    }
    if (m === 12) {
      y++;
      m = 1;
    } else {
      m++;
    }
  }
  return out;
}

/** 중복 판단 단위: 매월은 YYYY-MM, 매년은 YYYY. 출금일을 바꿔도 같은 달에 두 번 생기지 않게 */
export function periodKey(cycle: Recurring['cycle'], date: string): string {
  return cycle === 'MONTHLY' ? date.slice(0, 7) : date.slice(0, 4);
}

/**
 * 시작일부터 today까지 아직 거래로 만들어지지 않은 출금일.
 * generatedDates: 이 자동이체로 이미 만든 거래 날짜들 (삭제한 거래 포함 → 지운 걸 되살리지 않음)
 */
export function dueOccurrences(r: Schedule, today: string, generatedDates: string[]): string[] {
  const done = new Set(generatedDates.map((d) => periodKey(r.cycle, d)));
  return occurrencesBetween(r, r.startDate, today).filter((d) => !done.has(periodKey(r.cycle, d)));
}

/** today 다음 날 이후 첫 출금일. 종료됐으면 null */
export function nextOccurrence(r: Schedule, today: string): string | null {
  const from = format(addDays(parseISO(today), 1), 'yyyy-MM-dd');
  const to = format(addYears(parseISO(from), 1), 'yyyy-MM-dd');
  return occurrencesBetween(r, from, to)[0] ?? null;
}

/** month(YYYY-MM)에 빠져나가는 자동이체 금액 합계 */
export function monthTotal(rs: (Schedule & Pick<Recurring, 'amount'>)[], month: string): number {
  const [y, m] = month.split('-').map(Number);
  const from = `${month}-01`;
  const to = `${month}-${pad(daysInMonth(y, m))}`;
  return rs.reduce((sum, r) => sum + r.amount * occurrencesBetween(r, from, to).length, 0);
}

/** 예: "매월 25일", "매월 말일", "매년 3월 5일" */
export function scheduleLabel(r: Pick<Recurring, 'cycle' | 'billingDay' | 'startDate'>): string {
  const day = r.billingDay >= 31 ? '말일' : `${r.billingDay}일`;
  return r.cycle === 'MONTHLY' ? `매월 ${day}` : `매년 ${Number(r.startDate.slice(5, 7))}월 ${day}`;
}

/** from~to 사이 날짜별로 출금 예정인 자동이체. 달력의 "예정" 표시용 */
export function scheduledByDate<T extends Schedule>(rs: T[], from: string, to: string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rs) {
    for (const d of occurrencesBetween(r, from, to)) {
      const list = map.get(d);
      if (list) list.push(r);
      else map.set(d, [r]);
    }
  }
  return map;
}

/** 이 날짜가 자동이체의 출금일인지. 시작일 이전 날짜도 본다 (등록 전에 직접 입력한 거래를 찾는 용도) */
function isBillingDay(r: Pick<Recurring, 'cycle' | 'billingDay' | 'startDate'>, date: string): boolean {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  if (r.cycle === 'YEARLY' && month !== Number(r.startDate.slice(5, 7))) return false;
  return billingDate(year, month, r.billingDay) === date;
}

type LinkCandidate = Pick<
  Transaction,
  'id' | 'type' | 'amount' | 'date' | 'accountId' | 'toAccountId' | 'memo'
>;

/**
 * 자동이체를 등록하기 전에 직접 입력한 거래를 찾아 어느 자동이체에 연결할지 정한다.
 * 유형·금액·계좌가 같고, 메모가 자동이체 이름과 같거나 날짜가 출금일이어야 한다.
 * 같은 주기에 이미 연결된 거래가 있으면 더 연결하지 않는다.
 * linkedDates: 자동이체 id별로 연결된 거래 날짜 (삭제한 거래 제외)
 */
export function matchRecurringLinks(
  recurrings: Recurring[],
  unlinked: LinkCandidate[],
  linkedDates: Map<string, string[]>
): { transactionId: string; recurringId: string }[] {
  const used = new Set<string>();
  const links: { transactionId: string; recurringId: string }[] = [];
  for (const r of recurrings) {
    const taken = new Set((linkedDates.get(r.id) ?? []).map((d) => periodKey(r.cycle, d)));
    const sameName = (t: LinkCandidate) => t.memo?.trim() === r.name.trim();
    const candidates = unlinked
      .filter(
        (t) =>
          !used.has(t.id) &&
          t.type === r.type &&
          t.amount === r.amount &&
          t.accountId === r.accountId &&
          (r.type !== 'TRANSFER' || t.toAccountId === r.toAccountId) &&
          (!r.endDate || t.date <= r.endDate) &&
          (sameName(t) || isBillingDay(r, t.date))
      )
      // 한 주기에 후보가 여럿이면 이름이 같은 거래를 먼저 고른다
      .sort((a, b) => Number(sameName(b)) - Number(sameName(a)) || a.date.localeCompare(b.date));
    for (const t of candidates) {
      const period = periodKey(r.cycle, t.date);
      if (taken.has(period)) continue;
      taken.add(period);
      used.add(t.id);
      links.push({ transactionId: t.id, recurringId: r.id });
    }
  }
  return links;
}
