import { create } from 'zustand';
import { repositories } from '@/data/repositories';
import type { Account, AccountInput } from '@/types';

type AccountStore = {
  accounts: Account[]; // 숨김 포함, 삭제 제외
  loaded: boolean;
  load: () => Promise<void>;
  add: (input: AccountInput) => Promise<Account>;
  edit: (id: string, input: AccountInput) => Promise<void>;
  setHidden: (id: string, hidden: boolean) => Promise<void>;
  reorder: (ids: string[]) => Promise<void>;
  /** 거래·자동이체가 없는 계좌만 지워진다. 먼저 repositories.account.references 로 확인한다 */
  remove: (id: string) => Promise<void>;
};

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  loaded: false,
  load: async () => {
    const accounts = await repositories.account.list();
    set({ accounts, loaded: true });
  },
  add: async (input) => {
    const created = await repositories.account.create(input);
    await get().load();
    return created;
  },
  edit: async (id, input) => {
    await repositories.account.update(id, input);
    await get().load();
  },
  setHidden: async (id, hidden) => {
    await repositories.account.setHidden(id, hidden);
    await get().load();
  },
  reorder: async (ids) => {
    await repositories.account.reorder(ids);
    await get().load();
  },
  remove: async (id) => {
    await repositories.account.softDelete(id);
    await get().load();
  },
}));

export const selectVisibleAccounts = (s: AccountStore) =>
  s.accounts.filter((a) => !a.isHidden);
