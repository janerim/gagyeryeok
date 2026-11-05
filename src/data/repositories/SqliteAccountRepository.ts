import { randomUUID } from 'expo-crypto';
import { getDB, nowISO } from '@/data/db/database';
import type { Account, AccountInput, AccountType } from '@/types';
import type { AccountReferences, AccountRepository } from './AccountRepository';

type Row = {
  id: string;
  name: string;
  type: AccountType;
  purpose: string | null;
  initial_balance: number;
  sort_order: number;
  is_hidden: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const toAccount = (r: Row): Account => ({
  id: r.id,
  name: r.name,
  type: r.type,
  purpose: r.purpose,
  initialBalance: r.initial_balance,
  sortOrder: r.sort_order,
  isHidden: r.is_hidden === 1,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

export class SqliteAccountRepository implements AccountRepository {
  async list(): Promise<Account[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<Row>(
      'SELECT * FROM account WHERE deleted_at IS NULL ORDER BY sort_order, created_at'
    );
    return rows.map(toAccount);
  }

  async findById(id: string): Promise<Account | null> {
    const db = await getDB();
    const row = await db.getFirstAsync<Row>('SELECT * FROM account WHERE id = ?', id);
    return row ? toAccount(row) : null;
  }

  async create(input: AccountInput): Promise<Account> {
    const db = await getDB();
    const now = nowISO();
    const id = randomUUID();
    const max = await db.getFirstAsync<{ m: number | null }>(
      'SELECT MAX(sort_order) AS m FROM account WHERE deleted_at IS NULL'
    );
    const sortOrder = (max?.m ?? -1) + 1;
    await db.runAsync(
      `INSERT INTO account (id, name, type, purpose, initial_balance, sort_order, is_hidden, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      id,
      input.name,
      input.type,
      input.purpose,
      input.initialBalance,
      sortOrder,
      now,
      now
    );
    return {
      id,
      ...input,
      sortOrder,
      isHidden: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  }

  async update(id: string, input: AccountInput): Promise<void> {
    const db = await getDB();
    await db.runAsync(
      `UPDATE account SET name = ?, type = ?, purpose = ?, initial_balance = ?, updated_at = ?
       WHERE id = ?`,
      input.name,
      input.type,
      input.purpose,
      input.initialBalance,
      nowISO(),
      id
    );
  }

  async setHidden(id: string, hidden: boolean): Promise<void> {
    const db = await getDB();
    await db.runAsync(
      'UPDATE account SET is_hidden = ?, updated_at = ? WHERE id = ?',
      hidden ? 1 : 0,
      nowISO(),
      id
    );
  }

  async reorder(ids: string[]): Promise<void> {
    const db = await getDB();
    const now = nowISO();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx.runAsync(
          'UPDATE account SET sort_order = ?, updated_at = ? WHERE id = ?',
          i,
          now,
          ids[i]
        );
      }
    });
  }

  async references(id: string): Promise<AccountReferences> {
    const db = await getDB();
    const count = async (table: string) => {
      const row = await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM "${table}"
         WHERE deleted_at IS NULL AND (account_id = ? OR to_account_id = ?)`,
        id,
        id
      );
      return row?.n ?? 0;
    };
    return { transactions: await count('transaction'), recurrings: await count('recurring') };
  }

  async softDelete(id: string): Promise<void> {
    const refs = await this.references(id);
    if (refs.transactions > 0 || refs.recurrings > 0) {
      throw new Error('거래나 자동이체가 있는 계좌는 지울 수 없습니다');
    }
    const db = await getDB();
    const now = nowISO();
    await db.runAsync(
      'UPDATE account SET deleted_at = ?, updated_at = ? WHERE id = ?',
      now,
      now,
      id
    );
  }
}
