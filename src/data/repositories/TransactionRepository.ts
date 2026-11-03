import type { AccountSums } from '@/domain/balance';
import type { Transaction, TransactionInput, TransactionType } from '@/types';

export interface TransactionRepository {
  /** month: YYYY-MM. 삭제 제외, 날짜 내림차순 */
  listByMonth(month: string): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  create(input: TransactionInput): Promise<Transaction>;
  update(id: string, input: TransactionInput): Promise<void>;
  softDelete(id: string): Promise<void>;
  /** 해당 유형에서 최근 사용한 카테고리 id, 최근 순 */
  recentCategoryIds(type: TransactionType, limit: number): Promise<string[]>;
  /** 해당 유형에서 최근 사용한 출금/입금 계좌 id, 최근 순 */
  recentAccountIds(type: TransactionType, limit: number): Promise<string[]>;
  /** 계좌 id별 전체 기간 거래 합계 (잔액 계산용). 거래 없는 계좌는 빠진다 */
  sumsByAccount(): Promise<Map<string, AccountSums>>;
}
