import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

const DB_NAME = 'gagyeryeok.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** 앱 전체에서 공유하는 DB 핸들. 처음 호출 시 마이그레이션까지 수행한다. */
export function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = open();
  return dbPromise;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await MIGRATIONS[v](tx);
      await tx.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

export function nowISO(): string {
  return new Date().toISOString();
}
