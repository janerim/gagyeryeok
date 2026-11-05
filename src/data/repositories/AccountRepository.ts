import type { Account, AccountInput } from '@/types';

/** 이 계좌를 가리키는 삭제되지 않은 거래·자동이체 건수 */
export type AccountReferences = { transactions: number; recurrings: number };

export interface AccountRepository {
  /** 삭제되지 않은 전체 계좌(숨김 포함), sort_order 순 */
  list(): Promise<Account[]>;
  findById(id: string): Promise<Account | null>;
  create(input: AccountInput): Promise<Account>;
  update(id: string, input: AccountInput): Promise<void>;
  setHidden(id: string, hidden: boolean): Promise<void>;
  /** ids 순서대로 sort_order 를 0부터 다시 매긴다 */
  reorder(ids: string[]): Promise<void>;
  references(id: string): Promise<AccountReferences>;
  /** 거래·자동이체가 하나라도 있으면 지우지 않고 에러를 던진다 (과거 기록이 깨지지 않도록) */
  softDelete(id: string): Promise<void>;
}
