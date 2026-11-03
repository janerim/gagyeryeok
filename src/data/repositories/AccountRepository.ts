import type { Account, AccountInput } from '@/types';

export interface AccountRepository {
  /** 삭제되지 않은 전체 계좌(숨김 포함), sort_order 순 */
  list(): Promise<Account[]>;
  findById(id: string): Promise<Account | null>;
  create(input: AccountInput): Promise<Account>;
  update(id: string, input: AccountInput): Promise<void>;
  setHidden(id: string, hidden: boolean): Promise<void>;
  /** ids 순서대로 sort_order 를 0부터 다시 매긴다 */
  reorder(ids: string[]): Promise<void>;
}
