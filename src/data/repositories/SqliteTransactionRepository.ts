import { randomUUID } from 'expo-crypto';
import { getDB, nowISO } from '@/data/db/database';
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

  async create(input: TransactionInput): Promise<Transaction> {
    const db = await getDB();
    const now = nowISO();
    const id = randomUUID();
    await db.runAsync(
      `INSERT INTO "transaction"
         (id, type, amount, date, account_id, to_account_id, category_id, memo, recurring_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      id,
      input.type,
      input.amount,
      input.date,
      input.accountId,
      input.toAccountId,
      input.categoryId,
      input.memo,
      now,
      now
    );
    return {
      id,
      ...input,
      recurringId: null,
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
}
