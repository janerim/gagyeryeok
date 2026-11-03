import type { AccountType, TransactionType } from '@/types';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: '입출금',
  SAVINGS: '예적금',
  CARD: '카드',
  CASH: '현금',
  OTHER: '기타',
};

export const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];

export const TX_TYPE_LABELS: Record<TransactionType, string> = {
  EXPENSE: '지출',
  INCOME: '수입',
  TRANSFER: '이체',
};

export const TX_TYPES: TransactionType[] = ['EXPENSE', 'INCOME', 'TRANSFER'];
