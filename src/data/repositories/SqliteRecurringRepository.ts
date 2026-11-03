import { randomUUID } from 'expo-crypto';
import { getDB, nowISO } from '@/data/db/database';
import type { Recurring, RecurringCycle, RecurringInput, RecurringType } from '@/types';
import type { RecurringRepository } from './RecurringRepository';

type Row = {
  id: string;
  name: string;
  type: RecurringType;
  amount: number;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  cycle: RecurringCycle;
  billing_day: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const toRecurring = (r: Row): Recurring => ({
  id: r.id,
  name: r.name,
  type: r.type,
  amount: r.amount,
  accountId: r.account_id,
  toAccountId: r.to_account_id,
  categoryId: r.category_id,
  cycle: r.cycle,
  billingDay: r.billing_day,
  startDate: r.start_date,
  endDate: r.end_date,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

export class SqliteRecurringRepository implements RecurringRepository {
  async list(): Promise<Recurring[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<Row>(
      'SELECT * FROM recurring WHERE deleted_at IS NULL ORDER BY created_at'
    );
    return rows.map(toRecurring);
  }

  async findById(id: string): Promise<Recurring | null> {
    const db = await getDB();
    const row = await db.getFirstAsync<Row>('SELECT * FROM recurring WHERE id = ?', id);
    return row ? toRecurring(row) : null;
  }

  async create(input: RecurringInput): Promise<Recurring> {
    const db = await getDB();
    const now = nowISO();
    const id = randomUUID();
    await db.runAsync(
      `INSERT INTO recurring
         (id, name, type, amount, account_id, to_account_id, category_id, cycle, billing_day,
          start_date, end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.name,
      input.type,
      input.amount,
      input.accountId,
      input.toAccountId,
      input.categoryId,
      input.cycle,
      input.billingDay,
      input.startDate,
      input.endDate,
      now,
      now
    );
    return { id, ...input, createdAt: now, updatedAt: now, deletedAt: null };
  }

  async update(id: string, input: RecurringInput): Promise<void> {
    const db = await getDB();
    await db.runAsync(
      `UPDATE recurring
       SET name = ?, type = ?, amount = ?, account_id = ?, to_account_id = ?, category_id = ?,
           cycle = ?, billing_day = ?, start_date = ?, end_date = ?, updated_at = ?
       WHERE id = ?`,
      input.name,
      input.type,
      input.amount,
      input.accountId,
      input.toAccountId,
      input.categoryId,
      input.cycle,
      input.billingDay,
      input.startDate,
      input.endDate,
      nowISO(),
      id
    );
  }

  async softDelete(id: string): Promise<void> {
    const db = await getDB();
    const now = nowISO();
    await db.runAsync(
      'UPDATE recurring SET deleted_at = ?, updated_at = ? WHERE id = ?',
      now,
      now,
      id
    );
  }
}
