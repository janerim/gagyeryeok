import { describe, expect, it } from 'vitest';
import {
  BackupFormatError,
  backupFileName,
  createBackup,
  parseBackup,
  safetyBackupDate,
  safetyBackupFileName,
  summarizeBackup,
} from './backup';

const tables = {
  account: [{ id: 'a1', name: '통장', deleted_at: null }],
  category: [
    { id: 'c1', name: '식비', deleted_at: null },
    { id: 'c2', name: '지운 것', deleted_at: '2026-01-01T00:00:00.000Z' },
  ],
  recurring: [],
  transaction: [
    { id: 't1', amount: 1000, deleted_at: null },
    { id: 't2', amount: 2000, deleted_at: '2026-01-01T00:00:00.000Z' },
  ],
};
const valid = createBackup(1, '2026-11-04T06:30:00.000Z', tables);
const withFields = (fields: object) => JSON.stringify({ ...valid, ...fields });

describe('parseBackup', () => {
  it('내보낸 내용을 그대로 읽는다', () => {
    expect(parseBackup(JSON.stringify(valid), 1)).toEqual(valid);
  });
  it('현재보다 오래된 스키마의 백업도 받는다', () => {
    expect(parseBackup(JSON.stringify(valid), 2).schemaVersion).toBe(1);
  });
  it('현재보다 새로운 스키마의 백업은 거부', () => {
    expect(() => parseBackup(withFields({ schemaVersion: 2 }), 1)).toThrow(/더 새로운 버전/);
  });
  it('잘린 JSON은 거부', () => {
    expect(() => parseBackup(JSON.stringify(valid).slice(0, 20), 1)).toThrow(BackupFormatError);
  });
  it('다른 앱의 파일은 거부', () => {
    expect(() => parseBackup(withFields({ app: 'chaekryeok' }), 1)).toThrow(/가계력 백업 파일이 아닙니다/);
    expect(() => parseBackup('[]', 1)).toThrow(/가계력 백업 파일이 아닙니다/);
  });
  it.each([0, 1.5, '1'])('schemaVersion이 %s이면 거부', (schemaVersion) => {
    expect(() => parseBackup(withFields({ schemaVersion }), 1)).toThrow(BackupFormatError);
  });
  it('날짜를 읽을 수 없으면 거부', () => {
    expect(() => parseBackup(withFields({ exportedAt: 'yesterday' }), 1)).toThrow(BackupFormatError);
  });
  it('필수 테이블이 빠지면 거부', () => {
    const { recurring: _, ...rest } = tables;
    expect(() => parseBackup(withFields({ tables: rest }), 1)).toThrow(/빠진 데이터/);
  });
  it('행이 객체가 아니거나 값이 중첩되면 거부', () => {
    for (const account of [['a1'], [{ id: { nested: true } }], 'a1']) {
      expect(() => parseBackup(withFields({ tables: { ...tables, account } }), 1)).toThrow(
        BackupFormatError
      );
    }
  });
});

describe('summarizeBackup', () => {
  it('삭제된 행을 빼고 센다', () => {
    expect(summarizeBackup(valid)).toEqual({
      exportedAt: valid.exportedAt,
      transactions: 1,
      accounts: 1,
      categories: 1,
      recurrings: 0,
    });
  });
});

describe('백업 파일 이름', () => {
  const date = new Date(2026, 10, 4, 15, 30, 5);
  it('내보내기 파일 이름에 시각을 넣는다', () => {
    expect(backupFileName(date)).toBe('gagyeryeok-backup-20261104-153005.json');
  });
  it('자동 백업 이름에서 시각을 되읽는다', () => {
    expect(safetyBackupDate(safetyBackupFileName(date))).toEqual(date);
  });
  it('자동 백업 이름이 아니면 null', () => {
    expect(safetyBackupDate('memo.json')).toBeNull();
    expect(safetyBackupDate('before-restore-nope.json')).toBeNull();
  });
});
