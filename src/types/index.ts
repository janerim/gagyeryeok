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
  showOnHome: boolean; // 캘린더 위에 이 계좌의 쓸 수 있는 돈을 보여준다 (한 계좌만)
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

export type RecurringType = 'EXPENSE' | 'INCOME' | 'TRANSFER';
export type RecurringCycle = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/** 자동이체(정기 거래). YEARLY는 start_date의 월을 매년 출금 월로 쓴다 */
export type Recurring = Audit & {
  id: string;
  name: string;
  type: RecurringType;
  amount: number;
  accountId: string; // INCOME: 입금 계좌 / EXPENSE, TRANSFER: 출금 계좌
  toAccountId: string | null; // TRANSFER 입금 계좌
  categoryId: string | null; // TRANSFER는 null
  cycle: RecurringCycle;
  billingDay: number; // WEEKLY: 요일 1(월)~7(일) / 그 외: 1~31, 없는 날짜는 그 달 말일로 보정
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
};

export type RecurringInput = Omit<Recurring, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
