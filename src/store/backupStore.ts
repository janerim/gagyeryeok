import { create } from 'zustand';
import { Directory, File, Paths } from 'expo-file-system';
import { getDocumentAsync } from 'expo-document-picker';
import { shareAsync } from 'expo-sharing';
import { repositories } from '@/data/repositories';
import {
  backupFileName,
  parseBackup,
  safetyBackupDate,
  safetyBackupFileName,
  type Backup,
} from '@/domain/backup';
import { useAccountStore } from './accountStore';
import { useCategoryStore } from './categoryStore';
import { useRecurringStore } from './recurringStore';
import { useTransactionStore } from './transactionStore';

const SAFETY_KEEP = 3; // 복원 직전 자동 백업을 최근 몇 개까지 둘지

export type SafetyBackup = { uri: string; name: string; date: Date };

type BackupStore = {
  safetyBackups: SafetyBackup[]; // 최근 순
  load: () => void;
  /** 백업 파일을 만들어 공유 시트를 연다 */
  exportBackup: () => Promise<void>;
  /** 파일 앱에서 백업을 고른다. 취소하면 null */
  pickBackup: () => Promise<Backup | null>;
  readSafetyBackup: (uri: string) => Promise<Backup>;
  /** 지금 데이터를 자동 백업한 뒤 전체를 교체한다. 실패하면 기존 데이터는 그대로다 */
  restore: (backup: Backup) => Promise<void>;
};

const safetyDir = () => new Directory(Paths.document, 'backups');

function listSafetyBackups(): SafetyBackup[] {
  const dir = safetyDir();
  if (!dir.exists) return [];
  const items: SafetyBackup[] = [];
  for (const entry of dir.list()) {
    if (!(entry instanceof File)) continue;
    const date = safetyBackupDate(entry.name);
    if (date) items.push({ uri: entry.uri, name: entry.name, date });
  }
  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function writeJson(file: File, backup: Backup): void {
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup));
}

async function saveSafetyBackup(): Promise<void> {
  safetyDir().create({ idempotent: true, intermediates: true });
  writeJson(
    new File(safetyDir(), safetyBackupFileName(new Date())),
    await repositories.backup.dump()
  );
  for (const old of listSafetyBackups().slice(SAFETY_KEEP)) new File(old.uri).delete();
}

const readBackup = async (file: File) =>
  parseBackup(await file.text(), repositories.backup.schemaVersion());

async function reloadAll(): Promise<void> {
  await Promise.all([
    useAccountStore.getState().load(),
    useCategoryStore.getState().load(),
    useRecurringStore.getState().load(),
    useTransactionStore.getState().reload(),
  ]);
  // 백업 이후 지난 출금일의 자동이체를 채운다
  await useRecurringStore.getState().generateDue();
}

export const useBackupStore = create<BackupStore>((set) => ({
  safetyBackups: [],
  load: () => set({ safetyBackups: listSafetyBackups() }),
  exportBackup: async () => {
    // 지난번 내보내기 파일이 평문으로 남지 않도록 비우고 시작한다
    const dir = new Directory(Paths.cache, 'backup-export');
    if (dir.exists) dir.delete();
    dir.create({ intermediates: true });
    const file = new File(dir, backupFileName(new Date()));
    writeJson(file, await repositories.backup.dump());
    await shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
  },
  pickBackup: async () => {
    const result = await getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;
    const copy = new File(result.assets[0].uri);
    try {
      return await readBackup(copy);
    } finally {
      copy.delete();
    }
  },
  readSafetyBackup: (uri) => readBackup(new File(uri)),
  restore: async (backup) => {
    await useRecurringStore.getState().generateDue(); // 진행 중인 쓰기가 끝나길 기다린다
    await saveSafetyBackup();
    set({ safetyBackups: listSafetyBackups() });
    await repositories.backup.restore(backup);
    // 여기부터는 복원이 이미 끝난 상태이므로 복원 실패로 보고하지 않는다
    await reloadAll().catch(console.error);
  },
}));
