import { format, isValid, parse } from 'date-fns';

const BACKUP_APP = 'gagyeryeok';
const REQUIRED_TABLES = ['account', 'category', 'recurring', 'transaction'];
const SAFETY_PREFIX = 'before-restore-';
const STAMP = 'yyyyMMdd-HHmmss';

export type BackupValue = string | number | null;
export type BackupRow = Record<string, BackupValue>;

export type Backup = {
  app: typeof BACKUP_APP;
  schemaVersion: number; // 백업 당시 PRAGMA user_version
  exportedAt: string;
  tables: Record<string, BackupRow[]>; // 삭제 표시된 행도 포함
};

export type BackupSummary = {
  exportedAt: string;
  transactions: number;
  accounts: number;
  categories: number;
  recurrings: number;
};

/** 파일 자체가 잘못된 경우. message는 사용자에게 그대로 보여준다 */
export class BackupFormatError extends Error {}

export function createBackup(
  schemaVersion: number,
  exportedAt: string,
  tables: Record<string, BackupRow[]>
): Backup {
  return { app: BACKUP_APP, schemaVersion, exportedAt, tables };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isRow = (v: unknown): v is BackupRow =>
  isObject(v) &&
  Object.values(v).every(
    (x) => x === null || typeof x === 'string' || typeof x === 'number'
  );

/** 백업 파일 내용을 검증한다. 컬럼까지의 검증은 복원 트랜잭션 안에서 스키마와 대조한다 */
export function parseBackup(text: string, currentVersion: number): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupFormatError('백업 파일이 손상되었거나 JSON 형식이 아닙니다.');
  }
  if (!isObject(data) || data.app !== BACKUP_APP) {
    throw new BackupFormatError('가계력 백업 파일이 아닙니다.');
  }
  const { schemaVersion, exportedAt, tables } = data;
  if (
    typeof schemaVersion !== 'number' ||
    !Number.isInteger(schemaVersion) ||
    schemaVersion < 1 ||
    typeof exportedAt !== 'string' ||
    Number.isNaN(Date.parse(exportedAt)) ||
    !isObject(tables)
  ) {
    throw new BackupFormatError('백업 파일의 형식이 올바르지 않습니다.');
  }
  if (schemaVersion > currentVersion) {
    throw new BackupFormatError(
      '더 새로운 버전의 앱에서 만든 백업입니다. 앱을 업데이트한 뒤 다시 시도해 주세요.'
    );
  }
  if (REQUIRED_TABLES.some((t) => !Array.isArray(tables[t]))) {
    throw new BackupFormatError('백업 파일에 빠진 데이터가 있습니다.');
  }
  const rows = Object.values(tables);
  if (!rows.every((r) => Array.isArray(r) && r.every(isRow))) {
    throw new BackupFormatError('백업 파일의 형식이 올바르지 않습니다.');
  }
  return { app: BACKUP_APP, schemaVersion, exportedAt, tables: tables as Backup['tables'] };
}

/** 복원 확인 창에 보여줄 건수. 삭제된 행은 세지 않는다 */
export function summarizeBackup(backup: Backup): BackupSummary {
  const count = (table: string) =>
    backup.tables[table].filter((r) => r.deleted_at === null || r.deleted_at === undefined).length;
  return {
    exportedAt: backup.exportedAt,
    transactions: count('transaction'),
    accounts: count('account'),
    categories: count('category'),
    recurrings: count('recurring'),
  };
}

export function backupFileName(date: Date): string {
  return `gagyeryeok-backup-${format(date, STAMP)}.json`;
}

export function safetyBackupFileName(date: Date): string {
  return `${SAFETY_PREFIX}${format(date, STAMP)}.json`;
}

/** 자동 백업 파일 이름에서 만든 시각을 읽는다. 형식이 다르면 null */
export function safetyBackupDate(fileName: string): Date | null {
  if (!fileName.startsWith(SAFETY_PREFIX) || !fileName.endsWith('.json')) return null;
  const stamp = fileName.slice(SAFETY_PREFIX.length, -'.json'.length);
  const date = parse(stamp, STAMP, new Date(0));
  return isValid(date) ? date : null;
}
