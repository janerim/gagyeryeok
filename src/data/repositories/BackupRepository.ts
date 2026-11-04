import type { Backup } from '@/domain/backup';

export interface BackupRepository {
  /** 현재 스키마 버전 */
  schemaVersion(): number;
  /** 삭제 표시된 행을 포함한 전체 데이터 */
  dump(): Promise<Backup>;
  /** 전체 데이터를 백업 내용으로 교체한다. 실패하면 기존 데이터를 그대로 둔다 */
  restore(backup: Backup): Promise<void>;
}
