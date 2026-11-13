import { create } from 'zustand';
import { format } from 'date-fns';
import { repositories } from '@/data/repositories';
import { dueOccurrences, matchRecurringLinks, periodKey } from '@/domain/recurring';
import type { Recurring, RecurringInput, Transaction } from '@/types';
import { useTransactionStore } from './transactionStore';

type RecurringStore = {
  items: Recurring[];
  loaded: boolean;
  load: () => Promise<void>;
  /** linkTransactionId: 거래로 만든 자동이체면 그 거래. 바로 연결해 같은 주기 거래를 또 만들지 않는다 */
  add: (input: RecurringInput, linkTransactionId?: string) => Promise<void>;
  edit: (id: string, input: RecurringInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** 오늘까지 출금일이 지났는데 아직 거래가 없는 자동이체를 거래로 만든다. 만든 건수 반환 */
  generateDue: () => Promise<number>;
  /** 이번 주기(매주: 이번 주, 매월: 이번 달, 매년: 올해)에 이 자동이체로 이미 기록된 거래 */
  currentPeriodTransactions: (r: Recurring) => Promise<Transaction[]>;
  /** 이미 기록된 거래를 자동이체의 현재 내용으로 맞춘다. 날짜는 그대로 */
  applyToTransactions: (r: Recurring, txs: Transaction[]) => Promise<void>;
};

// 앱 시작과 포그라운드 복귀가 겹쳐도 같은 거래를 두 번 만들지 않도록 한 번에 하나만 실행
let running: Promise<number> | null = null;

export const useRecurringStore = create<RecurringStore>((set, get) => ({
  items: [],
  loaded: false,
  load: async () => {
    const items = await repositories.recurring.list();
    set({ items, loaded: true });
  },
  add: async (input, linkTransactionId) => {
    const created = await repositories.recurring.create(input);
    // 자동 기록(generateDue)보다 먼저 연결해야 그 거래의 주기를 빈 것으로 보지 않는다
    if (linkTransactionId) {
      await useTransactionStore.getState().linkToRecurring(linkTransactionId, created.id);
    }
    await get().load();
    await get().generateDue();
  },
  edit: async (id, input) => {
    await repositories.recurring.update(id, input);
    await get().load();
    await get().generateDue();
  },
  remove: async (id) => {
    await repositories.recurring.softDelete(id);
    await get().load();
  },
  generateDue: () => {
    if (!running) {
      running = generate(get().items).finally(() => {
        running = null;
      });
    }
    return running;
  },
  currentPeriodTransactions: async (r) => {
    const current = periodKey(r.cycle, format(new Date(), 'yyyy-MM-dd'));
    const txs = await repositories.transaction.listByRecurring(r.id);
    return txs.filter((t) => periodKey(r.cycle, t.date) === current);
  },
  applyToTransactions: async (r, txs) => {
    for (const t of txs) {
      await repositories.transaction.update(t.id, toTransactionInput(r, t.date));
    }
    await useTransactionStore.getState().reload();
  },
}));

function toTransactionInput(r: Recurring, date: string) {
  return {
    type: r.type,
    amount: r.amount,
    date,
    accountId: r.accountId,
    toAccountId: r.type === 'TRANSFER' ? r.toAccountId : null,
    categoryId: r.type === 'TRANSFER' ? null : r.categoryId,
    memo: r.name,
  };
}

/** 자동이체 등록 전에 직접 입력한 거래를 연결한다. 연결한 건수 반환 */
async function linkExisting(items: Recurring[]): Promise<number> {
  if (items.length === 0) return 0;
  const unlinked = await repositories.transaction.listUnlinked();
  const linkedDates = new Map<string, string[]>();
  for (const r of items) {
    const txs = await repositories.transaction.listByRecurring(r.id);
    linkedDates.set(r.id, txs.map((t) => t.date));
  }
  const links = matchRecurringLinks(items, unlinked, linkedDates);
  for (const { transactionId, recurringId } of links) {
    await repositories.transaction.linkToRecurring(transactionId, recurringId);
  }
  return links.length;
}

async function generate(items: Recurring[]): Promise<number> {
  const today = format(new Date(), 'yyyy-MM-dd');
  // 연결을 먼저 해야 이미 직접 입력한 달의 거래를 또 만들지 않는다
  const linked = await linkExisting(items);
  let created = 0;
  for (const r of items) {
    const generated = await repositories.transaction.recurringDates(r.id);
    for (const date of dueOccurrences(r, today, generated)) {
      await repositories.transaction.create(toTransactionInput(r, date), r.id);
      created++;
    }
  }
  if (created > 0 || linked > 0) await useTransactionStore.getState().reload();
  return created;
}
