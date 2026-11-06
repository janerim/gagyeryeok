import { randomUUID } from 'expo-crypto';
import { getDB, nowISO } from '@/data/db/database';
import { EMPTY_SUMS, type AccountSums } from '@/domain/balance';
import type { Transaction, TransactionInput, TransactionType } from '@/types';
import type { TransactionRepository } from './TransactionRepository';

type Row = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  memo: string | null;
  recurring_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const toTransaction = (r: Row): Transaction => ({
  id: r.id,
  type: r.type,
  amount: r.amount,
  date: r.date,
  accountId: r.account_id,
  toAccountId: r.to_account_id,
  categoryId: r.category_id,
  memo: r.memo,
  recurringId: r.recurring_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

export class SqliteTransactionRepository implements TransactionRepository {
  async listByMonth(month: string): Promise<Transaction[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<Row>(
      `SELECT * FROM "transaction"
       WHERE deleted_at IS NULL AND date BETWEEN ? AND ?
       ORDER BY date DESC, created_at DESC`,
      `${month}-01`,
      `${month}-31`
    );
    return rows.map(toTransaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    const db = await getDB();
    const row = await db.getFirstAsync<Row>(
      'SELECT * FROM "transaction" WHERE id = ?',
      id
    );
    return row ? toTransaction(row) : null;
  }

  async create(input: TransactionInput, recurringId?: string): Promise<Transaction> {
    const db = await getDB();
    const now = nowISO();
    const id = randomUUID();
    await db.runAsync(
      `INSERT INTO "transaction"
         (id, type, amount, date, account_id, to_account_id, category_id, memo, recurring_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.type,
      input.amount,
      input.date,
      input.accountId,
      input.toAccountId,
      input.categoryId,
      input.memo,
      recurringId ?? null,
      now,
      now
    );
    return {
      id,
      ...input,
      recurringId: recurringId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  }

  async update(id: string, input: TransactionInput): Promise<void> {
    const db = await getDB();
    await db.runAsync(
      `UPDATE "transaction"
       SET type = ?, amount = ?, date = ?, account_id = ?, to_account_id = ?,
           category_id = ?, memo = ?, updated_at = ?
       WHERE id = ?`,
      input.type,
      input.amount,
      input.date,
      input.accountId,
      input.toAccountId,
      input.categoryId,
      input.memo,
      nowISO(),
      id
    );
  }

  async listUnlinked(): Promise<Transaction[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<Row>(
      'SELECT * FROM "transaction" WHERE recurring_id IS NULL AND deleted_at IS NULL'
    );
    return rows.map(toTransaction);
  }

  async linkToRecurring(id: string, recurringId: string): Promise<void> {
    const db = await getDB();
    await db.runAsync(
      'UPDATE "transaction" SET recurring_id = ?, updated_at = ? WHERE id = ?',
      recurringId,
      nowISO(),
      id
    );
  }

  async softDelete(id: string): Promise<void> {
    const db = await getDB();
    const now = nowISO();
    await db.runAsync(
      'UPDATE "transaction" SET deleted_at = ?, updated_at = ? WHERE id = ?',
      now,
      now,
      id
    );
  }

  async recentCategoryIds(type: TransactionType, limit: number): Promise<string[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<{ category_id: string }>(
      `SELECT category_id FROM "transaction"
       WHERE deleted_at IS NULL AND type = ? AND category_id IS NOT NULL
       GROUP BY category_id ORDER BY MAX(created_at) DESC LIMIT ?`,
      type,
      limit
    );
    return rows.map((r) => r.category_id);
  }

  async recentAccountIds(type: TransactionType, limit: number): Promise<string[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<{ account_id: string }>(
      `SELECT account_id FROM "transaction"
       WHERE deleted_at IS NULL AND type = ?
       GROUP BY account_id ORDER BY MAX(created_at) DESC LIMIT ?`,
      type,
      limit
    );
    return rows.map((r) => r.account_id);
  }

  async sumsByAccount(): Promise<Map<string, AccountSums>> {
    const db = await getDB();
    // 출금 쪽(account_id)과 이체 입금 쪽(to_account_id)을 따로 집계해 합친다
    const rows = await db.getAllAsync<{
      account_id: string;
      income: number;
      expense: number;
      transfer_in: number;
      transfer_out: number;
    }>(
      `SELECT account_id,
              SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS income,
              SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS expense,
              0 AS transfer_in,
              SUM(CASE WHEN type = 'TRANSFER' THEN amount ELSE 0 END) AS transfer_out
       FROM "transaction" WHERE deleted_at IS NULL
       GROUP BY account_id
       UNION ALL
       SELECT to_account_id AS account_id, 0, 0, SUM(amount), 0
       FROM "transaction"
       WHERE deleted_at IS NULL AND type = 'TRANSFER' AND to_account_id IS NOT NULL
       GROUP BY to_account_id`
    );
    const map = new Map<string, AccountSums>();
    for (const r of rows) {
      const prev = map.get(r.account_id) ?? EMPTY_SUMS;
      map.set(r.account_id, {
        income: prev.income + r.income,
        expense: prev.expense + r.expense,
        transferIn: prev.transferIn + r.transfer_in,
        transferOut: prev.transferOut + r.transfer_out,
      });
    }
    return map;
  }

  async recurringDates(recurringId: string): Promise<string[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<{ date: string }>(
      'SELECT date FROM "transaction" WHERE recurring_id = ?',
      recurringId
    );
    return rows.map((r) => r.date);
  }

  async listByRecurring(recurringId: string): Promise<Transaction[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<Row>(
      `SELECT * FROM "transaction"
       WHERE recurring_id = ? AND deleted_at IS NULL
       ORDER BY date`,
      recurringId
    );
    return rows.map(toTransaction);
  }
}
