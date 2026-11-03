export type AccountType = 'CHECKING' | 'SAVINGS' | 'CARD' | 'CASH' | 'OTHER';
export type CategoryType = 'EXPENSE' | 'INCOME';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

type Audit = {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Account = Audit & {
  id: string;
  name: string;
  type: AccountType;
  purpose: string | null;
  initialBalance: number;
  sortOrder: number;
  isHidden: boolean;
};

export type AccountInput = {
  name: string;
  type: AccountType;
  purpose: string | null;
  initialBalance: number;
};

export type Category = Audit & {
  id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  sortOrder: number;
};

export type CategoryInput = {
  name: string;
  type: CategoryType;
  icon: string | null;
};

export type Transaction = Audit & {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  accountId: string; // INCOME: 입금 계좌 / EXPENSE, TRANSFER: 출금 계좌
  toAccountId: string | null; // TRANSFER 입금 계좌
  categoryId: string | null; // TRANSFER는 null
  memo: string | null;
  recurringId: string | null;
};

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  date: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  memo: string | null;
};
