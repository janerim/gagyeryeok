import type { AccountSums } from '@/domain/balance';
import type { Transaction, TransactionInput, TransactionType } from '@/types';

export interface TransactionRepository {
  /** month: YYYY-MM. 삭제 제외, 날짜 내림차순 */
  listByMonth(month: string): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  /** recurringId: 자동이체로 만든 거래면 그 자동이체 id */
  create(input: TransactionInput, recurringId?: string): Promise<Transaction>;
  update(id: string, input: TransactionInput): Promise<void>;
  /** 자동이체에 연결되지 않은 거래 전체 (삭제 제외) */
  listUnlinked(): Promise<Transaction[]>;
  /** 직접 입력한 거래를 자동이체에 연결한다 */
  linkToRecurring(id: string, recurringId: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  /** 해당 유형에서 최근 사용한 카테고리 id, 최근 순 */
  recentCategoryIds(type: TransactionType, limit: number): Promise<string[]>;
  /** 해당 유형에서 최근 사용한 출금/입금 계좌 id, 최근 순 */
  recentAccountIds(type: TransactionType, limit: number): Promise<string[]>;
  /** 계좌 id별 전체 기간 거래 합계 (잔액 계산용). 거래 없는 계좌는 빠진다 */
  sumsByAccount(): Promise<Map<string, AccountSums>>;
  /** 이 자동이체로 만든 거래 날짜들. 삭제한 거래도 포함 (지운 걸 다시 만들지 않도록) */
  recurringDates(recurringId: string): Promise<string[]>;
  /** 이 자동이체로 만든 거래 중 삭제되지 않은 것, 날짜 오름차순 */
  listByRecurring(recurringId: string): Promise<Transaction[]>;
}
