import { getDB, nowISO } from '@/data/db/database';
import type { RetroPeriodType, Retrospective } from '@/types';
import type { RetrospectiveRepository } from './RetrospectiveRepository';

type Row = {
  period_type: RetroPeriodType;
  period_key: string;
  note: string;
  updated_at: string;
};

export class SqliteRetrospectiveRepository implements RetrospectiveRepository {
  async find(periodType: RetroPeriodType, periodKey: string): Promise<Retrospective | null> {
    const db = await getDB();
    const row = await db.getFirstAsync<Row>(
      'SELECT * FROM retrospective WHERE period_type = ? AND period_key = ?',
      periodType,
      periodKey
    );
    return row
      ? { periodType: row.period_type, periodKey: row.period_key, note: row.note, updatedAt: row.updated_at }
      : null;
  }

  async save(periodType: RetroPeriodType, periodKey: string, note: string): Promise<void> {
    const db = await getDB();
    const text = note.trim();
    if (!text) {
      await db.runAsync(
        'DELETE FROM retrospective WHERE period_type = ? AND period_key = ?',
        periodType,
        periodKey
      );
      return;
    }
    const now = nowISO();
    await db.runAsync(
      `INSERT INTO retrospective (period_type, period_key, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (period_type, period_key) DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at`,
      periodType,
      periodKey,
      text,
      now,
      now
    );
  }
}
