import { create } from 'zustand';
import { format } from 'date-fns';
import { repositories } from '@/data/repositories';
import type { Transaction, TransactionInput } from '@/types';

type TransactionStore = {
  month: string; // YYYY-MM, 내역 화면이 보고 있는 달
  items: Transaction[];
  loading: boolean;
  setMonth: (month: string) => Promise<void>;
  reload: () => Promise<void>;
  add: (input: TransactionInput) => Promise<Transaction>;
  edit: (id: string, input: TransactionInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  month: format(new Date(), 'yyyy-MM'),
  items: [],
  loading: false,
  setMonth: async (month) => {
    set({ month });
    await get().reload();
  },
  reload: async () => {
    const month = get().month;
    set({ loading: true });
    const items = await repositories.transaction.listByMonth(month);
    // 로딩 중 달이 바뀌었으면 이전 결과는 버린다
    if (get().month === month) set({ items, loading: false });
  },
  add: async (input) => {
    const created = await repositories.transaction.create(input);
    await get().reload();
    return created;
  },
  edit: async (id, input) => {
    await repositories.transaction.update(id, input);
    await get().reload();
  },
  remove: async (id) => {
    await repositories.transaction.softDelete(id);
    await get().reload();
  },
}));
