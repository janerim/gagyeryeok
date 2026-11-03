import type { AccountRepository } from './AccountRepository';
import type { CategoryRepository } from './CategoryRepository';
import type { RecurringRepository } from './RecurringRepository';
import type { TransactionRepository } from './TransactionRepository';
import { SqliteAccountRepository } from './SqliteAccountRepository';
import { SqliteCategoryRepository } from './SqliteCategoryRepository';
import { SqliteRecurringRepository } from './SqliteRecurringRepository';
import { SqliteTransactionRepository } from './SqliteTransactionRepository';

/**
 * 화면·스토어는 이 객체를 통해서만 데이터에 접근한다.
 * 3차(서버 동기화)에서는 여기의 구현체만 교체한다.
 */
export const repositories: {
  account: AccountRepository;
  category: CategoryRepository;
  recurring: RecurringRepository;
  transaction: TransactionRepository;
} = {
  account: new SqliteAccountRepository(),
  category: new SqliteCategoryRepository(),
  recurring: new SqliteRecurringRepository(),
  transaction: new SqliteTransactionRepository(),
};

export type { AccountRepository, CategoryRepository, RecurringRepository, TransactionRepository };
