import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';

/**
 * 순서대로 적용되는 마이그레이션. 배열 인덱스+1 이 PRAGMA user_version 이 된다.
 * 한 번 배포된 항목은 수정하지 말고 새 항목을 뒤에 추가한다.
 */
export const MIGRATIONS: ((db: SQLiteDatabase) => Promise<void>)[] = [
  // v1: 기획서 6장 스키마 + 기본 카테고리
  async (db) => {
    await db.execAsync(`
      CREATE TABLE account (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        type            TEXT NOT NULL,
        purpose         TEXT,
        initial_balance INTEGER NOT NULL DEFAULT 0,
        sort_order      INTEGER NOT NULL DEFAULT 0,
        is_hidden       INTEGER NOT NULL DEFAULT 0,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL,
        deleted_at      TEXT
      );

      CREATE TABLE category (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        type       TEXT NOT NULL,
        icon       TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE TABLE recurring (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        type          TEXT NOT NULL,
        amount        INTEGER NOT NULL,
        account_id    TEXT NOT NULL,
        to_account_id TEXT,
        category_id   TEXT,
        cycle         TEXT NOT NULL,
        billing_day   INTEGER NOT NULL,
        start_date    TEXT NOT NULL,
        end_date      TEXT,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL,
        deleted_at    TEXT
      );

      CREATE TABLE "transaction" (
        id            TEXT PRIMARY KEY,
        type          TEXT NOT NULL,
        amount        INTEGER NOT NULL,
        date          TEXT NOT NULL,
        account_id    TEXT NOT NULL,
        to_account_id TEXT,
        category_id   TEXT,
        memo          TEXT,
        recurring_id  TEXT,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL,
        deleted_at    TEXT
      );

      CREATE INDEX idx_tx_date ON "transaction"(date);
      CREATE INDEX idx_tx_account ON "transaction"(account_id);
      CREATE INDEX idx_tx_recurring ON "transaction"(recurring_id);
    `);

    const now = new Date().toISOString();
    const seed: [string, 'EXPENSE' | 'INCOME', string][] = [
      ['식비', 'EXPENSE', '🍚'],
      ['카페·간식', 'EXPENSE', '☕'],
      ['교통', 'EXPENSE', '🚇'],
      ['주거·공과금', 'EXPENSE', '🏠'],
      ['통신', 'EXPENSE', '📱'],
      ['생활용품', 'EXPENSE', '🧺'],
      ['의료·건강', 'EXPENSE', '💊'],
      ['문화·여가', 'EXPENSE', '🎬'],
      ['쇼핑', 'EXPENSE', '🛍️'],
      ['구독', 'EXPENSE', '🔁'],
      ['기타 지출', 'EXPENSE', '📦'],
      ['급여', 'INCOME', '💰'],
      ['용돈·보너스', 'INCOME', '🎁'],
      ['기타 수입', 'INCOME', '➕'],
    ];
    const stmt = await db.prepareAsync(
      `INSERT INTO category (id, name, type, icon, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    try {
      for (let i = 0; i < seed.length; i++) {
        const [name, type, icon] = seed[i];
        await stmt.executeAsync(randomUUID(), name, type, icon, i, now, now);
      }
    } finally {
      await stmt.finalizeAsync();
    }
  },
];
