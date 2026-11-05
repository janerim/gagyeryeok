import { differenceInCalendarDays, endOfMonth, parseISO } from 'date-fns';
import type { Recurring } from '@/types';

export type HomeBalance = {
  balance: number; // 지금 잔액
  scheduledOut: number; // 이번 달 남은 예정 출금 (지출 + 이체 출금)
  scheduledIn: number; // 이번 달 남은 예정 입금 (다른 계좌에서 오는 이체)
  available: number; // 잔액 − 예정 출금 + 예정 입금
  daysLeft: number; // 오늘 포함, 이번 달 말일까지
  perDay: number; // 하루에 쓸 수 있는 돈. 쓸 수 있는 돈이 없으면 0
};

type Scheduled = Pick<Recurring, 'type' | 'amount' | 'accountId' | 'toAccountId'>;

/**
 * 홈에 보여줄 "쓸 수 있는 돈".
 * scheduled 는 오늘 이후 이번 달 말까지 예정된 자동이체 (오늘까지는 이미 거래로 기록되어 잔액에 들어 있다)
 */
export function homeBalance(
  accountId: string,
  balance: number,
  scheduled: Scheduled[],
  today: string
): HomeBalance {
  let scheduledOut = 0;
  let scheduledIn = 0;
  for (const r of scheduled) {
    if (r.accountId === accountId) scheduledOut += r.amount;
    else if (r.type === 'TRANSFER' && r.toAccountId === accountId) scheduledIn += r.amount;
  }
  const available = balance - scheduledOut + scheduledIn;
  const d = parseISO(today);
  const daysLeft = differenceInCalendarDays(endOfMonth(d), d) + 1;
  return {
    balance,
    scheduledOut,
    scheduledIn,
    available,
    daysLeft,
    perDay: available > 0 ? Math.floor(available / daysLeft) : 0,
  };
}
