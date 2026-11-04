import type { SQLiteDatabase } from 'expo-sqlite';
import { applyMigrations, getDB, nowISO } from '@/data/db/database';
import { MIGRATIONS } from '@/data/db/migrations';
import { createBackup, type Backup, type BackupRow } from '@/domain/backup';
import type { BackupRepository } from './BackupRepository';

async function userTables(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
  );
  return rows.map((r) => r.name);
}

async function insertRows(db: SQLiteDatabase, table: string, rows: BackupRow[]): Promise<void> {
  if (rows.length === 0) return;
  const info = await db.getAllAsync<{ name: string }>(`PRAGMA table_info("${table}")`);
  const columns = info.map((c) => c.name);
  const stmt = await db.prepareAsync(
    `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')})
     VALUES (${columns.map(() => '?').join(', ')})`
  );
  try {
    for (const row of rows) {
      const unknown = Object.keys(row).find((k) => !columns.includes(k));
      if (unknown) throw new Error(`알 수 없는 컬럼: ${table}.${unknown}`);
      await stmt.executeAsync(columns.map((c) => row[c] ?? null));
    }
  } finally {
    await stmt.finalizeAsync();
  }
}

export class SqliteBackupRepository implements BackupRepository {
  schemaVersion(): number {
    return MIGRATIONS.length;
  }

  async dump(): Promise<Backup> {
    const db = await getDB();
    const tables: Backup['tables'] = {};
    // 읽는 도중 자동이체가 생성되어도 한 시점의 데이터가 되도록 트랜잭션으로 묶는다
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const table of await userTables(tx)) {
        tables[table] = await tx.getAllAsync<BackupRow>(`SELECT * FROM "${table}"`);
      }
    });
    return createBackup(MIGRATIONS.length, nowISO(), tables);
  }

  async restore(backup: Backup): Promise<void> {
    const db = await getDB();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const table of await userTables(tx)) {
        await tx.execAsync(`DROP TABLE "${table}"`);
      }
      // 백업 당시 스키마로 만들어 넣은 뒤, 이후 마이그레이션을 데이터와 함께 적용한다
      await applyMigrations(tx, 0, backup.schemaVersion);
      const tables = await userTables(tx);
      for (const table of tables) {
        await tx.execAsync(`DELETE FROM "${table}"`); // 마이그레이션이 넣은 기본 카테고리
      }
      for (const [table, rows] of Object.entries(backup.tables)) {
        if (!tables.includes(table)) throw new Error(`알 수 없는 테이블: ${table}`);
        await insertRows(tx, table, rows);
      }
      await applyMigrations(tx, backup.schemaVersion, MIGRATIONS.length);
    });
  }
}
