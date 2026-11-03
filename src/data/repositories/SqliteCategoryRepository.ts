import { randomUUID } from 'expo-crypto';
import { getDB, nowISO } from '@/data/db/database';
import type { Category, CategoryInput, CategoryType } from '@/types';
import type { CategoryRepository } from './CategoryRepository';

type Row = {
  id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const toCategory = (r: Row): Category => ({
  id: r.id,
  name: r.name,
  type: r.type,
  icon: r.icon,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

export class SqliteCategoryRepository implements CategoryRepository {
  async listAll(): Promise<Category[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<Row>(
      'SELECT * FROM category ORDER BY sort_order, created_at'
    );
    return rows.map(toCategory);
  }

  async create(input: CategoryInput): Promise<Category> {
    const db = await getDB();
    const now = nowISO();
    const id = randomUUID();
    const max = await db.getFirstAsync<{ m: number | null }>(
      'SELECT MAX(sort_order) AS m FROM category WHERE deleted_at IS NULL AND type = ?',
      input.type
    );
    const sortOrder = (max?.m ?? -1) + 1;
    await db.runAsync(
      `INSERT INTO category (id, name, type, icon, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.name,
      input.type,
      input.icon,
      sortOrder,
      now,
      now
    );
    return { id, ...input, sortOrder, createdAt: now, updatedAt: now, deletedAt: null };
  }

  async update(id: string, input: CategoryInput): Promise<void> {
    const db = await getDB();
    await db.runAsync(
      'UPDATE category SET name = ?, type = ?, icon = ?, updated_at = ? WHERE id = ?',
      input.name,
      input.type,
      input.icon,
      nowISO(),
      id
    );
  }

  async softDelete(id: string): Promise<void> {
    const db = await getDB();
    const now = nowISO();
    await db.runAsync(
      'UPDATE category SET deleted_at = ?, updated_at = ? WHERE id = ?',
      now,
      now,
      id
    );
  }

  async reorder(ids: string[]): Promise<void> {
    const db = await getDB();
    const now = nowISO();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx.runAsync(
          'UPDATE category SET sort_order = ?, updated_at = ? WHERE id = ?',
          i,
          now,
          ids[i]
        );
      }
    });
  }
}
